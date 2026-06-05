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
export async function generateInstagramContent(customPrompt, masterPrompt = '', visualTheme = '') {
  const apiKeys = await getAllGeminiKeys();
  if (apiKeys.length === 0) throw new Error('No Gemini API Keys available.');

  // Randomize from 1 to 5 slides. If 1, it's a Single Feed Post.
  const numSlides = Math.floor(Math.random() * 5) + 1; 

  const systemPrompt = `
${masterPrompt ? `PERSONA & STYLE:\n${masterPrompt}\n\n` : ''}
TASK:
Create a professional Instagram post with exactly ${numSlides} slides about: "${customPrompt || 'an interesting topic based on your persona'}"
${numSlides === 1 ? 'NOTE: Since this is exactly 1 slide, it is a SINGLE IMAGE FEED. Focus on ONE punchy, high-impact hook or quote.' : 'NOTE: Since this is >1 slide, it is a CAROUSEL. Ensure narrative flow across the slides.'}

OUTPUT FORMAT (strict JSON, no markdown):
{
  "slides": [
    { 
      "title": "Slide title (SUPER SHORT, max 5-8 words)", 
      "body": "Slide body content (OPTIONAL. Can be empty string '' if the title is strong enough on its own. Otherwise, max 1-2 sentences).",
      "image_prompt": "A detailed english prompt describing the background image for this slide. Ensure the style matches this visual theme: '${visualTheme || 'atmospheric, high quality, aesthetic'}'" 
    },
    ...repeat for all ${numSlides} slides
  ],
  "caption": "Instagram caption, highly engaging, 150-400 chars, supports emojis, friendly tone, casual Indonesian or English",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

STRICT RULES:
- NARRATIVE FLOW: ${numSlides > 1 ? 'The content MUST flow naturally from one slide to the next like a continuous story. Slide 2 should continue the thought from Slide 1.' : 'Not applicable, as this is a single slide. Make it highly impactful.'}
- DYNAMIC CONTENT (CRITICAL): You are allowed to leave the "body" string empty "" if you want a clean, title-only slide. This is highly encouraged for quotes or bold statements!
- DYNAMIC LANGUAGE & TONE (CRITICAL): Analyze the language of the persona/master prompt above. If it is in English, you MUST output 100% of the content in English. If it is in Indonesian, output in Indonesian. The tone must be perfectly aligned with the persona. If no persona is provided, default to a smart, engaging, casual tone.
- Slide 1: HOOK — surprising statement, bold question, or scroll-stopping headline.
${numSlides > 1 ? `- Slides 2 to ${numSlides - 1}: VALUE — clear, actionable tips, story, or insights that connect perfectly to the previous slide.\n- Slide ${numSlides}: CTA — clear call to action (e.g. Save this post, comment below, share).` : '- Slide 1 CTA: Incorporate a subtle call to action in the caption instead of the image.'}
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
        if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length < 1) {
          throw new Error('Invalid structure from Gemini: must contain at least 1 slide');
        }

        // Clamp slides to 1–5
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
