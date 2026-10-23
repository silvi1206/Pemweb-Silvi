# CyberShield

CyberShield adalah aplikasi web untuk melakukan pemeriksaan awal terhadap URL atau tautan yang mencurigakan, khususnya tautan yang memiliki indikasi phishing.

Aplikasi ini dikembangkan sebagai prototype untuk mata kuliah Pengembangan Aplikasi Web (PWA). Analisis pada versi ini menggunakan pendekatan rule-based dan bertujuan sebagai edukasi awal bagi pengguna sebelum mengakses tautan yang tidak dikenal.

Pada pengembangan komponen kriptografi, CyberShield juga menggunakan fungsi kriptografi dasar untuk membantu menjaga integritas dan menyediakan representasi aman dari data yang digunakan dalam proses analisis.

> **Catatan prototype:** Versi saat ini masih merupakan prototype client-side. Belum terdapat backend, database, sistem autentikasi pengguna, atau layanan threat-intelligence eksternal. Komponen kriptografi pada versi ini dirancang sebagai fondasi untuk pengembangan keamanan pada versi berikutnya.

---

## Tujuan

CyberShield dibuat untuk membantu pengguna:

- Mengenali ciri-ciri URL yang mencurigakan.
- Melakukan pemeriksaan awal terhadap sebuah URL.
- Memahami tingkat risiko berdasarkan beberapa indikator.
- Mendapatkan rekomendasi keamanan sebelum membuka tautan.
- Memahami bagaimana data hasil analisis dapat dilindungi dari perubahan yang tidak terdeteksi.

---

## Target Pengguna

CyberShield ditujukan untuk pengguna umum yang ingin melakukan pemeriksaan awal terhadap tautan yang diterima melalui internet, media sosial, pesan instan, maupun sumber lainnya.

---

## Fitur Utama

### 1. URL Security Analyzer

Pengguna dapat memasukkan URL untuk dianalisis berdasarkan beberapa indikator keamanan.

### 2. Risk Score

Sistem memberikan skor risiko berdasarkan hasil pemeriksaan URL.

### 3. Security Indicators

Analisis menggunakan beberapa indikator, antara lain:

- Penggunaan HTTPS.
- Domain atau TLD yang mencurigakan.
- Kata kunci yang umum ditemukan pada tautan phishing.
- Ekstensi file yang berpotensi berbahaya.

### 4. Recommendation

Setelah analisis selesai, sistem memberikan hasil dan rekomendasi keamanan kepada pengguna.

### 5. Sample URL

Tersedia beberapa URL contoh untuk membantu pengguna mencoba fitur analisis.

---

# Kebutuhan Kriptografi

Komponen kriptografi pada CyberShield ditentukan berdasarkan data yang digunakan oleh proses analisis URL dan kebutuhan untuk menjaga integritas data.

Pada versi prototype ini terdapat tiga kebutuhan utama:

| Data | Tujuan Keamanan | Komponen Kriptografi | Prioritas |
|---|---|---|---|
| URL yang dianalisis | Membuat representasi/fingerprint yang konsisten untuk identifikasi dan pemeriksaan integritas data | SHA-256 | Tinggi |
| Hasil analisis URL | Mendeteksi perubahan atau manipulasi terhadap hasil analisis | HMAC-SHA-256 | Tinggi |
| Detection rules | Membantu mendeteksi perubahan terhadap aturan yang digunakan untuk menentukan indikator risiko | SHA-256 / HMAC-SHA-256 | Tinggi |

## 1. URL yang Dianalisis

URL merupakan data utama yang diproses oleh CyberShield.

SHA-256 digunakan untuk menghasilkan fingerprint dari URL. Hasil fingerprint tidak digunakan untuk mengembalikan URL asli, tetapi sebagai representasi tetap dari input.

Contoh alur:

```text
URL
 |
 v
TextEncoder
 |
 v
SHA-256
 |
 v
64-character hexadecimal fingerprint
```

SHA-256 merupakan fungsi hash satu arah. Artinya, hasil hash tidak dirancang untuk didekripsi kembali menjadi URL asli.

Penggunaan SHA-256 pada komponen ini bertujuan untuk menyediakan representasi data yang konsisten sehingga perubahan pada URL menghasilkan fingerprint yang berbeda.

---

## 2. Hasil Analisis URL

Hasil analisis CyberShield terdiri dari informasi seperti:

- Risk score.
- Risk level.
- Security indicators.
- Recommendation.

Data tersebut perlu memiliki mekanisme untuk mendeteksi apabila terjadi perubahan yang tidak semestinya.

Untuk kebutuhan tersebut digunakan HMAC-SHA-256.

Alurnya:

```text
Analysis Result
      +
HMAC Runtime Key
      |
      v
 HMAC-SHA-256
      |
      v
Authentication Tag
```

HMAC menggunakan secret key sehingga pihak yang tidak memiliki key tidak dapat menghasilkan authentication tag yang valid untuk data yang telah dimodifikasi.

