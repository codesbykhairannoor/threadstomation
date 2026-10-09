export const maxDuration = 60;
import express from 'express';
import cors from 'cors';
import sql, { initDb } from '../lib/database.js';
import { getMastodonUserInfo, postToMastodon, uploadMediaToMastodon, setMastodonBotAccount } from '../lib/mastodon.js';
import { generateTumblrContent } from '../lib/gemini_tumblr.js';
import { generateInstagramSlideImages, generateNativeBannerImage } from '../lib/instagram_carousel.js';
import { generateMastodonPost } from '../lib/mastodon_content.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Global DB Init
app.use(async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

// ── ACCOUNTS & DASHBOARD STATUS ──────────────────────────────────────────────────

app.get('/api/mastodon/accounts', async (req, res) => {
  try {
    const accounts = await sql`SELECT id, name, username, instance_url FROM mastodon_accounts WHERE is_active = 1 ORDER BY id ASC`;
    res.json(accounts || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/mastodon/status', async (req, res) => {
  const accountId = req.query.accountId || 1;
  try {
    const [schedules, lastPost, tokenRow, autoRow] = await Promise.all([
      sql`SELECT * FROM mastodon_schedules WHERE account_id = ${accountId} ORDER BY id ASC`,
      sql`SELECT * FROM mastodon_history WHERE account_id = ${accountId} ORDER BY id DESC LIMIT 1`,
      sql`SELECT access_token FROM mastodon_accounts WHERE id = ${accountId}`,
      sql`SELECT value FROM mastodon_settings WHERE key = 'mastodon_automation_enabled'`,
    ]);

    const token = tokenRow[0];
    const isTokenValid = !!(token?.access_token);

    res.json({
      schedules,
      lastPost: lastPost[0] || null,
      mastodonToken: isTokenValid,
      automation_enabled: autoRow[0]?.value || 'true',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SETTINGS & SCHEDULES ─────────────────────────────────────────────────────

app.post('/api/mastodon/settings/toggle-automation', async (req, res) => {
  try {
    const current = await sql`SELECT value FROM mastodon_settings WHERE key = 'mastodon_automation_enabled'`;
    const newValue = current[0]?.value === 'false' ? 'true' : 'false';
    await sql`
      INSERT INTO mastodon_settings (key, value) VALUES ('mastodon_automation_enabled', ${newValue})
      ON CONFLICT (key) DO UPDATE SET value = ${newValue}
    `;
    res.json({ success: true, enabled: newValue === 'true' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/mastodon/history', async (req, res) => {
  const accountId = req.query.accountId;
  try {
    const history = accountId
      ? await sql`SELECT * FROM mastodon_history WHERE account_id = ${accountId} ORDER BY created_at DESC LIMIT 15`
      : await sql`SELECT * FROM mastodon_history ORDER BY created_at DESC LIMIT 15`;
    res.json(history || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/mastodon/schedules', async (req, res) => {
  const { custom_prompt, accountId } = req.body;
  try {
    await sql`
      INSERT INTO mastodon_schedules (account_id, custom_prompt, is_active)
      VALUES (${accountId}, ${custom_prompt || null}, 1)
    `;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/mastodon/schedules/:id', async (req, res) => {
  try {
    await sql`DELETE FROM mastodon_schedules WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CORE: POST CAROUSEL TO MASTODON ─────────────────────────────────────────────

async function runMastodonPost(accountId, customPrompt = null, forceNoImage = false) {
  const accountRow = await sql`SELECT * FROM mastodon_accounts WHERE id = ${accountId}`;
  if (!accountRow.length) throw new Error(`Mastodon account ${accountId} not found`);
  const account = accountRow[0];

  const masterPrompt = account.master_prompt || '';
  const visualTheme = account.visual_theme || '';
  const colorPalette = account.color_palette || null;

  // Auto-flag account as bot if not already set (mastodon.social rule compliance)
  setMastodonBotAccount(account.access_token, account.instance_url).catch(() => {});

  console.log(`[Mastodon-Post] Generating content for ${account.username}...`);

  // Specialized Fediverse copywriting for khaithisran (5 web ecosystem, CamelCase hashtags, anti-VC, technical depth)
  if (account.username?.toLowerCase().includes('khaithisran') || account.name?.toLowerCase().includes('khaithisran')) {
    console.log(`[Mastodon-Post] Using Khaithisran Fediverse copywriting engine...`);
    const statusText = await generateMastodonPost(customPrompt);
    const response = await postToMastodon(account.access_token, account.instance_url, statusText, []);
    console.log(`[Mastodon-Post] Successfully posted to Mastodon: ${statusText.substring(0, 80)}...`);
    return { publishId: response.id, status: 'success', text: statusText };
  }

  const accountName = account.username || account.name || "mastodon_user";

  // Allow 1 image for Mastodon Promo layout. Max Length 480 chars to avoid truncation.
  const content = await generateTumblrContent(customPrompt, masterPrompt, visualTheme, accountName, accountId, forceNoImage, 480);
  const slides = content.slides || [];
  const caption = content.caption || '';
  const hashtags = content.hashtags || [];
  const full_image_prompt = content.full_image_prompt || null;
  console.log(`[Mastodon-Post] Generated Content`);

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
      console.log(`[Mastodon-Post] Native image generated and uploaded to Supabase`);
    }
  } 

  if (imageUrls.length === 0 && !forceNoImage) {
    console.log(`[Mastodon-Post] Native AI failed or no prompt, falling back to Satori layout.`);
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
    console.log(`[Mastodon-Post] TEXT-ONLY mode activated. No images generated.`);
  }

  let mediaIds = [];
  if (imageUrls.length > 0) {
    try {
      let imageBuffer;
      if (imageUrls[0].isRawBuffer) {
        imageBuffer = imageUrls[0].buffer;
      } else {
        const imgRes = await fetch(imageUrls[0]);
        const arrayBuffer = await imgRes.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }
      const mediaId = await uploadMediaToMastodon(account.instance_url, account.access_token, imageBuffer);
      mediaIds.push(mediaId);
    } catch(e) {
      console.error(`[Mastodon-Post] Failed to process/upload image:`, e.message);
    }
  }

  // Mastodon doesn't support HTML in the same way, but it will parse basic URLs into links. 
  // We'll strip any heavy HTML tags from caption if generateTumblrContent used HTML.
  // Mastodon API limit is 500 chars
  let cleanText = caption.replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, (match, url, anchorText) => {
    if (url === anchorText || anchorText.includes('http')) return url;
    return `${anchorText} (${url})`;
  }).replace(/<[^>]+>/g, '').trim();
  if (cleanText.length > 480) {
    cleanText = cleanText.substring(0, 480) + '...';
  }

  const hashtagsText = hashtags && hashtags.length > 0 ? `\n\n${hashtags.map(h => '#' + h.replace('#', '')).join(' ')}` : '';
  const statusText = `${cleanText}${hashtagsText}`.substring(0, 500);

  const response = await postToMastodon(
    account.access_token,
    account.instance_url,
    statusText,
    mediaIds
  );
  console.log(`[Mastodon-Post] Successfully posted to Mastodon. Post ID: ${response.id}`);

  // History is now inserted by the caller (Cron or Manual) to prevent spamming
  return { publishId: response.id, status: 'success' };
}

app.post('/api/mastodon/post-now', async (req, res) => {
  const accountId = req.body.accountId || 1;
  const customPrompt = req.body.customPrompt || null;
  
  try {
    let finalPrompt = customPrompt;
    if (!finalPrompt) {
      const pending = await sql`SELECT custom_prompt FROM mastodon_schedules WHERE account_id = ${accountId} AND is_active = 1`;
      if (pending.length > 0) {
        finalPrompt = pending[Math.floor(Math.random() * pending.length)].custom_prompt;
      }
    }

    const pendingInsert = await sql`
      INSERT INTO mastodon_history (account_id, status) VALUES (${accountId}, 'pending') RETURNING id
    `;
    const historyId = pendingInsert[0].id;

    const result = await runMastodonPost(accountId, finalPrompt, false);
    
    await sql`
      UPDATE mastodon_history SET status = 'success', post_id = ${String(result.publishId)} WHERE id = ${historyId}
    `;

    res.json({ success: true, ...result });
  } catch (e) {
    console.error('[Mastodon-Manual]', e.message);
    try {
      await sql`
        INSERT INTO mastodon_history (account_id, caption, status, error_message)
        VALUES (${accountId}, ${customPrompt || 'Manual post'}, 'failed', ${e.message || String(e)})
      `;
    } catch (_) {}
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── CRON: AUTOMATION SCHEDULER ────────────────────────────────────────────────

export async function runMastodonCron(force = false) {
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
  const currentMinutes = parseInt(parts.minute, 10);

  console.log(`[Mastodon-Cron] Tick started at ${todayStr} ${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')} WITA (Force: ${force})`);

  // Active daylight posting window: 07:30 - 23:00 WITA (organic human sleeping hours 23:00 - 07:30)
  const isTooEarly = currentHour < 7 || (currentHour === 7 && currentMinutes < 30);
  const isTooLate = currentHour >= 23;
  if (!force && (isTooEarly || isTooLate)) {
    console.log(`[Mastodon-Cron] 🌙 Current time ${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')} WITA is outside active window (07:30 - 23:00 WITA). Sleeping.`);
    return { success: true, status: 'Outside active daytime hours (07:30 - 23:00 WITA)' };
  }

  try {
    const globalStatus = await sql`SELECT value FROM mastodon_settings WHERE key = 'mastodon_automation_enabled'`;
    if (globalStatus[0]?.value === 'false') {
      console.log('[Mastodon-Cron] Mastodon automation is disabled globally in settings.');
      return { success: true, status: 'Mastodon automation disabled globally.' };
    }

    const accounts = await sql`SELECT id, name, username FROM mastodon_accounts WHERE is_active = 1`;
    const executed = [];

    for (const acc of accounts) {
      const isKhaithisran = acc.username?.toLowerCase().includes('khaithisran') || acc.name?.toLowerCase().includes('khaithisran');
      const isOneformind = acc.username?.toLowerCase().includes('oneformind') || acc.name?.toLowerCase().includes('oneformind');
      const dailyLimit = 1; // Strict 1 post per day per user request ("sehari sekali")

      const ranToday = await sql`
        SELECT COUNT(*) as count FROM mastodon_history
        WHERE account_id = ${acc.id} AND status = 'success' AND TO_CHAR(created_at + INTERVAL '8 hours', 'YYYY-MM-DD') = ${todayStr}
      `;
      const postsToday = parseInt(ranToday[0]?.count || 0, 10);

      if (postsToday >= dailyLimit) {
        console.log(`[Mastodon-Cron] Acc ${acc.username || acc.name}: Already completed daily limit (${postsToday}/${dailyLimit}) for ${todayStr}. Skipping.`);
        continue;
      }

      // Round-robin selection: pick the schedule with the oldest last_run_date (or never run)
      // This guarantees an exact daily rotation across all 5 target websites without repeating.
      let pending = await sql`
        SELECT * FROM mastodon_schedules
        WHERE account_id = ${acc.id}
          AND is_active = 1
        ORDER BY last_run_date ASC NULLS FIRST, id ASC
      `;

      if (!pending.length) {
        console.log(`[Mastodon-Cron] Acc ${acc.username || acc.name}: No active schedules found.`);
        continue;
      }

      console.log(`[Mastodon-Cron] 🚀 Ready to post daily website for ${acc.username || acc.name}: postsToday=${postsToday}/${dailyLimit}, rotating among ${pending.length} sites`);

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
            "Write about the psychology of productivity: why most people fail at being consistent."
          ];
          finalPrompt = oneformindTopics[postsToday % oneformindTopics.length];
        } else {
          finalPrompt = "tranvas";
        }
      }

      try {
        const pendingInsert = await sql`
          INSERT INTO mastodon_history (account_id, status) VALUES (${acc.id}, 'pending') RETURNING id
        `;
        const historyId = pendingInsert[0].id;

        const result = await runMastodonPost(acc.id, finalPrompt, forceNoImage);
        if (chosen.id) {
          await sql`UPDATE mastodon_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}`;
        }

        await sql`
          UPDATE mastodon_history SET status = 'success', post_id = ${String(result.publishId)}, caption = ${result.text || chosen.custom_prompt || 'Mastodon Post'} WHERE id = ${historyId}
        `;

        console.log(`[Mastodon-Cron] ✅ Successfully posted for ${acc.username || acc.name} (${chosen.custom_prompt})`);
        executed.push({ account: acc.username || acc.name, scheduleId: chosen.id, ...result });
      } catch (postErr) {
        console.error(`[Mastodon-Cron] ❌ Post failed for ${acc.username || acc.name}:`, postErr.message);
        await sql`
          INSERT INTO mastodon_history (account_id, caption, status, error_message)
          VALUES (${acc.id}, ${chosen.custom_prompt || 'Auto post'}, 'failed', ${postErr.message || String(postErr)})
        `;
      }
    }

    return { success: true, executed };
  } catch (e) {
    console.error('[Mastodon-Cron] Error:', e.message);
    throw e;
  }
}

app.get('/api/mastodon/cron', async (req, res) => {
  const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';
  const authHeader = req.headers.authorization;
  const secretParam = req.query.secret;

  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const isForce = req.query.force === 'true';
    const result = await runMastodonCron(isForce);
    res.json(result);
  } catch (e) {
    res.status(200).json({ success: false, error: e.message });
  }
});

export default app;
