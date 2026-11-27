# CyberShield (v0.2 — Milestone 2)

CyberShield adalah aplikasi web cerdas untuk melakukan deteksi dini terhadap URL atau tautan yang mencurigakan, khususnya tautan yang berpotensi phishing dan malware.

Aplikasi ini dikembangkan untuk memenuhi kriteria evaluasi terpadu pada tiga pilar:
1. **Pengembangan Aplikasi Web (PAW)**: Next.js 16 (App Router), React 19, Server Actions, validasi Zod ketat, dan persistensi database relasional PostgreSQL menggunakan Prisma ORM.
2. **Kriptografi**: Implementasi fungsi hash satu arah SHA-256, Message Authentication Code (HMAC-SHA-256), dan Authenticated Encryption with Associated Data (AEAD AES-256-GCM) dengan CSPRNG IV dan fail-closed decryption.
3. **Keamanan Komputasi dan Siber (KKS)**: Role-Based Access Control (RBAC), password hashing lambat (Scrypt + CSPRNG salt + constant-time comparison), pengerasan kontainer Docker non-root, segmentasi jaringan, serta pemindaian kerentanan (Trivy) dan SBOM (CycloneDX).

> **Status Rilis Milestone 2 (`sec-0.2`):**
> Arsitektur telah bertransisi dari prototype client-side murni (Milestone 1) menjadi full-stack web application dengan backend relasional terenkripsi, Server Actions, pengujian otomatis menyeluruh (35 skenario lolos), serta panduan hardening lingkungan produksi.

---

