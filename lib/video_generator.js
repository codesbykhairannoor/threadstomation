import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import axios from 'axios';

// Setup FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '../scratch');

/**
 * Uploads an MP4 video buffer to Supabase Storage.
 * @param {Buffer} buffer - The video buffer.
 * @returns {Promise<string>} The public URL of the uploaded video.
 */
async function uploadVideoToSupabase(buffer) {
  try {
    const fileName = `reels-${Date.now()}.mp4`;
    console.log(`[VideoGenerator] Bypassing Supabase, uploading video to Catbox: ${fileName}`);
    
    const blob = new Blob([buffer], { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', blob, fileName);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Catbox upload failed: ${errorText}`);
    }

    const url = await res.text();
    console.log(`[VideoGenerator] Video uploaded to Catbox: ${url}`);
    return url;
  } catch (err) {
    console.error('[VideoGenerator] Upload error:', err.message);
    throw new Error(`Video upload failed: ${err.message}`);
  }
}

/**
 * Creates an MP4 video from an array of image buffers.
 * @param {Array<Buffer>} imageBuffers - Array of slide image buffers.
 * @param {number} durationPerSlide - Duration each slide should be shown in seconds.
 * @returns {Promise<string>} The public URL of the uploaded MP4 video.
 */
export async function createVideoFromImages(imageBuffers, durationPerSlide = 3) {
  return new Promise(async (resolve, reject) => {
    console.log(`[VideoGenerator] Starting video generation for ${imageBuffers.length} slides...`);

    if (!fs.existsSync(SCRATCH_DIR)) {
      fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    }

    const sessionId = Date.now();
    const concatFilePath = path.join(SCRATCH_DIR, `concat_${sessionId}.txt`);
    const outputVideoPath = path.join(SCRATCH_DIR, `output_${sessionId}.mp4`);
    
    let concatContent = '';
    const tempFiles = [];

    // 1. Write buffers to temporary files and build concat string
    for (let i = 0; i < imageBuffers.length; i++) {
      const tempPath = path.join(SCRATCH_DIR, `slide_${sessionId}_${i}.jpg`);
      // Windows path formatting for FFmpeg concat: use forward slashes
      const ffmpegPath = tempPath.replace(/\\/g, '/');
      
      fs.writeFileSync(tempPath, imageBuffers[i]);
      tempFiles.push(tempPath);
      
      concatContent += `file '${ffmpegPath}'\n`;
      concatContent += `duration ${durationPerSlide}\n`;
    }

    // FFmpeg concat demuxer requires repeating the last file to apply the duration correctly
    if (tempFiles.length > 0) {
      const lastFfmpegPath = tempFiles[tempFiles.length - 1].replace(/\\/g, '/');
      concatContent += `file '${lastFfmpegPath}'\n`;
    }

    fs.writeFileSync(concatFilePath, concatContent);

    // 2. Fetch Super Fast Free Lofi Music
    let bgmPath = null;
    try {
      console.log(`[VideoGenerator] Fetching random Lofi BGM...`);
      const musicUrls = [
        "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3"
      ];
      // Randomly pick one
      const selectedMusicUrl = musicUrls[Math.floor(Math.random() * musicUrls.length)];
      
      const audioRes = await axios.get(selectedMusicUrl, { responseType: 'arraybuffer', timeout: 10000 });
      bgmPath = path.join(SCRATCH_DIR, `bgm_${sessionId}.mp3`);
      fs.writeFileSync(bgmPath, Buffer.from(audioRes.data));
      console.log(`[VideoGenerator] BGM downloaded successfully.`);
    } catch (e) {
      console.warn(`[VideoGenerator] Failed to fetch BGM (will generate silent video):`, e.message);
    }

    // 3. Run FFmpeg to stitch the video
    console.log(`[VideoGenerator] Running FFmpeg...`);
    
    let command = ffmpeg()
      .input(concatFilePath)
      .inputOptions(['-f concat', '-safe 0']);
      
    if (bgmPath) {
      command = command.input(bgmPath);
    }

    command
      .outputOptions([
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-r 30', // 30 FPS
        '-vf scale=1080:1350', // Force the scale to IG Reels size
        ...(bgmPath ? ['-c:a aac', '-b:a 128k', '-shortest'] : []) // Stop video when video ends (ignore long audio)
      ])
      .save(outputVideoPath)
      .on('end', async () => {
        console.log(`[VideoGenerator] FFmpeg finished rendering video.`);
        
        try {
          // 4. Upload to Supabase
          const videoBuffer = fs.readFileSync(outputVideoPath);
          let videoUrl = null;
          
          if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            videoUrl = await uploadVideoToSupabase(videoBuffer);
          } else {
            console.warn(`[VideoGenerator] No Supabase URL. Saving locally.`);
            videoUrl = `file://${outputVideoPath}`;
          }

          // 5. Cleanup temp files
          fs.unlinkSync(concatFilePath);
          tempFiles.forEach(file => fs.unlinkSync(file));
          if (bgmPath && fs.existsSync(bgmPath)) fs.unlinkSync(bgmPath);
          
          if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            fs.unlinkSync(outputVideoPath); // Keep if local testing
          }

          resolve(videoUrl);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        console.error(`[VideoGenerator] FFmpeg error: ${err.message}`);
        reject(err);
      });
  });
}
