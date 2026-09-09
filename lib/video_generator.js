import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import axios from 'axios';
import supabase from './supabase_storage.js';
import { fetchBRollClip, extractPexelsQuery } from './pexels_broll.js';
import { generateVoiceover } from './tts_voiceover.js';

// Setup FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '../scratch');

/**
 * Uploads an MP4 video buffer to Supabase Storage.
 * @param {Buffer} buffer - The video buffer.
 * @returns {Promise<string>} The public URL of the uploaded video.
 */
async function uploadVideoToSupabase(buffer) {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    const fileName = `instagram/reels-${Date.now()}.mp4`;
    console.log(`[VideoGenerator] Uploading video to Supabase Storage: ${fileName}`);

    const { error } = await supabase.storage
      .from('media')
      .upload(fileName, buffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (error) {
      throw new Error(`Supabase video upload failed: ${error.message}`);
    }

    const { data: pubData } = supabase.storage.from('media').getPublicUrl(fileName);
    console.log(`[VideoGenerator] Video uploaded to Supabase: ${pubData.publicUrl}`);
    return pubData.publicUrl;
  } catch (err) {
    console.error('[VideoGenerator] Upload error:', err.message);
    throw new Error(`Video upload failed: ${err.message}`);
  }
}

/**
 * Fetch lofi background music from a reliable CDN.
 * @param {string} sessionId
 * @returns {Promise<string|null>} Local path to mp3 file or null
 */
async function fetchBGM(sessionId) {
  const bgmPath = path.join(SCRATCH_DIR, `bgm_${sessionId}.mp3`);
  const musicUrls = [
    "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3"
  ];
  try {
    console.log('[VideoGenerator] Fetching BGM...');
    const selectedUrl = musicUrls[Math.floor(Math.random() * musicUrls.length)];
    const audioRes = await axios.get(selectedUrl, { responseType: 'arraybuffer', timeout: 12000 });
    fs.writeFileSync(bgmPath, Buffer.from(audioRes.data));
    console.log('[VideoGenerator] BGM downloaded.');
    return bgmPath;
  } catch (e) {
    console.warn('[VideoGenerator] BGM fetch failed (silent video):', e.message);
    return null;
  }
}

/**
 * [UPGRADED] Creates an MP4 Reel by:
 * 1. Searching Pexels for a relevant B-Roll vertical clip per slide (if slides provided)
 * 2. Compositing each carousel image OVER the B-Roll with FFmpeg (glassmorphism overlay)
 * 3. Looping short clips to match total desired duration
 * 4. Mixing lofi BGM
 * Falls back gracefully to the old static slideshow if Pexels is unavailable.
 *
 * @param {Array<Buffer>} imageBuffers - Array of slide image buffers (PNG/JPG).
 * @param {number} durationPerSlide - Duration each slide should be shown in seconds.
 * @param {Array<object>} [slides] - Optional Gemini slide objects for Pexels keyword extraction and TTS voiceover.
 * @param {string} [masterPrompt] - Account persona for fallback keyword extraction and voice detection.
 * @param {string} [caption] - Post caption (used as TTS outro).
 * @returns {Promise<string>} The public URL of the uploaded MP4 video.
 */
