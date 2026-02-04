
# 📸 Batch Auto-Collage Pro

**Batch Auto-Collage Pro** adalah aplikasi web modern yang memungkinkan pengguna membuat puluhan kolase foto secara otomatis dalam hitungan detik. Aplikasi ini menggabungkan kekuatan **AI (Google Gemini)** untuk analisis tema dengan **Canvas API** yang dioptimalkan untuk menjaga kualitas dan akurasi warna gambar asli.

Berbeda dengan aplikasi kolase lainnya, aplikasi ini mengutamakan **privasi**; semua pemrosesan gambar dilakukan secara lokal di browser Anda.

---

## ✨ Fitur Unggulan

### 🚀 1. Pemrosesan Batch Otomatis
Unggah ratusan foto sekaligus. Aplikasi akan otomatis membagi foto-foto tersebut ke dalam beberapa lembar kolase berdasarkan jumlah foto per grid yang Anda pilih (1, 2, 4, 6, atau 9 foto).

### 🤖 2. Analisis Tema AI (Google Gemini)
Menggunakan model **Gemini 3 Flash** untuk menganalisis konten visual foto Anda secara otomatis:
- Menyarankan judul koleksi yang menarik.
- Menentukan tema (misal: *Travel, Wedding, Foodie*).
- Memberikan palet warna yang serasi dengan nuansa foto.

### 🎨 3. Akurasi Warna Tinggi (Color Fidelity)
Algoritma rendering kami menggunakan profil warna **sRGB** eksplisit dan teknik *high-quality image smoothing*. Hasil unduhan dijamin memiliki warna yang sama persis dengan foto asli (mengatasi masalah *color shifting* pada canvas browser).

### 🛠️ 4. Editor Interaktif
- **Smart Pan:** Geser posisi foto di dalam frame untuk mendapatkan komposisi terbaik.
- **Drag & Drop Swap:** Tukar posisi antar foto dengan mudah hanya dengan menarik foto ke slot lain.
- **Rotation:** Putar foto yang miring secara instan.
- **Frame Customization:** Atur ketebalan jarak antar foto (*gutter*) secara real-time.

### 📥 5. Ekspor Fleksibel
- Unduh kolase satu per satu sebagai file **PNG**.
- Unduh semua kolase sekaligus dalam satu file **ZIP** terkompresi menggunakan library **JSZip**.

---

## 🛠️ Persyaratan Sistem

Sebelum memulai, pastikan Anda telah menginstal:
- [Node.js](https://nodejs.org/) (Versi 18 atau lebih baru)
- [npm](https://www.npmjs.com/) atau [Yarn](https://yarnpkg.com/)

---

## 🚀 Instalasi & Persiapan Lokal

1. **Clone Repositori:**
   ```bash
   git clone https://github.com/username/batch-collage-pro.git
   cd batch-collage-pro
   ```

2. **Instal Dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi API Key (Opsional - Untuk Fitur AI):**
   Aplikasi membutuhkan API Key Google Gemini untuk fitur analisis tema.
   - Dapatkan kunci di [Google AI Studio](https://aistudio.google.com/).
   - Buat file `.env` di root folder:
     ```env
     VITE_GEMINI_API_KEY=masukkan_api_key_anda_disini
     ```

4. **Jalankan Aplikasi:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di browser Anda.

---

## 📖 Cara Penggunaan

1. **Unggah Foto:** Klik area "Unggah Foto" atau tarik file gambar langsung ke dashboard.
2. **Atur Grid:** Gunakan panel samping untuk memilih berapa banyak foto yang ingin ditampilkan dalam satu lembar kolase.
3. **Kustomisasi:**
   - Gunakan mode **"Geser Isi"** untuk mengatur posisi foto di dalam frame.
   - Gunakan mode **"Tukar Foto"** untuk mengubah urutan foto.
   - Atur slider **"Jarak Frame"** untuk estetika tata letak.
4. **Unduh:** 
   - Klik ikon unduh di bawah setiap gambar untuk menyimpan satu per satu.
   - Klik tombol **"Unduh (Batch)"** di header untuk menyimpan semua kolase dalam format ZIP.

---

## 🏗️ Arsitektur Teknis

- **React 19 & TypeScript:** Dasar aplikasi yang tangguh dan *type-safe*.
- **Tailwind CSS:** Untuk antarmuka yang responsif dan modern.
- **Canvas API:** Digunakan untuk me-render gambar secara dinamis dengan performa tinggi.
- **Google GenAI SDK:** Integrasi dengan Gemini 3 untuk fitur cerdas.
- **Vite:** Build tool generasi terbaru untuk kecepatan pengembangan.

---

## 🔒 Privasi & Keamanan

Keamanan data Anda adalah prioritas kami. Aplikasi ini bekerja dengan prinsip **Offline-First**:
- Foto Anda **TIDAK PERNAH** diunggah ke server kami.
- Pemrosesan *Base64* dan *Canvas Rendering* dilakukan sepenuhnya di memori browser lokal Anda.
- Jika fitur AI digunakan, hanya data gambar minimum yang dikirim ke API Google melalui koneksi terenkripsi untuk analisis sementara.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **MIT License**. Silakan gunakan, modifikasi, dan distribusikan secara bebas.

---

Dibuat dengan 🤖 udah gitu aja. Thanks
