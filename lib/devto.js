import axios from 'axios';

const DEVTO_API = 'https://dev.to/api';

export async function getDevtoUserInfo(apiKey) {
  try {
    const response = await axios.get(`${DEVTO_API}/users/me`, {
      headers: { 'api-key': apiKey }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Dev.to API error: ${error.response?.data?.error || error.message}`);
  }
}

export async function postToDevto(apiKey, title, markdownContent, tags = []) {
  try {
    const response = await axios.post(
      `${DEVTO_API}/articles`,
      {
        article: {
          title,
          body_markdown: markdownContent,
          published: true,
          tags: tags.slice(0, 4) // Dev.to allows max 4 tags
        }
      },
      {
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Dev.to API error: ${error.response?.data?.error || error.message}`);
  }
}
