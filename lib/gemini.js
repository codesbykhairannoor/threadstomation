import { GoogleGenerativeAI } from '@google/generative-ai';
import sql, { getRecentTopics, saveTopic } from './database.js';
import dotenv from 'dotenv';

dotenv.config();

// --- ROTATION UTILS ---
export async function getAllGeminiKeys() {
  const keys = new Set();

  // 1. Ambil dari Environment Variables (Railway / .env)
  // Kita scan semua yang depannya GEMINI_API_KEY
  Object.keys(process.env).forEach(envKey => {
    if (envKey.startsWith('GEMINI_API_KEY')) {
      keys.add(process.env[envKey]);
    }
  });

  // 2. Ambil dari Database Settings (sebagai cadangan)
  try {
    const rows = await sql`SELECT value FROM settings WHERE key LIKE 'gemini_api_key%' ORDER BY key ASC`;
    rows.forEach(r => keys.add(r.value));
  } catch (_) {}

  return Array.from(keys).filter(v => !!v && v.length > 5);
}

// --- MAIN CONTENT GENERATOR ---
export async function generateThreadsContent(platform = 'threads', imageData = null, customPromptOverride = null, accountId = 1) {
  const apiKeys = await getAllGeminiKeys();

  const globalPromptRow = await sql`SELECT value FROM settings WHERE key = 'prompt'`;
  const accountRow = await sql`SELECT name, master_prompt FROM accounts WHERE id = ${accountId}`;

  const accountName = accountRow[0]?.name || '';
  const masterPrompt = accountRow[0]?.master_prompt || globalPromptRow[0]?.value || 'Share a helpful insight.';

  const isOneformind = accountName.toLowerCase().includes('oneformind');
  const isCaridisini = accountName.toLowerCase().includes('caridisini');
  const isTranvas = accountName.toLowerCase().includes('tranvas');
  const isSharesa = accountName.toLowerCase().includes('sharesa');
  const isEnglish = isOneformind || isCaridisini;

  // Real-time Viral Trend Hunter & Newsjacking (Open-Source GitHub Engine)
  let activeTopic = customPromptOverride;
  try {
    const { getNewsjackedAngle } = await import('./trend_hunter.js');
    activeTopic = await getNewsjackedAngle(accountName, masterPrompt, customPromptOverride, isEnglish);
  } catch (trendErr) {
    console.warn('[Gemini] Trend Hunter fallback:', trendErr.message);
  }

  const specificTask = activeTopic ? `TODAY'S VIRAL TREND & TOPIC ANGLE: ${activeTopic}` : '';

  // DYNAMIC POST FORMAT SELECTION:
  // Randomly alternate between Single Post (~40% chance) and Short Thread (~60% chance)
  // or respect explicit single post request!
  const promptCheck = (customPromptOverride || activeTopic || '').toLowerCase();
  const isSinglePostRequested = isSharesa || 
                                promptCheck.includes('single post') || 
                                promptCheck.includes('1 post') || 
                                promptCheck.includes('satu post') || 
                                promptCheck.includes('bukan thread') || 
                                promptCheck.includes('cuman satu') ||
                                (Math.random() < 0.40);

  // Brand-Specific Viral Architecture (Tranvas & Sharesa Space)
  let hardSellingRules = '';
  if (isTranvas) {
    // --- AFFILIATE PROMO MODE (~20% chance or if topic mentions affiliate) ---
    const topicWantsAffiliate = (activeTopic || '').toLowerCase().includes('afiliasi') || (activeTopic || '').toLowerCase().includes('affiliate') || (customPromptOverride || '').toLowerCase().includes('afiliasi') || (customPromptOverride || '').toLowerCase().includes('affiliate');
    const isAffiliatePost = topicWantsAffiliate || (Math.random() < 0.20);

    if (isAffiliatePost) {
      hardSellingRules = `
VIRAL THREADS BLUEPRINT FOR TRANVAS — MODE: AFFILIATE RECURRING REVENUE:
- TEMA: Bongkar realita program cari duit sampingan. Kebanyakan program bayar komisi 5-10% cuma sekali. Di Tranvas (@tranvas), kita bikin komisi 60% RECURRING bulanan selama 8 bulan (contoh riil: 10 orang langganan = Rp 894.000/bln pasif masuk ke rekening).
- STRICT PRONOUN RULE (WAJIB): DILARANG menggunakan kata "lo" atau "gue/lo"! Gunakan "kita", "kamu", atau langsung sorot masalahnya.
- NO COMMERCIAL SPAM WORDS: Dilarang keras menulis "klik bio", "sebelum promo ditutup", "cuan 24/7", "slot terbatas"!
- ENDING MANDATORY: Selalu akhiri dengan pertanyaan pemantik diskusi/curhat (contoh: "Menurut kalian, kenapa program afiliasi di Indonesia masih jarang banget yang berani kasih komisi recurring bulanan?").
${isSinglePostRequested ? `
- FORMAT 1 SINGLE POST: 1 post padat, to the point, membongkar perbandingan angka program sekali bayar vs recurring 60% Tranvas, ditutup pertanyaan pemantik komentar.
` : `
- FORMAT THREAD (2-4 posts):
  1. POST 1: Hook kontrarian soal cari passive income yang realistis.
  2. POST 2: Bedah matematika recurring 60% bulanan vs sekali bayar.
  3. FINAL POST: Sebut @tranvas secara elegan + lempar pertanyaan pemantik debat di komentar.
`}
`;
    } else {
      hardSellingRules = `
VIRAL THREADS BLUEPRINT FOR TRANVAS (LIFE OS & MINDSET):
- MISI UTAMA: BIKIN POSTINGAN VIRAL YANG MEMICU BANYAK KOMENTAR (REPLIES) & DISKUSI. Algoritma Threads 2025/2026 MENGHUKUM iklan hard-selling, tapi melipatgandakan jangkauan untuk konten yang memicu curhat / debat hangat.
- TONE & PERSONA: Creator @tranvas yang vokal, relate, sedikit sinis pada "SaaS ribet", dan membongkar mitos prokrastinasi modern.
- STRICT PRONOUN RULE (WAJIB): DILARANG KERAS menggunakan kata "lo" atau "gue/lo"! Gunakan kata "kita" (inklusif, rasa senasib, solidaritas), atau "kamu", atau langsung to the point.
- NO COMMERCIAL SPAM WORDS: DILARANG KERAS menulis "klik link di bio", "sebelum promo ditutup", "slot terbatas", "cuan 24/7"!
- ORGANIC MENTION: Sebut @tranvas secara halus sebagai sistem yang kita bangun dari keresahan pribadi, BUKAN sebagai brosur jualan.
- ENDING MANDATORY: Postingan WAJIB diakhiri dengan pertanyaan dilematis / pemantik komentar yang memaksa audiens untuk merespons (misal: "Kalian di tim mana?", "Jujur, siapa yang to-do listnya lebih rapi dari realita hidupnya?").
${isSinglePostRequested ? `
- FORMAT 1 SINGLE POST (Under 450 chars):
  Hook paradoks / satir relate -> Refleksi nyata & konsep 1 Life OS terpadu @tranvas -> Pertanyaan pemantik debat di komentar.
` : `
- FORMAT THREAD (2-4 posts):
  1. POST 1: Thumb-stopping hook (< 10 kata) yang menampar kebiasaan sok produktif / overthinking / app fatigue.
  2. POST 2 (and 3): Uraikan masalahnya secara tajam + selipkan bagaimana konsep @tranvas menyelesaikannya.
  3. FINAL POST: Takeaway berbobot + pertanyaan pemantik komentar yang bikin audiens curhat.
`}
`;
    }
  } else if (isSharesa) {
    hardSellingRules = `
VIRAL THREADS BLUEPRINT FOR SHARESA SPACE — 5 KATEGORI PRODUK & JASA:
- IDENTITAS: Studio teknologi & Web Agency @sharesa.space yang menguasai 5 Kategori Solusi Digital:
  1. JASA WEB DEVELOPMENT (@sharesa.space): Bangun Website Profesional, Landing Page High-Converting, dan Custom Web App instan. Lepas dari jeratan fee admin marketplace 15% & punya 'Rumah Digital' sendiri yang closing otomatis 24 jam.
  2. SolveMyMedia: Kompres video giga ke mega instan via WebCodecs di RAM, potong video 0.4s tanpa re-encoding, transkripsi audio lokal tanpa cloud, screen recorder & GIF.
  3. CreateMyQR: 37 tipe QR Code & Barcode permanen tanpa masa kadaluarsa seumur hidup, anti-scam, tanpa dipalak $39/bulan.
  4. HelpMyIMG: Hapus background AI lokal, kompres, konversi gambar massal tanpa upload ke server luar.
  5. HandleMyFile: Workstation PDF & dokumen via WASM, gabung/pisah/convert PDF privat di RAM tanpa resiko data bocor.
- CORE VALUE: "Kombinasi antara Website Bisnis yang kredibel (@sharesa.space) dan Web Tools canggih berbasis WebAssembly tanpa server upload."
- STRICT FORMAT (MUTLAK): EXACTLY 1 SINGLE POST (Array of EXACTLY 1 string item, e.g. ["Post content..."]). DILARANG KERAS MEMBUAT THREAD BERSAMBUNG!
- KARAKTER: Wajib di bawah 450 karakter.
- ZERO LINK / ZERO DOMAIN RULE (CRITICAL UNTUK BEBAS PENALTI META): DILARANG KERAS menulis nama domain/URL (seperti ".com", ".id", "http") di dalam teks post! Sebut nama brand/tools-nya secara natural (SolveMyMedia, HandleMyFile, CreateMyQR, HelpMyIMG, atau @sharesa.space). Jangan pakai ekstensi .com agar algoritma Meta tidak mendeteksi tautan luar!
- NO COMMERCIAL SPAM WORDS: DILARANG KERAS menulis "slot terbatas", "sebelum promo ditutup", "cuan 24/7", "klik bio"!
- STRUKTUR 1 SINGLE POST:
  1. Hook thumb-stopper tajam (masalah jualan lambat/tanpa web, derita upload file besar, ketakutan privasi data bocor, atau scam QR code kadaluarsa).
  2. Kenalkan solusi sesuai kategori yang sedang dijadwalkan (Jasa Web @sharesa.space atau salah satu dari 4 web tools WASM).
  3. Tutup dengan pertanyaan pemantik diskusi yang relate dan memicu komentar di Threads!
- STRICT PRONOUN RULE (WAJIB): DILARANG KERAS menggunakan kata "lo" atau "gue/lo"! Gunakan kata "kita", "kamu", atau langsung sebut masalahnya.
`;
  }

  // Fetch recent topics to avoid repetition
  let recentTopicsSection = '';
  if (accountId) {
    const recentTopics = await getRecentTopics('post', accountId, 30, 14);
    if (recentTopics.length > 0) {
      recentTopicsSection = `
AVOID REPETITION (CRITICAL): The following topics have been posted recently. You MUST NOT create content that covers the exact same topic or theme. Pick a completely different, fresh angle:
${recentTopics.map((t, i) => `  ${i+1}. ${t}`).join('\n')}
`;
    }
  }

  let platformSpecificRules = '';
  switch(platform.toLowerCase()) {
    case 'bluesky':
      platformSpecificRules = `
- BLUESKY VIRAL STRATEGY: This is a conversational, anti-algorithm platform.
- FORMAT: Output a highly opinionated, conversational thread/hot-take. Be authentic, slightly cynical, or deeply passionate.
- RULES: Do NOT use heavy sales copy or 'engagement bait'. Use exactly 1 or 2 highly relevant keywords/hashtags integrated naturally so it gets picked up by Custom Feeds.
      `;
      break;
    case 'mastodon':
      platformSpecificRules = `
- MASTODON VIRAL STRATEGY: This is a decentralized, chronological, anti-corporate platform. Marketing must be disguised as immense educational or technical value.
- FORMAT: A thoughtful, transparent, community-oriented deep dive.
- HASHTAGS (CRITICAL): You MUST use exactly 3 to 5 CamelCase hashtags at the very end of the post (e.g. #TechTrends #Automation). Mastodon has no text search, so these hashtags are the ONLY way to be discovered.
      `;
      break;
    case 'devto':
      platformSpecificRules = `
- DEV.TO VIRAL STRATEGY: This is a platform for developers. Posts must be high-value technical articles, not short tweets.
- FORMAT: Format as a mini-article using Markdown (e.g., ## Headers, bullet points, code snippets if relevant).
- HOOKS: Use hooks like "How I solved X", "Why X is better than Y", or listicles ("3 Tools for X").
- TONE: Technical, practical, peer-to-peer sharing. Disguise any promotion as a genuine tool recommendation.
      `;
      break;
    default:
      // Threads, Facebook, Instagram
      platformSpecificRules = `
- 2025/2026 META ALGORITHM RULES:
  1. FIRST 0.8 SECONDS RULE: Your opening sentence MUST be an irresistible thumb-stopper (under 12 words). No throat-clearing ("Halo teman-teman", "Today I want to share", "Pernahkah kamu..."). Start immediately inside the action, tension, or paradox.
  2. VIRAL HOOK FRAMEWORKS (Choose the best fit):
     - [A] The Contrarian Paradox: Challenge common dogma. E.g. "To-do lists are designed to keep you busy, not productive." or "Kebanyakan orang gagal bukan karena malas, tapi karena terlalu banyak rencana."
     - [B] The High-Stakes Curiosity Gap: Specific numbers & hidden mechanisms. E.g. "The 1 mental model that saved me 20 hours a week."
     - [C] The Uncomfortable Confession / Vulnerability: Authentic founder/human struggle. E.g. "Spent 4 months building a feature nobody clicked. Here is the brutal lesson:"
     - [D] The Debate Trap: Polarize into 2 camps. E.g. "Is working 14 hours a day dedication, or just poor leverage? Let's settle this."
  3. MOBILE WHITE SPACE & RHYTHM: Use line breaks. Max 1-2 sentences per visual paragraph. Zero monolithic walls of text.
  4. ZERO EXTERNAL LINKS IN POST 1: NEVER include URLs (http/https) in the first post. External links in the main post cause an instant 80% algorithmic downranking!
  5. REPLY DEPTH ENGINE: End the thread with an open, debate-sparking question that forces people to comment. Comments are the #1 ranking factor on Threads!
- ZERO AI CLICHES: Strictly FORBIDDEN: 'Delve', 'Tapestry', 'Game changer', 'In today's fast-paced world', 'Unlock the potential', 'Elevate', 'Look no further', 'Level up', 'Unleash', 'Crucial', 'Pernah gak sih'.
      `;
      break;
  }



  const postFormatInstruction = isSinglePostRequested
    ? `- POST FORMAT (CRITICAL): YOU MUST OUTPUT EXACTLY 1 SINGLE POST (A JSON Array with EXACTLY 1 string item, e.g. ["Post content..."]). DO NOT MAKE A THREAD!
  - Structure: [Masalah nyata/repotnya cara lama to the point] -> [Solusi & BENEFIT konkret langsung di tempat (hemat waktu, rapi, atau cuan)] -> [CTA ke bio atau pertanyaan pemantik].
  - DILARANG KERAS BERTELE-TELE / PUITIS: Dilarang menggunakan metafora abstrak, bahasa puitis, atau kalimat renungan. Langsung tembak benefit riilnya dalam 1 post!
  - Length: Strictly under 450 characters.`
    : `- POST FORMAT: SHORT PUNCHY THREAD (A JSON Array with 2 to 4 strings MAXIMUM):
  - Post 1: Irresistible hook & tension (under 12 words opener).
  - Post 2 (and 3): Core breakdown / practical insight / tangible gain.
  - Final Post: Punchy takeaway + direct CTA / debate question.
  - STRICT MAX LIMIT: Strictly 2 to 4 posts only. NEVER exceed 4 posts!`;

  const platformPrompt = `
You are an ELITE viral ghostwriter and growth engineer for a high-performing ${platform} profile.
Persona / Master Prompt: ${masterPrompt}
Custom account details: ${accountName}

${specificTask}

${hardSellingRules}

STRICT RULES:
- DYNAMIC LANGUAGE (CRITICAL): ${isOneformind || isCaridisini ? 'You MUST output 100% of the content in ENGLISH. No exceptions.' : 'Analyze the language of the persona/master prompt above. If it is in English, you MUST output 100% of the content in English. If it is in Indonesian, you MUST output in Indonesian.'}
- FORBIDDEN PRONOUN "LO" (CRITICAL): DILARANG KERAS menggunakan kata "lo" atau "gue/lo" dalam bahasa Indonesia! Gunakan kata ganti inklusif "kita" (kebersamaan / kita semua), atau "kamu" / langsung sebut masalahnya tanpa kata "lo". Bahasa harus terasa merangkul, profesional, dan tajam!
- Strictly for ${platform.toUpperCase()}. 
- ABSOLUTE CHARACTER LIMIT PER POST: 450 characters.
- ${imageData ? 'IMPORTANT: Analyze the attached image and write a post about it matching your style.' : ''}
- STRICT NO-LINK IN MAIN POST: Do NOT put any URL in the first post. If an external URL is needed, it must go in a subsequent reply string in the array.
- NO POETIC / PHILOSOPHICAL FLUFF (DILARANG PUITIS): Dilarang keras menggunakan gaya puitis, metafora melayang, renungan abstrak, atau kalimat motivasi klise! Tulis secara to-the-point, realistis, dan langsung sebutkan BENEFIT KONKRET.
- OUTPUT FORMAT: You MUST output a valid JSON Array of strings.
${postFormatInstruction}
- SINGLE SPEAKER MONOLOGUE: Every post in the array is written by the SAME person (the account author). You MUST NOT simulate conversations, do not roleplay as commenters, and do not reply to yourself.
- Do NOT output any markdown blocks like \`\`\`json. Output ONLY the raw JSON array.
${recentTopicsSection}
${platformSpecificRules}`;

  const modelNames = [
    'gemini-2.5-flash',
    'gemini-flash-latest'
  ];

  let lastError = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log(`[System-Acc:${accountId}] Using Gemini Key #${i + 1} (Source: ${apiKey.startsWith('AIza') ? 'Active' : 'Unknown'})...`);

    for (const modelName of modelNames) {
      try {
        console.log(`[Gemini-Acc:${accountId}] Attempting ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        let result;
        if (imageData) {
          let mimeType = imageData.startsWith("data:") ? imageData.split(';')[0].split(':')[1] : "image/jpeg";
          result = await model.generateContent([platformPrompt, { inlineData: { data: imageData.split(',')[1] || imageData, mimeType } }]);
        } else {
          result = await model.generateContent(platformPrompt);
        }

        let text = result.response.text().trim();
        // Remove potential markdown fences if the AI still outputs them
        text = text.replace(/^```json/i, '').replace(/```$/i, '').trim();

        let parsedArray = [];
        try {
          parsedArray = JSON.parse(text);
          if (!Array.isArray(parsedArray)) {
            parsedArray = [text]; // Fallback if not an array
          }
        } catch (parseErr) {
          // Fallback if parsing fails
          console.warn(`[Gemini-Acc:${accountId}] JSON Parse failed, falling back to raw text array.`);
          parsedArray = [text];
        }

        // Clean up text inside array
        parsedArray = parsedArray.map(post => {
          let p = post.replace(/^(Threads|Post):/i, '').trim();
          p = p.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
          return p;
        }).filter(p => p.length > 0);

        // STRICT THREAD CLAMP: Maximum 4 posts per thread (never more than 4-5)
        if (parsedArray.length > 4) {
          console.log(`[Gemini-Acc:${accountId}] 🛡️ Programmatic thread clamp: Reduced thread from ${parsedArray.length} to 4 posts.`);
          parsedArray = [parsedArray[0], parsedArray[1], parsedArray[2], parsedArray[parsedArray.length - 1]];
        }

        // STRICT SINGLE POST ENFORCEMENT
        if (isSinglePostRequested && parsedArray.length > 1) {
          console.log(`[Gemini-Acc:${accountId}] 🛡️ Programmatic single post clamp: Reduced from ${parsedArray.length} to 1 post.`);
          parsedArray = [parsedArray[0]];
        }

        // SMART CHARACTER CLAMP (Never exceed Meta's 500 character limit)
        parsedArray = parsedArray.map(post => {
          if (typeof post === 'string' && post.length > 495) {
            console.log(`[Gemini-Acc:${accountId}] 🛡️ Post exceeded 495 chars (${post.length}). Smart clamping.`);
            const trimmed = post.slice(0, 490);
            const lastSpace = Math.max(trimmed.lastIndexOf(' '), trimmed.lastIndexOf('\n'), trimmed.lastIndexOf('.'));
            return (lastSpace > 350 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
          }
          return post;
        });

        if (parsedArray.length > 0) {
          console.log(`[Gemini-Acc:${accountId}] ✨ Success using Key #${i + 1} with ${modelName}`);
          if (accountId && activeTopic) {
            try { await saveTopic('post', accountId, activeTopic.slice(0, 100)); } catch (_) {}
          }
          return parsedArray;
        }
      } catch (e) {
        const msg = e.message.toLowerCase();
        console.warn(`[Gemini-Acc:${accountId}] Key #${i + 1} (${modelName}) failed: ${msg}`);
        lastError = e;
        
        if (msg.includes('safety') || msg.includes('blocked')) {
           console.error(`[Gemini-Acc:${accountId}] 🚨 BLOCK: Safety filter triggered on Key #${i + 1}. Aborting completely to save quotas.`);
           throw new Error(`Safety Filter Triggered: ${e.message}`);
        }
        
        continue;
      }
    }
  }

  const hasQuotaError = lastError && (lastError.message.includes('429') || lastError.message.includes('Quota'));
  
  if (hasQuotaError && process.env.SILICONFLOW_API_KEY) {
    console.warn(`[Gemini-Acc:${accountId}] ⚠️ ALL GEMINI KEYS HIT QUOTA LIMIT! Falling back to SILICONFLOW (Qwen)...`);
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-72B-Instruct',
          messages: [
            { role: 'system', content: 'You are a JSON API. You MUST output ONLY valid JSON without Markdown blocks like ```json.' },
            { role: 'user', content: platformPrompt }
          ],
          response_format: { type: 'json_object' }
        })
      });
      if (response.ok) {
        const data = await response.json();
        let text = data.choices[0].message.content.trim();
        text = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
        
        let parsedArray = [];
        try {
          parsedArray = JSON.parse(text);
          if (!Array.isArray(parsedArray)) {
            parsedArray = [text];
          }
        } catch(e) {
          parsedArray = [text];
        }
        
        parsedArray = parsedArray.map(post => {
          let p = typeof post === 'string' ? post : (post.caption || JSON.stringify(post));
          p = p.replace(/^(Threads|Post):/i, '').trim();
          p = p.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
          return p;
        }).filter(p => p.length > 0);

        if (parsedArray.length > 0) {
          console.log(`[SiliconFlow-Acc:${accountId}] ✨ Fallback Success!`);
          return parsedArray;
        }
      } else {
         console.error(`SiliconFlow Error: ${response.status} ${response.statusText}`);
      }
    } catch (fallbackErr) {
      console.error(`[SiliconFlow-Acc:${accountId}] Fallback failed:`, fallbackErr.message);
    }
  }

  // Ultimate Fallback: Keyless Cloudflare DevToolBox AI (Llama 3.2 3B)
  try {
    console.warn(`[Gemini-Acc:${accountId}] ⚠️ Falling back to Keyless DevToolBox AI API...`);
    const result = await fetchTextFromDevToolBox(platformPrompt);
    let parsedArray = [];
    if (Array.isArray(result)) {
      parsedArray = result;
    } else if (typeof result === 'object' && result !== null) {
      parsedArray = result.posts || result.slides || [JSON.stringify(result)];
    } else if (typeof result === 'string') {
      try {
        parsedArray = JSON.parse(result);
        if (!Array.isArray(parsedArray)) parsedArray = [parsedArray];
      } catch (e) {
        parsedArray = [result];
      }
    }

    parsedArray = parsedArray.map(post => {
      let p = typeof post === 'string' ? post : (post.caption || JSON.stringify(post));
      p = p.replace(/^(Threads|Post):/i, '').trim();
      p = p.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
      return p;
    }).filter(p => p.length > 0);

    if (parsedArray.length > 0) {
      console.log(`[DevToolBox-Acc:${accountId}] ✨ Keyless Fallback Success!`);
      return parsedArray;
    }
  } catch (devToolBoxErr) {
    console.error(`[DevToolBox-Acc:${accountId}] Keyless Fallback failed:`, devToolBoxErr.message);
  }

  // Absolute Final Fallback: Local dynamic backup (100% resilient)
  console.warn(`[Gemini-Acc:${accountId}] ⚠️ Using Absolute Final Local Fallback...`);
  const fallbackTopic = customPromptOverride || 'marketing automation';
  const defaultText = `Interesting insights on "${fallbackTopic}". Discover the details and learn more here: ${process.env.THREADS_AFFILIATE_LINK || 'https://threadstomation.vercel.app'}`;
  return [defaultText];
}

export async function fetchTextFromDevToolBox(prompt) {
  try {
    console.log(`[DevToolBoxAI] Requesting keyless text generation...`);
    const fetchMod = (await import('node-fetch')).default;
    const res = await fetchMod("https://devtoolbox-api.devtoolbox-api.workers.dev/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) {
      throw new Error(`DevToolBox AI API failed with status ${res.status}`);
    }
    const data = await res.json();
    if (typeof data.response === 'object' && data.response !== null) {
      return data.response;
    }
    let text = (data.response || '').trim();
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    try {
      return JSON.parse(text);
    } catch (e) {
      try {
        let closed = text;
        if (closed.startsWith('{') && !closed.endsWith('}')) {
          closed += '}';
        } else if (closed.startsWith('[') && !closed.endsWith(']')) {
          closed += ']';
        }
        return JSON.parse(closed);
      } catch (inner) {
        return text;
      }
    }
  } catch (e) {
    console.error(`[DevToolBoxAI] Error:`, e.message);
    throw e;
  }
}

