import axios from 'axios';

async function testPost() {
  try {
    const res = await axios.post('http://localhost:3000/api/tiktok/post-now', {
      accountId: 3,
      customPrompt: "Test post for maritumbuhbersama account, generate something motivational and short."
    });
    console.log(res.data);
  } catch (e) {
    console.error("Test failed:", e.response?.data || e.message);
  }
}
testPost();
