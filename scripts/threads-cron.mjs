import { initDb } from '../lib/database.js';
import { runThreadsCron } from '../api/index.mjs';

async function main() {
    console.log('[Threads-Cron-Runner] 🧵 Starting Dedicated Threads Automation Cron...');
    
    const isForce = process.argv.includes('--force');
    const accountArgIdx = process.argv.indexOf('--account');
    const targetAccount = accountArgIdx !== -1 && process.argv[accountArgIdx + 1] ? process.argv[accountArgIdx + 1] : null;
    let hasErrors = false;

    try {
        console.log('[Threads-Cron-Runner] 📦 Initializing database connection...');
        await initDb();
        console.log('[Threads-Cron-Runner] ✅ Database connected!');

        console.log('\n=========================================');
        console.log(`🧵 EXECUTING THREADS AUTOMATION (Force: ${isForce}, Account: ${targetAccount || 'all'})`);
        console.log('=========================================');

        const result = await runThreadsCron(true, isForce, targetAccount);
        console.log('[Threads-Cron-Runner] 📊 Result:', JSON.stringify(result, null, 2));

    } catch (fatalErr) {
        console.error('[Threads-Cron-Runner] ❌ FATAL ERROR:', fatalErr);
        hasErrors = true;
    }

    if (hasErrors) {
        console.error('\n[Threads-Cron-Runner] ⚠️ Threads Cron completed with errors.');
        process.exit(1);
    } else {
        console.log('\n[Threads-Cron-Runner] ✅ Threads Cron finished successfully!');
        process.exit(0);
    }
}

main();

