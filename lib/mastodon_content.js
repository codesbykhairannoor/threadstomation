import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';

export const TARGET_WEBSITES = [
  {
    key: 'tranvas',
    name: 'tranvas.com',
    url: 'tranvas.com',
    niche: 'Unified Life OS & Personal Management',
    pain: 'Paying $90/month across 7 fragmented apps just to track habits, to-dos, water, and laundry; dark mode locked behind enterprise demo tiers; 45-step onboarding quizzes',
    solution: 'Fast, unified life OS that actually works without corporate bloatware, AI wrappers, and fragmented subscriptions',
    hashtags: ['#Productivity', '#LifeOS', '#PersonalManagement', '#IndieDev', '#OpenWeb']
  },
  {
    key: 'solvemymedia',
    name: 'solvemymedia.com',
    url: 'solvemymedia.com',
    niche: 'In-browser WebCodecs & WASM Media Suite (Compress, Convert, Transcribe, Cut, GIF)',
    tools: [
      { key: 'generic', name: 'SolveMyMedia All-in-One', url: 'solvemymedia.com', pain: 'Cloud services charging $20/mo and harvesting video files to remote servers', solution: 'Compress, convert, transcribe, and edit audio/video 100% offline via WebCodecs and WebAssembly directly in browser RAM' },
      { key: 'compress', name: 'In-Browser Video Compressor', url: 'solvemymedia.com/compress-video', pain: '4K videos hitting 500MB cloud upload limits, 20-min queues, and $15/mo subscriptions', solution: 'Hardware-accelerated browser compression via WebGPU/WebCodecs, zero file size limits, zero uploads' },
      { key: 'convert', name: 'Video & Audio Converter', url: 'solvemymedia.com/convert-video', pain: 'Paying monthly SaaS subscriptions just to convert MOV to MP4 or MKV without sketchy adware', solution: '100% client-side WebAssembly converter running locally in browser memory' },
      { key: 'transcribe', name: 'Local AI Speech-to-Text', url: 'solvemymedia.com/transcribe', pain: 'Sending confidential client audio or podcast leaks to cloud APIs just for transcripts', solution: 'Local neural speech-to-text running directly on your CPU/GPU with zero internet uploads' },
      { key: 'audiostrip', name: 'Video to Audio Extractor', url: 'solvemymedia.com/video-to-audio', pain: 'Downloading sketchy desktop adware apps just to extract audio from video', solution: 'Strip MP3/WAV from video directly in your browser tab in 0.3 seconds' },
      { key: 'gif', name: 'Video to GIF Creator', url: 'solvemymedia.com/create-gif', pain: 'Pixelated 10fps GIFs stamped with huge watermarks on "free" converter sites', solution: 'High-framerate client-side GIF generator with 0 watermarks and 0 signups' },
      { key: 'cut', name: 'Lossless Video Trimmer', url: 'solvemymedia.com/cut-video', pain: 'Watermark extortion and 99% export paywalls just to trim a 5-second video', solution: '0.4s lossless split directly in RAM via WebAssembly with zero uploads' },
      { key: 'recorder', name: 'Screen & Camera Recorder', url: 'solvemymedia.com/recorder', pain: 'Paying Loom $12/mo just to record quick screen demos with cloud surveillance', solution: 'Private in-browser recording studio saving directly to your local drive' }
    ],
    pain: 'Uploading 2GB private media to remote cloud servers, paying $20/mo subscriptions, waiting in queues, and suffering 99% export watermarks',
    solution: '100% in-browser WebCodecs & WASM processing: compress, convert, transcribe, and edit audio/video directly in your device RAM',
    hashtags: ['#WebAssembly', '#WASM', '#WebCodecs', '#PrivacyTools', '#OpenSource', '#VideoEditing']
  },
  {
    key: 'createmyqr',
    name: 'createmy-qr.com',
    url: 'createmy-qr.com',
    niche: '37 Client-side QR & Barcode Tools',
    pain: 'Scammy "free" QR code generators that expire after 14 days and hold printed restaurant menus or business cards hostage for a $39/mo subscription; 12 AWS microservices just to render black & white squares',
    solution: '37 ISO/IEC 18004-compliant client-side QR & barcode tools, permanent forever, 100% offline in browser, zero signups',
    hashtags: ['#OpenSource', '#WebDev', '#QRCode', '#DeveloperTools', '#ClientSide', '#FOSS']
  },
  {
    key: 'helpmyimg',
    name: 'helpmyimg.com',
    url: 'helpmyimg.com',
    niche: 'In-browser WebAssembly Image Processing Suite',
    pain: 'Paying $20/mo to delete white pixels from a JPG, 10-credit export caps, 240p limits, and email walls just to download a compressed image',
    solution: '100% local browser WASM execution, combine, split, compress, convert, remove white backgrounds, no signups, no paywalls',
    hashtags: ['#WebAssembly', '#WASM', '#Privacy', '#ImageTools', '#WebDevelopment', '#LocalFirst']
  },
  {
    key: 'handlemyfile',
    name: 'handlemyfile.com',
    url: 'handlemyfile.com',
    niche: 'In-browser Document & PDF Suite via WebAssembly',
    pain: 'Paying Adobe $240/year just to delete or merge 1 PDF page, uploading confidential tax docs/contracts to unencrypted cloud S3 buckets, and VC startups raising $12M to slap a chatbot on a PDF reader',
    solution: 'Free in-browser suite: compress, merge, OCR, e-sign & convert Word/Excel in local RAM via WASM, zero cloud uploads',
    hashtags: ['#Privacy', '#DocumentManagement', '#WebAssembly', '#LocalFirst', '#OpenSource', '#Tech']
  }
];