Contohnya, apabila hasil awal adalah:

```text
Risk Score: 85
Risk Level: Dangerous
```

kemudian seseorang mengubahnya menjadi:

```text
Risk Score: 10
Risk Level: Safe
```

HMAC yang dihasilkan dari data awal tidak akan valid ketika diverifikasi terhadap data yang telah dimanipulasi.

Dengan demikian, HMAC digunakan untuk membantu mendeteksi perubahan terhadap data hasil analisis.

---

## 3. Detection Rules

Detection rules digunakan oleh analyzer untuk menentukan indikator keamanan pada URL.

Pada versi prototype, aturan deteksi masih berada pada sisi aplikasi. Oleh karena itu, aturan tersebut belum memiliki perlindungan server-side.

SHA-256 atau HMAC dapat digunakan sebagai fondasi untuk memeriksa integritas rules pada pengembangan berikutnya.

Contoh konsep:

```text
Detection Rules
      |
      v
SHA-256 / HMAC-SHA-256
      |
      v
Integrity Representation
```

Jika rules berubah, fingerprint atau authentication tag yang dihasilkan juga akan berubah.

Pada versi berikutnya, detection rules dapat dipindahkan ke sisi server dan diverifikasi sebelum digunakan oleh proses analisis.

---

# Rancangan Komponen Kriptografi

Komponen kriptografi CyberShield dirancang dengan pendekatan sederhana agar dapat digunakan sebagai fondasi pengembangan keamanan pada versi berikutnya.

## Komponen 1 — SHA-256 URL Fingerprint

### Masukan

String URL yang akan dianalisis.

Contoh:

```text
https://example.com
```

### Proses

1. URL diterima sebagai string.
2. String dikonversi menjadi byte menggunakan `TextEncoder`.
3. Data diproses menggunakan SHA-256 melalui Web Crypto API.
4. Hasil `ArrayBuffer` dikonversi menjadi representasi hexadecimal.

### Keluaran

Fingerprint SHA-256 dengan panjang 64 karakter hexadecimal.

Contoh format:

```text
a3b2c1d4...64-character-hexadecimal-value
```

Nilai contoh tersebut hanya merupakan ilustrasi. Data atau fingerprint nyata tidak ditulis sebagai secret di repository.

### Representasi Data

Input:

```text
string
```

Data internal:

```text
UTF-8 encoded bytes
```

Output:

```text
64-character hexadecimal string
```

---

## Komponen 2 — HMAC-SHA-256

### Masukan

- Data hasil analisis dalam bentuk string.
- Secret key yang dibuat pada saat runtime.

Contoh data:

```text
Risk score: 85
Risk level: Dangerous
```

### Proses

1. Data hasil analisis dikonversi menjadi byte menggunakan `TextEncoder`.
2. Sistem menghasilkan HMAC key menggunakan Web Crypto API.
3. Data diproses menggunakan HMAC dengan SHA-256.
4. Hasil signature dikonversi menjadi hexadecimal.
5. HMAC dapat diverifikasi kembali terhadap data menggunakan key yang sama.

### Keluaran

Authentication tag dalam bentuk hexadecimal.

Format:

```text
64-character hexadecimal HMAC
```

### Representasi Data

Input:

```text
string + CryptoKey
```

Output:

```text
64-character hexadecimal string
```

---

# Sumber Keacakan

Secret key untuk HMAC tidak ditulis secara hardcode dan tidak disimpan di repository.

Key dibuat pada saat runtime menggunakan:

```text
crypto.subtle.generateKey()
```

Web Crypto API menggunakan sumber keacakan kriptografis dari lingkungan runtime untuk menghasilkan key.

Alurnya:

```text
Web Crypto API
      |
      v
Cryptographic Randomness
      |
      v
HMAC CryptoKey
```

Dengan pendekatan ini, repository tidak berisi:

- private key,
- API key,
- password,
- authentication token,
- atau secret key statis.

Key hanya digunakan pada saat runtime untuk kebutuhan pengujian dan proses HMAC.

---

# Teknologi Kriptografi

Komponen kriptografi menggunakan **Web Crypto API**, yaitu API kriptografi bawaan platform JavaScript yang menyediakan primitive kriptografi standar.

Primitive yang digunakan:

- SHA-256 melalui `crypto.subtle.digest()`.
- HMAC-SHA-256 melalui `crypto.subtle.sign()`.
- HMAC verification melalui `crypto.subtle.verify()`.
- Runtime key generation melalui `crypto.subtle.generateKey()`.

CyberShield tidak menggunakan cipher klasik seperti:

- Caesar Cipher.
- Vigenere Cipher.
- Substitution Cipher.

Sandi klasik tidak digunakan untuk melindungi data produk.

---

# Pengujian Kriptografi

CyberShield menggunakan **Vitest** sebagai test runner untuk automated testing.

Pengujian mencakup SHA-256 dan HMAC-SHA-256.

