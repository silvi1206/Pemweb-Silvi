# MATRIKS KONTROL AKSES & PENGUJIAN OTORISASI CYBERSHIELD (MILESTONE 2)

Dokumen ini memetakan implementasi Role-Based Access Control (RBAC) pada CyberShield v0.2, merujuk pada analisis ancaman dan risiko Tugas 1 (T05, T09, T10, T12).

---

## 1. Matriks Peran dan Izin (Role-Permission Matrix)

CyberShield v0.2 mendefinisikan tiga peran pengguna sintetis:

| Izin / Operasi | Deskripsi | Guest (Tamu) | User (Terdaftar) | Admin (Keamanan) |
|---|---|:---:|:---:|:---:|
| `analyze:url` | Menjalankan analisis keamanan awal terhadap URL | ✅ YA | ✅ YA | ✅ YA |
| `history:read_public` | Melihat daftar riwayat analisis publik | ✅ YA | ✅ YA | ✅ YA |
| `history:read_all` | Membaca seluruh riwayat termasuk catatan terenkripsi | ❌ TIDAK | ❌ TIDAK | ✅ YA |
| `analysis:create` | Menyimpan hasil analisis baru ke basis data | ❌ TIDAK | ✅ YA | ✅ YA |
| `analysis:update` | Memperbarui rekomendasi/skor risiko analisis | ❌ TIDAK | ❌ TIDAK | ✅ YA |
| `analysis:delete` | Menghapus record analisis (cascade indikator) | ❌ TIDAK | ❌ TIDAK | ✅ YA |
| `indicator:create` | Menambahkan indikator temuan manual (Entitas Kedua) | ❌ TIDAK | ❌ TIDAK | ✅ YA |
| `indicator:update` | Mengubah status/detail indikator keamanan | ❌ TIDAK | ❌ TIDAK | ✅ YA |
| `indicator:delete` | Menghapus indikator keamanan spesifik | ❌ TIDAK | ❌ TIDAK | ✅ YA |

---

## 2. Akun Uji Sintetis (Synthetic Test Accounts)

> [!IMPORTANT]
> Seluruh akun di bawah adalah data uji sintetis untuk keperluan pengujian lokal. Tidak ada akun, email, atau kredensial pengguna nyata.

| ID Akun | Peran | Email Sintetis | Kredensial Uji | Cakupan Akses |
|---|---|---|---|---|
| `ACC-GUEST-01` | `guest` | *N/A (Anonim)* | *Tanpa Login* | Hanya analisis URL dan pembacaan ringkas |
| `ACC-USER-01` | `user` | `user.demo@cybershield.test` | `DemoUser#2026!` | Analisis URL dan penyimpanan hasil |
| `ACC-ADMIN-01` | `admin` | `admin.sec@cybershield.test` | `CyberAdmin#Secret2026` | Otoritas penuh CRUD kedua entitas |

---

## 3. Log Hasil Pengujian Akses (Positif dan Negatif)

Pengujian dijalankan melalui automated suite `test/security.test.ts` menggunakan modul `lib/auth/rbac.ts`:

| ID Test | Peran | Sumber Daya / Operasi | Jenis Uji | Expected Result | Actual Result | Status | Ref Risiko Tugas 1 |
|---|---|---|---|---|---|:---:|---|
| **ACC-01** | `guest` | `analyze:url` | Positif | Akses diizinkan | Diizinkan (`true`) | **PASS** | T01, T02 |
| **ACC-02** | `guest` | `history:read_public` | Positif | Akses diizinkan | Diizinkan (`true`) | **PASS** | T05 |
| **ACC-03** | `guest` | `analysis:delete` | **Negatif** | Akses ditolak (403 Forbidden) | Ditolak (`false`) | **PASS** | T10 (Manipulasi Hasil) |
| **ACC-04** | `guest` | `indicator:create` | **Negatif** | Akses ditolak (403 Forbidden) | Ditolak (`false`) | **PASS** | T03 (Manipulasi Aturan) |
| **ACC-05** | `user` | `analysis:create` | Positif | Akses diizinkan | Diizinkan (`true`) | **PASS** | T04 (Audit Trail) |
| **ACC-06** | `user` | `analysis:update` | **Negatif** | Akses ditolak (403 Forbidden) | Ditolak (`false`) | **PASS** | T10 (Manipulasi Hasil) |
| **ACC-07** | `user` | `indicator:delete` | **Negatif** | Akses ditolak (403 Forbidden) | Ditolak (`false`) | **PASS** | T03, T09 |
| **ACC-08** | `admin` | `analysis:update` | Positif | Akses diizinkan | Diizinkan (`true`) | **PASS** | T10, T12 |
| **ACC-09** | `admin` | `indicator:create` | Positif | Akses diizinkan | Diizinkan (`true`) | **PASS** | T03, T12 |
| **ACC-10** | `admin` | `indicator:delete` | Positif | Akses diizinkan | Diizinkan (`true`) | **PASS** | T03, T12 |
| **ACC-11** | `guest` | `requirePermission` enforcement | **Negatif** | Exception 403 Forbidden thrown | Exception thrown dengan pesan informatif | **PASS** | T09 (Client Abuse) |

