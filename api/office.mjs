export const maxDuration = 60;
import express from 'express';
import cors from 'cors';
import sql, { initDb } from '../lib/database.js';
import { getDailyDynamicTargetSlot } from '../lib/stealth_reach_engine.js';

const app = express();
app.use(cors());
app.use(express.json());

// Init DB middleware
app.use(async (req, res, next) => {
  try { await initDb(); next(); } catch (e) { next(); }
});

function getWitaDateInfo() {
  const now = new Date();
  const witaTime = new Date(now.getTime() + 8 * 3600 * 1000);
  const witaMidnight = new Date(witaTime);
  witaMidnight.setUTCHours(0, 0, 0, 0);
  const todayIso = new Date(witaMidnight.getTime() - 8 * 3600 * 1000).toISOString();
  const todayDateStr = witaTime.toISOString().slice(0, 10);
  const currentHour = witaTime.getUTCHours();
  const currentMinute = witaTime.getUTCMinutes();
  return { todayIso, todayDateStr, currentHour, currentMinute };
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Belum ada post';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin}m lalu`;
  if (diffHour < 24) return `${diffHour}j lalu`;
  return `${diffDay}h lalu`;
}

function getRoleTitle(platform, name) {
  const n = (name || '').toLowerCase();
  if (n.includes('tranvas')) return 'Tranvas Life OS Advocate';
  if (n.includes('sharesa')) return 'Sharesa Space Creative AI';
  if (n.includes('caridisini')) return 'Affiliate Commerce Agent';
  if (platform === 'nostr') return 'Sovereign Relay Broadcaster';
  if (platform === 'devto') return 'Markdown Tech Writer';
  if (platform === 'instagram') return 'Visual Carousel Studio';
  if (platform === 'bluesky') return 'AT-Proto Social Streamer';
  if (platform === 'tumblr') return 'Aesthetic Microblogger';
  return 'AI Social Content Specialist';
}

function getAvatarForWorker(platform, idx) {
  const avatars = ['coder_cat', 'cyber_agent', 'retro_bot', 'pixel_manager', 'hacker_dude', 'creative_designer'];
  return avatars[(platform.charCodeAt(0) + idx) % avatars.length];
}

// ── GET OFFICE STATUS ─────────────────────────────────────────────────────────

