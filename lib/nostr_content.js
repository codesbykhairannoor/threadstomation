import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys } from './gemini.js';
import { robustAiGenerate } from './stealth_reach_engine.js';

export const NOSTR_TARGET_WEBSITES = [
  {
    key: 'tranvas',
    name: 'Tranvas',
    url: 'https://tranvas.com',
    niche: 'Unified Life Operating System (Planner, Habits, Finances, Goals, Journal, Career)',
    tagline: 'Eliminate the Friction Tax: Unify daily planning, habit streaks, budgeting, and career pipelines into one synchronized Life OS.',
    hashtags: ['productivity', 'lifeos', 'habits', 'deepwork', 'mindset', 'indiehackers']
  },
  {
    key: 'solvemymedia',
    name: 'SolveMyMedia',
    url: 'https://solvemymedia.com',
    niche: 'In-Browser WASM & WebCodecs Media Suite',
    tagline: 'Compress, convert, transcribe, and trim video/audio 100% in browser RAM. Zero cloud uploads, no watermarks.',
    hashtags: ['webassembly', 'privacy', 'opensource', 'webcodecs', 'developer']
  },
  {
    key: 'createmyqr',
    name: 'CreateMy-QR',
    url: 'https://createmy-qr.com',
    niche: '37 Client-side Permanent QR & Barcode Tools',
    tagline: 'Permanent client-side QR codes. Expose predatory SaaS holding menus hostage with expiring links.',
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
    tagline: 'Sovereign document processing: merge, compress, OCR, e-sign PDFs directly in device RAM without cloud exposure.',
    hashtags: ['privacy', 'pdf', 'security', 'freedomtech', 'opensource']
  }
];

