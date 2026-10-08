import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';
import { 
  robustAiGenerate, 
  sanitizeAndVaryUrl, 
  getRandomCtaPrefix, 
  generateProceduralPost 
} from './stealth_reach_engine.js';

export const TARGET_WEBSITES = [
  {
    key: 'tranvas',
    name: 'tranvas.com',
    url: 'tranvas.com',
    niche: 'Unified Life OS & Personal Management',
    pain: 'Paying $90/month across 7 fragmented apps just to track habits, to-dos, water, and laundry; dark mode locked behind enterprise demo tiers; 45-step onboarding quizzes',
    solution: 'Fast, unified life OS that actually works without corporate bloatware, AI wrappers, and fragmented subscriptions'
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
    solution: '100% in-browser WebCodecs & WASM processing: compress, convert, transcribe, and edit audio/video directly in your device RAM'
  },
  {
    key: 'createmyqr',
    name: 'createmy-qr.com',
    url: 'createmy-qr.com',
    niche: '37 Client-side QR & Barcode Tools',
    pain: 'Scammy "free" QR code generators that expire after 14 days and hold printed restaurant menus or business cards hostage for a $39/mo subscription; 12 AWS microservices just to render black & white squares',
    solution: '37 ISO/IEC 18004-compliant client-side QR & barcode tools, permanent forever, 100% offline in browser, zero signups'
  },
  {
    key: 'helpmyimg',
    name: 'helpmyimg.com',
    url: 'helpmyimg.com',
    niche: 'In-browser WebAssembly Image Processing Suite',
    pain: 'Paying $20/mo to delete white pixels from a JPG, 10-credit export caps, 240p limits, and email walls just to download a compressed image',
    solution: '100% local browser WASM execution, combine, split, compress, convert, remove white backgrounds, no signups, no paywalls'
  },
  {
    key: 'handlemyfile',
    name: 'handlemyfile.com',
    url: 'handlemyfile.com',
    niche: 'In-browser Document & PDF Suite via WebAssembly',
    pain: 'Paying Adobe $240/year just to delete or merge 1 PDF page, uploading confidential tax docs/contracts to unencrypted cloud S3 buckets, and VC startups raising $12M to slap a chatbot on a PDF reader',
    solution: 'Free in-browser suite: compress, merge, OCR, e-sign & convert Word/Excel in local RAM via WASM, zero cloud uploads'
  }
];

export const COPYWRITING_FRAMEWORKS = [
  {
    id: 'dark_pattern_expose',
    name: 'Dark Pattern & Scam Expose',
    instruction: 'Expose the scummy, predatory dark patterns of typical SaaS (fake download buttons, expiring QR codes holding menus hostage, 99% watermark extortion, email walls). Contrast with our clean, instant client-side tool.'
  },
  {
    id: 'privacy_sovereignty',
    name: 'Privacy & Local Compute Sovereignty',
    instruction: 'Point out the privacy insanity of beaming private contracts, tax docs, or personal 4K video to random cloud servers just for simple trims or conversions. Emphasize that your browser CPU/RAM is a supercomputer that can do it locally with 0 bytes leaving the machine.'
  },
  {
    id: 'engineering_teardown',
    name: 'Architecture & Over-Engineering Teardown',
    instruction: 'Satirize modern tech stacks (e.g. 12 Kubernetes clusters, AWS Lambda, microservices just for a basic utility). Contrast with lean, client-side WebAssembly/JavaScript that runs in milliseconds in a browser tab.'
  },
  {
    id: 'subscription_absurdity',
    name: 'Subscription Absurdity / Financial Roast',
    instruction: 'Roast the ridiculous economics of the modern subscription economy (paying $240/yr to delete a PDF page, $4.99/week for a utility, enterprise sales demos). Give the straightforward free/indie alternative.'
  },
  {
    id: 'speed_benchmark',
    name: 'Speed Benchmark & Latency Flex',
    instruction: 'Compare the brutal numbers: 3+ minutes of cloud upload + queue + encode vs 0.3-0.4 seconds instant split in local browser RAM via WebAssembly. Concrete, punchy comparison.'
  },
  {
    id: 'nostalgia_local_first',
    name: 'Local-First Nostalgia (Then vs Now)',
    instruction: 'Contrast software from 2004 (ran on your computer, owned forever, fast) vs 2026 (renting permission to view a file on someone else computer that dies when the startup goes bankrupt). Bring software back to local-first.'
  },
  {
    id: 'anti_overwhelm',
    name: 'Anti-Overwhelm & Life OS',
    instruction: 'Address the mental burnout of having 14 fragmented apps pinging push notifications for habits, water, to-dos, and laundry. Pitch unifying everything into one lean system.'
  },
  {
    id: 'sarcastic_dialogue',
    name: 'Sarcastic Dialogue',
    instruction: 'A crisp, witty 3-line dialogue between a normal User (just wanting a simple task done), a greedy SaaS corporate salesperson (asking for enterprise demo/card/onboarding), and the Indie Hacker (done in 0.4s in RAM).'
  },
  {
    id: 'unpopular_dev_opinion',
    name: 'Unpopular Dev Opinion',
    instruction: 'State a provocative, sharp tech opinion (e.g., 85% of utility SaaS apps do not need a backend, they only have one to justify charging monthly rent and collecting telemetry). Prove it with client-side WASM.'
  },
  {
    id: 'rare_alien_observation',
    name: 'Alien Observer Satire',
    instruction: 'Alien report/observation noticing humanity has achieved incredible feats (space travel, splitting the atom) yet still pays monthly rent for trivial digital tasks. Humorous and cynical.'
  }
];

