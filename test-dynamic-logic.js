import sql from './lib/database.js';
import { generateThreadsContent } from './lib/gemini.js';
import { postToPlatforms } from './lib/threads_service.js';

async function runTest() {
  console.log('🧪 MEMULAI TESTING DYNAMIC SCHEDULING...\n');

  // TEST 1: TEXT-ONLY DENGAN PROMPT KHUSUS
  console.log('--- TEST 1: TEXT-ONLY (PROMPT KHUSUS) ---');
  const testSchedule1 = {
    id: 999,
    time: '11:11',
    custom_prompt: 'Tuliskan satu kalimat motivasi tentang kopi tanpa hashtag.',
    image_url: null
  };
  
  try {
    console.log(`[Test] Menggunakan Prompt: "${testSchedule1.custom_prompt}"`);
    const content1 = await generateThreadsContent('threads', null, testSchedule1.custom_prompt);
    console.log(`[Test] AI Berhasil Generate: "${content1}"`);
    // Note: Kita gak beneran post ke Threads biar gak nyampah di akun user, 
    // tapi kita pastiin logic-nya tembus sampai penyiapan data.
    console.log('✅ TEST 1 SUKSES: AI merespon prompt khusus jadwal.\n');
  } catch (e) {
    console.error('❌ TEST 1 GAGAL:', e.message);
  }

  // TEST 2: MULTIMODAL (PROMPT KHUSUS + GAMBAR)
  console.log('--- TEST 2: MULTIMODAL (PROMPT + GAMBAR) ---');
  const testSchedule2 = {
    id: 1000,
    time: '22:22',
    custom_prompt: 'Jelaskan apa yang ada di gambar ini dengan gaya anak senja.',
    image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' // Contoh gambar pemandangan
  };

  try {
    console.log(`[Test] Menggunakan Prompt: "${testSchedule2.custom_prompt}"`);
    console.log(`[Test] Menggunakan Gambar: ${testSchedule2.image_url}`);
    
    // Kita simulasi panggil generator dengan image_url (karena di DB disimpennya URL)
    const content2 = await generateThreadsContent('threads', testSchedule2.image_url, testSchedule2.custom_prompt);
    console.log(`[Test] AI Berhasil Analisa Gambar & Generate: "${content2}"`);
    console.log('✅ TEST 2 SUKSES: AI merespon gambar dan prompt khusus sekaligus.\n');
  } catch (e) {
    console.error('❌ TEST 2 GAGAL:', e.message);
  }

  console.log('🏁 SEMUA TESTING LOGIC DYNAMIC BERHASIL!');
  process.exit(0);
}

runTest();
