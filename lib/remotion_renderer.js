import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { Communicate } from 'edge-tts-universal';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import supabase from './supabase_storage.js';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '../scratch');

// Ensure scratch dir exists
if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata?.format?.duration || 4.0);
    });
  });
}

async function generateSceneTTS(text, outputPath, voice = 'id-ID-ArdiNeural') {
  const communicate = new Communicate(text, {
    voice,
    rate: '-2%', // Calm, thoughtful, deep mentor tempo (Mindset Therapy style)
    volume: '+0%',
    pitch: '-2Hz', // Slightly deeper resonance for philosophical tone
  });

  const writeStream = fs.createWriteStream(outputPath);
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const stream = communicate.stream();
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        for await (const chunk of stream) {
          if (chunk.type === 'audio' && chunk.data) {
            writeStream.write(chunk.data);
          }
        }
        writeStream.end();
      } catch (err) {
        reject(err);
      }
    })();
  });
}

/**
 * Render dynamic Mindset / Visual Thinking Motion Reel
 * @param {Array} slides - List of slide objects from Gemini
 * @param {string} masterPrompt - Account persona/master prompt
 * @param {string} accountName - Account handle (e.g., @adhlil.co)
 * @param {string} caption - Post caption
 * @returns {Promise<string>} Public Supabase MP4 URL
 */
export async function renderDynamicMindsetReel(slides, masterPrompt = '', accountName = '@adhlil.co', caption = '') {
  const sessionId = Date.now();
  const rawVideoPath = path.join(SCRATCH_DIR, `mindset_raw_${sessionId}.mp4`);
  const finalVideoPath = path.join(SCRATCH_DIR, `mindset_final_${sessionId}.mp4`);
  const masterVoicePath = path.join(SCRATCH_DIR, `mindset_master_vo_${sessionId}.mp3`);
  const tempFiles = [rawVideoPath, finalVideoPath, masterVoicePath];

  console.log(`[Remotion-Renderer] 🎬 Starting Code-to-Video generation for ${accountName}...`);

  try {
    const fps = 30;
    const sceneAudios = [];
    const sceneDurationsInFrames = [];

    // Select Voice based on language/account
    let voice = 'id-ID-ArdiNeural';
    if (accountName.toLowerCase().includes('tranvas') || accountName.toLowerCase().includes('oneformind')) {
      voice = 'en-US-AndrewMultilingualNeural';
    }

    // Step 1: Generate Voiceover per slide & measure exact durations
    console.log(`[Remotion-Renderer] [1/5] Generating voiceovers for ${slides.length} slides using voice: ${voice}...`);
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const sceneAudioPath = path.join(SCRATCH_DIR, `mindset_vo_${sessionId}_${i + 1}.mp3`);
      tempFiles.push(sceneAudioPath);

      // Extract spoken narration or construct clean speech
      let speechText = slide.spoken_narration;
      if (!speechText) {
        const p1 = slide.title_part1 || '';
        const p2 = slide.title_part2 || '';
        const body = slide.body || '';
        speechText = `${p1}. ${p2}. ${body}`.replace(/\s+/g, ' ').trim();
      }

      // Add CTA closing note to the last slide if missing
      if (i === slides.length - 1 && !speechText.toLowerCase().includes('follow')) {
        speechText += ` Simpan video ini dan follow ${accountName} untuk pengingat harianmu.`;
      }

      console.log(`   Scene ${i + 1}/${slides.length}: "${speechText.substring(0, 60)}..."`);
      await generateSceneTTS(speechText, sceneAudioPath, voice);

      const durationSec = await getAudioDuration(sceneAudioPath);
      sceneAudios.push(sceneAudioPath);

      // Allocate frames with generous breathing room
      const paddingSec = i === slides.length - 1 ? 1.8 : 0.6;
      const sceneFrames = Math.round((durationSec + paddingSec) * fps);
      sceneDurationsInFrames.push(sceneFrames);
    }

    const totalFrames = sceneDurationsInFrames.reduce((a, b) => a + b, 0);
    const totalDurationSec = totalFrames / fps;
    console.log(`[Remotion-Renderer] ⏱️ Total estimated video duration: ${totalDurationSec.toFixed(2)}s (${totalFrames} frames)`);

    // Step 2: Concatenate scene audio files into single master audio track
    console.log(`[Remotion-Renderer] [2/5] Concatenating scene audio tracks...`);
    const concatTxtPath = path.join(SCRATCH_DIR, `mindset_concat_${sessionId}.txt`);
    tempFiles.push(concatTxtPath);

    let concatTxt = '';
    for (const aud of sceneAudios) {
      concatTxt += `file '${aud.replace(/\\/g, '/')}'\n`;
    }
    fs.writeFileSync(concatTxtPath, concatTxt);

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatTxtPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c:a', 'libmp3lame', '-b:a', '192k'])
        .save(masterVoicePath)
        .on('end', resolve)
        .on('error', reject);
    });

    // Step 3: Bundle Remotion Root Composition
    console.log(`[Remotion-Renderer] [3/5] Bundling DynamicMindsetVideo composition...`);
    const entryPoint = path.join(__dirname, '../remotion/index.js');
    const bundleLocation = await bundle({
      entryPoint,
      onProgress: (p) => {
        if (p % 50 === 0) console.log(`   Bundling: ${p}%`);
      },
    });

    // Step 4: Render Composition Video
    console.log(`[Remotion-Renderer] [4/5] Rendering 1080x1920 (30 FPS) Motion Video...`);
    const inputProps = {
      slides,
      badgeText: accountName.startsWith('@') ? accountName : `@${accountName}`,
      sceneDurationsInFrames,
    };

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'DynamicMindsetVideo',
      inputProps,
    });

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: rawVideoPath,
      inputProps,
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        if (pct % 25 === 0) {
          console.log(`   Render progress: ${pct}%`);
        }
      },
    });

    // Step 5: Mux Video + Audio
    console.log(`[Remotion-Renderer] [5/5] Muxing video with audio and uploading to Supabase...`);
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(rawVideoPath)
        .input(masterVoicePath)
        .outputOptions([
          '-c:v copy',
          '-c:a aac',
          '-b:a 192k',
          '-t', String(totalDurationSec),
        ])
        .save(finalVideoPath)
        .on('end', resolve)
        .on('error', reject);
    });

    // Upload to Supabase Storage
    const videoBuffer = fs.readFileSync(finalVideoPath);
    const storagePath = `instagram/adhlil-reel-${sessionId}.mp4`;

    const { error } = await supabase.storage
      .from('media')
      .upload(storagePath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    const { data: pubData } = supabase.storage.from('media').getPublicUrl(storagePath);
    const publicVideoUrl = pubData.publicUrl;

    console.log(`[Remotion-Renderer] ✅ Video uploaded successfully: ${publicVideoUrl}`);

    // Cleanup temp files asynchronously
    setTimeout(() => {
      for (const f of tempFiles) {
        try {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch (_) {}
      }
    }, 5000);

    return publicVideoUrl;
  } catch (err) {
    console.error('[Remotion-Renderer] ❌ Render error:', err);
    // Cleanup on error
    for (const f of tempFiles) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch (_) {}
    }
    throw err;
  }
}