// Fallback high-quality copies for each site with clean visual line breaks, custom feed keywords & conversational reply triggers
const BACKUP_POSTS = {
  tranvas: [
    `How much do you pay each month across fragmented habit and to-do apps?

Organizing your life shouldn't require a 4-hour setup, 7 subscriptions, and $90/mo.

One lean, unified life OS for your brain:
👉 tranvas.com`,

    `Modern web startup playbook:
- $10M seed round
- Slap AI on a to-do list
- Founder crying on LinkedIn

Why do simple productivity tools need VC bloat? We built a fast, unified life OS that just works:
👉 tranvas.com`,

    `You don't have ADHD. You just have 12 different apps pinging you for habits, water, to-dos, and laundry.

What's the most bloated productivity app you've uninstalled?

Reclaim focus with a lean life OS:
👉 tranvas.com`,

    `Software in 2004: fast, local-first, owned forever.
Software in 2026: 6 subscriptions to remember laundry.

When did basic productivity become a rental service? Consolidate your daily workflow:
👉 tranvas.com`,

    `Tired of opening 15 tabs and logging into 3 different project apps before you even start working?

What's your biggest pet peeve with modern SaaS tools?

One unified Life OS to rule them all:
👉 tranvas.com`
  ],
  solvemymedia: [
    `Why does compressing video still require uploading 2GB to AWS and waiting in a queue?

Your browser GPU is a supercomputer. What media task do you wish was 100% client-side?

All-in-one local WASM media suite:
👉 solvemymedia.com`,

    `Cloud video compressors:
"File exceeds 500MB. Upgrade to Pro for $19/mo."

Why put artificial caps on local hardware? WebCodecs lets you shrink 10GB videos in browser RAM with 0 uploads:
👉 solvemymedia.com/compress-video`,

    `Sending private client podcasts or voice notes to cloud APIs just for transcripts?

Huge privacy risk. Why leak data when you can run neural speech-to-text 100% inside your browser CPU?
👉 solvemymedia.com/transcribe`,

    `Why pay monthly SaaS rent just to convert MOV to MP4?

Do you still upload private footage to random cloud converters, or switch to offline WebAssembly?

Zero signups, 100% in-browser RAM:
👉 solvemymedia.com/convert-video`,

    `Need to rip an audio track from a video?
Skip the sketchy adware downloads.

Why do simple utilities feel like malware traps today? Extract MP3/WAV offline in your browser in 0.3s:
👉 solvemymedia.com/video-to-audio`,

    `Why pay Loom $12/month just to record a quick screen demo with cloud surveillance?

Record screen, camera, and mic 100% in-browser with zero uploads. What's your go-to private recording tool?
👉 solvemymedia.com/recorder`,

    `Create animated GIFs from videos without a watermark the size of Texas.

Why do "free" GIF sites still stamp 2005-era watermarks on everything? High framerate client-side WASM:
👉 solvemymedia.com/create-gif`,

    `Nothing causes more rage than trimming a video on a "free tool" only to get hit with:

"Upgrade for $19.99 to remove watermark" at 99%.

What's the worst dark pattern you've seen? 0.4s local WASM cuts:
👉 solvemymedia.com/cut-video`
  ],
  createmyqr: [
    `Restaurant owners: have you checked your printed menus lately?

Scammy "free" QR generators expire after 30 days and hold menus hostage for $39/mo. Why do people still fall for this?

Permanent client-side static QR codes:
👉 createmy-qr.com`,

    `SaaS startup:
- $6M Seed round
- 12 Kubernetes clusters
- Price: $49/mo to generate barcodes

Why overcomplicate basic math? Here is a 100% client-side webdev suite of 37 barcode & QR tools:
👉 createmy-qr.com`,

    `The subscription economy is out of control.

Imagine paying monthly rent just so your printed business card QR doesn't 404. What's the dumbest paywall you've hit?

ISO-standard static QR tools free forever:
👉 createmy-qr.com`,

    `Average SaaS stack: Next.js -> Redis -> S3 -> Python microservice just to draw black & white squares.

Isn't 40 lines of client-side JS enough? 37 free barcode tools running offline in your browser:
👉 createmy-qr.com`
  ],
  helpmyimg: [
    `SaaS founders wrapping 4 lines of Canvas code into a $29/mo plan with 10 "credits" and an email wall:

"We're disrupting tech."

Why are basic image conversions still monetized like enterprise software? 100% local WASM:
👉 helpmyimg.com`,

    `The modern web:
Click download -> 3 fake buttons -> disable adblock -> enter email -> 240p cap unless you pay $20/mo.

Why do we accept this? Crop, compress, and convert in local browser RAM in 0.2s:
👉 helpmyimg.com`,

    `Stop uploading private family photos or client assets to random cloud compressors.

Your browser is a sandboxed supercomputer. Why send pixels across the internet when you can compress locally?
👉 helpmyimg.com`,

    `We put humans on the moon with 4KB of RAM, yet today's web needs Docker containers just to convert PNG to WebP.

What's the most bloated web tool you avoid? Pure client-side WASM image suite:
👉 helpmyimg.com`
  ],
  handlemyfile: [
    `Humans landed rovers on Mars, yet people pay Adobe $240/year to delete 1 PDF page.

Why are document tools still locked behind predatory annual contracts? Free client-side suite in local RAM via WASM:
👉 handlemyfile.com`,

    `Reminder: when a "free" cloud converter asks you to upload confidential tax returns or contracts, it lives on their S3 bucket forever.

Why risk data leaks? HandleMyFile processes documents in local sandboxed RAM:
👉 handlemyfile.com`,

    `Startups in 2026:
"We raised $12M to slap a chatbot on a PDF reader! Join our waitlist!"

Anyone else sick of AI wrapper bloat? Compress, merge, OCR, and e-sign 100% in-browser with zero cloud uploads:
👉 handlemyfile.com`,

    `Need to merge 2 PDFs, compress a report, or e-sign a doc?

Don't enter your credit card for a "7-day free trial" that bills $180. What's the worst trial trap you've encountered?

100% offline WASM document suite:
👉 handlemyfile.com`
  ]
};

