import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys, fetchTextFromDevToolBox } from './gemini.js';
import { getRecentTopics, saveTopic } from './database.js';
import fetch from 'node-fetch'; // Polyfill if needed or native fetch

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash'
];

export async function generateTumblrContent(customPrompt, masterPrompt = '', visualTheme = '', accountName = '', accountId = null, forceNoImage = false, maxLength = null) {
  const apiKeys = await getAllGeminiKeys();

  const useImage = !forceNoImage;

  let recentTopicsSection = '';
  if (accountId) {
    const recentTopics = await getRecentTopics('tumblr', accountId, 30, 14);
    if (recentTopics.length > 0) {
      recentTopicsSection = `
AVOID REPETITION (CRITICAL): The following topics have been posted recently. You MUST NOT create content that covers the exact same topic or theme. Pick a completely different, fresh angle:
${recentTopics.map((t, i) => `  ${i+1}. ${t}`).join('\n')}
`;
    }
  }

  const isOneformind = accountName && accountName.toLowerCase().includes('oneformind');
  const isCaridisini = accountName && accountName.toLowerCase().includes('caridisini');

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' });
  const captionPrompt = maxLength
    ? `"caption": "Viral caption, highly engaging. MUST include the exact link (if provided in the task)! Absolute maximum of ${maxLength} characters for the ENTIRE caption."`
    : `"caption": "Viral Tumblr Masterpost / Aesthetic Resource Guide in clean HTML. Structure: <h2>Curated Title / Hook</h2><p>Relatable intro for students/creatives/freelancers tired of overpriced SaaS.</p><ul><li><strong>Feature / Benefit</strong>: Concrete explanation of why this tool/solution saves time/money (air-gapped, zero watermarks, 100% in browser).</li></ul><p>Engaging closing inviting reblogs or thoughts.</p><p>👉 <strong>Direct Access:</strong> <a href='URL'>Website Name</a></p>"`;

  let effectivePrompt = customPrompt;
  try {
    const { getNewsjackedAngle } = await import('./trend_hunter.js');
    effectivePrompt = await getNewsjackedAngle(accountName || 'airanfadh', masterPrompt, customPrompt, isOneformind || isCaridisini);
  } catch (tErr) {
    console.warn('[Tumblr-Trend] Note:', tErr.message);
  }

  let systemPrompt = `
You are a renowned Tumblr curator, digital archivist, and creative writer. Today's date is ${currentDate}.
${masterPrompt ? `PERSONA & STYLE:\n${masterPrompt}\n\n` : ''}
TASK:
Create a high-reblog Tumblr Masterpost or aesthetic tech resource guide based on this angle: "${effectivePrompt || 'a trending viral topic happening right now'}"
Tumblr culture: Highly receptive to curated resource guides, "free tools that feel illegal to know", anti-corporate software critiques, aesthetic typography, and studyblr/creative utility roundups.
`;

  if (useImage) {
    systemPrompt += `
NOTE: This post MUST include exactly 1 image. You must write a highly detailed 'full_image_prompt' that will be fed to an AI image generator.
CRITICAL RULE FOR IMAGES: The image must be PHOTOGRAPHIC, RETRO 35MM FILM, or AESTHETIC MINIMALIST RENDER only. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS in the image. E.g. "minimalist aesthetic desk setup with warm golden hour sunlight, coffee cup, laptop with dark code editor, cozy lo-fi vibes, 35mm film grain, 8k".
Block info: Account ${accountName}

OUTPUT FORMAT (strict JSON, no markdown):
{
  "full_image_prompt": "An aesthetic, cinematic image representing [CONCEPT]. NO TEXT. NO WORDS. Warm lighting, film grain.",
  ${captionPrompt},
  "hashtags": ["studyblr", "productivity", "useful websites", "student hacks", "tech aesthetic"]
}
`;
  } else {
    systemPrompt += `
NOTE: This is a TEXT-ONLY post. NO IMAGES.

OUTPUT FORMAT (strict JSON, no markdown):
{
  ${captionPrompt},
  "hashtags": ["studyblr", "productivity", "useful websites", "student hacks", "tech aesthetic"]
}
`;
  }  systemPrompt += `
STRICT RULES:
- DYNAMIC LANGUAGE (CRITICAL): ${isOneformind || isCaridisini ? 'You MUST output 100% of the content in ENGLISH. No exceptions.' : 'Analyze the language of the persona/master prompt above. If it is in English, you MUST output 100% of the content in English. If it is in Indonesian, you MUST output in Indonesian.'}
- Strictly for TUMBLR. 
- FORMAT: Output a rich blog post in basic HTML. Use <p>, <h2>, <strong>, <em>, <ul>, and <li>.
- TUMBLR VIRAL STRATEGY: Masterposts get tens of thousands of reblogs. Position the tool/concept as a lifeline against predatory corporate subscriptions (e.g. "for everyone sick of Adobe/SaaS paywalls").
- TAGS (CRITICAL): The hashtags array must include 5 to 8 high-traffic tags combining community discovery tags (e.g., #studyblr, #useful websites, #college advice, #freelance resources, #anti capitalism) and niche tags.
- LINK PLACEMENT: You MUST embed the exact link provided in the CURRENT TASK directly into the HTML caption inside an anchor tag.
${recentTopicsSection}
- Output ONLY the JSON object, do not wrap in markdown or backticks.
`;

  const errors = [];

  let lastError = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const genAI = new GoogleGenerativeAI(apiKeys[i]);

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' }
        });

        const result = await model.generateContent(systemPrompt);
        let raw = result.response.text().trim();
        raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

        const parsed = JSON.parse(raw);

        // Ensure slides array exists (for legacy Instagram/FB calls if they ever use this)
        if (!parsed.slides) parsed.slides = [];

        // Save topic
        const topicToSave = customPrompt || parsed.full_image_prompt || (parsed.slides[0]?.title_part1 || 'Tumblr Post');
        if (accountId && topicToSave) {
          await saveTopic('tumblr', accountId, topicToSave);
        }
        
        return parsed;
      } catch (e) {
        lastError = e;
        if (!e.message.includes('404 Not Found')) {
          errors.push(`[${modelName}] ${e.message}`);
        }
        
        if (e.message.includes('SAFETY') || e.message.includes('Candidate was blocked')) {
          console.error(`[Gemini-Acc:${accountId}] 🚨 BLOCK: Safety filter triggered on Key #${i + 1}. Aborting completely to save quotas.`);
          throw new Error(`Safety Filter Triggered: ${e.message}`);
        }
        continue;
      }
    }
  }

  const hasQuotaError = lastError && (lastError.message.includes('429') || lastError.message.includes('Quota'));
  
  if (hasQuotaError) {
    const sfKeysText = [process.env.SILICONFLOW_API_KEY, process.env.SILICONFLOW_API_KEY_2].filter(Boolean);
    if (sfKeysText.length > 0) {
      console.warn(`[Gemini-Acc:${accountId}] ⚠️ ALL GEMINI KEYS HIT QUOTA LIMIT! Falling back to SILICONFLOW (Qwen)...`);
      for (const sfKey of sfKeysText) {
        try {
          const fetchMod = (await import('node-fetch')).default;
          const response = await fetchMod('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sfKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'Qwen/Qwen2.5-72B-Instruct',
              messages: [
                { role: 'system', content: 'You are a JSON API. You MUST output ONLY valid JSON without Markdown blocks like ```json.' },
                { role: 'user', content: systemPrompt }
              ],
              response_format: { type: 'json_object' }
            })
          });
          if (response.ok) {
            const data = await response.json();
            let text = data.choices[0].message.content.trim();
            text = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
            
            let parsedObj = {};
            try {
              parsedObj = JSON.parse(text);
            } catch(e) {
              // Fallback string manipulation if JSON is slightly broken
            }
            
            if (parsedObj.caption || parsedObj.full_image_prompt) {
              console.log(`[SiliconFlow-Acc:${accountId}] ✨ Fallback Success!`);
              return parsedObj;
            }
          } else {
             console.error(`SiliconFlow Error: ${response.status} ${response.statusText}`);
          }
        } catch (fallbackErr) {
          console.error(`[SiliconFlow-Acc:${accountId}] Fallback failed for a key:`, fallbackErr.message);
        }
      }
    }
  }

  // Ultimate Fallback: Keyless DevToolBox Workers AI
  try {
    console.warn(`[Gemini-Acc:${accountId}] ⚠️ Falling back to Keyless DevToolBox AI API...`);
    const parsedObj = await fetchTextFromDevToolBox(systemPrompt);
    if (parsedObj && (parsedObj.caption || parsedObj.full_image_prompt)) {
      // Ensure slides array exists
      if (!parsedObj.slides) parsedObj.slides = [];
      const topicToSave = customPrompt || parsedObj.full_image_prompt || 'Tumblr Post';
      if (accountId && topicToSave) {
        await saveTopic('tumblr', accountId, topicToSave);
      }
      console.log(`[DevToolBox-Acc:${accountId}] ✨ Keyless Fallback Success!`);
      return parsedObj;
    }
  } catch (devToolBoxErr) {
    console.error(`[DevToolBox-Acc:${accountId}] Keyless Fallback failed:`, devToolBoxErr.message);
  }

  // Absolute Final Fallback: Local dynamic backup (100% resilient)
  console.warn(`[Gemini-Acc:${accountId}] ⚠️ Using Absolute Final Local Fallback for Tumblr...`);
  const benefit = customPrompt ? customPrompt.substring(0, 30) : "Learn More";
  const fallbackObj = {
    "full_image_prompt": `A photorealistic, cinematic promotional image. NO TEXT, NO WORDS, NO LETTERS. Abstract glowing digital network or professional workspace, hyperdetailed, 8k, dramatic lighting.`,
    "caption": `<p>Here is some interesting information about <strong>${customPrompt || 'our topic'}</strong>.</p><p>Check out the details and get started with us today!</p>`,
    "hashtags": ["blog", "trending", "insightful"],
    "slides": []
  };
  
  const topicToSave = customPrompt || fallbackObj.full_image_prompt || 'Tumblr Post';
  if (accountId && topicToSave) {
    await saveTopic('tumblr', accountId, topicToSave);
  }
  return fallbackObj;
}
