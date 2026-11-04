import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllGeminiKeys, fetchTextFromDevToolBox } from './gemini.js';
import { getRecentTopics, saveTopic } from './database.js';
import sql from './database.js';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest'
];

/**
 * Generate Instagram content: slide titles/bodies (for carousel) + engaging caption with hashtags.
 * Returns: { slides: [{title, body}], caption: string, hashtags: string[] }
 */
export async function generateInstagramContent(customPrompt, masterPrompt = '', visualTheme = '', accountName = '', accountId = null) {
  const apiKeys = await getAllGeminiKeys();

  const isAdhlil = accountName && (accountName.toLowerCase().includes('adhlil') || accountId === 1);
  const isTranvas = accountName && (accountName.toLowerCase().includes('tranvas') || accountName.toLowerCase().includes('oneformind') || accountId === 2);
  const isSharesa = accountName && (accountName.toLowerCase().includes('sharesa') || accountId === 3);
  const isCaridisini = accountName && accountName.toLowerCase().includes('caridisini');

  // 5 substantive story scenes for High-Retention Reels (optimal 40-55s watch time)
  let numSlides = 5;
  if (isAdhlil) {
    numSlides = 5;
  } else if (isTranvas) {
    numSlides = 5;
  } else if (isSharesa) {
    numSlides = 5;
  }

  // Fetch recent topics to avoid repetition
  let recentTopicsSection = '';
  if (accountId) {
    const recentTopics = await getRecentTopics('instagram', accountId, 30, 14);
    if (recentTopics.length > 0) {
      recentTopicsSection = `
AVOID REPETITION (CRITICAL): The following topics have been posted recently. You MUST NOT create content that covers the exact same topic or theme. Pick a completely different, fresh angle:
${recentTopics.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}
`;
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' });

  // Rich Islamic wisdom & muhasabah angles for Adhlil
  const adhlilTopicAngles = [
    'Beban Pikiran & Tawakal: Saat logika manusia mentok, di situlah iman mulai bekerja',
    'Rezeki yang Tertunda: Mengapa penantian terbaik adalah memperbaiki niat dan kualitas ikhtiar',
    'Menghadapi Kelelahan Hidup: Saat lelah bekerja, ingat untuk siapa kamu berjuang dan berlelah-lelah',
    'Ketenangan di Tengah Hiruk Pikuk: Seni hidup bersahaja dan menjaga kejernihan hati di era digital',
    'Menyembuhkan Luka Batin: Memaafkan kesalahan orang lain bukan untuk mereka, tapi demi ketenangan jiwamu',
    'Produktif Tanpa Hilang Arah: Menjaga keseimbangan antara ambisi duniawi dan bekal akhirat yang abadi',
    'Rahasia Sholat Tepat Waktu: Mengapa saat panggilan Allah kita dahulukan, urusan dunia ikut dimudahkan',
    'Sedekah Subuh & Doa Malaikat: Cara membuka pintu kemudahan yang tak disangka-sangka',
    'Sabar yang Indah (Sabrun Jamil): Bukan memendam amarah, tapi melepaskan kendali kepada Yang Maha Pengasih',
    'Dunia Hanya Jembatan Singgah: Pengingat sederhana saat kamu merasa terlalu cemas memikirkan masa depan',
    'Silent Struggle dalam Diam: Tak ada lelahmu yang sia-sia, Allah Maha Mengetahui setiap tetes peluhmu',
    'Rezeki Tak Akan Tertukar: Menghapus rasa cemas dan iri hati dengan menyadari luasnya karunia Allah',
    'Adab Sebelum Ilmu & Karier: Keberkahan rezeki ada pada bagaimana caramu memperlakukan orang tua dan sesama',
    'Kekuatan Istighfar di Waktu Sahur: Melepaskan simpul-simpul kesulitan hidup lewat permohonan ampun',
    'Menjaga Lisan & Komentar di Medsos: Bagaimana hisab kata-kata yang kita ketik setiap hari di dunia maya'
  ];

  // Varied topic rotation for Tranvas (The Visual Workspace & Unified Life OS)
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
    'The Power of Sunday Weekly Reviews: Setting up unstoppable momentum before Monday morning starts'
  ];

  // Topic rotation for Sharesa Space (4 Web Tools + Jasa Web Development Modern)
  const sharesaTopicAngles = [
    'HandleMyFile: Kenapa harus bayar langganan mahal cuma buat convert PDF, kompres gambar, dan format file?',
    'SolveMyMedia: Download audio & video media sosial kualitas HD tanpa watermark dengan 1 klik instan',
    'Tranvas: Stop pakai 5 aplikasi berbeda untuk to-do list, catatan proyek, dan habits tracker',
    'Caridisini: Direktori curated search tools & resources gratis paling bersih tanpa iklan clickbait',
    'Jasa Web Modern: Kenapa website lemot bikin bisnismu kehilangan 80% calon pembeli sebelum sempat melihat penawaran',
    'Website Template vs Custom Next.js: Mana yang bikin brand kamu terlihat mewah, profesional, dan dipercaya klien?',
    '4 Web Tools Gratis Buatan Anak Bangsa: Solusi praktis produktivitas digital tanpa keluar biaya sepeser pun',
    'Conversion-Driven Landing Page: Rahasia desain website yang langsung menghasilkan closing dan inquiry WhatsApp',
    'Kecepatan Website di Bawah 1 Detik: Senjata rahasia menaikkan peringkat Google SEO dan menurunkan bounce rate',
    'Redesign Website Bisnis: Transformasi tampilan web jadul menjadi modern, sleek, dan siap mendatangkan omset'
  ];

  let effectivePrompt = customPrompt;
  if (!effectivePrompt && isAdhlil) {
    effectivePrompt = adhlilTopicAngles[Math.floor(Math.random() * adhlilTopicAngles.length)];
  } else if (!effectivePrompt && isTranvas) {
    effectivePrompt = tranvasTopicAngles[Math.floor(Math.random() * tranvasTopicAngles.length)];
  } else if (!effectivePrompt && isSharesa) {
    effectivePrompt = sharesaTopicAngles[Math.floor(Math.random() * sharesaTopicAngles.length)];
  }

  // Real-time Viral Trend Hunter & Newsjacking (Open-Source GitHub Engine)
  try {
    const { getNewsjackedAngle } = await import('./trend_hunter.js');
    const isEnglish = isTranvas || isCaridisini;
    effectivePrompt = await getNewsjackedAngle(accountName, masterPrompt, effectivePrompt, isEnglish);
  } catch (trendErr) {
    console.warn('[Instagram-Gemini] Trend Hunter fallback:', trendErr.message);
  }

  const systemPrompt = `
You are an ELITE creator and storyteller specializing in ${isAdhlil ? 'Islamic self-development, mindfulness, life reflections, and wisdom' : isSharesa ? 'modern web technologies, digital productivity tools, and modern web development services' : 'high-converting social media content'}. Today's date is ${currentDate}.
${masterPrompt ? `PERSONA & STYLE:\n${masterPrompt}\n\n` : ''}
TASK:
Create a highly engaging post with exactly ${numSlides} slides based on this angle: "${effectivePrompt || 'an interesting viral topic based on your persona'}"
Leverage modern storytelling, psychological hooks, and visual clarity. DO NOT sound like a generic robot. Use power words, empathy, and relatable insights.
NOTE: Since this is >1 slide, it is a HIGH-RETENTION CAROUSEL / VIDEO REEL. Ensure strong narrative flow and thoughtful progression across the slides.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "slides": [
    { 
      "layout_type": "Choose one: 'CenterMockup', 'TopMockup', 'LeftPerson', 'RightPerson'${isAdhlil ? '' : ", 'TextHeavy'"} ",
      "title_part1": "First part of the slide title (max 3-5 words). E.g. 'Pikiran Mumet'", 
      "title_part2": "Second part of the slide title for contrast (max 3-5 words). E.g. 'Padahal Belum Mulai'", 
      "body": "REQUIRED: Exactly 1 clear, punchy sentence (40-90 chars) continuing the narrative.",
      "spoken_narration": "REQUIRED: 2 natural, conversational spoken sentences (25-35 words total per slide) for AI voiceover. Sound like a wise, empathetic mentor talking warmly! Provide real depth and storytelling rather than short fragments so the video hits 40-55s runtime.",
      "foreground_subject_prompt": "A detailed english prompt for a single isolated object/person. The image must have NO TEXT, NO WORDS, NO LETTERS.",
      "background_theme": "A descriptive theme for the CSS background gradient/pattern." 
    },
    ...repeat for all ${numSlides} slides
  ],
  "caption": "Instagram caption, highly engaging, 150-400 chars, mobile-scannable with line breaks. Line 1 MUST be a bold hook (<10 words). Include a natural cue to SAVE ('Simpan ini buat pengingat') and SHARE with a friend. Supports emojis.",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

STRICT RULES:
- 2025/2026 INSTAGRAM ALGORITHM RULES (CRITICAL):
  - SENDS & SAVES ARE KING: Instagram algorithm prioritizes 'Sends per Reach' (DM sharing) and 'Saves' 3-5x over likes! Design the content to be so valuable or relatable that the reader feels compelled to save it or send it to a friend.
  - ZERO CLICHE OPENERS: Strictly FORBIDDEN to start with "Pernah gak sih", "Tahukah kamu", "Pernahkah merasa", "Hai teman-teman".
  - START INSIDE THE TENSION: Open directly with the core truth, paradox, or practical rule.
- HUMANIZED CONVERSATIONAL TONE:
  - Use natural, warm, and reflective spoken tone (gaya bicara reflektif, menyentuh, & akrab).
  - Avoid stiff academic phrases like "pertanyaannya adalah", "pada hakikatnya", "adapun".
  - Keep sentences short, punchy, and rhythmic for crisp reading and TTS delivery.
- LAYOUT VARIATION (CRITICAL): You MUST NOT use the same "layout_type" twice in a row. Force variation!
${isAdhlil ? "- BRAND RULE (ADHLIL): Content MUST be heartfelt Islamic wisdom, muhasabah diri, tawakkal, rezeki berkah, and spiritual peace.\n- BRAND RULE (ADHLIL): Make the tone warm, grounded, and spiritual. CTA: 'Simpan postingan ini dan follow @adhlil.co untuk renungan harianmu.'" : ""}
${isSharesa ? "- BRAND RULE (SHARESA SPACE): Focus on practical tech solutions, showcasing either one of our 4 Web Tools (HandleMyFile, SolveMyMedia, Tranvas, Caridisini) or Modern Web Development Services (Next.js, ultra-fast <1s, premium UI/UX, SEO-ready, high-converting).\n- BRAND RULE (SHARESA SPACE): CTA MUST be: 'Kunjungi link di bio @sharesa.space untuk mencoba tools gratis atau konsultasi pembuatan website bisnismu.'" : ""}
${isCaridisini ? "- BRAND RULE: Every slide MUST feature high-quality realistic photography or realistic product/concept render. You MUST NOT use vectors, drawings, cartoons, or abstract graphics." : ""}
${isTranvas || isCaridisini ? "- BRAND RULE: The cover slide (Slide 1) MUST NOT use the 'TextHeavy' layout type." : ""}
${recentTopicsSection}
- NARRATIVE FLOW (CRITICAL for carousels): Each slide body MUST connect to the previous slide and lead into the next, like chapters in a story.
- BODY RULES (CRITICAL): Body MUST NOT be empty. Each body is REQUIRED to be exactly 1 clear, concise sentence (40-90 characters).
- DYNAMIC LANGUAGE & TONE (CRITICAL): ${isTranvas || isCaridisini ? 'You MUST output 100% of the content in ENGLISH. No exceptions.' : 'Output in natural Indonesian aligned with the persona.'}
- Slide 1: HOOK — surprising statement, bold question, or scroll-stopping headline.
${isAdhlil
      ? `- Slides 2 to ${numSlides - 1}: VALUE — deep insights, actionable Islamic wisdom, or practical mindset shifts.\n- Slide ${numSlides}: NASEHAT & REFLEKSI DIRI (CRITICAL) — A powerful takeaway, prayer/doa, or inspiring quote to calm the soul. CTA MUST be: 'Simpan postingan ini dan follow @adhlil.co untuk pengingat harianmu.' NO SALES PITCH.`
      : isSharesa
        ? `- Slides 2 to ${numSlides - 1}: VALUE — clear breakdown of why modern web tools or ultra-fast websites solve headaches and boost revenue.\n- Slide ${numSlides}: CTA & SOLUTION — Direct invitation to check link in bio @sharesa.space.`
        : `- Slides 2 to ${numSlides - 1}: VALUE — clear, actionable tips or story.\n- Slide ${numSlides}: FYP HACK & CTA — Strong call to action to save & check link in bio.`}
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

        // Allow 5-6 slides for complete 40-55s video reel
        parsed.slides = parsed.slides.slice(0, 6);

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

  // Absolute Final Fallback: Local dynamic backup (100% resilient & zero-leakage, full 5 scenes, 45-55s)
  console.warn(`[Instagram-Gemini] ⚠️ Using Absolute Final 5-Scene Local Fallback for Instagram (${accountName})...`);

  const dayIndex = new Date().getDate() % 3; // Rotates between 3 unique high-retention stories
  let fallbackObj;

  if (isTranvas) {
    const stories = [
      {
        caption: "Context switching doesn't just waste minutes—it drains your executive function. When your tasks, notes, and habits live across 5 fragmented apps, your brain is in constant cognitive overload. Tranvas brings clarity back into a single interactive canvas.\n\nSave this to protect your focus today.",
        hashtags: ["productivity", "deepwork", "lifeos", "focus", "timemanagement"],
        slides: [
          {
            title_part1: "Your Brain Is Not",
            title_part2: "A Web Browser",
            body: "Keeping 40 tabs open is quietly destroying your cognitive stamina.",
            spoken_narration: "Your brain was never designed to juggle dozens of open tabs and fragmented tasks all day.",
            foreground_subject_prompt: "minimalist analog watch ticking seconds macro slow motion 4k",
            background_theme: "dark minimalist modern aesthetic gradient"
          },
          {
            title_part1: "The Hidden Cost Of",
            title_part2: "Context Switching",
            body: "Every jump between separate apps costs 23 minutes of deep focus.",
            spoken_narration: "Research shows that every context switch burns mental energy, leaving you exhausted by midday.",
            foreground_subject_prompt: "clean minimal studio desk dual monitor glowing warm light 4k",
            background_theme: "dark tech workspace aesthetic"
          },
          {
            title_part1: "App Sprawl Is A",
            title_part2: "Productivity Trap",
            body: "More productivity tools often lead to more friction and anxiety.",
            spoken_narration: "We download more productivity apps hoping for control, but end up managing tools instead of getting work done.",
            foreground_subject_prompt: "person journaling fountain pen early morning coffee aesthetic 4k",
            background_theme: "moody aesthetic focus atmosphere"
          },
          {
            title_part1: "One Unified Canvas",
            title_part2: "For Everything",
            body: "Unify your tasks, habits, and projects in one visual operating system.",
            spoken_narration: "Tranvas unifies your entire daily workflow into one seamless, distraction-free visual workspace.",
            foreground_subject_prompt: "modern software engineer multi monitor setup dark golden aesthetic 4k",
            background_theme: "zen clean productive aesthetic"
          },
          {
            title_part1: "Reclaim Your Hours,",
            title_part2: "Reclaim Clarity",
            body: "Stop letting chaotic tools dictate your peace of mind and progress.",
            spoken_narration: "Save this reel, check the link in our bio, and build a workspace that truly protects your focus.",
            foreground_subject_prompt: "zen bonsai plant morning sunlight window aesthetic slow motion 4k",
            background_theme: "peaceful minimalist morning light"
          }
        ]
      },
      {
        caption: "Motivation fades, but friction architecture lasts. If starting work requires finding where you left off across messy tools, you will always default to procrastination. Consolidate your system with Tranvas.\n\nSave this reminder for your morning routine.",
        hashtags: ["productivityhacks", "lifeoperatingsystem", "tranvas", "deepfocus", "worksmart"],
        slides: [
          {
            title_part1: "Why Motivation Fails",
            title_part2: "Every Single Day",
            body: "Relying on willpower alone will always leave your best goals abandoned.",
            spoken_narration: "Willpower is a finite resource. If your morning starts with digital confusion, motivation disappears.",
            foreground_subject_prompt: "mechanical clock brass gears moving macro clean minimalist 4k",
            background_theme: "dark aesthetic vintage mechanical"
          },
          {
            title_part1: "Reduce Friction,",
            title_part2: "Multiply Flow",
            body: "Eliminate the cognitive barrier between planning and actual execution.",
            spoken_narration: "The secret to unstoppable flow is removing every tiny point of friction between planning and doing.",
            foreground_subject_prompt: "runner sunrise morning discipline endurance macro aesthetic 4k",
            background_theme: "golden hour discipline morning"
          },
          {
            title_part1: "Stop Organizing,",
            title_part2: "Start Creating",
            body: "Color-coding folders is just disguised procrastination.",
            spoken_narration: "Spending hours organizing lists is just productive procrastination. You need a system that gets out of your way.",
            foreground_subject_prompt: "sleek macbook pro floating modern tech mockup clean 4k",
            background_theme: "minimal dark mode workstation"
          },
          {
            title_part1: "Visual Architecture",
            title_part2: "Built For Clarity",
            body: "See your week, habits, and priorities at one single glance.",
            spoken_narration: "With Tranvas, your entire day is clear at a single glance, so you can execute without second-guessing.",
            foreground_subject_prompt: "clean architectural building glass modern geometric lines 4k",
            background_theme: "modern high-end minimalism"
          },
          {
            title_part1: "Build Your Focus",
            title_part2: "Sanctuary Today",
            body: "Try Tranvas and experience what effortless execution feels like.",
            spoken_narration: "Tap the link in bio to experience Tranvas and take back control of your precious mental energy.",
            foreground_subject_prompt: "calm ocean waves cinematic sunset horizon aesthetic 4k",
            background_theme: "cinematic sunset horizon calm"
          }
        ]
      },
      {
        caption: "Busyness is not achievement. If you spend your work hours replying to pings and organizing to-do lists, you're running on a digital treadmill. Tranvas gives you the headspace to achieve meaningful work.\n\nFollow @tranvasapp for daily mental clarity.",
        hashtags: ["intentionalliving", "tranvasapp", "highperformance", "mindsetshift", "focusfirst"],
        slides: [
          {
            title_part1: "Always Busy But",
            title_part2: "Achieving Nothing?",
            body: "Being frantically occupied is not the same as moving the needle.",
            spoken_narration: "Ever reach the end of a busy workday and realize you didn't accomplish anything meaningful?",
            foreground_subject_prompt: "person sitting deep in thought city lights evening moody 4k",
            background_theme: "cinematic twilight introspection"
          },
          {
            title_part1: "The Trap Of",
            title_part2: "Shallow Work",
            body: "Ticking endless low-value boxes gives a false sense of achievement.",
            spoken_narration: "Ticking off ten tiny boxes gives dopamine, but leaves your big projects completely untouched.",
            foreground_subject_prompt: "foggy pine forest sunrise ethereal moody aesthetic 4k",
            background_theme: "moody sunrise misty mountains"
          },
          {
            title_part1: "Single Source Of",
            title_part2: "Operational Truth",
            body: "One canvas to see what truly matters and mute the noise.",
            spoken_narration: "You need one single source of truth that forces you to prioritize what genuinely drives progress.",
            foreground_subject_prompt: "modern clean ceramic coffee mug steam morning light 4k",
            background_theme: "warm morning focus ambient"
          },
          {
            title_part1: "Effortless Daily",
            title_part2: "Execution Rhythm",
            body: "Streamline your morning planning into a calm 2-minute ritual.",
            spoken_narration: "Tranvas turns your chaotic morning planning into a calm, centered two-minute daily ritual.",
            foreground_subject_prompt: "golden sunlight streaming through modern window shadows 4k",
            background_theme: "zen minimalist natural light"
          },
          {
            title_part1: "Upgrade Your System",
            title_part2: "Upgrade Your Life",
            body: "Join thousands of deep thinkers using Tranvas to simplify life.",
            spoken_narration: "Save this post and follow @tranvasapp to elevate your daily productivity architecture.",
            foreground_subject_prompt: "drone shot winding road through mountain summit majestic 4k",
            background_theme: "majestic mountain horizon scale"
          }
        ]
      }
    ];
    fallbackObj = stories[dayIndex];
  } else if (isSharesa) {
    const stories = [
      {
        caption: "Website yang lambat bukan sekadar menjengkelkan—itu membunuh konversi bisnis Anda secara diam-diam. Di era serba cepat 2026, calon pembeli hanya memberi Anda waktu 2 detik sebelum menutup tab dan berpindah ke kompetitor. Bangun website modern bersama Sharesa Space.\n\nKunjungi link di bio @sharesa.space untuk konsultasi gratis.",
        hashtags: ["jasapembuatanwebsite", "nextjs", "webdevelopment", "umkmindonesia", "sharesaspace"],
        slides: [
          {
            title_part1: "Website Lemot Adalah",
            title_part2: "Pembunuh Bisnis",
            body: "Calon pembeli pergi dalam 3 detik jika web Anda lambat terbuka.",
            spoken_narration: "Sadar atau tidak, website yang lemot diam-diam membuang delapan puluh persen calon pembeli Anda.",
            foreground_subject_prompt: "modern software engineer multi monitor setup dark golden 4k",
            background_theme: "dark premium tech gradient"
          },
          {
            title_part1: "Standar Kecepatan",
            title_part2: "Di Era Modern",
            body: "Website masa kini wajib terbuka instan di bawah satu detik.",
            spoken_narration: "Di era digital sekarang, website bisnis wajib terbuka instan kurang dari satu detik.",
            foreground_subject_prompt: "clean minimal web studio dark mode dual monitor slow motion 4k",
            background_theme: "dark aesthetic modern tech"
          },
          {
            title_part1: "Desain Berkelas",
            title_part2: "Meningkatkan Trust",
            body: "Tampilan visual yang profesional langsung membangun kepercayaan klien.",
            spoken_narration: "Tampilan visual yang rapi dan elegan langsung membangun rasa percaya calon pembeli sejak detik pertama.",
            foreground_subject_prompt: "sleek macbook pro floating modern tech mockup clean 4k",
            background_theme: "minimal high end studio mockup"
          },
          {
            title_part1: "Teknologi Next.js",
            title_part2: "Performa Maksimal",
            body: "Arsitektur modern tanpa plugin berat yang rentan error dan lemot.",
            spoken_narration: "Sharesa Space membangun website dengan arsitektur Next.js super cepat, aman, dan siap closing.",
            foreground_subject_prompt: "clean minimal web studio dark mode dual monitor cinematic 4k",
            background_theme: "cinematic web studio dark"
          },
          {
            title_part1: "Siap Naik Level?",
            title_part2: "Hubungi Kami!",
            body: "Kunjungi link di bio @sharesa.space untuk mulai konsultasi gratis.",
            spoken_narration: "Kunjungi tautan di bio kami sekarang dan wujudkan website impian bisnismu hari ini.",
            foreground_subject_prompt: "modern smartphone displaying elegant clean website interface 4k",
            background_theme: "clean professional commercial"
          }
        ]
      },
      {
        caption: "Berapa banyak aplikasi converter dan downloader yang Anda install hanya untuk urusan file harian? Sharesa Space menyediakan rangkaian Web Tools gratis langsung di browser tanpa install dan tanpa iklan sampah: SolveMyMedia, HandleMyFile, Tranvas, dan Caridisini.\n\nCek tautan di bio @sharesa.space untuk mencoba langsung!",
        hashtags: ["webtools", "toolsgratis", "solusidigital", "sharesaspace", "teknologimodern"],
        slides: [
          {
            title_part1: "Stop Install Aplikasi",
            title_part2: "Penuh Iklan Sampah",
            body: "Banyak converter online berbahaya dan dipenuhi iklan pop-up mengganggu.",
            spoken_narration: "Capek harus instal aplikasi converter mencurigakan yang penuh dengan iklan sampah mengganggu?",
            foreground_subject_prompt: "minimalist glowing digital interface holographic clean 4k",
            background_theme: "dark futuristic clean digital"
          },
          {
            title_part1: "SolveMyMedia:",
            title_part2: "Download & Convert",
            body: "Simpan video dan audio sosial media favorit dalam resolusi HD jernih.",
            spoken_narration: "Gunakan SolveMyMedia untuk download video dan audio dari berbagai platform tanpa ribet watermark.",
            foreground_subject_prompt: "creative video editor color grading cinematic footage monitor 4k",
            background_theme: "creative media studio dark"
          },
          {
            title_part1: "HandleMyFile:",
            title_part2: "Kelola File Cepat",
            body: "Kompres, gabung PDF, dan ubah format dokumen langsung di browser Anda.",
            spoken_narration: "HandleMyFile memproses kompresi dan convert dokumen Anda secara privat langsung di browser Anda.",
            foreground_subject_prompt: "clean modern office documents tablet stylus minimalist 4k",
            background_theme: "corporate clean minimal"
          },
          {
            title_part1: "Caridisini & Tranvas:",
            title_part2: "Pusat Produktivitas",
            body: "Temukan AI tools terbaik dan atur pekerjaan harian dalam satu kanvas.",
            spoken_narration: "Temukan direktori AI terbaik di Caridisini dan satukan seluruh tugasmu dalam kanvas interaktif Tranvas.",
            foreground_subject_prompt: "glowing geometric neural network data nodes flowing clean 4k",
            background_theme: "cyber minimalist data flow"
          },
          {
            title_part1: "Coba Semua Tools",
            title_part2: "100% Gratis!",
            body: "Kunjungi bio @sharesa.space untuk akses langsung semua fitur hari ini.",
            spoken_narration: "Semuanya gratis dan siap Anda gunakan sekarang juga lewat link di bio kami.",
            foreground_subject_prompt: "happy modern entrepreneur smiling looking at clean tablet 4k",
            background_theme: "warm success modern lighting"
          }
        ]
      },
      {
        caption: "Website yang baik bukan hanya tentang estetika, tapi tentang alur komunikasi yang mampu meyakinkan pengunjung menjadi pelanggan setia. Sharesa Space memadukan desain kelas dunia dengan struktur konversi yang terukur.\n\nSimpan postingan ini dan hubungi kami via link di bio @sharesa.space.",
        hashtags: ["brandingbisnis", "desainwebsite", "landingpage", "sharesaspace", "bisnisdigital"],
        slides: [
          {
            title_part1: "Desain Bagus Saja",
            title_part2: "Belum Tentu Menjual",
            body: "Website cantik tanpa alur komunikasi yang tepat tidak akan menghasilkan closing.",
            spoken_narration: "Website yang cantik sekalipun akan sia-sia jika tidak mampu meyakinkan pengunjung untuk membeli.",
            foreground_subject_prompt: "modern architecture studio design layout drawing tablet clean 4k",
            background_theme: "designer aesthetic minimal"
          },
          {
            title_part1: "Struktur Copywriting",
            title_part2: "Yang Menghipnotis",
            body: "Setiap kalimat disusun untuk menjawab keraguan dan kebutuhan audiens Anda.",
            spoken_narration: "Setiap kata dan kalimat kami susun secara psikologis agar langsung menyentuh kebutuhan audiens Anda.",
            foreground_subject_prompt: "typewriter antique keys macro sunlight dust particles 4k",
            background_theme: "vintage literary focus warm"
          },
          {
            title_part1: "Responsif Sempurna",
            title_part2: "Di Semua Layar",
            body: "Tampil mulus dan memanjakan mata baik di smartphone maupun laptop.",
            spoken_narration: "Tampilan website Anda akan tampil presisi dan memukau di semua ukuran layar smartphone.",
            foreground_subject_prompt: "multiple sleek devices showing synced modern dark mode app 4k",
            background_theme: "tech multi device showcase"
          },
          {
            title_part1: "Bebas Pusing Teknis",
            title_part2: "Siap Pakai",
            body: "Dari domain, hosting, keamanan SSL hingga optimasi Google SEO kami tangani.",
            spoken_narration: "Dari domain, kecepatan, hingga keamanan server, tim Sharesa Space yang mengurus semuanya untuk Anda.",
            foreground_subject_prompt: "modern server room glowing blue fiber optic cables clean 4k",
            background_theme: "high tech secure infrastructure"
          },
          {
            title_part1: "Konsultasikan",
            title_part2: "Idemu Hari Ini",
            body: "Klik tautan di bio @sharesa.space untuk memulai langkah bisnismu.",
            spoken_narration: "Jangan tunda lagi, wujudkan website terbaik untuk bisnismu bersama Sharesa Space sekarang juga.",
            foreground_subject_prompt: "golden hour city skyline modern glass towers reflection 4k",
            background_theme: "triumphant city golden hour"
          }
        ]
      }
    ];
    fallbackObj = stories[dayIndex];
  } else {
    // Adhlil fallback
    const stories = [
      {
        caption: "Ketenangan dan keberkahan hidup dimulai saat kita belajar melepaskan apa yang di luar kendali kita dan mempercayai rencana terbaik-Nya. Terkadang lelah yang kita rasakan adalah tanda bahwa jiwa kita rindu untuk bersujud lebih lama.\n\nSimpan postingan ini dan follow @adhlil.co untuk renungan harianmu.",
        hashtags: ["muhasabah", "nasehatislami", "ketenangan", "tawakkal", "adhlilco"],
        slides: [
          {
            title_part1: "Bumi Ini Hanyalah",
            title_part2: "Tempat Singgah",
            body: "Lelahmu wajar, karena dunia ini memang tempat berjuang dan mengumpulkan bekal.",
            spoken_narration: "Bumi ini hanyalah tempat persinggahan sementara. Sangat wajar bila langkah kita terkadang terasa lelah.",
            foreground_subject_prompt: "golden sunset rays light clouds moody atmospheric 4k",
            background_theme: "moody spiritual golden sunset"
          },
          {
            title_part1: "Lepaskan Yang",
            title_part2: "Di Luar Kendali",
            body: "Khawatirmu tidak mengubah masa depan, tapi doa dan tawakalmu menenangkan jiwa.",
            spoken_narration: "Kekhawatiran kita tidak akan merubah masa depan, namun doa dan tawakal akan selalu menenangkan hati.",
            foreground_subject_prompt: "calm lake reflection misty mountain morning peaceful 4k",
            background_theme: "serene misty lake reflection"
          },
          {
            title_part1: "Ujian Adalah Tanda",
            title_part2: "Kasih Sayang-Nya",
            body: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.",
            spoken_narration: "Setiap ujian hadir bukan untuk menghukummu, melainkan untuk mengangkat derajat dan membersihkan jiwamu.",
            foreground_subject_prompt: "green seedling growing through cracked stone sunrise macro 4k",
            background_theme: "symbolic hope morning dew"
          },
          {
            title_part1: "Rezeki Terbaik",
            title_part2: "Adalah Hati Lapang",
            body: "Bukan tentang seberapa banyak yang kau miliki, tapi seberapa syukur kau menerimanya.",
            spoken_narration: "Rezeki terindah bukan sekadar materi, melainkan hati yang lapang dan jiwa yang selalu merasa cukup.",
            foreground_subject_prompt: "old holy quran pages open morning sunlight warm golden 4k",
            background_theme: "reverent peaceful holy light"
          },
          {
            title_part1: "Kembalilah Pada-Nya",
            title_part2: "Dalam Sujud",
            body: "Dekatkan dahimu ke bumi, maka Dia akan mengangkat segala beban di pundakmu.",
            spoken_narration: "Dekatkan dahimu ke bumi dalam sujud yang khusyuk, niscaya Allah akan mengangkat seluruh beban di pundakmu.",
            foreground_subject_prompt: "majestic mosque dome silhouette stars night sky calm 4k",
            background_theme: "night sky stars spiritual quiet"
          }
        ]
      },
      {
        caption: "Bila rezeki terasa lambat datangnya, periksalah niat dan kualitas ibadah kita. Terkadang Allah menunda sesuatu bukan karena menolak doamu, tetapi karena sedang mempersiapkan dirimu agar pantas menerimanya.\n\nSimpan pengingat ini dan ikuti @adhlil.co.",
        hashtags: ["rezekiberkah", "tawakkal", "muhasabahdiri", "pengingatdiri", "adhlilco"],
        slides: [
          {
            title_part1: "Mengapa Rezekimu",
            title_part2: "Terasa Tertunda?",
            body: "Penantian terbaik adalah dengan memperbaiki niat dan memurnikan ikhtiar.",
            spoken_narration: "Pernahkah engkau merasa rezeki yang dinanti begitu lama untuk hadir menyapa kehidupanmu?",
            foreground_subject_prompt: "sand hourglass flowing smooth slow motion cinematic 4k",
            background_theme: "timeless contemplative warm"
          },
          {
            title_part1: "Allah Tahu Waktu",
            title_part2: "Yang Paling Tepat",
            body: "Bunga tidak mekar sebelum musimnya tiba, begitu pula berkah yang Allah janjikan.",
            spoken_narration: "Ketetapan Allah tidak pernah terlambat sedetik pun. Dia tahu kapan saat terbaik untuk melimpahkannya.",
            foreground_subject_prompt: "time lapse flower blooming morning dew sunlight 4k",
            background_theme: "natural blooming morning light"
          },
          {
            title_part1: "Jaga Prasangka",
            title_part2: "Kepada Sang Khaliq",
            body: "Aku sesuai dengan persangkaan hamba-Ku terhadap-Ku (Hadits Qudsi).",
            spoken_narration: "Selalulah berprasangka baik kepada Allah, karena Dia memperlakukan hamba-Nya sesuai persangkaan mereka.",
            foreground_subject_prompt: "peaceful stream flowing through mossy green forest 4k",
            background_theme: "lush tranquil forest spring"
          },
          {
            title_part1: "Syukuri Apa Yang",
            title_part2: "Ada Hari Ini",
            body: "Jika kamu bersyukur, pasti Kami akan menambah nikmat kepadamu (QS. Ibrahim: 7).",
            spoken_narration: "Bila kita bersyukur atas nafas dan kesehatan hari ini, Allah pasti akan menambahkan nikmat-nikmat lainnya.",
            foreground_subject_prompt: "hands holding warm tea morning window rustic wooden 4k",
            background_theme: "grateful morning warmth"
          },
          {
            title_part1: "Tenangkan Jiwa,",
            title_part2: "Lanjutkan Langkah",
            body: "Tugasmu hanyalah ikhtiar yang halal, hasil akhirnya serahkan pada Allah.",
            spoken_narration: "Tugas kita hanyalah berikhtiar dengan jalan yang diridhoi-Nya, selebihnya biarkan Allah yang mengatur yang terbaik.",
            foreground_subject_prompt: "lone traveler walking path towards golden mountains sunrise 4k",
            background_theme: "epic golden horizon journey"
          }
        ]
      },
      {
        caption: "Berapa banyak dari kita yang sibuk mengejar dunia hingga lupa bahwa umur terus berkurang? Di keheningan malam, luangkan beberapa menit untuk bermuhasabah dan memohon ampunan-Nya.\n\nSimpan dan bagikan untuk kebaikan sesama.",
        hashtags: ["muhasabahmalam", "renunganislami", "taubat", "akhirat", "adhlilco"],
        slides: [
          {
            title_part1: "Di Keheningan Malam",
            title_part2: "Tanyakan Pada Jiwa",
            body: "Sudah seberapa banyak bekal yang kita kumpulkan untuk perjalanan abadi kelak?",
            spoken_narration: "Saat dunia mulai terlelap dalam gelap, tanyakanlah pada dirimu, sudahkah kita mempersiapkan bekal keabadian?",
            foreground_subject_prompt: "crescent moon shining through calm clouds night sky 4k",
            background_theme: "mystical peaceful night sky"
          },
          {
            title_part1: "Dunia Ini Penuh",
            title_part2: "Tipu Daya",
            body: "Kesenangan semu seringkali melalaikan kita dari tujuan penciptaan yang hakiki.",
            spoken_narration: "Keindahan dunia seringkali memikat pandangan, hingga kita lupa bahwa segalanya fana dan akan berlalu.",
            foreground_subject_prompt: "water ripple drop falling slow motion crystal clear 4k",
            background_theme: "pure water droplet ripples"
          },
          {
            title_part1: "Pintu Ampunan",
            title_part2: "Selalu Terbuka",
            body: "Rahmat Allah jauh lebih luas daripada dosa-dosa yang pernah kita perbuat.",
            spoken_narration: "Jangan pernah berputus asa dari rahmat-Nya, karena pintu ampunan Allah selalu terbuka seluas samudra.",
            foreground_subject_prompt: "lantern glowing in dark night warm ambient light 4k",
            background_theme: "lantern night glow spiritual"
          },
          {
            title_part1: "Sucikan Hati",
            title_part2: "Sebelum Terlelap",
            body: "Maafkan kesalahan sesama agar Allah memudahkan jalan hisabmu di akhirat kelak.",
            spoken_narration: "Maafkanlah setiap orang yang pernah melukaimu sebelum tidur, agar hatimu bangun dalam kedamaian.",
            foreground_subject_prompt: "gentle rain on window pane street lights bokeh warm 4k",
            background_theme: "rainy window reflection peace"
          },
          {
            title_part1: "Awali Hari Esok",
            title_part2: "Dengan Niat Mulia",
            body: "Semoga Allah senantiasa membimbing langkah kita dalam ridha dan perlindungan-Nya.",
            spoken_narration: "Simpan renungan ini dan ikuti @adhlil.co untuk bersama-sama menjaga kebersihan hati setiap hari.",
            foreground_subject_prompt: "dawn breaking over ancient minarets mist ethereal 4k",
            background_theme: "ethereal morning mist dawn"
          }
        ]
      }
    ];
    fallbackObj = stories[dayIndex];
  }

  const topicToSave = fallbackObj.slides[0]?.title_part1 || '';
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
 * Generate a complete, highly structured Visual Metaphor Motion S/**
 * Fetches recently used motion primitives from topic_history and instagram_history
 * to guarantee no repeating concepts within at least 10-14 days.
 */
async function getRecentlyUsedPrimitives(accountId) {
  if (!accountId) return [];
  try {
    // 1. Check topic_history
    const topicRows = await sql`
      SELECT topic FROM topic_history
      WHERE platform = 'instagram_primitive' AND account_id = ${accountId}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const found = topicRows.map(r => r.topic).filter(Boolean);

    // 2. Also check instagram_history for any matching URLs or captions
    const histRows = await sql`
      SELECT image_urls, caption FROM instagram_history
      WHERE account_id = ${accountId} AND slide_count = 0 AND status = 'success'
      ORDER BY created_at DESC LIMIT 10
    `;
    const mapping = {
      opticallens: 'OpticalLens',
      hourglassflow: 'HourglassFlow',
      icebergmastery: 'IcebergMastery',
      newtonscradle: 'NewtonsCradle',
      dominocascade: 'DominoCascade',
      chaostoprism: 'ChaosToPrism',
      physicsfulcrum: 'PhysicsFulcrum',
      divergentbranch: 'DivergentBranch',
    };
    for (const r of histRows) {
      const urls = typeof r.image_urls === 'string' ? r.image_urls : JSON.stringify(r.image_urls);
      const lower = (urls + ' ' + (r.caption || '')).toLowerCase();
      for (const [key, val] of Object.entries(mapping)) {
        if (lower.includes(key)) {
          if (!found.includes(val)) found.push(val);
          break;
        }
      }
    }
    return found;
  } catch (err) {
    console.warn('[AntiDuplicate] Could not fetch recent primitives:', err.message);
    return [];
  }
}

