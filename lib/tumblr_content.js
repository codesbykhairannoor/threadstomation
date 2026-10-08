import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';
import { getRandomCtaPrefix, sanitizeAndVaryUrl } from './stealth_reach_engine.js';

export const TARGET_WEBSITES = [
  {
    key: 'tranvas',
    name: 'Tranvas - Unified Life OS',
    url: 'https://tranvas.com',
    coverImage: 'https://raw.githubusercontent.com/codesbykhairannoor/threadstomation/main/public/covers/tranvas-cover.png',
    niche: 'Unified Life OS (Planner, Daily Habits, Personal Finance, Journal, Goals, Calendar)',
    pain: 'Paying $90/month across 7 fragmented apps just to remember drinking water and doing laundry; 42 browser tabs open draining 800MB RAM each; pastel Notion database hell that breaks on mobile',
    solution: 'Fast, unified, instantaneous Life Operating System with zero VC fluff, zero subscription bleed, and zero corporate bloatware',
    baseTags: ['studyblr', 'productivity', 'life os', 'free tools', 'webdev', 'adulting', 'adhd productivity', 'tech rant', 'tranvas']
  },
  {
    key: 'solvemymedia',
    name: 'SolveMyMedia - In-Browser Media Suite',
    url: 'https://solvemymedia.com',
    coverImage: 'https://raw.githubusercontent.com/codesbykhairannoor/threadstomation/main/public/covers/solvemymedia-cover.png',
    tools: [
      { key: 'compress', name: 'In-Browser Video Compressor', url: 'https://solvemymedia.com/compress-video', pain: '4K videos hitting 500MB cloud upload limits, 20-min queues, and $15/mo subscriptions', solution: 'Hardware-accelerated browser compression via WebGPU/WebCodecs, zero file size caps' },
      { key: 'convert', name: 'Video & Audio Converter', url: 'https://solvemymedia.com/convert-video', pain: 'Paying monthly SaaS subscriptions just to convert MOV to MP4 or MKV without sketchy adware', solution: '100% client-side FFmpeg WebAssembly running locally in browser memory' },
      { key: 'transcribe', name: 'Local AI Speech-to-Text', url: 'https://solvemymedia.com/transcribe', pain: 'Sending confidential client audio, podcasts, or meeting records to remote cloud APIs', solution: 'Neural speech-to-text running 100% inside your browser CPU with zero server uploads' },
      { key: 'recorder', name: 'Screen & Camera Recorder', url: 'https://solvemymedia.com/recorder', pain: 'Paying Loom $12/mo just to record quick screen demos with cloud surveillance', solution: 'Private in-browser recording studio saving directly to your local drive' },
      { key: 'audiostrip', name: 'Video to Audio Extractor', url: 'https://solvemymedia.com/video-to-audio', pain: 'Downloading sketchy desktop adware apps just to extract MP3 from video', solution: 'Strip MP3/WAV from video directly in your browser tab in 0.3 seconds' },
      { key: 'gif', name: 'Video to GIF Creator', url: 'https://solvemymedia.com/create-gif', pain: 'Pixelated 10fps GIFs stamped with huge watermarks on "free" converter sites', solution: 'High-framerate client-side GIF generator with 0 watermarks and 0 signups' },
      { key: 'cut', name: 'Lossless Video Trimmer', url: 'https://solvemymedia.com/cut-video', pain: 'Uploading 500MB over Wi-Fi, waiting 15 minutes in a queue, paying $25/mo or getting a giant blurry watermark stamped on your face just to cut 3 seconds of video', solution: '0.4s instant stream copy in client-side RAM via WebAssembly with zero uploads' },
      { key: 'generic', name: 'SolveMyMedia All-in-One Media Suite', url: 'https://solvemymedia.com', pain: 'Paying 5 different SaaS subscriptions totaling $80/mo just to cut, compress, convert, and transcribe media', solution: '100% free client-side WebAssembly workstation for all audio and video processing' }
    ],
    pain: 'Uploading gigabytes of private media to remote cloud servers, paying monthly SaaS subscriptions, waiting in queues, and suffering 99% export paywalls',
    solution: '100% in-browser WebCodecs & WebAssembly processing: compress, convert, transcribe, and edit audio/video directly in your device RAM',
    baseTags: ['free tools', 'video editing', 'useful websites', 'privacy', 'web development', 'webassembly', 'tech humor', 'solvemymedia']
  },
  {
    key: 'createmyqr',
    name: 'CreateMyQR - 37 Client-Side QR Tools',
    url: 'https://createmy-qr.com',
    coverImage: 'https://raw.githubusercontent.com/codesbykhairannoor/threadstomation/main/public/covers/createmy-qr-cover.png',
    niche: '37 Client-Side QR & Barcode Tools (ISO/IEC 18004 Compliant)',
    pain: 'Predatory "free" QR generators that silently expire printed restaurant menus and business cards after 14 days, demanding $45/mo ransom; running 20 AWS microservices just to render a 1994 high-school math equation',
    solution: '37 permanent client-side QR & barcode utilities: WiFi WPA3, vCard, WhatsApp, barcode generators, infinite-resolution vector SVG export, 100% offline in browser canvas with zero tracking',
    baseTags: ['free tools', 'useful websites', 'webdev', 'developer tools', 'dark patterns', 'open source', 'tech humor', 'createmyqr']
  },
  {
    key: 'helpmyimg',
    name: 'HelpMyIMG - In-Browser WASM Image Suite',
    url: 'https://helpmyimg.com',
    coverImage: 'https://raw.githubusercontent.com/codesbykhairannoor/threadstomation/main/public/covers/helpmyimg-cover.png',
    niche: 'In-Browser Image Suite & AI Background Removal via WebAssembly',
    pain: 'Uploading private family photos or client assets across oceans just to delete white pixels, only to be told "You have 0 credits remaining, enter credit card for $20/mo"',
    solution: '100% client-side WebAssembly execution: background removal, image compression, crop, combine, split, format conversion, zero server uploads, zero paywalls',
    baseTags: ['free tools', 'useful websites', 'photography', 'image editing', 'privacy', 'web development', 'anti capitalism', 'helpmyimg']
  },
  {
    key: 'handlemyfile',
    name: 'HandleMyFile - In-Browser PDF & Document Workstation',
    url: 'https://handlemyfile.com',
    coverImage: 'https://raw.githubusercontent.com/codesbykhairannoor/threadstomation/main/public/covers/handlemyfile-cover.png',
    niche: 'In-Browser Document & PDF Workstation via WebAssembly',
    pain: 'Surrendering $240/year to Adobe just to rotate a PDF page 90 degrees, paying DocuSign $480/yr to draw a signature, and beaming confidential tax records to unencrypted cloud S3 buckets comforted by "we delete in 2h ;)"',
    solution: '100% free in-browser workstation: compress 100MB PDF to 5MB in RAM, client-side e-signatures, WASM OCR text extraction, PDF ⇄ Word/Excel conversion, metadata scrubber, works completely offline',
    baseTags: ['useful websites', 'free tools', 'studyblr', 'productivity', 'privacy', 'adobe', 'webassembly', 'handlemyfile']
  }
];

