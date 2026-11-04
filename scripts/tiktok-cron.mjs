import { initDb } from '../lib/database.js';
import { runTikTokCron } from '../api/tiktok.mjs';

async function main() {
    console.log('[TikTok-Cron-Runner] 🎵 Starting Dedicated TikTok Automation Cron...');
    
    const isForce = process.argv.includes('--force');
    const accountArgIdx = process.argv.indexOf('--account');
    const targetAccount = accountArgIdx !== -1 && process.argv[accountArgIdx + 1] ? process.argv[accountArgIdx + 1] : null;
    let hasErrors = false;

    try {
        console.log('[TikTok-Cron-Runner] 📦 Initializing database connection...');
        await initDb();
        console.log('[TikTok-Cron-Runner] ✅ Database connected!');

        console.log('\n=========================================');
        console.log(`🎵 EXECUTING TIKTOK AUTOMATION (Force: ${isForce}, Account: ${targetAccount || 'all'})`);
        console.log('=========================================');

        const result = await runTikTokCron(isForce, 'https://threadstomation.vercel.app', targetAccount);
        console.log('[TikTok-Cron-Runner] 📊 Result:', JSON.stringify(result, null, 2));

    } catch (fatalErr) {
        console.error('[TikTok-Cron-Runner] ❌ FATAL ERROR:', fatalErr);
        hasErrors = true;
    }

    if (hasErrors) {
        console.error('\n[TikTok-Cron-Runner] ⚠️ TikTok Cron completed with errors.');
        process.exit(1);
    } else {
        console.log('\n[TikTok-Cron-Runner] ✅ TikTok Cron finished successfully!');
        process.exit(0);
    }
}

main();

