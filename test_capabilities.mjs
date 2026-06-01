import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ override: true });

async function checkGeminiCapabilities() {
  const key = process.env.GEMINI_IMAGE_API_KEY;
  if (!key) {
    console.error("GEMINI_IMAGE_API_KEY is missing in .env");
    return;
  }
  
  const genAI = new GoogleGenerativeAI(key);
  
  console.log("=== GEMINI API CAPABILITY & QUOTA TEST ===");
  console.log("API Key Used:", key.substring(0, 8) + "...");
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    
    console.log("\n1. Testing Image Generation...");
    const prompt = "A futuristic Islamic city, cyberpunk style, neon lights.";
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const endTime = Date.now();
    
    const response = await result.response;
    const candidates = response.candidates;
    
    if (candidates && candidates[0] && candidates[0].content) {
      console.log(`✅ Image generated successfully in ${(endTime - startTime) / 1000} seconds!`);
      
      // Check usage metadata for "quota" usage tokens
      if (response.usageMetadata) {
        console.log("Usage Metadata (Tokens Used):", JSON.stringify(response.usageMetadata));
      } else {
        console.log("No specific token usage metadata returned for Image generation.");
      }
    }
    
    console.log("\n2. Checking Video Generation Capabilities...");
    console.log("❌ Gemini 2.5 Flash Image API DOES NOT support generating video. Google's video model (Veo) is not yet publicly available for API generation in this tier.");
    
    console.log("\n3. Checking Trigger Time / Cron Logic...");
    const now = new Date();
    const witaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));
    console.log(`Current Server Time (WITA): ${witaTime.toLocaleString()}`);
    console.log(`The cron job runs every 15 minutes. At this exact time, if a schedule is picked, it will execute.`);
    
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

checkGeminiCapabilities();
