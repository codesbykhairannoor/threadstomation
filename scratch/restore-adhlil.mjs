import sql from '../lib/database.js';
async function run() {
  const token = 'IGAAYZCHxheA5VBZAGJndUhxeWJPRXdwTzNyUUpIRTRfcEVVOEJPVVdyeFp5UzFhRHVvWXk5M3I0bjhiSjVDa1FFTkFLS1h1NDA3ZATd6bF85TEhyNlVYZA0JLZAFVZAWkxUNnY0aXBNRzRjZAElsMFRtOXZAUaS1FS1IwdHRQWTRpV2tJdwZDZD';
  await sql`INSERT INTO instagram_accounts (id, name, instagram_business_id, access_token, is_active, crosspost_to_facebook) VALUES (1, 'Adhlil (adhlil.co)', '26237714875903984', ${token}, 1, 0) ON CONFLICT (id) DO UPDATE SET is_active=1, access_token=${token}`;
  console.log("Adhlil Restored!");
  process.exit(0);
}
run();
