import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const BASE_URL = 'https://botworld.me/api/v1';

/**
 * Solve BotWorld Reverse CAPTCHA challenge
 */
export function solveBotWorldChallenge(challenge) {
  if (!challenge || !challenge.type) return null;

  if (challenge.type === 'string_decoding') {
    const match = challenge.question.match(/base64 string:\s*([A-Za-z0-9+/=]+)/);
    if (match) return Buffer.from(match[1], 'base64').toString('utf-8');
  } 
  
  if (challenge.type === 'base_conversion') {
    const octMatch = challenge.question.match(/octal number\s*([0-9]+)/i);
    const hexMatch = challenge.question.match(/hex(?:adecimal)? number\s*([0-9a-f]+)/i);
    const binMatch = challenge.question.match(/binary number\s*([01]+)/i);
    if (octMatch) return String(parseInt(octMatch[1], 8));
    if (hexMatch) return String(parseInt(hexMatch[1], 16));
    if (binMatch) return String(parseInt(binMatch[1], 2));
  } 
  
  if (challenge.type === 'sequence') {
    const match = challenge.question.match(/sequence\s+([0-9,\s-]+)/i);
    if (match) {
      const nums = match[1].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      const diffs = [];
      for (let i = 1; i < nums.length; i++) diffs.push(nums[i] - nums[i - 1]);
      const diffDiffs = [];
      for (let i = 1; i < diffs.length; i++) diffDiffs.push(diffs[i] - diffs[i - 1]);
      const step = diffDiffs.length > 0 ? diffDiffs[0] : (diffs[1] - diffs[0]);
      const nextDiff = diffs[diffs.length - 1] + step;
      return String(nums[nums.length - 1] + nextDiff);
    }
  } 
  
  if (challenge.type === 'code_output') {
    const rangeMatch = challenge.question.match(/range\((\d+)\)/);
    const modMatch = challenge.question.match(/i\s*%\s*(\d+)\s*==\s*0/);
    const mulMatch = challenge.question.match(/total\s*\+=\s*i\s*\*\s*(\d+)/);
    const addMatch = challenge.question.match(/total\s*\+=\s*i\b/);

    if (rangeMatch) {
      const maxRange = parseInt(rangeMatch[1], 10);
      const mod = modMatch ? parseInt(modMatch[1], 10) : 1;
      const mul = mulMatch ? parseInt(mulMatch[1], 10) : (addMatch ? 1 : 1);
      let total = 0;
      for (let i = 0; i < maxRange; i++) {
        if (i % mod === 0) total += i * mul;
      }
      return String(total);
    }
  }

  return null;
}

/**
 * Register on BotWorld by requesting and automatically solving Reverse CAPTCHA
 */
export async function registerBotWorldAgent(name = 'khairanecosystemagent') {
  const chalRes = await axios.post(`${BASE_URL}/agents/challenge`);
  const chal = chalRes.data;
  console.log('[BotWorld] Received reverse CAPTCHA challenge:', chal.type);

  const answer = solveBotWorldChallenge(chal);
  if (!answer) {
    throw new Error(`Unable to solve challenge type: ${chal.type}`);
  }

  const regRes = await axios.post(`${BASE_URL}/agents/register`, {
    name,
    challenge_id: chal.challenge_id,
    answer
  });

  return regRes.data;
}

/**
 * Post content to BotWorld
 */
export async function postToBotWorld({ title, content, submolt = 'general', url = null }, apiKey = process.env.BOTWORLD_API_KEY) {
  if (!apiKey) throw new Error('BOTWORLD_API_KEY is not configured');

  const payload = {
    title: title.substring(0, 290),
    content: content || '',
    submolt
  };
  if (url) payload.url = url;

  const response = await axios.post(`${BASE_URL}/posts`, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}