// Curated high-impact copies tailored to Mastodon Fediverse etiquette (CamelCase tags, high value, conversational, anti-VC)
const BACKUP_POSTS = {
  tranvas: [
    `How much do you pay each month across fragmented habit and to-do apps?

Organizing your daily life shouldn't require a 4-hour Notion setup, 7 separate subscriptions, and $90/mo just to remember laundry.

We built Tranvas as a lean, unified life OS that handles your habits, priorities, and workflow in one clean screen without enterprise bloatware.

👉 tranvas.com

#Productivity #LifeOS #PersonalManagement #IndieDev #OpenWeb`,

    `Modern software culture in 2004 vs 2026:

2004: Software ran locally on your computer. You owned it forever.
2026: You pay $90/year across 6 apps just for push notifications reminding you to drink water.

When did basic personal management become an extractive subscription model? Consolidate your daily workflow into one unified interface:

👉 tranvas.com

#Productivity #IndieDev #Minimalism #SoftwareDesign #OpenWeb`,

    `You probably don't have an attention problem. You just have 14 different productivity apps competing for your notification tray.

What's the most bloated productivity tool you've uninstalled recently?

We built a fast, unified Life OS to cut through the digital noise:
👉 tranvas.com

#Productivity #Mindfulness #IndieHacker #DigitalWellbeing #LifeOS`
  ],
  solvemymedia: [
    `Why does compressing a video in 2026 still require uploading 2GB of private footage to a remote cloud server and waiting in a queue?

Your browser's JavaScript engine and WebCodecs API can utilize your device GPU directly. SolveMyMedia performs media compression, format conversion, and editing 100% offline in client RAM. Zero server uploads, zero data leakage.

What media tasks do you wish ran entirely client-side?

👉 solvemymedia.com

#WebAssembly #WASM #WebCodecs #PrivacyTools #OpenSource #WebDev`,

    `Cloud video compressors:
"Your file exceeds 500MB. Please upgrade to Pro for $19.99/mo to continue."

Your laptop has a multi-core processor and dedicated graphics. We use modern WebCodecs so you can compress 4K and 10GB video files locally with zero server limits and zero tracking.

👉 solvemymedia.com/compress-video

#WebCodecs #WebAssembly #VideoEditing #TechEthics #PrivacyMatters`,

    `Sending confidential client podcasts, meetings, or voice memos to cloud APIs just for transcripts?

That's a severe privacy risk. We built a local speech-to-text tool that runs neural transformer models entirely inside your browser CPU. 0 bytes leave your machine.

👉 solvemymedia.com/transcribe

#LocalAI #PrivacyTools #SpeechToText #WebAssembly #FOSS`,

    `Need to convert MOV to MP4 or extract audio tracks without installing sketchy desktop adware?

SolveMyMedia converts audio and video formats directly in browser memory via sandboxed WebAssembly.

👉 solvemymedia.com/convert-video

#WebDevelopment #OpenWeb #AudioEngineering #WASM #ClientSide`
  ],
  createmyqr: [
    `To any restaurant owners or small businesses reading this: have you checked your printed QR menus lately?

There is a widespread predatory model where "free" QR generators silently expire your codes after 30 days, demanding $39/mo to keep them active.

CreateMyQR is a suite of 37 client-side QR and barcode tools. 100% permanent, ISO/IEC compliant, and processed in your browser tab without accounts.

👉 createmy-qr.com

#OpenSource #WebDev #QRCode #DeveloperTools #ClientSide #FOSS`,

    `Average modern tech stack:
Next.js -> Redis -> Cloudflare -> S3 -> Python microservice just to draw a black-and-white QR matrix.

Why over-engineer basic math? Here are 37 barcode and QR tools running purely in client-side JavaScript in under 5ms:

👉 createmy-qr.com

#WebDev #SoftwareEngineering #Architecture #JavaScript #IndieHacker`
  ],
  helpmyimg: [
    `Commercial image converters in 2026:
Upload image -> 3 deceptive download buttons -> disable adblock -> enter email -> 240p cap unless you pay $20/mo.

Why do we accept this for basic pixel manipulation?

HelpMyIMG runs entirely in sandboxed browser RAM via WebAssembly. Crop, compress, and convert PNG, JPG, and WebP offline in 0.2 seconds.

👉 helpmyimg.com

#WebAssembly #WASM #Privacy #ImageTools #WebDevelopment #LocalFirst`,

    `Stop uploading private family photos or client assets to random cloud compressors.

Your browser is a multi-threaded sandbox. Why send pixels over the internet when local WebAssembly can compress them with zero quality loss?

👉 helpmyimg.com

#PrivacyTools #LocalFirst #WebDev #WASM #ClientSide`
  ],
  handlemyfile: [
    `Humans landed autonomous rovers on Mars, yet corporations charge $240/year just to delete or merge 1 PDF page.

Stop paying monthly rent for basic document math. HandleMyFile is a free in-browser suite: compress, merge, OCR, e-sign & convert Word/Excel in local RAM via WebAssembly.

0 cloud uploads, 100% private.

👉 handlemyfile.com

#Privacy #DocumentManagement #WebAssembly #LocalFirst #OpenSource #Tech`,

    `Security reminder: when you upload confidential contracts or tax returns to a "free" cloud PDF tool, those documents sit on an unencrypted S3 bucket indefinitely.

HandleMyFile processes every document inside your local browser memory sandbox.

👉 handlemyfile.com

#CyberSecurity #PrivacyFirst #DocumentTools #LocalFirst #FOSS`
  ]
};

