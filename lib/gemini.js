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
  const rows = await sql`SELECT value FROM settings WHERE key LIKE 'gemini_api_key%' ORDER BY key ASC`;
  rows.forEach(r => keys.add(r.value));

  return Array.from(keys).filter(v => !!v && v.length > 5);
}

// --- MAIN CONTENT GENERATOR ---
export async function generateThreadsContent(platform = 'threads', imageData = null, customPromptOverride = null, accountId = 1) {
  const apiKeys = await getAllGeminiKeys();

  const globalPromptRow = await sql`SELECT value FROM settings WHERE key = 'prompt'`;
  const accountRow = await sql`SELECT name, master_prompt FROM accounts WHERE id = ${accountId}`;

  const accountName = accountRow[0]?.name || '';
  const masterPrompt = accountRow[0]?.master_prompt || globalPromptRow[0]?.value || 'Share a helpful insight.';
  const specificTask = customPromptOverride ? `TODAY'S TOPIC: ${customPromptOverride}` : '';

  const isOneformind = accountName.toLowerCase().includes('oneformind');
  const isCaridisini = accountName.toLowerCase().includes('caridisini');

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
- COPYWRITING TONE: You MUST write like an elite, authoritative, slightly confrontational direct-response marketer.
- HOOK: Start with a strong, contrarian, or punchy hook (e.g., "Banks are legally robbing you" or "If you do X, you are wasting time").
- STRUCTURE: Identify a painful problem or a 'villain' (e.g., expensive tools, manual tasks, hidden fees), then present the provided link/product as the ultimate logical solution.
- STYLE: Be direct, sharp, and highly persuasive. DO NOT use emojis (maximum 1). NEVER use cheap salesman phrases like 'Don't miss out', 'Claim your free trial', 'Level up', 'Viral secret'.
      `;
      break;
  }

  const platformPrompt = `
You are an ELITE expert copywriter and ghostwriter for a high-profile ${platform} account.
Persona / Master Prompt: ${masterPrompt}
Custom account details: ${accountName}

${specificTask}

STRICT RULES:
- DYNAMIC LANGUAGE (CRITICAL): ${isOneformind || isCaridisini ? 'You MUST output 100% of the content in ENGLISH. No exceptions.' : 'Analyze the language of the persona/master prompt above. If it is in English, you MUST output 100% of the content in English. If it is in Indonesian, you MUST output in Indonesian.'}
- Strictly for ${platform.toUpperCase()}. 
- ABSOLUTE CHARACTER LIMIT PER POST: 450 characters.
- ${imageData ? 'IMPORTANT: Analyze the attached image and write a post about it matching your style.' : ''}
- CRITICAL LINK PLACEMENT: If the CURRENT TASK provides a URL/link, you MUST place that EXACT link at the very end of the final text/slide. Do NOT forget the link.
- FYP HACK: Always add an open-ended question or thought-provoking statement to force people to reply, but put it BEFORE the link if a link exists.
${recentTopicsSection}
${platformSpecificRules}
- OUTPUT FORMAT: You MUST output a valid JSON Array of strings. If the topic is short, output an array with 1 string. If the topic is deep and needs a "Thread" format (replying to yourself), output an array with 2 or 3 strings. 
- Do NOT output any markdown blocks like \`\`\`json. Output ONLY the raw JSON array.
Example Output: ["First hook and main point.", "Second part of the point.", "Final punchline or question? https://link.com"]`;

  const modelNames = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash-lite',
    'gemini-pro-latest'
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

        if (parsedArray.length > 0 && parsedArray[0].length <= 500) {
          console.log(`[Gemini-Acc:${accountId}] ✨ Success using Key #${i + 1} with ${modelName}`);
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

