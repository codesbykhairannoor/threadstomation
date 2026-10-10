import { initDb } from '../lib/database.js';
import { runMoltbookCron } from '../api/moltbook.mjs';

async function main() {
    console.log('[Moltbook-Cron-Runner] 🦞 Starting Dedicated Moltbook Automation Cron...');
    
    const isForce = process.argv.includes('--force');
    let hasErrors = false;

    try {
        console.log('[Moltbook-Cron-Runner] 📦 Initializing database connection...');
        await initDb();
        console.log('[Moltbook-Cron-Runner] ✅ Database connected!');

        console.log('\n=========================================');
        console.log(`🦞 EXECUTING MOLTBOOK AUTOMATION (Force: ${isForce})`);
        console.log('=========================================');

        const result = await runMoltbookCron(isForce);
        console.log('[Moltbook-Cron-Runner] 📊 Result:', JSON.stringify(result, null, 2));

    } catch (fatalErr) {
        console.error('[Moltbook-Cron-Runner] ❌ FATAL ERROR:', fatalErr);
        hasErrors = true;
    }

    if (hasErrors) {
        console.error('\n[Moltbook-Cron-Runner] ⚠️ Moltbook Cron completed with errors.');
        process.exit(1);
    } else {
        console.log('\n[Moltbook-Cron-Runner] ✅ Moltbook Cron finished successfully!');
        process.exit(0);
    }
}

main();
