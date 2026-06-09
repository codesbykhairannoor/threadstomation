import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function checkColumns() {
  try {
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'facebook_accounts'
    `;
    console.log('Columns in facebook_accounts:', columns.map(c => c.column_name));

    // Check if facebook_settings exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables in public schema:', tables.map(t => t.table_name));

  } catch (e) {
    console.error('Error checking DB:', e.message);
  } finally {
    process.exit();
  }
}

checkColumns();
