import { generateThreadsContent } from '../lib/gemini.js';
import { postToPlatforms } from '../lib/threads_service.js';
import sql from '../lib/database.js';

async function testThreadsReply() {
    console.log("=== Testing Threads Multi-Post ===");
    
    // Find Adhlil account ID
    const accounts = await sql`SELECT id FROM accounts WHERE name ILIKE '%adhlil%'`;
    if (accounts.length === 0) {
        throw new Error("Adhlil account not found!");
    }
    const accountId = accounts[0].id;
    console.log(`Using Account ID: ${accountId}`);

    const customPrompt = "Buat sebuah pemikiran (thread) yang mengingatkan kalau kita sering merasa punya banyak waktu di dunia untuk taubat atau berbuat baik, padahal kematian itu bisa datang kapan aja, jadi berhenti menunda.";
    
    console.log("1. Generating content from Gemini...");
    const content = await generateThreadsContent('threads', null, customPrompt, accountId);
    
    console.log("Generated Content (Array? " + Array.isArray(content) + "):");
    console.log(content);
    
    console.log("\n2. Posting to Threads...");
    const results = await postToPlatforms(content, ['threads'], null, accountId);
    
    console.log("\n3. Results:");
    console.log(JSON.stringify(results, null, 2));
    
    process.exit(0);
}

testThreadsReply().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
