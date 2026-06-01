import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config({ override: true });

async function testGeminiImage() {
  const keys = [
    { name: 'GEMINI_API_KEY', key: process.env.GEMINI_API_KEY },
    { name: 'GEMINI_API_KEY_2', key: process.env.GEMINI_API_KEY_2 },
    { name: 'GEMINI_API_KEY_3', key: process.env.GEMINI_API_KEY_3 }
  ];

  for (const { name, key } of keys) {
    if (!key) {
      console.log(`[${name}] is not set.`);
      continue;
    }
    
    console.log(`\nTesting [${name}] ...`);
    const genAI = new GoogleGenerativeAI(key);
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
      const prompt = "A vast desolate plain under an intensely close sun, depicting Padang Mahsyar.";
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      const candidates = response.candidates;
      if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
        const parts = candidates[0].content.parts;
        const imagePart = parts.find(p => p.inlineData);
        if (imagePart) {
          console.log(`✅ SUCCESS with ${name}! MIME type: ${imagePart.inlineData.mimeType}`);
          const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
          fs.writeFileSync(`test_gemini_image_${name}.jpg`, buffer);
          console.log(`✅ Saved to test_gemini_image_${name}.jpg (Size: ${buffer.length} bytes)`);
          return; // Exit if we found a working key
        } else {
           console.log(`❌ FAILED with ${name}: No image part found in response parts.`);
        }
      } else {
        console.log(`❌ FAILED with ${name}: No candidates or content found.`);
      }
    } catch (error) {
      console.error(`❌ ERROR with ${name}:`, error.message.split('\n')[0]); // Only print first line of error
    }
  }
  console.log('\n❌ None of the provided Gemini API keys support image generation on the free tier.');
}

testGeminiImage();
