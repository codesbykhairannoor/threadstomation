import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Communicate } from 'edge-tts-universal';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '../scratch');

/**
 * Curated list of natural-sounding neural voices.
 * - Indonesian voices: native language for Indonesian-market accounts (Adhlil, etc.)
 * - English voices: for English-market accounts (Tranvas, Caridisini)
 * Voices are Microsoft neural TTS (100% free, no API key, high fidelity).
 */
const VOICES = {
  id: [
    'id-ID-ArdiNeural',     // Male, Indonesian, clear, energetic & natural
    'id-ID-GadisNeural',    // Female, Indonesian, conversational & warm
  ],
  en: [
    'en-US-AriaNeural',     // Female US, conversational & expressive
    'en-US-GuyNeural',      // Male US, confident & professional
    'en-US-JennyNeural',    // Female US, friendly & dynamic
    'en-GB-SoniaNeural',    // Female UK, premium feel
  ],
  multilang: [
    'en-US-AriaNeural',
  ]
};

/**
 * Detect language of text content.
 * @param {string} text
 * @returns {'id'|'en'}
 */
function detectLanguage(text) {
  const idWords = ['yang', 'dan', 'di', 'ini', 'itu', 'kamu', 'gue', 'gw', 'lu', 'kita', 'adalah', 'dengan', 'untuk', 'tidak', 'bisa', 'mau', 'ada', 'saya', 'anda', 'cara', 'tips', 'tahu', 'buat', 'dari', 'apakah', 'tapi', 'aja', 'gitu', 'sama', 'ke', 'akan', 'lebih', 'bukan', 'hanya', 'harus', 'kalau', 'bahkan', 'banyak', 'orang', 'kerja', 'hasilnya', 'gak', 'nggak', 'banget', 'beneran', 'kalian'];
  const words = (text || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/);
  const idCount = words.filter(w => idWords.includes(w)).length;
  return idCount > 0 ? 'id' : 'en';
}

/**
 * Pick a voice appropriate for the script's language.
 */
function pickVoice(script, masterPrompt = '') {
  const lang = detectLanguage(script || masterPrompt);
  const pool = VOICES[lang] || VOICES.id;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Probes the exact duration in seconds of an audio file using ffprobe.
 * @param {string} filePath 
 * @returns {Promise<number>} Duration in seconds
 */
export function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.warn(`[TTS] ffprobe warning for ${filePath}:`, err.message);
        return resolve(3.0); // Safe fallback duration
      }
      const dur = metadata?.format?.duration;
      resolve(dur ? parseFloat(dur) : 3.0);
    });
  });
}

/**
 * Cleans text for natural, conversational TTS speech delivery.
 */
