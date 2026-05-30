import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';
import sql from './database.js';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
];

/**
 * Generate Instagram content: slide titles/bodies (for carousel) + engaging caption with hashtags.
 * Returns: { slides: [{title, body}], caption: string, hashtags: string[] }
 */
export async function generateInstagramContent(customPrompt, masterPrompt = '') {
  const apiKeys = await getAllGeminiKeys();
  if (apiKeys.length === 0) throw new Error('No Gemini API Keys available.');

  const numSlides = Math.floor(Math.random() * 3) + 3; // 3–5 slides

  const systemPrompt = `
${masterPrompt ? `PERSONA & STYLE:\n${masterPrompt}\n\n` : ''}
TASK:
Create a professional Instagram photo carousel with exactly ${numSlides} slides about: "${customPrompt || 'an interesting topic based on your persona'}"

OUTPUT FORMAT (strict JSON, no markdown):
{
  "slides": [
    { 
      "title": "Slide title max 50 chars", 
      "body": "Slide body content max 120 chars",
      "image_prompt": "A detailed english prompt describing the background image for this slide, focusing on atmosphere, Islamic architecture, nature, or abstract themes" 
    },
    ...repeat for all ${numSlides} slides
  ],
  "caption": "Instagram caption, highly engaging, 150-400 chars, supports emojis, friendly tone, casual Indonesian or English",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

STRICT RULES:
- Slide 1: HOOK — surprising statement, bold question, or scroll-stopping headline
- Slides 2 to ${numSlides - 1}: VALUE — clear, actionable tips, facts, or insights
- Slide ${numSlides}: CTA — clear call to action (e.g. Save this post, comment below, share)
- Tone: Matches the persona defined in master prompt
- Output ONLY the JSON object, do not wrap in markdown or backticks
`;

  let lastError = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const genAI = new GoogleGenerativeAI(apiKeys[i]);

    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[Instagram-Gemini] Key #${i + 1}, model: ${modelName}`);
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
        if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length < 2) {
          throw new Error('Invalid carousel structure from Gemini');
        }

        // Clamp slides to 3–5
        parsed.slides = parsed.slides.slice(0, 5);

        console.log(`[Instagram-Gemini] ✅ Content generated successfully with ${parsed.slides.length} slides`);
        return parsed;
      } catch (e) {
        console.warn(`[Instagram-Gemini] Key #${i + 1} (${modelName}) failed: ${e.message}`);
        lastError = e;
        continue;
      }
    }
  }

  throw new Error(`All Gemini keys failed for Instagram content: ${lastError?.message}`);
}
