import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

// Gunakan kredensial dari folder affiliateshopee
const client = createClient({
  url: "libsql://affiliatecaridisini-codesbykhairannoor.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU3MzU0MDAsImlkIjoiMDE5ZDcyMTMtOWIwMS03YjRkLWE1NzgtN2QxODEzZGNiODhkIiwicmlkIjoiZTJkMDViNTEtZTcxMi00OGU3LTg3NTEtMjFmZmZiNjNiZjVmIn0.oB-hDOkSbEYpm4PAqytemNsLtemz7hjXN993pzVCLokVxsvJ5eboV2W1s0SvTl--n9xmVRRJ7lTtGa_xo6voAQ",
});

export async function getRandomShopeeProduct() {
  console.log('📦 Mengambil barang dari Gudang Shopee...');
  try {
    // Ambil produk secara acak dari database Shopee
    const result = await client.execute('SELECT * FROM Product ORDER BY RANDOM() LIMIT 1');
    
    if (result.rows.length === 0) {
      throw new Error('Gudang Shopee Kosong!');
    }

    const product = result.rows[0];
    console.log(`🎯 Barang terpilih: ${product.title}`);
    
    return {
      title: product.title,
      description: product.description,
      price: product.price,
      shopeeUrl: product.shopeeUrl,
      imageUrl: product.imageUrl, // Link gambar asli
    };
  } catch (error) {
    console.error('❌ Gagal ambil data Shopee:', error.message);
    throw error;
  }
}

export async function getLatestShopeeProduct() {
  try {
    const result = await client.execute('SELECT * FROM Product ORDER BY createdAt DESC LIMIT 1');
    return result.rows[0];
  } catch (error) {
    console.error('❌ Gagal ambil data Shopee terbaru:', error.message);
    throw error;
  }
}
