import sql from '../lib/database.js';

// GANTI DATA DI BAWAH INI SESUAI DENGAN AKUN LU:
const TARGET_ACCOUNT_ID = 3; // 3 untuk Sharesa Space, 2 untuk Oneformind, dst.
const FACEBOOK_PAGE_ID = "MASUKAN_ID_HALAMAN_FB_DI_SINI"; 
const FACEBOOK_TOKEN = "MASUKAN_TOKEN_EAA_DI_SINI";

async function forceUpdate() {
  if (FACEBOOK_PAGE_ID === "MASUKAN_ID_HALAMAN_FB_DI_SINI") {
    console.log("Silakan edit file ini dulu dan masukkan ID serta Token yang benar.");
    process.exit(1);
  }

  try {
    await sql`
      UPDATE instagram_accounts 
      SET 
        facebook_page_id = ${FACEBOOK_PAGE_ID},
        access_token = ${FACEBOOK_TOKEN},
        crosspost_to_facebook = 1
      WHERE id = ${TARGET_ACCOUNT_ID}
    `;
    console.log(`Berhasil force update akun ID ${TARGET_ACCOUNT_ID} dengan FB Page ID: ${FACEBOOK_PAGE_ID}`);
  } catch (error) {
    console.error("Error update database:", error.message);
  }
  process.exit(0);
}

forceUpdate();
