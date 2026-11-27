# AI_LOG — Catatan Penggunaan Kecerdasan Buatan (AI) pada CyberShield

## 1. Ikhtisar Penggunaan AI

Pengembangan CyberShield pada **Milestone 1 (v0.1)** dan **Milestone 2 (v0.2)** memanfaatkan AI (*Large Language Model Assistant*) sebagai rekan berpasangan (*pair programmer*) untuk analisis kebutuhan, perancangan arsitektur, akselerasi implementasi kode, penyusunan skenario pengujian otomatis, dan penulisan dokumentasi teknis.

Prinsip utama yang dipegang teguh:
- **Human Oversight**: Seluruh keputusan arsitektur, parameter algoritma, penanganan data sensitif, dan penerimaan fungsional diverifikasi secara langsung oleh pengembang.
- **No Secret Injection**: AI dilarang keras menyematkan secret, credential, private key, atau informasi sensitif secara hardcoded ke dalam source code.
- **Evidence-Based Validation**: Setiap output kode dari AI wajib diverifikasi melalui build compiler (`tsc`), linter (`eslint`), dan suite pengujian otomatis (`vitest`).

---

## 2. Kontribusi AI pada Milestone 1 (v0.1)

Pada Milestone 1, AI digunakan sebagai alat bantu untuk:
1. **Perancangan Kriptografi Dasar**:
   - SHA-256 untuk fingerprint URL (`lib/crypto/hash.ts`).
   - HMAC-SHA-256 untuk integritas hasil analisis pada client runtime (`lib/crypto/hmac.ts`).
2. **Penyusunan Pengujian Awal**:
   - 4 skenario test hash (`lib/crypto/test/hash.test.ts`).
   - 4 skenario test HMAC (`lib/crypto/test/hmac.test.ts`).
3. **Dokumentasi Awal**:
   - Menjelaskan representasi data, encoding UTF-8, dan konversi hexadecimal.

---

## 3. Kontribusi AI pada Milestone 2 (v0.2)

Pada Milestone 2, cakupan diperluas mencakup pemenuhan target tiga mata kuliah secara komprehensif:

