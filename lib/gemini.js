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

  // Brand-Specific Hard-Selling Rules (Tranvas & Sharesa Space)
  let hardSellingRules = '';
  if (isTranvas) {
    hardSellingRules = `
CRITICAL HARD-SELLING COPYWRITING FOR TRANVAS:
- The user demands AGGRESSIVE, HIGH-CONVERTING HARD SELLING. Do NOT write boring, academic, or philosophical ramblings!
- STRICT PRONOUN RULE (WAJIB): DILARANG KERAS menggunakan kata "lo" atau "gue/lo"! Gunakan kata "kita" (inklusif, rasa senasib, solidaritas), atau "kamu", atau langsung to the point tanpa sebutan "lo".
- PSYCHOLOGICAL STRUCTURE (Strictly 2 to 4 posts):
  1. POST 1: Brutal, relatable PAIN POINT. Masalah "app fatigue" (buka 15 tab, catat tugas di banyak tools, tapi pas malam hari bengong karena nggak ada hasil nyata). Hook pembuka yang menusuk rasa frustrasi kita bersama.
  2. POST 2 (and 3): AGITATE akibat terus berantakan (waktu terbuang, peluang karir lepas, mental lelah) + REVEAL the GAIN punya Second Brain (bangun pagi dengan 100% clarity, 1 sleek Notion dashboard, otak jernih, deep work naik).
  3. FINAL POST (Post 3 or 4): POSITION TRANVAS LIFE-OS BLUEPRINT as the immediate, no-brainer SOLUTION! End with a direct, urgent HARD-SELL CTA: "Stop buang waktu dalam kekacauan lama. Saatnya kita ambil kendali penuh atas hidup, uang, dan karir. Klik link di bio buat akses Tranvas Life-OS Blueprint sekarang juga!"
`;
  } else if (isSharesa) {
    hardSellingRules = `
CRITICAL HARD-SELLING COPYWRITING FOR SHARESA SPACE:
- The user demands AGGRESSIVE, HIGH-CONVERTING HARD SELLING. Do NOT write soft or passive content!
- STRICT PRONOUN RULE (WAJIB): DILARANG KERAS menggunakan kata "lo" atau "gue/lo"! Gunakan kata "kita" (inklusif dan solutif), atau sebut pebisnis/founder tanpa sebutan "lo".
- PSYCHOLOGICAL STRUCTURE (Strictly 2 to 4 posts):
  1. POST 1: Brutal, relatable PAIN POINT. Bahaya jualan HANYA lewat DM Instagram/WhatsApp atau potongan marketplace 10-15%+ ("numpang di tanah orang"), kehilangan calon klien besar karena belum punya website resmi.
  2. POST 2 (and 3): AGITATE risiko fatal (akun kena banned, algoritma drop, database customer bukan milik kita) + REVEAL the GAIN punya "Rumah Digital" (website) yang closing 24 jam nonstop, kredibilitas naik 10x lipat, profit 100% utuh.
  3. FINAL POST (Post 3 or 4): POSITION SHARESA SPACE (@sharesa.space) as the immediate SOLUTION to build their high-converting website! End with a direct, urgent HARD-SELL CTA: "Saatnya bisnis kita punya Rumah Digital sendiri yang hasilin cuan 24/7. Slot pembuatan web terbatas! Konsultasi gratis sekarang lewat link di bio!"
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
- OUTPUT FORMAT: You MUST output a valid JSON Array of strings. 
  - If single post: ["Hook + Insight + Engaging debate question?"]
  - If thread: Array of EXACTLY 2 to 4 strings MAXIMUM (Strictly 2, 3, or 4 items):
    - Post 1: Irresistible hook & tension (under 12 words opener).
    - Post 2 (and 3): Core breakdown / practical insight.
    - Final Post (Post 3 or 4): Punchy takeaway + debate question to spark comments.
- STRICT THREAD LENGTH LIMIT: The array MUST NOT have more than 4 items! Strictly 2 to 4 items only. Social media users will abandon long threads. Keep it punchy, fast to read, and concise. NEVER exceed 4 posts!
- SINGLE SPEAKER MONOLOGUE: Every post in the array is written by the SAME person (the account author). You MUST NOT simulate conversations, do not roleplay as commenters, and do not reply to yourself.
- Do NOT output any markdown blocks like \`\`\`json. Output ONLY the raw JSON array.
${recentTopicsSection}
${platformSpecificRules}`;

  const modelNames = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
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

        if (parsedArray.length > 0 && parsedArray[0].length <= 500) {
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

