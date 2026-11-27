# SECURITY CONTROLS PLAN & RISK MAPPING CYBERSHIELD (MILESTONE 2)

Dokumen ini memetakan implementasi kontrol keamanan CyberShield v0.2 secara langsung terhadap 12 ancaman yang diidentifikasi pada Risk Register Tugas 1 (`security/risk-register.md`).

---

## 1. Pemetaan Kontrol Keamanan Terhadap Risk ID (T01 — T12)

| Risk ID | Ancaman Teridentifikasi | Risk Score (Tugas 1) | Kontrol Keamanan Milestone 2 | Lokasi Implementasi | Metode & Bukti Pengujian | Status Pengujian |
|---|---|:---:|---|---|---|:---:|
| **T01** | Manipulasi URL Input | 12 | Validasi skema ketat menggunakan Zod di Server Actions dan API Routes | `lib/validation.ts`, `app/actions/analysis.ts` | Test `WEB-INVALID-01` di `test/web-crud.test.ts` | **PASS** |
| **T02** | Manipulasi Proses Validasi | 12 | Validasi ganda (defense-in-depth): validasi frontend disertai re-validasi wajib di server sebelum interaksi DB | `lib/validation.ts`, `components/UrlAnalyzer.tsx` | Verifikasi server-side rejection tanpa bypass | **PASS** |
| **T03** | Manipulasi Aturan Deteksi | 15 | Rule-based engine divalidasi dan disimpan terstruktur dalam entitas `AnalysisIndicator` dengan otorisasi RBAC peran Admin | `prisma/schema.prisma`, `app/actions/indicators.ts`, `lib/auth/rbac.ts` | Test `SEC-RBAC-02` (User ditolak modifikasi indicator) | **PASS** |
| **T04** | Tidak Ada Jejak Aktivitas Analisis | 9 | Persistensi permanen ke PostgreSQL dengan timestamp, SHA-256 fingerprint, dan relasi temuan indikator | `app/actions/analysis.ts`, `app/history/page.tsx` | Test `WEB-01` dan `WEB-02` (Audit log riwayat tersimpan) | **PASS** |
| **T05** | Pengungkapan Hasil Analisis | 12 | Enkripsi data sensitif dan catatan reviewer menggunakan AEAD AES-256-GCM + RBAC pembatasan akses data privat | `lib/crypto/aead.ts`, `lib/auth/rbac.ts` | Test `CRYPTO-01` s/d `CRYPTO-06` di `aead.test.ts` | **PASS** |
| **T06** | Pengungkapan Aturan Deteksi | 12 | Abstraksi jenis indikator dalam bentuk entitas standar (PROTOCOL, DOMAIN, KEYWORD, EXTENSION) di server | `prisma/schema.prisma`, `lib/url-analyzer.ts` | Evaluasi integritas data di DB | **PASS** |
| **T07** | Beban Berlebih pada Analisis URL | 8 | Optimasi client-side preview + server-side validation ringan dengan timeout parsing URL | `lib/url-analyzer.ts`, `lib/validation.ts` | Limitasi panjang URL (Zod URL schema) | **PASS** |
| **T08** | Input Berulang pada Validasi URL | 6 | Deterministic SHA-256 fingerprinting untuk deteksi duplikasi input URL | `lib/crypto/hash.ts` | Test `CRYPTO-12` (SHA-256 deterministik) | **PASS** |
| **T09** | Penyalahgunaan Fungsi Client-Side | 16 | Pemindahan seluruh mutasi data dan logika penyimpanan ke Server Actions Next.js 16 | `app/actions/analysis.ts`, `app/actions/indicators.ts` | Server Actions berjalan di server environment | **PASS** |
| **T10** | Manipulasi Hasil Analisis | 20 | Tanda tangan integritas HMAC-SHA-256 berbasis secret key terkelola di server untuk mendeteksi perubahan data | `lib/crypto/hmac.ts`, `prisma/schema.prisma` | Test `CRYPTO-08`, `CRYPTO-09` (Penolakan data dimanipulasi) | **PASS** |
| **T11** | Pengungkapan Mock/Sample URL | 2 | Pemisahan sampel URL sintetis (`data/latihan-routing.ts`, `lib/url-analyzer.ts`) tanpa data rahasia | `data/latihan-routing.ts` | Tidak ada credential/PII di kode sampel | **PASS** |
| **T12** | Penyalahgunaan Identitas Pengguna | 4 | Slow password hashing Scrypt (salt CSPRNG 16-byte) + Server-Side Session di PostgreSQL (SHA-256 token hash, pencabutan instan, HttpOnly/SameSite Lax cookie, proteksi CSRF Origin/Host) | `lib/auth/password.ts`, `lib/auth/session.ts`, `lib/auth/csrf.ts` | Test `SEC-PWD-01` s/d `SEC-PWD-05`, `SESS-01` s/d `SESS-13` | **PASS** |

---

## 2. Rincian Implementasi 5 Risiko Prioritas Utama

### R01 — Manipulasi Hasil Analisis (T10 — Risk Score: 20)
- **Kontrol:** Penegakan integritas menggunakan tag HMAC-SHA-256 dan Server Actions di server.
- **Implementasi:** Nilai `riskScore`, `isSafe`, dan `recommendation` dipaketkan dan diverifikasi menggunakan kunci rahasia HMAC server. Manipulasi nilai skor di database akan membatalkan verifikasi HMAC.

### R02 — Penyalahgunaan Fungsi Client-Side (T09 — Risk Score: 16)
- **Kontrol:** Server Actions Next.js 16 (`app/actions/analysis.ts` dan `indicators.ts`).
- **Implementasi:** Mutasi data tidak lagi bergantung pada manipulasi skrip browser. Eksekusi database dilakukan secara eksklusif di server Node.js.

### R03 — Manipulasi Aturan Deteksi (T03 — Risk Score: 15)
- **Kontrol:** Manajemen indikator melalui entitas kedua `AnalysisIndicator` dengan proteksi otorisasi RBAC peran Admin.
- **Implementasi:** Peran Guest dan User ditolak melakukan mutasi pada entitas indikator (`indicator:create`, `indicator:update`, `indicator:delete`).

### R04 — Manipulasi URL Input (T01 — Risk Score: 12)
- **Kontrol:** Validasi skema Zod ketat (`urlSchema`).
- **Implementasi:** Memverifikasi skema protokol (`http://` atau `https://`), validitas domain RFC, serta panjang string sebelum query diproses.

### R05 — Pengungkapan Hasil Analisis & Privasi (T05 — Risk Score: 12)
- **Kontrol:** AEAD AES-256-GCM (`lib/crypto/aead.ts`).
- **Implementasi:** Kolom `encryptedNotes` dienkripsi dengan kunci 256-bit dan IV acak 96-bit unik untuk melindungi informasi sensitif reviewer.