---

## 4. Evaluasi Prinsip Keamanan

1. **Server-Side Enforcement:** Pengecekan otorisasi tidak hanya dilakukan dengan menyembunyikan tombol UI, melainkan ditegakkan langsung di fungsi server (`requirePermission`).
2. **Keseimbangan Uji Negatif:** Dari 11 skenario pengujian, terdapat 5 uji positif dan 6 uji negatif, membuktikan penolakan hak akses berfungsi tertutup secara ketat (*principle of least privilege*).

---

## 5. Pengujian Sesi Server-Side & Proteksi CSRF (Post-Audit Hardening)

Pengujian siklus hidup sesi dan penolakan serangan pemalsuan permintaan antar-situs dijalankan melalui automated suite `test/rbac-auth.test.ts` (Seksi 6):

| ID Test | Aspek yang Diuji | Jenis Uji | Expected Result | Actual Result | Status | Ref Risiko |
|---|---|---|---|---|:---:|---|
| **SESS-01** | Pembuatan sesi di database saat login | Positif | Baris baru tercipta di PostgreSQL tabel `Session` | Tercipta dengan `userId` valid | **PASS** | T12 |
| **SESS-02** | Format hash token di database | Positif | Token disimpan sebagai hash SHA-256 64-hex | 64 karakter heksadesimal | **PASS** | T12 |
| **SESS-03** | Proteksi kebocoran token mentah | **Negatif** | Token mentah tidak ditemukan di kolom manapun di DB | Query token mentah menghasilkan `null` | **PASS** | T05, T12 |
| **SESS-04** | Validasi sesi aktif dari database | Positif | Profil pengguna dikembalikan sesuai baris DB | Profil `userId`, `email`, `role` cocok | **PASS** | T12 |
| **SESS-05** | Penolakan sesi kedaluwarsa (*expired*) | **Negatif** | Sesi kedaluwarsa ditolak secara fail-closed | Mengembalikan `null` | **PASS** | T12 |
| **SESS-06** | Penolakan sesi yang dicabut (*revoked*) | **Negatif** | Sesi berstatus `revokedAt !== null` ditolak | Mengembalikan `null` | **PASS** | T12 |
| **SESS-07** | Pencabutan sesi di basis data saat logout | Positif | Baris sesi diupdate dengan timestamp `revokedAt` | Kolom `revokedAt` terisi | **PASS** | T12 |
| **SESS-08** | Penolakan penggunaan kembali token pasca-logout | **Negatif** | Token lama tidak dapat digunakan kembali | Mengembalikan `null` | **PASS** | T12 |
| **SESS-09** | Penolakan token asing / tidak dikenal | **Negatif** | Token acak di luar DB ditolak | Mengembalikan `null` | **PASS** | T12 |
| **SESS-10** | Penolakan manipulasi cookie & format invalid | **Negatif** | String manipulasi / non-hex ditolak | Mengembalikan `null` | **PASS** | T09, T12 |
| **SESS-11** | Penolakan sesi untuk akun pengguna yang dihapus | **Negatif** | Penghapusan user membatalkan seluruh sesi terkait | Mengembalikan `null` | **PASS** | T12 |
| **SESS-12** | Penolakan mutasi API lintas asal (CSRF Protection) | **Negatif** | Origin tidak cocok dengan Host ditolak HTTP 403 | Status 403 Forbidden | **PASS** | T09, T10 |
| **SESS-13** | Pencabutan seluruh sesi pengguna oleh Administrator | Positif | Admin mencabut seluruh sesi aktif multi-device user | Semua token user berstatus revoked | **PASS** | T12 |

