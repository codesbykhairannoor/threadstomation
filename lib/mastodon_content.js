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

// ── 6 DYNAMIC VIRAL ARCHETYPES FOR FEDIVERSE ──────────────────────────────────
export const VIRAL_ARCHETYPES = [
  {
    key: 'vc_startup_satire',
    name: 'Modern Tech Startup / VC Circus Satire',
    instruction: `Roast the absurd Silicon Valley startup playbook (raising millions for bloated wrappers, waitlists, book-a-demo sales traps, founder LinkedIn crying selfies).
Example tone:
"Modern tech startup playbook:
1. Raise $15M for an 'AI-driven synergy engine'
2. Product is literally a $40/mo ChatGPT wrapper with 500MB of JS
3. 'Book a demo' just to see the pricing
4. Founder posts a crying selfie on LinkedIn after layoffs

We got tired of the circus.
[Tool Name] is zero VC fluff: [Key benefit in 1 sentence].
👉 [URL]
[CamelCase Hashtags]"`
  },
  {
    key: 'saas_dark_patterns',
    name: 'Predatory SaaS Dark Pattern & Extortion Breakdown',
    instruction: `Expose predatory SaaS dark patterns that deceive ordinary users with fake 'free' claims, auto-renewals, and difficult cancellations.
Example tone:
"The modern SaaS playbook is borderline extortion:
1. Slap '100% FREE' on Google
2. Let user upload file
3. Trap result behind an account wall
4. Demand a credit card for a '7-day trial' that auto-renews at $180/year
5. Make cancellation require a 20-min bot chat

Disgusting. Keep your money:
[Tool Name] runs 100% client-side via WebAssembly. Zero uploads, zero paywalls.
👉 [URL]
[CamelCase Hashtags]"`
  },
  {
    key: 'alien_observation',
    name: 'Intergalactic / Alien Field Observer Satire',
    instruction: `Write a sharp, humorous alien observation log watching humans harness advanced physics, yet pay absurd monthly rent for basic digital tasks.
Example tone:
"🛸 Intergalactic Observation Log: Earth
'They split the atom and mapped the genome. Yet to [basic task], they pay $80/mo across 6 proprietary SaaS apps and transmit files over undersea cables to an AWS warehouse.'

First contact postponed / Turn the ship around.
Fortunately, [Tool Name]: [WASM/local benefit].
👉 [URL]
[CamelCase Hashtags]"`
  },
  {
    key: 'tech_regression_contrast',
    name: '2004 vs 2026 Tech Regression Contrast',
    instruction: `Contrast the freedom and ownership of local software in the 2000s against the modern dystopian subscription rent-trap of 2026.
Example tone:
"Tech evolution in 2004 vs 2026:
2004: Software ran locally in 10MB on your machine. You owned it forever.
2026: You pay $90/year across 6 apps just for push notifications reminding you to drink water.

Stop renting basic utilities. [Tool Name] runs 100% in local browser memory:
👉 [URL]
[CamelCase Hashtags]"`
  },
  {
    key: 'overengineered_cloud',
    name: 'Over-Engineered Cloud Architecture Roast',
    instruction: `Roast the ridiculous over-engineering of 20 AWS microservices to do simple mathematical or file processing tasks that can run in client-side RAM.
Example tone:
"Average modern tech stack in 2026:
Next.js -> Redis -> Cloudflare -> S3 -> Python microservice just to [simple task].

Why over-engineer basic math?
[Tool Name] executes in your browser in milliseconds with 0 server uploads:
👉 [URL]
[CamelCase Hashtags]"`
  },
  {
    key: 'open_question_debate',
    name: 'Community Discussion & Hot Take Trigger',
    instruction: `Post a provocative observation about software ethics or privacy, followed by a direct question to the Mastodon tech community.
Example tone:
"Security question for devs and creators:
Why do we still accept uploading 2GB of confidential client media or tax records to random cloud servers just to perform basic conversions?

Your browser already has WebAssembly and device GPU access.
What's the most bloated tool you've replaced with client-side software?
👉 [URL]
[CamelCase Hashtags]"`
  }
];

