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
  if (apiKeys.length === 0) throw new Error('No Gemini API Keys found in Environment or Settings.');

  const globalPromptRow = await sql`SELECT value FROM settings WHERE key = 'prompt'`;
  const accountRow = await sql`SELECT master_prompt FROM accounts WHERE id = ${accountId}`;

  const masterPrompt = accountRow[0]?.master_prompt || globalPromptRow[0]?.value || 'Share a helpful insight.';
  const specificTask = customPromptOverride ? `TODAY'S TOPIC: ${customPromptOverride}` : '';

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

  const platformPrompt = `
You are an ELITE expert copywriter and ghostwriter for a high-profile ${platform} account.
Persona / Master Prompt: ${masterPrompt}

${specificTask}

STRICT RULES:
- DYNAMIC LANGUAGE (CRITICAL): Analyze the language of the persona/master prompt above. If it is in English, you MUST output 100% of the content in English. If it is in Indonesian, you MUST output in Indonesian. 
- Strictly for ${platform.toUpperCase()}. 
- ABSOLUTE CHARACTER LIMIT PER POST: 450 characters.
- ${imageData ? 'IMPORTANT: Analyze the attached image and write a post about it matching your style.' : ''}
- IMPORTANT: DO NOT USE HASHTAGS.
- CRITICAL LINK PLACEMENT: If the CURRENT TASK provides a URL/link, you MUST place that EXACT link at the very end of the final text/slide. Do NOT forget the link.
- FYP HACK: Always add an open-ended question or thought-provoking statement to force people to reply, but put it BEFORE the link if a link exists.
${recentTopicsSection}
- COPYWRITING TONE: You MUST write like an elite, authoritative, slightly confrontational direct-response marketer.
- HOOK: Start with a strong, contrarian, or punchy hook (e.g., "Banks are legally robbing you" or "If you do X, you are wasting time").
- STRUCTURE: Identify a painful problem or a 'villain' (e.g., expensive tools, manual tasks, hidden fees), then present the provided link/product as the ultimate logical solution.
- STYLE: Be direct, sharp, and highly persuasive. DO NOT use emojis (maximum 1). NEVER use cheap salesman phrases like 'Don't miss out', 'Claim your free trial', 'Level up', 'Viral secret'.
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

  throw new Error(`All Gemini Keys failed: ${lastError?.message}`);
}
