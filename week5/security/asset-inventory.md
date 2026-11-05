# Asset Inventory CyberShield

## 1. Data

| ID | Aset | C | I | A | Status | Alasan |
|---|---|---:|---:|---:|---|---|
| A01 | URL yang dianalisis | 2 | 3 | 2 | Aktif | URL merupakan input utama CyberShield dan dapat mengandung informasi sensitif, sementara integritasnya penting agar analisis tidak berubah. |
| A02 | Hasil analisis URL | 2 | 3 | 2 | Aktif | Hasil analisis menjadi dasar rekomendasi keamanan sehingga perubahan atau manipulasi hasil dapat menyesatkan pengguna. |
| A03 | Aturan deteksi URL | 2 | 3 | 2 | Aktif | Aturan deteksi menentukan hasil analisis sehingga perubahan tidak sah dapat menyebabkan penilaian risiko yang salah. |
| A04 | Mock/sample URL | 1 | 2 | 2 | Aktif | Data digunakan untuk demonstrasi dan pengujian fitur sehingga dampak kebocorannya relatif rendah. |

## 2. Layanan

| ID | Aset | C | I | A | Status | Alasan |
|---|---|---:|---:|---:|---|---|
| A05 | Halaman analisis URL | 1 | 3 | 3 | Aktif | Halaman ini merupakan fungsi utama CyberShield dan harus tersedia serta menampilkan proses analisis dengan benar. |
| A06 | Mesin analisis URL | 1 | 3 | 3 | Aktif | Mesin analisis menentukan indikator dan risk score sehingga integritas proses sangat penting terhadap keakuratan hasil. |
| A07 | Website CyberShield | 1 | 3 | 3 | Aktif | Website merupakan antarmuka utama yang digunakan pengguna untuk mengakses fungsi CyberShield. |

## 3. Secrets

| ID | Aset | C | I | A | Status | Alasan |
|---|---|---:|---:|---:|---|---|
| A08 | Secret/API key | 3 | 3 | 2 | Rencana | Jika integrasi layanan eksternal ditambahkan, API key harus dijaga kerahasiaan dan integritasnya agar tidak disalahgunakan. |

> Pada prototype v0.1 belum terdapat API key atau secret eksternal yang digunakan.

## 4. Backup

| ID | Aset | C | I | A | Status | Alasan |
|---|---|---:|---:|---:|---|---|
| A09 | Backup source code | 2 | 3 | 2 | Aktif | Source code perlu tersedia untuk pemulihan apabila terjadi kehilangan atau perubahan yang tidak diinginkan. |
| A10 | Backup konfigurasi aplikasi | 2 | 3 | 2 | Rencana | Backup konfigurasi diperlukan agar aplikasi dapat dipulihkan ke konfigurasi yang benar pada pengembangan berikutnya. |

## 5. Log

| ID | Aset | C | I | A | Status | Alasan |
|---|---|---:|---:|---:|---|---|
| A11 | Log aktivitas analisis | 2 | 3 | 2 | Rencana | Log dapat digunakan untuk audit aktivitas analisis dan harus terlindungi dari perubahan yang tidak sah. |
| A12 | Log error aplikasi | 1 | 3 | 2 | Rencana | Log error dapat membantu debugging dan pemeliharaan aplikasi ketika mekanisme logging diterapkan. |

> Logging terpusat belum diimplementasikan pada prototype v0.1.

## 6. Akun Admin

| ID | Aset | C | I | A | Status | Alasan |
|---|---|---:|---:|---:|---|---|
| A13 | Akun admin | 3 | 3 | 2 | Rencana | Akun admin pada pengembangan berikutnya dapat memiliki hak pengelolaan sistem sehingga kredensial dan aksesnya perlu dilindungi. |

> Fitur akun admin belum diimplementasikan pada prototype v0.1.

## Rating

- **C (Confidentiality/Kerahasiaan)**
  - 1 = rendah
  - 2 = sedang
  - 3 = tinggi
- **I (Integrity/Integritas)**
  - 1 = rendah
  - 2 = sedang
  - 3 = tinggi
- **A (Availability/Ketersediaan)**
  - 1 = rendah
  - 2 = sedang
  - 3 = tinggi

## Mekanisme Kriptografi

Pada prototype CyberShield v0.1 belum terdapat backend, database, penyimpanan password, atau mekanisme kriptografi aplikasi yang diimplementasikan secara khusus.

Aset yang perlu dilindungi menggunakan mekanisme kriptografi pada pengembangan berikutnya:

- **A13 Akun admin:** password disimpan menggunakan **password hashing**, bukan plaintext.
- **A08 Secret/API key:** secret harus disimpan secara aman dan tidak ditanamkan langsung dalam source code.
- **Data sensitif yang disimpan:** dapat menggunakan **enkripsi** sesuai kebutuhan.
- **Catatan penting atau data yang membutuhkan pembuktian keaslian:** dapat menggunakan **digital signature** atau **message authentication**.

Pada DFD, aset yang **sudah dilindungi kriptografi** harus dibedakan dari aset yang **baru direncanakan untuk dilindungi**. Pada v0.1 tidak ada aset data aplikasi yang menggunakan mekanisme kriptografi khusus.