import sql from './lib/database.js';
import axios from 'axios';
import { exchangeShortLivedToken } from './lib/threads.js';

async function registerAndExchange(token, name) {
    try {
        console.log(`\n🔍 Memproses Akun: ${name}...`);
        
        // Fetch User ID from Meta
        const res = await axios.get(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${token}`);
        const { id: threads_id, username } = res.data;
        
        // 1. Insert/Update Account
        const [account] = await sql`
            INSERT INTO accounts (name, threads_user_id)
            VALUES (${name || username}, ${threads_id})
            ON CONFLICT (threads_user_id) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        `;
        
        console.log(`✅ Akun ${username} terdaftar dengan ID Akun: ${account.id}`);

        // 2. Exchange to Long-Lived
        console.log(`🔄 Menukarkan token ke 60 hari untuk ${username}...`);
        const longToken = await exchangeShortLivedToken(token);
        
        // 3. Save/Update Token in DB
        // Check if token for this account already exists
        const existingToken = await sql`SELECT id FROM tokens WHERE account_id = ${account.id}`;
        
        if (existingToken.length > 0) {
            await sql`
              UPDATE tokens 
              SET access_token = ${longToken}, updated_at = CURRENT_TIMESTAMP 
              WHERE account_id = ${account.id}
            `;
        } else {
            await sql`
              INSERT INTO tokens (access_token, account_id) 
              VALUES (${longToken}, ${account.id})
            `;
        }

        console.log(`🎉 SUKSES! Akun ${username} (ID: ${account.id}) siap tempur.`);
    } catch (e) {
        console.error(`❌ Gagal proses akun ${name}:`, e.message);
    }
}

async function main() {
    // Akun 2 (Jasa Web) - Yang tadi gagal
    const acc2Token = 'THAAedHhZAY9O9BYmIwQWp6OGViSlNIZAGZApckh4bkJHUk1uLThtaGRCdE9JMDBYQllqMEttYV9XdTRUNG9XXzJKQjdVdTVXQ25rN3FJenAxV181Um1GQzZArOTJoUnBtY2J6N052NllDTGM2cHEwcXNXajNyZAmRiSm1rb1FjN2NuN3dxM0w5TVZAENk50RGRraXN2WU5XN1ZAHdmEydlpGalp1WGZAwT2sZD';
    await registerAndExchange(acc2Token, 'Jasa Web');
    
    process.exit(0);
}

main();
