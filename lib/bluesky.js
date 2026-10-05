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

export const KNOWN_SITE_METADATA = {
  'tranvas.com': {
    uri: 'https://tranvas.com',
    title: 'Tranvas | The Unified Life OS',
    description: 'A fast, unified life OS that actually works without corporate bloatware and fragmented subscriptions.'
  },
  'solvemymedia.com': {
    uri: 'https://solvemymedia.com/cut-video',
    title: 'Cut Video Online Free — Instant Lossless Video Trimmer',
    description: 'Trim and cut MP4, MOV, WebM, and MKV videos directly in your browser. Fast lossless cutting with zero server uploads and no watermark.'
  },
  'createmy-qr.com': {
    uri: 'https://createmy-qr.com/',
    title: 'CreateMy-QR | All QR & Barcode Tools in One Place',
    description: 'Generate 37 types of QR codes and barcodes for free. No signup. Instant download. 100% client-side, ISO/IEC 18004-compliant, available in 30 languages.'
  },
  'helpmyimg.com': {
    uri: 'https://helpmyimg.com/',
    title: 'HelpMyIMG | All Image Tools in One Place',
    description: 'Combine, split, compress, convert, and process photos directly in your browser. 100% offline via WebAssembly. Free, unlimited, and highly secure.'
  },
  'handlemyfile.com': {
    uri: 'https://handlemyfile.com/',
    title: 'HandleMyFile | All Document Tools in One Place',
    description: 'Merge, split, compress, convert Office files, and OCR directly in your browser. 100% processed offline via WebAssembly.'
  }
};

/**
 * Posts content to Bluesky. Supports text, optional image, or rich link cards.
 * @param {string} identifier - The user's handle.
 * @param {string} password - The user's App Password.
 * @param {string} text - The text content to post.
 * @param {string} [imageUrl] - Optional URL of an image to attach.
 * @param {Object} [externalEmbed] - Optional external card embed.
 * @returns {Promise<Object>} The response from Bluesky.
 */
export async function postToBluesky(identifier, password, text, imageUrl = null, externalEmbed = null) {
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
    } else if (externalEmbed) {
      postRecord.embed = {
        $type: 'app.bsky.embed.external',
        external: externalEmbed
      };
    } else {
      // Auto-detect known sites from text to attach rich OpenGraph preview card
      for (const [domain, meta] of Object.entries(KNOWN_SITE_METADATA)) {
        if (text.includes(domain)) {
          postRecord.embed = {
            $type: 'app.bsky.embed.external',
            external: meta
          };
          break;
        }
      }
    }

    const res = await agent.post(postRecord);
    return res;
  } catch (error) {
    throw new Error(`Bluesky API error: ${error.message}`);
  }
}