### A. Mata Kuliah Pengembangan Aplikasi Web (PAW)
- **Desain Skema Relasional**: Membantu merancang skema relasional 1-ke-banyak antara `Analysis` dan `AnalysisIndicator` dengan `onDelete: Cascade` pada [`prisma/schema.prisma`](file:///d:/Project%20CyberShield/cybershield/prisma/schema.prisma).
- **Automasi Seeding**: Menyusun skrip seeding idempoten [`prisma/seed.ts`](file:///d:/Project%20CyberShield/cybershield/prisma/seed.ts) menggunakan data sintetik realistis dan Node.js crypto primitives.
- **Server Actions & Validasi Zod**:
  - Mengimplementasikan skema validasi ketat per-field di [`lib/validation.ts`](file:///d:/Project%20CyberShield/cybershield/lib/validation.ts).
  - Mengimplementasikan Server Actions lengkap (CRUD) di [`app/actions/analysis.ts`](file:///d:/Project%20CyberShield/cybershield/app/actions/analysis.ts) dan [`app/actions/indicators.ts`](file:///d:/Project%20CyberShield/cybershield/app/actions/indicators.ts).
- **Pengembangan UI Relasional**:
  - Halaman riwayat terpusat di [`app/history/page.tsx`](file:///d:/Project%20CyberShield/cybershield/app/history/page.tsx) dengan visual tema dusty pink, statistik indikator, pencarian, dan filtering.
  - Halaman detail relasional di [`app/history/[id]/page.tsx`](file:///d:/Project%20CyberShield/cybershield/app/history/[id]/page.tsx) dengan form edit analisis dan manajemen indikator (tambah, edit status, hapus).
- **Penyusunan Automated Test Suite Web**:
  - 12 skenario pengujian relasional dan validasi Zod pada [`test/web-crud.test.ts`](file:///d:/Project%20CyberShield/cybershield/test/web-crud.test.ts).

### B. Mata Kuliah Kriptografi
- **Implementasi Authenticated Encryption with Associated Data (AEAD)**:
  - Merancang modul [`lib/crypto/aead.ts`](file:///d:/Project%20CyberShield/cybershield/lib/crypto/aead.ts) berbasis AES-256-GCM standar NIST SP 800-38D.
  - Implementasi IV 96-bit unik dari CSPRNG Web Crypto API per operasi enkripsi.
  - Autentikasi integritas data kontekstual (AAD) dan mekanisme *fail-closed* saat tag atau ciphertext dirusak.
  - **Integrasi Penuh ke Persistensi Basis Data (`encryptedNotes`)**: Menghubungkan fungsi `encryptNote` dan `decryptNote` ke Server Actions (`app/actions/analysis.ts`) dan API Routes (`app/api/analysis/route.ts`).
  - **Format Penyimpanan Berversi**: Menerapkan format `enc:v1:<ivHex>:<tagHex>:<ciphertextHex>` dengan AAD deterministik `analysis:${analysisId}:encryptedNotes`.
  - **Skrip Backfill & Migrasi Data Warisan**: Membuat `prisma/backfill-notes.ts` untuk mengonversi data plaintext lama ke format `enc:v1:` secara aman tanpa menghapus data.
  - **Penyempurnaan Seeding**: Memperbarui `prisma/seed.ts` agar menyimpan catatan awal dalam kondisi terenkripsi AES-256-GCM.
  - **Remediasi & Prosedur Rotasi Kunci**: Mengidentifikasi dan membersihkan string kunci fallback hardcoded, menyusun skrip rotasi atomik `prisma/rotate-key.ts`, memensiunkan kunci lama dan menghasilkan kunci baru CSPRNG di `.env`, serta menyusun test suite rotasi `test/aead-rotation.test.ts`.
- **Penyempurnaan HMAC & Ekspor-Impor Kunci**:
  - Serialisasi format hex untuk kunci kriptografi di environment variables (`AEAD_ENCRYPTION_KEY_HEX`).
  - Template konfigurasi aman pada [`.env.example`](file:///d:/Project%20CyberShield/cybershield/.env.example).
- **Penyusunan Dokumen Keputusan & Pengujian**:
  - Penyusunan log pertimbangan arsitektur pada [`KEPUTUSAN.md`](file:///d:/Project%20CyberShield/cybershield/KEPUTUSAN.md).
  - 6 skenario automated unit testing AEAD pada [`lib/crypto/test/aead.test.ts`](file:///d:/Project%20CyberShield/cybershield/lib/crypto/test/aead.test.ts).
  - 10 skenario automated integration testing pada [`test/aead-integration.test.ts`](file:///d:/Project%20CyberShield/cybershield/test/aead-integration.test.ts) yang memverifikasi round-trip, CSPRNG nonce, fail-closed, penolakan plaintext lama, dan bukti raw ciphertext di PostgreSQL.

### C. Mata Kuliah Keamanan Komputasi dan Siber (KKS)
- **Implementasi Autentikasi Pengguna & Manajemen Sesi Kriptografis**:
  - Model entitas `User` dan relasi relasional opsional pada tabel `Analysis` (`userId`) di [`prisma/schema.prisma`](file:///d:/Project%20CyberShield/cybershield/prisma/schema.prisma).
  - Manajemen sesi berbasis signed token HMAC-SHA-256 dengan timing-safe verification dan cookie HTTP-only pada [`lib/auth/session.ts`](file:///d:/Project%20CyberShield/cybershield/lib/auth/session.ts).
  - Server Actions pendaftaran, login, logout, dan verifikasi sesi pada [`app/actions/auth.ts`](file:///d:/Project%20CyberShield/cybershield/app/actions/auth.ts).
  - REST API Routes untuk autentikasi di [`app/api/auth/`](file:///d:/Project%20CyberShield/cybershield/app/api/auth/).
  - Halaman antarmuka pengguna [`app/login/page.tsx`](file:///d:/Project%20CyberShield/cybershield/app/login/page.tsx) dan [`app/register/page.tsx`](file:///d:/Project%20CyberShield/cybershield/app/register/page.tsx) dengan quick demo switcher dan tema dusty pink.
- **Role-Based Access Control (RBAC) & Isolasi Data**:
  - Penegakan matriks hak akses 3 peran (`guest`, `user`, `admin`) pada seluruh Server Actions dan Route Handlers.
  - **Pencegahan IDOR (Insecure Direct Object Reference)**: Memastikan user hanya dapat mengakses data miliknya sendiri.
- **Slow Password Hashing**:
  - Implementasi fungsi hashing password lambat tahan GPU/ASIC menggunakan algoritma Scrypt (N=16384, r=8, p=1) dengan salt 16-byte dari CSPRNG dan komparasi waktu konstan `timingSafeEqual` pada [`lib/auth/password.ts`](file:///d:/Project%20CyberShield/cybershield/lib/auth/password.ts).
- **Pengujian Keamanan Perangkat Lunak**:
  - 9 skenario automated unit testing RBAC & Scrypt pada [`test/security.test.ts`](file:///d:/Project%20CyberShield/cybershield/test/security.test.ts).
  - 27 skenario automated integration testing pada [`test/rbac-auth.test.ts`](file:///d:/Project%20CyberShield/cybershield/test/rbac-auth.test.ts) yang menguji sesi, login/register, penolakan 403, dan proteksi IDOR.
- **Container Hardening & Orchestration**:
  - Multi-stage [`Dockerfile`](file:///d:/Project%20CyberShield/cybershield/Dockerfile) dengan non-root user (`nextjs:1001`), `dumb-init`, dan pembersihan attack surface.
  - Hardened [`docker-compose.yml`](file:///d:/Project%20CyberShield/cybershield/docker-compose.yml) dengan `cap_drop: [ALL]`, `no-new-privileges: true`, resource limits, dan isolasi jaringan PostgreSQL (port 5432 tidak diekspos ke host).
- **Dokumentasi Hardening, Scanning & SBOM**:
  - Penyusunan panduan VM hardening SSH & Lynis di [`security/vm-hardening.md`](file:///d:/Project%20CyberShield/cybershield/security/vm-hardening.md).
  - Penyusunan panduan container hardening di [`security/container-hardening.md`](file:///d:/Project%20CyberShield/cybershield/security/container-hardening.md).
  - Panduan pemindaian Trivy di [`security/image-scanning.md`](file:///d:/Project%20CyberShield/cybershield/security/image-scanning.md).
  - Template artefak scan dan CycloneDX 1.5 JSON SBOM di [`security/evidence/`](file:///d:/Project%20CyberShield/cybershield/security/evidence/).

### D. Implementasi Server-Side Session Management & Proteksi CSRF (Post-Audit Hardening)
- **Model Basis Data `Session`**:
  - Penambahan entitas `Session` pada [`prisma/schema.prisma`](file:///d:/Project%20CyberShield/cybershield/prisma/schema.prisma) dengan foreign key ke `User` (`onDelete: Cascade`), index `tokenHash`, `userId`, dan `expiresAt`.
  - Migrasi terkontrol Prisma (`20261107122000_add_session_model`) dengan persistensi penuh terhadap seluruh data existing.
- **Penyimpanan Token Kriptografis Zero-Trust**:
  - Pembangkitan token 32-byte acak dari CSPRNG (`randomBytes(32).toString('hex')`).
  - Penyimpanan eksklusif hash SHA-256 di PostgreSQL; token mentah tidak pernah masuk ke basis data.
  - Pengiriman token mentah hanya via HttpOnly, Secure, SameSite=Lax cookie.
- **Siklus Hidup Sesi & Pencabutan (Revocation)**:
  - Validasi sesi database per-request dengan verifikasi status pencabutan (`revokedAt`), masa berlaku (`expiresAt`), dan eksistensi user aktif.
  - Alur logout atomik yang menandai `revokedAt = new Date()` di database dan menghapus cookie klien.
  - Mekanisme pencabutan sesi oleh administrator (`revokeUserSessionsAction`).
- **Proteksi CSRF untuk API Routes Mutasi**:
  - Validasi kesesuaian header `Origin` vs `Host` pada modul [`lib/auth/csrf.ts`](file:///d:/Project%20CyberShield/cybershield/lib/auth/csrf.ts) untuk seluruh rute API mutasi (POST, PATCH, DELETE).
- **Pengujian & Dokumentasi**:
  - 13 skenario automated test siklus hidup sesi dan CSRF (`SESS-01` s/d `SESS-13`) pada [`test/rbac-auth.test.ts`](file:///d:/webprak/week7/test/rbac-auth.test.ts).
  - Laporan implementasi lengkap pada `docs/milestone-2/SESSION-IMPLEMENTATION-REPORT.md`.

### E. Modul 7 — Debugging dan Telaah Kode Kritis terhadap Kode Usulan AI
Pada Modul 7, dilakukan audit dan penelusuran galat (*debugging*) menggunakan **VS Code Node.js Debugger (`--inspect`)**, **Chrome DevTools (Network & Sources)**, **React Developer Tools (Components)**, serta **Log Query Prisma** terhadap empat pola galat yang dihasilkan oleh kode usulan AI:

1. **Galat 1 (Issue #11) — Konversi Boolean Keliru dengan `z.coerce.boolean()`**:
   - **Kode Awal AI**: Menggunakan `z.coerce.boolean()` untuk memvalidasi nilai `<select>` bertipe string `"true"` dan `"false"` pada status ketersediaan/keamanan (`isSafe` / `tersedia`).
   - **Galat yang Ditemukan**: Di bawah layar, `z.coerce.boolean()` memanggil `Boolean(input)`. Karena di JavaScript `Boolean("false")` bernilai `true` (string tidak kosong selalu *truthy*), pilihan `"Tidak tersedia"` / `"Berisiko (Tidak aman)"` selalu tersimpan sebagai `true` di PostgreSQL.
   - **Perbaikan Pengembang**: Mengganti `z.coerce.boolean()` menjadi `z.stringbool()` dari Zod 4 pada [`lib/validation.ts`](file:///d:/webprak/week7/lib/validation.ts) yang secara eksplisit memetakan `"true"` ke `true`, `"false"` ke `false`, dan menolak string lain sebagai galat validasi.
   - **Verifikasi**: Evaluasi Debug Console VS Code pada breakpoint Server Action membuktikan `hasil.data.isSafe === false` saat payload Network mengirimkan `"false"`, dengan tingkat keberhasilan 5 dari 5 percobaan.

2. **Galat 2 (Issue #12) — `redirect()` Tertelan Blok `try/catch` pada Aksi Hapus**:
   - **Kode Awal AI**: Memanggil `redirect("/history")` (atau `redirect("/katalog")`) di dalam blok `try { ... } catch (e) { console.log("Gagal menghapus"); }`.
   - **Galat yang Ditemukan**: Fungsi `redirect()` pada Next.js bekerja dengan melempar pengecualian kontrol alur khusus `NEXT_REDIRECT` (memiliki `e.message === "NEXT_REDIRECT"` dan `e.digest` berawalan `"NEXT_REDIRECT;"`). Blok `catch` menangkap galat tersebut sehingga navigasi ke halaman daftar batal dan terminal mencetak `"Gagal menghapus"` meskipun baris di PostgreSQL sebenarnya sudah terhapus.
   - **Perbaikan Pengembang**: Memindahkan pemanggilan `revalidatePath()` dan `redirect()` ke luar blok `try/catch` pada [`app/actions/analysis.ts`](file:///d:/webprak/week7/app/actions/analysis.ts).
   - **Verifikasi**: Menghapus entitas tanpa indikator berelasi langsung mengalihkan peramban ke `/history` tanpa memicu log galat palsu pada 5 dari 5 percobaan.

3. **Galat 3 (Issue #13) — Pelanggaran Foreign Key `P2003` dan Galat `P2025` Ditelan `catch` Kosong**:
   - **Kode Awal AI**: Menjalankan `prisma.analysis.delete({ where: { id } })` (atau `prisma.item.delete`) tanpa menangani entitas anak berelasi dan membungkusnya dengan `catch (e) { console.log("Gagal menghapus"); }` yang menelan objek galat (melanggar *OWASP Top 10:2025 A10 Mishandling of Exceptional Conditions*).
   - **Galat yang Ditemukan**: Saat menghapus entitas induk yang masih dirujuk oleh entitas anak (`AnalysisIndicator` / `Ulasan`) dengan aturan *foreign key constraint*, Prisma melempar `PrismaClientKnownRequestError` dengan `code: 'P2003'`. Karena galat ditelan `catch`, penghapusan gagal diam-diam dan pengguna tidak mendapatkan umpan balik apa pun. Demikian pula saat menghapus item yang sudah dihapus di tab lain (`code: 'P2025'`).
   - **Perbaikan Pengembang**:
     - Membungkus penghapusan entitas anak (`deleteMany`) dan entitas induk (`delete`) secara atomik di dalam `await prisma.$transaction([...])` pada [`app/actions/analysis.ts`](file:///d:/webprak/week7/app/actions/analysis.ts).
     - Menghapus `catch` penelan galat dan membuat *Client Component Error Boundary* pada [`app/history/[id]/error.tsx`](file:///d:/webprak/week7/app/history/[id]/error.tsx) serta [`app/katalog/[id]/error.tsx`](file:///d:/webprak/week7/app/katalog/[id]/error.tsx) yang menampilkan pesan ramah beserta `error.digest` dan tombol `retry()`.
   - **Verifikasi**: Penghapusan entitas berelasi mengeksekusi `BEGIN`, `DELETE FROM "AnalysisIndicator"`, `DELETE FROM "Analysis"`, dan `COMMIT` secara utuh di log `prisma:query`. Skenario uji hapus ganda dua tab memicu `P2025` yang ditangkap dengan benar oleh `error.tsx`.

4. **Galat 4 (Issue #14) — Penghitung Sisa Karakter Tidak Berubah Akibat `useEffect` dengan Dependensi Kosong `[]`**:
   - **Kode Awal AI**: Menyimpan sisa karakter pada state terpisah `const [sisa, setSisa] = useState(500)` (atau `280`) dan memperbaruinya di dalam `useEffect(() => { setSisa(500 - detail.length); }, [])`.
   - **Galat yang Ditemukan**: Inspeksi React Developer Tools (tab Components) dan breakpoint DevTools Sources membuktikan bahwa efek hanya berjalan saat komponen pertama kali dipasang (*mount*) karena larik dependensi kosong `[]`. Saat pengguna mengetik, state teks berubah tetapi `sisa` terkunci permanen di nilai awal.
   - **Perbaikan Pengembang**: Menghapus `useState` kedua dan `useEffect`, lalu menghitung nilai turunan (*derived state*) secara langsung saat *render*: `const sisaKarakterDetail = 500 - newDetail.length` pada [`app/history/[id]/page.tsx`](file:///d:/webprak/week7/app/history/[id]/page.tsx).
   - **Verifikasi**: Komponen kini hanya memiliki satu state untuk input teks, satu kali *render* per ketikan, penghitung sisa karakter memperbarui nilai secara seketika, serta lolos `npm run lint` dan `npx tsc --noEmit` tanpa peringatan `react-hooks/exhaustive-deps`.

### E. Modul 7 — Debugging dan Telaah Kritis Kode Hasil AI
Pada Modul 7, dilakukan penelusuran bukti (*evidence-based debugging*) menggunakan VS Code Server Debugger (`--inspect`), Chrome DevTools (Network & Sources), React Developer Tools (Components), dan log query Prisma (`log: ["query", "warn", "error"]`) terhadap kode usulan AI pada fitur CRUD entitas `Analysis` (Item) dan `AnalysisIndicator` (Ulasan/Indikator):
1. **Galat 1 — Status Keamanan/Ketersediaan (`isSafe` / `tersedia`) Selalu Bernilai `true` (Issue #11)**:
   - *Kode Usulan AI*: Menggunakan `z.coerce.boolean()` pada skema validasi Zod untuk memvalidasi input `<select>` bernilai string `"true"` dan `"false"`.
   - *Akar Penyebab*: `z.coerce.boolean()` memanggil konstruktor JavaScript `Boolean(input)` di mana string tidak kosong `"false"` dievaluasi menjadi `true` (`Boolean("false") === true`).
   - *Perbaikan & Verifikasi*: Mengganti `z.coerce.boolean()` dengan `z.stringbool()` (Zod 4) pada [`lib/validation.ts`](file:///d:/webprak/week7/lib/validation.ts) yang memetakan `"true"` ke `true`, `"false"` ke `false`, dan menolak string lainnya. Diverifikasi dengan breakpoint debugger VS Code dan lima kali uji reproduksi (5/5 berhasil menyimpan `false`).
2. **Galat 2 — Navigasi `redirect()` Batal dan Tertelan Blok `catch` saat Hapus Item Tanpa Relasi (Issue #12)**:
   - *Kode Usulan AI*: Memanggil `redirect("/history")` (atau `redirect("/katalog")`) di dalam blok `try { ... } catch (e) { console.log("Gagal menghapus"); }`.
   - *Akar Penyebab*: Fungsi `redirect()` di Next.js bekerja dengan melempar pengecualian kontrol alur khusus `NEXT_REDIRECT` (`e.digest` diawali `'NEXT_REDIRECT;...'`). Karena berada di dalam blok `try`, pengecualian ini ditangkap oleh `catch`, membatalkan perpindahan halaman dan mencetak log palsu `"Gagal menghapus"` meskipun data telah terhapus di PostgreSQL.
   - *Perbaikan & Verifikasi*: Memindahkan pemanggilan `revalidatePath()` dan `redirect()` ke luar blok `try/catch` pada [`app/actions/analysis.ts`](file:///d:/webprak/week7/app/actions/analysis.ts).
3. **Galat 3 — Penghapusan Entitas Berelasi Gagal Diam-diam Akibat Foreign Key `P2003` yang Ditelan `catch` (Issue #13)**:
   - *Kode Usulan AI*: Menjalankan `prisma.analysis.delete` (atau `prisma.item.delete`) tanpa menangani entitas anak yang merujuknya dan menelan `PrismaClientKnownRequestError` (`code: 'P2003'`) di dalam `catch` yang hanya mencetak `"Gagal menghapus"`.
   - *Akar Penyebab*: Pelanggaran *foreign key constraint* (`P2003`) saat menghapus entitas induk yang masih memiliki record anak, ditambah pola *error swallowing* (OWASP Top 10:2025 A10 *Mishandling of Exceptional Conditions*).
   - *Perbaikan & Verifikasi*: Menetapkan aturan produk penghapusan berantai secara atomik menggunakan `await prisma.$transaction([prisma.analysisIndicator.deleteMany({ where: { analysisId: id } }), prisma.analysis.delete({ where: { id } })])` pada [`app/actions/analysis.ts`](file:///d:/webprak/week7/app/actions/analysis.ts), menghapus `catch` penelan galat, serta membuat Client Component Error Boundary [`app/history/[id]/error.tsx`](file:///d:/webprak/week7/app/history/[id]/error.tsx) dan [`app/katalog/[id]/error.tsx`](file:///d:/webprak/week7/app/katalog/[id]/error.tsx) dengan prop `retry()` untuk menangkap galat tak terduga seperti `P2025` (record sudah dihapus di tab lain).
4. **Galat 4 — Penghitung Sisa Karakter Tidak Berubah Saat Mengetik pada Formulir Indikator/Ulasan (Issue #14)**:
   - *Kode Usulan AI*: Menyimpan `sisa` dalam `useState(500)` (atau `useState(280)`) terpisah dan memperbaruinya di dalam `useEffect(() => { setSisa(500 - detail.length); }, [])` dengan larik dependensi kosong `[]`.
   - *Akar Penyebab*: Larik dependensi kosong `[]` membuat efek hanya dijalankan saat komponen pertama kali dipasang (*mount*) dan tidak pernah dijalankan ulang saat state teks berubah ketika pengguna mengetik.
   - *Perbaikan & Verifikasi*: Menghapus state `sisa` dan `useEffect`, lalu menghitung nilai turunan secara langsung saat *render* (`const sisaKarakterDetail = 500 - newDetail.length;`) pada [`app/history/[id]/page.tsx`](file:///d:/webprak/week7/app/history/[id]/page.tsx). Diverifikasi melalui React Developer Tools (hanya satu state teks, satu render per ketikan) serta `npm run lint` dan `npx tsc --noEmit` bersih tanpa peringatan.

---

## 4. Hasil Verifikasi Akhir

Seluruh saran dan kode yang dihasilkan AI telah diverifikasi secara ketat melalui eksekusi tool otomatis lokal:

| Perintah Verifikasi | Status | Keterangan |
|---|---|---|
| `npx prisma migrate status` | **PASS** | 4 migrasi terdaftar, database up to date |
| `npx tsc --noEmit` | **PASS** | 0 error kompilasi TypeScript |
| `npm run lint` | **PASS** | 0 error, 0 warning ESLint |
| `npm test` | **PASS** | 8 test files, 101 tests lulus 100% |
| `npm run build` | **PASS** | 25 rute teroptimasi tanpa kendala |
| Manual Tasks (Lynis, Trivy) | **NOT TESTED - MANUAL** | Diberi penanda jelas untuk verifikasi lingkungan produksi |

---

## 5. Ringkasan Peran AI

AI bertindak sebagai akselerator teknis yang membantu menghasilkan draf kode, kerangka uji coba, dan dokumentasi terstruktur. Kontrol mutu, logika keamanan, dan keputusan akhir tetap berada di bawah kendali pengembang proyek CyberShield.
