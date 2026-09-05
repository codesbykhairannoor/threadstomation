import { initDb } from '../lib/database.js';
import { runThreadsCron } from '../api/index.mjs';
import { runInstagramCron } from '../api/instagram.mjs';
import { cleanupOldStorage } from '../lib/supabase_storage.js';

async function main() {
    console.log('[Master-Cron] 🚀 Starting Native GitHub Actions Cron for Threads & Instagram (Imagecuan Architecture)...');
    
    let hasErrors = false;

    try {
        console.log('[Master-Cron] 📦 Initializing database connection...');
        await initDb();
        console.log('[Master-Cron] ✅ Database connected!');

        // Run automated 24-hour storage cleanup to keep Supabase 100% free forever
        await cleanupOldStorage().catch(e => console.warn('[Master-Cron] Storage cleanup note:', e.message));

        console.log('\n=========================================');
        console.log('🤖📸 EXECUTING THREADS & INSTAGRAM CONCURRENTLY');
        console.log('=========================================');

        // Run both platforms at the exact same time. 
        // If one account/platform hangs, it will NOT block the other platform!
        const threadsJob = runThreadsCron(true).catch(err => {
            console.error('[Master-Cron] ❌ Failed during Threads automation:', err);
            hasErrors = true;
        });

        const igJob = runInstagramCron().catch(err => {
            console.error('[Master-Cron] ❌ Failed during Instagram automation:', err);
            hasErrors = true;
        });

        const results = await Promise.allSettled([threadsJob, igJob]);
        
        console.log('[Master-Cron] Threads Result:', results[0].value || results[0].reason);
        console.log('[Master-Cron] Instagram Result:', results[1].value || results[1].reason);

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
