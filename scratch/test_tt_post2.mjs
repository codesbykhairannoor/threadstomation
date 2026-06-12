import axios from 'axios';

async function testPost() {
  try {
    const res = await axios.post('http://localhost:3000/api/tiktok/post-now', {
      accountId: 6,
      customPrompt: "Buatkan postingan motivasi pagi Islami yang sangat singkat (maksimal 2 kalimat)."
    });
    console.log(res.data);
  } catch (e) {
    console.error("Test failed:", e.response?.data || e.message);
  }
}
testPost();
