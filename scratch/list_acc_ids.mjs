import sql from '../lib/database.js';

async function main() {
    try {
        const res = await sql`SELECT id, name FROM accounts`;
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
main();
