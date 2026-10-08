export const maxDuration = 60;
import express from 'express';
import cors from 'cors';
import sql, { initDb } from '../lib/database.js';
import { getBlueskyAgent, postToBluesky } from '../lib/bluesky.js';
import { generateTumblrContent } from '../lib/gemini_tumblr.js'; 
import { generateInstagramSlideImages, generateNativeBannerImage } from '../lib/instagram_carousel.js';
import { generateKhaithisranPost } from '../lib/bluesky_content.js';
import { getDailyDynamicTargetSlot } from '../lib/stealth_reach_engine.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use(async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

// ── ACCOUNTS & DASHBOARD STATUS ──────────────────────────────────────────────────

app.get('/api/bluesky/accounts', async (req, res) => {
  try {
    const accounts = await sql`SELECT id, name, identifier FROM bluesky_accounts WHERE is_active = 1 ORDER BY id ASC`;
    res.json(accounts || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bluesky/connect', async (req, res) => {
  const { identifier, app_password } = req.body;
  if (!identifier || !app_password) return res.status(400).json({ error: 'Missing identifier or app password' });

  try {
    const agent = await getBlueskyAgent(identifier, app_password);
    const userDid = agent.session?.did;

    if (!userDid) {
        throw new Error("Failed to authenticate");
    }
    
    // Check if account already exists
    const existing = await sql`SELECT id FROM bluesky_accounts WHERE identifier = ${identifier}`;
    if (existing.length > 0) {
      await sql`UPDATE bluesky_accounts SET app_password = ${app_password}, is_active = 1 WHERE identifier = ${identifier}`;
    } else {
      await sql`
        INSERT INTO bluesky_accounts (name, identifier, app_password, is_active)
        VALUES (${identifier}, ${identifier}, ${app_password}, 1)
      `;
    }
    res.json({ success: true, identifier: identifier });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/bluesky/status', async (req, res) => {
  const accountId = req.query.accountId || 1;
  try {
    const [schedules, lastPost, tokenRow, autoRow] = await Promise.all([
      sql`SELECT * FROM bluesky_schedules WHERE account_id = ${accountId} ORDER BY id ASC`,
      sql`SELECT * FROM bluesky_history WHERE account_id = ${accountId} ORDER BY id DESC LIMIT 1`,
      sql`SELECT app_password FROM bluesky_accounts WHERE id = ${accountId}`,
      sql`SELECT value FROM bluesky_settings WHERE key = 'bluesky_automation_enabled'`,
    ]);

    const token = tokenRow[0];
    const isTokenValid = !!(token?.app_password);

    res.json({
      schedules,
      lastPost: lastPost[0] || null,
      blueskyToken: isTokenValid,
      automation_enabled: autoRow[0]?.value || 'true',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SETTINGS & SCHEDULES ─────────────────────────────────────────────────────

app.post('/api/bluesky/settings/toggle-automation', async (req, res) => {
  try {
    const current = await sql`SELECT value FROM bluesky_settings WHERE key = 'bluesky_automation_enabled'`;
    const newValue = current[0]?.value === 'false' ? 'true' : 'false';
    await sql`
      INSERT INTO bluesky_settings (key, value) VALUES ('bluesky_automation_enabled', ${newValue})
      ON CONFLICT (key) DO UPDATE SET value = ${newValue}
    `;
    res.json({ success: true, enabled: newValue === 'true' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/bluesky/history', async (req, res) => {
  const accountId = req.query.accountId;
  try {
    const history = accountId
      ? await sql`SELECT * FROM bluesky_history WHERE account_id = ${accountId} ORDER BY created_at DESC LIMIT 15`
      : await sql`SELECT * FROM bluesky_history ORDER BY created_at DESC LIMIT 15`;
    res.json(history || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bluesky/schedules', async (req, res) => {
  const { custom_prompt, accountId } = req.body;
  try {
    await sql`
      INSERT INTO bluesky_schedules (account_id, custom_prompt, is_active)
      VALUES (${accountId}, ${custom_prompt || null}, 1)
    `;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/bluesky/schedules/:id', async (req, res) => {
  try {
    await sql`DELETE FROM bluesky_schedules WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CORE: POST TO BLUESKY ─────────────────────────────────────────────

export async function runBlueskyPost(accountId, customPrompt = null, forceNoImage = false) {
  const accountRow = await sql`SELECT * FROM bluesky_accounts WHERE id = ${accountId}`;
  if (!accountRow.length) throw new Error(`Bluesky account ${accountId} not found`);
  const account = accountRow[0];

  const masterPrompt = account.master_prompt || '';
  const visualTheme = account.visual_theme || '';
  const colorPalette = account.color_palette || null;

  console.log(`[Bluesky-Post] Generating content for ${account.identifier}...`);

  const accountName = account.identifier || account.name || "bluesky_account";

  // Specialized dynamic copywriting for khaithisran (5 web ecosystem, 10 diverse frameworks, text-only)
  if (account.identifier.toLowerCase().includes('khaithisran')) {
    console.log(`[Bluesky-Post] Using Khaithisran dynamic copywriting engine for ${account.identifier}...`);
    const statusText = await generateKhaithisranPost(customPrompt);
    const response = await postToBluesky(account.identifier, account.app_password, statusText, null);
    console.log(`[Bluesky-Post] Successfully posted to Bluesky for ${account.identifier}: ${statusText}`);
    return { publishId: response.uri || 'success', status: 'success', text: statusText };
  }

  // Allow 1 image for Bluesky Promo layout, or text-only if forceNoImage is true. Max Length 280 chars to avoid truncation.
  const content = await generateTumblrContent(customPrompt, masterPrompt, visualTheme, accountName, accountId, forceNoImage, 280);
  const slides = content.slides || [];
  const caption = content.caption || '';
  const hashtags = content.hashtags || [];
  const full_image_prompt = content.full_image_prompt || null;
  console.log(`[Bluesky-Post] Generated Content`);

  let dynamicPalette = colorPalette;
  if (customPrompt) {
    const cp = customPrompt.toLowerCase();
    if (cp.includes('make.com')) {
      dynamicPalette = { name: 'make', bg1: '#ffffff', bg2: '#ffffff', accent: '#7b2cbf', text: '#000000' };
    } else if (cp.includes('wise.com')) {
      dynamicPalette = { name: 'wise', bg1: '#ffffff', bg2: '#ffffff', accent: '#9fe870', text: '#000000' };
    } else if (cp.includes('systeme')) {
      dynamicPalette = { name: 'systeme', bg1: '#ffffff', bg2: '#ffffff', accent: '#1778f2', text: '#000000' };
    }
  }

  let imageUrls = [];
  let imagePrompt = full_image_prompt;
  if (!imagePrompt && slides && slides.length > 0) {
    imagePrompt = slides[0].title_part1 || slides[0].text || null;
  }

  if (imagePrompt) {
    const nativeImages = await generateNativeBannerImage(imagePrompt, caption, dynamicPalette);
    if (nativeImages && nativeImages.length > 0) {
      imageUrls = nativeImages;
      console.log(`[Bluesky-Post] Native image generated and uploaded to Supabase`);
    }
  } 

  if (imageUrls.length === 0 && !forceNoImage) {
    console.log(`[Bluesky-Post] Native AI failed or no prompt, falling back to Satori layout.`);
    let fallbackText = customPrompt ? customPrompt.substring(0, 50) : "Learn More";
    if (caption) {
      const cleaned = caption.replace(/<[^>]+>/g, '').trim();
      const match = cleaned.match(/^([^\.\!\?]+[\.\!\?]?)/);
      if (match) fallbackText = match[1];
    }
    const fallbackSlide = (slides && slides.length > 0) ? slides.slice(0, 1) : [{
      layout_type: 'TextHeavy',
      title_part1: fallbackText.substring(0, 60),
      text: "Read more details below.",
      foreground_subject_prompt: null
    }];
    imageUrls = await generateInstagramSlideImages(fallbackSlide, dynamicPalette, accountName);
  } else if (forceNoImage) {
    console.log(`[Bluesky-Post] TEXT-ONLY mode activated. No images generated.`);
  }
  
  let cleanText = caption.replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, (match, url, anchorText) => {
    if (url === anchorText || anchorText.includes('http')) return url;
    return `${anchorText} (${url})`;
  }).replace(/<[^>]+>/g, '').trim();
  const hashtagsText = hashtags && hashtags.length > 0 ? `\n\n${hashtags.map(h => '#' + h.replace('#', '')).join(' ')}` : '';
  
  // Bluesky limits text to 300 characters
  const MAX_LENGTH = 300;
  let statusText = `${cleanText}${hashtagsText}`;
  if (statusText.length > MAX_LENGTH) {
    statusText = statusText.substring(0, MAX_LENGTH - 3) + '...';
  }

  let imageSource = null;
  if (imageUrls.length > 0) {
    imageSource = imageUrls[0].isRawBuffer ? imageUrls[0].buffer : imageUrls[0];
  }

  const response = await postToBluesky(account.identifier, account.app_password, statusText, imageSource);
  console.log(`[Bluesky-Post] Successfully posted to Bluesky.`);

  return { publishId: response.uri || 'success', status: 'success' };
}

app.post('/api/bluesky/post-now', async (req, res) => {
  const accountId = req.body.accountId || 1;
  const customPrompt = req.body.customPrompt || null;
  
  try {
    let finalPrompt = customPrompt;
    if (!finalPrompt) {
      const pending = await sql`SELECT custom_prompt FROM bluesky_schedules WHERE account_id = ${accountId} AND is_active = 1`;
      if (pending.length > 0) {
        finalPrompt = pending[Math.floor(Math.random() * pending.length)].custom_prompt;
      }
    }

    const pendingInsert = await sql`
      INSERT INTO bluesky_history (account_id, status) VALUES (${accountId}, 'pending') RETURNING id
    `;
    const historyId = pendingInsert[0].id;

    const result = await runBlueskyPost(accountId, finalPrompt, false);
    
    await sql`
      UPDATE bluesky_history SET status = 'success', publish_id = ${String(result.publishId)}, caption = ${result.text || finalPrompt || 'Bluesky Post'} WHERE id = ${historyId}
    `;

    res.json({ success: true, ...result });
  } catch (e) {
    console.error('[Bluesky-Manual]', e.message);
    try {
      await sql`
        INSERT INTO bluesky_history (account_id, caption, status, error_message)
        VALUES (${accountId}, ${customPrompt || 'Manual post'}, 'failed', ${e.message || String(e)})
      `;
    } catch (_) {}
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── CRON: AUTOMATION SCHEDULER ────────────────────────────────────────────────

export async function runBlueskyCron(force = false) {
  const now = new Date();
  const witaFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
  });
  const parts = {};
  witaFormatter.formatToParts(now).forEach(x => parts[x.type] = x.value);
  const todayStr = `${parts.year}-${parts.month}-${parts.day}`;
  const currentHour = parseInt(parts.hour === '24' ? '0' : parts.hour, 10);
  const currentMinute = parseInt(parts.minute, 10);

  try {
    const globalStatus = await sql`SELECT value FROM bluesky_settings WHERE key = 'bluesky_automation_enabled'`;
    if (globalStatus[0]?.value === 'false') {
      return { success: true, status: 'Bluesky automation disabled globally.' };
    }

    const accounts = await sql`SELECT id, name, identifier FROM bluesky_accounts WHERE is_active = 1`;
    const executed = [];

    for (const acc of accounts) {
      const isKhaithisran = acc.identifier.toLowerCase().includes('khaithisran');
      const isOneformind = acc.identifier.toLowerCase().includes('oneformind');
      // Algorithmic Growth & Anti-Ban Protocol (Bluesky 2026):
      // Maximum 2 high-value posts per day across active accounts.
      // Eliminates bot classification and lets each post accumulate reposts/likes across global feeds.
      const dailyLimit = 2;

      // ── DEDICATED STAGGERED WINDOWS FOR BLUESKY (WITA = UTC+8) ─────────────
      // Staggered to ensure ZERO template/hour collisions with Threads, Tumblr, or DEV.TO:
      // Session 1 (Pagi): 08:00 - 09:15 WITA (UTC 00:00 - 01:15) -> Reaches Asian morning scrollers & US West Coast night owls
      // Session 2 (Malam): 21:45 - 23:00 WITA (UTC 13:45 - 15:00) -> Reaches US East Coast morning rush (09:45 - 11:00 EST) & Europe evening
      let inSession = false;
      let sessionConfig = null;

      if ((currentHour === 8) || (currentHour === 9 && currentMinute <= 15)) {
        inSession = true;
        sessionConfig = { name: 'bsky_s1', startH: 8, startM: 0, endH: 9, endM: 15 };
      } else if ((currentHour === 21 && currentMinute >= 45) || (currentHour === 22) || (currentHour === 23 && currentMinute === 0)) {
        inSession = true;
        sessionConfig = { name: 'bsky_s2', startH: 21, startM: 45, endH: 23, endM: 0 };
      }

      if (!force && !inSession) {
        console.log(`[Bluesky-Cron] ${acc.identifier}: Current time ${currentHour}:${String(currentMinute).padStart(2, '0')} WITA is outside staggered Bluesky sessions (08:00-09:15 WITA & 21:45-23:00 WITA). Sleeping.`);
        continue;
      }

      // DYNAMIC DAILY TARGET MINUTE: Menjamin menit posting Bluesky berbeda setiap hari secara alami
      if (!force && sessionConfig) {
        const slot = getDailyDynamicTargetSlot(todayStr, acc.identifier, sessionConfig.name, sessionConfig.startH, sessionConfig.startM, sessionConfig.endH, sessionConfig.endM, currentHour, currentMinute);
        if (!slot.isDue) {
          console.log(`[Bluesky-Cron] ⏳ ${acc.identifier} (${sessionConfig.name}): Waiting for today's dynamic slot (${slot.formatted} WITA, Current: ${currentHour}:${String(currentMinute).padStart(2, '0')} WITA). Sleeping.`);
          continue;
        }
      }

      const ranToday = await sql`
        SELECT COUNT(*) as count FROM bluesky_history
        WHERE account_id = ${acc.id} AND status = 'success' AND TO_CHAR(created_at + INTERVAL '8 hours', 'YYYY-MM-DD') = ${todayStr}
      `;
      const postsToday = parseInt(ranToday[0]?.count || 0, 10);

      if (postsToday >= dailyLimit) {
        console.log(`[Bluesky-Cron] Acc ${acc.identifier}: Daily quota satisfied (${postsToday}/${dailyLimit} posts today).`);
        continue;
      }

      // Strategic Inter-Session Cooldown Guard:
      // Enforces an 8.5h to 11.0h cooldown gap between Session 1 (morning) and Session 2 (night).
      const lastPostRows = await sql`
        SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_since
        FROM bluesky_history 
        WHERE account_id = ${acc.id} AND status = 'success' 
        ORDER BY id DESC LIMIT 1
      `;
      if (lastPostRows.length > 0 && !force) {
        const hoursSinceLastPost = parseFloat(lastPostRows[0].hours_since || 0);
        const jitter = ((acc.id * 71 + postsToday * 23 + currentHour * 13) % 100) / 100;
        const minCooldownHours = 8.5 + (jitter * 2.5); // 8.5h - 11.0h gap

        if (hoursSinceLastPost < minCooldownHours) {
          console.log(`[Bluesky-Cron] ⏸️ ${acc.identifier}: In strategic cooldown (${hoursSinceLastPost.toFixed(2)}h / ${minCooldownHours.toFixed(2)}h). Skipping.`);
          continue;
        }
      }

      // Sequential FIFO Schedule Rotation (Oldest last_run_date first)
      let pending = await sql`
        SELECT * FROM bluesky_schedules
        WHERE account_id = ${acc.id}
          AND is_active = 1
          AND (last_run_date IS NULL OR last_run_date != ${todayStr})
        ORDER BY last_run_date ASC NULLS FIRST, id ASC
      `;

      if (!pending.length) {
        if (isKhaithisran) {
          console.log(`[Bluesky-Cron] Acc ${acc.identifier}: All scheduled websites already posted for today.`);
          continue;
        }
        pending = Array(dailyLimit).fill({ id: null, custom_prompt: "" });
      }

      console.log(`[Bluesky-Cron] 🚀 Ready to post for ${acc.identifier}: postsToday=${postsToday}/${dailyLimit}, pending=${pending.length}`);

      if (true) {
        // Pick pending schedules sequentially (FIFO: fair rotation through all web apps)
        const chosen = pending[0];
        let finalPrompt = chosen.custom_prompt;
        let forceNoImage = isOneformind || isKhaithisran;

        if (!finalPrompt || finalPrompt.trim() === '') {
          if (isKhaithisran) {
            finalPrompt = 'tranvas';
          } else if (isOneformind) {
            const oneformindTopics = [
              "Share a powerful insight on deep work and achieving cognitive flow state for maximum productivity.",
              "Write about the most effective time-blocking strategies that high-performers use.",
              "Discuss how habit stacking can completely transform morning routines for ambitious people.",
              "Share actionable tips on overcoming digital distractions and staying in deep focus.",
              "Write about the psychology of productivity: why most people fail at being consistent.",
            ];
            finalPrompt = oneformindTopics[postsToday % oneformindTopics.length];
          } else if (postsToday === 0) {
            finalPrompt = "Research and discuss a highly engaging, current viral trending tech topic. DO NOT include any affiliate links. Just pure value and engagement.";
            forceNoImage = true;
          } else {
            finalPrompt = "Enthusiastically recommend this tool: https://tranvas.com";
          }
        }

        try {
          const pendingInsert = await sql`
            INSERT INTO bluesky_history (account_id, status) VALUES (${acc.id}, 'pending') RETURNING id
          `;
          const historyId = pendingInsert[0].id;

          // Randomized human micro-jitter delay (3s - 8s) to break clockwork request signatures
          const humanDelayMs = 3000 + Math.floor(Math.random() * 5000);
          console.log(`[Bluesky-Cron] Applying ${humanDelayMs}ms human jitter before dispatching to Bluesky...`);
          await new Promise(r => setTimeout(r, humanDelayMs));

          const result = await runBlueskyPost(acc.id, finalPrompt, forceNoImage);
          if (chosen.id) {
            await sql`UPDATE bluesky_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}`;
          }

          await sql`
            UPDATE bluesky_history SET status = 'success', publish_id = ${String(result.publishId)}, caption = ${result.text || chosen.custom_prompt || 'Bluesky Post'} WHERE id = ${historyId}
          `;

          console.log(`[Bluesky-Cron] ✅ Successfully posted for ${acc.identifier} (${chosen.custom_prompt})`);
          executed.push({ account: acc.identifier, scheduleId: chosen.id, ...result });
        } catch (postErr) {
          console.error(`[Bluesky-Cron] ❌ Post failed for ${acc.identifier}:`, postErr.message);
          await sql`
            INSERT INTO bluesky_history (account_id, caption, status, error_message)
            VALUES (${acc.id}, ${chosen.custom_prompt || 'Auto post'}, 'failed', ${postErr.message || String(postErr)})
          `;
        }
      }
    }

    return { success: true, executed };
  } catch (e) {
    console.error('[Bluesky-Cron] Error:', e.message);
    throw e;
  }
}

app.get('/api/bluesky/cron', async (req, res) => {
  const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';
  const authHeader = req.headers.authorization;
  const secretParam = req.query.secret;

  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const result = await runBlueskyCron();
    res.json(result);
  } catch (e) {
    res.status(200).json({ success: false, error: e.message });
  }
});

export default app;
