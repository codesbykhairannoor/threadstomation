import sql from './database.js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-9c1ecfec0cb74f72a020e6ea6b7728e0';

/**
 * Generate Instagram content using DeepSeek API
 * Returns: { slides: [{title, body, image_prompt}], caption: string, hashtags: string[] }
 */
export async function generateInstagramContent(customPrompt, masterPrompt = '') {
  if (!DEEPSEEK_API_KEY) throw new Error('No DeepSeek API Key available.');

  const numSlides = Math.floor(Math.random() * 3) + 3; // 3–5 slides

  const systemPrompt = `
${masterPrompt ? `PERSONA & STYLE:\n${masterPrompt}\n\n` : ''}
TASK:
Create a professional Instagram photo carousel with exactly ${numSlides} slides about: "${customPrompt || 'an interesting topic based on your persona'}"

OUTPUT FORMAT (strict JSON, no markdown):
{
  "slides": [
    { 
      "title": "Slide title max 40 chars", 
      "body": "Slide body content (150-250 chars).",
      "image_prompt": "A detailed english prompt describing the background image for this slide, focusing on atmosphere, Islamic architecture, nature, or abstract themes. Keep it safe for work." 
    }
  ],
  "caption": "Instagram caption, highly engaging, 150-400 chars, supports emojis, friendly tone, casual Indonesian or English",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}
Note: Make sure the "slides" array has exactly ${numSlides} objects.

STRICT RULES:
- NARRATIVE FLOW: The content MUST flow naturally from one slide to the next like a continuous story or essay. Slide 2 should continue the thought from Slide 1, and so on. Do not make them isolated quotes!
- TONE & STYLE (CRITICAL): Write in "Bahasa santai anak muda" (casual youth style). You may use 'lo' and 'gue' to sound like a close friend. BUT DO NOT BE CRINGE OR "ALAY". STRICTLY PROHIBITED words: "jujurly", "literally", "which is", etc. The tone must be relaxed, engaging, and smart/elegant, like a cool, intelligent friend having a deep but casual conversation.
- STRICT JSON FORMAT: Make sure ALL keys and string values are enclosed in double quotes ("). Do not leave unquoted strings (e.g. hashtags must be ["#tag1", "#tag2"] NOT ["#tag1", #tag2]).
- Slide 1: HOOK — surprising statement, bold question, or scroll-stopping headline that young people care about
- Slides 2 to ${numSlides - 1}: VALUE — clear, actionable tips, story, or insights that connect perfectly to the previous slide
- Slide ${numSlides}: CTA — clear call to action (e.g. Save this post, comment below, share)
- Tone: Matches the persona defined in master prompt, but always keep it heavily casual, smart, and relatable without being cringe.
`;

  console.log(`[Instagram-DeepSeek] Generating content for ${numSlides} slides...`);
  
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please generate the JSON carousel content now." }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  
  // Strip markdown code block if present
  let raw = data.choices[0].message.content.trim();
  raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  // Regex fix for unquoted hashtags like:  "#tag1", #tag2, "#tag3"
  // This will wrap any unquoted #hashtag in quotes
  raw = raw.replace(/([\[,]\s*)(#[a-zA-Z0-9_]+)(\s*[,\]])/g, '$1"$2"$3');
  raw = raw.replace(/([\[,]\s*)(#[a-zA-Z0-9_]+)(\s*[,\]])/g, '$1"$2"$3'); // Run twice for overlapping matches

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse DeepSeek JSON response: ${raw}`);
  }

  // Validate structure
  if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length < 2) {
    throw new Error('Invalid carousel structure from DeepSeek');
  }

  // Clamp slides to 3–5
  parsed.slides = parsed.slides.slice(0, 5);

  console.log(`[Instagram-DeepSeek] ✅ Content generated successfully with ${parsed.slides.length} slides`);
  return parsed;
}
