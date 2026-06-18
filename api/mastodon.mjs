export const maxDuration = 60;
import express from 'express';
import cors from 'cors';
import sql, { initDb } from '../lib/database.js';
import { getMastodonUserInfo, postToMastodon, uploadMediaToMastodon } from '../lib/mastodon.js';
import { generateTumblrContent } from '../lib/gemini_tumblr.js'; // Reuse the tumblr logic because it has text-only or 1 image + english aggressive marketing
import { generateInstagramSlideImages, generateNativeBannerImage } from '../lib/instagram_carousel.js';

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

  console.log(`[Mastodon-Post] Generating content for ${account.username}...`);

  const accountName = "caridisinishop_mastodon";

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
    const nativeImages = await generateNativeBannerImage(imagePrompt);
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

app.get('/api/mastodon/cron', async (req, res) => {
  const expectedSecret = process.env.CRON_SECRET || 'super_chaos_secret_99';
  const authHeader = req.headers.authorization;
  const secretParam = req.query.secret;

  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const witaTime = new Date(utcTime + (3600000 * 8)); 
  
  const currentHour = witaTime.getHours();
  const todayStr = witaTime.toISOString().split('T')[0];
  const totalMinutesLeft = Math.max(1, (23 - currentHour) * 60 + (60 - witaTime.getMinutes()));

  try {
    const globalStatus = await sql`SELECT value FROM mastodon_settings WHERE key = 'mastodon_automation_enabled'`;
    if (globalStatus[0]?.value === 'false') {
      return res.json({ success: true, status: 'Mastodon automation disabled globally.' });
    }

    const accounts = await sql`SELECT id, name FROM mastodon_accounts WHERE is_active = 1`;
    const executed = [];

    for (const acc of accounts) {
      const ranToday = await sql`
        SELECT COUNT(*) as count FROM mastodon_history
        WHERE account_id = ${acc.id} AND status IN ('success', 'pending') AND created_at::date = CURRENT_DATE
      `;
      const postsToday = parseInt(ranToday[0]?.count || 0, 10);

      const dailyLimit = acc.name.toLowerCase().includes('oneformind') ? 4 : 5;

      if (postsToday >= dailyLimit) {
        console.log(`[Mastodon-Cron] Acc ${acc.name}: hit ${dailyLimit}-post daily limit.`);
        continue;
      }

      let pending = await sql`
        SELECT * FROM mastodon_schedules
        WHERE account_id = ${acc.id}
          AND is_active = 1
          AND (last_run_date IS NULL OR last_run_date != ${todayStr})
      `;

      if (!pending.length) {
        pending = Array(5).fill({ id: null, custom_prompt: "" });
      }

      const postsRemaining = 5 - postsToday;
      const numToMake = Math.min(postsRemaining, pending.length);
      const chance = numToMake / totalMinutesLeft;
      const roll = Math.random();

      if (roll < chance) {
        const chosen = pending[Math.floor(Math.random() * pending.length)];
        let finalPrompt = chosen.custom_prompt;
        
        const isOneformind = acc.name.toLowerCase().includes('oneformind');
        let forceNoImage = isOneformind;

        if (!finalPrompt || finalPrompt.trim() === '') {
          if (isOneformind) {
            // OneForMind: always SaaS/productivity topics, NEVER affiliate
            const oneformindTopics = [
              "Share a powerful insight on deep work and achieving cognitive flow state for maximum productivity.",
              "Write about the most effective time-blocking strategies that high-performers use.",
              "Discuss how habit stacking can completely transform morning routines for ambitious people.",
              "Share actionable tips on overcoming digital distractions and staying in deep focus.",
              "Write about the psychology of productivity: why most people fail at being consistent.",
            ];
            finalPrompt = oneformindTopics[postsToday % oneformindTopics.length];
          } else if (postsToday === 0 || postsToday === 2) {
            finalPrompt = "Research and discuss a highly engaging, current viral trending topic. DO NOT include any affiliate links. Just pure value and engagement.";
            forceNoImage = true;
          } else if (postsToday === 1) {
            finalPrompt = "Enthusiastically recommend this tool: https://systeme.io/id?sa=sa0273997437b3abacdd34bc2577d7ca935ac6d6a5";
          } else if (postsToday === 3) {
            finalPrompt = "Enthusiastically recommend this tool: https://www.make.com/en/register?pc=airan";
          } else {
            finalPrompt = "Enthusiastically recommend this tool: https://wise.com/invite/dic/khairannoorf";
          }
        }

        try {
          // --- SPAM PREVENTION LOCK ---
          const pendingInsert = await sql`
            INSERT INTO mastodon_history (account_id, status) VALUES (${acc.id}, 'pending') RETURNING id
          `;
          const historyId = pendingInsert[0].id;

          const result = await runMastodonPost(acc.id, finalPrompt, forceNoImage);
          
          if (chosen.id) {
            await sql`UPDATE mastodon_schedules SET last_run_date = ${todayStr} WHERE id = ${chosen.id}`;
          }
          
          // --- UPDATE LOCK TO SUCCESS ---
          await sql`
            UPDATE mastodon_history SET status = 'success', post_id = ${String(result.publishId)} WHERE id = ${historyId}
          `;

          executed.push({ account: acc.name, scheduleId: chosen.id, ...result });
        } catch (postErr) {
          console.error(`[Mastodon-Cron] Post failed for ${acc.name}:`, postErr.message);
          await sql`
            INSERT INTO mastodon_history (account_id, caption, status, error_message)
            VALUES (${acc.id}, ${chosen.custom_prompt || 'Auto post'}, 'failed', ${postErr.message || String(postErr)})
          `;
        }
      }
    }

    res.json({ success: true, executed });
  } catch (e) {
    console.error('[Mastodon-Cron] Error:', e.message);
    res.status(200).json({ success: false, error: e.message });
  }
});

export default app;