// ── PROVEN VIRAL BACKUP POSTS (ALL USER-TESTED & CURATED) ─────────────────────
// Tested to fit strictly within 480 characters for Mastodon 500-char limit
const BACKUP_POSTS = {
  tranvas: [
    `Modern tech startup playbook:
1. Raise $15M for an "AI-driven human synergy engine"
2. Product is literally a $40/mo ChatGPT wrapper with 500MB of JS
3. "Book a demo" just to see the pricing
4. Founder posts a crying selfie on LinkedIn after layoffs

We got tired of the circus.

Tranvas is zero VC fluff: Planner, Habits, Finance & Goals unified in one fast Life OS.

👉 tranvas.com

#Startups #IndieDev #Productivity #LifeOS #OpenWeb`,

    `🛸 Intergalactic Observation Log: Earth
"They split the atom and mapped the genome. Yet to drink water and do taxes, they pay $80/mo across 6 proprietary SaaS apps and spend 4 hours styling pastel database rollups."

First contact postponed.

Until humanity switches to Tranvas: unified Life OS for planner, habits, finances & goals without SaaS fragmentation.

👉 tranvas.com

#SciFi #IndieDev #Productivity #LifeOS`,

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
    `Modern SaaS startups:
"We raised $20M to upload your private video to our AWS servers, hold it in a 10-minute queue, slap an ugly watermark on it, and charge you $25/mo to trim 3 seconds." 🤡

We built the exact opposite:
SolveMyMedia — 100% client-side WebAssembly video tools.

• Zero uploads (runs in browser RAM)
• Zero accounts or trackers
• Lossless stream copy in 0.4s
• Free forever, no watermarks

👉 solvemymedia.com/cut-video

#WebAssembly #WASM #VideoEditing #OpenSource`,

    `👽 Alien Field Log:
Earthlings carry 8-core pocket supercomputers. Yet to cut 3 seconds off a video, they transmit 1GB across undersea cables to an AWS warehouse, wait 15 minutes in a cloud queue, pay $25/month, and accept an ugly watermark.

Fortunately, some humans built SolveMyMedia:
• 100% client-side WebAssembly
• 0 bytes uploaded to servers
• Lossless cut in 0.4s
• Free forever, no watermarks

👉 solvemymedia.com/cut-video

#SciFi #WebAssembly #VideoEditing #OpenWeb`,

    `Online converters charging $15/mo for basic FFmpeg commands while locking files behind a 500MB paywall is pure extortion.

SolveMyMedia runs 100% in your browser via WebAssembly:
• Zero server uploads (files stay in RAM)
• No size caps & no watermarks
• Free forever

Cut, compress, convert, and transcribe locally:
👉 solvemymedia.com

#WebDev #Privacy #WebAssembly #Tech #FOSS`,

    `Cloud video compressors:
"Your file exceeds 500MB. Please upgrade to Pro for $19.99/mo to continue."

Your laptop has a multi-core processor and dedicated graphics. We use modern WebCodecs so you can compress 4K and 10GB video files locally with zero server limits and zero tracking.

👉 solvemymedia.com/compress-video

#WebCodecs #WebAssembly #VideoEditing #TechEthics #PrivacyMatters`,

    `Sending confidential client podcasts, meetings, or voice memos to cloud APIs just for transcripts?

That's a severe privacy risk. We built a local speech-to-text tool that runs neural transformer models entirely inside your browser CPU. 0 bytes leave your machine.

👉 solvemymedia.com/transcribe

#LocalAI #PrivacyTools #SpeechToText #WebAssembly #FOSS`
  ],

  createmyqr: [
    `How startups raise $10M in 2026:
1. Rebrand a 1994 barcode as "AI Spatial Gateway"
2. Run a 3-line redirect on 20 AWS microservices
3. Force users to book a Zoom sales demo to export an SVG
4. Charge $49/seat/month

Meanwhile, I built CreateMyQR on zero funding:
✨ 37 tools: WiFi, vCard, Barcodes, Scanner
✨ 100% client-side: renders in 12ms in browser
✨ Infinite vector SVG & HD PNG
✨ Free forever, no demos

👉 createmy-qr.com

#Startups #WebDev #OpenSource #FOSS`,

    `Alien Expedition Log, Earth Year 2026:
We traveled 50 light-years to evaluate humanity. Tragically, we found tech companies charging $480/yr to rent 2D binary matrices (ISO 18004). They hold cafe menus hostage for paper money.

Turn the ship around.

Except CreateMyQR:
✨ 37 tools: WiFi, vCard, WhatsApp, Barcode, Scanner
✨ 100% client-side in browser (zero tracking)
✨ Infinite vector SVG & HD PNG

👉 createmy-qr.com

#SciFi #WebDev #QRCode #DeveloperTools`,

    `To any restaurant owners or small businesses reading this: have you checked your printed QR menus lately?

There is a widespread predatory model where "free" QR generators silently expire your codes after 30 days, demanding $39/mo to keep them active.

CreateMyQR is a suite of 37 client-side QR and barcode tools. 100% permanent, ISO/IEC compliant, and processed in your browser tab without accounts.

👉 createmy-qr.com

#OpenSource #WebDev #QRCode #DeveloperTools #FOSS`,

    `Average modern tech stack:
Next.js -> Redis -> Cloudflare -> S3 -> Python microservice just to draw a black-and-white QR matrix.

Why over-engineer basic math? Here are 37 barcode and QR tools running purely in client-side JavaScript in under 5ms:

👉 createmy-qr.com

#WebDev #SoftwareEngineering #Architecture #JavaScript #IndieHacker`
  ],

  helpmyimg: [
    `The modern SaaS playbook is borderline extortion:
1. Slap "100% FREE" on Google
2. Let user upload image
3. Trap result behind an account wall
4. Demand credit card for "trial" auto-renewing at $180/yr
5. 20-min bot chat to cancel

Disgusting.

HelpMyIMG runs 100% in browser via WebAssembly:
• Zero server uploads, zero paywalls

Keep your money:
👉 helpmyimg.com

#WebAssembly #WASM #Privacy #ImageTools`,

    `🛸 [GALACTIC LOG #4092]
"Earthlings have harnessed silicon lithography and neural engines.

Yet our probes observe them transmitting private face scans across oceans to centralized servers just to erase a background, only to be told: '0 credits remaining. Insert credit card.'

Their tech cartels are extorting them for basic matrix math."

HelpMyIMG executes 100% in browser via WebAssembly:
• Zero server uploads, no paywalls

👉 helpmyimg.com

#SciFi #WebAssembly #Privacy #LocalFirst`,

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
    `Modern Tech Startups:
1. Raise $15M Seed round from VCs
2. Slap "AI-Powered Document Intelligence" on landing page
3. Put a 40,000-person waitlist on a PDF tool
4. Charge $29/mo for an API wrapper

Tired of the circus? I built HandleMyFile:
• 0 VC funding, 0 waitlists, 0 AI fluff
• 100% in-browser RAM via WebAssembly
• Merge, compress, e-sign, OCR & convert Word/Excel
• Zero cloud uploads, works offline

👉 handlemyfile.com

#Startups #WebDev #Privacy #WASM #PDF`,

    `Alien Surveillance Log #8,102:
"Earthlings split the atom, yet beam tax records to random cloud servers to merge two PDFs on a promise of 'we delete it in 2h'.

Then pay $20/mo to remove watermarks. Baffling."

We brought technology: HandleMyFile
🛸 100% In-Browser WASM (runs offline)
🛸 Compress 100MB PDFs to 5MB in RAM
🛸 e-Sign & OCR scanned text
🛸 PDF ⇄ Word, Excel, PPTX
🛸 Zero cloud uploads, zero paywalls

👉 handlemyfile.com

#Privacy #SciFi #PDF #WASM`,

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
 * Generates an authentic, high-impact Mastodon post with rotating viral archetypes
 * Adheres strictly to Fediverse culture: CamelCase tags, high value, 480 chars max.
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

  // Pick a dynamic viral archetype for this specific post
  const archetype = VIRAL_ARCHETYPES[Math.floor(Math.random() * VIRAL_ARCHETYPES.length)];
  console.log(`[Mastodon-AI] Selected Viral Archetype: [${archetype.name}] for [${site.name}]`);

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
You are a sharp, witty, anti-corporate tech engineer posting on Mastodon (the Fediverse).
The Mastodon community loves: open-source software, client-side WebAssembly, privacy, roasting VC bloatware, and accessible #CamelCase hashtags.
Mastodon hates: corporate marketing speak, fake affiliate links, and repetitive boring templates.

YOUR CHOSEN POST FORMAT / ARCHETYPE FOR THIS POST:
${archetype.instruction}

PRODUCT DETAILS TO WEAVE INTO THE POST:
- Tool Name: ${targetToolName}
- Link: ${targetUrl}
- Pain point to roast: ${targetPain}
- Real solution: ${targetSolution}

FEDIVERSE RULES:
1. STRICT CHARACTER LIMIT: Must be under 460 characters TOTAL (Mastodon limit is 500).
2. Clean spacing: Use clear double newlines (\\n\\n) between sections.
3. Link format: Put the link on its own line preceded by 👉 ${targetUrl}
4. Mandatory #CamelCase hashtags at the end: ${camelTags}
5. Do NOT use markdown links like [text](url). Use raw text URL.

Output ONLY the final toot text, nothing else.`;

          const res = await withTimeout(model.generateContent(prompt), 6000);
          let text = res.response.text().trim();
          text = text.replace(/^["']|["']$/g, '').trim();

          if (!text.includes(targetUrl)) {
            text = `${text}\n👉 ${targetUrl}`;
          }

          if (!text.includes('#')) {
            text = `${text}\n\n${camelTags}`;
          }

          if (text.length >= 80 && text.length <= 490) {
            console.log(`[Mastodon-AI] Successfully generated fresh post using [${archetype.name}] (${text.length} chars)`);
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

  // Fallback to curated user-tested viral backup for this site
  const siteBackups = BACKUP_POSTS[site.key] || BACKUP_POSTS.tranvas;
  const chosenBackup = siteBackups[Math.floor(Math.random() * siteBackups.length)];
  console.log(`[Mastodon-AI] Used curated viral backup for ${targetToolName} (${chosenBackup.length} chars)`);
  return chosenBackup.length > 490 ? chosenBackup.substring(0, 490) : chosenBackup;
}