const withTimeout = (promise, ms = 6000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AI generation timed out')), ms))
  ]);
};

/**
 * Generates an authentic, high-impact Mastodon post
 * Adheres strictly to Fediverse culture: CamelCase tags, alt-text, high value, 480 chars max.
 * @param {string|null} targetSiteKey
 * @returns {Promise<string>}
 */
export async function generateMastodonPost(targetSiteKey = null) {
  let site = null;
  if (targetSiteKey) {
    const keyLower = targetSiteKey.toLowerCase();
    site = TARGET_WEBSITES.find(s => 
      s.key === keyLower || 
      s.name.toLowerCase().includes(keyLower) || 
      keyLower.includes(s.key) ||
      keyLower.includes(s.name)
    );
  }

  if (!site) {
    site = TARGET_WEBSITES[Math.floor(Math.random() * TARGET_WEBSITES.length)];
  }

  let targetUrl = site.url;
  let targetPain = site.pain;
  let targetSolution = site.solution;
  let targetToolName = site.name;

  if (site.tools && site.tools.length > 0) {
    const selectedTool = site.tools[Math.floor(Math.random() * site.tools.length)];
    targetUrl = selectedTool.url;
    targetPain = selectedTool.pain;
    targetSolution = selectedTool.solution;
    targetToolName = selectedTool.name;
  }

  const camelTags = site.hashtags.join(' ');

  try {
    const allKeys = await getAllGeminiKeys();
    const validKeys = allKeys.filter(k => k.startsWith('AIza'));
    const keysToUse = validKeys.length > 0 ? validKeys : allKeys;

    if (keysToUse.length > 0) {
      for (const apiKey of keysToUse.slice(0, 3)) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          const prompt = `
You are a respected, knowledgeable open-web engineer posting on Mastodon (the Fediverse).
Mastodon culture values: open-source principles, local-first software, user privacy, deep technical insight, and accessible CamelCase hashtags.
Mastodon strictly hates: corporate sales pitches, aggressive advertising, affiliate links, and Twitter-style outrage bait.

PRODUCT TO INTRODUCE:
- Name: ${targetToolName}
- Link: ${targetUrl}
- Pain point: ${targetPain}
- Solution: ${targetSolution}

FEDIVERSE FORMATTING RULES:
1. Tone: Thoughtful, technical, ethical, respectful, and anti-cloud-monopoly.
2. Structure:
   - Engaging opening reflection or technical question.
   - Clean paragraph break (\\n\\n).
   - Practical value explanation of why client-side / local computing matters here.
   - Direct link: \\n👉 ${targetUrl}
   - Mandatory #CamelCase hashtags at the end: ${camelTags}
3. STRICT CHARACTER LIMIT: Maximum 460 characters TOTAL (Mastodon limit is 500).
4. NO AFFILIATE or salesy marketing words ("Buy now", "Special deal", "Limited offer"). Focus on privacy, freedom, and utility.

Output ONLY the final toot text, nothing else.`;

          const res = await withTimeout(model.generateContent(prompt), 6000);
          let text = res.response.text().trim();
          text = text.replace(/^["']|["']$/g, '').trim();

          if (!text.includes(targetUrl)) {
            text = `${text}\n👉 ${targetUrl}`;
          }

          // Ensure hashtags are attached if missing
          if (!text.includes('#')) {
            text = `${text}\n\n${camelTags}`;
          }

          if (text.length >= 80 && text.length <= 490) {
            console.log(`[Mastodon-AI] Generated post for ${targetToolName} (${text.length} chars)`);
            return text;
          }
        } catch (modelErr) {
          console.warn(`[Mastodon-AI] Attempt error:`, modelErr.message);
        }
      }
    }
  } catch (err) {
    console.error('[Mastodon-AI] Fallback to curated backup:', err.message);
  }

  // Fallback to curated Mastodon backup
  const siteBackups = BACKUP_POSTS[site.key] || BACKUP_POSTS.tranvas;
  const chosenBackup = siteBackups[Math.floor(Math.random() * siteBackups.length)];
  console.log(`[Mastodon-AI] Used curated backup for ${targetToolName}`);
  return chosenBackup;
}