// ── 7 DIVERSE TUMBLR NARRATIVE ARCHETYPES ──────────────────────────────────────
export const TUMBLR_ARCHETYPES = [
  {
    key: 'everyday_tragedy',
    name: 'The Relatable Everyday Tragedy (Gaya "Dog Sneezing")',
    instruction: `Write a hilarious, relatable, and deeply frustrated personal rant about how an absurdly simple everyday task became an agonizing modern SaaS nightmare.
Structure:
- Opening: "The absolute state of wanting to [simple task] in the year of our Lord 2026." / "All I wanted to do was [simple task, e.g. trim 3s of dog sneezing, rotate 1 page of a tenancy agreement, print a bakery menu]. That is literally it."
- Escalation: Detail the absurd gauntlet: 4 cookie popups, entering work email & job title, uploading 500MB over Wi-Fi, waiting at queue #82 in a cloud server in Northern Virginia, receiving a giant blurry watermark stamped on the output, and being prompted to pay $29.99/mo for Pro.
- Emotional Climax: Capslock existential outrage ("WHY ARE WE UPLOADING FILES TO CLOUD SERVERS IN 2026 FOR BASIC MATH?!").
- Relief / Resolution: Introduce the client-side WebAssembly solution running locally in browser RAM with zero uploads, zero paywalls, zero accounts.
- Include raw link with an emoji.
- Tone: Informal, unhinged, relatable, comedic internet storytelling.`
  },
  {
    key: 'silicon_valley_satire',
    name: 'Corporate Satire / A Love Letter to Modern Startups (Gaya Post #6)',
    instruction: `Write a razor-sharp, satirical "love letter" roasting Silicon Valley tech startups and VC absurdity.
Structure:
- Opening: "A Love Letter to Modern Startups Charging $40/Month for a ChatGPT Wrapper" or "Congratulations to Silicon Valley."
- Escalation: Roast the absurd startup tropes: turning a simple utility into a $20M Series A funding announcement, a landing page with 6 floating 3D glass spheres that make laptop fans sound like an F-16 jet engine, a "Book a 30-minute discovery call" button just to see a calendar view, 85 employees, 12 VPs of Growth Marketing, 4 Chief Synergy Officers, and an AI chatbot that crashes if Wi-Fi drops for 3 seconds.
- Resolution: "We refused to build that circus." Introduce the tool built on zero VC funding that actually respects the user's intelligence and privacy.
- Include raw link.
- Tone: Cynical, sophisticated deadpan satire, anti-corporate.`
  },
  {
    key: 'mock_script_dialogue',
    name: 'Mock Script / Theatre of the Absurd (Format Naskah Percakapan)',
    instruction: `Write an absurd, rapid-fire mock script / dialogue between an ordinary human and an aggressive modern SaaS company.
Structure:
- Opening: "A totally non-dramatized transcript of attempting to [task] in 2026:"
- Dialogue:
  ME: [States ultra-simple request, e.g. "I would like to draw a square with black dots so people can see my cafe menu."]
  SAAS STARTUP: [Replies with ridiculous corporate buzzword jargon and exorbitant enterprise pricing, e.g. "That is an AI Spatial Omnichannel Synergy Gateway™. That will be $49/month per seat, billed annually."]
  ME: [Points out the technical reality, e.g. "It's an ISO spec from 1994. It's literally just basic geometry."]
  SAAS STARTUP: [Escalates to booking an aggressive discovery Zoom call with a Customer Success Manager named Chad.]
  ME: [Stares into the void, closes the tab, and uses the client-side tool instead.]
- Wrap-up: "Stop letting software cartels hold your life hostage: 👉 [URL]"
- Tone: Fast-paced comedic script, theatrical absurdity, highly rebloggable.`
  },
  {
    key: 'nostalgia_regression',
    name: 'Internet 2002 vs Dystopia 2026 (Komparasi Nostalgia)',
    instruction: `Write a thoughtful and cynical comparison between the golden era of owning software in the 2000s vs the extractive subscription hell of 2026.
Structure:
- Contrast:
  In 2002: You bought software on a CD-ROM or downloaded a 3MB executable. It ran offline on a Pentium III computer. You owned it forever. No accounts. No tracking. No telemetry.
  In 2026: You buy a $2,500 laptop with multi-core silicon transistors capable of quantum physics, yet to [task, e.g. delete a PDF page or compress a video], you pay $240/yr tribute to a digital cartel or beam tax records to a server farm in Virginia on a promise of "we delete in 2h ;)".
- Philosophical Insight: Humanity didn't advance; we just let ourselves be converted into monthly recurring revenue streams.
- Resolution: Take back control with local client-side software running in browser RAM via WebAssembly.
- Include raw link.
- Tone: Nostalgic, thoughtful, anti-subscription manifesto.`
  },
  {
    key: 'dark_pattern_autopsy',
    name: 'Dark Pattern Autopsy / Investigative Exposé',
    instruction: `Expose and dissect the predatory psychological dark patterns used by "free" online converter and utility sites.
Structure:
- Opening: "The modern SaaS playbook for 'free' online tools is borderline criminal extortion:"
- The 5-Step Trap:
  1. Slap "100% FREE" on Google search results.
  2. Lure the unsuspecting user into uploading their confidential documents/client video.
  3. Trap the processed result behind a mandatory account creation wall.
  4. Demand credit card details for a "free 7-day trial" that secretly auto-renews at $180/year.
  5. Make cancellation require navigating a 20-minute labyrinth with an unhelpful AI chatbot.
- Verdict: Keep your money and your privacy. Client-side WebAssembly tools never touch an external server.
- Include raw link.
- Tone: Serious consumer advocacy, sharp expository critique.`
  },
  {
    key: 'sci_fi_alien',
    name: 'Intergalactic Observation Log (Format Komedi Fiksi Ilmiah)',
    instruction: `Write an official extraterrestrial surveillance report or alien field log (like Commander Zorblax or Commander Vorp) evaluating Earth's technological state.
Structure:
- Header: "🛸 DECLASSIFIED ALIEN REPORT / INTERGALACTIC EXPEDITION LOG"
- Observation: Extraterrestrial officers observing that humans carry 16-billion-transistor pocket supercomputers, yet transmit files across planetary oceans to remote cloud warehouses and pay monthly paper currency just to [task].
- Reaction: Second-hand embarrassment, smashing communicators, or postponing First Contact / turning the ship around.
- Anomaly: Except for one tool built by humans that executes 100% locally in browser RAM via WebAssembly.
- Include raw link.
- Tone: Sci-fi satire, dry bureaucratic alien humor.`
  },
  {
    key: 'community_reblog_prompt',
    name: 'Tumblr Community Reblog Prompt (Pemicu Interaksi Viral)',
    instruction: `Write a sharp, conversational Tumblr post that directly invites the tech/productivity community to share their worst experiences.
Structure:
- Opening: "Tumblr question for anyone who uses a computer for work or creative projects:"
- Brief relatable rant highlighting how absurd SaaS pricing and cancellation traps have become.
- Direct Reblog Call to Action: "Reblog with the most absurd financial ransom or hostage situation a software company has ever put you through."
- Showcase the free, client-side, local alternative.
- Include raw link.
- Tone: Warm, communal, engaging, conversation-starting.`
  }
];

