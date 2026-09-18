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
  const geo = isEnglish ? 'US' : 'ID';
  const niche = isEnglish ? 'productivity OR "second brain" OR tech OR "deep work"' : 'kerja OR rezeki OR produktivitas OR "kesehatan mental"';
  
  console.log(`[Trend-Hunter] 🛰️ Scanning real-time viral trends for ${accountName} (Geo: ${geo})...`);
  const liveTrends = await fetchLiveTrends(geo, niche);
  
  if (!liveTrends || liveTrends.length === 0) {
    console.log('[Trend-Hunter] No real-time trends captured. Using default angle.');
    return customPrompt || masterPrompt;
  }

  console.log(`[Trend-Hunter] ⚡ Found ${liveTrends.length} live trending topics (Top: "${liveTrends[0]?.topic}")`);

  const apiKeys = await getAllGeminiKeys();
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

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
{
  "trending_keyword": "The exact keyword from the list",
  "newsjacked_prompt": "A sharp, high-urgency prompt instructing what angle to take, referencing today's trend seamlessly without sounding forced."
}
`;

  for (let i = 0; i < apiKeys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(apiKeys[i]);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const res = await model.generateContent(prompt);
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

  return customPrompt || `${masterPrompt} (Trend focus: ${liveTrends[0]?.topic})`;
}