/**
 * Generates an ultra-minimalist, high-retention Visual Metaphor Spec.
 * Enforces strict anti-duplicate rotation across all 8 motion concepts.
 */
export async function generateVisualMetaphorSpec(customPrompt = null, masterPrompt = '', accountName = '@tranvas', accountId = 2) {
  const apiKeys = await getAllGeminiKeys();
  const primitives = [
    'OpticalLens',
    'HourglassFlow',
    'IcebergMastery',
    'NewtonsCradle',
    'DominoCascade',
    'ChaosToPrism',
    'PhysicsFulcrum',
    'DivergentBranch',
  ];

  // 1. Fetch recently used primitives and enforce anti-duplicate rotation
  const recentPrimitives = await getRecentlyUsedPrimitives(accountId);
  console.log(`[AntiDuplicate] Recently used primitives for acc ${accountId}:`, recentPrimitives);

  // Exclude the most recent 5 primitives so a video concept NEVER repeats within 10-14 days
  let availablePrimitives = primitives.filter(p => !recentPrimitives.slice(0, 5).includes(p));
  if (availablePrimitives.length === 0) {
    // If all primitives have been used, pick the least recently used ones
    availablePrimitives = [...primitives].sort((a, b) => {
      const idxA = recentPrimitives.indexOf(a);
      const idxB = recentPrimitives.indexOf(b);
      return (idxB === -1 ? 999 : idxB) - (idxA === -1 ? 999 : idxA);
    }).slice(0, 3);
  }
  console.log(`[AntiDuplicate] Available fresh primitives:`, availablePrimitives);

  // 2. Recent topic check to avoid duplicate topics
  let recentTopicsSection = '';
  if (accountId) {
    const recentTopics = await getRecentTopics('instagram', accountId, 25, 14);
    if (recentTopics.length > 0) {
      recentTopicsSection = `AVOID RECENT TOPICS:\n${recentTopics.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}\n`;
    }
  }

  // Real-time Viral Trend Hunter & Newsjacking (Open-Source GitHub Engine)
  let effectivePrompt = customPrompt;
  try {
    const { getNewsjackedAngle } = await import('./trend_hunter.js');
    effectivePrompt = await getNewsjackedAngle(accountName, masterPrompt, customPrompt, true);
  } catch (trendErr) {
    console.warn('[VisualMetaphor] Trend Hunter fallback:', trendErr.message);
  }

  const systemPrompt = `
You are an ELITE Creative Director for viral Visual Thinking Reels (EXACTLY like @mindset.therapy, Janis Ozolins, and Visualize Value: clean, dark OLED, hypnotic, hyper-minimalist).
Brand: Tranvas (tranvas.com - All-in-One Life Operating System, Second Brain, Focus Flow, 1% Compounding).

CORE PHILOSOPHY:
- EXTREME MINIMALISM: ZERO text clutter. The viewer should understand the entire visual metaphor in 1 second.
- DURATION: 6.5s (punchy, clean, and seamlessly loopable on Instagram).
- TEXT ON SCREEN: ONLY ONE single punchy headline (MAX 3-6 WORDS). No paragraphs, no category badges, no subtitles.
- THE CAPTION carries the deep explanation and insights.

Angle / Topic: "${effectivePrompt || 'an insightful paradox or mental model about productivity, habits, or mental clarity'}"

CRITICAL ANTI-DUPLICATE CONSTRAINT:
Recently posted primitives (STRICTLY FORBIDDEN to reuse): ${recentPrimitives.slice(0, 5).join(', ') || 'None'}
You MUST choose your primitive ONLY from this fresh, unused candidate list:
${availablePrimitives.map((p, idx) => `  ${idx + 1}. "${p}"`).join('\n')}

${recentTopicsSection}

OUTPUT FORMAT (strict JSON, no markdown):
{
  "primitive": "Must be one from the available list above",
  "headline": "Ultra-punchy headline, MAX 3 TO 6 WORDS. E.g. 'Scattered Energy = 0. Focus = Laser.' or 'Time Sinks. Or Time Compounds.'",
  "primitiveData": {
    "multiplier": 37.8
  },
  "caption": "High-value, engaging Instagram caption in English (200-400 chars). Warm, insightful, explaining the mental model clearly with line breaks and emojis, inviting them to build their second brain with Tranvas.",
  "hashtags": ["SecondBrain", "TranvasApp", "ProductivityTips", "DeepWork", "VisualThinking"]
}

STRICT RULES:
- Headline MUST be 3 to 6 words maximum. NO long sentences!
- 100% English.
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

        // Fail-safe programmatic enforcement: if Gemini picked a blacklisted primitive, force an unused candidate!
        if (!availablePrimitives.includes(parsed.primitive)) {
          const forced = availablePrimitives[Math.floor(Math.random() * availablePrimitives.length)];
          console.log(`[AntiDuplicate] 🛡️ Overriding duplicate choice "${parsed.primitive}" with fresh primitive: "${forced}"`);
          parsed.primitive = forced;
        }

        if (accountId) {
          if (parsed.headline || customPrompt) {
            await saveTopic('instagram', accountId, customPrompt || parsed.headline);
          }
          // Save primitive to topic_history so it is NEVER duplicated!
          await saveTopic('instagram_primitive', accountId, parsed.primitive);
        }

        console.log(`[Gemini-VisualMetaphor] ✅ Generated spec for primitive: ${parsed.primitive} | Headline: "${parsed.headline}"`);
        return parsed;
      } catch (err) {
        console.warn(`[Gemini-VisualMetaphor] Model ${modelName} error: ${err.message}`);
        continue;
      }
    }
  }

  // Guaranteed fresh fallback if API fails
  const fallbackPrimitive = availablePrimitives[0] || 'OpticalLens';
  if (accountId) {
    await saveTopic('instagram_primitive', accountId, fallbackPrimitive).catch(() => { });
  }
  console.warn(`[Gemini-VisualMetaphor] ⚠️ Using fresh fallback primitive: ${fallbackPrimitive}`);
  return {
    primitive: fallbackPrimitive,
    headline: fallbackPrimitive === 'OpticalLens' ? 'Scattered Energy = 0. Focus = Laser.' : 'Time Sinks. Or Time Compounds.',
    primitiveData: { multiplier: 37.8 },
    caption: 'When you keep all your tasks, notes, and habits in your head, you are operating at 20% capacity. Build a Second Brain with Tranvas and operate with pure clarity. 🧠⚡',
    hashtags: ['SecondBrain', 'TranvasApp', 'ProductivityTips', 'DeepWork', 'FocusState'],
  };
}

