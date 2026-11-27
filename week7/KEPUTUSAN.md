# KEPUTUSAN ARSITEKTUR DAN KRIPTOGRAFI CYBERSHIELD (MILESTONE 2)

Dokumen ini mencatat keputusan teknis, arsitektur, dan kriptografi yang diambil dalam pengembangan CyberShield v0.2 untuk memenuhi capaian Milestone 2, termasuk integrasi penuh Authenticated Encryption with Associated Data (AEAD) ke layer persistensi basis data PostgreSQL.

---

## 1. Pemilihan Primitif Kriptografi

### A. SHA-256 (URL Fingerprinting)
- **Tujuan:** Menghasilkan representasi deterministik (fingerprint) berukuran tetap (64 karakter hexadecimal) dari setiap URL input pengguna.
- **Karakteristik:** Fungsi hash kriptografis satu arah (one-way cryptographic hash). Tidak menyembunyikan data dan tidak dapat didekripsi kembali ke string awal.
- **Implementasi:** Menggunakan `crypto.subtle.digest("SHA-256", ...)` bawaan Web Crypto API (`lib/crypto/hash.ts`).

### B. HMAC-SHA-256 (Message Authentication Code)
- **Tujuan:** Menjamin keaslian (authenticity) dan integritas (integrity) hasil analisis URL dan aturan deteksi agar manipulasi hasil atau skor risiko dapat segera terdeteksi.
- **Karakteristik:** Menggunakan kunci rahasia simetris (symmetric secret key). Pihak tanpa kunci rahasia tidak dapat memalsukan authentication tag yang valid.
- **Batasan Penting:** HMAC tidak mengenkripsi atau menyembunyikan plaintext data. Plaintext tetap terbaca, namun setiap perubahan pada plaintext akan membatalkan tag verifikasi.
- **Implementasi:** Menggunakan `crypto.subtle.sign("HMAC", ...)` dan `crypto.subtle.verify("HMAC", ...)` (`lib/crypto/hmac.ts`).

### C. AES-256-GCM (Authenticated Encryption with Associated Data - AEAD)
- **Tujuan:** Melindungi kerahasiaan (confidentiality) sekaligus integritas dan otentisitas data sensitif pada kolom `encryptedNotes` di tabel `analyses` PostgreSQL.
- **Alasan Pemilihan:** Mode GCM (Galois/Counter Mode) merupakan standar modern NIST SP 800-38D yang menggabungkan enkripsi aliran (counter mode) dengan otentikasi Galois. Mode ini mengeliminasi kerentanan pemalsuan ciphertext (bit-flipping attacks) dan padding oracle attacks yang ada pada mode CBC/CTR biasa.
- **Karakteristik Parameter Teknis:**
  - **Panjang Kunci:** 256-bit (32 byte), dimuat dari environment variable format hex 64 karakter (`AEAD_ENCRYPTION_KEY_HEX`).
  - **Panjang IV / Nonce:** 96-bit (12 byte), selalu digenerasikan segar menggunakan CSPRNG (`crypto.getRandomValues`).
  - **Kebijakan Keunikan Nonce:** Nonce tidak pernah digunakan ulang (*nonce reuse avoidance*) dengan kunci yang sama.
  - **Panjang Authentication Tag:** 128-bit (16 byte), diverifikasi secara ketat saat proses dekripsi.
  - **Additional Authenticated Data (AAD):** Terikat secara deterministik pada metadata record: `analysis:${analysisId}:encryptedNotes`. Mengikat ciphertext pada record tertentu untuk mencegah *ciphertext swapping attack* antar baris database.
- **Format Penyimpanan Berversi (Versioned Envelope):**
  Ciphertext disimpan di PostgreSQL dalam format string terstruktur:
  `enc:v1:<ivHex>:<tagHex>:<ciphertextHex>`
  - `enc:v1:`: Penanda format versi 1.
  - `<ivHex>`: 24 karakter hex (12 bytes / 96-bit IV CSPRNG).
  - `<tagHex>`: 32 karakter hex (16 bytes / 128-bit GCM Auth Tag).
  - `<ciphertextHex>`: Hexadecimal payload ciphertext.
- **Implementasi:**
  - Primitif & utilitas: `lib/crypto/aead.ts` (`encryptNote`, `decryptNote`, `packEncryptedPayload`, `unpackEncryptedPayload`).
  - Integrasi server: `app/actions/analysis.ts` dan `app/api/analysis/route.ts`.
  - Seeding & Backfill: `prisma/seed.ts` dan `prisma/backfill-notes.ts`.