app.get('/api/office/status', async (req, res) => {
  try {
    const { todayIso, todayDateStr, currentHour, currentMinute } = getWitaDateInfo();

    const [
      threadsAccs, threadsHistory, threadsSchedules,
      igAccs, igHistory, igSchedules,
      bskyAccs, bskyHistory, bskySchedules,
      nostrAccs, nostrHistory, nostrSchedules,
      devtoAccs, devtoHistory, devtoSchedules,
      tumblrAccs, tumblrHistory, tumblrSchedules
    ] = await Promise.all([
      sql`SELECT id, name, is_active FROM accounts ORDER BY id ASC`,
      sql`SELECT id, account_id, content as text, status, created_at, error_message, threads_id as external_id FROM post_history ORDER BY id DESC LIMIT 50`,
      sql`SELECT id, account_id, time, is_active, last_run_date FROM schedules`,

      sql`SELECT id, name, is_active FROM instagram_accounts ORDER BY id ASC`,
      sql`SELECT id, account_id, caption as text, status, created_at, error_message, creation_id as external_id, image_urls FROM instagram_history ORDER BY id DESC LIMIT 50`,
      sql`SELECT id, account_id, is_active, last_run_date FROM instagram_schedules`,

      sql`SELECT id, name, identifier, is_active FROM bluesky_accounts ORDER BY id ASC`,
      sql`SELECT id, account_id, caption as text, status, created_at, error_message, publish_id as external_id FROM bluesky_history ORDER BY id DESC LIMIT 50`,
      sql`SELECT id, account_id, is_active, last_run_date FROM bluesky_schedules`,

      sql`SELECT id, name, username, npub, is_active FROM nostr_accounts ORDER BY id ASC`,
      sql`SELECT id, account_id, content as text, status, created_at, error_message, note_id as external_id FROM nostr_history ORDER BY id DESC LIMIT 50`,
      sql`SELECT id, account_id, is_active, last_run_date FROM nostr_schedules`,

      sql`SELECT id, name, username, is_active FROM devto_accounts ORDER BY id ASC`,
      sql`SELECT id, account_id, caption as text, status, created_at, error_message, post_id as external_id FROM devto_history ORDER BY id DESC LIMIT 50`,
      sql`SELECT id, account_id, is_active, last_run_date FROM devto_schedules`,

      sql`SELECT id, name, blog_name, is_active FROM tumblr_accounts ORDER BY id ASC`,
      sql`SELECT id, account_id, caption as text, status, created_at, error_message, post_id as external_id FROM tumblr_history ORDER BY id DESC LIMIT 50`,
      sql`SELECT id, account_id, is_active, last_run_date FROM tumblr_schedules`,
    ]);

    const workers = [];
    const allRecentActivity = [];

    const processPlatform = (platform, platformName, platformIcon, accs, history, schedules, defaultLimit, zone) => {
      accs.forEach((acc, idx) => {
        const accHistory = history.filter(h => h.account_id === acc.id);
        const todayPosts = accHistory.filter(h => {
          const isSuccess = (h.status || '').toLowerCase() === 'success' || (h.status || '').toLowerCase() === 'published';
          return isSuccess && new Date(h.created_at) >= new Date(todayIso);
        });
        const lastPost = accHistory[0] || null;
        const todayCount = todayPosts.length;
        const dailyTarget = defaultLimit;

        // Slot calculation
        let slot1 = null;
        let slot2 = null;
        try {
          slot1 = getDailyDynamicTargetSlot(todayDateStr, String(acc.id), `${platform}-slot1`, 10, 0, 14, 0, currentHour, currentMinute);
          slot2 = getDailyDynamicTargetSlot(todayDateStr, String(acc.id), `${platform}-slot2`, 18, 0, 22, 0, currentHour, currentMinute);
        } catch (_) {}

        let nextSlotStr = '';
        if (todayCount >= dailyTarget) {
          nextSlotStr = 'Target Terpenuhi';
        } else if (todayCount === 0) {
          nextSlotStr = slot1 ? `Slot 1: ${slot1.formatted} WITA` : 'Siap Eksekusi';
        } else {
          nextSlotStr = slot2 ? `Slot 2: ${slot2.formatted} WITA` : 'Siap Eksekusi';
        }

        const lastPostAgeSec = lastPost ? (Date.now() - new Date(lastPost.created_at).getTime()) / 1000 : 999999;
        const hasError = lastPost && ((lastPost.status || '').toLowerCase().includes('fail') || (lastPost.status || '').toLowerCase().includes('err'));

        let status = 'WAITING';
        let speech = '';

        if (hasError && lastPostAgeSec < 3600 * 12) {
          status = 'ALERT';
          speech = `⚠️ Waduh, ada kendala: ${(lastPost.error_message || 'Gagal posting').slice(0, 42)}...`;
        } else if (lastPostAgeSec < 3600) {
          status = 'WORKING';
          speech = `🚀 Baru aja posting di ${platformName}! Konten udah live di timeline.`;
        } else if (todayCount >= dailyTarget) {
          status = 'RESTING';
          speech = `☕ Kuota hari ini (${todayCount}/${dailyTarget}) beres bos! Istirahat dulu.`;
        } else {
          status = 'WAITING';
          speech = `🕒 Standby di meja. Jadwal berikutnya: ${nextSlotStr}.`;
        }

        const worker = {
          id: `${platform}-${acc.id}`,
          platform,
          platformName,
          platformIcon,
          zone,
          accountId: acc.id,
          accountName: acc.name || acc.username || acc.blog_name || acc.identifier || `Akun #${acc.id}`,
          role: getRoleTitle(platform, acc.name || ''),
          avatar: getAvatarForWorker(platform, idx),
          status,
          todayCount,
          dailyTarget,
          nextSlot: nextSlotStr,
          speech,
          lastPost: lastPost ? {
            id: lastPost.id,
            text: (lastPost.text || '').slice(0, 320),
            status: lastPost.status,
            time: lastPost.created_at,
            relativeTime: timeAgo(lastPost.created_at),
            externalId: lastPost.external_id,
          } : null
        };

        workers.push(worker);

        // Feed entries
        accHistory.slice(0, 6).forEach(h => {
          allRecentActivity.push({
            id: `${platform}-${h.id}`,
            platform,
            platformName,
            platformIcon,
            accountName: worker.accountName,
            text: (h.text || '').slice(0, 240),
            status: h.status,
            time: h.created_at,
            relativeTime: timeAgo(h.created_at)
          });
        });
      });
    };

    processPlatform('threads', 'Threads', '🧵', threadsAccs, threadsHistory, threadsSchedules, 2, 'Meta Social Hub');
    processPlatform('instagram', 'Instagram', '📸', igAccs, igHistory, igSchedules, 2, 'Creative Visual Studio');
    processPlatform('bluesky', 'Bluesky', '🦋', bskyAccs, bskyHistory, bskySchedules, 2, 'AT Protocol Hub');
    processPlatform('nostr', 'Nostr', '⚡', nostrAccs, nostrHistory, nostrSchedules, 1, 'Decentralized Sovereign Node');
    processPlatform('devto', 'DEV.TO', '👩‍💻', devtoAccs, devtoHistory, devtoSchedules, 1, 'Developer Content Lab');
    processPlatform('tumblr', 'Tumblr', '📝', tumblrAccs, tumblrHistory, tumblrSchedules, 2, 'Microblogging Suite');

    allRecentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));

    const totalToday = workers.reduce((acc, w) => acc + w.todayCount, 0);
    const activeCount = workers.filter(w => w.todayCount > 0).length;
    const alertCount = workers.filter(w => w.status === 'ALERT').length;

    res.json({
      system: {
        totalWorkers: workers.length,
        totalToday,
        activeToday: activeCount,
        alertCount,
        currentWitaTime: `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')} WITA`,
        dateStr: todayDateStr,
        health: alertCount === 0 ? 'Optimal (100%)' : `${Math.round(((workers.length - alertCount) / workers.length) * 100)}% Operational`
      },
      workers,
      recentActivity: allRecentActivity.slice(0, 20)
    });
  } catch (e) {
    console.error('[Office-API]', e);
    res.status(500).json({ error: e.message });
  }
});

export default app;
