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
  if (!supabase) {
    console.warn('[Supabase Cleanup] Client not initialized. Cannot cleanup storage.');
    return;
  }

  try {
    // Aggressive cleanup: 1 Day (24 hours)
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    
    // List files
    const { data, error } = await supabase.storage.from('media').list('', {
      limit: 1000,
      offset: 0,
    });

    if (error) throw error;
    if (!data || data.length === 0) return;

    // Filter old files
    const filesToDelete = data
      .filter(file => file.name !== '.emptyFolderPlaceholder' && new Date(file.created_at) < oneDayAgo)
      .map(file => file.name);

    if (filesToDelete.length === 0) return;

    // Delete in chunks of 100
    for (let i = 0; i < filesToDelete.length; i += 100) {
      const chunk = filesToDelete.slice(i, i + 100);
      await supabase.storage.from('media').remove(chunk);
    }

    console.log(`[Supabase Cleanup] Aggressively deleted ${filesToDelete.length} old media files from Supabase.`);
  } catch (err) {
    console.error('[Supabase Cleanup Error]:', err.message);
  }
}
