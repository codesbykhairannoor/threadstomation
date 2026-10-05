import { initDb } from '../lib/database.js';
import { runTumblrCron } from '../api/tumblr.mjs';

async function main() {
    console.log('[Tumblr-Cron-Runner] 🎨 Starting Dedicated Tumblr Automation Cron...');
    
    const isForce = process.argv.includes('--force');
    let hasErrors = false;

    try {
        console.log('[Tumblr-Cron-Runner] 📦 Initializing database connection...');
        await initDb();
        console.log('[Tumblr-Cron-Runner] ✅ Database connected!');

        console.log('\n=========================================');
        console.log(`🎨 EXECUTING TUMBLR AUTOMATION (Force: ${isForce})`);
        console.log('=========================================');

        const result = await runTumblrCron(isForce);
        console.log('[Tumblr-Cron-Runner] 📊 Result:', JSON.stringify(result, null, 2));

    } catch (fatalErr) {
        console.error('[Tumblr-Cron-Runner] ❌ FATAL ERROR:', fatalErr);
        hasErrors = true;
    }

    if (hasErrors) {
        console.error('\n[Tumblr-Cron-Runner] ⚠️ Tumblr Cron completed with errors.');
        process.exit(1);
    } else {
        console.log('\n[Tumblr-Cron-Runner] ✅ Tumblr Cron finished successfully!');
        process.exit(0);
    }
}

main();
