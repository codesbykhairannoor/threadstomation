import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';

/**
 * Open-Source Real-Time Trend Scraper
 * Uses Google Trends Real-Time RSS & Google News Hype RSS (0 API keys required, 100% reliable)
 */
export async function fetchLiveTrends(geo = 'US', nicheQuery = '') {
  const trends = [];

  // 1. Google Trends Real-Time Search Feed (Top searched queries right now with search volume)
  try {
    const resGt = await axios.get(`https://trends.google.com/trending/rss?geo=${geo}`, { timeout: 6000 });
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<ht:approx_traffic>(.*?)<\/ht:approx_traffic>[\s\S]*?<\/item>/g;
    let match;
    while ((match = itemRegex.exec(resGt.data)) !== null && trends.length < 8) {
      trends.push({
        topic: match[1].trim(),
        volume: match[2].trim(),
        source: 'Google Search Trends'
      });
    }
  } catch (e) {
    console.warn('[Trend-Hunter] Google Trends RSS notice:', e.message);
  }

  // 2. Google News Live Hype RSS (Breaking stories in target niche)
  try {
    let query = nicheQuery;
    if (!query) {
      query = geo === 'ID' 
        ? 'produktivitas OR "kesehatan mental" OR "gaya hidup" OR rezeki OR kerja'
        : 'productivity OR "second brain" OR burnout OR "deep work" OR AI';
    }
    const lang = geo === 'ID' ? 'hl=id&gl=ID&ceid=ID:id' : 'hl=en-US&gl=US&ceid=US:en';
    const resNews = await axios.get(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${lang}`, { timeout: 6000 });
    const newsRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<\/item>/g;
    let match;
    let count = 0;
    while ((match = newsRegex.exec(resNews.data)) !== null && count < 5) {
      const cleanTitle = match[1].replace(/ - [^-]+$/, '').replace(/&amp;/g, '&').trim();
      if (cleanTitle && !trends.some(t => t.topic.toLowerCase() === cleanTitle.toLowerCase())) {
        trends.push({
          topic: cleanTitle,
          volume: 'Breaking / High Discussion',
          source: 'Live Industry News'
        });
        count++;
      }
    }
  } catch (e) {
    console.warn('[Trend-Hunter] Google News RSS notice:', e.message);
  }

  return trends;
}

/**
 * Uses Gemini to evaluate live trends and "newsjack" the most viral angle
 * for a specific account persona and topic.
 */
export async function getNewsjackedAngle(accountName = '', masterPrompt = '', customPrompt = null, isEnglish = false) {
  const normName = (accountName || '').toLowerCase();
  
  // Dynamic Niche Query tailored to account persona
  let niche = '';
  if (normName.includes('adhlil')) {
    niche = isEnglish 
      ? 'burnout OR "mental health" OR "work life" OR hustle OR loneliness'
      : 'rezeki OR "kesehatan mental" OR burnout OR "lelah kerja" OR "gaya hidup" OR renungan';
  } else if (normName.includes('sharesa')) {
    niche = isEnglish
      ? 'cybersecurity OR "data privacy" OR SaaS OR "web development" OR "file conversion"'
      : 'bisnis OR UMKM OR website OR "privasi data" OR teknologi OR kerjaan';
  } else if (normName.includes('tranvas')) {
    niche = isEnglish
      ? 'productivity OR "app fatigue" OR "second brain" OR "deep work" OR subscription'
      : 'produktivitas OR aplikasi OR kerja OR burnout OR "to-do list" OR fokus';
  } else if (normName.includes('khai') || normName.includes('bsky') || normName.includes('mastodon') || normName.includes('devto') || normName.includes('nostr')) {
    niche = 'tech OR AI OR SaaS OR privacy OR "open source" OR WebAssembly OR cloud OR cybersecurity';
  } else if (normName.includes('tiktok') || normName.includes('maritumbuh')) {
    niche = 'karir OR "fresh graduate" OR "info magang" OR "tips kerja" OR "dunia kerja" OR mahasiswa';
  } else if (normName.includes('oneformind')) {
    niche = '"second brain" OR productivity OR "cognitive overload" OR journaling OR mindset';
  } else {
    niche = isEnglish 
      ? 'productivity OR tech OR "deep work" OR AI OR software' 
      : 'kerja OR rezeki OR produktivitas OR "kesehatan mental" OR teknologi';
  }

  const geo = (isEnglish || normName.includes('khai') || normName.includes('bsky') || normName.includes('mastodon')) ? 'US' : 'ID';
  
  console.log(`[Trend-Hunter] 🛰️ Scanning real-time viral trends for ${accountName} (Geo: ${geo}, Niche: "${niche.slice(0, 35)}...")...`);
  const liveTrends = await fetchLiveTrends(geo, niche);
  
  if (!liveTrends || liveTrends.length === 0) {
    console.log('[Trend-Hunter] No real-time trends captured. Using default angle.');
    return customPrompt || masterPrompt;
  }

  console.log(`[Trend-Hunter] ⚡ Found ${liveTrends.length} live trending topics (Top: "${liveTrends[0]?.topic}")`);

  const allKeys = await getAllGeminiKeys();
  const apiKeys = allKeys.filter(k => k.startsWith('AIza'));
  if (!apiKeys || apiKeys.length === 0) {
    return customPrompt ? `${customPrompt} (Trending today: ${liveTrends[0]?.topic})` : liveTrends[0]?.topic;
  }

  const prompt = `
You are an ELITE viral social media growth hacker and newsjacking expert.
Account Name: ${accountName}
Persona / Brand Message: ${masterPrompt || 'Insightful creator sharing practical wisdom'}
Base Schedule Intent: "${customPrompt || 'Create a viral, high-retention post that gets massive views'}"

HERE ARE REAL-TIME TRENDS BREAKING THE INTERNET RIGHT NOW:
${liveTrends.map((t, i) => `${i + 1}. "${t.topic}" (${t.volume} - ${t.source})`).join('\n')}

TASK:
Analyze the trending topics above. Pick the SINGLE most relevant or attention-grabbing trend that can be smartly bridged (newsjacked) to the account's persona.
If the Base Schedule Intent is specific, fuse it seamlessly with the trending topic.

CRITICAL ACCOUNT SPECIFIC DIRECTIVES:
1. ADHLIL.CO (@adhlil.co):
   - Bridge the trend into a humble, deep reflection on life, inner peace, modern digital fatigue, rezeki, or tawakkal.
   - Tone: Humble companion, "self-reminder", gentle, thoughtful. STRICTLY NO PREACHINESS or arrogance.
2. TRANVAS (@tranvas):
   - Bridge the trend into a critique of over-engineering, app fatigue, paying for multiple subscriptions, or to-do list procrastination.
   - Position Tranvas as the clean, unified single workspace / Life OS.
3. SHARESA SPACE (@sharesa.space):
   - Bridge into owning digital assets (websites vs marketplace fee extortion) or client-side privacy tools (SolveMyMedia, HandleMyFile, CreateMyQR, HelpMyIMG).
4. KHAITHISRAN / FEDIVERSE / BLUESKY / NOSTR:
   - Bridge into tech sovereignty, anti-predatory SaaS, local-first WASM computing, or privacy protection.
5. MARITUMBUHBERSAMA (TIKTOK):
   - Bridge into practical workplace/study hacks, fresh grad survival, or free secret websites that save hours of work.

UNIVERSAL RULES:
- Do NOT write boring academic commentary.
- Do NOT write cheesy hard-selling ads ("klik link di bio", "promo terbatas", "cuan 24/7").
- Connect the news/trend to human PAIN & REALITY.
- ALWAYS ensure the angle ends with a compelling open question, choice, or debate prompt that forces users to comment!

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
{
  "trending_keyword": "The exact keyword from the list",
  "newsjacked_prompt": "A sharp, high-urgency angle instruction. Can be a 1-post punchy take (under 450 chars) or a short 2-4 post thread (MAX 4 posts). Always end with a discussion trigger question."
}
`;

  const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
  const withTimeout = (promise, ms = 12000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Newsjack AI timeout')), ms))
    ]);
  };

  for (let i = 0; i < apiKeys.length; i++) {
    for (const modelName of models) {
      try {
        const genAI = new GoogleGenerativeAI(apiKeys[i]);
        const model = genAI.getGenerativeModel({ model: modelName });
        const res = await withTimeout(model.generateContent(prompt), 12000);
        let raw = res.response.text().trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
        const parsed = JSON.parse(raw);
        if (parsed.newsjacked_prompt) {
          console.log(`[Trend-Hunter] 🔥 Newsjacked Trend: "${parsed.trending_keyword}" -> Angle: "${parsed.newsjacked_prompt.slice(0, 90)}..."`);
          return parsed.newsjacked_prompt;
        }
      } catch (err) {
        continue;
      }
    }
  }

  return customPrompt || `${masterPrompt} (Trend focus: ${liveTrends[0]?.topic})`;
}
