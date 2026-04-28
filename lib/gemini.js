import { GoogleGenerativeAI } from '@google/generative-ai';
import sql from './database.js';

export async function generateThreadsContent(platform = 'threads', imageData = null, customPromptOverride = null, accountId = 1) {
  const apiKeyRow = await sql`SELECT value FROM settings WHERE key = 'gemini_api_key'`;
  const globalPromptRow = await sql`SELECT value FROM settings WHERE key = 'prompt'`;
  const accountRow = await sql`SELECT master_prompt FROM accounts WHERE id = ${accountId}`;
  
  const apiKey = apiKeyRow[0]?.value;
  if (!apiKey) throw new Error('Gemini API Key not set.');

  // Combined Prompt Logic: Master Prompt (Personality) + Custom Override (Topic)
  const masterPrompt = accountRow[0]?.master_prompt || globalPromptRow[0]?.value || 'Share a helpful insight.';
  const specificTask = customPromptOverride ? `TODAY'S TOPIC: ${customPromptOverride}` : '';

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelNames = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-pro',
    'gemini-pro'
  ];
  
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      console.log(`[Gemini-Acc:${accountId}] Attempting ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const limit = '450';
      
      const platformPrompt = `
CORE PERSONALITY & STYLE:
${masterPrompt}

CURRENT TASK:
${specificTask || 'Generate a standard high-quality post based on your core personality.'}

STRICT RULES:
- Strictly for THREADS. 
- ABSOLUTE CHARACTER LIMIT: 450 characters. DO NOT EXCEED THIS.
- ${imageData ? 'IMPORTANT: Analyze the attached image and write a post about it matching your style.' : ''}
- IMPORTANT: Do NOT include platform labels like "Threads:" or "**Threads:**". 
- IMPORTANT: DO NOT USE HASHTAGS.
- Output ONLY the final post content.`;

      let result;
      if (imageData) {
        let mimeType = "image/jpeg";
        if (imageData.startsWith("data:")) {
          mimeType = imageData.split(';')[0].split(':')[1];
        }
        
        result = await model.generateContent([
          platformPrompt,
          {
            inlineData: {
              data: imageData.split(',')[1] || imageData,
              mimeType: mimeType
            }
          }
        ]);
      } else {
        result = await model.generateContent(platformPrompt);
      }
      
      const response = await result.response;
      let text = response.text().trim();

      const labelRegex = /^((\*\*|__)?Threads(\*\*|__)?[:\s-]*)/i;
      text = text.replace(labelRegex, '').trim();
      text = text.replace(/^Threads[:\s-]*/i, '').trim();
      
      // Safety: Remove all hashtags
      text = text.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();

      // --- STRIKTUR SENSOR KARAKTER ---
      if (text.length > 500) {
        console.warn(`[Gemini-Acc:${accountId}] Post too long (${text.length} chars). Retrying shorter...`);
        return await generateThreadsContent(platform, imageData, `REWRITE SHORTER (MAX 400 CHARS). ORIGINAL: ${text}`, accountId);
      }

      console.log(`[Gemini-Acc:${accountId}] Generated ${text.length} chars using ${modelName}`);
      return text;
    } catch (e) {
      console.warn(`[Gemini-Acc:${accountId}] Model ${modelName} failed:`, e.message);
      
      // Retry logic for 429/503 (omitted for brevity in this rewrite but implied in production)
      lastError = e;
      continue;
    }
  }

  throw new Error(`Gemini failed all model attempts for Account ${accountId}.`);
}

export async function generateShopeeAffiliatePost(product, accountId = 1) {
  const apiKeyRow = await sql`SELECT value FROM settings WHERE key = 'gemini_api_key'`;
  const apiKey = apiKeyRow[0]?.value;

  if (!apiKey) throw new Error('Gemini API Key missing.');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are a friendly Indonesian affiliate marketer who loves sharing "racun Shopee" (great product finds).
    Write a Threads post to promote this product:
    
    Product Title: "${product.title}"
    Price: "${product.price}"
    Affiliate Link: "${product.shopeeUrl}"
    
    STYLE:
    - Language: Casual Indonesian (Bahasa Gaul/Santai).
    - Tone: Helpful, enthusiastic, and persuasive.
    - Format: Start with a hook, mention the price/benefits, and end with a clear CTA to click the link.
    
    STRICT RULES:
    - DO NOT use hashtags.
    - DO NOT exceed 450 characters.
    - Include the affiliate link at the end.
    - Output ONLY the caption text.
  `;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Clean up labels
    text = text.replace(/^(Threads|Post):/i, '').trim();
    
    // Final safety check
    if (text.length > 500) {
        return text.substring(0, 497) + '...';
    }
    
    console.log(`[Gemini-Shopee] Generated caption for: ${product.title}`);
    return text;
  } catch (error) {
    console.error('[Gemini-Shopee] AI Error:', error.message);
    throw error;
  }
}

