import { GoogleGenerativeAI } from '@google/generative-ai';
import db from './database.js';

export async function generateThreadsContent(platform = 'threads') {
  const apiKey = db.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").get()?.value;
  const promptText = db.prepare("SELECT value FROM settings WHERE key = 'prompt'").get()?.value;

  if (!apiKey) throw new Error('Gemini API Key not set.');

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // VERIFIED MODELS FROM 2026 AUDIT:
  // Using 'latest' aliases and 2.0/2.5 series which are active for this account.
  const modelNames = [
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-pro-latest',
    'gemini-2.5-flash'
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
IMPORTANT: Do NOT include platform labels like "Threads:" or "**Threads:**". 
Output ONLY the final post content.`;

      const result = await model.generateContent(platformPrompt);
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

      // Handle specific errors
      if (e.message.includes('404') || e.message.includes('403') || e.message.includes('429')) {
        continue; // Try next model
      }
      throw e; 
    }
  }

  throw new Error(`Gemini failed all model attempts. Verified models for this account include gemini-flash-latest and gemini-2.0-flash. Please ensure your API key permissions are correct.`);
}
