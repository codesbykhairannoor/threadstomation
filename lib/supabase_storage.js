import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export async function uploadImage(base64Data) {
  if (!supabase) {
    console.error('[Supabase] Client not initialized. Missing URL or Service Role Key.');
    return null;
  }

  try {
    const fileName = `threads-${Date.now()}.jpg`;
    const buffer = Buffer.from(base64Data.split(',')[1] || base64Data, 'base64');
    
    const { data, error } = await supabase.storage
      .from('media') // User must create this bucket and make it public
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    // Proxy through Vercel to bypass Meta API crawler limitations / SSL / IP blocks on Supabase storage URLs
    return `https://threadstomation.vercel.app/supabase-media/${fileName}`;
  } catch (error) {
    console.error('[Supabase Storage Error]:', error.message);
    return null;
  }
}

export async function cleanupOldStorage() {
  if (!supabase) {
    console.warn('[Supabase Cleanup] Client not initialized. Cannot cleanup storage.');
    return;
  }

  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    
    // List files
    const { data, error } = await supabase.storage.from('media').list('', {
      limit: 1000,
      offset: 0,
    });

    if (error) throw error;
    if (!data || data.length === 0) return;

    // Filter old files
    const filesToDelete = data
      .filter(file => file.name !== '.emptyFolderPlaceholder' && new Date(file.created_at) < twoDaysAgo)
      .map(file => file.name);

    if (filesToDelete.length === 0) return;

    // Delete in chunks of 100
    for (let i = 0; i < filesToDelete.length; i += 100) {
      const chunk = filesToDelete.slice(i, i + 100);
      await supabase.storage.from('media').remove(chunk);
    }

    console.log(`[Supabase Cleanup] Deleted ${filesToDelete.length} old media files.`);
  } catch (err) {
    console.error('[Supabase Cleanup Error]:', err.message);
  }
}
