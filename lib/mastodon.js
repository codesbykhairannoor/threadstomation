import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ override: true });

const CLIENT_ID = process.env.MASTODON_CLIENT_ID;
const CLIENT_SECRET = process.env.MASTODON_CLIENT_SECRET;

export async function getMastodonUserInfo(accessToken, instanceUrl = 'https://mastodon.social') {
  const response = await axios.get(`${instanceUrl}/api/v1/accounts/verify_credentials`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data;
}

export async function uploadMediaToMastodon(imageSource, accessToken, instanceUrl = 'https://mastodon.social', description = 'Informative diagram and visual preview') {
  let buffer;
  if (Buffer.isBuffer(imageSource)) {
    buffer = imageSource;
  } else if (typeof imageSource === 'string') {
    const imageResponse = await axios.get(imageSource, { responseType: 'arraybuffer' });
    buffer = Buffer.from(imageResponse.data, 'binary');
  } else {
    throw new Error('Invalid image source');
  }

  // Create multipart/form-data payload with required accessibility Alt-Text
  const formData = new FormData();
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  formData.append('file', blob, 'image.jpg');
  if (description) {
    formData.append('description', description.substring(0, 420));
  }

  const uploadResponse = await axios.post(`${instanceUrl}/api/v2/media`, formData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    }
  });

  return uploadResponse.data.id; // Returns the media ID
}

export async function postToMastodon(accessToken, instanceUrl, text, mediaIds = []) {
  const payload = {
    status: text,
    visibility: 'public'
  };

  if (mediaIds && mediaIds.length > 0) {
    payload.media_ids = mediaIds;
  }

  const response = await axios.post(`${instanceUrl}/api/v1/statuses`, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

export async function setMastodonBotAccount(accessToken, instanceUrl = 'https://mastodon.social') {
  try {
    const response = await axios.patch(
      `${instanceUrl}/api/v1/accounts/update_credentials`,
      { bot: true },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('[Mastodon-Bot-Flag] ✅ Account successfully flagged as bot on Mastodon.');
    return response.data;
  } catch (e) {
    console.warn('[Mastodon-Bot-Flag] ⚠️ Could not auto-set bot flag via API:', e.message);
    return null;
  }
}

