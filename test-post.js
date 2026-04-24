import { generateThreadsContent } from './lib/gemini.js';
import { postToPlatforms } from './lib/threads_service.js';

async function testPost() {
  try {
    console.log('Generating content...');
    const content = await generateThreadsContent();
    console.log('Content generated:', content);
    console.log('Posting to platforms...');
    const results = await postToPlatforms(content, ['threads']);
    console.log('Post results:', results);
  } catch (e) {
    console.error('Error testing post:', e.message);
  } finally {
    process.exit(0);
  }
}
testPost();