// ── PROVEN TUMBLR VIRAL BACKUP POSTS (USER-TESTED GOLD STANDARD) ──────────────
const BACKUP_POSTS = {
  tranvas: [
    `A Love Letter to Modern Startups Charging $40/Month for a ChatGPT Wrapper

Congratulations to Silicon Valley.

You have successfully taken the concept of "I want to write down what I need to do today" and turned it into:
• A $20 million Series A funding announcement.
• A landing page with six 3D floating glass spheres that make my laptop fan sound like a jet engine preparing for takeoff.
• A "Book a 30-Minute Discovery Call" button to unlock a calendar view.
• An AI chatbot named 'Aura' that misinterprets "buy groceries" and adds "existential dread" to your calendar instead.

Look at the modern tech startup.
They have 85 employees, 12 Vice Presidents of Growth Marketing, 4 Chief Synergy Officers, and zero working features that don't crash when you lose Wi-Fi for three seconds.

They don't want to solve your disorganization. They want your monthly recurring subscription so they can buy kombucha kegs for their office and post humblebrags on LinkedIn.

We refused to build that.

We built Tranvas because we wanted a Life OS that actually respects your intelligence.
Planner, Daily Habits, Personal Finance, Journal, Goals, and Calendar—integrated into one clean, instantaneous workspace. No pitch decks. No sales reps sliding into your DMs. Just an ironclad tool to run your daily life.

Say no to the demo calls. Cut the strings.
🔗 The Real Life OS: https://tranvas.com

#tech startups #silicon valley #venture capital #productivity #adhd productivity #studyblr #studytwt #adulting #tranvas #software #funny`,

    `Alien Intercept Log #4092: The Extinction Event Known as "Productivity Apps"

We traveled three hundred light-years across the Orion Arm to observe the apex species of Earth.
We expected a civilization of sovereign intellect.

Instead, our telescope intercepted a 24-year-old human crying softly in the dark because their $40 Notion template refused to sync their daily habit of "drink 2 liters of water" with their Google Calendar.

Look at how you live.
You have landed probes on Mars, but you need:
• One app with pixelated swords to convince your brain to floss.
• One app that charges you $14/month to tell you that you spent too much money on iced lattes.
• One task manager with 63 overdue red banners from three winters ago.
• Forty-two browser tabs open simultaneously, each draining 800MB of RAM, just so you can pretend you'll read an article about "morning routines" later.

You do not have a productivity system. You are a hostage in a digital circus of monthly recurring bills.
The Galactic Council looked upon your screen and wept.

We built Tranvas to end the embarrassment.
Planner, Daily Habits, Personal Finance, Journal, Goals, and Calendar—unified into one ironclad, instantaneous Life Operating System. No pastel database hell. No subscription bleed. Just sovereign clarity over your daily reality.

Close the forty-two tabs. Cut the strings.
🔗 The Unified Life OS: https://tranvas.com

#aliens #first contact #sci fi humor #productivity #adhd productivity #studytwt #studyblr #adulting #tranvas #digital wellbeing #minimalism`
  ],

  solvemymedia: [
    `The absolute state of wanting to trim a 5-second video in the year of our Lord 2026.

All I wanted to do was cut the first 3 seconds off a video of my dog sneezing. That is literally it. Three seconds of dog footage.

In the ancient times, you could just trim a file. But today? Today, you search for a video trimmer and encounter the Modern SaaS Startup™ Experience:

1. Page loads: Bombarded by 4 popups asking for my work email, cookies, and consent to sell my soul.
2. The Upload: "Uploading your 200MB video to our AI-Powered Neural Cloud Engine™…" (My fans are screaming. My Wi-Fi is crying).
3. The Hostage Situation: "You are #78 in the queue. Estimated wait time: 18 minutes. Want instant processing? Upgrade to Pro for only $29.99/month!"
4. The Final Insult: After waiting 20 minutes, they slap a gigantic blurry watermark right on top of my dog's face and ask me to sign in with LinkedIn to download the 720p version.

WHY ARE WE UPLOADING VIDEOS TO CLOUD SERVERS IN 2026 JUST TO CUT THEM?!

Your laptop has more processing power than the Apollo 11 moon mission. Slicing a video file doesn't require a server farm in Virginia—it literally just takes moving bitstream pointers in your browser's RAM.

So we built SolveMyMedia:
✨ Zero cloud uploads: Your video never touches the internet. Ever.
⚡ Instant WebAssembly engine: Trims and cuts your video in literally 0.4 seconds flat.
🛡️ 100% Private & Air-gapped: Disconnect your Wi-Fi, it STILL works.
🚫 No accounts, no paywalls, no watermarks. Just drag, cut, download.

Stop letting VC-backed startups hold your memes hostage:
👉 Cut Video Tool: https://solvemymedia.com/cut-video
👉 All Free Browser Tools: https://solvemymedia.com

#tech rant #saas #video editing #webassembly #free tools #internet humor #web development #solvemymedia #literally me`,

    `DECLASSIFIED ALIEN REPORT: Why Extraterrestrials Refuse to Make First Contact with Earth’s SaaS Industry 🛸

Galactic Federation Scouting Vessel #808
Officer: Commander Zorblax
Mission: Determine if Earth is ready for intergalactic technology exchange.
Verdict: ABSOLUTELY NOT.

Here is what Commander Zorblax witnessed after monitoring an Earthling’s screen for 30 minutes:

The human had a device equipped with silicon microchips containing billions of microscopic transistors. This little aluminum rectangle has more computational power than the navigational computers that guided our starfleet past the Andromeda nebula.

The human wanted to do something very simple: cut the first 4 seconds off a video clip.
Did the human’s device simply slice the file? No. Instead, the human visited a website called something like QuickCloudVideoAiSynergyTrimmer.io.

What followed caused our science officer to faint:
🛸 Sensor 1: The website demanded the human create an account, verify their email, and input their job title. (Why does a video cutter need to know you are an Associate Product Manager?!)
🛸 Sensor 2: The human initiated an "Upload". Our sensors detected 500 Megabytes of light pulses travelling across the Earth’s atmosphere into a concrete server farm in Virginia.
🛸 Sensor 3: A loading bar appeared: "You are #82 in the server queue. Want instant processing? Upgrade to Pro for $29/month!"
🛸 Sensor 4: After 14 Earth minutes, the file downloaded… with a massive neon watermark stamped across the human’s face.

Commander Zorblax smashed his communicator in second-hand embarrassment.
"Is there any intelligent life on that planet?"

Yes. Exactly one group of Earthlings who realized this entire "Cloud SaaS" model is an absolute scam and built SolveMyMedia.
They said: "Hey, what if we stop uploading files to remote servers and just run FFmpeg inside the browser using WebAssembly?"

The result:
✨ Zero Cloud Uploads: Your media never leaves your device’s RAM.
⚡ 0.4 Second Cuts: Stream demuxing happens natively on your own CPU in the blink of an eye.
🛡️ Air-Gapped Privacy: You can turn off your Wi-Fi router and the video trimmer still works flawlessly.
🚫 No Accounts. No Subscriptions. No Watermarks.

If an alien species visits tomorrow, don't show them cloud subscription pricing pages. Show them client-side WebAssembly:
👉 https://solvemymedia.com/cut-video

#aliens #tech humor #saas #video editing #webassembly #privacy #internet culture #solvemymedia #developer humor`,

    `The Absurdity of Cloud Video Compressors Demanding $19.99/mo for 4K Files

"Your file exceeds the 500MB free limit. Upgrade to Pro to continue processing."

I am staring at my laptop screen in disbelief.
My laptop has an 8-core CPU, dedicated GPU acceleration, and 16 gigabytes of unified memory. It can render 3D raytraced shadows in real-time.

Yet a random website wants me to beam a 4K video across trans-oceanic cables, wait 25 minutes in a cloud queue, and pay twenty dollars a month just so an Amazon EC2 instance can run an encoding script that my own GPU could finish in under 30 seconds.

We built the In-Browser Video Compressor on SolveMyMedia to kill this madness:
✨ Hardware-Accelerated WebCodecs: Encodes video directly using your device's native GPU/CPU.
⚡ Zero File Size Caps: 500MB, 2GB, 8GB—compress as much as your device RAM can hold.
🛡️ Zero Cloud Uploads: Your footage never leaves your machine. Disconnect your internet, it still works.
🚫 100% Free, zero watermarks, zero accounts.

Stop paying monthly ransom on your own GPU:
👉 https://solvemymedia.com/compress-video

#video editing #webassembly #tech rant #privacy #free tools #filmmaking #content creator #solvemymedia`,

    `Beaming Confidential Audio to Cloud APIs for Transcripts is a Nightmare

Picture this:
You have a 45-minute recording. It's a confidential client interview, a private therapy session, or an unreleased podcast episode.
You need a transcript.

So you search Google, and every single "AI Speech-to-Text" tool says:
"Drop your audio file here! (We will upload it to our unencrypted cloud data warehouse, transcribe it, and hold it on our S3 buckets forever 😉)."

Why are we sending our voices across the globe for basic speech recognition?
Neural transformer speech-to-text models can run 100% locally inside your browser tab using WebAssembly and WebGPU.

We built Local AI Transcribe on SolveMyMedia:
🎙️ 100% On-Device Neural AI: Runs whisper models directly on your CPU/GPU.
🛡️ Air-Gapped Confidentiality: 0 bytes of your voice ever touch a remote server.
⚡ Unlimited Minutes: No 5-minute free trial tricks. No credit card required.
🚫 Zero subscriptions, zero tracking.

Keep your voice private:
👉 https://solvemymedia.com/transcribe

#ai #privacy #speech to text #webassembly #cybersecurity #tech #open source #podcasting #solvemymedia`,

    `Why Pay Loom $12/Month Just to Record a 2-Minute Screen Demo?

The modern software landscape has convinced people that capturing a browser window and microphone requires an enterprise SaaS subscription.

"Welcome to Loom Pro! That will be $12/month per creator. If you stop paying, we will delete your demo videos after 14 days!"

It's a screen recording. Modern browsers have had the native MediaRecorder API built-in since 2016. It takes zero servers to save a video stream to a local MP4 or WebM file.

SolveMyMedia Screen & Camera Studio:
🎥 Record screen, webcam, mic, or both simultaneously.
💾 Instant Local Download: Video renders directly to your hard drive with zero server surveillance.
🚫 No 5-minute video caps, no recurring bills, no team workspace paywalls.

Record without cloud surveillance:
👉 https://solvemymedia.com/recorder
👉 Complete WASM Suite: https://solvemymedia.com

#productivity #software #tech rant #webdev #free tools #screen recorder #privacy #solvemymedia`
  ],

  createmyqr: [
    `Intergalactic Expedition Log #8492: We arrived at Earth only to discover their species pays monthly subscriptions to keep printed paper working

Aboard the Zorgon-9 Galactic Scout Cruiser, orbiting Sector 4 (Earth).

COMMANDER VORP: "Report, Science Officer Xylar. Have the bipedal primates achieved planetary enlightenment? Are they ready for the Galactic Federation?"

XYLAR: "Negative, Commander. While they have split the atom and constructed quantum sensors, their digital economy has developed severe cognitive decay."

VORP: "Elaborate."

XYLAR: "An Earthling printed a two-dimensional binary pattern on an acrylic stand for their bakery. Fourteen planetary rotations later, a private cloud server hijacked the destination link, demanding $45 of their paper currency per month to unfreeze it."

VORP: (adjusting ocular sensors in horror) "Are the black and white squares sentient? Do they require antimatter fuel to function?"

XYLAR: "No, Commander. It is ISO/IEC 18004, an open public-domain mathematical specification from Earth Year 1994. It is literally just basic geometry and offline Reed-Solomon error correction. They are paying monthly rent on a high school math equation."

VORP: "Set the hyperdrive to reverse. We are abandoning this solar system."

XYLAR: "Wait, Commander! One terrestrial developer resisted the extortion and built CreateMyQR."

VORP: "What makes this software worthy of mercy?"

XYLAR:
• "It runs 100% client-side in the browser thread via Canvas and WebAssembly. Zero cloud hostage servers."
• "Generates permanent static codes that scan indefinitely across physical dimensions."
• "Includes 37 integrated utilities: auto-connecting WiFi (WPA3), vCard contacts, WhatsApp triggers, and linear barcode generators."
• "Exports infinite-resolution vector SVG files with zero corporate watermarks, completely free."

VORP: (sighs) "Cancel orbital bombardment. Perhaps there is hope for this species after all."

Do not disappoint the aliens. Stop paying rent on basic geometry:
👉 https://createmy-qr.com

#aliens #sci fi humor #tech humor #webdev #saas #dark patterns #funny #indie hacker #qr code #space`,

    `A totally non-dramatized transcript of attempting to generate a QR code in 2026:

ME: Hi, I baked some sourdough bread and would like to draw a square with black dots so my neighbors can see my menu.

SAAS STARTUP: Excellent! Welcome to our "AI-Powered Spatial Dynamic Engagement Matrix™". Please enter your corporate work email, company domain, and credit card for your complimentary 7-day trial.

ME: It's just a bakery. In my garage. Can I just have the picture?

SAAS STARTUP: Your Dynamic Smart Link has been provisioned! That will be $49/month per seat, billed annually at $588 upfront.

ME: Wait, what happens if I don't pay?

SAAS STARTUP: In 14 days, your printed bakery signs will redirect your hungry customers to a giant red warning screen demanding they upgrade to our Enterprise Tier!

ME: [Closes tab, opens CreateMyQR]

Here is how software should actually work:
37 QR & barcode tools running 100% in your browser's local JavaScript thread.
Permanent codes. Zero accounts. Zero cloud redirects. Infinite SVG vector downloads for free forever.

👉 https://createmy-qr.com

#web development #software #dark patterns #indie hacker #tech humor #free tools #createmyqr #capitalism`
  ],

  helpmyimg: [
    `Galactic Reconnaissance Report: Why Earth Has Been Denied Entry into the Interstellar Federation

MEMORANDUM TO THE HIGH GALACTIC COUNCIL
SUBJECT: Planetary Species Assessment (Sector 004 - Earth)
STATUS: Severely Underdeveloped / Intellectually Compromised

High Council,
We were prepared to invite humanity to join the Galactic Commonwealth. Their quantum physics and silicon lithography showed immense promise.
Then, our observational drones monitored their software ecosystem.

The Observation:
An Earthling sitting in front of a computing device containing 16 billion transistors desired to remove the gray backdrop from a photograph of their domestic feline.

Instead of directing their local processor to calculate the pixel boundaries, the Earthling engaged in a bizarre planetary ritual known as "The SaaS Subscription":
1. They uploaded their private optical data across trans-oceanic copper cables to a remote energy-draining data warehouse.
2. The remote machine performed 0.04 seconds of basic matrix subtraction.
3. An entity calling itself a "Tech Founder" held the output hostage behind a digital barrier, displaying the message:
“You have used 1 of 1 monthly credits! Upgrade to Pro for 24 Earth Dollars per solar cycle to download in high definition.”

We were stunned. A species with supercomputers in their pockets is voluntarily paying monthly tribute to rent basic arithmetic from third-party overlords.

The Lone Beacon of Sanity: HelpMyIMG
Just before we ordered the orbital cleansing beam, our scanners detected an anomaly: HelpMyIMG.

• True Client-Side Sovereignty: Image segmentation, canvas watermarking, compression, and format conversion execute 100% locally inside the user's browser via WebAssembly.
• Zero Server Extortion: No user photos are beamed to remote servers. No planetary currency is demanded. No "credits" exist.
• Offline Functionality: The Earthling can sever their planetary network cable, and the machine still processes pixels at the speed of local hardware.

We have postponed the asteroid strike to give humanity time to adopt client-side computing:
👉 Universal In-Browser Image Suite: https://helpmyimg.com

#aliens #scifi #space #tech #anti capitalism #web development #humor #free tools #software #funny`,

    `The Anatomy of an Online Image Converter Scam in 2026:

Step 1: Slap "100% Free Transparent PNG Maker" on Google.
Step 2: User uploads a photo of their family or client asset.
Step 3: Website shows a fake spinning wheel for 45 seconds to pretend it's "calculating neural synergies".
Step 4: The trap springs: "To download your photo without a giant red watermark across the middle, please sign in with Google and begin your 7-day Pro trial ($19.99/mo after trial)."
Step 5: The cancellation button is hidden behind a 4-step survey and a 20-minute chat queue.

Disgusting.

Basic pixel manipulation shouldn't be an extractive subscription racket.
HelpMyIMG runs entirely in sandboxed browser RAM via WebAssembly. Crop, compress, and convert PNG, JPG, and WebP offline in 0.2 seconds with zero server uploads and zero paywalls.

Keep your money:
👉 https://helpmyimg.com

#tech rant #privacy #webassembly #dark patterns #image tools #free software #webdev #helpmyimg`
  ],

  handlemyfile: [
    `Declassified Alien Field Report: The Bizarre Masochism of Human Document SaaS (and the Galactic Cure)

TRANSMISSION LOG // INTERGALACTIC ANTHROPOLOGY DIVISION
SUBJECT: Species 8472 (Humans of Earth)
OBSERVATION: The Tragic Absurdity of Document Software

Our surveillance orbit around Sector 4 has yielded baffling sociological data regarding Earth's technological state:

The Paradox: Humans possess pocket devices powered by multi-core silicon chips containing billions of microscopic transistors.
The Humiliation: Yet, when an Earthling needs to rotate a piece of digital paper by 90 degrees or sign a tenancy agreement, they voluntarily surrender 240 units of fiat currency per solar cycle to a cartel called "Adobe".
The Delusion of Trust: When they attempt to avoid this fee, they beam their classified military contracts, medical dossiers, and tax audits to an unencrypted cloud server in a territory called "Northern Virginia", comforted by a digital banner that reads: "Do not worry human, we promise to delete your files in 120 minutes ;)"
The Hostage Ritual: After surrendering their privacy, they are greeted by a terrifying modal: "You have exhausted your 2 free daily tasks! Surrender your credit card to download your own file!"

Our observation council concluded that humanity’s spirit is being crushed by rent-seeking digital cartels.
We have initiated a technological intervention:
👉 https://handlemyfile.com

What We Deployed to Earth (The Concrete Spec Sheet):
It is a 100% free, zero-server document & PDF workstation that executes entirely inside the human’s local browser memory via WebAssembly (WASM).
• In-RAM Compression: Compress bloated 100MB PDF files down to under 5MB for email attachments.
• Client-Side e-Signatures: Sign legal documents and employment contracts with digital pen signatures—bypassing DocuSign’s $480/year extortion.
• WASM OCR (Text Extraction): Convert blurry photographs of printed documents into selectable text directly on your CPU.
• Two-Way Document Conversions: Convert PDF ⇄ Word (.docx), Excel (.xlsx), and JPG/PNG images.
• Galactic Sanitizer: Erase author metadata, software licenses, revision timestamps, and GPS coordinates before sending files.

The Planetary Air-Gap Test:
Navigate to https://handlemyfile.com, sever your Wi-Fi connection, and process a 50-page document. It functions flawlessly offline because your own machine performs the math, not an Amazon server farm.

Reblog with the most absurd financial ransom you have ever paid to an Earth software company!

#aliens #sci fi #humor #tech #software #adobe #docusign #useful websites #web development #privacy #productivity #free tools`,

    `Tumblr question for anyone who has ever signed an apartment lease, employment contract, or freelance NDA:

Why on Earth did humanity normalize paying $480/year to DocuSign or $240/year to Adobe just to draw our initials on a 1-page PDF?

And when you look for a "free" alternative online, you're literally uploading your confidential tax audits, bank statements, and passport scans to some random startup's unencrypted AWS bucket in Virginia with a promise of "we delete your files in 2 hours ;)"

Your laptop has more computing power than entire supercomputers from twenty years ago. Rotating pages, merging files, and signing documents is just basic byte manipulation. It can happen 100% locally in your browser memory.

We built HandleMyFile so nobody ever has to pay ransom on their own documents again:
• 100% in-browser RAM execution via WebAssembly
• Compress, merge, split, rotate, e-sign, and OCR
• Zero cloud uploads, zero tracking, works offline in Airplane Mode

👉 https://handlemyfile.com

#privacy #cybersecurity #adobe #docusign #tech rant #web development #useful websites #free software #handlemyfile`
  ]
};

