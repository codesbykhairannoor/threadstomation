import sql from '../lib/database.js';
async function run() {
  const token = 'EAAc7tb0KPdkBRvJ7xJLEilpiRZAPoc1ZAKaZAIJnNioHREQGSBLw6RBhZCWLJZC7g2gBcoENANBslZAqcuw7tc6Ey7qZCKW8yqJAayoX0ngH9tqJYMkz90JQql8GjXjLxn9t9Jflo7Q82PA2QbdEol7ZCt0JSOPzKB5z2CfzUhT6bCB0DAMirasPSrfSVWWOzHZBteGV1pg7w3zfyHKvZCCg6JLW8vI6YAS1VCtZAFfEOjPtW6HF98sdiOVO7QHRZCCo24EYOUXuoh12aoqluli9GD2gYpTy';
  
  await sql`UPDATE instagram_accounts SET facebook_page_id = '1044012238797561', access_token = ${token}, crosspost_to_facebook = 1 WHERE id = 2`;
  console.log("Updated Oneformind (ID 2)");

  await sql`UPDATE instagram_accounts SET facebook_page_id = '339530095918629', access_token = ${token}, crosspost_to_facebook = 1 WHERE id = 3`;
  console.log("Updated Sharesa Space (ID 3)");

  process.exit(0);
}
run();
