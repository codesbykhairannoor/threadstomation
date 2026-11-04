import { initDb } from '../lib/database.js';
import { runInstagramCron } from '../api/instagram.mjs';
import { cleanupOldStorage } from '../lib/supabase_storage.js';

async function main() {
    console.log('[Instagram-Cron-Runner] 📸 Starting Dedicated Instagram Reels Automation Cron...');
    
    const isForce = process.argv.includes('--force');
    const accountArgIdx = process.argv.indexOf('--account');
    const targetAccount = accountArgIdx !== -1 && process.argv[accountArgIdx + 1] ? process.argv[accountArgIdx + 1] : null;
    let hasErrors = false;

    try {
        console.log('[Instagram-Cron-Runner] 📦 Initializing database connection...');
        await initDb();
        console.log('[Instagram-Cron-Runner] ✅ Database connected!');

        // Run automated Supabase storage cleanup
        await cleanupOldStorage().catch(e => console.warn('[Instagram-Cron-Runner] Storage cleanup note:', e.message));

        console.log('\n=========================================');
        console.log(`📸 EXECUTING INSTAGRAM AUTOMATION (Force: ${isForce}, Account: ${targetAccount || 'all'})`);
        console.log('=========================================');

        const result = await runInstagramCron(isForce, targetAccount);
        console.log('[Instagram-Cron-Runner] 📊 Result:', JSON.stringify(result, null, 2));

    } catch (fatalErr) {
        console.error('[Instagram-Cron-Runner] ❌ FATAL ERROR:', fatalErr);
        hasErrors = true;
    }

    if (hasErrors) {
        console.error('\n[Instagram-Cron-Runner] ⚠️ Instagram Cron completed with errors.');
        process.exit(1);
    } else {
        console.log('\n[Instagram-Cron-Runner] ✅ Instagram Cron finished successfully!');
        process.exit(0);
    }
}

main();