## SHA-256

Terdapat empat skenario pengujian:

1. Memastikan hash memiliki panjang 64 karakter.
2. Memastikan input yang sama menghasilkan hash yang sama.
3. Memastikan perubahan URL menghasilkan hash yang berbeda.
4. Memastikan input kosong tetap menghasilkan output SHA-256 yang valid sebagai boundary test.

## HMAC-SHA-256

Terdapat empat skenario pengujian:

1. Memastikan HMAC memiliki panjang 64 karakter.
2. Memastikan data yang tidak berubah menghasilkan verifikasi yang valid.
3. Memastikan data yang telah dimanipulasi ditolak.
4. Memastikan HMAC yang salah ditolak.

Total terdapat **8 automated test**.

Hasil pengujian terakhir:

```text
Test Files  2 passed (2)
Tests       8 passed (8)
```

Semua test berhasil dijalankan.

---

# Struktur Project

```text
app/
├── about/
│   └── page.tsx
├── analyze/
│   ├── [id]/
│   │   └── page.tsx
│   └── page.tsx
├── latihan-routing/
│   ├── [id]/
│   │   └── page.tsx
│   └── page.tsx
├── page.tsx
├── layout.tsx
└── globals.css

components/
├── AnalysisResult.tsx
├── FeatureCard.tsx
├── Footer.tsx
├── HeroSection.tsx
├── Navbar.tsx
├── RiskScore.tsx
├── SampleUrl.tsx
├── SecurityIndicator.tsx
└── UrlAnalyzer.tsx

data/
└── latihan-routing.ts

docs/
└── milestone-1/
    ├── Lighthouse/
    └── Screenshot/

lib/
├── crypto/
│   ├── hash.ts
│   ├── hmac.ts
│   └── test/
│       ├── hash.test.ts
│       └── hmac.test.ts
└── url-analyzer.ts

security/
├── asset-inventory.md
├── dfd.md
├── risk-register.md
├── security-controls.md
└── threat-model.md

types/
└── analysis.ts
```

---

# Halaman

CyberShield memiliki halaman-halaman berikut:

- `/` — Halaman utama dan pengenalan CyberShield.
- `/analyze` — Halaman analisis URL interaktif (client-side input form).
- `/analyze/[id]` — Halaman Dynamic Route untuk analisis studi kasus sampel URL tertentu (ID 1–5).
- `/about` — Informasi mengenai CyberShield dan cara kerja analisis.
- `/latihan-routing` — Halaman daftar modul latihan Dynamic Routing Next.js.
- `/latihan-routing/[id]` — Halaman detail modul latihan berbasis parameter ID dinamis (ID 1–5).

---

# Teknologi

- Next.js
- React
- TypeScript
- Tailwind CSS
- ESLint
- Vitest
- Web Crypto API

---

# Cara Menjalankan

## 1. Clone repository

```bash
git clone <repository-url>
cd cybershield
```

## 2. Install dependency

```bash
npm install
```

## 3. Menjalankan development server

```bash
npm run dev
```

Kemudian buka:

```text
http://localhost:3000
```

## 4. Menjalankan pemeriksaan TypeScript

```bash
npx tsc --noEmit
```

## 5. Menjalankan automated test

```bash
npm test
# atau
npx vitest run
```

Expected result:

```text
Test Files  2 passed (2)
Tests       8 passed (8)
```

## 6. Menjalankan lint

```bash
npm run lint
```

## 7. Membuat production build

```bash
npm run build
```

---

# Keamanan dan Batasan Prototype

CyberShield versi ini masih merupakan prototype.

Beberapa keterbatasan saat ini:

- Analisis URL masih menggunakan rule-based analysis.
- Belum terdapat backend.
- Belum terdapat database.
- Belum terdapat sistem autentikasi pengguna.
- Belum terdapat integrasi threat-intelligence eksternal.
- Detection rules masih berada pada sisi aplikasi.
- Komponen kriptografi belum menggantikan kebutuhan security architecture pada backend.
- Secret HMAC tidak disimpan secara permanen.
- Belum terdapat centralized logging.

Oleh karena itu, komponen kriptografi pada versi ini diposisikan sebagai **komponen dasar/fondasi** yang dapat dikembangkan pada versi berikutnya.

Untuk pengembangan lebih lanjut, komponen analisis dan detection rules yang bersifat sensitif dapat dipindahkan ke server. Secret key juga dapat dikelola menggunakan secret management yang sesuai sehingga tidak disimpan di source code.

---

# Status Prototype

Versi ini mencakup:

- URL Security Analyzer.
- Risk Score.
- Security Indicators.
- Recommendation.
- Sample URL.
- SHA-256 URL fingerprint.
- HMAC-SHA-256 untuk pemeriksaan integritas data.
- Automated cryptographic testing.

Komponen kriptografi dirancang agar dapat dikembangkan lebih lanjut bersamaan dengan pengembangan backend dan security architecture CyberShield.