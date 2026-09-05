import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

import axios from 'axios';

export async function uploadImage(base64Data, subfolder = 'images') {
  if (!supabase) {
    console.error('[Supabase Storage] Client not initialized.');
    return null;
  }

  try {
    const rawData = base64Data.split(',')[1] || base64Data;
    const buffer = Buffer.from(rawData, 'base64');
    const fileName = `${subfolder}/${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`;

    const { error } = await supabase.storage
      .from('media')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: pubData } = supabase.storage.from('media').getPublicUrl(fileName);
    return pubData.publicUrl;
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
    // Aggressive cleanup: 1 Day (24 hours) to keep storage virtually empty & permanently free
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const prefixes = ['', 'instagram', 'tiktok', 'native', 'images'];
    let totalDeleted = 0;

    for (const prefix of prefixes) {
      try {
        const { data, error } = await supabase.storage.from('media').list(prefix, {
          limit: 1000,
          offset: 0,
        });

        if (error || !data || data.length === 0) continue;

        // Filter old files
        const filesToDelete = data
          .filter(file => file.name !== '.emptyFolderPlaceholder' && file.id && new Date(file.created_at) < oneDayAgo)
          .map(file => prefix ? `${prefix}/${file.name}` : file.name);

        if (filesToDelete.length === 0) continue;

        // Delete in chunks of 100
        for (let i = 0; i < filesToDelete.length; i += 100) {
          const chunk = filesToDelete.slice(i, i + 100);
          await supabase.storage.from('media').remove(chunk);
          totalDeleted += chunk.length;
        }
      } catch (subErr) {
        console.warn(`[Supabase Cleanup] Warning cleaning ${prefix}:`, subErr.message);
      }
    }

    if (totalDeleted > 0) {
      console.log(`[Supabase Cleanup] Aggressively deleted ${totalDeleted} old media files from Supabase.`);
    } else {
      console.log(`[Supabase Cleanup] Storage is lean. No expired media files found.`);
    }
  } catch (err) {
    console.error('[Supabase Cleanup Error]:', err.message);
  }
}

export default supabase;
