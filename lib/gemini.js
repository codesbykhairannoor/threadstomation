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

  const arr = Array.from(keys).filter(v => !!v && v.length > 5);
  const aizaKeys = arr.filter(k => k.startsWith('AIza'));
  return aizaKeys.length > 0 ? aizaKeys : arr;
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
  const isAdhlil = accountName.toLowerCase().includes('adhlil');
  const isEnglish = isOneformind || isCaridisini;

  // Real-time Viral Trend Hunter & Newsjacking (Open-Source GitHub Engine)
  let activeTopic = customPromptOverride;
  try {
    const { getNewsjackedAngle } = await import('./trend_hunter.js');
    activeTopic = await getNewsjackedAngle(accountName, masterPrompt, customPromptOverride, isEnglish);
  } catch (trendErr) {
    console.warn('[Gemini] Trend Hunter fallback:', trendErr.message);
  }

  if (typeof activeTopic === 'object' && activeTopic !== null) {
    if (Array.isArray(activeTopic)) {
      activeTopic = activeTopic.map(item => typeof item === 'string' ? item : (item.text || item.post || item.content || JSON.stringify(item))).join(' ');
    } else {
      activeTopic = activeTopic.newsjacked_prompt || activeTopic.topic || activeTopic.prompt || activeTopic.angle || JSON.stringify(activeTopic);
    }
  }

  const specificTask = activeTopic ? `TODAY'S VIRAL TREND & TOPIC ANGLE: ${activeTopic}` : '';

  // DYNAMIC POST FORMAT SELECTION:
  // Randomly alternate between Single Post (~40% chance) and Short Thread (~60% chance)
  // or respect explicit single post request!
  const promptCheck = (typeof customPromptOverride === 'string' ? customPromptOverride : typeof activeTopic === 'string' ? activeTopic : '').toLowerCase();
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
  } else if (isAdhlil) {
    hardSellingRules = `
VIRAL THREADS BLUEPRINT FOR ADHLIL.CO (SOLO FOUNDER & MINDFUL LIFE):
- TEMA: Refleksi realita kehidupan, mentalitas kerja, burnout, rezeki, dan ketenangan jiwa di era digital.
- SIKAP: Rendah hati, pengingat diri ("self-reminder"), sesama pejuang yang sedang belajar. DILARANG KERAS MENGGURUI atau merasa lebih suci/hebat.
- STRICT PRONOUN (WAJIB): DILARANG kata "lo" / "gue/lo"! Gunakan "kita" (inklusif senasib) atau "saya" yang hangat.
- STRUKTUR:
  1. Post 1: Thumb-stopping hook reflektif (< 12 kata) yang menampar kegelisahan modern tanpa klise.
  2. Post 2-3: Uraian renungan mendalam, relatable, sejuk, mengaitkan realita lelahnya dunia dengan ketenangan tawakkal & hakikat hidup.
  3. Final Post: Doa/penutup hangat + pertanyaan pemantik komentar yang mengajak audiens saling berbagi cerita/curhat.
- ZERO COMMERCIAL SPAM: Dilarang keras kata-kata jualan ("klik link", "promo", "cuan").
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
      if (isAdhlil) {
        platformSpecificRules = `
- 2026 META THREADS STRATEGY FOR ADHLIL (@adhlil.co):
  1. FIRST 0.8 SECONDS RULE: Opening sentence under 12 words touching daily exhaustion, anxiety, comparison on social media, or spiritual longing.
  2. CONTENT PILLARS: Islamic wisdom, self-reminder (pengingat diri), muhasabah, rezeki berkah, tawakkal, mental peace, and spiritual calm.
  3. STRICTLY FORBIDDEN: DILARANG KERAS mempromosikan software, aplikasi SaaS, Tranvas, HandleMyFile, atau tools kantor! Akun ini 100% refleksi kehidupan dan nasehat Islami.
  4. COMMENT TRIGGER: Akhiri dengan pertanyaan reflektif hangat yang mengajak audiens saling berbagi cerita, renungan, atau doa di kolom komentar.
  5. PRONOUNS: Gunakan kata 'kita' (kebersamaan senasib) atau 'saya'. DILARANG KERAS menggunakan kata 'lo' atau 'gue/lo'.
`;
      } else if (isTranvas) {
        platformSpecificRules = `
- 2026 META THREADS STRATEGY FOR TRANVAS (@tranvas):
  1. FIRST 0.8 SECONDS RULE: Opening sentence under 12 words challenging overthinking, procrastination, to-do list anxiety, or subscription app chaos.
  2. CONTENT PILLARS: Tranvas (@tranvas) sebagai The Unified Life OS (Focus, Habit, Task, Journal, Finance) atau program recurring affiliate 60%.
  3. STRICTLY FORBIDDEN: Tranvas BUKAN alat kompres video dan BUKAN penggabung/pemisah PDF! Dilarang keras menyamakan Tranvas dengan tools file merger atau converter!
  4. COMMENT TRIGGER: Pertanyaan pemantik debat atau curhat sistem produktivitas di kolom komentar.
  5. PRONOUNS: Gunakan 'kita' atau 'kamu'. DILARANG KERAS kata 'lo' atau 'gue/lo'.
`;
      } else if (isSharesa) {
        platformSpecificRules = `
- 2026 META THREADS STRATEGY FOR SHARESA SPACE (@sharesa.space):
  1. FIRST 0.8 SECONDS RULE: Opening sentence under 12 words on real tech pain (website lelet, fee admin marketplace 15%, upload file lambat, dokumen PDF tebal).
  2. CONTENT PILLARS: Jasa Web Development Modern @sharesa.space atau salah satu dari 4 tools browser WebAssembly (HandleMyFile, SolveMyMedia, CreateMyQR, HelpMyIMG).
  3. STRICTLY FORBIDDEN: Dilarang keras menyebut Tranvas!
  4. COMMENT TRIGGER: Pertanyaan polling santai yang memicu audiens berdiskusi di kolom komentar.
  5. PRONOUNS: Gunakan 'kita' atau 'kamu'. DILARANG KERAS kata 'lo' atau 'gue/lo'.
`;
      } else {
        platformSpecificRules = `
- 2026 META THREADS VIRAL STRATEGY:
  1. Strong thumb-stopping hook in line 1 under 12 words.
  2. Valuable, relatable insight.
  3. Engaging question at the end to drive discussion.
`;
      }
      break;
  }

  const postFormatInstruction = isSinglePostRequested
    ? `- POST FORMAT (CRITICAL): YOU MUST OUTPUT EXACTLY 1 SINGLE POST (A JSON Array with EXACTLY 1 string item, e.g. ["Post content..."]). DO NOT MAKE A THREAD!
  - Structure: [Masalah nyata/repotnya cara lama to the point] -> [Solusi & benefit konkret] -> [Pertanyaan pemantik komentar].
  - Length: Strictly under 450 characters.`
    : `- POST FORMAT: SHORT PUNCHY THREAD (A JSON Array with 2 to 4 strings MAXIMUM):
  - Post 1: Irresistible hook & tension (under 12 words opener).
  - Post 2 (and 3): Core breakdown / practical insight.
  - Final Post: Punchy takeaway + direct debate/discussion question.
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
${isAdhlil ? '- SPIRITUAL DEPTH & SOULFUL WARMTH (ADHLIL): Gunakan bahasa yang sejuk, menyentuh hati, dewasa, dan sarat hikmah. Fokus pada ketenangan jiwa, bersyukur, dan tawakkal. DILARANG KERAS jualan software atau membahas teknologi kantor.' : '- NO POETIC / PHILOSOPHICAL FLUFF: Tulis secara to-the-point, realistis, dan berfokus pada insight nyata tanpa kalimat motivasi klise.'}
- OUTPUT FORMAT: You MUST output ONLY a valid JSON Array of strings (e.g. ["First post text", "Second post text"]).
- ZERO CHATTY PREAMBLE (CRITICAL): Strictly FORBIDDEN to include introductory conversational filler like "Berikut adalah contoh...", "Tentu!", "Here is...", or closing notes. Start immediately with '[' and end immediately with ']'.
${postFormatInstruction}
- SINGLE SPEAKER MONOLOGUE: Every post in the array is written by the SAME person (the account author). You MUST NOT simulate conversations, do not roleplay as commenters, and do not reply to yourself.
- Do NOT output any markdown blocks like \`\`\`json. Output ONLY the raw JSON array.
${recentTopicsSection}
${platformSpecificRules}`;

  const modelNames = [
    'gemini-2.5-flash',
    'gemini-flash-latest'
  ];

  const withTimeout = (promise, ms = 25000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI generation timed out after ' + (ms / 1000) + 's')), ms))
    ]);
  };

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
          result = await withTimeout(model.generateContent([platformPrompt, { inlineData: { data: imageData.split(',')[1] || imageData, mimeType } }]), 25000);
        } else {
          result = await withTimeout(model.generateContent(platformPrompt), 25000);
        }

        let text = result.response.text().trim();
        // Remove markdown code fences if present
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

        let parsedArray = [];

        // 1. Resilient JSON Array extraction via regex (bypasses any model preamble)
        const arrayMatch = text.match(/\[\s*[\s\S]*?\s*\]/);
        if (arrayMatch) {
          try {
            const candidate = JSON.parse(arrayMatch[0]);
            if (Array.isArray(candidate) && candidate.length > 0) {
              parsedArray = candidate.map(item => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null) return item.text || item.content || item.post || JSON.stringify(item);
                return String(item);
              });
            }
          } catch (_) {
            // Extract individual quoted strings if malformed
            const inner = arrayMatch[0].slice(1, -1);
            const stringMatches = Array.from(inner.matchAll(/"((?:[^"\\]|\\.)*)"/g)).map(m => {
              try { return JSON.parse(`"${m[1]}"`); } catch (_) { return m[1]; }
            });
            if (stringMatches.length > 0) {
              parsedArray = stringMatches;
            }
          }
        }

        // 2. Direct JSON parse fallback
        if (parsedArray.length === 0) {
          try {
            const direct = JSON.parse(text);
            if (Array.isArray(direct)) {
              parsedArray = direct;
            } else if (typeof direct === 'object' && direct !== null) {
              parsedArray = direct.posts || direct.thread || [direct.content || direct.text || text];
            }
          } catch (_) {}
        }

        // 3. Raw text fallback with conversational preamble stripped
        if (parsedArray.length === 0) {
          console.warn(`[Gemini-Acc:${accountId}] JSON Parse failed, extracting clean raw text.`);
          let clean = text
            .replace(/^(?:Berikut(?: adalah)?|Tentu(?:kah)?|Ini|Here is|Sure|Here's).*?:\s*/is, '')
            .replace(/^\[\s*"?/i, '')
            .replace(/"?\s*\]$/i, '')
            .trim();
          parsedArray = [clean];
        }

        // Clean up text inside array (strip any preamble, prefix labels, or unparsed brackets)
        parsedArray = parsedArray.map(post => {
          let p = typeof post === 'string' ? post : String(post);
          p = p.replace(/^(?:Berikut(?: adalah)?|Tentu|Ini|Here is|Sure).*?:\s*/is, '').trim();
          p = p.replace(/^(?:Threads|Post|\d+[\/.]\d*)\s*:\s*/i, '').trim();
          p = p.replace(/^\[\s*"?/, '').replace(/"?\s*\]$/, '').trim();
          p = p.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
          return p;
        }).filter(p => p.length > 0);

        // STRICT THREAD CLAMP: Maximum 4 posts per thread
        if (parsedArray.length > 4) {
          console.log(`[Gemini-Acc:${accountId}] 🛡️ Programmatic thread clamp: Reduced thread from ${parsedArray.length} to 4 posts.`);
          parsedArray = [parsedArray[0], parsedArray[1], parsedArray[2], parsedArray[parsedArray.length - 1]];
        }

        // STRICT SINGLE POST ENFORCEMENT
        if (isSinglePostRequested && parsedArray.length > 1) {
          console.log(`[Gemini-Acc:${accountId}] 🛡️ Programmatic single post clamp: Reduced from ${parsedArray.length} to 1 post.`);
          parsedArray = [parsedArray[0]];
        }

        // SMART CHARACTER CLAMP (Never cut off mid-word or exceed Meta's 500 character limit)
        parsedArray = parsedArray.map(post => {
          if (typeof post === 'string' && post.length > 480) {
            console.log(`[Gemini-Acc:${accountId}] 🛡️ Post exceeded 480 chars (${post.length}). Smart clamping to sentence.`);
            const trimmed = post.slice(0, 480);
            const lastPeriod = Math.max(trimmed.lastIndexOf('. '), trimmed.lastIndexOf('? '), trimmed.lastIndexOf('! '));
            if (lastPeriod > 220) {
              return trimmed.slice(0, lastPeriod + 1).trim();
            }
            const lastSpace = Math.max(trimmed.lastIndexOf(' '), trimmed.lastIndexOf('\n'));
            return (lastSpace > 300 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
          }
          return post;
        });

        if (parsedArray.length > 0) {
          console.log(`[Gemini-Acc:${accountId}] ✨ Success using Key #${i + 1} with ${modelName} (${parsedArray.length} post(s))`);
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

  // Absolute Final Fallback: Local dynamic backup (100% resilient & zero-leakage)
  console.warn(`[Gemini-Acc:${accountId}] ⚠️ Using Absolute Final Local Fallback for ${accountName}...`);
  if (isAdhlil) {
    return [
      "Kadang lelah kita bukan karena beban hidup terlalu berat, tapi karena kita lupa melibatkan Allah dalam tiap langkah. Luangkan waktu sejenak malam ini, tarik nafas, dan serahkan apa yang di luar kendali kita kepada-Nya. Apa hal yang paling bikin kalian tenang saat pikiran lagi lelah?"
    ];
  } else if (isTranvas) {
    return [
      "To-do list panjang bukan bikin produktif, tapi bikin overthinking dan lelah sebelum mulai. Rahasia fokus adalah menyederhanakan hidup ke dalam satu sistem terpadu. Kapan terakhir kalian merasa beneran selesai kerja tanpa beban pikiran di malam hari?"
    ];
  } else if (isSharesa) {
    return [
      "Banyak yang mengeluh kuota jebol dan nunggu lama cuma buat kompres video kerjaan. Padahal dengan tools browser modern berbasis WebAssembly, file giga bisa jadi mega dalam hitungan detik tanpa upload ke server luar. Kalian biasanya kompres video pake cara apa?"
    ];
  }
  return ["Ketenangan dan efisiensi kerja dimulai dari sistem yang sederhana dan terarah. Bagaimana cara kalian menjaga fokus di tengah banjir informasi setiap hari?"];
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

