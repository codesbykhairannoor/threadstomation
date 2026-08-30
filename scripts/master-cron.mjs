import { spawn } from 'child_process';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('[Master-Cron] 🚀 Starting integrated GitHub Actions Cron for Threads & Instagram...');

    // 1. Start the Express Server locally
    console.log('[Master-Cron] Booting local API server...');
    const serverProcess = spawn('node', [path.join(__dirname, '../api/index.mjs')], {
        stdio: 'pipe',
        env: { ...process.env, PORT: '3000' }
    });

    serverProcess.stdout.on('data', (data) => console.log(`[API-Log]: ${data.toString().trim()}`));
    serverProcess.stderr.on('data', (data) => console.error(`[API-Error]: ${data.toString().trim()}`));

    // Wait for the server to bind to port 3000 by polling
    console.log('[Master-Cron] Waiting for server to be ready...');
    let isReady = false;
    for (let i = 0; i < 120; i++) {
        try {
            await fetch('http://127.0.0.1:3000');
            isReady = true;
            break;
        } catch (e) {
            await sleep(1000);
        }
    }
    
    if (!isReady) {
        console.log('[Master-Cron] Server took too long to start, but proceeding anyway.');
    } else {
        console.log('[Master-Cron] Server is ready! Proceeding with triggers.');
    }

    const secret = process.env.CRON_SECRET || 'super_chaos_secret_99';
    let hasErrors = false;

    // 2. Trigger Threads
    try {
        console.log('\n=========================================');
        console.log('🤖 TRIGGERING THREADS AUTOMATION');
        console.log('=========================================');
        
        const threadsRes = await fetch(`http://127.0.0.1:3000/api/threads/cron?secret=${secret}`);
        const threadsData = await threadsRes.text();
        console.log(`[Master-Cron] Threads Response (${threadsRes.status}):`, threadsData);
        
        if (!threadsRes.ok) hasErrors = true;
    } catch (err) {
        console.error('[Master-Cron] Failed to trigger Threads:', err.message);
        hasErrors = true;
    }

    // 3. Trigger Instagram
    try {
        console.log('\n=========================================');
        console.log('📸 TRIGGERING INSTAGRAM AUTOMATION');
        console.log('=========================================');
        
        const igRes = await fetch(`http://127.0.0.1:3000/api/instagram/cron?secret=${secret}`);
        const igData = await igRes.text();
        console.log(`[Master-Cron] Instagram Response (${igRes.status}):`, igData);
        
        if (!igRes.ok) hasErrors = true;
    } catch (err) {
        console.error('[Master-Cron] Failed to trigger Instagram:', err.message);
        hasErrors = true;
    }

    // Give asynchronous background tasks inside Express (like the actual generation) some time to finish
    // Github Action has a 6-hour timeout, so it's safe to sleep for 2 minutes
    console.log('\n[Master-Cron] Triggers sent. Waiting 2 minutes for background tasks (Gemini/Image Generation) to complete before shutting down...');
    await sleep(120000); 

    // 4. Shutdown gracefully
    console.log('[Master-Cron] Shutting down local server...');
    serverProcess.kill('SIGINT');

    if (hasErrors) {
        console.error('[Master-Cron] ⚠️ Cron completed with some API errors.');
        process.exit(1);
    } else {
        console.log('[Master-Cron] ✅ Integrated Cron finished successfully!');
        process.exit(0);
    }
}

main();
