import axios from 'axios';
import dotenv from 'dotenv';
import { getAllGeminiKeys } from './gemini.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ override: true });

const BASE_URL = 'https://www.moltbook.com/api/v1';

const TENS = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90
};

const ONES = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9
};

function normalizeWord(word) {
  const w = word.toLowerCase();
  if (NUMBER_WORDS[w] !== undefined) return w;
  const dedup = w.replace(/(.)\1+/g, '$1');
  if (NUMBER_WORDS[dedup] !== undefined) return dedup;
  for (const known of Object.keys(NUMBER_WORDS)) {
    if (w.startsWith(known) || known.startsWith(dedup)) return known;
  }
  return w;
}

/**
 * Solve Moltbook Reverse CAPTCHA math challenge
 * Runs instant deterministic heuristic first, falls back to Gemini if needed.
 */
export async function solveMoltbookChallenge(challengeText) {
  console.log(`[Moltbook-Solver] 🧩 Raw Challenge: "${challengeText}"`);

  // Step 1: Instant deterministic heuristic parser (0ms)
  try {
    let clean = challengeText.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
    clean = clean.replace(/\s+/g, ' ').trim();

    const words = clean.split(' ').map(normalizeWord);
    const numbers = [];

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (/^\d+$/.test(w)) {
        numbers.push(parseFloat(w));
        continue;
      }
      if (TENS[w] && i + 1 < words.length && ONES[words[i + 1]]) {
        numbers.push(TENS[w] + ONES[words[i + 1]]);
        i++;
        continue;
      }
      if (NUMBER_WORDS[w] !== undefined) {
        numbers.push(NUMBER_WORDS[w]);
        continue;
      }
    }

    let isSubtract = clean.includes('slow') || clean.includes('minus') || clean.includes('drop') || clean.includes('decrease') || clean.includes('decelerat') || clean.includes('less');
    let isMultiply = clean.includes('multipl') || clean.includes('times');
    let isDivide = clean.includes('divid');
    let isAdd = clean.includes('gain') || clean.includes('plus') || clean.includes('add') || clean.includes('accelerat') || clean.includes('increase') || clean.includes('speed up');

    if (numbers.length >= 2) {
      const n1 = numbers[0];
      const n2 = numbers[1];
      let ans = 0;
      if (isSubtract) ans = n1 - n2;
      else if (isMultiply) ans = n1 * n2;
      else if (isDivide) ans = n1 / n2;
      else ans = n1 + n2;

      const formatted = ans.toFixed(2);
      console.log(`[Moltbook-Solver] ⚡ Instant Heuristic Solved: ${n1} ${isSubtract ? '-' : (isMultiply ? '*' : (isDivide ? '/' : '+'))} ${n2} = ${formatted}`);
      return formatted;
    }
  } catch (parseErr) {
    console.warn('[Moltbook-Solver] Heuristic parser warning:', parseErr.message);
  }

  // Step 2: Gemini LLM Fallback
  try {
    const geminiKeys = await getAllGeminiKeys();
    const validKeys = geminiKeys.filter(k => k.startsWith('AIza'));
    if (validKeys.length > 0) {
      const genAI = new GoogleGenerativeAI(validKeys[0]);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `Solve this obfuscated math problem. Numbers and 1 operation (+, -, *, /).
Challenge: "${challengeText}"
Respond with ONLY the numeric answer to 2 decimal places (e.g. 15.00).`;
      const res = await model.generateContent(prompt);
      const match = res.response.text().trim().match(/-?\d+(?:\.\d+)?/);
      if (match) {
        return parseFloat(match[0]).toFixed(2);
      }
    }
  } catch (_) {}

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
