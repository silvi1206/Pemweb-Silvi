# Dokumen Teknis Modul 1 — Lingkungan Pengembangan, Git, dan Lalu Lintas HTTP

**Nama/NIM:** Silviana Maristha Ginting / 105224001  
**Repositori:** https://github.com/silvi1206/Pemweb-Silvi

## 1. Lingkungan Pengembangan

Lingkungan pengembangan digunakan untuk menjalankan aplikasi web secara lokal, mengelola dependensi, melakukan version control, dan mengedit kode program.

| Komponen | Keterangan |
|---|---|
| Sistem Operasi | Windows |
| Node.js | Sesuai hasil verifikasi pada proyek |
| npm | Sesuai hasil verifikasi pada proyek |
| Git | Sesuai hasil verifikasi pada proyek |
| Visual Studio Code | Digunakan sebagai editor dan terminal pengembangan |
| Framework | Next.js |
| Local Development Server | `http://localhost:3000` |

Aplikasi dijalankan menggunakan development server Next.js melalui perintah `npm run dev`. Setelah server aktif, aplikasi dapat diakses melalui `http://localhost:3000`.

## 2. Alur Kerja Git

Git digunakan untuk mencatat perubahan pada proyek sehingga setiap perubahan dapat dilacak dan dikembalikan apabila diperlukan. Alur kerja yang digunakan meliputi perubahan berkas, staging, commit, dan sinkronisasi dengan repositori GitHub.

### Riwayat Git

Riwayat commit ditampilkan menggunakan perintah:

```bash
git log --oneline --graph
```

**Bukti:** tangkapan layar `git log --oneline --graph` pada folder `docs/praktikum`.

### Pull Request

Bagian pull request tidak dicantumkan karena tidak digunakan sebagai bukti pada dokumen ini.

### Penyelesaian Konflik

Pada proses pengembangan, perubahan kode dapat menimbulkan konflik apabila dua bagian yang berbeda mengubah bagian kode yang sama. Penyelesaian konflik dilakukan dengan memeriksa penanda konflik pada berkas, menentukan isi yang ingin dipertahankan, kemudian menyimpan hasil akhir dan melakukan commit.

Pemilihan isi akhir dilakukan dengan mempertimbangkan versi kode yang sesuai dengan kondisi proyek setelah perubahan dilakukan. Setelah konflik diselesaikan, berkas diperiksa kembali untuk memastikan tidak terdapat penanda konflik yang tersisa.

## 3. Pengamatan Lalu Lintas HTTP

Pengamatan lalu lintas HTTP dilakukan pada aplikasi yang berjalan di `localhost:3000`. Pemeriksaan dilakukan menggunakan browser DevTools dan `curl`.

### 3.1 Pengamatan Halaman Utama

URL yang diamati:

```text
http://localhost:3000/
```

Hasil pengamatan menunjukkan bahwa halaman utama dapat diakses dan server memberikan respons **200 OK**.

Untuk pemeriksaan menggunakan curl digunakan:

```bash
curl.exe -I http://localhost:3000
```

Hasil:

```text
HTTP/1.1 200 OK
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
Link: </_next/static/media/797e433ab948586e-s.p.0r6juujl39pepe6.woff2>; rel=preload; as="font"; crossorigin=""; type="font/woff2", </_next/static/media/caa3a2e1cccd8315-s.p.0wgildi0cnwt9.woff2>; rel="preload"; as="font"; crossorigin=""; type="font/woff2"
Cache-Control: no-cache, must-revalidate
X-Powered-By: Next.js
Content-Type: text/html; charset=utf-8
Date: Mon, 28 Sep 2026 13:33:54 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

Berdasarkan hasil tersebut, status `200 OK` menunjukkan bahwa permintaan berhasil diproses. Header `Content-Type: text/html; charset=utf-8` menunjukkan bahwa respons berupa dokumen HTML dengan karakter UTF-8. Header `X-Powered-By: Next.js` menunjukkan bahwa respons berasal dari aplikasi yang menggunakan Next.js.

Header `Cache-Control: no-cache, must-revalidate` menunjukkan bahwa respons tidak boleh langsung digunakan dari cache tanpa melakukan validasi terlebih dahulu.

### 3.2 Pengamatan Halaman Tidak Ditemukan

URL yang diamati:

```text
http://localhost:3000/halaman-tidak-ada
```

Halaman tersebut menghasilkan status:

```text
404 Not Found
```

Kode status `404` menunjukkan bahwa server dapat menerima dan memproses permintaan, tetapi sumber daya atau halaman dengan URL yang diminta tidak ditemukan.

**Bukti:** tangkapan layar halaman `404` yang terdapat pada folder `docs/praktikum`.

### 3.3 Ringkasan Pengamatan HTTP

| URL | Method | Status Code | Content-Type | Header/Informasi Lain |
|---|---|---:|---|---|
| `http://localhost:3000/` | HEAD | 200 OK | `text/html; charset=utf-8` | `Cache-Control: no-cache, must-revalidate`, `X-Powered-By: Next.js` |
| `http://localhost:3000/halaman-tidak-ada` | GET | 404 Not Found | Halaman error | Sumber daya tidak ditemukan |
| `https://example.com` | GET | 200 OK | `text/html` | `Server: cloudflare`, `Age: 180`, `cf-cache-status: HIT` |

