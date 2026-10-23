# AI_LOG

## Penggunaan AI

Pengembangan komponen kriptografi CyberShield menggunakan AI sebagai alat bantu selama proses perancangan, implementasi, pengujian, dan dokumentasi.

AI digunakan sebagai pendamping pengembangan, sedangkan keputusan akhir mengenai desain, kode, pengujian, dan kesesuaian dengan kondisi produk diperiksa dan ditentukan oleh pengembang.

---

## 1. Perancangan Kebutuhan Kriptografi

AI digunakan untuk membantu mengidentifikasi data pada CyberShield yang memiliki kebutuhan keamanan dan menentukan primitive kriptografi yang sesuai.

Data yang dianalisis meliputi:

- URL yang dianalisis.
- Hasil analisis URL.
- Detection rules.

Dari analisis tersebut digunakan:

- SHA-256 untuk fingerprint URL.
- HMAC-SHA-256 untuk membantu mendeteksi perubahan pada hasil analisis.

Keputusan akhir disesuaikan dengan kondisi CyberShield yang masih berupa prototype client-side.

---

## 2. Perancangan Komponen

AI digunakan untuk membantu menyusun rancangan:

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
Hexadecimal fingerprint
```

dan:

```text
Analysis Result
      +
Runtime HMAC Key
      |
      v
 HMAC-SHA-256
      |
      v
Authentication Tag
```

AI juga membantu menjelaskan representasi data pada setiap tahap pemrosesan.

---

## 3. Implementasi

AI digunakan sebagai bantuan dalam penulisan dan pemeriksaan implementasi TypeScript untuk:

- SHA-256 menggunakan Web Crypto API (`lib/crypto/hash.ts`).
- HMAC-SHA-256 menggunakan Web Crypto API (`lib/crypto/hmac.ts`).
- Runtime generation untuk HMAC key (`generateHmacKey()`).
- Konversi hasil binary menjadi hexadecimal (`bytesToHex()`).

Implementasi tetap diperiksa menggunakan TypeScript compiler dan automated testing.

---

## 4. Pengujian

AI digunakan untuk membantu menyusun skenario automated test pada `lib/crypto/test/hash.test.ts` dan `lib/crypto/test/hmac.test.ts`.

Pengujian mencakup:

### SHA-256

1. Validasi panjang hash (64 karakter hexadecimal).
2. Konsistensi hash untuk input yang sama.
3. Perbedaan hash untuk input yang berbeda.
4. Boundary test menggunakan input kosong.

### HMAC-SHA-256

1. Validasi panjang HMAC (64 karakter hexadecimal).
2. Verifikasi data yang tidak berubah (valid).
3. Penolakan data yang telah dimanipulasi (invalid).
4. Penolakan authentication tag yang salah.

Hasil pengujian diperiksa secara langsung menggunakan Vitest.

Hasil terakhir:

```text
Test Files  2 passed (2)
Tests       8 passed (8)
```

---

## 5. Dokumentasi

AI digunakan untuk membantu menyusun dokumentasi pada `README.md`, termasuk:

- Kebutuhan kriptografi;
- Rancangan komponen;
- Representasi data;
- Sumber keacakan;
- Cara menjalankan;
- Hasil pengujian;
- Batasan prototype.

Dokumentasi disesuaikan dengan implementasi aktual pada repository.

---

## 6. Batasan Penggunaan AI

AI tidak digunakan untuk memasukkan secret, password, token, private key, atau data pribadi ke dalam repository.

Secret key HMAC tidak ditulis secara hardcode dan dibuat pada saat runtime.

AI juga tidak digunakan sebagai pengganti proses pengujian. Kode tetap diperiksa menggunakan:

```bash
npx tsc --noEmit
npm test # atau npx vitest run
npm run lint
npm run build
```

Keputusan akhir mengenai implementasi dan dokumentasi dilakukan berdasarkan kondisi aktual repository CyberShield.

---

## 7. Ringkasan

AI digunakan sebagai alat bantu untuk:

- Analisis kebutuhan;
- Desain komponen;
- Implementasi kode;
- Penyusunan test;
- Dokumentasi.

Validasi akhir dilakukan melalui pemeriksaan kode dan automated test pada repository.