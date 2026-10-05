import { initDb } from '../lib/database.js';
import { runDevtoCron } from '../api/devto.mjs';

async function main() {
    console.log('[Devto-Cron-Runner] 💻 Starting Dedicated DEV.TO Automation Cron...');
    
    const isForce = process.argv.includes('--force');
    let hasErrors = false;

    try {
        console.log('[Devto-Cron-Runner] 📦 Initializing database connection...');
        await initDb();
        console.log('[Devto-Cron-Runner] ✅ Database connected!');

        console.log('\n=========================================');
        console.log(`💻 EXECUTING DEV.TO AUTOMATION (Force: ${isForce})`);
        console.log('=========================================');

        const result = await runDevtoCron(isForce);
        console.log('[Devto-Cron-Runner] 📊 Result:', JSON.stringify(result, null, 2));

    } catch (fatalErr) {
        console.error('[Devto-Cron-Runner] ❌ FATAL ERROR:', fatalErr);
        hasErrors = true;
    }

    if (hasErrors) {
        console.error('\n[Devto-Cron-Runner] ⚠️ DEV.TO Cron completed with errors.');
        process.exit(1);
    } else {
        console.log('\n[Devto-Cron-Runner] ✅ DEV.TO Cron finished successfully!');
        process.exit(0);
    }
}

main();
