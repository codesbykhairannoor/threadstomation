import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

import axios from 'axios';

export async function uploadImage(base64Data) {
  try {
    const rawData = base64Data.split(',')[1] || base64Data;
    
    const form = new FormData();
    form.append('key', '6d207e02198a847aa98d0a2a901485a5'); // Public Freeimage API Key
    form.append('action', 'upload');
    form.append('source', rawData);
    form.append('format', 'json');

    const response = await axios.post('https://freeimage.host/api/1/upload', form, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data && response.data.image && response.data.image.url) {
      return response.data.image.url;
    }
    
    throw new Error('Invalid response from image host');
  } catch (error) {
    console.error('[Image Upload Error]:', error.message || error);
    return null;
  }
}

export async function cleanupOldStorage() {
  // ❌ USER REQUEST: Do NOT delete media files anymore!
  console.log('[Supabase Cleanup] Auto-cleanup of media files disabled. Media will be kept permanently.');
}
