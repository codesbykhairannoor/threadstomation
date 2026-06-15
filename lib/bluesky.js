import { BskyAgent, RichText } from '@atproto/api';
import axios from 'axios';

/**
 * Creates an authenticated BskyAgent.
 * @param {string} identifier - The user's handle (e.g., user.bsky.social) or DID.
 * @param {string} password - The user's App Password.
 * @returns {Promise<BskyAgent>}
 */
export async function getBlueskyAgent(identifier, password) {
  const agent = new BskyAgent({
    service: 'https://bsky.social'
  });

  await agent.login({
    identifier,
    password
  });

  return agent;
}

/**
 * Uploads an image from a URL to Bluesky as a Blob.
 * @param {BskyAgent} agent - The authenticated agent.
 * @param {string} imageUrl - The URL of the image to upload.
 * @returns {Promise<Object>} The uploaded blob response.
 */
async function uploadImageBlob(agent, imageSource) {
  let buffer;
  let mimeType = 'image/jpeg';

  if (Buffer.isBuffer(imageSource)) {
    buffer = imageSource;
  } else if (typeof imageSource === 'string' && imageSource.startsWith('http')) {
    const response = await axios.get(imageSource, { responseType: 'arraybuffer' });
    buffer = Buffer.from(response.data);
    mimeType = response.headers['content-type'] || 'image/jpeg';
  } else {
    throw new Error('Invalid image source provided to uploadImageBlob');
  }

  const { data } = await agent.uploadBlob(buffer, {
    encoding: mimeType
  });

  return data.blob;
}

/**
 * Posts content to Bluesky. Supports text and an optional image.
 * @param {string} identifier - The user's handle.
 * @param {string} password - The user's App Password.
 * @param {string} text - The text content to post.
 * @param {string} [imageUrl] - Optional URL of an image to attach.
 * @returns {Promise<Object>} The response from Bluesky.
 */
export async function postToBluesky(identifier, password, text, imageUrl = null) {
  try {
    const agent = await getBlueskyAgent(identifier, password);
    
    // Automatically detect URLs and generate facets to make them clickable links
    const rt = new RichText({ text: text });
    await rt.detectFacets(agent);

    const postRecord = {
      $type: 'app.bsky.feed.post',
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString()
    };

    if (imageUrl) {
      const blob = await uploadImageBlob(agent, imageUrl);
      postRecord.embed = {
        $type: 'app.bsky.embed.images',
        images: [{
          alt: 'AI Generated Image',
          image: blob
        }]
      };
    }

    const res = await agent.post(postRecord);
    return res;
  } catch (error) {
    throw new Error(`Bluesky API error: ${error.message}`);
  }
}
