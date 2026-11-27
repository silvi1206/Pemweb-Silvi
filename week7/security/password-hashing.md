# SPESIFIKASI DAN PENGUJIAN PASSWORD HASHING CYBERSHIELD (MILESTONE 2)

Dokumen ini menjelaskan arsitektur keamanan penyimpanan kata sandi pada CyberShield v0.2.

---

## 1. Rasional Pemilihan Algoritma

> [!CAUTION]
> **Larangan Hash Cepat:** Password **TIDAK PERNAH** disimpan dalam bentuk plaintext ataupun menggunakan fungsi hash cepat (seperti MD5, SHA-1, atau SHA-256 murni). Fungsi hash cepat dirancang untuk efisiensi throughput komputasi dan pemrosesan pesan cepat, sehingga sangat rentan terhadap serangan kamus (dictionary attack) dan brute-force berbasis GPU/ASIC berkecepatan miliaran tebakan per detik.

CyberShield mengadopsi algoritma **Scrypt** (RFC 7914 / NIST SP 800-132) melalui modul bawaan `node:crypto` (`lib/auth/password.ts`). Scrypt merupakan fungsi penurunan kunci berbasis kata sandi (*Password-Based Key Derivation Function*) yang bersifat **memory-hard** (membutuhkan memori fisik terdistribusi untuk komputasi), sehingga secara efektif melumpuhkan akselerasi serangan perangkat keras paralel (ASIC dan FPGA).

---

## 2. Parameter dan Konfigurasi Kriptografis

| Parameter | Nilai Konfigurasi | Penjelasan Teknis |
|---|---|---|
| **Algoritma** | `Scrypt` | Memory-hard sequential key derivation function |
| **Salt Generator** | 16 bytes (128 bits) CSPRNG | Menggunakan `crypto.randomBytes(16)` unik untuk setiap kata sandi |
| **CPU/Memory Cost ($N$)** | $16384$ ($2^{14}$) | Mengatur beban iterasi CPU dan kebutuhan alokasi memori |
| **Block Size ($r$)** | $8$ | Mengatur ukuran blok pembacaan data memori terurut (1024 bytes) |
| **Parallelization ($p$)** | $1$ | Jumlah thread paralel independen |
| **Derived Key Length** | 64 bytes (512 bits) | Panjang keluaran digest kunci hash akhir |
| **Format Serialisasi** | `scrypt$N$r$p$saltHex$derivedKeyHex` | Format modular untuk identifikasi parameter tanpa kebocoran kunci |
| **Metode Komparasi** | `crypto.timingSafeEqual` | Komparasi waktu konstan untuk mencegah *timing attacks* |

---

## 3. Contoh Serialisasi Hash Sintetis

Berikut adalah representasi aktual yang dihasilkan oleh fungsi `hashPassword()`:

```text
scrypt$16384$8$1$7f3c4e12a98b71d4e5f6081234bcde56$d9a184f7b2e15...[64-bytes-hex]
```

Struktur komponen:
1. `scrypt`: Identifier algoritma.
2. `16384`: Parameter cost CPU/RAM ($N$).
3. `8`: Parameter block size ($r$).
4. `1`: Parameter parallelization ($p$).
5. `7f3c4e12...`: 16-byte random salt unik.
6. `d9a184f7...`: 64-byte derived key.

---

## 4. Log Hasil Pengujian Verifikasi Password

Pengujian otomatis dijalankan melalui `test/security.test.ts`:

| ID Test | Kasus Uji | Input Sintetis | Expected Result | Actual Result | Status |
|---|---|---|---|---|:---:|
| **PWD-01** | Keunikan Salt CSPRNG | Password: `"RahasiaKeamananSiber2026!"` di-hash dua kali | Hash 1 berbeda total dari Hash 2 meskipun password sama | `hash1 !== hash2`, keduanya valid | **PASS** |
| **PWD-02** | Verifikasi Password Benar | Input: `"SuperSecurePassword#99"`, Hash: Valid Scrypt digest | Fungsi mengembalikan `true` | `verifyPassword()` -> `true` | **PASS** |
| **PWD-03** | Penolakan Password Salah | Input: `"WrongPassword#99"`, Hash: Digest dari `"SuperSecurePassword#99"` | Fungsi mengembalikan `false` | `verifyPassword()` -> `false` | **PASS** |
| **PWD-04** | Penolakan Hash Rusak / Tampered | Input: `"anyPass"`, Hash: `"md5$invalid$format"` | Fungsi menolak secara aman tanpa crash | `verifyPassword()` -> `false` | **PASS** |
| **PWD-05** | Penolakan Password Kosong | Input: `""` (Empty string) | Fungsi melempar exception validasi | Melempar error `"Password harus berupa teks non-kosong."` | **PASS** |

---

## 5. Perlindungan Terhadap Serangan Timing

Dalam proses verifikasi kata sandi, komparasi string konvensional (`hashA === hashB`) memiliki celah keamanan kebocoran waktu (*side-channel timing leak*), di mana proses perbandingan berhenti pada byte pertama yang tidak cocok.

CyberShield memitigasi risiko ini dengan menggunakan `crypto.timingSafeEqual(derivedKey, originalKey)`, yang mengevaluasi seluruh byte dalam waktu yang konstan tanpa memedulikan di byte mana perbedaan terjadi.
