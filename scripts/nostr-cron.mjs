import { initDb } from '../lib/database.js';
import { runNostrCron } from '../api/nostr.mjs';

async function main() {
    console.log('[Nostr-Cron-Runner] ⚡ Starting Dedicated Nostr Automation Cron...');
    
    const isForce = process.argv.includes('--force');
    let hasErrors = false;

    try {
        console.log('[Nostr-Cron-Runner] 📦 Initializing database connection...');
        await initDb();
        console.log('[Nostr-Cron-Runner] ✅ Database connected!');

        console.log('\n=========================================');
        console.log(`⚡ EXECUTING NOSTR AUTOMATION (Force: ${isForce})`);
        console.log('=========================================');

        const result = await runNostrCron(isForce);
        console.log('[Nostr-Cron-Runner] 📊 Result:', JSON.stringify(result, null, 2));

    } catch (fatalErr) {
        console.error('[Nostr-Cron-Runner] ❌ FATAL ERROR:', fatalErr);
        hasErrors = true;
    }

    if (hasErrors) {
        console.error('\n[Nostr-Cron-Runner] ⚠️ Nostr Cron completed with errors.');
        process.exit(1);
    } else {
        console.log('\n[Nostr-Cron-Runner] ✅ Nostr Cron finished successfully!');
        process.exit(0);
    }
}

main();
