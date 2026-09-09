import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '../scratch');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_BASE = 'https://api.pexels.com/videos/search';

// Cache: query -> local file path, so same query within a session reuses the same clip
const downloadCache = new Map();

/**
 * Extract the best-quality vertical (portrait) video file URL from a Pexels video object.
 * Prefer 1080x1920 HD, fallback to highest resolution portrait file available.
 * @param {object} video - Pexels video object
 * @returns {string|null}
 */
function getBestPortraitFileUrl(video) {
  const files = video.video_files || [];

  // First pass: exact 1080x1920 HD
  const hd1080 = files.find(f => f.width === 1080 && f.height === 1920 && f.quality === 'hd');
  if (hd1080) return hd1080.link;

  // Second pass: any HD portrait (height > width)
  const hdPortrait = files.filter(f => f.height > f.width && f.quality === 'hd')
    .sort((a, b) => b.width - a.width)[0];
  if (hdPortrait) return hdPortrait.link;

  // Third pass: best SD portrait
  const sdPortrait = files.filter(f => f.height > f.width)
    .sort((a, b) => b.width - a.width)[0];
  if (sdPortrait) return sdPortrait.link;

  return null;
}

/**
 * Search Pexels for a portrait video clip matching `query`.
 * Returns a random pick from the top 15 results to ensure variety.
 * @param {string} query - Keyword(s) for Pexels video search
 * @returns {Promise<string|null>} Pexels video URL or null
 */
async function searchPexelsVideoUrl(query) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.warn('[Pexels] PEXELS_API_KEY not set. Skipping B-Roll fetch.');
    return null;
  }

  try {
    const response = await axios.get(PEXELS_BASE, {
      headers: { Authorization: apiKey },
      params: {
        query,
        per_page: 15,
        orientation: 'portrait',  // Strictly vertical (9:16)
        size: 'medium',           // Medium to avoid huge downloads
      },
      timeout: 12000,
    });

    const videos = response.data.videos || [];
    if (!videos.length) {
      console.warn(`[Pexels] No results for query: "${query}"`);
      return null;
    }

    // Pick a random one from results to ensure variety across posts
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];
    const fileUrl = getBestPortraitFileUrl(randomVideo);

    if (!fileUrl) {
      console.warn('[Pexels] Could not find a suitable portrait file URL');
      return null;
    }

    console.log(`[Pexels] Found B-Roll clip: ${randomVideo.id} (${randomVideo.width}x${randomVideo.height}, ${randomVideo.duration}s)`);
    return fileUrl;
  } catch (err) {
    console.warn('[Pexels] Search failed:', err.message);
    return null;
  }
}

/**
 * Download a Pexels video URL to a temp file and return the local path.
 * Uses in-memory cache so the same query doesn't re-download within a session.
 * @param {string} videoUrl - Direct MP4 URL from Pexels
 * @param {string} sessionId - Unique session identifier for temp file naming
 * @returns {Promise<string|null>} Local file path or null
 */
async function downloadVideoToTemp(videoUrl, sessionId) {
  try {
    const tempPath = path.join(SCRATCH_DIR, `broll_${sessionId}.mp4`);
    console.log(`[Pexels] Downloading B-Roll clip...`);

    const response = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      maxContentLength: 100 * 1024 * 1024, // 100MB max
    });

    fs.writeFileSync(tempPath, Buffer.from(response.data));
    console.log(`[Pexels] B-Roll saved: ${tempPath} (${(response.data.byteLength / 1024 / 1024).toFixed(1)} MB)`);
    return tempPath;
  } catch (err) {
    console.warn('[Pexels] Download failed:', err.message);
    return null;
  }
}

/**
 * Main function: get a local portrait B-Roll clip for a given keyword query.
 * Handles searching, picking a random result, and downloading to scratch dir.
 * Falls back gracefully if API key is missing or download fails.
 *
 * @param {string} query - The topic/keyword to search for (e.g. "productivity", "money", "meditation")
 * @param {string} sessionId - Unique session ID for temp file naming
 * @returns {Promise<string|null>} Local path to downloaded MP4, or null on failure
 */
export async function fetchBRollClip(query, sessionId) {
  if (!fs.existsSync(SCRATCH_DIR)) {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  }

  // In-session cache: avoid fetching same query twice
  const cacheKey = `${query}_${sessionId}`;
  if (downloadCache.has(cacheKey)) {
    console.log(`[Pexels] Using cached B-Roll for "${query}"`);
    return downloadCache.get(cacheKey);
  }

  // Sanitize query — strip hashtags, emojis, excessive words
  const cleanQuery = query
    .replace(/#\w+/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)   // Pexels works best with 1-3 keyword terms
    .join(' ');

  console.log(`[Pexels] Searching B-Roll for: "${cleanQuery}"`);

  const videoUrl = await searchPexelsVideoUrl(cleanQuery || 'lifestyle');
  if (!videoUrl) return null;

  const localPath = await downloadVideoToTemp(videoUrl, sessionId);
  if (localPath) {
    downloadCache.set(cacheKey, localPath);
  }
  return localPath;
}

/**
 * Extract a simple keyword from a slide's content for Pexels search.
 * Prioritizes title_part1, then body, then falls back to a generic term.
 *
 * @param {object} slide - Gemini slide object (title_part1, title_part2, body, ...)
 * @param {string} masterPrompt - Account persona / master prompt for context
 * @returns {string}
 */
export function extractPexelsQuery(slide, masterPrompt = '') {
  const sources = [
    slide?.title_part1,
    slide?.body,
    slide?.background_theme,
    masterPrompt,
  ].filter(Boolean);

  // Use the first available source but strip to 3 most meaningful words
  const raw = sources[0] || 'business success';
  return raw
    .replace(/#\w+/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ');
}
