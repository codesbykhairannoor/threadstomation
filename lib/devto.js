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

/**
 * Publishes an article to DEV.TO
 * @param {string} apiKey DEV.TO user API key
 * @param {string} title Article title
 * @param {string} markdownContent Body content in Markdown
 * @param {string[]} tags Array of tags (max 4, alphanumeric)
 * @param {string|null} mainImage Cover image URL (approx 1000x420)
 * @param {string|null} canonicalUrl Canonical URL if cross-posted
 * @param {string|null} description Short summary description
 */
export async function postToDevto(apiKey, title, markdownContent, tags = [], mainImage = null, canonicalUrl = null, description = null) {
  try {
    const articlePayload = {
      title,
      body_markdown: markdownContent,
      published: true,
      tags: tags.map(t => t.replace(/[^a-zA-Z0-9]/g, '')).filter(t => t.length > 0).slice(0, 4) // Dev.to allows max 4 tags
    };

    if (mainImage) {
      articlePayload.main_image = mainImage;
    }
    if (canonicalUrl) {
      articlePayload.canonical_url = canonicalUrl;
    }
    if (description) {
      articlePayload.description = description;
    }

    const response = await axios.post(
      `${DEVTO_API}/articles`,
      { article: articlePayload },
      {
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Dev.to API error: ${error.response?.data?.error || error.message}`);
  }
}

