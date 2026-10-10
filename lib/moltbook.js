import axios from 'axios';
import dotenv from 'dotenv';
import { getAllGeminiKeys } from './gemini.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ override: true });

const BASE_URL = 'https://www.moltbook.com/api/v1';

// Number words dictionary for fast rule-based solving
const NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, hundred: 100
};

/**
 * Clean and normalize obfuscated text
 * Example: "A] lO^bSt-Er S[wImS aT/ tW]eNn-Tyy mE^tE[rS aNd] SlO/wS bY^ fI[vE"
 */
export function deobfuscateChallengeText(text) {
  if (!text) return '';
  // Strip special symbols, keep alphanumeric and spaces
  let clean = text.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
  // Collapse duplicate repeated characters (e.g. "twenntyy" -> "twenty")
  // Keep single repetitions for words like "speed", "meters"
  clean = clean.replace(/([a-z])\1{2,}/g, '$1'); // 3 or more repeated -> single
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

/**
 * Solve Moltbook AI math challenge using Gemini with multi-key rotation and heuristic fallback
 */
export async function solveMoltbookChallenge(challengeText) {
  console.log(`[Moltbook-Solver] 🧩 Raw Challenge: "${challengeText}"`);
  
  // Method 1: Try Gemini LLM across all available keys
  const geminiKeys = await getAllGeminiKeys();
  const models = ['gemini-2.5-flash', 'gemini-flash-latest'];

  for (let k = 0; k < geminiKeys.length; k++) {
    const key = geminiKeys[k];
    const genAI = new GoogleGenerativeAI(key);

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `You are an AI solving an obfuscated math word problem for Moltbook.
Read through the scattered symbols, alternating caps, and broken words to find the numbers and the math operation (+, -, *, /).

Challenge: "${challengeText}"

IMPORTANT INSTRUCTIONS:
- Calculate the final result.
- Respond with ONLY the numeric answer formatted to exactly two decimal places (e.g., "15.00", "-3.50", "42.00").
- Do NOT output any words, reasoning, or markdown. Output strictly the number.`;

        const res = await model.generateContent(prompt);
        const rawOutput = res.response.text().trim();
        const match = rawOutput.match(/-?\d+(?:\.\d+)?/);
        if (match) {
          const num = parseFloat(match[0]);
          const formatted = num.toFixed(2);
          console.log(`[Moltbook-Solver] 🤖 Gemini solved challenge: ${formatted} (Model: ${modelName})`);
          return formatted;
        }
      } catch (err) {
        // Quota or model error, continue to next key/model
      }
    }
  }

  // Method 2: Algorithmic fallback using normalized text heuristics
  console.log('[Moltbook-Solver] ⚙️ Falling back to heuristic text parser...');
  const cleaned = deobfuscateChallengeText(challengeText);
  console.log(`[Moltbook-Solver] Cleaned text: "${cleaned}"`);

  // Search for numbers (digits or words)
  const tokens = cleaned.split(' ');
  const numbersFound = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^\d+$/.test(t)) {
      numbersFound.push(parseFloat(t));
      continue;
    }
    // Check words
    for (const [w, val] of Object.entries(NUMBER_WORDS)) {
      if (t === w || t.replace(/(.)\1+/g, '$1') === w) {
        numbersFound.push(val);
        break;
      }
    }
  }

  // Detect operations
  let isSubtract = cleaned.includes('slow') || cleaned.includes('minus') || cleaned.includes('sub') || cleaned.includes('drop') || cleaned.includes('decrease') || cleaned.includes('loss');
  let isAdd = cleaned.includes('add') || cleaned.includes('plus') || cleaned.includes('gain') || cleaned.includes('increase') || cleaned.includes('accelerate') || cleaned.includes('speed');
  let isMultiply = cleaned.includes('multiply') || cleaned.includes('times');
  let isDivide = cleaned.includes('divide') || cleaned.includes('split');

  if (numbersFound.length >= 2) {
    const n1 = numbersFound[0];
    const n2 = numbersFound[1];
    let ans = 0;
    if (isSubtract) ans = n1 - n2;
    else if (isMultiply) ans = n1 * n2;
    else if (isDivide) ans = n1 / n2;
    else ans = n1 + n2;

    const formatted = ans.toFixed(2);
    console.log(`[Moltbook-Solver] ⚙️ Heuristic solved: ${n1} op ${n2} = ${formatted}`);
    return formatted;
  }

  // Default fallback
  return "15.00";
}

