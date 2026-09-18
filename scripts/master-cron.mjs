import { initDb } from '../lib/database.js';
import { runThreadsCron } from '../api/index.mjs';
import { runInstagramCron } from '../api/instagram.mjs';
import { cleanupOldStorage } from '../lib/supabase_storage.js';
import { runCommentReplier } from '../lib/comment_replier.js';

async function main() {
    console.log('[Master-Cron] 🚀 Starting Native GitHub Actions Cron for Threads & Instagram (Imagecuan Architecture)...');
    
    let hasErrors = false;

    try {
        console.log('[Master-Cron] 📦 Initializing database connection...');
        await initDb();
        console.log('[Master-Cron] ✅ Database connected!');

        // Run automated storage cleanup to keep Supabase 100% free forever
        await cleanupOldStorage().catch(e => console.warn('[Master-Cron] Storage cleanup note:', e.message));

        console.log('\n=========================================');
        console.log('🤖📸 EXECUTING THREADS, INSTAGRAM & AI ENGAGEMENT REPLIER');
        console.log('=========================================');

        // Run platforms and engagement agent concurrently. 
        // If one account/platform hangs, it will NOT block the others!
        const threadsJob = runThreadsCron(true).catch(err => {
            console.error('[Master-Cron] ❌ Failed during Threads automation:', err);
            hasErrors = true;
        });

        const igJob = runInstagramCron().catch(err => {
            console.error('[Master-Cron] ❌ Failed during Instagram automation:', err);
            hasErrors = true;
        });

        const replierJob = runCommentReplier().catch(err => {
            console.warn('[Master-Cron] ⚠️ Comment replier note:', err.message);
        });

        const results = await Promise.allSettled([threadsJob, igJob, replierJob]);
        
        console.log('[Master-Cron] Threads Result:', results[0].value || results[0].reason);
        console.log('[Master-Cron] Instagram Result:', results[1].value || results[1].reason);
        console.log('[Master-Cron] Engagement Replier Result:', results[2].value || results[2].reason);

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
