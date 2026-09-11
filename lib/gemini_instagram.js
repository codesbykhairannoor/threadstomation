import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys, fetchTextFromDevToolBox } from './gemini.js';
import { getRecentTopics, saveTopic } from './database.js';
import sql from './database.js';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-flash-latest'
];

/**
 * Generate Instagram content: slide titles/bodies (for carousel) + engaging caption with hashtags.
 * Returns: { slides: [{title, body}], caption: string, hashtags: string[] }
 */
export async function generateInstagramContent(customPrompt, masterPrompt = '', visualTheme = '', accountName = '', accountId = null) {
  const apiKeys = await getAllGeminiKeys();

  const isAdhlil = accountName && accountName.toLowerCase().includes('adhlil');
  const isTranvas = accountName && (accountName.toLowerCase().includes('tranvas') || accountName.toLowerCase().includes('oneformind'));
  const isCaridisini = accountName && accountName.toLowerCase().includes('caridisini');

  // Randomize from 1 to 5 slides. If 1, it's a Single Feed Post.
  let numSlides = Math.floor(Math.random() * 5) + 1;
  if (isAdhlil) {
    // Adhlil strictly requires carousel of at least 3 to 8 slides
    numSlides = Math.floor(Math.random() * 6) + 3; // 3 to 8
  } else if (isTranvas) {
    // Tranvas strictly requires carousel of at least 3 to 6 slides
    numSlides = Math.floor(Math.random() * 4) + 3; // 3 to 6
  }

  // Fetch recent topics to avoid repetition
  let recentTopicsSection = '';
  if (accountId) {
    const recentTopics = await getRecentTopics('instagram', accountId, 30, 14);
    if (recentTopics.length > 0) {
      recentTopicsSection = `
AVOID REPETITION (CRITICAL): The following topics have been posted recently. You MUST NOT create content that covers the exact same topic or theme. Pick a completely different, fresh angle:
${recentTopics.map((t, i) => `  ${i+1}. ${t}`).join('\n')}
`;
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' });

  // Varied topic rotation for Tranvas (Second Brain & Productivity SaaS)
  const tranvasTopicAngles = [
    'The Hidden Cost of Context Switching: Why using 5 separate productivity apps is draining your energy',
    'How to Build a Second Brain: Moving from scattered mental notes to crystal-clear daily execution',
    'The 1% Compounding Rule: How atomic daily habits build unstoppable momentum over 365 days',
    'Cognitive Load Reduction: Why decluttering your digital workspace unlocks 10x deep focus',
    'Personal Finance & Goal Alignment: How tracking cashflow connects directly to your long-term life vision',
    'From Busy to Flow State: The single shift that turns chaotic task lists into effortless completion',
    'Knowledge Retention Matrix: How high-performers capture, organize, and retrieve insights instantly',
    'The Architecture of Deep Work: Eliminating reactive notifications for 90-minute undisturbed focus blocks',
    'Goal Disconnection Syndrome: Why 92% of new year resolutions fail without daily system alignment',
    'Digital Minimalism for Modern Founders: Keeping your tools lean, interconnected, and lightning fast',
    'The Energy Management Secret: Why managing your physical & mental energy beats time management every time',
    'Frictionless Quick Capture: Never lose a million-dollar idea when inspiration strikes on the go',
    'Compound Knowledge Management: Turning book notes and podcasts into actionable life projects',
    'The Power of Sunday Weekly Reviews: Setting up unstoppable momentum before Monday morning starts',
    'Project Portfolio Management: Managing multiple life domains without burnout or forgotten tasks',
    'Mindset of Intentional Living: Designing your daily operating system to match your highest ambitions'
  ];

  let effectivePrompt = customPrompt;
  if (!effectivePrompt && isAdhlil) {
    effectivePrompt = adhlilTopicAngles[Math.floor(Math.random() * adhlilTopicAngles.length)];
  } else if (!effectivePrompt && isTranvas) {
    effectivePrompt = tranvasTopicAngles[Math.floor(Math.random() * tranvasTopicAngles.length)];
  }

  const systemPrompt = `
You are an ELITE creator and storyteller specializing in ${isAdhlil ? 'Islamic self-development, mindfulness, life reflections, and wisdom' : 'high-converting social media content'}. Today's date is ${currentDate}.
${masterPrompt ? `PERSONA & STYLE:\n${masterPrompt}\n\n` : ''}
TASK:
Create a highly engaging post with exactly ${numSlides} slides based on this angle: "${effectivePrompt || 'an interesting viral topic based on your persona'}"
Leverage modern storytelling, psychological hooks, and visual clarity. DO NOT sound like a generic robot. Use power words, empathy, and relatable insights.
${numSlides === 1 ? 'NOTE: Since this is exactly 1 slide, it is a SINGLE IMAGE FEED. Focus on ONE punchy, high-impact hook or quote.' : 'NOTE: Since this is >1 slide, it is a CAROUSEL / VIDEO SLIDES. Ensure strong narrative flow and thoughtful progression across the slides.'}

OUTPUT FORMAT (strict JSON, no markdown):
{
  "slides": [
    { 
      "layout_type": "Choose one: 'CenterMockup', 'TopMockup', 'LeftPerson', 'RightPerson'${isAdhlil ? '' : ", 'TextHeavy'"} ",
      "title_part1": "First part of the slide title (max 3-5 words). E.g. 'Pikiran Mumet'", 
      "title_part2": "Second part of the slide title for contrast (max 3-5 words). E.g. 'Padahal Belum Mulai'", 
      "body": "${numSlides > 1 ? 'REQUIRED: Exactly 1 clear, punchy sentence (40-90 chars) continuing the narrative.' : 'Optional: 1 short sentence or empty string.'}",
      "spoken_narration": "REQUIRED: 1 natural, conversational spoken sentence (10-20 words) for AI voiceover. Sound like a wise, empathetic mentor talking warmly! E.g. 'Pernah gak sih ngerasa lelah banget, padahal kerjaan belum juga dimulai?'",
      "foreground_subject_prompt": "A detailed english prompt for a single isolated object/person. E.g. 'A calm professional person reflecting, isolated on pure white background'. The image must have NO TEXT, NO WORDS, NO LETTERS.",
      "background_theme": "A descriptive theme for the CSS background gradient/pattern." 
    },
    ...repeat for all ${numSlides} slides
  ],
  "caption": "Instagram caption, highly engaging, 150-400 chars, supports emojis, warm and reflective tone, casual Indonesian or English",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

STRICT RULES:
- HUMANIZED CONVERSATIONAL TONE (CRITICAL):
  - Use casual, natural, warm, and reflective spoken Indonesian (gaya bicara reflektif, menyentuh, & akrab).
  - DO NOT sound like a robot, newspaper, or textbook. Avoid stiff phrases like "pertanyaannya adalah", "pada hakikatnya", "adapun".
  - Use natural conversational openers: "Pernah gak sih...", "Ternyata kuncinya...", "Bukan karena kurang waktu, tapi...", "Mulai dari 1 langkah...".
  - Keep sentences short, punchy, and rhythmic for crisp TTS voiceover delivery.
- LAYOUT VARIATION (CRITICAL): You MUST NOT use the same "layout_type" twice in a row. Force variation!
${isAdhlil ? "- BRAND RULE (ADHLIL): You MUST NOT sound like a salesman/marketer. Content MUST be heartfelt Islamic wisdom, productivity, mindset, and life advice.\n- BRAND RULE (ADHLIL): NEVER pitch sales or say 'unlock potensi bisnis' unless explicitly requested. Make the tone warm, grounded, and spiritual." : ""}
${isCaridisini ? "- BRAND RULE: Every slide MUST feature high-quality realistic photography or realistic product/concept render. You MUST NOT use vectors, drawings, cartoons, or abstract graphics." : ""}
${isTranvas || isCaridisini ? "- BRAND RULE: The cover slide (Slide 1) MUST NOT use the 'TextHeavy' layout type." : ""}
${recentTopicsSection}
- NARRATIVE FLOW (CRITICAL for carousels): ${numSlides > 1 ? 'Each slide body MUST connect to the previous slide and lead into the next, like chapters in a story.' : 'Not applicable, as this is a single slide.'}
- BODY RULES (CRITICAL): ${numSlides > 1 ? 'Body MUST NOT be empty for carousel slides. Each body is REQUIRED to be exactly 1 clear, concise sentence (40-90 characters).' : 'Body is optional for single feed posts.'}
- DYNAMIC LANGUAGE & TONE (CRITICAL): ${isTranvas || isCaridisini ? 'You MUST output 100% of the content in ENGLISH. No exceptions.' : 'Output in natural Indonesian aligned with the persona.'}
- Slide 1: HOOK — surprising statement, bold question, or scroll-stopping headline.
${isAdhlil 
  ? `- Slides 2 to ${numSlides - 1}: VALUE — deep insights, actionable Islamic wisdom, or practical mindset shifts.\n- Slide ${numSlides}: NASEHAT & REFLEKSI DIRI (CRITICAL) — A powerful takeaway, prayer/doa, or inspiring quote to calm the soul. CTA MUST be: 'Simpan postingan ini dan follow @adhlil.co untuk pengingat harianmu.' NO SALES PITCH.`
  : (numSlides > 1 ? `- Slides 2 to ${numSlides - 1}: VALUE — clear, actionable tips or story.\n- Slide ${numSlides}: FYP HACK & CTA — Strong call to action to check link in bio.` : '- Slide 1 CTA — Strong call to action in caption.')}
- Output ONLY the JSON object, do not wrap in markdown or backticks
`;

  const errors = [];
  let lastError = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const genAI = new GoogleGenerativeAI(apiKeys[i]);

    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[Instagram-Gemini] Key #${i + 1}, model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' }
        });

        const result = await model.generateContent(systemPrompt);
        let raw = result.response.text().trim();

        // Strip markdown code block if present
        raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

        const parsed = JSON.parse(raw);

        // Validate structure
        if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length < 1) {
          throw new Error('Invalid structure from Gemini: must contain at least 1 slide');
        }

        // Clamp slides to 1-5
        parsed.slides = parsed.slides.slice(0, 5);

        console.log(`[Instagram-Gemini] ✅ Content generated successfully with ${parsed.slides.length} slides`);
        
        // Save topic to history to prevent future repetition
        const topicToSave = customPrompt || parsed.slides[0]?.title_part1 || '';
        if (accountId && topicToSave) {
          await saveTopic('instagram', accountId, topicToSave);
        }
        
        return randomizeSlideLayouts(parsed);
      } catch (e) {
        lastError = e;
        console.warn(`[Instagram-Gemini] Key #${i + 1} (${modelName}) failed: ${e.message}`);
        // Only save meaningful errors that help debug (ignore pure 404s for old models)
        if (!e.message.includes('404 Not Found')) {
          errors.push(`[${modelName}] ${e.message}`);
        }
        continue;
      }
    }
  }

  // Ultimate Fallback: Keyless DevToolBox Workers AI
  try {
    console.warn(`[Instagram-Gemini] ⚠️ Falling back to Keyless DevToolBox AI API...`);
    const parsed = await fetchTextFromDevToolBox(systemPrompt);
    if (parsed && parsed.slides && Array.isArray(parsed.slides) && parsed.slides.length >= 1) {
      parsed.slides = parsed.slides.slice(0, 5);
      console.log(`[Instagram-DevToolBox] ✅ Content generated successfully with ${parsed.slides.length} slides`);
      const topicToSave = customPrompt || parsed.slides[0]?.title_part1 || '';
      if (accountId && topicToSave) {
        await saveTopic('instagram', accountId, topicToSave);
      }
      return randomizeSlideLayouts(parsed);
    }
  } catch (devToolBoxErr) {
    console.error(`[Instagram-DevToolBox] Keyless Fallback failed:`, devToolBoxErr.message);
  }

  // Absolute Final Fallback: Local dynamic backup (100% resilient)
  console.warn(`[Instagram-Gemini] ⚠️ Using Absolute Final Local Fallback for Instagram...`);
  const benefit = customPrompt ? customPrompt.substring(0, 30) : "Today's Topic";
  const fallbackObj = {
    "slides": [
      {
        "layout_type": "CenterMockup",
        "title_part1": "Insights on",
        "title_part2": benefit,
        "body": "Discover how this simple strategy can automate your business and save you hours every single day.",
        "foreground_subject_prompt": "a modern computer displaying a clean dashboard graph, isolated on pure white background",
        "background_theme": "dark blue to purple gradient"
      }
    ],
    "caption": `Want to learn more about ${customPrompt || 'this topic'}? Tap the link in our bio to check the details and get started immediately!`,
    "hashtags": ["insights", "automation", "growth"]
  };
  
  const topicToSave = customPrompt || fallbackObj.slides[0]?.title_part1 || '';
  if (accountId && topicToSave) {
    await saveTopic('instagram', accountId, topicToSave);
  }
  return randomizeSlideLayouts(fallbackObj);
}

