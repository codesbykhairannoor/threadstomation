import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Communicate } from 'edge-tts-universal';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '../scratch');

/**
 * Curated list of natural-sounding neural voices.
 * - Indonesian voices: native language for Indonesian-market accounts
 * - English voices: for English-market accounts (Adhlil, Tranvas, Caridisini)
 * Voices are Microsoft neural TTS (free, no API key, no watermark).
 */
const VOICES = {
  id: [
    'id-ID-ArdiNeural',     // Male, Indonesian, warm & clear
    'id-ID-GadisNeural',    // Female, Indonesian, natural
  ],
  en: [
    'en-US-AriaNeural',     // Female US, conversational & expressive
    'en-US-GuyNeural',      // Male US, professional
    'en-US-JennyNeural',    // Female US, friendly customer service style
    'en-GB-SoniaNeural',    // Female UK, premium feel
  ],
  multilang: [
    'en-US-AriaNeural',     // Best general fallback
  ]
};

/**
 * Detect language of text content.
 * Simple heuristic: if >30% of words match common Indonesian words, classify as Indonesian.
 * @param {string} text
 * @returns {'id'|'en'}
 */
function detectLanguage(text) {
  const idWords = ['yang', 'dan', 'di', 'ini', 'itu', 'kamu', 'gue', 'gw', 'lu', 'kita', 'adalah', 'dengan', 'untuk', 'tidak', 'bisa', 'mau', 'ada', 'saya', 'anda', 'cara', 'tips', 'tahu', 'buat', 'dari'];
  const words = text.toLowerCase().split(/\s+/);
  const idCount = words.filter(w => idWords.includes(w)).length;
  return (idCount / words.length) > 0.15 ? 'id' : 'en';
}

/**
 * Pick a voice appropriate for the account's language/persona.
 * @param {string} text - The TTS input text
 * @param {string} masterPrompt - Account persona/style
 * @returns {string} Voice name
 */
function pickVoice(text, masterPrompt = '') {
  const lang = detectLanguage(masterPrompt || text);
  const pool = VOICES[lang] || VOICES.en;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Convert slides content to a single voiced script.
 * - Reads title + body from each slide
 * - Adds natural pause markers between slides via SSML break tags
 * - Strips technical characters and hashtags
 *
 * @param {Array<object>} slides - Gemini slide objects (title_part1, title_part2, body)
 * @param {string} caption - Post caption (used as outro/hook)
 * @returns {string} Clean voiceover script
 */
export function buildVoiceoverScript(slides, caption = '') {
  const parts = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const title = [slide.title_part1, slide.title_part2].filter(Boolean).join(' ');
    const body = slide.body || '';

    if (i === 0) {
      // First slide: hook delivery — slightly punchy opening
      if (title) parts.push(title + '.');
      if (body) parts.push(body);
    } else if (i === slides.length - 1) {
      // Last slide: call to action style
      if (title) parts.push(title + '!');
      if (body) parts.push(body);
    } else {
      if (title) parts.push(title + '.');
      if (body) parts.push(body);
    }
  }

  // Add a short natural caption excerpt as outro (max 120 chars)
  const captionExcerpt = caption
    .replace(/#\w+/g, '')           // Remove hashtags
    .replace(/[^\w\s.,!?'"]/g, ' ') // Strip emojis/special chars
    .trim()
    .substring(0, 120);

  if (captionExcerpt.length > 20) {
    parts.push(captionExcerpt);
  }

  return parts
    .map(p => p.trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Generate a voiceover MP3 from slide content using Microsoft Edge TTS (free, no API key).
 *
 * Features:
 * - Auto-detects language (Indonesian / English) from masterPrompt content
 * - Randomly picks a natural-sounding neural voice per language
 * - Rate is slightly increased (+5%) for dynamic reel pacing
 * - Falls back gracefully to null (no voiceover) if TTS fails
 *
 * @param {Array<object>} slides - Gemini slide objects
 * @param {string} caption - Post caption
 * @param {string} masterPrompt - Account persona/style prompt
 * @param {string} sessionId - Unique ID for temp file naming
 * @returns {Promise<string|null>} Local path to generated MP3, or null on failure
 */
export async function generateVoiceover(slides, caption, masterPrompt = '', sessionId) {
  if (!slides || slides.length === 0) return null;

  if (!fs.existsSync(SCRATCH_DIR)) {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  }

  const outputPath = path.join(SCRATCH_DIR, `voiceover_${sessionId}.mp3`);

  try {
    const script = buildVoiceoverScript(slides, caption);
    if (!script || script.length < 10) {
      console.warn('[TTS] Script too short, skipping voiceover.');
      return null;
    }

    const voice = pickVoice(script, masterPrompt);
    console.log(`[TTS] Generating voiceover with voice: ${voice}`);
    console.log(`[TTS] Script (${script.length} chars): "${script.substring(0, 80)}..."`);

    const communicate = new Communicate(script, {
      voice,
      rate: '+5%',    // Slightly faster for Reel pacing
      volume: '+0%',
      pitch: '+0Hz',
    });

    // Stream audio data to file
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
    if (stats.size < 1000) {
      console.warn('[TTS] Generated audio too small, likely empty. Discarding.');
      fs.unlinkSync(outputPath);
      return null;
    }

    console.log(`[TTS] Voiceover generated: ${outputPath} (${(stats.size / 1024).toFixed(0)} KB)`);
    return outputPath;

  } catch (err) {
    console.warn('[TTS] Voiceover generation failed (will skip):', err.message);
    // Clean up partial file if exists
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}
    return null;
  }
}
