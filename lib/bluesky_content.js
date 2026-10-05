import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';

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
    url: 'solvemymedia.com/cut-video',
    niche: 'In-browser WebAssembly Video & Media Tools',
    pain: 'Uploading 2GB private video to remote cloud servers, waiting 15 mins in a cloud queue, creating an account, and getting hit with a massive watermark at 99% export unless you pay $20/mo',
    solution: '100% in-browser WebAssembly (WASM), 0.4s local cuts in browser RAM, zero cloud uploads, zero watermarks, 100% private'
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

// Fallback high-quality copies for each site with clean visual line breaks
const BACKUP_POSTS = {
  tranvas: [
`modern startup playbook:
- raise $10M seed round
- slap an AI wrapper on a to-do list
- lock dark mode behind "Enterprise" demo
- founder crying selfie on linkedin

meanwhile, we built a fast, unified life OS that actually works:
👉 tranvas.com`,

`You don't have ADHD.

You just have 14 different apps pinging you for habits, water, to-dos, and laundry while charging $90/mo.

Consolidate your brain before you burn out:
👉 tranvas.com`,

`The productivity industry convinced everyone that organizing your life requires a 4-hour Notion setup and 5 monthly subscriptions.

It doesn't. Keep it unified and lean:
👉 tranvas.com`,

`Why pay $90/month across 7 bloated apps?

One lean, unified life OS handles all your habits, priorities, and daily tasks in one clean screen.

No fluff, zero bloat:
👉 tranvas.com`,

`Software in 2004:
- Ran locally on your machine
- You owned it forever

Software in 2026:
- 7 fragmented subscriptions
- $90/mo just to remember your morning routine

Reclaim software sanity:
👉 tranvas.com`,

`Tired of opening 15 tabs and logging into 3 different project apps before you even start working?

One unified Life OS to rule them all:
👉 tranvas.com`
  ],
  solvemymedia: [
`VCs gave startups $30M to make you:
- Wait in a 15-minute cloud queue
- Sign in with Google
- Pay $20/mo just to cut a 5-second video

We made it run locally in browser RAM via WebAssembly in 0.4s. Zero uploads:
👉 solvemymedia.com/cut-video`,

`SaaS converters:
"Upload your 2GB video, wait 10 mins, and enter your credit card to download without a watermark the size of Texas."

That's not a business model, that's extortion.

100% in-browser WebAssembly. Zero uploads:
👉 solvemymedia.com/cut-video`,

`Friendly reminder:
Your browser is a supercomputer running on multi-core silicon.

Stop beaming confidential 4K video to remote cloud servers just for a trim.

0.4s local cuts in RAM:
👉 solvemymedia.com/cut-video`,

`Cloud video trimmer:
45s upload + 2 min queue + 30s encode = 3+ minutes wasted.

Local browser WASM:
0.3s instant split directly in RAM. Zero network latency:
👉 solvemymedia.com/cut-video`,

`Unpopular opinion:
90% of online video trimmers only have a cloud backend so they can justify charging you $20/mo and harvesting your video files.

Run it client-side with zero tracking:
👉 solvemymedia.com/cut-video`,

`Nothing gives me more rage than trimming a clip on a "free online tool" only to get hit with:

"Upgrade to Pro for $19.99 to remove watermark" at 99%.

Never again. 100% free WASM:
👉 solvemymedia.com/cut-video`
  ],
  createmyqr: [
`Restaurant owners:
If you used a "free QR generator", go scan your printed menus now.

Massive scam where free QRs expire after 30 days and demand $39/mo ransom.

Use permanent, ISO-standard static QR codes that never expire:
👉 createmy-qr.com`,

`Modern tech startup:
- Raised $6M Seed round
- 12 Kubernetes clusters on AWS
- Price: $49/mo (Book a 30-min demo)

CreateMyQR:
- $0 funding, zero bloat
- 100% client-side in browser
- 37 tools free forever:
👉 createmy-qr.com`,

`Why does generating a WiFi QR code need an "annual enterprise billing plan"?

Built a suite of 37 barcode & QR tools running client-side in your tab because charging for this is ridiculous:
👉 createmy-qr.com`,

`The subscription economy has lost its mind.

Imagine paying $39/mo just so your printed business card QR code doesn't 404.

Keep your QR codes 100% permanent and client-side:
👉 createmy-qr.com`,

`Average SaaS stack:
Next.js -> Redis -> Cloudflare -> S3 -> Python microservice just to draw black and white squares.

Here is 40 lines of client-side JS doing it in 5ms:
👉 createmy-qr.com`,

`Client-side static QR & barcode suite:
- 37 tools
- Zero cloud servers
- Zero expired codes
- ISO/IEC compliant

Don't pay monthly rent for simple math:
👉 createmy-qr.com`
  ],
  helpmyimg: [
`SaaS founders when they wrap 4 lines of Canvas code into a $29/mo plan with 10 "credits", an email wall, and a 240p export cap:

"We're disrupting tech."

No, you're running a scam. HelpMyIMG runs 100% locally in your browser. No signups, no paywalls:
👉 helpmyimg.com`,

`Math problem:
1 year of paid image converter subscriptions ($240) vs opening your browser and running local WebAssembly for $0.

Crop, compress, convert, remove white pixels offline in RAM:
👉 helpmyimg.com`,

`The modern web:
Click download -> 3 fake buttons -> disable adblock -> enter email -> 240p cap unless you pay $20/mo.

Or just drop your image into an offline tab and get it in 0.2s:
👉 helpmyimg.com`,

`We put humans on the moon with 4KB of RAM.

Yet today's web needs 1.5GB of Docker containers and 4 API calls just to convert an image to WebP.

Pure local browser WASM:
👉 helpmyimg.com`,

`Stop uploading your private family photos or client assets to random cloud compressors.

HelpMyIMG compresses, converts, and crops 100% inside your sandboxed browser RAM:
👉 helpmyimg.com`,

`Paying a corporation $20/mo just to delete white pixels from a JPG or convert PNG to WebP?

Absolute madness. Zero accounts, zero uploads, runs in browser RAM:
👉 helpmyimg.com`
  ],
  handlemyfile: [
`Humans landed rovers on Mars, yet pay Adobe $240/yr to delete 1 PDF page.

Stop the suffering. HandleMyFile is a free in-browser suite: compress, merge, OCR, e-sign & convert in local RAM via WASM.

0 cloud uploads:
👉 handlemyfile.com`,

`Startups in 2026:
"We raised $12M to put an AI chatbot on a PDF reader! Join our waitlist!"

Me:
0 VC money, 0 waitlists, 0 fluff. Compress, merge, OCR, e-sign in local RAM via WASM. 100% free:
👉 handlemyfile.com`,

`Reminder:
When a "free" cloud converter asks you to upload your tax returns or contracts to compress a PDF, that file lives on their S3 bucket forever.

HandleMyFile processes everything in sandboxed local RAM:
👉 handlemyfile.com`,

`In 2004, software ran locally and you owned it.
In 2026, you lease permission to view a PDF for $20/month.

Reclaim local-first computing for your documents:
👉 handlemyfile.com`,

`Need to merge 2 PDFs, compress a report, or e-sign a doc?

Don't enter your credit card for a 7-day trial that bills $180.

100% in-browser WebAssembly suite:
👉 handlemyfile.com`,

`Why stream confidential company agreements to an offshore server just to OCR or convert them to Word?

Keep your sensitive files on your machine:
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

  // Try generating via Gemini with timeout
  try {
    const allKeys = await getAllGeminiKeys();
    const validKeys = allKeys.filter(k => k.startsWith('AIza'));
    const keysToUse = validKeys.length > 0 ? validKeys : allKeys;

    if (keysToUse.length > 0) {
      for (const apiKey of keysToUse.slice(0, 2)) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash'
          });
          const prompt = `
You are a sharp, witty, anti-VC, pro-open-web indie developer posting on Bluesky.
Your tone is cynical, intelligent, humorous, and tech-native. You hate subscription fatigue, bloated VC startups, and privacy-violating cloud apps.

TARGET PRODUCT:
- Name: ${site.name}
- URL: ${site.url}
- Pain point: ${site.pain}
- Solution: ${site.solution}

COPYWRITING FRAMEWORK:
- Angle: "${framework.name}"
- Instruction: ${framework.instruction}

CRITICAL RULES:
1. USE VISUAL WHITE SPACE & LINE BREAKS (CRITICAL): Do NOT output a single wall of text! Structure your output with clean line breaks:
   - Hook / opener on line 1
   - Blank line (\\n\\n) before contrast or bullet points
   - Bullet points indented with single line break (\\n- )
   - The link MUST be on its own line at the end: \\n👉 ${site.url}
2. STRICT LENGTH: Absolute maximum of 280 characters TOTAL (including newlines and the URL). Bluesky has a strict 300-char limit.
3. NO HASHTAGS: Absolutely ZERO hashtags (#).
4. NO HTML: Output plain text only.
5. NO GENERIC AI FLUFF: Write like a real developer/hacker who actually built this. Keep it punchy, cynical, and memorable.

Output ONLY the final post text, nothing else.`;

          const res = await withTimeout(model.generateContent(prompt), 6000);
          let text = res.response.text().trim();
          text = text.replace(/^["']|["']$/g, '').trim();
          
          // Clean up stray hashtags and horizontal spaces, but PRESERVE NEWLINES!
          text = text.replace(/#\w+/g, '')
                     .replace(/[ \t]+/g, ' ')
                     .replace(/\n{3,}/g, '\n\n')
                     .trim();

          // Ensure URL is present on its own line
          if (!text.includes(site.url)) {
            text = `${text}\n👉 ${site.url}`;
          }

          // Ensure length is valid
          if (text.length >= 60 && text.length <= 295) {
            console.log(`[Bluesky-Khaithisran] Generated via Gemini for ${site.name} [Framework: ${framework.name}] (${text.length} chars)`);
            return text;
          }
        } catch (modelErr) {
          console.warn(`[Bluesky-Khaithisran] Gemini key attempt error:`, modelErr.message);
        }
      }
    }
  } catch (err) {
    console.error('[Bluesky-Khaithisran] Gemini generation error, using curated backup:', err.message);
  }

  // Backup pool fallback
  const siteBackups = BACKUP_POSTS[site.key] || BACKUP_POSTS.tranvas;
  const chosenBackup = siteBackups[Math.floor(Math.random() * siteBackups.length)];
  console.log(`[Bluesky-Khaithisran] Used curated backup for ${site.name}`);
  return chosenBackup;
}
