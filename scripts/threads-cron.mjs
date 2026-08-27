import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import sql, { initDb } from '../lib/database.js';
import { generateThreadsContent } from '../lib/gemini.js';
import { postToPlatforms } from '../lib/threads_service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runScheduledTask(schedule) {
    const accountId = schedule.account_id;
    
    // We fetch account type but it's not actually used for anything in the original logic right here
    const account = await sql`SELECT account_type FROM accounts WHERE id = ${accountId}`.then(r => r[0]);

    const customPrompt = schedule.custom_prompt || null;
    const imageUrl = schedule.image_url || null;
    let imageBase64 = null;

    if (imageUrl) {
        try {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 5000 });
            imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
        } catch (e) { 
            console.warn('[Task] Image fetch failed:', e.message); 
        }
    }
        
    console.log(`[Threads-Cron] Generating content for account ID: ${accountId}...`);
    const content = await generateThreadsContent('threads', imageBase64 || imageUrl, customPrompt, accountId);
    
    if (content) {
        console.log(`[Threads-Cron] Content generated. Posting to platform...`);
        const result = await postToPlatforms(content, ['threads'], imageUrl, accountId);
        console.log(`[Threads-Cron] Post result:`, result);
    } else {
        console.warn(`[Threads-Cron] Failed to generate content for account ID: ${accountId}`);
    }
}

async function main() {
    console.log('[Threads-Cron] Starting GitHub Actions Cron...');
    
    // Initialize DB
    await initDb();

    // Robust WITA (UTC+8) Time Calculation
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const witaTime = new Date(utcTime + (3600000 * 8)); 
    
    const todayStr = witaTime.toISOString().split('T')[0];
    const currentHour = witaTime.getHours();
    const totalMinutesLeft = Math.max(1, (23 - currentHour) * 60 + (60 - witaTime.getMinutes()));

    try {
        const globalStatus = await sql`SELECT value FROM settings WHERE key = 'automation_enabled'`.catch(() => [{value: 'true'}]);
        if (globalStatus[0]?.value === 'false') {
            console.log('[Threads-Cron] Automation disabled globally.');
            process.exit(0);
        }

        const accounts = await sql`SELECT id, name FROM accounts WHERE is_active = 1`;
        
        let executedCount = 0;

        for (const acc of accounts) {
            try {
                const nName = acc.name ? acc.name.toLowerCase() : '';
                const isSpecial = nName.includes('adhlil') || nName.includes('caridisini');
                const dailyLimit = isSpecial ? 4 : 2;

                const [ranToday] = await sql`SELECT COUNT(*) as count FROM schedules WHERE account_id = ${acc.id} AND last_run_date = ${todayStr}`;
                const postsToday = parseInt(ranToday?.count || 0);
                
                if (postsToday >= dailyLimit) {
                    console.log(`[Threads-Cron] Account ${acc.name} hit daily limit (${postsToday}/${dailyLimit}).`);
                    continue;
                }

                const pending = await sql`
                    SELECT * FROM schedules 
                    WHERE account_id = ${acc.id} AND is_active = 1 AND (last_run_date IS NULL OR last_run_date != ${todayStr})
                `;
                
                if (!pending.length) {
                    console.log(`[Threads-Cron] Account ${acc.name} has no pending schedules for today.`);
                    continue;
                }

                const chance = ((dailyLimit - postsToday) / totalMinutesLeft) * 3;
                const roll = Math.random();
                
                console.log(`[Threads-Cron] ${acc.name} chance: ${chance.toFixed(4)}, roll: ${roll.toFixed(4)}`);

                if (roll < chance) {
                    const sch = pending[Math.floor(Math.random() * pending.length)];
                    await sql`UPDATE schedules SET last_run_date = ${todayStr} WHERE id = ${sch.id}`;
                    
                    try {
                        await runScheduledTask(sch);
                        executedCount++;
                    } catch (taskErr) {
                        console.error(`[Threads-Cron] Error running task for ${acc.name}:`, taskErr.message);
                    }
                } else {
                    console.log(`[Threads-Cron] ${acc.name} skipped this round.`);
                }
            } catch (accErr) { 
                console.error(`[Threads-Cron] Error processing account ${acc.name}:`, accErr.message); 
            }
        }
        
        console.log(`[Threads-Cron] Finished successfully. Executed ${executedCount} tasks.`);
        process.exit(0);
    } catch (e) {
        console.error('[Threads-Cron] Critical error:', e.message);
        process.exit(1);
    }
}

main();
