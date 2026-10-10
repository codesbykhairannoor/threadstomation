import { initDb } from '../lib/database.js';
import { runThreadsCron } from '../api/index.mjs';
import { runInstagramCron } from '../api/instagram.mjs';
import { runBlueskyCron } from '../api/bluesky.mjs';
import { runTumblrCron } from '../api/tumblr.mjs';
import { runDevtoCron } from '../api/devto.mjs';
import { runMastodonCron } from '../api/mastodon.mjs';
import { runNostrCron } from '../api/nostr.mjs';
import { cleanupOldStorage } from '../lib/supabase_storage.js';
import { runCommentReplier } from '../lib/comment_replier.js';
import { runEngagementSeeder } from '../lib/engagement_seeder.js';
import { humanJitter } from '../lib/stealth_reach_engine.js';

async function main() {
    console.log('[Master-Cron] 🚀 Starting Comprehensive Master Automation Cron across all platforms...');
    
    let hasErrors = false;

    try {
        console.log('[Master-Cron] 📦 Initializing database connection...');
        await initDb();
        console.log('[Master-Cron] ✅ Database connected!');

        // Introduce human jitter to break machine-clockwork predictability (Poisson cadence)
        await humanJitter(2000, 8000);

        // Run automated storage cleanup to keep Supabase 100% free forever
        await cleanupOldStorage().catch(e => console.warn('[Master-Cron] Storage cleanup note:', e.message));


        console.log('\n===============================================================');
        console.log('🤖📱 EXECUTING THREADS, IG, BLUESKY, TUMBLR, DEV.TO & MASTODON');
        console.log('===============================================================');

        // Run platforms in staggered succession with non-overlapping execution gaps.
        // Each platform has its own cooldown guard and dedicated hour window.
        // If one account/platform has an error or is in cooldown, it will NOT block the others!
        const delay = ms => new Promise(r => setTimeout(r, ms));

        const threadsJob = runThreadsCron(true, false).catch(err => {
            console.error('[Master-Cron] ❌ Failed during Threads automation:', err);
        });

        await delay(2500);
        const igJob = runInstagramCron().catch(err => {
            console.error('[Master-Cron] ❌ Failed during Instagram automation:', err);
        });

        await delay(2500);
        const blueskyJob = runBlueskyCron(false).catch(err => {
            console.error('[Master-Cron] ❌ Failed during Bluesky automation:', err);
        });

        await delay(2500);
        const tumblrJob = runTumblrCron(false).catch(err => {
            console.error('[Master-Cron] ❌ Failed during Tumblr automation:', err);
        });

        await delay(2500);
        const devtoJob = runDevtoCron(false).catch(err => {
            console.error('[Master-Cron] ❌ Failed during Dev.to automation:', err);
        });

        await delay(2500);
        const mastodonJob = runMastodonCron(false).catch(err => {
            console.error('[Master-Cron] ❌ Failed during Mastodon automation:', err);
        });

        await delay(2500);
        const nostrJob = runNostrCron(false).catch(err => {
            console.error('[Master-Cron] ❌ Failed during Nostr automation:', err);
        });

        const replierJob = runCommentReplier().catch(err => {
            console.warn('[Master-Cron] ⚠️ Comment replier note:', err.message);
        });

        const seederJob = runEngagementSeeder().catch(err => {
            console.warn('[Master-Cron] ⚠️ Engagement seeder note:', err.message);
        });

        const results = await Promise.allSettled([
            threadsJob,
            igJob,
            blueskyJob,
            tumblrJob,
            devtoJob,
            mastodonJob,
            nostrJob,
            replierJob,
            seederJob
        ]);
        
        console.log('[Master-Cron] Threads Result:', results[0].value || results[0].reason);
        console.log('[Master-Cron] Instagram Result:', results[1].value || results[1].reason);
        console.log('[Master-Cron] Bluesky Result:', results[2].value || results[2].reason);
        console.log('[Master-Cron] Tumblr Result:', results[3].value || results[3].reason);
        console.log('[Master-Cron] Dev.to Result:', results[4].value || results[4].reason);
        console.log('[Master-Cron] Mastodon Result:', results[5].value || results[5].reason);
        console.log('[Master-Cron] Nostr Result:', results[6].value || results[6].reason);
        console.log('[Master-Cron] Engagement Replier Result:', results[7].value || results[7].reason);
        console.log('[Master-Cron] Engagement Seeder Result:', results[8].value || results[8].reason);

    } catch (fatalErr) {
        console.error('[Master-Cron] ❌ FATAL ERROR:', fatalErr);
        hasErrors = true;
    }

    if (hasErrors) {
        console.error('\n[Master-Cron] ⚠️ Cron completed with some errors.');
        process.exit(1);
    } else {
        console.log('\n[Master-Cron] ✅ Native Cron finished successfully!');
        process.exit(0);
    }
}

main();
