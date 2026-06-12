import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';
import { getRecentTopics, saveTopic } from './database.js';
import sql from './database.js';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash'
];

/**
 * Generate Instagram content: slide titles/bodies (for carousel) + engaging caption with hashtags.
 * Returns: { slides: [{title, body}], caption: string, hashtags: string[] }
 */
export async function generateInstagramContent(customPrompt, masterPrompt = '', visualTheme = '', accountName = '', accountId = null) {
  const apiKeys = await getAllGeminiKeys();
  if (apiKeys.length === 0) throw new Error('No Gemini API Keys available.');

  const isAdhlil = accountName && accountName.toLowerCase().includes('adhlil');
  const isOneformind = accountName && accountName.toLowerCase().includes('oneformind');

  // Randomize from 1 to 5 slides. If 1, it's a Single Feed Post.
  let numSlides = Math.floor(Math.random() * 5) + 1;
  if (isAdhlil) {
    // Adhlil strictly requires carousel of at least 3 to 8 slides
    numSlides = Math.floor(Math.random() * 6) + 3; // 3 to 8
  }

  // Fetch recent topics to avoid repetition
  let recentTopicsSection = '';
  if (accountId) {
    const recentTopics = await getRecentTopics('instagram', accountId, 30, 14);
    if (recentTopics.length > 0) {
      recentTopicsSection = `
AVOID REPETITION (CRITICAL): The following topics have been posted recently. You MUST NOT create content that covers the exact same topic or theme. Pick a completely different, fresh angle:
${recentTopics.map((t, i) => `  ${i+1}. ${t}`).join('\n')}
`;
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' });

  const systemPrompt = `
You are an ELITE Marketing Genius and copywriter. Today's date is ${currentDate}.
${masterPrompt ? `PERSONA & STYLE:\n${masterPrompt}\n\n` : ''}
TASK:
Create a highly engaging, viral carousel post with exactly ${numSlides} slides based on this angle: "${customPrompt || 'an interesting viral topic based on your persona'}"
Leverage current marketing trends, SEO strategies, and psychological hooks. DO NOT sound like a generic AI. Use power words, pattern interrupts, and storytelling.
${numSlides === 1 ? 'NOTE: Since this is exactly 1 slide, it is a SINGLE IMAGE FEED. Focus on ONE punchy, high-impact hook or quote.' : 'NOTE: Since this is >1 slide, it is a CAROUSEL. Ensure strong narrative flow and open loops across the slides.'}

OUTPUT FORMAT (strict JSON, no markdown):
{
  "slides": [
    { 
      "layout_type": "Choose one: 'CenterMockup', 'TopMockup', 'LeftPerson', 'RightPerson'${isAdhlil ? '' : ", 'TextHeavy'"} ",
      "title_part1": "First part of the slide title (max 3-5 words). E.g. 'Website Lemot'", 
      "title_part2": "Second part of the slide title for contrast (max 3-5 words). E.g. 'Pas Traffic Lagi Tinggi!!'", 
      "body": "${numSlides > 1 ? 'REQUIRED: Exactly 1 sentence (40-100 chars) that continues the story from the previous slide and sets up the next.' : 'Optional: 1 short sentence or empty string.'}",
      "foreground_subject_prompt": "A detailed english prompt for a single isolated object/person. E.g. 'A professional asian businessman smiling, isolated on pure white background' or 'A sleek modern laptop displaying a dashboard, isolated on pure white background'. VERY IMPORTANT: The image MUST be realistic photography. Do NOT ask for logos, vectors, icons, or abstract shapes. The image must have NO TEXT, NO WORDS, NO LETTERS.${isAdhlil ? '' : " If layout_type is 'TextHeavy', leave this empty."}",
      "background_theme": "A descriptive theme for the CSS background gradient/pattern. E.g. 'Dark blue to purple gradient with abstract geometric shapes'" 
    },
    ...repeat for all ${numSlides} slides
  ],
  "caption": "Instagram caption, highly engaging, 150-400 chars, supports emojis, friendly tone, casual Indonesian or English",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

STRICT RULES:
- LAYOUT VARIATION (CRITICAL): You MUST NOT use the same "layout_type" twice in a row. Force variation! If slide 1 is 'CenterMockup', slide 2 MUST be 'LeftPerson', etc.
${isAdhlil ? "- BRAND RULE: You MUST NOT use the 'TextHeavy' layout type for ANY slide. Every slide MUST have an image prompt.\n- BRAND RULE: The content should be varied: Islamic stories, advice, Hadith explanations, or Dalil. It MUST NOT be stiff. Use an engaging hook in slide 1." : ""}
${recentTopicsSection}
- NARRATIVE FLOW (CRITICAL for carousels): ${numSlides > 1 ? 'Each slide body MUST connect to the previous slide and lead into the next, like chapters in a story. The reader must feel compelled to swipe to the next slide.' : 'Not applicable, as this is a single slide. Make it highly impactful.'}
- BODY RULES (CRITICAL): ${numSlides > 1 ? 'Body MUST NOT be empty for carousel slides. Each body is REQUIRED to be exactly 1 clear, concise sentence (40-100 characters). DO NOT leave body as empty string.' : 'Body is optional for single feed posts.'}
- DYNAMIC LANGUAGE & TONE (CRITICAL): ${isOneformind ? 'You MUST output 100% of the content in ENGLISH. No exceptions.' : 'Analyze the language of the persona/master prompt above. If it is in English, you MUST output 100% of the content in English. If it is in Indonesian, output in Indonesian. The tone must be perfectly aligned with the persona. If no persona is provided, default to a smart, engaging, casual tone.'}
- Slide 1: HOOK — surprising statement, bold question, or scroll-stopping headline.
${numSlides > 1 ? `- Slides 2 to ${numSlides - 1}: VALUE — clear, actionable tips, story, or insights that connect perfectly to the previous slide.\n- Slide ${numSlides}: FYP HACK & SALES PITCH (CRITICAL) — You MUST explicitly sell the product/service mentioned in the CURRENT TASK. Tell them WHY they need it, and explicitly ask them to click the link in bio or the provided link to get it. This is a hard-sell slide.` : '- Slide 1 CTA: FYP HACK & SALES PITCH (CRITICAL) — Incorporate a strong hard-selling pitch to click the affiliate link in the caption.'}
- CRITICAL LINK PLACEMENT: If the CURRENT TASK provides a URL/link, you MUST place that EXACT link at the very end of the final slide text. Do NOT forget it.
- Output ONLY the JSON object, do not wrap in markdown or backticks
`;

  const errors = [];

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

        // Clamp slides to 1-5
        parsed.slides = parsed.slides.slice(0, 5);

        console.log(`[Instagram-Gemini] ✅ Content generated successfully with ${parsed.slides.length} slides`);
        
        // Save topic to history to prevent future repetition
        const topicToSave = customPrompt || parsed.slides[0]?.title_part1 || '';
        if (accountId && topicToSave) {
          await saveTopic('instagram', accountId, topicToSave);
        }
        
        return parsed;
      } catch (e) {
        console.warn(`[Instagram-Gemini] Key #${i + 1} (${modelName}) failed: ${e.message}`);
        // Only save meaningful errors that help debug (ignore pure 404s for old models)
        if (!e.message.includes('404 Not Found')) {
          errors.push(`[${modelName}] ${e.message}`);
        }
        continue;
      }
    }
  }

  // If we had parsing errors or quota errors, report those. Otherwise fallback to the last error.
  const meaningfulErrors = errors.filter(msg => msg.includes('Unexpected token') || msg.includes('429') || msg.includes('503'));
  if (meaningfulErrors.length > 0) {
    throw new Error(`Gemini failed. Errors: ${meaningfulErrors.join(' | ')}`);
  }

  throw new Error(`All Gemini keys and models failed. Summary of errors: ${errors.slice(-3).join(' | ')}`);
}