### D. Penolakan Sandi Klasik
- CyberShield **tidak menggunakan sandi klasik** seperti Caesar Cipher, Vigenère Cipher, atau Substitution Cipher untuk melindungi data produk, karena algoritma tersebut tidak memiliki kekuatan komputasi modern dan rentan terhadap analisis frekuensi serta brute-force.

---

## 2. Manajemen Kunci (Key Management)

1. **Sumber Keacakan (CSPRNG):** Seluruh kunci dan IV dihasilkan menggunakan Cryptographically Secure Pseudo-Random Number Generator bawaan platform (`crypto.getRandomValues` pada Web Crypto API atau `node:crypto.randomBytes`).
2. **Penyimpanan Kunci & Isolasi Lingkungan:**
   - Kunci enkripsi server dikelola secara eksklusif melalui environment variable `AEAD_ENCRYPTION_KEY_HEX`.
   - Tidak ada kunci statis, password, atau secret yang di-hardcode ke dalam repository, database, atau image Docker.
   - Variabel `AEAD_ENCRYPTION_KEY_HEX` tidak memiliki prefix `NEXT_PUBLIC_`, sehingga Next.js secara otomatis mengisolasinya di server dan mencegahnya terkirim ke bundle browser client.
   - Repositori menyediakan template acuan `.env.example`.
3. **Prinsip Fail-Closed (Gagal Tertutup):**
   - Jika kunci tidak tersedia di environment atau ukurannya bukan tepat 64 karakter hex (256-bit), operasi enkripsi/dekripsi melempar error dan menolak melanjutkan transaksi.
   - Jika authentication tag GCM, ciphertext, atau AAD mengalami manipulasi 1 bit saja, dekripsi langsung gagal dengan error penolakan.
   - **TIDAK ADA FALLBACK KE PLAINTEXT**: Jika dekripsi gagal, sistem menolak menampilkan data mentah agar integritas dan kerahasiaan tetap terlindungi.
   - Data warisan plaintext yang belum dimigrasikan ditolak secara tegas (*fail-closed*) dan tidak dibaca diam-diam sebagai plaintext.

---

## 3. Alur Integrasi Persistensi Basis Data

### A. Alur Simpan (CREATE / UPDATE):
```text
Plaintext (Catatan Analis) + Context UUID (analysisId)
                     │
    [256-bit Key] + [96-bit CSPRNG IV]
                     │
    AAD: "analysis:${analysisId}:encryptedNotes"
                     │
                     ▼
          AES-256-GCM Engine
                     │
                     ▼
    Payload: { ivHex, tagHex, ciphertextHex }
                     │
                     ▼
   Format: "enc:v1:${iv}:${tag}:${ciphertext}"
                     │
                     ▼
       Simpan ke PostgreSQL (Analyses)
```

### B. Alur Baca (READ):
```text
       Baca dari PostgreSQL (Analyses)
                     │
                     ▼
   Validasi Format: Harus Berawalan "enc:v1:"
   (Jika bukan "enc:v1:" -> Lempar Error / Fail-Closed)
                     │
                     ▼
   Ekstrak: ivHex (24 char), tagHex (32 char), ciphertextHex
                     │
    AAD: "analysis:${analysisId}:encryptedNotes" + [256-bit Key]
                     │
                     ▼
       AES-256-GCM Decrypt & Tag Verification
                     │
         [Verifikasi Tag Sukses]
                     │
                     ▼
   Plaintext dikirim ke UI Client (Kunci Tetap di Server)
```

---

## 4. Penanganan Data Warisan (Legacy Data Migration)

1. Disediakan modul migrasi `prisma/backfill-notes.ts` yang dapat dijalankan melalui perintah `npm run crypto:backfill`.
2. Skrip memeriksa setiap baris pada tabel `analyses`:
   - Jika baris sudah berformat `enc:v1:`, baris dilewati (idempoten).
   - Jika baris masih berisi plaintext warisan, data dienkripsi dengan AAD yang sesuai dengan UUID baris tersebut dan diperbarui di PostgreSQL.
3. Seeding `prisma/seed.ts` selalu menyimpan catatan awal dalam format `enc:v1:` terenkripsi.
