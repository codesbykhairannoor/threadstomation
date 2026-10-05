import { initDb } from '../lib/database.js';
import { runBlueskyCron } from '../api/bluesky.mjs';

async function main() {
    console.log('[Bluesky-Cron-Runner] 🦋 Starting Dedicated Bluesky Automation Cron...');
    
    const isForce = process.argv.includes('--force');
    let hasErrors = false;

    try {
        console.log('[Bluesky-Cron-Runner] 📦 Initializing database connection...');
        await initDb();
        console.log('[Bluesky-Cron-Runner] ✅ Database connected!');

        console.log('\n=========================================');
        console.log(`🦋 EXECUTING BLUESKY AUTOMATION (Force: ${isForce})`);
        console.log('=========================================');

        const result = await runBlueskyCron(isForce);
        console.log('[Bluesky-Cron-Runner] 📊 Result:', JSON.stringify(result, null, 2));

    } catch (fatalErr) {
        console.error('[Bluesky-Cron-Runner] ❌ FATAL ERROR:', fatalErr);
        hasErrors = true;
    }

    if (hasErrors) {
        console.error('\n[Bluesky-Cron-Runner] ⚠️ Bluesky Cron completed with errors.');
        process.exit(1);
    } else {
        console.log('\n[Bluesky-Cron-Runner] ✅ Bluesky Cron finished successfully!');
        process.exit(0);
    }
}

main();
