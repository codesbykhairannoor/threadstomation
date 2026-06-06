import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.ALIBABA_CLOUD_API_KEY;

async function testAlibabaWanx() {
  if (!API_KEY) {
    console.error("No ALIBABA_CLOUD_API_KEY found in environment.");
    return;
  }

  const testConfigs = [
    {
      endpoint: 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      body: {
        model: "wanx2.0-t2i-turbo",
        input: { prompt: "A futuristic laptop on a flat solid navy blue background, modern technology, minimalist" },
        parameters: { size: "1024*1024", n: 1 }
      },
      asyncHeader: true
    },
    {
      endpoint: 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      body: {
        model: "wanx-v1",
        input: { prompt: "A futuristic laptop on a flat solid navy blue background, modern technology, minimalist" },
        parameters: { style: "<painting>", size: "1024*1024", n: 1 }
      },
      asyncHeader: true
    },
    {
      endpoint: 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      body: {
        model: "wan2.6-t2i",
        input: {
          messages: [{ role: "user", content: [{ text: "A futuristic laptop on a flat solid navy blue background, modern technology, minimalist" }] }]
        },
        parameters: { size: "1024*1024", n: 1 }
      },
      asyncHeader: false // Try synchronous call
    }
  ];

  for (const config of testConfigs) {
    console.log(`\n--- Testing model: ${config.body.model} on ${config.endpoint} ---`);
    try {
      const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      };
      if (config.asyncHeader) {
        headers['X-DashScope-Async'] = 'enable';
      }
      
      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(config.body)
      });

      console.log(`Status: ${res.status}`);
      const data = await res.json();
      console.log("Response data:", JSON.stringify(data, null, 2));

      if (res.ok) {
        if (data.output?.task_id) {
          console.log(`Task created successfully! Task ID: ${data.output.task_id}`);
          await pollTask(data.output.task_id);
          break;
        } else if (data.output?.results?.[0]?.url) {
          console.log("Success! Image URL (Synchronous):", data.output.results[0].url);
          break;
        }
      }
    } catch (e) {
      console.error(`Error:`, e.message);
    }
  }
}

async function pollTask(taskId) {
  const url = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
  console.log(`Polling task status from: ${url}`);
  
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      const data = await res.json();
      console.log(`Poll #${i+1} status: ${data.output?.task_status}`);
      if (data.output?.task_status === 'SUCCEEDED') {
        console.log("Success! Image URL:", data.output?.results?.[0]?.url);
        break;
      } else if (data.output?.task_status === 'FAILED') {
        console.error("Task failed:", data.output?.message);
        break;
      }
    } catch (e) {
      console.error("Poll error:", e.message);
    }
  }
}

testAlibabaWanx();