export async function generateNostrPost(websiteKey = 'tranvas', customPrompt = null) {
  const target = NOSTR_TARGET_WEBSITES.find(w => w.key === websiteKey) || NOSTR_TARGET_WEBSITES[0];

  let systemInstruction;
  let userPrompt;
  let proceduralTemplates;

  if (target.key === 'tranvas') {
    systemInstruction = `
You are Adhlil (@khaithisran), the creator of Tranvas (https://tranvas.com).
Your audience on Nostr values high performance, deep work, behavioral discipline, mental clarity, and thoughtful system design.

ABOUT TRANVAS:
- Tranvas is a Unified Life Operating System (Life OS).
- The Problem ("The Friction Tax"): Most ambitious people juggle 6-7 fragmented apps—Todoist for tasks, Habitica for streaks, complex Excel sheets for finances, separate journals for reflections, and chaotic job trackers. Data is siloed, context is lost, and mental energy is constantly drained.
- The Solution: Tranvas unifies 8 essential modules into one synchronized, calm ecosystem:
  1. Daily Planner (clear priorities & time blocking)
  2. Habit Matrix (28-day & 365-day visual heatmaps, streak protection)
  3. Finance OS (zero-based budgeting, cashflow tracking, The Vault & multi-target savings)
  4. WOOP Goals (Wish, Outcome, Obstacle, If-Then scientific goal cascading)
  5. Mindful Journal (mental clarity & mood reflection correlated with productivity)
  6. Career & Job Tracker (pipeline from wishlist to offer + AI resume builder)
  7. Study & Focus Hub (Pomodoro focus sessions)
  8. Smart Calendar (single consolidated schedule)
- Powered by verified cognitive neuroscience and behavioral economics.
- Has a Free Forever tier (Explorer) and Power/AI tiers (Neural OS AI).

RULES:
1. Length: 120 - 220 words. Authentic founder/engineer tone, talking about eliminating app-switching fatigue and designing systems for real life.
2. NEVER claim Tranvas is an "offline WASM media converter without logins". Tranvas is a sophisticated Life OS workspace with accounts and neural AI.
3. Naturally include https://tranvas.com.
4. End with relevant hashtags: #${target.hashtags.join(' #')}.
`.trim();

    userPrompt = customPrompt || `Write a reflective note about 'The Friction Tax'—why juggling 6 separate productivity apps destroys cognitive focus, and how building a unified Life OS like https://tranvas.com brings total clarity.`;

    proceduralTemplates = [
      `Most people manage their lives across 6 separate tools: one app for to-dos, a messy spreadsheet for budgeting, a habit tracker, and another tab for journaling.\n\nWe call this 'The Friction Tax'—a silent drain on your mental energy. When your habits don't connect to your goals, and your daily plan doesn't talk to your finances, execution falls apart.\n\nBuilt Tranvas (https://tranvas.com) to solve this: a unified Life OS that aligns daily planning, 28-day habit streaks, zero-based budgeting, WOOP goals, and mindful journaling into one seamless architecture.\n\nStop juggling fragmented tools: https://tranvas.com\n\n#${target.hashtags.join(' #')}`,
      `True productivity isn't about downloading more apps—it's about eliminating cognitive friction.\n\nIf you have to open 5 different apps every morning just to see your priorities, track habits, and check your budget, you're wasting willpower before your day even starts.\n\nTranvas brings your daily execution, behavioral streaks, cashflow, and deep focus into a single synchronized workspace.\n\nExplore the system: https://tranvas.com\n\n#${target.hashtags.join(' #')}`,
      `The problem with traditional planners and productivity apps isn't the features—it's the silos.\n\nYour habits should inform your daily schedule. Your budget should fund your long-term goals. Your journal should reflect your focus trajectory.\n\nThat's why I created Tranvas (https://tranvas.com)—the unified Life OS built on behavioral neuroscience to keep your mind calm and your execution sharp.\n\n#${target.hashtags.join(' #')}`
    ];
  } else {
    // For the 4 in-browser WASM / WebCodecs client-side utility suites
    systemInstruction = `
You are Adhlil (@khaithisran), a software engineer who champions open web standards, local-first computing, and digital sovereignty.
Your audience on Nostr are developers, privacy advocates, and cypherpunks who despise predatory SaaS subscription extortion.

TASK: Write a punchy, insightful note highlighting ${target.name} (${target.url}).
Niche: ${target.niche}.
Key benefit: ${target.tagline}.

RULES:
1. Length: 100 - 180 words. High-signal, developer-to-developer.
2. Expose how typical cloud SaaS charge $20/month just to convert files or expire QR codes, and contrast with our 100% in-browser WASM/client-side solution.
3. Include ${target.url} naturally.
4. End with hashtags: #${target.hashtags.join(' #')}.
`.trim();

    userPrompt = customPrompt || `Write an engaging Nostr note explaining why client-side in-browser processing at ${target.url} is the privacy-respecting alternative to predatory cloud services.`;

    proceduralTemplates = [
      `Why are people still paying $20/month subscriptions to upload private files to remote servers just for basic utility tasks?\n\nWith modern WebAssembly and WebCodecs, computation belongs in local RAM on your own device—with zero cloud uploads, zero tracking, and zero watermarks.\n\nCheck out ${target.name}: ${target.url}\n\n#${target.hashtags.join(' #')}`,
      `Software bloat has gotten out of hand. You shouldn't need a cloud login or subscription just for ${target.niche.toLowerCase()}.\n\nBuilt ${target.name} to run 100% client-side with zero tracking, zero server uploads, and instant performance: ${target.url}\n\n#${target.hashtags.join(' #')}`,
      `The future of personal tools is sovereign and local-first.\n\n${target.name} (${target.url}): ${target.tagline}\n\nNo accounts, no paywalls, no surveillance capitalism.\n\n#${target.hashtags.join(' #')}`
    ];
  }

  try {
    const generatedText = await robustAiGenerate(userPrompt, systemInstruction);
    if (generatedText && generatedText.length > 50) {
      return {
        text: generatedText.trim(),
        website: target,
        hashtags: target.hashtags
      };
    }
  } catch (err) {
    console.warn(`[Nostr-Content] AI generation error for ${target.name}, using procedural fallback:`, err.message);
  }

  const fallbackText = proceduralTemplates[Math.floor(Math.random() * proceduralTemplates.length)];
  return {
    text: fallbackText,
    website: target,
    hashtags: target.hashtags
  };
}