const withTimeout = (promise, ms = 6000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AI generation timed out')), ms))
  ]);
};

// Recommended frameworks per site to ensure high relevance & zero monotony
const SITE_FRAMEWORK_MAP = {
  tranvas: ['anti_overwhelm', 'subscription_absurdity', 'nostalgia_local_first', 'dark_pattern_expose'],
  solvemymedia: ['privacy_sovereignty', 'speed_benchmark', 'unpopular_dev_opinion', 'sarcastic_dialogue'],
  createmyqr: ['dark_pattern_expose', 'engineering_teardown', 'subscription_absurdity', 'speed_benchmark'],
  helpmyimg: ['subscription_absurdity', 'dark_pattern_expose', 'engineering_teardown', 'nostalgia_local_first'],
  handlemyfile: ['subscription_absurdity', 'privacy_sovereignty', 'speed_benchmark', 'rare_alien_observation']
};

/**
 * Generates an authentic, high-impact Bluesky post for @khaithisran.bsky.social
 * @param {string|null} targetSiteKey - 'tranvas', 'solvemymedia', 'createmyqr', 'helpmyimg', 'handlemyfile', or URL match
 * @returns {Promise<string>} Clean text under 290 characters with link
 */
export async function generateKhaithisranPost(targetSiteKey = null) {
  // Determine site config
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

  // Fallback to random site if not found
  if (!site) {
    site = TARGET_WEBSITES[Math.floor(Math.random() * TARGET_WEBSITES.length)];
  }

  // Select diverse framework for this site
  const siteFrameworkIds = SITE_FRAMEWORK_MAP[site.key] || [];
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const siteIdx = TARGET_WEBSITES.findIndex(s => s.key === site.key);
  const chosenFrameworkId = siteFrameworkIds[(dayOfYear + siteIdx + Math.floor(Math.random() * siteFrameworkIds.length)) % siteFrameworkIds.length];
  
  const framework = COPYWRITING_FRAMEWORKS.find(f => f.id === chosenFrameworkId) || COPYWRITING_FRAMEWORKS[0];

  // Dynamic subtool selection (e.g. for solvemymedia to showcase different tools or the generic suite)
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

  // Dynamic URL & CTA via Stealth Engine
  const variedUrl = sanitizeAndVaryUrl(targetUrl, 'bluesky');
  const ctaPrefix = getRandomCtaPrefix(false);

  // Try generating via Robust Stealth AI Engine with 25s timeout & model fallback
  try {
    const prompt = `
You are an authentic, sharp, pro-open-web indie developer sharing a practical tool on Bluesky.
Tone: Tech-native, thoughtful, conversational, slightly cynical about VC bloat & subscription traps.

TARGET TOOL:
- Name: ${targetToolName}
- Feature/Benefit: ${targetSolution}
- Real Pain Point: ${targetPain}
- Angle/Perspective: "${framework.name}" (${framework.instruction})

ALGORITHMIC REACH & ANTI-SPAM DIRECTIVES:
1. DISCUSSION VELOCITY (CRITICAL FOR BLUESKY DISCOVER FEED): 
   The algorithm ranks posts by reply depth and dwell time. You MUST end the post with a sharp, relatable question or dilemma that compels tech/creative users to comment (e.g., "What's the worst dark pattern you've run into lately?", "Why are people still beaming 2GB to cloud queues?").
2. CONVERSATIONAL LINE BREAKS: Use clean single or double line breaks. No monolithic blocks of text.
3. ORGANIC TOOL LINK: Provide the link naturally at the end:
   ${ctaPrefix} ${variedUrl}
4. STRICT LENGTH LIMIT: Absolute maximum of 280 characters TOTAL (including the URL and newlines). Bluesky limit is 300.
5. ZERO HASHTAGS: Do not include hashtags (#). The Bluesky tech community downranks hashtag stuffing.
6. NO ROBOTIC PREFIXES: Do NOT output headers like "[LOG #...]", "Productivity Tip:", or formulaic numbered lists.

Output ONLY the final post text.`;

    const generated = await robustAiGenerate(prompt, 'You are an authentic indie hacker posting on Bluesky.');
    if (generated && generated.length >= 50 && generated.length <= 295) {
      // Ensure the varied URL is present
      let cleanText = generated.replace(/#\w+/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      if (!cleanText.includes(targetUrl.split('/')[0])) {
        cleanText = `${cleanText}\n\n${ctaPrefix} ${variedUrl}`;
      }
      if (cleanText.length <= 295) {
        console.log(`[Bluesky-Khaithisran] 🚀 Fresh AI post generated via Stealth Engine (${cleanText.length} chars)`);
        return cleanText;
      }
    }
  } catch (err) {
    console.warn('[Bluesky-Khaithisran] AI generation note, activating Procedural Fallback Matrix:', err.message);
  }

  // Fallback to Procedural Dynamic Matrix (Generates a unique, non-identical post every single time)
  console.log(`[Bluesky-Khaithisran] 🛡️ Using Procedural Anti-Spam Generator for ${targetToolName}...`);
  const procedural = generateProceduralPost(targetToolName, targetUrl, targetPain, targetSolution, false);
  return procedural.length > 290 ? procedural.substring(0, 290) : procedural;
}

