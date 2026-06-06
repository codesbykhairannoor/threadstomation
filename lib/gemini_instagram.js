import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';
import sql from './database.js';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-2.5-pro'
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
      "layout_type": "Choose one: 'CenterMockup', 'LeftPerson', 'RightPerson', 'TextHeavy'. DO NOT USE 'PureAI' — it is disabled. Use 'TextHeavy' when you want a bold typographic slide with no image.",
      "title_part1": "First part of the slide title (max 3-4 words). E.g. 'Website Kamu'. This text is rendered clean by Satori — do NOT put it in the image prompt.", 
      "title_part2": "The punchy HIGHLIGHT word/phrase (max 1-2 words). Rendered with neon accent background highlight. E.g. 'Masih Lemot?'", 
      "body": "Optional features list. Format as comma-separated items for checkmark capsule badges: 'Domain Gratis, Hosting Cepat, SSL Gratis'. Max 3 items, 3-4 words each. Leave empty '' if not needed.",
      "foreground_subject_prompt": "English prompt for the AI image model. RULES: (1) Describe ONLY a physical object or person as a subject — e.g. 'A sleek silver MacBook laptop on a dark navy desk, professional studio lighting, photorealistic'. (2) NEVER mention any text, words, letters, numbers, labels, logos, or typography. (3) NEVER describe what is shown on any screen. The screen/display must be BLANK or show a generic clean UI. (4) Do NOT describe the background color — it will be auto-injected.",
      "background_theme": "A short descriptive theme. E.g. 'Dark navy blue, geometric lines'" 
    },
    ...repeat for all ${numSlides} slides
  ],
  "caption": "Instagram caption, highly engaging, 150-400 chars, supports emojis, friendly tone, casual Indonesian or English",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

STRICT RULES:
- NO PUREAI (CRITICAL): NEVER use 'PureAI' as a layout_type. It is completely disabled. Only use: 'CenterMockup', 'LeftPerson', 'RightPerson', 'TextHeavy'.
- LAYOUT VARIATION (CRITICAL): You MUST NOT use the same "layout_type" twice in a row. If slide 1 is 'CenterMockup', slide 2 MUST be 'LeftPerson' or 'TextHeavy', etc.
- NO TEXT IN IMAGE PROMPTS (CRITICAL): The foreground_subject_prompt MUST NEVER describe text, words, letters, numbers, labels, logos, or writing of any kind. ONLY describe the physical object or person. No exceptions.
- NARRATIVE FLOW: ${numSlides > 1 ? 'The content MUST flow naturally from one slide to the next like a continuous story.' : 'Not applicable — single slide, make it highly impactful.'}
- DYNAMIC CONTENT: Leave "body" empty "" for clean title-only slides. Encouraged for bold hook slides.
- LANGUAGE & TONE (CRITICAL): Match the language and tone of the persona/master prompt above exactly.
- STRICT SPELLING (CRITICAL): No typos, no slang double-letters (e.g., do NOT write "Webssite", "MASIIH", "biariin"). Use proper KBBI Indonesian or English dictionary spellings.
- LOGICAL ACCURACY (CRITICAL): Use words that match the intended meaning. If something is negative (slow website, lost sales), use negative words like "Merosot", "Hilang", not positive ones like "Melesat".
- LENGTH LIMITS (CRITICAL): title_part1 = max 3-4 words. title_part2 = max 1-2 words. body = max 3 comma-separated features, 3-4 words each, or empty "".
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
