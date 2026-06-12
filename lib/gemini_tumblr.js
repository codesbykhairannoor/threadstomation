import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';
import { getRecentTopics, saveTopic } from './database.js';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash'
];

export async function generateTumblrContent(customPrompt, masterPrompt = '', visualTheme = '', accountName = '', accountId = null, forceNoImage = false, maxLength = null) {
  const apiKeys = await getAllGeminiKeys();
  if (apiKeys.length === 0) throw new Error('No Gemini API Keys available.');

  // We now force exactly 1 image for these 4 promo platforms
  const useImage = true;

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

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' });
  const captionPrompt = maxLength
    ? `"caption": "Viral caption, highly aggressive. MUST include the exact affiliate link (if provided in the task)! VERY IMPORTANT: Absolute maximum of ${maxLength} characters for the ENTIRE caption. Keep it extremely short, 1 or 2 sentences max. Do NOT write paragraphs."`
    : `"caption": "Viral caption, highly aggressive marketing. HTML is allowed. MUST include the affiliate link (if provided in the task)! Minimum 3 paragraphs. Sell the product/topic hard."`;

  const systemPrompt = `
You are an ELITE Marketing Genius and copywriter. Today's date is ${currentDate}.
${masterPrompt ? `PERSONA & STYLE:\n${masterPrompt}\n\n` : ''}
TASK:
Create a highly engaging post based on this angle: "${customPrompt || 'a trending viral topic happening right now'}"
Leverage current marketing trends, SEO strategies, and psychological hooks. DO NOT sound like a generic AI. Use power words, pattern interrupts, and storytelling.
NOTE: This post MUST include exactly 1 image. You must write a highly detailed 'full_image_prompt' that will be fed to an AI image generator (like Midjourney/FLUX). The image MUST include specific text written natively inside it (e.g. "FREE TRIAL", "CLAIM NOW", or a bold headline). Describe the 3D elements, lighting, and exact text placement.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "full_image_prompt": "A highly converting promotional banner for a SaaS tool. Modern, sleek, dark mode design with neon blue accents. Bold glowing text in the center that says 'START YOUR FREE TRIAL'. 3D elements floating around, photorealistic, 8k resolution, cinematic lighting.",
  ${captionPrompt},
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

STRICT RULES:
- LANGUAGE (CRITICAL): You MUST output 100% of the content in ENGLISH. No Indonesian. No Islamic themes.
- COPYWRITING: Use aggressive phrases like 'Stop wasting time', 'Claim your free trial', 'Click the link before it expires'.
- LINK PLACEMENT: You MUST embed the exact link provided in the CURRENT TASK directly into the caption.
${recentTopicsSection}
- Output ONLY the JSON object, do not wrap in markdown or backticks.
`;

  const errors = [];

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
        if (!e.message.includes('404 Not Found')) {
          errors.push(`[${modelName}] ${e.message}`);
        }
        continue;
      }
    }
  }

  const meaningfulErrors = errors.filter(msg => msg.includes('Unexpected token') || msg.includes('429') || msg.includes('503'));
  if (meaningfulErrors.length > 0) {
    throw new Error(`Gemini failed. Errors: ${meaningfulErrors.join(' | ')}`);
  }

  throw new Error(`All Gemini keys failed. Summary: ${errors.slice(-3).join(' | ')}`);
}
