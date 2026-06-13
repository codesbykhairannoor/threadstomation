import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys, fetchTextFromDevToolBox } from './gemini.js';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.5-pro'
];

/**
 * Generate a carousel plan (3–5 slides) + TikTok caption from a custom prompt.
 * Returns: { slides: [{title, body}], caption: string, hashtags: string[] }
 */
export async function generateCarouselContent(customPrompt, masterPrompt = '') {
  const apiKeys = await getAllGeminiKeys();

  const numSlides = Math.floor(Math.random() * 3) + 3; // random 3–5 slides

  const systemPrompt = `
${masterPrompt ? `PERSONA & STYLE:\n${masterPrompt}\n\n` : ''}
TASK:
Create a TikTok photo carousel with exactly ${numSlides} slides about: "${customPrompt || 'an interesting topic based on your persona'}"

OUTPUT FORMAT (strict JSON, no markdown):
{
  "slides": [
    { "title": "Slide title max 50 chars", "body": "Slide body content max 120 chars" },
    ...repeat for all ${numSlides} slides
  ],
  "caption": "TikTok caption, engaging, 150-300 chars, casual Indonesian or English based on persona",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

STRICT RULES:
- Slide 1: HOOK — surprising stat, bold question, or shocking statement to stop scroll
- Slides 2 to ${numSlides - 1}: VALUE — tips, facts, steps, or insights (one clear point per slide)
- Slide ${numSlides}: CTA — call to action (follow, share, comment)
- All text in ${masterPrompt?.toLowerCase().includes('english') ? 'English' : 'Indonesian (Bahasa Indonesia)'}
- Caption: NO double-meaning, direct, engaging opener, end with question or CTA
- Hashtags: relevant, mix popular + niche (no # prefix in the array)
- Output ONLY the JSON, nothing else
`;

  const errors = [];
  let lastError = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const genAI = new GoogleGenerativeAI(apiKeys[i]);

    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[TikTok-Gemini] Key #${i + 1}, model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' }
        });

        const result = await model.generateContent(systemPrompt);
        let raw = result.response.text().trim();

        // Strip markdown code block if present
        raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

        const parsed = JSON.parse(raw);

        // Validate structure
        if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length < 3) {
          throw new Error('Invalid carousel structure from Gemini');
        }

        // Clamp slides to 3–5
        parsed.slides = parsed.slides.slice(0, 5);
        if (parsed.slides.length < 3) throw new Error('Too few slides');

        console.log(`[TikTok-Gemini] ✅ ${parsed.slides.length} slides generated`);
        return parsed;
      } catch (e) {
        lastError = e;
        console.warn(`[TikTok-Gemini] Key #${i + 1} (${modelName}) failed: ${e.message}`);
        if (!e.message.includes('404 Not Found')) {
          errors.push(`[${modelName}] ${e.message}`);
        }
        continue;
      }
    }
  }

  // Ultimate Fallback: Keyless DevToolBox Workers AI
  try {
    console.warn(`[TikTok-Gemini] ⚠️ Falling back to Keyless DevToolBox AI API...`);
    const parsed = await fetchTextFromDevToolBox(systemPrompt);
    if (parsed && parsed.slides && Array.isArray(parsed.slides) && parsed.slides.length >= 3) {
      parsed.slides = parsed.slides.slice(0, 5);
      console.log(`[TikTok-DevToolBox] ✅ ${parsed.slides.length} slides generated via fallback`);
      return parsed;
    }
  } catch (devToolBoxErr) {
    console.error(`[TikTok-DevToolBox] Keyless Fallback failed:`, devToolBoxErr.message);
  }

  // Absolute Final Fallback: Local dynamic backup (100% resilient)
  console.warn(`[TikTok-Gemini] ⚠️ Using Absolute Final Local Fallback for TikTok...`);
  return {
    "slides": [
      { "title": "Did you know?", "body": `Here is a quick overview about ${customPrompt || 'this topic'}.` },
      { "title": "Check this out", "body": "See the link to explore and get started." }
    ],
    "caption": `Check out this quick guide to ${customPrompt || 'this topic'}!`,
    "hashtags": ["tips", "hacks", "trending"]
  };
}
