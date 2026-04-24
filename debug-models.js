import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function list() {
  try {
    // In newer versions of the SDK, you might need to use a different approach or version
    console.log("Fetching models...");
    // Let's try the direct fetch if the SDK is being weird
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await resp.json();
    if (data.models) {
        console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
    } else {
        console.log("No models found or error:", data);
    }
  } catch (e) {
    console.error(e);
  }
}
list();