/**
 * Randomize image slide layouts to bypass LLM primary options selection bias.
 * Ensures strict variety by preventing consecutive identical layouts.
 */
function randomizeSlideLayouts(parsedObj) {
  if (!parsedObj || !Array.isArray(parsedObj.slides)) return parsedObj;
  
  const imageLayouts = ['CenterMockup', 'TopMockup', 'LeftPerson', 'RightPerson'];
  let lastLayout = null;
  
  parsedObj.slides.forEach((slide) => {
    if (slide.layout_type !== 'TextHeavy') {
      const availableLayouts = imageLayouts.filter(l => l !== lastLayout);
      const randomLayout = availableLayouts[Math.floor(Math.random() * availableLayouts.length)];
      slide.layout_type = randomLayout;
      lastLayout = randomLayout;
    } else {
      lastLayout = 'TextHeavy';
    }
  });
  
  return parsedObj;
}

/**
 * Generate a complete, highly structured Visual Metaphor Motion Spec for Tranvas Reels.
 * Selects dynamically among 8 procedural mental models with bespoke parameters and narrative flow.
 */
export async function generateVisualMetaphorSpec(customPrompt = null, masterPrompt = '', accountName = '@tranvas', accountId = 2) {
  const apiKeys = await getAllGeminiKeys();
  const primitives = [
    'DivergentBranch',
    'ChaosToPrism',
    'IcebergDepth',
    'PhysicsFulcrum',
    'MonolithPillars',
    'KineticFlywheel',
    'ShieldRadar',
    'MatrixQuadrant',
  ];

  // Pick a random primitive as recommendation or let Gemini decide
  const randomSuggested = primitives[Math.floor(Math.random() * primitives.length)];

  // Recent topic check to avoid repetition
  let recentTopicsSection = '';
  if (accountId) {
    const recentTopics = await getRecentTopics('instagram', accountId, 25, 14);
    if (recentTopics.length > 0) {
      recentTopicsSection = `AVOID RECENT TOPICS:\n${recentTopics.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}\n`;
    }
  }

  const systemPrompt = `
You are an ELITE Creative Director for high-retention Visual Thinking and Mental Model Reels (in the style of @mindset.therapy, Visualize Value, and modern SaaS founders).
Target Brand: Tranvas (tranvas.com - All-in-One Life Operating System, Second Brain, Focus Flow, Habit Compounding, Cognitive Load Elimination).

TASK:
Create a high-impact, 11-second Visual Metaphor Motion Specification for a dynamic Instagram Reel.
Angle / Topic: "${customPrompt || 'an insightful paradox or mental model about productivity, context switching, or deep work'}"

Choose the single BEST primitive from these 8 mental models:
1. "DivergentBranch" (1% atomic compounding vs drift path splitting over 365 days)
2. "ChaosToPrism" (Scattered cognitive particles [tasks, notes, DMs] sucked into a central prism, emitting 1 coherent laser beam)
3. "IcebergDepth" (Surface noise/to-do lists vs deep submerged life OS architecture)
4. "PhysicsFulcrum" (Moving the leverage point to lift 10x output with 1x system effort)
5. "MonolithPillars" (4 rising pillars: Capture -> Organize -> Distill -> Execute)
6. "KineticFlywheel" (Continuous rotating acceleration loop: Capture -> Plan -> Execute -> Compound)
7. "ShieldRadar" (360° radar sweep dissolving distractions for 90-minute deep work sanctuary)
8. "MatrixQuadrant" (2x2 shift from reactive overwhelm to systemic flow)

${recentTopicsSection}

OUTPUT FORMAT (strict JSON, no markdown):
{
  "primitive": "One of: DivergentBranch, ChaosToPrism, IcebergDepth, PhysicsFulcrum, MonolithPillars, KineticFlywheel, ShieldRadar, MatrixQuadrant",
  "categoryBadge": "Short 2-3 word badge, e.g. 'Life Architecture' or 'Focus Protocol'",
  "headlinePart1": "Hook line part 1 (max 5-6 words), e.g. 'Your Brain Is For Ideas,'",
  "headlinePart2": "Contrast hook part 2 (max 3-5 words), e.g. 'Not Holding Them.'",
  "narrativeSubtitle": "1 punchy, deeply relatable insight sentence (50-90 chars) displayed during the transition",
  "takeaway": "1 powerful closing mental model rule (40-80 chars)",
  "primitiveData": {
    "multiplier": 37.8,
    "cardNote": "Atomic daily habits build an insurmountable competitive moat.",
    "targetLabel": "Pure Flow Execution",
    "surfaceLabel": "Random To-Do Lists",
    "takeaway": "Don't work 10x harder. Move the leverage point with a unified system."
  },
  "caption": "Compelling Instagram caption in English (200-400 chars) explaining the mental model, why context switching is killing focus, and inviting followers to build their second brain.",
  "hashtags": ["SecondBrain", "TranvasApp", "ProductivityTips", "DeepWork", "VisualThinking"]
}

STRICT RULES:
- 100% English.
- No sales pitch or hard-selling. Deliver pure psychological & systemic insight.
- Output ONLY the raw JSON object.
`;

  for (let i = 0; i < apiKeys.length; i++) {
    const genAI = new GoogleGenerativeAI(apiKeys[i]);
    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[Gemini-VisualMetaphor] Generating spec with Key #${i + 1}, model: ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const result = await model.generateContent(systemPrompt);
        let raw = result.response.text().trim();
        raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(raw);

        if (!primitives.includes(parsed.primitive)) {
          parsed.primitive = randomSuggested;
        }

        if (accountId && (parsed.headlinePart1 || customPrompt)) {
          await saveTopic('instagram', accountId, customPrompt || `${parsed.headlinePart1} ${parsed.headlinePart2}`);
        }

        console.log(`[Gemini-VisualMetaphor] ✅ Generated spec for primitive: ${parsed.primitive}`);
        return parsed;
      } catch (err) {
        console.warn(`[Gemini-VisualMetaphor] Model ${modelName} error: ${err.message}`);
        continue;
      }
    }
  }

  // Fallback spec if all API attempts fail
  console.warn('[Gemini-VisualMetaphor] ⚠️ Using high-quality default Visual Metaphor Spec');
  return {
    primitive: randomSuggested,
    categoryBadge: 'Life Architecture',
    headlinePart1: 'Your Brain Is For Ideas,',
    headlinePart2: 'Not Holding Them.',
    narrativeSubtitle: 'Scattered cognitive load drains 80% of daily momentum.',
    takeaway: 'Offload mental friction to a single unified second brain.',
    primitiveData: {
      multiplier: 37.8,
      cardNote: 'Atomic daily habits build an insurmountable competitive moat.',
      targetLabel: 'Pure Flow Execution',
      surfaceLabel: 'Random To-Do Lists',
      takeaway: 'Don’t work 10x harder. Move the leverage point with a unified system.',
    },
    caption: 'When you keep all your tasks, notes, and habits in your head, you are operating at 20% capacity. Build a Second Brain with Tranvas and operate with pure clarity. 🧠⚡',
    hashtags: ['SecondBrain', 'TranvasApp', 'ProductivityTips', 'DeepWork', 'FocusState'],
  };
}