## Daftar Isi
- [Tujuan dan Fitur Utama](#tujuan-dan-fitur-utama)
- [Arsitektur dan Model Data Relasional](#arsitektur-dan-model-data-relasional)
- [Komponen Kriptografi](#komponen-kriptografi)
- [Kontrol Keamanan Komputasi dan Siber](#kontrol-keamanan-komputasi-dan-siber)
- [Hardening Kontainer dan Manajemen Kerentanan](#hardening-kontainer-dan-manajemen-kerentanan)
- [Tech Stack](#tech-stack)
- [Panduan Instalasi dan Menjalankan Proyek](#panduan-instalasi-dan-menjalankan-proyek)
- [Hasil Pengujian Otomatis](#hasil-pengujian-otomatis)
- [Dokumentasi dan Laporan Terkait](#dokumentasi-dan-laporan-terkait)

---

## Tujuan dan Fitur Utama

### 1. URL Security Analyzer
Menganalisis karakteristik URL secara komprehensif, mencakup protokol HTTPS, reputasi Top-Level Domain (TLD), pola domain tipuan (*typosquatting*), kata kunci phishing berisiko tinggi, dan ekstensi berkas berbahaya.

### 2. Relational History & Full CRUD Management
- **Dashboard Riwayat Analisis (`/history`)**: Menampilkan daftar riwayat pemindaian URL yang tersimpan di PostgreSQL lengkap dengan statistik risiko, status verifikasi integritas, filter pencarian dinamis, dan hapus data.
- **Detail & Manajemen Indikator (`/history/[id]`)**: Antarmuka lengkap untuk memperbarui entitas analisis, menambah indikator baru, mengedit status pemicu indikator, serta menghapus entitas dengan relasi cascade.

### 3. Server Actions & Validasi Ketat Zod
Operasi backend tidak menggunakan endpoint mutasi raw yang rentan, melainkan Next.js Server Actions yang diamankan dengan validasi per-field menggunakan Zod (`lib/validation.ts`), menolak manipulasi payload abnormal.

### 4. Demonstrasi Dynamic Routing (`/latihan-routing` & `/latihan-routing/[id]`)
Halaman latihan terisolasi yang mendemonstrasikan konsep Dynamic Segment `[id]`, `generateStaticParams()`, penanganan error, dan validasi ID rute Next.js.

---

## Arsitektur dan Model Data Relasional

CyberShield menggunakan **PostgreSQL** yang dihubungkan melalui **Prisma ORM 7.10.1** dengan model relasional 1-ke-banyak (*one-to-many*):

```text
┌─────────────────────────────────┐
│            Analysis             │
├─────────────────────────────────┤
│ id: String (UUID, PK)           │
│ url: String                     │
│ riskScore: Int                  │
│ riskLevel: String               │
│ recommendation: String          │
│ urlFingerprint: String          │
│ integrityTag: String            │
│ encryptedNotes: String? (AEAD)  │
│ createdAt: DateTime             │
│ updatedAt: DateTime             │
└──────────────┬──────────────────┘
               │ 1
               │
               │ * (onDelete: Cascade)
┌──────────────▼──────────────────┐
│        AnalysisIndicator        │
├─────────────────────────────────┤
│ id: String (UUID, PK)           │
│ analysisId: String (FK)         │
│ name: String                    │
│ description: String             │
│ triggered: Boolean              │
│ severity: String                │
│ createdAt: DateTime             │
└─────────────────────────────────┘
```

- **Integritas Referensial**: Penghapusan entitas `Analysis` secara otomatis menghapus seluruh `AnalysisIndicator` terkait melalui aturan `onDelete: Cascade`.
- **Seeding Idempoten**: Disediakan skrip `prisma/seed.ts` yang dapat dijalankan berulang tanpa menduplikasi data uji.

---

## Komponen Kriptografi

| Primitif | Algoritma / Spesifikasi | Implementasi File | Tujuan Keamanan |
|---|---|---|---|
| **Fingerprint** | SHA-256 (NIST FIPS 180-4) | [`lib/crypto/hash.ts`](file:///d:/Project%20CyberShield/cybershield/lib/crypto/hash.ts) | Identifikasi statis dan representasi unik dari URL input |
| **Data Integrity** | HMAC-SHA-256 (RFC 2104) | [`lib/crypto/hmac.ts`](file:///d:/Project%20CyberShield/cybershield/lib/crypto/hmac.ts) | Verifikasi integritas hasil analisis terhadap manipulasi |
| **Kerahasiaan & Integritas** | AES-256-GCM AEAD (NIST SP 800-38D) | [`lib/crypto/aead.ts`](file:///d:/Project%20CyberShield/cybershield/lib/crypto/aead.ts) | Enkripsi data sensitif (catatan analis) + autentikasi tag |

### Alur Kerja AEAD (AES-256-GCM):
```text
Plaintext (Catatan Rahasia) + AAD (Metadata ID)
                    │
   [256-bit Key] + [96-bit CSPRNG IV]
                    │
                    ▼
           AES-256-GCM Engine
                    │
                    ▼
Ciphertext + 128-bit Authentication Tag (Hex Encoded)
```
- **Fail-Closed**: Jika ciphertext, tag autentikasi, atau data pelengkap (AAD) mengalami perubahan 1 bit saja, dekripsi langsung ditolak dengan melempar pengecualian (*fail-closed*).
- **Manajemen Kunci**: Kunci di-load dari environment variable `APP_CRYPTO_KEY_HEX` atau dihasilkan saat runtime via CSPRNG (`crypto.getRandomValues`).

---

## Kontrol Keamanan Komputasi dan Siber

### 1. Role-Based Access Control (RBAC)
Diimplementasikan pada [`lib/auth/rbac.ts`](file:///d:/Project%20CyberShield/cybershield/lib/auth/rbac.ts) dengan pemisahan izin:
- **Guest**: Melakukan analisis URL publik dan membaca informasi umum.
- **User**: Menyimpan riwayat analisis, melihat riwayat sendiri, dan menambah indikator.
- **Admin**: Akses penuh, termasuk modifikasi analisis, penghapusan data, dan pengelolaan sistem.

### 2. Slow Password Hashing
Diimplementasikan pada [`lib/auth/password.ts`](file:///d:/Project%20CyberShield/cybershield/lib/auth/password.ts):
- **Algoritma**: Scrypt (N=16384, r=8, p=1, keyLength=64 byte).
- **Garam Acak**: 16 byte dari CSPRNG (`randomBytes(16)`).
- **Proteksi Serangan Timing**: Komparasi hash menggunakan `timingSafeEqual` untuk mencegah evaluasi berbasis perbedaan waktu respon.

---

## Hardening Kontainer dan Manajemen Kerentanan

### 1. Container Hardening
- **Dockerfile Multi-Stage**: Menggunakan `node:22-alpine` minimal, memisahkan tahap kompilasi dan runtime.
- **Non-Root Execution**: Aplikasi dijalankan di bawah akun terbatas `nextjs:1001` (`USER nextjs`).
- **Capability Dropping**: Direktif `cap_drop: [ALL]` pada `docker-compose.yml` mencabut hak Linux yang tidak dibutuhkan.
- **Isolasi Jaringan**: PostgreSQL berjalan pada Docker bridge privat `cybershield-net`. Port 5432 **tidak diekspos** ke host publik.

### 2. Vulnerability Scanning & SBOM
- Pemindaian citra kontainer menggunakan **Trivy** menunjukkan penurunan kerentanan dari 17 CVE (versi unhardened Debian) menjadi **0 Critical/High CVE** pada citra Alpine multi-stage.
- **Software Bill of Materials (SBOM)** diekspor dalam format standar **CycloneDX 1.5 JSON** pada [`security/evidence/sbom.cdx.json`](file:///d:/Project%20CyberShield/cybershield/security/evidence/sbom.cdx.json).

---

## Tech Stack

- **Framework**: Next.js 16.3.8 (App Router, Turbopack)
- **UI Library**: React 19.2.8 & Tailwind CSS 4
- **Database & ORM**: PostgreSQL 16 & Prisma 7.10.1 (`@prisma/adapter-pg`)
- **Skema Validasi**: Zod 4.6.7
- **Kriptografi & Auth**: Web Crypto API, Node.js Crypto (Scrypt, timingSafeEqual, AES-GCM)
- **Pengujian**: Vitest 3.2.7
- **Kontainer**: Docker Engine & Docker Compose

---

## Panduan Instalasi dan Menjalankan Proyek

### 1. Clone & Install Dependensi
```bash
git clone <repository-url>
cd cybershield
npm install
```

### 2. Konfigurasi Lingkungan
Salin file template `.env.example` menjadi `.env` dan sesuaikan koneksi database Anda:
```bash
cp .env.example .env
```
Isi konfigurasi pada `.env`:
```env
DATABASE_URL="postgresql://cybershield:cybershield_secret@localhost:5432/cybershield?schema=public"
APP_CRYPTO_KEY_HEX="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

### 3. Migrasi Database dan Seeding
```bash
# Sinkronisasi skema database
npm run prisma:migrate

# Jalankan data seed idempoten
npm run prisma:seed
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka browser pada `http://localhost:3000`.

### 5. Menjalankan via Docker Compose (Hardened Production Stack)
```bash
docker compose up --build -d
```

---

## Hasil Pengujian Otomatis

Seluruh modul telah divalidasi dengan rangkaian automated tests:
```bash
npm test
```

Hasil eksekusi:
```text
 ✓ lib/crypto/test/hash.test.ts (4 tests)
 ✓ lib/crypto/test/hmac.test.ts (4 tests)
 ✓ lib/crypto/test/aead.test.ts (6 tests)
 ✓ test/security.test.ts (9 tests)
 ✓ test/aead-rotation.test.ts (3 tests)
 ✓ test/aead-integration.test.ts (10 tests)
 ✓ test/web-crud.test.ts (12 tests)
 ✓ test/rbac-auth.test.ts (53 tests)

 Test Files  8 passed (8)
      Tests  101 passed (101)
   Duration  4.37s
```

Verifikasi kode lainnya:
```bash
npx prisma migrate status # Verifikasi status migrasi DB (up to date)
npx tsc --noEmit          # Validasi static typing (0 errors)
npm run lint              # Validasi linter ESLint (0 errors, 0 warnings)
npm run build             # Build Next.js 16 (25 routes terkompilasi sukses)
```

---

## Dokumentasi dan Laporan Terkait

Dokumentasi teknis mendalam tersedia pada direktori repositori:
- **Audit & Implementasi Milestone 2**:
  - [`docs/milestone-2/SESSION-IMPLEMENTATION-REPORT.md`](file:///d:/Project%20CyberShield/cybershield/docs/milestone-2/SESSION-IMPLEMENTATION-REPORT.md)
  - [`docs/milestone-2/RBAC-CRITICAL-FIX-REPORT.md`](file:///d:/Project%20CyberShield/cybershield/docs/milestone-2/RBAC-CRITICAL-FIX-REPORT.md)
  - [`docs/milestone-2/RBAC-POST-IMPLEMENTATION-AUDIT.md`](file:///d:/Project%20CyberShield/cybershield/docs/milestone-2/RBAC-POST-IMPLEMENTATION-AUDIT.md)
  - [`docs/milestone-2/RBAC-IMPLEMENTATION-REPORT.md`](file:///d:/Project%20CyberShield/cybershield/docs/milestone-2/RBAC-IMPLEMENTATION-REPORT.md)
  - [`docs/milestone-2/AEAD-ROTATION-FINAL-AUDIT.md`](file:///d:/Project%20CyberShield/cybershield/docs/milestone-2/AEAD-ROTATION-FINAL-AUDIT.md)
  - [`docs/milestone-2/AUDIT-REPORT.md`](file:///d:/Project%20CyberShield/cybershield/docs/milestone-2/AUDIT-REPORT.md)
  - [`docs/milestone-2/POST-IMPLEMENTATION-AUDIT.md`](file:///d:/Project%20CyberShield/cybershield/docs/milestone-2/POST-IMPLEMENTATION-AUDIT.md)
  - [`docs/milestone-2/AEAD-INTEGRATION-REPORT.md`](file:///d:/Project%20CyberShield/cybershield/docs/milestone-2/AEAD-INTEGRATION-REPORT.md)
  - [`docs/milestone-2/AEAD-KEY-REMEDIATION.md`](file:///d:/Project%20CyberShield/cybershield/docs/milestone-2/AEAD-KEY-REMEDIATION.md)
  - [`docs/milestone-2/IMPLEMENTATION-REPORT.md`](file:///d:/Project%20CyberShield/cybershield/docs/milestone-2/IMPLEMENTATION-REPORT.md)
  - [`docs/milestone-2/web-testing.md`](file:///d:/Project%20CyberShield/cybershield/docs/milestone-2/web-testing.md)
  - [`docs/milestone-2/crypto-testing.md`](file:///d:/Project%20CyberShield/cybershield/docs/milestone-2/crypto-testing.md)
- **Keputusan Arsitektur & Log AI**:
  - [`KEPUTUSAN.md`](file:///d:/Project%20CyberShield/cybershield/KEPUTUSAN.md)
  - [`AI_LOG.md`](file:///d:/Project%20CyberShield/cybershield/AI_LOG.md)
- **Keamanan Siber & Hardening**:
  - [`security/access-tests.md`](file:///d:/Project%20CyberShield/cybershield/security/access-tests.md)
  - [`security/password-hashing.md`](file:///d:/Project%20CyberShield/cybershield/security/password-hashing.md)
  - [`security/security-controls.md`](file:///d:/Project%20CyberShield/cybershield/security/security-controls.md)
  - [`security/vm-hardening.md`](file:///d:/Project%20CyberShield/cybershield/security/vm-hardening.md)
  - [`security/container-hardening.md`](file:///d:/Project%20CyberShield/cybershield/security/container-hardening.md)
  - [`security/image-scanning.md`](file:///d:/Project%20CyberShield/cybershield/security/image-scanning.md)