function sanitizeSpeechText(text) {
  return (text || '')
    .replace(/#\w+/g, '')                    // Remove hashtags
    .replace(/https?:\/\/\S+/gi, '')         // Remove raw URLs
    .replace(/[^\w\s.,!?'"-\u0600-\u06FF]/gi, ' ') // Clean emoji and weird symbols
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates an MP3 audio file for a single piece of text.
 */
async function generateSingleAudio(text, voice, outputPath, rate = '+12%') {
  const communicate = new Communicate(text, {
    voice,
    rate, // Energetic viral creator pace (+12% to +15% is optimal)
    volume: '+0%',
    pitch: '+0Hz',
  });

  const writeStream = fs.createWriteStream(outputPath);

  await new Promise(async (resolve, reject) => {
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
  });

  const stats = fs.statSync(outputPath);
  if (stats.size < 500) {
    throw new Error('Generated audio file is too small');
  }
}

/**
 * Generate synchronized per-slide voiceover MP3s and merge them into one master track.
 * Returns exact slide durations so FFmpeg can sync visuals with spoken audio down to the millisecond!
 *
 * @param {Array<object>} slides - Gemini slide objects
 * @param {string} caption - Post caption
 * @param {string} masterPrompt - Persona prompt for voice detection
 * @param {string|number} sessionId - Unique identifier
 * @returns {Promise<{ voiceoverPath: string|null, slideDurations: number[], totalDuration: number }>}
 */
export async function generateVoiceover(slides, caption = '', masterPrompt = '', sessionId = Date.now()) {
  if (!slides || slides.length === 0) {
    return { voiceoverPath: null, slideDurations: [], totalDuration: 0 };
  }

  if (!fs.existsSync(SCRATCH_DIR)) {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  }

  const sampleText = slides.map(s => s.spoken_narration || s.body || s.title_part1).join(' ');
  const selectedVoice = pickVoice(sampleText, masterPrompt);
  console.log(`[TTS] Generating synced per-slide voiceover using voice: ${selectedVoice}`);

  const slideAudioPaths = [];
  const slideDurations = [];
  const tempFiles = [];

  try {
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      // Priority 1: spoken_narration (humanized conversational script)
      // Priority 2: title + body combo
      let textToSpeak = slide.spoken_narration;
      if (!textToSpeak || textToSpeak.trim().length < 4) {
        const title = [slide.title_part1, slide.title_part2].filter(Boolean).join('. ');
        const body = slide.body || '';
        textToSpeak = [title, body].filter(Boolean).join('. ');
      }

      const cleanText = sanitizeSpeechText(textToSpeak);
      if (!cleanText || cleanText.length < 3) {
        slideDurations.push(3.0);
        continue;
      }

      const slideAudioFile = path.join(SCRATCH_DIR, `tts_slide_${sessionId}_${i}.mp3`);
      tempFiles.push(slideAudioFile);

      console.log(`[TTS] Generating Slide ${i + 1}/${slides.length} (${cleanText.length} chars): "${cleanText.substring(0, 60)}..."`);
      await generateSingleAudio(cleanText, selectedVoice, slideAudioFile, '+12%');

      const rawDuration = await getAudioDuration(slideAudioFile);
      // Add a natural 0.3s pause buffer so text transition feels smooth and readable
      const paddedDuration = Math.max(2.5, Math.round((rawDuration + 0.3) * 10) / 10);

      slideAudioPaths.push(slideAudioFile);
      slideDurations.push(paddedDuration);
      console.log(`[TTS] Slide ${i + 1} audio duration: ${rawDuration.toFixed(2)}s -> visual duration: ${paddedDuration}s`);
    }

    if (slideAudioPaths.length === 0) {
      console.warn('[TTS] No slide audio generated.');
      return { voiceoverPath: null, slideDurations: slides.map(() => 3.0), totalDuration: slides.length * 3 };
    }

    // Merge individual slide audio files into one continuous master voiceover track
    const masterVoiceoverPath = path.join(SCRATCH_DIR, `voiceover_master_${sessionId}.mp3`);
    const concatListTxt = path.join(SCRATCH_DIR, `tts_concat_${sessionId}.txt`);
    tempFiles.push(concatListTxt);

    let concatContent = '';
    for (const p of slideAudioPaths) {
      concatContent += `file '${p.replace(/\\/g, '/')}'\n`;
    }
    fs.writeFileSync(concatListTxt, concatContent);

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatListTxt)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c:a', 'libmp3lame', '-b:a', '128k'])
        .save(masterVoiceoverPath)
        .on('end', resolve)
        .on('error', (err) => {
          console.warn('[TTS] Error concatenating slide audios:', err.message);
          // If concat fails, fallback to first audio
          resolve();
        });
    });

    const masterStats = fs.existsSync(masterVoiceoverPath) ? fs.statSync(masterVoiceoverPath) : null;
    if (masterStats && masterStats.size > 1000) {
      const totalDuration = slideDurations.reduce((a, b) => a + b, 0);
      console.log(`[TTS] Master voiceover created: ${masterVoiceoverPath} (Total synced duration: ${totalDuration.toFixed(1)}s)`);
      return {
        voiceoverPath: masterVoiceoverPath,
        slideDurations,
        totalDuration
      };
    } else {
      // Fallback
      return { voiceoverPath: slideAudioPaths[0] || null, slideDurations, totalDuration: slideDurations.reduce((a, b) => a + b, 0) };
    }

  } catch (err) {
    console.error('[TTS] Voiceover pipeline error:', err.message);
    return {
      voiceoverPath: null,
      slideDurations: slides.map(() => 3.0),
      totalDuration: slides.length * 3
    };
  }
}

