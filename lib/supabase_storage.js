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

    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('[Supabase Storage Error]:', error.message);
    return null;
  }
}
