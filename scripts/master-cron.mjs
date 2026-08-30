import { initDb } from '../lib/database.js';
import { runThreadsCron } from '../api/index.mjs';
import { runInstagramCron } from '../api/instagram.mjs';

async function main() {
    console.log('[Master-Cron] 🚀 Starting Native GitHub Actions Cron for Threads & Instagram (Imagecuan Architecture)...');
    
    let hasErrors = false;

    try {
        console.log('[Master-Cron] 📦 Initializing database connection...');
        await initDb();
        console.log('[Master-Cron] ✅ Database connected!');

        console.log('\n=========================================');
        console.log('🤖 EXECUTING THREADS AUTOMATION');
        console.log('=========================================');
        try {
            // true parameter means "await all background tasks"
            const threadsResult = await runThreadsCron(true);
            console.log('[Master-Cron] Threads Result:', JSON.stringify(threadsResult, null, 2));
        } catch (err) {
            console.error('[Master-Cron] ❌ Failed during Threads automation:', err);
            hasErrors = true;
        }

        console.log('\n=========================================');
        console.log('📸 EXECUTING INSTAGRAM AUTOMATION');
        console.log('=========================================');
        try {
            const igResult = await runInstagramCron();
            console.log('[Master-Cron] Instagram Result:', JSON.stringify(igResult, null, 2));
        } catch (err) {
            console.error('[Master-Cron] ❌ Failed during Instagram automation:', err);
            hasErrors = true;
        }

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
