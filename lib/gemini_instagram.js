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
export async function generateInstagramContent(customPrompt, masterPrompt = '', visualTheme = '', accountName = '') {
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

  const systemPrompt = `
${masterPrompt ? `PERSONA & STYLE:\n${masterPrompt}\n\n` : ''}
TASK:
Create a professional Instagram post with exactly ${numSlides} slides about: "${customPrompt || 'an interesting topic based on your persona'}"
${numSlides === 1 ? 'NOTE: Since this is exactly 1 slide, it is a SINGLE IMAGE FEED. Focus on ONE punchy, high-impact hook or quote.' : 'NOTE: Since this is >1 slide, it is a CAROUSEL. Ensure narrative flow across the slides.'}

OUTPUT FORMAT (strict JSON, no markdown):
{
  "slides": [
    { 
      "layout_type": "Choose one: 'CenterMockup', 'TopMockup', 'LeftPerson', 'RightPerson'${isAdhlil ? '' : ", 'TextHeavy'"} ",
      "title_part1": "First part of the slide title (max 3-8 words). E.g. 'Website Lemot Parah'", 
      "title_part2": "Second part of the slide title for contrast (max 3-8 words). E.g. 'Pas Traffic Lagi Tinggi!!'", 
      "body": "Body text explaining this slide. Max 200 characters total.",
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
- NARRATIVE FLOW STRUCTURE (CRITICAL for carousels >1 slide): Each slide number has a specific purpose:
  * Slide 1 (HOOK): Body menjelaskan masalah/pengalaman relatable yang bikin orang penasaran (2-3 kalimat)
  * Slides 2-${numSlides - 1} (VALUE): Body menjelaskan insight, fakta, atau langkah-langkah yang detail dan informatif (2-3 kalimat PER SLIDE)
  * Slide ${numSlides} (CTA/CALL-TO-ACTION): Body harus mengandung ajakan "Save" atau "Share" post ini (2-3 kalimat)
  Setiap slide harus menyambung ke slide berikutnya. Contoh narrative flow yang BAIK:
  - Slide 1: "Banyak orang gagal di tahap ini..." (kenalin masalah)
  - Slide 2: "Nih, alasannya kenapa..." (jelasin penyebab)
  - Slide 3: "Yang penting tuh gini caranya..." (kasih solusi)
  - Slide 4: "Gue udah praktekin dan hasilnya..." (sharing experience)
  - Slide 5: "Save postingan ini biar ga lupa!" (CTA)
  Gunakan contoh flow ini sebagai inspirasi, sesuaikan dengan topik konten.
- BODY RULES (CRITICAL): Body WAJIB 2-3 kalimat (100-200 karakter) untuk carousel (>1 slide). Body boleh 0-1 kalimat untuk single feed (1 slide). JANGAN PERNAH kosong untuk carousel.
- DYNAMIC LANGUAGE & TONE (CRITICAL): ${isOneformind ? 'You MUST output 100% of the content in ENGLISH. No exceptions.' : 'Analyze the language of the persona/master prompt above. If it is in English, you MUST output 100% of the content in English. If it is in Indonesian, output in Indonesian. The tone must be perfectly aligned with the persona. If no persona is provided, default to a smart, engaging, casual tone.'}
- Slide 1: HOOK — surprising statement, bold question, or scroll-stopping headline.
${numSlides > 1 ? `- Slides 2 to ${numSlides - 1}: VALUE — clear, actionable tips, story, or insights that connect perfectly to the previous slide.\n- Slide ${numSlides}: FYP HACK (CRITICAL) — You MUST add a strong "Save" or "Share" Call-To-Action (e.g., "Save post ini buat dibaca lagi nanti" or "Share ke teman lo yang butuh nasehat ini"). Saves and Shares are the most important ranking signals.` : '- Slide 1 CTA: FYP HACK (CRITICAL) — Incorporate a subtle but strong "Save" or "Share" call to action in the caption to boost ranking signals.'}
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

        // Clamp slides to 1-5
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