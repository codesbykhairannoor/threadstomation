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
    'gemini-1.5-flash',
    'gemini-2.0-flash',
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

      const promptParts = [platformPrompt];
      if (imageData) {
        promptParts.push({
          inlineData: {
            data: imageData.split(',')[1] || imageData,
            mimeType: "image/jpeg"
          }
        });
      }

      const result = await model.generateContent(promptParts);
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
      lastError = e;

      if (e.message.includes('404') || e.message.includes('403') || e.message.includes('429')) {
        continue; 
      }
      throw e; 
    }
  }

  throw new Error(`Gemini failed all model attempts.`);
}
