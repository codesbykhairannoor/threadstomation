import { initDb } from '../lib/database.js';
import { runFacebookCron } from '../api/facebook.mjs';

async function main() {
    console.log('[Facebook-Cron-Runner] 📘 Starting Dedicated Facebook Automation Cron...');
    
    const isForce = process.argv.includes('--force');
    const accountArgIdx = process.argv.indexOf('--account');
    const targetAccount = accountArgIdx !== -1 && process.argv[accountArgIdx + 1] ? process.argv[accountArgIdx + 1] : null;
    let hasErrors = false;

    try {
        console.log('[Facebook-Cron-Runner] 📦 Initializing database connection...');
        await initDb();
        console.log('[Facebook-Cron-Runner] ✅ Database connected!');

        console.log('\n=========================================');
        console.log(`📘 EXECUTING FACEBOOK AUTOMATION (Force: ${isForce}, Account: ${targetAccount || 'all'})`);
        console.log('=========================================');

        const result = await runFacebookCron(isForce, targetAccount);
        console.log('[Facebook-Cron-Runner] 📊 Result:', JSON.stringify(result, null, 2));

    } catch (fatalErr) {
        console.error('[Facebook-Cron-Runner] ❌ FATAL ERROR:', fatalErr);
        hasErrors = true;
    }

    if (hasErrors) {
        console.error('\n[Facebook-Cron-Runner] ⚠️ Facebook Cron completed with errors.');
        process.exit(1);
    } else {
        console.log('\n[Facebook-Cron-Runner] ✅ Facebook Cron finished successfully!');
        process.exit(0);
    }
}

main();

