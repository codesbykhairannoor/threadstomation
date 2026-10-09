import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';
import { robustAiGenerate } from './stealth_reach_engine.js';

export const NOSTR_TARGET_WEBSITES = [
  {
    key: 'tranvas',
    name: 'Tranvas',
    url: 'https://tranvas.com',
    niche: 'Unified Life OS & Personal Management',
    tagline: 'Replace 7 fragmented SaaS subscriptions with one fast, sovereign personal OS.',
    hashtags: ['freedomtech', 'productivity', 'selfhosted', 'opensource', 'privacy']
  },
  {
    key: 'solvemymedia',
    name: 'SolveMyMedia',
    url: 'https://solvemymedia.com',
    niche: 'In-Browser WASM & WebCodecs Media Suite',
    tagline: 'Compress, convert, transcribe, and trim video/audio 100% in browser RAM. Zero cloud uploads.',
    hashtags: ['webassembly', 'privacy', 'opensource', 'webcodecs', 'developer']
  },
  {
    key: 'createmyqr',
    name: 'CreateMy-QR',
    url: 'https://createmy-qr.com',
    niche: '37 Client-side Permanent QR & Barcode Tools',
    tagline: 'Permanent client-side QR codes. Never get extorted by expiring scam QR generators.',
    hashtags: ['privacy', 'foss', 'tools', 'freedomtech', 'webdev']
  },
  {
    key: 'helpmyimg',
    name: 'HelpMyImg',
    url: 'https://helpmyimg.com',
    niche: 'In-browser WebAssembly Image Processing Suite',
    tagline: 'Local browser WASM image tools: compress, strip background, convert with zero server uploads.',
    hashtags: ['webassembly', 'privacy', 'design', 'opensource', 'webdev']
  },
  {
    key: 'handlemyfile',
    name: 'HandleMyFile',
    url: 'https://handlemyfile.com',
    niche: 'In-browser Document & PDF Suite via WebAssembly',
    tagline: 'Sovereign document processing: merge, compress, OCR, e-sign PDFs directly in device RAM.',
    hashtags: ['privacy', 'pdf', 'security', 'freedomtech', 'opensource']
  }
];

export async function generateNostrPost(websiteKey = 'tranvas', customPrompt = null) {
  const target = NOSTR_TARGET_WEBSITES.find(w => w.key === websiteKey) || NOSTR_TARGET_WEBSITES[0];

  const systemInstruction = `
You are Adhlil (@khaithisran), a sovereign software engineer creating high-signal notes on Nostr.
Your audience on Nostr are tech-savvy developers, cypherpunks, Bitcoiners, and open-web advocates who value:
- Client-side execution (WASM, WebCodecs)
- Zero telemetry and zero cloud surveillance
- Rejecting VC bloated SaaS subscriptions ($20/mo just to compress a video or edit a PDF)
- Software craftsmanship, performance, and digital sovereignty

TASK: Write an authentic, insightful Nostr note (kind 1) highlighting ${target.name} (${target.url}).
Niche: ${target.niche}.
Key benefit: ${target.tagline}.

RULES:
1. Length: 150 - 280 words. Punchy, authentic, developer-to-developer tone.
2. NEVER sound like a corporate marketing broadcast or sponsored ad. Sound like a builder sharing their philosophy or an engineer calling out bad SaaS practices.
3. Include the clean URL (${target.url}) naturally in the note.
4. Add 3 to 4 relevant Nostr hashtags at the end (e.g. #${target.hashtags.join(' #')}).
5. No emojis overload (maximum 1-2 subtle emojis).
`.trim();

  const userPrompt = customPrompt || `Write an engaging Nostr note about why building client-side, zero-tracking tools like ${target.url} is the only ethical future for web software.`;

  try {
    const aiOutput = await robustAiGenerate(
      (model) => model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }
        ],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 500,
        }
      }),
      'nostr-content'
    );

    const text = (aiOutput.response?.text() || '').trim();
    if (text && text.length > 50) {
      return {
        text,
        website: target,
        hashtags: target.hashtags
      };
    }
  } catch (err) {
    console.warn('[Nostr-Content] AI generation error, using procedural fallback:', err.message);
  }

  // Fallback procedural generator if AI fails
  const proceduralTemplates = [
    `Cloud services want you to upload private files to their remote servers, wait in queue, and pay $20/month just to perform basic utility operations.\n\nWe don't need server-side bloatware for everyday tasks. With WebAssembly and modern browser APIs, computation belongs in local RAM on your own device.\n\nCheck out ${target.url} — ${target.tagline}\n\n#${target.hashtags.join(' #')}`,
    `Software bloat has gotten out of hand. You shouldn't need a cloud login or subscription just for ${target.niche.toLowerCase()}.\n\nBuilt ${target.name} to run 100% client-side with zero tracking, zero uploads, and instant speed: ${target.url}\n\n#${target.hashtags.join(' #')}`,
    `The future of personal tools is sovereign and local-first.\n\n${target.name} (${target.url}): ${target.tagline}\n\nNo accounts, no paywalls, no surveillance capitalism.\n\n#${target.hashtags.join(' #')}`
  ];

  const fallbackText = proceduralTemplates[Math.floor(Math.random() * proceduralTemplates.length)];
  return {
    text: fallbackText,
    website: target,
    hashtags: target.hashtags
  };
}
