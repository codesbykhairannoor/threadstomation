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
    ? `"caption": "Viral caption, highly engaging. MUST include the exact affiliate link (if provided in the task)! VERY IMPORTANT: Absolute maximum of ${maxLength} characters for the ENTIRE caption. Keep it extremely short, 1 or 2 sentences max. Do NOT write paragraphs."`
    : `"caption": "Viral caption, highly engaging marketing. HTML is allowed. MUST include the affiliate link (if provided in the task)! Keep it concise and punchy, 1-2 paragraphs max."`;

  let systemPrompt = `
You are an ELITE Marketing Genius and copywriter. Today's date is ${currentDate}.
${masterPrompt ? `PERSONA & STYLE:\n${masterPrompt}\n\n` : ''}
TASK:
Create a highly engaging post based on this angle: "${customPrompt || 'a trending viral topic happening right now'}"
Leverage current marketing trends, SEO strategies, and psychological hooks. DO NOT sound like a generic AI. Use power words, pattern interrupts, and storytelling.
`;

  if (useImage) {
    systemPrompt += `
NOTE: This post MUST include exactly 1 image. You must write a highly detailed 'full_image_prompt' that will be fed to an AI image generator (like FLUX, which is excellent at text rendering). The image MUST include specific text written natively inside it (e.g. "FEE-FREE TRANSFER", "10K FREE TASKS", or a bold specific benefit). 
CRITICAL RULE FOR IMAGES: To ensure the AI spells the text perfectly, you must use phrases like: The image features the exact text "YOUR TEXT HERE" written in bold, clean typography. 
INTELLIGENCE CHECK: If the topic mentions a specific brand (like Wise, Make.com, Systeme, etc.), you MUST deduce their ACTUAL specific promo or benefit. DO NOT use generic words like "Free Trial" or "Click Here". Instead, use highly specific, factual benefits (e.g. for Wise: "ZERO HIDDEN FEES" or "FREE TRANSFER", for Make.com: "AUTOMATE 24/7", etc.). Keep the text short (2-5 words max).
Block info: Account ${accountName}

OUTPUT FORMAT (strict JSON, no markdown):
{
  "full_image_prompt": "A highly converting promotional banner. Modern, sleek design. Prominent, perfectly spelled bold text in the center that reads: '[SPECIFIC BENEFIT HERE]'. 3D elements floating around, photorealistic, 8k resolution, cinematic lighting.",
  ${captionPrompt},
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}
`;
  } else {
    systemPrompt += `
NOTE: This is a TEXT-ONLY post. NO IMAGES.

OUTPUT FORMAT (strict JSON, no markdown):
{
  ${captionPrompt},
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}
`;
  }  systemPrompt += `
STRICT RULES:
- DYNAMIC LANGUAGE (CRITICAL): ${isOneformind || isCaridisini ? 'You MUST output 100% of the content in ENGLISH. No exceptions.' : 'Analyze the language of the persona/master prompt above. If it is in English, you MUST output 100% of the content in English. If it is in Indonesian, you MUST output in Indonesian.'}
- Strictly for TUMBLR. 
- FORMAT: Output a rich blog post in basic HTML. Use <p>, <h2>, <strong>, <em>, and <ul>.
- TUMBLR VIRAL STRATEGY: This is a highly visual, aesthetic, and informal platform. "Corporate" speak is mocked here.
- TONE: Unhinged, aesthetic, humorous, or native "shitposting" style.
- FORMAT: Output a rich blog post in basic HTML. Use <p>, <h2>, <strong>, <em>, and <ul>.
- TAGS (CRITICAL): Must include long-tail, conversational tags at the end of the hashtags array (e.g., #literally me, #tech struggles).
- LINK PLACEMENT: You MUST embed the exact link provided in the CURRENT TASK directly into the caption.
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
    "full_image_prompt": `A professional promotional banner. The image features the exact text "${benefit.toUpperCase()}" written in bold, clean typography. 3D elements floating around, photorealistic, 8k resolution, cinematic lighting.`,
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
