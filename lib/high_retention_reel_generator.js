import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import supabase from './supabase_storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '../scratch');
const OUTPUT_VIDEOS_DIR = path.join(__dirname, '../output_videos');

if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

/**
 * Upload an MP4 video buffer to Supabase Storage.
 * @param {Buffer} buffer 
 * @param {string} accountName 
 * @returns {Promise<string>} Public Supabase MP4 URL
 */
async function uploadToSupabase(buffer, accountName) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  const cleanHandle = (accountName || 'reel').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const fileName = `instagram/${cleanHandle}-${Date.now()}.mp4`;
  console.log(`[HighRetentionReel] Uploading video to Supabase Storage: ${fileName}`);

  const { error } = await supabase.storage
    .from('media')
    .upload(fileName, buffer, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase video upload failed: ${error.message}`);
  }

  const { data: pubData } = supabase.storage.from('media').getPublicUrl(fileName);
  console.log(`[HighRetentionReel] Video uploaded successfully: ${pubData.publicUrl}`);
  return pubData.publicUrl;
}

/**
 * Generates a high-retention vertical Reel (Pexels B-Roll + Kinetic Word Pop-in Captions + Procedural SFX)
 * using the verified purffle-shorts engine.
 *
 * @param {object} params
 * @param {number|string} params.accountId
 * @param {string} params.accountName
 * @param {Array<object>} params.slides - Slide objects from Gemini content generator
 * @param {string} params.masterPrompt
 * @param {string} params.caption
 * @returns {Promise<string>} Public Supabase MP4 URL
 */
export async function generateHighRetentionReel({ accountId, accountName, slides = [], masterPrompt = '', caption = '' }) {
  const normName = (accountName || '').toLowerCase();
  const idNum = parseInt(accountId, 10);
  const sessionId = Date.now();

  console.log(`[HighRetentionReel] 🎬 Initializing High-Retention Reel Generator for ${accountName} (ID: ${accountId})...`);

  // 1. Detect Persona & Configure Language / Voice / Fallback Defaults
  const isAdhlil = normName.includes('adhlil') || idNum === 1;
  const isTranvas = normName.includes('tranvas') || idNum === 2;
  const isSharesa = normName.includes('sharesa') || idNum === 3;

  let lang = 'id';
  let ttsEngine = 'gemini';
  let voice = 'Charon';
  let hookTitle = 'SIMAK BAIK-BAIK';
  let ttsRate = '+0%';

  if (isAdhlil) {
    // NASEHAT ISLAMI & MUHASABAH DIRI (Warm, deep, calm Islamic mentor via Google Gemini Charon)
    lang = 'id';
    ttsEngine = 'gemini';
    voice = 'Charon';
    ttsRate = '+0%';
    const adhlilHooks = [
      'RENUNGAN HATI & IMAN',
      'SIMAK BAIK-BAIK',
      'UNTUK HATIMU YANG LELAH',
      'PENGINGAT DIRI HARI INI',
      'MUHASABAH & TAWAKKAL',
      'HIKMAH & KETENANGAN'
    ];
    hookTitle = adhlilHooks[Math.floor(Math.random() * adhlilHooks.length)];
  } else if (isSharesa) {
    // 4 WEB TOOLS + JASA WEB MODERN (Crisp, confident, engaging tech founder via Google Gemini Puck)
    lang = 'id';
    ttsEngine = 'gemini';
    voice = 'Puck';
    ttsRate = '+0%';
    const sharesaHooks = [
      '4 WEB TOOLS GRATIS & JASA WEB',
      'SOLUSI WEB & DIGITAL TOOLS',
      'RAHASIA WEBSITE MODERN',
      'TOOLS WAJIB TAHUN 2026',
      'UPGRADE BISNIS DIGITALMU'
    ];
    hookTitle = sharesaHooks[Math.floor(Math.random() * sharesaHooks.length)];
  } else if (isTranvas) {
    // THE VISUAL WORKSPACE & LIFE OS (100% Native English voice via Edge-TTS Andrew - User Approved!)
    lang = 'en';
    ttsEngine = 'edge';
    voice = 'en-US-AndrewMultilingualNeural';
    ttsRate = '+0%';
    const tranvasHooks = [
      'STOP APP SPRAWL & CHAOS',
      'UNIFIED LIFE OPERATING SYSTEM',
      'THE 1% COMPOUNDING RULE',
      'BUILD YOUR SECOND BRAIN',
      'RECLAIM YOUR DEEP FOCUS'
    ];
    hookTitle = tranvasHooks[Math.floor(Math.random() * tranvasHooks.length)];
  }

  // 2. Format Structured Script JSON
  const scriptScenes = [];
  const sceneList = (slides && slides.length > 0) ? slides : [
    { title_part1: 'Kunci Ketenangan Hidup', body: caption.substring(0, 120), spoken_narration: caption.substring(0, 120) }
  ];

  // Dynamic large pools of 25+ curated cinematic queries to ensure maximum variety
  const adhlilBrollPool = [
    'calm ocean sunrise peaceful',
    'golden sunset rays light clouds',
    'flying birds peaceful morning mist',
    'mosque architecture serene night',
    'gentle rain window green leaves',
    'starry desert sky milky way night time',
    'flowing mountain river forest peaceful',
    'solitary lantern warm light vintage table',
    'person walking in misty morning pine trees',
    'majestic mountain peak sunlight haze',
    'olive trees grove gentle wind sunlight',
    'calm lake water reflection morning silence',
    'steam from warm hot tea cup rain outside',
    'dramatic golden hour clouds horizon',
    'autumn path leaves walking serene',
    'emerald green moss waterfall slow motion',
    'open old book calligraphy reading sunlight',
    'gentle sea waves sandy beach footsteps',
    'silhouette person watching sunrise horizon',
    'candle flame glowing dark room peaceful',
    'misty valley sunrise cinematic nature',
    'rippling water pond zen garden stones',
    'peaceful forest canopy light rays filtering'
  ];

  const sharesaBrollPool = [
    'developer coding mechanical keyboard neon',
    'futuristic data network digital globe',
    'modern luxury website design laptop mockup',
    'server room glowing data center blue lights',
    'smartphone screen digital tech aesthetic',
    'creative digital agency modern glass office',
    'ultra fast cyber web connection particles',
    'designer hand sketching wireframe digital tablet',
    'clean minimal web studio dark mode dual monitor',
    'ecommerce analytics growth dashboard chart glowing',
    'cloud computing servers abstract network nodes',
    'modern software engineer multi monitor setup dark',
    'sleek macbook pro floating modern tech mockup',
    'high speed typing programmer neon room',
    'digital transformation matrix data stream vertical',
    'mobile responsive website testing multiple devices',
    'futuristic user interface holographic data'
  ];

  const tranvasBrollPool = [
    'tired person at computer stressed desk',
    'browser tabs chaotic multiple windows',
    'brain neurons neural focus energy',
    'clean minimalist modern workspace calm',
    'zen sand garden stone balance structure',
    'hourglass sand falling time management ticking',
    'minimalist analog watch ticking seconds slow',
    'person journaling fountain pen early morning coffee',
    'runner sunrise morning discipline endurance',
    'domino effect chain reaction compounding momentum',
    'bookshelf organized library knowledge architecture',
    'chess player thinking deep strategic focus',
    'focused person writing notes noise cancelling headphones',
    'geometric architecture clean lines minimalist order',
    'flow state creative person sketching ideas calm room',
    'morning sunlight streaming clean desk green plant'
  ];

  // Random offset per video run so the sequence of B-roll clips is never identical
  const runRandomOffset = Math.floor(Math.random() * 50);

  for (let i = 0; i < sceneList.length; i++) {
    const s = sceneList[i];
    const narration = s.spoken_narration || s.body || `${s.title_part1 || ''}. ${s.title_part2 || ''}`.trim();
    if (!narration || narration.length < 5) continue;

    const lowerNarr = narration.toLowerCase();
    let searchQuery = 'peaceful calm nature morning sunrise';
    let emoji = '✨';

    if (isAdhlil) {
      // Semantic keyword matching for hyper-relevant b-roll
      if (lowerNarr.includes('hujan') || lowerNarr.includes('air mata') || lowerNarr.includes('rintik')) {
        searchQuery = 'gentle rain window green leaves';
      } else if (lowerNarr.includes('malam') || lowerNarr.includes('bintang') || lowerNarr.includes('gelap') || lowerNarr.includes('tidur')) {
        searchQuery = 'starry desert sky milky way night time';
      } else if (lowerNarr.includes('sholat') || lowerNarr.includes('masjid') || lowerNarr.includes('sujud') || lowerNarr.includes('adzan')) {
        searchQuery = 'mosque architecture serene night';
      } else if (lowerNarr.includes('subuh') || lowerNarr.includes('fajar') || lowerNarr.includes('pagi') || lowerNarr.includes('terbit')) {
        searchQuery = 'calm ocean sunrise peaceful';
      } else if (lowerNarr.includes('lelah') || lowerNarr.includes('capek') || lowerNarr.includes('beban') || lowerNarr.includes('berat')) {
        searchQuery = 'silhouette person watching sunrise horizon';
      } else {
        searchQuery = adhlilBrollPool[(i + runRandomOffset) % adhlilBrollPool.length];
      }
      const ePool = ['🌅', '✨', '🕊️', '🤲', '🤍', '🌙', '🌿'];
      emoji = ePool[(i + runRandomOffset) % ePool.length];
    } else if (isSharesa) {
      if (lowerNarr.includes('convert') || lowerNarr.includes('pdf') || lowerNarr.includes('file') || lowerNarr.includes('compress')) {
        searchQuery = 'ultra fast cyber web connection particles';
      } else if (lowerNarr.includes('media') || lowerNarr.includes('video') || lowerNarr.includes('download') || lowerNarr.includes('instagram')) {
        searchQuery = 'smartphone screen digital tech aesthetic';
      } else if (lowerNarr.includes('jasa') || lowerNarr.includes('website') || lowerNarr.includes('closing') || lowerNarr.includes('landing page')) {
        searchQuery = 'modern luxury website design laptop mockup';
      } else if (lowerNarr.includes('developer') || lowerNarr.includes('coding') || lowerNarr.includes('next.js')) {
        searchQuery = 'developer coding mechanical keyboard neon';
      } else {
        searchQuery = sharesaBrollPool[(i + runRandomOffset) % sharesaBrollPool.length];
      }
      const ePool = ['💻', '⚡', '🚀', '🌐', '📱', '🔥', '🛠️'];
      emoji = ePool[(i + runRandomOffset) % ePool.length];
    } else if (isTranvas) {
      if (lowerNarr.includes('stres') || lowerNarr.includes('overwhelm') || lowerNarr.includes('chaos') || lowerNarr.includes('lelah') || lowerNarr.includes('tired')) {
        searchQuery = 'tired person at computer stressed desk';
      } else if (lowerNarr.includes('tab') || lowerNarr.includes('app') || lowerNarr.includes('tool') || lowerNarr.includes('sprawl')) {
        searchQuery = 'browser tabs chaotic multiple windows';
      } else if (lowerNarr.includes('fokus') || lowerNarr.includes('focus') || lowerNarr.includes('deep work') || lowerNarr.includes('flow')) {
        searchQuery = 'clean minimalist modern workspace calm';
      } else if (lowerNarr.includes('habit') || lowerNarr.includes('compound') || lowerNarr.includes('atomic') || lowerNarr.includes('momentum')) {
        searchQuery = 'domino effect chain reaction compounding momentum';
      } else {
        searchQuery = tranvasBrollPool[(i + runRandomOffset) % tranvasBrollPool.length];
      }
      const ePool = ['😫', '📑', '🧠', '🎯', '✨', '⚡', '💎'];
      emoji = ePool[(i + runRandomOffset) % ePool.length];
    }

    // Extract 1-2 words for kinetic emphasis highlight
    const words = narration.split(/\s+/).filter(w => w.length >= 4 && !/^(yang|atau|pada|oleh|dengan|that|this|with|from|adalah|untuk|kamu|kita|bisa)$/i.test(w));
    const emphasis = words.slice(0, 2);

    scriptScenes.push({
      narration,
      search_query: searchQuery,
      image_prompt: searchQuery,
      speaker: 'A',
      emphasis,
      emoji
    });
  }

  // Derive title from slide 0 if possible
  const dynamicTitle = (sceneList[0]?.title_part1 
    ? `${sceneList[0].title_part1} ${sceneList[0].title_part2 || ''}`.trim()
    : 'Instagram Reel').substring(0, 50);

  const scriptObj = {
    topic: `${accountName}: ${caption.substring(0, 60)}`,
    title: dynamicTitle,
    hook_text: hookTitle,
    scenes: scriptScenes
  };

  const scriptPath = path.join(SCRATCH_DIR, `reel_script_${sessionId}.json`);
  fs.writeFileSync(scriptPath, JSON.stringify(scriptObj, null, 2));

  // 3. Execute purffle-shorts make to assemble the Reel
  // Detect python binary (python on Windows, python3 or python on Linux/GitHub Actions)
  let pythonBin = 'python';
  if (process.platform !== 'win32') {
    try {
      execSync('which python3', { stdio: 'ignore' });
      pythonBin = 'python3';
    } catch (_) {
      pythonBin = 'python';
    }
  }

  const runnerScript = path.join(__dirname, '../scripts/run_reel_engine.py');
  console.log(`[HighRetentionReel] 🚀 Executing high-retention reel pipeline using '${pythonBin}' (${scriptScenes.length} scenes, engine: ${ttsEngine}, voice: ${voice})...`);
  const cmd = `${pythonBin} "${runnerScript}" make --script "${scriptPath}" --tts "${ttsEngine}" --voice "${voice}" --lang "${lang}" --caption-style bold --no-upload`;
  const env = { 
    ...process.env, 
    PEXELS_API_KEY: process.env.PEXELS_API_KEY || 'NSq2RqXrKm1djxxjPXmv5VKS0ZFBByBr0mv0yd2guVlqpFjD6tx7TDv4',
    WATERMARK: 'none',        // 100% REMOVES THE WATERMARK
    CHANNEL_NAME: 'none',     // Fallback blanking
    END_CTA: '',              // Disables any outro CTA watermark
    VOICE_ENHANCE: 'false',   // Disables robotic de-esser and audio compression artifacts
    TTS_ENGINE: ttsEngine,
    TTS_VOICE: voice,
    TTS_RATE: ttsRate,        // Natural human speaking rate (0% normal, -2% calm)
    SFX_VOLUME: '0.25',       // Subtle, crisp sound effects instead of loud jarring whooshes
    PYTHONUTF8: '1', 
    PYTHONIOENCODING: 'utf-8' 
  };

  try {
    execSync(cmd, { env, stdio: 'inherit' });

    // 4. Locate the newly rendered MP4 in output_videos
    const folders = fs.readdirSync(OUTPUT_VIDEOS_DIR)
      .filter(f => fs.statSync(path.join(OUTPUT_VIDEOS_DIR, f)).isDirectory())
      .sort()
      .reverse();

    const latestFolder = folders[0];
    const generatedMp4 = path.join(OUTPUT_VIDEOS_DIR, latestFolder, 'short.mp4');

    if (!fs.existsSync(generatedMp4)) {
      throw new Error(`Generated MP4 not found in ${latestFolder}`);
    }

    console.log(`[HighRetentionReel] ✅ MP4 generated successfully: ${generatedMp4}`);
    const videoBuffer = fs.readFileSync(generatedMp4);

    // 5. Upload to Supabase Storage
    const publicUrl = await uploadToSupabase(videoBuffer, accountName);

    // Clean up temporary script
    try { fs.unlinkSync(scriptPath); } catch (_) {}

    return publicUrl;
  } catch (err) {
    console.error(`[HighRetentionReel] ❌ Failed to generate reel:`, err.message);
    throw err;
  }
}
