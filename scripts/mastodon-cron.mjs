import { initDb } from '../lib/database.js';
import { runMastodonCron } from '../api/mastodon.mjs';

async function main() {
    console.log('[Mastodon-Cron-Runner] 🐘 Starting Dedicated Mastodon Automation Cron...');
    
    const isForce = process.argv.includes('--force');
    let hasErrors = false;

    try {
        console.log('[Mastodon-Cron-Runner] 📦 Initializing database connection...');
        await initDb();
        console.log('[Mastodon-Cron-Runner] ✅ Database connected!');

        console.log('\n=========================================');
        console.log(`🐘 EXECUTING MASTODON AUTOMATION (Force: ${isForce})`);
        console.log('=========================================');

        const result = await runMastodonCron(isForce);
        console.log('[Mastodon-Cron-Runner] 📊 Result:', JSON.stringify(result, null, 2));

    } catch (fatalErr) {
        console.error('[Mastodon-Cron-Runner] ❌ FATAL ERROR:', fatalErr);
        hasErrors = true;
    }

    if (hasErrors) {
        console.error('\n[Mastodon-Cron-Runner] ⚠️ Mastodon Cron completed with errors.');
        process.exit(1);
    } else {
        console.log('\n[Mastodon-Cron-Runner] ✅ Mastodon Cron finished successfully!');
        process.exit(0);
    }
}

main();
