import sql from '../lib/database.js';

async function migrate() {
  console.log('🚀 Starting Database Index Optimization...');
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_schedules_acc_active ON schedules (account_id, is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_schedules_last_run ON schedules (last_run_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_post_history_acc_date ON post_history (account_id, created_at DESC)`;
    
    // Facebook
    await sql`CREATE INDEX IF NOT EXISTS idx_fb_history_acc_date ON facebook_history (account_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_fb_schedules_acc_active ON facebook_schedules (account_id, is_active)`;
    
    // Instagram
    await sql`CREATE INDEX IF NOT EXISTS idx_ig_history_acc_date ON instagram_history (account_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ig_schedules_acc_active ON instagram_schedules (account_id, is_active)`;
    
    // TikTok
    await sql`CREATE INDEX IF NOT EXISTS idx_tt_history_acc_date ON tiktok_history (account_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tt_schedules_acc_active ON tiktok_schedules (account_id, is_active)`;

    console.log('✅ Optimization Complete!');
  } catch (e) {
    console.error('❌ Optimization Failed:', e.message);
  }
}

migrate().then(() => process.exit(0));
