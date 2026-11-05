# CyberShield

CyberShield adalah aplikasi web untuk melakukan pemeriksaan awal terhadap URL atau tautan yang mencurigakan, khususnya tautan yang memiliki indikasi phishing.

Aplikasi ini dikembangkan sebagai prototype untuk mata kuliah Pengembangan Aplikasi Web (PWA). Analisis pada versi ini menggunakan pendekatan rule-based dan bertujuan sebagai edukasi awal bagi pengguna sebelum mengakses tautan yang tidak dikenal.

## Tujuan

CyberShield dibuat untuk membantu pengguna:

- Mengenali ciri-ciri URL yang mencurigakan.
- Melakukan pemeriksaan awal terhadap sebuah URL.
- Memahami tingkat risiko berdasarkan beberapa indikator.
- Mendapatkan rekomendasi keamanan sebelum membuka tautan.

## Target Pengguna

CyberShield ditujukan untuk pengguna umum yang ingin melakukan pemeriksaan awal terhadap tautan yang diterima melalui internet, media sosial, pesan instan, maupun sumber lainnya.

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

## Halaman

CyberShield memiliki tiga halaman utama:

- `/` — Halaman utama dan pengenalan CyberShield.
- `/analyze` — Halaman untuk melakukan analisis URL.
- `/about` — Informasi mengenai CyberShield dan cara kerja analisis.

## Teknologi

- Next.js
- React
- TypeScript
- Tailwind CSS
- ESLint

## Struktur Project

```text
app/
├── about/
│   └── page.tsx
├── analyze/
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

lib/
└── url-analyzer.ts

types/
└── analysis.ts