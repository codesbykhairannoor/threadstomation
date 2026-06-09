import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.CRON_SECRET || 'super_chaos_secret_99';
const URL = 'http://localhost:3000/api/cron?secret=' + SECRET;

async function test() {
    try {
        console.log('Triggering cron:', URL);
        const res = await axios.get(URL);
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('Error:', e.response?.status, e.response?.data || e.message);
    }
}

test();
