import { GoogleGenerativeAI } from '@google/generative-ai';
import sql from './database.js';

export async function generateThreadsContent(platform = 'threads', imageData = null) {
  const apiKeyRow = await sql`SELECT value FROM settings WHERE key = 'gemini_api_key'`;
  const promptTextRow = await sql`SELECT value FROM settings WHERE key = 'prompt'`;
  
  const apiKey = apiKeyRow[0]?.value;
  const promptText = promptTextRow[0]?.value;

  if (!apiKey) throw new Error('Gemini API Key not set.');

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelNames = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-001',
    'gemini-flash-latest',
    'gemini-pro-latest'
  ];
  
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      console.log(`[Gemini] Attempting ${modelName} for ${platform}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const limit = '450';
      const promptTextBase = promptText || 'Share a helpful daily tech/lifestyle insight.';
      
      const platformPrompt = `${promptTextBase} 
Strictly for THREADS. 
Character limit: ${limit} (including all text). 
${imageData ? 'IMPORTANT: Analyze the attached image and write a post about it.' : ''}
IMPORTANT: Do NOT include platform labels like "Threads:" or "**Threads:**". 
Output ONLY the final post content.`;

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
      
      // Safety: Remove all hashtags if they slipped through the prompt
      text = text.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();

      console.log(`[Gemini] Generated ${text.length} chars using ${modelName}`);
      return text;
    } catch (e) {
      console.warn(`[Gemini] Model ${modelName} failed:`, e.message);
      
      // Handle 429 (Rate Limit) - wait 5s and retry once
      if (e.message.includes('429') || e.message.includes('Too Many Requests')) {
        console.log(`[Gemini] Rate limit hit for ${modelName}, waiting 5s...`);
        await new Promise(r => setTimeout(r, 5000));
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = imageData ? await model.generateContent([platformPrompt, { inlineData: { data: imageData.split(',')[1] || imageData, mimeType: "image/jpeg" } }]) : await model.generateContent(platformPrompt);
          const response = await result.response;
          return response.text().trim();
        } catch (retryErr) {
          console.warn(`[Gemini] Retry for ${modelName} after 429 failed.`);
        }
      }

      // If it's a 503 (High demand), wait 2s and try one more time
      if (e.message.includes('503') || e.message.includes('Service Unavailable')) {
        console.log(`[Gemini] High demand detected for ${modelName}, retrying in 2s...`);
        await new Promise(r => setTimeout(r, 2000));
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = imageData ? await model.generateContent([platformPrompt, { inlineData: { data: imageData.split(',')[1] || imageData, mimeType: "image/jpeg" } }]) : await model.generateContent(platformPrompt);
          const response = await result.response;
          return response.text().trim();
        } catch (retryErr) {
          console.warn(`[Gemini] Retry for ${modelName} after 503 failed.`);
        }
      }
      
      lastError = e;
      continue;
    }
  }

  throw new Error(`Gemini failed all model attempts.`);
}