### 3.4 Pemeriksaan `curl -v`

Perintah yang digunakan:

```bash
curl.exe -v https://example.com
```

Hasil pengamatan menunjukkan:

```text
> GET / HTTP/1.1
> Host: example.com
> User-Agent: curl/8.21.0
> Accept: */*

< HTTP/1.1 200 OK
< Content-Type: text/html
< Transfer-Encoding: chunked
< Connection: keep-alive
< Server: cloudflare
< Last-Modified: ...
< Allow: GET, HEAD
< Accept-Ranges: bytes
< Age: 180
< cf-cache-status: HIT
```

Perintah `curl -v` menampilkan informasi proses komunikasi HTTP secara lebih rinci, termasuk request yang dikirim dan response header yang diterima.

Pada hasil tersebut, `GET / HTTP/1.1` menunjukkan bahwa curl meminta halaman utama menggunakan metode GET. Respons `200 OK` menunjukkan bahwa permintaan berhasil. Header `Content-Type: text/html` menunjukkan bahwa isi respons berupa HTML.

Header `cf-cache-status: HIT` menunjukkan bahwa respons dilayani melalui mekanisme cache Cloudflare. Nilai `Age` juga menunjukkan usia objek yang tersedia pada cache.

### 3.5 Alasan `curl -I` Menggunakan HEAD

Opsi `-I` pada curl digunakan untuk mengambil **response header** tanpa mengambil isi body seperti pada GET. Karena itu, metode HTTP yang digunakan adalah **HEAD**.

Metode HEAD berguna untuk memeriksa informasi respons seperti status code, `Content-Type`, `Cache-Control`, dan header lainnya tanpa perlu mengunduh isi halaman.

Pada pengujian:

```bash
curl.exe -I http://localhost:3000
```

server memberikan:

```text
HTTP/1.1 200 OK
```

beserta berbagai response header dari aplikasi Next.js.

### 3.6 Pengamatan Pengalihan HTTP

Pada praktikum, URL HTTP dapat digunakan untuk mengamati mekanisme pengalihan menuju HTTPS. Pengalihan biasanya ditandai oleh status 3xx dan header `Location` yang menunjukkan alamat tujuan baru.

Contoh pengamatan tambahan menggunakan curl:

```bash
curl.exe -v https://youtube.com
```

Hasil yang diperoleh menunjukkan:

```text
HTTP/1.1 301 Moved Permanently
Location: https://www.youtube.com/
```

Status `301 Moved Permanently` menunjukkan bahwa alamat yang diminta mengarahkan klien ke alamat lain. Header `Location` menunjukkan URL tujuan pengalihan.

## 4. Kendala dan Penyelesaian

Beberapa hal yang perlu diperhatikan selama pengujian adalah perbedaan antara perintah curl pada Windows dan sistem operasi lain. Pada PowerShell, `curl` dapat merujuk ke perintah bawaan PowerShell sehingga digunakan `curl.exe` agar yang dijalankan adalah program curl sebenarnya.

Kendala lain adalah memastikan development server Next.js sudah berjalan sebelum melakukan pengujian terhadap `localhost:3000`. Apabila server belum aktif, permintaan HTTP ke alamat tersebut tidak dapat memperoleh respons dari aplikasi.

Untuk halaman yang tidak ditemukan, digunakan URL khusus:

```text
http://localhost:3000/halaman-tidak-ada
```

URL tersebut digunakan untuk membuktikan respons `404 Not Found`.

## 5. Catatan Pemanfaatan AI

AI digunakan sebagai alat bantu dalam penyusunan dokumen teknis, terutama untuk membantu menyusun struktur Markdown, merapikan penjelasan teknis, dan menjelaskan hasil pengamatan HTTP yang sudah diperoleh dari lingkungan praktikum.

Perintah dan hasil pengujian tetap berasal dari lingkungan pengembangan yang digunakan, sedangkan hasil pengamatan HTTP diverifikasi menggunakan browser dan terminal.

Bagian yang dibantu AI meliputi:
- penyusunan struktur dokumen teknis;
- perapian penjelasan hasil pengamatan HTTP;
- penjelasan fungsi status code dan response header;
- penyusunan tabel hasil pengamatan.

Verifikasi dilakukan dengan mencocokkan isi dokumen dengan hasil pengujian pada terminal, halaman `localhost:3000`, halaman `404`, serta bukti yang tersedia pada folder `docs/praktikum`.