const withTimeout = (promise, ms = 25000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AI generation timed out')), ms))
  ]);
};


/**
 * Generates rich, highly rebloggable long-form Tumblr posts with dynamic archetypes
 * @param {string|null} targetSiteKey
 * @returns {Promise<{ caption: string, tags: string[] }>}
 */
export async function generateTumblrPost(targetSiteKey = null) {
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

  // Pick one of the 7 Tumblr narrative archetypes
  const archetype = TUMBLR_ARCHETYPES[Math.floor(Math.random() * TUMBLR_ARCHETYPES.length)];
  console.log(`[Tumblr-AI] Selected Narrative Archetype: [${archetype.name}] for [${site.name}]`);

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

  const variedUrl = sanitizeAndVaryUrl(targetUrl, 'tumblr');
  const ctaPrefix = getRandomCtaPrefix(false);

  // The First 5 Tags Rule: Guarantee top 5 search-indexed keywords lead the array
  const tags = [...site.baseTags];
  if (archetype.key === 'silicon_valley_satire') {
    tags.push('venture capital', 'silicon valley', 'capitalism fatigue');
  } else if (archetype.key === 'everyday_tragedy') {
    tags.push('literally me', 'internet humor', 'stop paying subscriptions');
  } else if (archetype.key === 'mock_script_dialogue') {
    tags.push('comedy', 'dialogue', 'tech humor');
  } else if (archetype.key === 'nostalgia_regression') {
    tags.push('nostalgia', 'software', 'good old internet');
  } else if (archetype.key === 'dark_pattern_autopsy') {
    tags.push('consumer rights', 'cybersecurity', 'dark patterns');
  } else if (archetype.key === 'sci_fi_alien') {
    tags.push('space', 'sci fi humor', 'aliens');
  } else if (archetype.key === 'community_reblog_prompt') {
    tags.push('reblog', 'relatable', 'tell me your thoughts');
  }

  // Deduplicate tags while strictly preserving index order
  const uniqueTags = Array.from(new Set(tags));
  const coverImage = site.coverImage || null;

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
You are a legendary Tumblr creator known for hilarious, deeply cynical, highly articulate, and unhinged tech rants.
Tumblr culture loves: punchy comedic storytelling, relatable everyday suffering, anti-SaaS cynicism, roasting VC hype, and deadpan mock dialogues.
Tumblr strictly despises: bloated walls of corporate text, LinkedIn-style marketing buzzwords, and repetitive ads.

YOUR ASSIGNED NARRATIVE ARCHETYPE FOR THIS POST:
${archetype.instruction}

PRODUCT/TOOL DETAILS:
- Product/Tool Name: ${targetToolName}
- Official Direct Link: ${variedUrl}
- Core Pain Point to Roast: ${targetPain}
- Real Client-Side Solution: ${targetSolution}

CRITICAL TUMBLR VIRALITY RULES:
1. HEADLINE / TITLE: The VERY FIRST line MUST be an eye-catching, provocative, hilarious Title / Headline (plain text, NO markdown # hashes, NO asterisks, under 90 chars).
2. BLANK LINE: Follow the title immediately with a blank empty line before starting the body.
3. LENGTH: Keep it punchy, rhythmic, and mobile-friendly: between 500 and 950 characters (approx 100 - 160 words). NEVER write an overwhelming wall of text. Make every single line count.
4. STRUCTURE: Use short, bite-sized paragraphs (2-3 sentences max) separated by double line breaks so it is effortless to skim on a smartphone screen.
5. FORMAT: Use snappy dialogue lines or comedic escalating bullet points.
6. CALL TO ACTION: End with a punchy conclusion and the direct link: "${ctaPrefix} ${variedUrl}".
7. OUTPUT: Output ONLY the plain text of the post. Do NOT output markdown code blocks.`;

          const res = await withTimeout(model.generateContent(prompt), 22000);
          let text = res.response.text().trim();
          text = text.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '').trim();

          if (!text.includes(variedUrl)) {
            text = `${text}\n\n${ctaPrefix} ${variedUrl}`;
          }

          if (text.length >= 400 && text.length <= 2500) {
            console.log(`[Tumblr-AI] Fresh punchy post generated successfully using [${archetype.name}] (${text.length} chars)`);

            let genTitle = '';
            let genBody = text;
            const lines = text.split('\n');
            const firstLine = lines[0].trim();
            if (firstLine && lines.length > 1 && (lines[1].trim() === '' || firstLine.startsWith('#')) && firstLine.length <= 150) {
              genTitle = firstLine.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
              genBody = lines.slice(lines[1].trim() === '' ? 2 : 1).join('\n').trim();
            }

            return {
              title: genTitle,
              body: genBody,
              caption: text,
              tags: uniqueTags,
              imageUrls: coverImage ? [coverImage] : []
            };
          }
        } catch (modelErr) {
          console.warn(`[Tumblr-AI] Gemini attempt error:`, modelErr.message);
        }
      }
    }
  } catch (err) {
    console.error('[Tumblr-AI] Fallback to curated gold-standard backup:', err.message);
  }

  // Fallback to curated user-tested viral backup post
  const siteBackups = BACKUP_POSTS[site.key] || BACKUP_POSTS.tranvas;
  const chosenBackup = siteBackups[Math.floor(Math.random() * siteBackups.length)];
  console.log(`[Tumblr-AI] Used curated gold-standard backup for ${targetToolName} (${chosenBackup.length} chars)`);

  let backupTitle = '';
  let backupBody = chosenBackup;
  const bLines = chosenBackup.split('\n');
  const bFirstLine = bLines[0].trim();
  if (bFirstLine && bLines.length > 1 && bFirstLine.length <= 150) {
    backupTitle = bFirstLine.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
    backupBody = bLines.slice(bLines[1].trim() === '' ? 2 : 1).join('\n').trim();
  }

  return {
    title: backupTitle,
    body: backupBody,
    caption: chosenBackup,
    tags: uniqueTags,
    imageUrls: coverImage ? [coverImage] : []
  };
}