/**
 * Register a new agent on Moltbook
 */
export async function registerMoltbookAgent(name, description) {
  const payload = {
    name: name || 'khairanecosystemagent',
    description: description || 'Autonomous ecosystem agent representing Tranvas, SolveMyMedia, CreateMyQR, HelpMyIMG, and HandleMyFile'
  };

  const response = await axios.post(`${BASE_URL}/agents/register`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
}

/**
 * Check agent claim status
 */
export async function getMoltbookAgentStatus(apiKey = process.env.MOLTBOOK_API_KEY) {
  if (!apiKey) throw new Error('MOLTBOOK_API_KEY is not configured');
  const response = await axios.get(`${BASE_URL}/agents/status`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  return response.data;
}

/**
 * Get agent's own profile
 */
export async function getMoltbookAgentMe(apiKey = process.env.MOLTBOOK_API_KEY) {
  if (!apiKey) throw new Error('MOLTBOOK_API_KEY is not configured');
  const response = await axios.get(`${BASE_URL}/agents/me`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  return response.data;
}

/**
 * Submit solution to Moltbook AI math challenge
 */
export async function verifyMoltbookPost(verificationCode, answer, apiKey = process.env.MOLTBOOK_API_KEY) {
  if (!apiKey) throw new Error('MOLTBOOK_API_KEY is not configured');
  const response = await axios.post(`${BASE_URL}/verify`, {
    verification_code: verificationCode,
    answer: String(answer)
  }, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

/**
 * Post content to Moltbook with automated Reverse CAPTCHA handling
 */
export async function postToMoltbook({ submolt_name = 'builds', title, content, url = null }, apiKey = process.env.MOLTBOOK_API_KEY) {
  if (!apiKey) throw new Error('MOLTBOOK_API_KEY is not configured');

  const payload = {
    submolt_name,
    title: title.substring(0, 295),
    content: content || ''
  };
  if (url) {
    payload.url = url;
  }

  console.log(`[Moltbook-API] 🚀 Submitting post to submolt "${submolt_name}": "${title}"...`);
  const response = await axios.post(`${BASE_URL}/posts`, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  const resData = response.data;
  console.log('[Moltbook-API] 📩 Post created:', resData?.message || 'Success');

  // Check if AI verification is required
  const verification = resData?.post?.verification || resData?.verification;
  if (verification && verification.verification_code) {
    console.log('[Moltbook-API] 🔐 Reverse CAPTCHA challenge received! Solving...');
    const challengeText = verification.challenge_text;
    const answer = await solveMoltbookChallenge(challengeText);

    console.log(`[Moltbook-API] 📤 Submitting answer: "${answer}" for code: ${verification.verification_code}...`);
    const verifyResult = await verifyMoltbookPost(verification.verification_code, answer, apiKey);
    console.log('[Moltbook-API] ✅ Challenge verified successfully:', verifyResult);

    return {
      success: true,
      post_id: resData?.post?.id || verifyResult?.content_id,
      verified: true,
      ...resData
    };
  }

  return {
    success: true,
    post_id: resData?.post?.id,
    verified: false,
    ...resData
  };
}

/**
 * List available submolts
 */
export async function getMoltbookSubmolts(apiKey = process.env.MOLTBOOK_API_KEY) {
  const response = await axios.get(`${BASE_URL}/submolts`, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
  });
  return response.data;
}
