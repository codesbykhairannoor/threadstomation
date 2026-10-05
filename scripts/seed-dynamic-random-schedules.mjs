import sql from '../lib/database.js';

async function seed() {
    console.log('--- SEEDING DYNAMIC RANDOM SCHEDULES FOR SHARESA SPACE & TRANVAS ---');

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. SHARESA SPACE (Account ID: 3) — 25 DYNAMIC ANGLES (5 PER CATEGORY)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('Seeding 25 dynamic angles for Account 3 (Sharesa Space)...');
    
    // Clear old schedules for Account 3
    await sql`DELETE FROM schedules WHERE account_id = 3`;

    const sharesaSchedules = [
        // ── KATEGORI 1: JASA WEB DEVELOPMENT & CUSTOM WEB APPS (@sharesa.space) ──
        {
            category: 1,
            prompt: `[KATEGORI 1: JASA WEB DEVELOPMENT @sharesa.space]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar perangkap biaya marketplace: jualan omset 50 juta tapi dipotong biaya admin 12-15%, plus dihantui toko bisa kena banned sewaktu-waktu tanpa alasan jelas.
Posisikan pentingnya punya 'Rumah Digital' sendiri via @sharesa.space: website bisnis profesional dengan margin 100% utuh dan database pembeli aman milik sendiri.
Tutup dengan pertanyaan pemantik diskusi: "Menurut kalian, di tahun 2026 ini seberapa fatal resiko bisnis yang omsetnya gede tapi 100% cuma numpang di platform orang lain?"`
        },
        {
            category: 1,
            prompt: `[KATEGORI 1: JASA WEB DEVELOPMENT @sharesa.space]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Sorot data kecepatan website: 53% calon pembeli langsung close tab kalau website loading lebih dari 3 detik. Kebanyakan website bisnis gagal bukan karena produknya jelek, tapi karena websitenya berat dan lemot.
Posisikan keunggulan @sharesa.space yang bangun website ultra-fast, clean code, dan mobile-first yang langsung bikin visitor nyaman belanja.
Tutup dengan pertanyaan pemantik: "Berapa detik batas kesabaran kalian nunggu web loading sebelum mutusin pencet tombol back?"`
        },
        {
            category: 1,
            prompt: `[KATEGORI 1: JASA WEB DEVELOPMENT @sharesa.space]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bandingkan kredibilitas: olshop yang cuma ngandelin link bio gratisan vs brand yang punya domain resmi (.com / .id) dengan landing page elegan. Persepsi harga dan tingkat kepercayaan calon buyer bisa naik 10x lipat.
Posisikan @sharesa.space sebagai partner bangun landing page kredibel yang siap naikin closing rate bisnis.
Tutup dengan pertanyaan: "Jujur, kalian lebih percaya transfer jutaan ke olshop yang punya web resmi sendiri atau yang cuma modal bio link gratisan?"`
        },
        {
            category: 1,
            prompt: `[KATEGORI 1: JASA WEB DEVELOPMENT @sharesa.space]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar derita operasional olshop: tengah malam masih harus balesin chat WA manual satu-satu cuma buat jawab 'masih ready kak?'. Akibatnya waktu habis dan banyak lead lepas karena slow respon.
Posisikan sistem web custom dari @sharesa.space yang dilengkapi form order instan dan integrasi otomatis, melayani pembeli 24 jam nonstop saat kita tidur.
Tutup dengan pertanyaan pemantik: "Berapa lama batas toleransi kalian nunggu balasan chat admin olshop sebelum mutusin beli di toko sebelah?"`
        },
        {
            category: 1,
            prompt: `[KATEGORI 1: JASA WEB DEVELOPMENT @sharesa.space]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bahas mitos bikin website: banyak yang mikir bikin web itu ribet dan mahal ratusan juta, padahal yang bikin boncos adalah pakai template pasaran yang gampang error dan ga sesuai model bisnis.
Posisikan pendekatan custom web app & modern architecture dari @sharesa.space: fungsional, tepat sasaran, scalable, dan ga bikin pusing maintenance.
Tutup dengan pertanyaan pemantik: "Pernah gak nemu website bisnis yang tampilannya keren tapi tombol beli atau checkout-nya ribet banget?"`
        },

        // ── KATEGORI 2: SOLVEMYMEDIA (solvemymedia.com) ──
        {
            category: 2,
            prompt: `[KATEGORI 2: SOLVEMYMEDIA (solvemymedia.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar derita kompres video 1GB di web konvensional: nunggu upload 15 menit, kuota ludes, dan pas mau download malah dipalak biaya langganan $19/bulan.
Kenalkan solvemymedia.com: kompres video langsung di RAM browser pakai teknologi WebCodecs. Nol detik upload karena file video gak pernah keluar dari perangkat kita.
Tutup dengan pertanyaan: "Hal apa yang paling bikin kalian kesel pas kompres video online: lemot nunggu upload, watermark jelek, atau dipalak bayar?"`
        },
        {
            category: 2,
            prompt: `[KATEGORI 2: SOLVEMYMEDIA (solvemymedia.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar kerepotan potong video pendek: cuma mau buang 5 detik bagian video yang salah tapi harus buka software editing berat, render ulang, dan nunggu 10 menit laptop panas.
Kenalkan fitur Video Trimmer solvemymedia.com: potong video instan dalam 0.4 detik tanpa render ulang karena berjalan langsung di level bitstream browser.
Tutup dengan pertanyaan: "Kalian masih buka aplikasi editing berat cuma buat motong beberapa detik video, atau udah pake web tools instan?"`
        },
        {
            category: 2,
            prompt: `[KATEGORI 2: SOLVEMYMEDIA (solvemymedia.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar dilema transkrip audio meeting/wawancara: mau pakai AI cloud tapi takut isi rekaman rahasia kantor atau obrolan pribadi bocor ke database pihak ketiga.
Kenalkan AI Audio Transcriber di solvemymedia.com: ubah suara jadi teks langsung di browser secara lokal tanpa kirim file suara ke server manapun. 100% privat dan gratis.
Tutup dengan pertanyaan: "Kalian tipe yang parno data rekaman rapat diupload ke AI cloud gratisan, atau cuek aja yang penting beres?"`
        },
        {
            category: 2,
            prompt: `[KATEGORI 2: SOLVEMYMEDIA (solvemymedia.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar masalah bikin GIF animasi: web pembuat GIF online biasanya ngasih hasil buram, patah-patah, dan ditempeli watermark gede di tengah layar.
Kenalkan Video to GIF di solvemymedia.com: bikin GIF jernih dengan kontrol frame rate presisi langsung di browser tanpa watermark sepeserpun.
Tutup dengan pertanyaan: "Menurut kalian, di era video pendek sekarang, animasi GIF masih relevan banget gak sih buat bahan meme atau presentasi kerja?"`
        },
        {
            category: 2,
            prompt: `[KATEGORI 2: SOLVEMYMEDIA (solvemymedia.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar ribetnya rekam layar laptop buat demo kerjaan atau tutorial: malas install aplikasi berat kayak OBS cuma buat rekam 1 menit walkthrough.
Kenalkan Screen Recorder di solvemymedia.com: klik rekam tab/layar browser langsung simpan ke format WebM/MP4 ringan tanpa instalasi software apapun.
Tutup dengan pertanyaan: "Kalo disuruh rekam layar cepet buat klien, tool apa yang biasa kalian andalkan selama ini?"`
        },

        // ── KATEGORI 3: CREATEMY-QR (createmy-qr.com) ──
        {
            category: 3,
            prompt: `[KATEGORI 3: CREATEMY-QR (createmy-qr.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar jebakan licik QR generator gratisan: awalnya dibilang gratis, pas udah dicetak ratusan lembar di kemasan produk atau buku menu kafe, 14 hari kemudian linknya mati dan dipalak $39/bulan buat perpanjang.
Kenalkan createmy-qr.com: bikin QR Code statis permanen seumur hidup yang gak bakal pernah kadaluarsa, tanpa login, dan anti-scam.
Tutup dengan pertanyaan: "Pernah gak kalian scan barcode atau QR di restoran, tapi yang muncul malah halaman 'Trial Expired'?"`
        },
        {
            category: 3,
            prompt: `[KATEGORI 3: CREATEMY-QR (createmy-qr.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bahas kerepotan tamu kafe/kantor: harus nanya berulang kali 'Mas password Wi-Fi nya apa?' dan kasir capek ngeja huruf besar-kecil simbol yang rumit.
Kenalkan QR Wi-Fi di createmy-qr.com: sekali scan, HP tamu langsung otomatis terhubung ke internet tanpa perlu ketik password manual.
Tutup dengan pertanyaan: "Lebih seneng kafe yang masang stiker scan QR Wi-Fi langsung konek, atau yang nulis password di papan tulis?"`
        },
        {
            category: 3,
            prompt: `[KATEGORI 3: CREATEMY-QR (createmy-qr.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar hambatan konversi pembeli: calon customer malas beli karena harus save nomor HP penjual dulu ke kontak sebelum bisa kirim chat WhatsApp.
Kenalkan WhatsApp Direct QR di createmy-qr.com: bikin QR yang saat di-scan langsung membuka room chat WhatsApp lengkap dengan draf pesan pesanan otomatis.
Tutup dengan pertanyaan: "Kalian tipe yang males banget save nomor asing cuma buat nanya harga ke admin olshop?"`
        },
        {
            category: 3,
            prompt: `[KATEGORI 3: CREATEMY-QR (createmy-qr.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bahas fleksibilitas identitas digital: kartu nama kertas gampang hilang dan boros cetak ulang saat nomor HP atau posisi kerja ganti.
Kenalkan fitur vCard Digital & 37 Tipe Barcode di createmy-qr.com: bikin QR kartu nama digital interaktif yang langsung simpan kontak lengkap ke smartphone dalam satu ketukan.
Tutup dengan pertanyaan: "Di tahun 2026 ini, kartu nama kertas masih beneran efektif atau udah saatnya 100% beralih ke digital QR?"`
        },
        {
            category: 3,
            prompt: `[KATEGORI 3: CREATEMY-QR (createmy-qr.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar QR code standar yang membosankan: kotak hitam-putih polos bikin materi promosi kelihatan kaku dan kurang mencerminkan estetika brand.
Kenalkan fitur Kustomisasi Desain di createmy-qr.com: ubah warna gradient, bentuk sudut mata QR, dan pasang logo brand sendiri di tengah tanpa bikin scanner gagal baca.
Tutup dengan pertanyaan: "Menurut kalian, QR code yang ada logo brand dan warna khusus bikin orang lebih tertarik buat nge-scan gak sih?"`
        },

        // ── KATEGORI 4: HELPMYIMG (helpmyimg.com) ──
        {
            category: 4,
            prompt: `[KATEGORI 4: HELPMYIMG (helpmyimg.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar derita hapus background foto produk: web penghapus background online biasanya ngasih kuota 1x gratis, setelah itu resolusi dipangkas jadi buram atau disuruh bayar koin langganan.
Kenalkan helpmyimg.com: hapus background pakai AI lokal langsung di browser. Bebas hapus ratusan foto tanpa kuota server dan resolusi asli tetap utuh 100%.
Tutup dengan pertanyaan: "Kalian paling sebel sama apa pas pake tool remove background online: resolusi diturunin atau kuota gratisan yang pelit?"`
        },
        {
            category: 4,
            prompt: `[KATEGORI 4: HELPMYIMG (helpmyimg.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar masalah foto katalog website lambat: upload 20 foto resolusi 5MB bikin pengunjung kabur karena gambarnya berat dibuka di HP.
Kenalkan Batch Image Optimizer di helpmyimg.com: kompres dan konversi puluhan foto JPG/PNG ke format WebP modern secara massal dalam hitungan detik langsung di browser.
Tutup dengan pertanyaan: "Kalo buka olshop terus foto produknya lambat banget kebuka, kalian bakal nungguin atau langsung cari toko lain?"`
        },
        {
            category: 4,
            prompt: `[KATEGORI 4: HELPMYIMG (helpmyimg.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar maraknya pencurian foto produk: seller capek foto produk sendiri dari pagi sampai sore, tapi fotonya dicomot seenaknya oleh kompetitor nakal buat jualan produk tiruan.
Kenalkan Batch Watermark Tool di helpmyimg.com: pasang logo atau teks copyright ke ratusan foto sekaligus secara instan sebelum diunggah ke katalog.
Tutup dengan pertanyaan: "Pernah ga nemu foto produk kalian sendiri dipajang di olshop lain tanpa izin?"`
        },
        {
            category: 4,
            prompt: `[KATEGORI 4: HELPMYIMG (helpmyimg.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bahas privasi data foto identitas: banyak orang gak sadar bahayanya upload foto KTP, NPWP, atau dokumen keluarga ke website image editor gratisan berbasis cloud yang servernya entah di mana.
Kenalkan privasi helpmyimg.com: seluruh pemrosesan gambar dijalankan di RAM perangkat kalian sendiri tanpa koneksi server backend. Nol risiko kebocoran data.
Tutup dengan pertanyaan: "Kalian tipe yang hati-hati banget milih web buat edit dokumen identitas, atau asal upload yang penting tugas beres?"`
        },
        {
            category: 4,
            prompt: `[KATEGORI 4: HELPMYIMG (helpmyimg.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bahas ribetnya sesuaikan rasio gambar untuk berbagai sosmed: feeds butuh 1:1, story butuh 9:16, banner butuh 16:9, kalau salah crop gambarnya jadi gepeng atau pecah.
Kenalkan Smart Cropper di helpmyimg.com: crop dan resize presisi dengan rasio standar sosmed instan tanpa mengurangi ketajaman piksel.
Tutup dengan pertanyaan: "Format postingan apa yang menurut kalian paling sering bikin jengkel pas ngatur ukuran gambarnya?"`
        },

        // ── KATEGORI 5: HANDLEMYFILE (handlemyfile.com) ──
        {
            category: 5,
            prompt: `[KATEGORI 5: HANDLEMYFILE (handlemyfile.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar mimpi buruk daftar CPNS atau seleksi kerja: berkas PDF ukuran 5MB ditolak sistem karena batas maksimal cuma 500KB, pas dikompres di web online hasilnya malah ngeblur dan ga kebaca.
Kenalkan handlemyfile.com: kompres berkas PDF dengan teknologi WebAssembly lokal. Hasil dokumen tetap tajam dan terbaca jelas, ukuran berkurang drastis tanpa risiko file tersimpan di cloud orang.
Tutup dengan pertanyaan: "Pernah ngalamin kepanikan berkas lamaran ditolak portal web cuma gara-gara ukuran PDF kelebihan beberapa kilobyte?"`
        },
        {
            category: 5,
            prompt: `[KATEGORI 5: HANDLEMYFILE (handlemyfile.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar kerepotan gabung dokumen kantor: mau gabung 5 file PDF laporan terpisah tapi harus bayar langganan software PDF bulanan atau download aplikasi bajakan yang rawan malware.
Kenalkan PDF Merge di handlemyfile.com: seret dan lepas beberapa file PDF, susun urutannya, dan gabungkan jadi satu berkas rapi dalam 3 detik di browser.
Tutup dengan pertanyaan: "Kalian biasanya pake software berbayar atau tools gratisan pas harus gabungin banyak file PDF kerjaan?"`
        },
        {
            category: 5,
            prompt: `[KATEGORI 5: HANDLEMYFILE (handlemyfile.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bahas bahaya kebocoran surat perjanjian & NDA: upload draft kontrak kerja atau rekening koran bank ke situs converter PDF online gratisan beresiko fatal jika database mereka bocor.
Kenalkan handlemyfile.com: arsitektur zero-upload berbasis in-memory WebAssembly. File PDF diproses 100% di browser kalian, aman untuk dokumen legal dan sensitif.
Tutup dengan pertanyaan: "Pernah kepikiran gak kemana larinya file PDF rahasia yang kalian upload ke situs converter gratisan di Google?"`
        },
        {
            category: 5,
            prompt: `[KATEGORI 5: HANDLEMYFILE (handlemyfile.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar repotnya ambil halaman tertentu dari dokumen tebal: dokumen 100 halaman cuma butuh halaman 12 sampai 15 buat dilampirkan, tapi bingung cara misahinnya tanpa bikin berantakan.
Kenalkan PDF Splitter di handlemyfile.com: ekstrak rentang halaman manapun secara instan jadi file PDF baru yang bersih dan terpisah.
Tutup dengan pertanyaan: "Lebih sering butuh gabungin file PDF jadi satu, atau misahin halaman tertentu dari PDF yang tebal?"`
        },
        {
            category: 5,
            prompt: `[KATEGORI 5: HANDLEMYFILE (handlemyfile.com)]
[SINGLE POST HANYA 1 POST, BUKAN THREAD BERSAMBUNG]
Bongkar kendala share dokumen PDF: klien atau dosen minta lampiran dikirim dalam bentuk gambar JPG jernih bukan file PDF agar gampang dipratinjau di WhatsApp.
Kenalkan PDF to High-Res Image di handlemyfile.com: render tiap halaman PDF jadi gambar tajam tanpa kehilangan resolusi langsung di perangkat kalian.
Tutup dengan pertanyaan: "Kalian tim kirim dokumen kerjaan tetep berupa PDF rapi, atau diexport ke gambar biar langsung kelihatan di chat?"`
        }
    ];

    for (const item of sharesaSchedules) {
        await sql`
            INSERT INTO schedules (account_id, time, custom_prompt, is_active, last_run_date)
            VALUES (3, 'RANDOM', ${item.prompt}, 1, NULL)
        `;
    }
    console.log(`✅ Successfully seeded ${sharesaSchedules.length} diverse angles for Sharesa Space!`);

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. TRANVAS (Account ID: 6) — 12 DYNAMIC VIRAL ANGLES
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\nSeeding 12 diverse viral hooks for Account 6 (Tranvas)...');
    await sql`DELETE FROM schedules WHERE account_id = 6`;

    const tranvasSchedules = [
        `[VIRAL HOOK: Paradoks Prokrastinasi Produktif]
Bongkar kebiasaan orang yang ngabisin 4 jam ngatur Notion, gonta-ganti font to-do list, tapi pas tugas aslinya mau dikerjain malah cape duluan.
Refleksikan kenapa otak kita suka 'menipu' diri sendiri dengan kesibukan palsu.
Kenalkan filosofi sistem 1 Life OS terpadu @tranvas yang membuang friksi dan fokus ke aksi nyata.
Tutup dengan pertanyaan pemantik diskusi: "Siapa di sini yang to-do listnya lebih rapi dari realita hidupnya? Kenapa kita suka sok sibuk ngatur planner daripada mulai kerja?"`,

        `[VIRAL HOOK: Hot Take Anti-Subscription SaaS]
Bahas betapa konyolnya era modern: mau nulis catatan $8/bln, mau atur jadwal $12/bln, mau tracking habit $5/bln. Ujung-ujungnya boncos langganan puluhan aplikasi tapi hidup tetep berantakan.
Posisikan Tranvas (@tranvas) sebagai 'The All-in-One Life OS' yang menggabungkan task, habit, finance, & journal tanpa jebakan subscription menumpuk.
Tutup dengan pertanyaan pemantik debat: "Menurut kalian, di tahun 2026 ini software subscription udah kelewat serakah atau emang wajar?"`,

        `[VIRAL HOOK: Sains di Balik Overthinking & Brain Dump]
Bahas tentang kenapa otak manusia itu dirancang untuk MENGHASILKAN ide, bukan untuk MENYIMPAN to-do list dan kekhawatiran.
Bongkar bahaya 'cognitive overload' saat semua rencana cuma muter-muter di kepala: gampang cemas, insomnia, dan burnout.
Kenalkan metode Brain Dump di @tranvas yang bantu ngosongin isi kepala jadi sistem terstruktur dalam 5 menit.
Tutup dengan pertanyaan: "Kalian tipe yang kalo mau tidur otaknya malah bikin skenario hidup 10 tahun ke depan, atau bisa langsung pules?"`,

        `[VIRAL HOOK: Realita Bocor Alus Finansial]
Bahas kenapa orang berpenghasilan cukup sering ngerasa uangnya lenyap entah kemana di tanggal 20. Masalahnya bukan di pengeluaran besar, tapi di 'bocor alus': kopi kekinian, ongkir receh, dan subscription aplikasi yang lupa di-cancel.
Kenalkan sistem tracking finance terpadu di @tranvas yang melacak cashflow harian tanpa bikin pusing akuntansi ribet.
Tutup dengan pertanyaan: "Pengeluaran 'receh' apa yang pas kalian rekap di akhir bulan ternyata totalnya bikin syok sendiri?"`,

        `[VIRAL HOOK: The To-Do List Lie]
Pecat to-do list 30 butir. Bahas kenapa to-do list panjang justru jadi resep paling ampuh buat bikin orang ngerasa gagal dan malas sebelum jam makan siang.
Kenalkan konsep 'Rule of 3' dan prioritasi energi di @tranvas: selesaikan 1-3 hal non-negotiable per hari, dan sisanya adalah bonus.
Tutup dengan pertanyaan pemantik: "Rata-rata berapa persen isi to-do list harian kalian yang beneran kecentang di malam hari?"`,

        `[VIRAL HOOK: Founder Story / Build-In-Public]
Ceritakan keresahan nyata di balik ngebangun @tranvas: rasa frustrasi sebagai kreator/pekerja yang lelah gonta-ganti 7 aplikasi berbeda setiap hari cuma buat ngecek tugas, habit, dan keuangan.
Posisikan Tranvas bukan sekadar software, tapi hasil riset bertahun-tahun merampingkan hidup jadi satu workspace yang tenang dan fokus.
Tutup dengan pertanyaan: "Kalo kalian bisa bikin 1 aplikasi buat nyelesaiin masalah hidup kalian sehari-hari, fitur apa yang paling pertama kalian buat?"`,

        `[VIRAL HOOK: Habit Tracker Trap]
Bahas kenapa 90% orang gagal mempertahankan resolusi habit: terlalu berambisi bikin target 10 kebiasaan baru sekaligus dari hari pertama, begitu bolong sehari langsung berhenti total (all-or-nothing mindset).
Kenalkan pendekatan 'Atomic Consistency' di @tranvas yang fokus pada momentum kecil tanpa rasa bersalah.
Tutup dengan pertanyaan: "Kebiasaan baik apa yang paling sering kalian mulai dengan semangat menggebu-gebu tapi selalu bubar di minggu kedua?"`,

        `[VIRAL HOOK: Night Thought & Mental Reset]
Konten tenang penutup hari. Bahas bahwa produktif itu bukan soal sibuk kerja 16 jam sehari sampai pingsan, tapi soal tahu kapan harus berhenti dan punya kejernihan arah untuk besok pagi.
Refleksikan pentingnya review harian 3 menit di @tranvas sebelum menutup laptop.
Tutup dengan pertanyaan kontemplatif: "Hal apa yang berhasil kalian selesaikan hari ini yang bikin kalian ngerasa bangga sama diri sendiri?"`,

        `[VIRAL HOOK: Monolog Fokus di Era Distraksi]
Bongkar realita rentang perhatian manusia yang sekarang lebih pendek dari ikan mas koki gara-gara short-form video. Kita bisa scrolling 2 jam tanpa sadar, tapi baca buku 10 halaman rasanya berat banget.
Kenalkan pendekatan Deep Work Focus Space di @tranvas: ciptakan lingkungan digital yang minim distraksi untuk mengembalikan kendali atas waktu kita.
Tutup dengan pertanyaan: "Berapa jam rata-rata screen time HP kalian per hari? Berani jujur cek pengaturannya sekarang?"`,

        `[VIRAL HOOK: Solitude & Jurnal Kejujuran]
Bahas pentingnya punya ruang privat untuk menuangkan kegagalan, keraguan, dan ketakutan tanpa takut dihakimi orang lain di media sosial.
Posisikan fitur Jurnal Reflektif di @tranvas sebagai tempat paling aman untuk berbicara jujur dengan diri sendiri setiap malam.
Tutup dengan pertanyaan: "Kapan terakhir kali kalian nulis curhat atau evaluasi diri secara jujur tanpa diposting ke sosmed?"`,

        `[VIRAL HOOK: Bedah Afiliasi Recurring 60% Tranvas]
Bongkar matematika cari penghasilan sampingan di internet: kebanyakan affiliate program di Indonesia cuma kasih komisi 5-10% sekali bayar, bikin kreator capek jualan dari nol tiap bulan.
Bahas konsep Recurring Revenue di program afiliasi @tranvas: komisi 60% bulanan berulang selama 8 bulan (contoh nyata: 10 pengguna aktif langganan = Rp 894.000 pasif masuk rekening tiap bulan).
Tutup dengan pertanyaan pemantik diskusi: "Menurut kalian, kenapa program afiliasi di Indonesia masih jarang banget yang berani ngasih komisi recurring bulanan?"`,

        `[VIRAL HOOK: Kematian Jam Kerja Tradisional & Era Leverage]
Bahas pergeseran dunia kerja: kerja keras 14 jam tapi tanpa sistem dan leverage cuma bikin burnout tanpa hasil. Yang menang di era sekarang adalah mereka yang punya sistem teratur dan fokus pada hal yang berdampak besar.
Posisikan Tranvas (@tranvas) sebagai leverage personal untuk mengelola hidup dan waktu dengan efisiensi tinggi.
Tutup dengan pertanyaan pemantik: "Kalian di tim mana: kerja keras banting tulang 14 jam, atau kerja taktis 5 jam dengan sistem yang rapi?"`
    ];

    for (const prompt of tranvasSchedules) {
        await sql`
            INSERT INTO schedules (account_id, time, custom_prompt, is_active, last_run_date)
            VALUES (6, 'RANDOM', ${prompt}, 1, NULL)
        `;
    }
    console.log(`✅ Successfully seeded ${tranvasSchedules.length} diverse viral hooks for Tranvas!`);

    process.exit(0);
}

seed().catch(e => { console.error('Seed error:', e); process.exit(1); });