export async function createVideoFromImages(imageBuffers, durationPerSlide = 3, slides = [], masterPrompt = '', caption = '') {
  return new Promise(async (resolve, reject) => {
    console.log(`[VideoGenerator] Starting UPGRADED Synced B-Roll Reels engine for ${imageBuffers.length} slides...`);

    if (!fs.existsSync(SCRATCH_DIR)) {
      fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    }

    const sessionId = Date.now();
    const tempFiles = [];
    const outputVideoPath = path.join(SCRATCH_DIR, `output_${sessionId}.mp4`);

    // ── STEP 1: Write slide images to temp files ─────────────────────────────
    const slidePaths = [];
    for (let i = 0; i < imageBuffers.length; i++) {
      const slidePath = path.join(SCRATCH_DIR, `slide_${sessionId}_${i}.png`);
      fs.writeFileSync(slidePath, imageBuffers[i]);
      slidePaths.push(slidePath);
      tempFiles.push(slidePath);
    }

    // ── STEP 2: Fetch Pexels B-Roll ────────────────────────────────────────
    let brollPath = null;
    try {
      const targetSlide = slides[0] || {};
      const pexelsQuery = extractPexelsQuery(targetSlide, masterPrompt);
      brollPath = await fetchBRollClip(pexelsQuery, sessionId);
      if (brollPath) tempFiles.push(brollPath);
    } catch (e) {
      console.warn('[VideoGenerator] Pexels B-Roll step failed, continuing without:', e.message);
      brollPath = null;
    }

    // ── STEP 3: Generate Synced TTS Voiceover & Measure Slide Durations ─────
    let voiceoverPath = null;
    let slideDurations = [];
    let totalDuration = imageBuffers.length * durationPerSlide;

    try {
      const ttsResult = await generateVoiceover(slides, caption, masterPrompt, sessionId);
      if (ttsResult && ttsResult.voiceoverPath) {
        voiceoverPath = ttsResult.voiceoverPath;
        slideDurations = ttsResult.slideDurations;
        totalDuration = ttsResult.totalDuration || (imageBuffers.length * durationPerSlide);
        tempFiles.push(voiceoverPath);
        console.log(`[VideoGenerator] Synced TTS voiceover ready (${totalDuration.toFixed(1)}s):`, voiceoverPath);
      }
    } catch (e) {
      console.warn('[VideoGenerator] TTS step failed, continuing without voiceover:', e.message);
    }

    // ── STEP 4: Fetch BGM (lofi background, mixed at low volume) ───────────
    let bgmPath = null;
    try {
      bgmPath = await fetchBGM(sessionId);
      if (bgmPath) tempFiles.push(bgmPath);
    } catch (e) { /* silent */ }

    // ── STEP 5: Build Concat Demuxer with Synced Durations ──────────────────
    console.log('[VideoGenerator] Building FFmpeg concat list with exact slide durations...');
    const concatFilePath = path.join(SCRATCH_DIR, `concat_${sessionId}.txt`);
    tempFiles.push(concatFilePath);

    let concatContent = '';
    for (let i = 0; i < slidePaths.length; i++) {
      const ffmpegPath = slidePaths[i].replace(/\\/g, '/');
      const dur = (slideDurations && slideDurations[i]) ? slideDurations[i] : durationPerSlide;
      concatContent += `file '${ffmpegPath}'\nduration ${dur}\n`;
    }
    // Repeat last frame to flush duration in FFmpeg concat demuxer
    if (slidePaths.length > 0) {
      concatContent += `file '${slidePaths[slidePaths.length - 1].replace(/\\/g, '/')}'\n`;
    }
    fs.writeFileSync(concatFilePath, concatContent);

    // ── STEP 6: Execute FFmpeg ─────────────────────────────────────────────
    if (brollPath) {
      console.log('[VideoGenerator] Mode: B-Roll Composite with Synced 9:16 Text Overlays');

      const filterComplex = [
        // B-Roll background: scale to 1080x1920, cropped to fit 9:16 aspect ratio
        `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setpts=PTS-STARTPTS[bg]`,
        // Overlay slide images: format as RGBA
        `[1:v]format=rgba[fg]`,
        // Composite overlay centered on B-Roll video background
        `[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1[out]`,
      ].join(';');

      let inputIdx = 2;
      let voiceoverInputIdx = null;
      let bgmInputIdx = null;

      let cmd = ffmpeg()
        .input(brollPath)
        .inputOptions(['-stream_loop', '-1']) // Loop B-Roll video seamlessly
        .input(concatFilePath)
        .inputOptions(['-f', 'concat', '-safe', '0']);

      if (voiceoverPath) {
        cmd = cmd.input(voiceoverPath);
        voiceoverInputIdx = inputIdx++;
      }
      if (bgmPath) {
        cmd = cmd.input(bgmPath);
        bgmInputIdx = inputIdx++;
      }

      let audioFilter = null;
      let audioMap = null;

      if (voiceoverInputIdx !== null && bgmInputIdx !== null) {
        // Mix voiceover at 100% volume, background lofi music at 18% volume
        audioFilter = `[${voiceoverInputIdx}:a]volume=1.0[vo];[${bgmInputIdx}:a]volume=0.18[bgm];[vo][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
        audioMap = '[aout]';
      } else if (voiceoverInputIdx !== null) {
        audioMap = `${voiceoverInputIdx}:a`;
      } else if (bgmInputIdx !== null) {
        audioMap = `${bgmInputIdx}:a`;
      }

      const finalFilterComplex = audioFilter
        ? filterComplex + ';' + audioFilter
        : filterComplex;

      const outputOptions = [
        '-filter_complex', finalFilterComplex,
        '-map [out]',
        ...(audioMap ? ['-map', audioMap] : []),
        '-c:v libx264',
        '-preset fast',
        '-crf 22',
        '-pix_fmt yuv420p',
        '-r 30',
        '-t', String(totalDuration),
        ...(audioMap ? ['-c:a aac', '-b:a 128k', '-shortest'] : []),
      ];

      cmd
        .outputOptions(outputOptions)
        .save(outputVideoPath)
        .on('end', async () => {
          console.log(`[VideoGenerator] FFmpeg B-Roll composite finished successfully (${totalDuration.toFixed(1)}s).`);
          await finalizeAndResolve(outputVideoPath, tempFiles, resolve, reject);
        })
        .on('error', async (err) => {
          console.error('[VideoGenerator] FFmpeg B-Roll error, falling back to static slideshow:', err.message);
          await createStaticSlideshow(concatFilePath, voiceoverPath || bgmPath, totalDuration, outputVideoPath, tempFiles, resolve, reject);
        });

    } else {
      console.log('[VideoGenerator] Mode: Static Slideshow Fallback');
      await createStaticSlideshow(concatFilePath, voiceoverPath || bgmPath, totalDuration, outputVideoPath, tempFiles, resolve, reject);
    }
  });
}

/**
 * Fallback static slideshow using pre-built concat file and total duration.
 */
async function createStaticSlideshow(concatFilePath, audioPath, totalDuration, outputVideoPath, tempFiles, resolve, reject) {
  let command = ffmpeg()
    .input(concatFilePath)
    .inputOptions(['-f concat', '-safe 0']);

  if (audioPath) {
    command = command.input(audioPath);
  }

  command
    .outputOptions([
      '-c:v libx264',
      '-pix_fmt yuv420p',
      '-r 30',
      '-t', String(totalDuration),
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black',
      ...(audioPath ? ['-c:a aac', '-b:a 128k', '-shortest'] : [])
    ])
    .save(outputVideoPath)
    .on('end', async () => {
      console.log('[VideoGenerator] Static slideshow FFmpeg finished.');
      await finalizeAndResolve(outputVideoPath, tempFiles, resolve, reject);
    })
    .on('error', (err) => {
      console.error('[VideoGenerator] Static slideshow FFmpeg error:', err.message);
      reject(err);
    });
}

/**
 * Upload finished video to Supabase, clean up temp files, resolve promise.
 */
async function finalizeAndResolve(outputVideoPath, tempFiles, resolve, reject) {
  try {
    const videoBuffer = fs.readFileSync(outputVideoPath);
    let videoUrl = null;

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      videoUrl = await uploadVideoToSupabase(videoBuffer);
    } else {
      console.warn('[VideoGenerator] No Supabase URL. Saving locally.');
      videoUrl = `file://${outputVideoPath}`;
    }

    // Cleanup all temp files
    for (const f of tempFiles) {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
    }
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try { if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath); } catch (_) {}
    }

    resolve(videoUrl);
  } catch (err) {
    reject(err);
  }
}
