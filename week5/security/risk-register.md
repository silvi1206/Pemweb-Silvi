# Risk Register CyberShield

## Metode Penilaian

Risk score dihitung menggunakan:

**Risk Score = Likelihood × Impact**

Skala yang digunakan:

| Nilai | Likelihood | Impact |
|---:|---|---|
| 1 | Sangat rendah | Sangat rendah |
| 2 | Rendah | Rendah |
| 3 | Sedang | Sedang |
| 4 | Tinggi | Tinggi |
| 5 | Sangat tinggi | Sangat tinggi |

## Penilaian Risiko

| ID | Threat | Likelihood | Impact | Risk Score | Prioritas |
|---|---|---:|---:|---:|---|
| T01 | Manipulasi URL Input | 4 | 3 | 12 | Prioritas |
| T02 | Manipulasi Proses Validasi | 4 | 3 | 12 | Tidak |
| T03 | Manipulasi Aturan Deteksi | 3 | 5 | 15 | Prioritas |
| T04 | Tidak Ada Jejak Aktivitas Analisis | 3 | 3 | 9 | Tidak |
| T05 | Pengungkapan Hasil Analisis | 3 | 4 | 12 | Prioritas |
| T06 | Pengungkapan Aturan Deteksi | 3 | 4 | 12 | Tidak |
| T07 | Beban Berlebih pada Analisis URL | 2 | 4 | 8 | Tidak |
| T08 | Input Berulang pada Validasi URL | 2 | 3 | 6 | Tidak |
| T09 | Penyalahgunaan Fungsi Client-Side | 4 | 4 | 16 | Prioritas |
| T10 | Manipulasi Hasil Analisis | 4 | 5 | 20 | Prioritas |
| T11 | Pengungkapan Mock/Sample URL | 2 | 1 | 2 | Tidak |
| T12 | Penyalahgunaan Identitas Pengguna | 2 | 2 | 4 | Tidak |

## Alasan Penilaian

### T01 — Manipulasi URL Input

**Likelihood: 4**

URL berasal langsung dari input pengguna dan validasi dilakukan pada sisi frontend sehingga input dapat dimanipulasi melalui browser.

**Impact: 3**

Manipulasi dapat menyebabkan URL yang berbeda dari input yang dimaksud diproses dan menghasilkan analisis yang tidak sesuai.

### T02 — Manipulasi Proses Validasi

**Likelihood: 4**

Validasi URL berjalan pada client sehingga pengguna yang mengontrol browser dapat memodifikasi perilaku client-side.

**Impact: 3**

Bypass validasi dapat menyebabkan input yang seharusnya ditolak diteruskan ke proses analisis.

### T03 — Manipulasi Aturan Deteksi

**Likelihood: 3**

Aturan deteksi merupakan bagian dari aplikasi frontend sehingga perlindungannya belum sekuat aturan yang disimpan dan diverifikasi oleh backend.

**Impact: 5**

Aturan menentukan indikator dan risk score CyberShield. Perubahan aturan dapat menyebabkan hasil analisis menjadi salah dan memengaruhi kepercayaan terhadap fungsi utama produk.

### T04 — Tidak Ada Jejak Aktivitas Analisis

**Likelihood: 3**

CyberShield v0.1 belum memiliki logging aktivitas analisis terpusat.

**Impact: 3**

Tanpa log, aktivitas analisis sulit ditelusuri ketika terjadi kesalahan atau perselisihan mengenai suatu hasil.

### T05 — Pengungkapan Hasil Analisis

**Likelihood: 3**

Hasil analisis ditampilkan langsung pada browser dan v0.1 belum memiliki sistem akun atau kontrol akses.

**Impact: 4**

URL yang dianalisis dapat mengandung informasi sensitif mengenai aktivitas pengguna sehingga pengungkapan hasil dapat menjadi masalah privasi.

### T06 — Pengungkapan Aturan Deteksi

**Likelihood: 3**

Aturan deteksi merupakan bagian dari aplikasi frontend dan dapat dipelajari dari kode client.

**Impact: 4**

Pengetahuan mengenai aturan dapat membantu pihak yang berniat buruk membuat URL yang menghindari indikator yang digunakan CyberShield.

### T07 — Beban Berlebih pada Analisis URL

**Likelihood: 2**

Pada v0.1 analisis masih berjalan pada client sehingga belum terdapat layanan backend terpusat yang dapat dibebani oleh banyak request.

**Impact: 4**

Jika arsitektur dikembangkan menjadi layanan terpusat, beban analisis berlebihan dapat mengurangi ketersediaan layanan.

### T08 — Input Berulang pada Validasi URL

**Likelihood: 2**

Serangan membutuhkan input berulang dalam jumlah besar dan saat ini proses utama berjalan di browser pengguna.

**Impact: 3**

Input berlebihan dapat mengganggu respons halaman analisis, tetapi dampaknya terhadap sistem v0.1 masih terbatas.

## T09 — Penyalahgunaan Fungsi Client-Side

- **Kategori STRIDE:** Tampering
- **Elemen DFD:** P01 dan P02
- **Aset terdampak:** A05 — Halaman analisis URL dan A06 — Mesin analisis URL
- **Threat:** Penyerang dapat memodifikasi atau memanipulasi kode client-side untuk mengubah perilaku proses analisis yang berjalan di browser.
- **Kondisi produk:** Logika analisis URL pada v0.1 berjalan pada sisi client dan belum diverifikasi oleh backend.
- **Dampak:** Hasil yang ditampilkan kepada pengguna dapat dimanipulasi sehingga tidak merepresentasikan proses analisis yang sebenarnya.

### T10 — Manipulasi Hasil Analisis

**Likelihood: 4**

Hasil analisis dibuat dan ditampilkan pada frontend tanpa validasi hasil dari backend.

**Impact: 5**

Hasil yang dimanipulasi dapat menyebabkan pengguna menerima rekomendasi keamanan yang salah, sehingga secara langsung memengaruhi tujuan utama CyberShield.

### T11 — Pengungkapan Mock/Sample URL

**Likelihood: 2**

Mock URL merupakan data yang sengaja disediakan aplikasi untuk demonstrasi.

**Impact: 1**

Data tersebut bukan data pribadi atau rahasia sehingga pengungkapannya memiliki dampak yang sangat rendah.

### T12 — Penyalahgunaan Identitas Pengguna

**Likelihood: 2**

CyberShield v0.1 belum memiliki akun pengguna sehingga tidak terdapat kredensial pengguna yang dapat diambil alih.

**Impact: 2**

Dampaknya relatif rendah karena identitas pengguna belum digunakan untuk mengontrol akses terhadap data atau fungsi aplikasi.

## Lima Risiko Prioritas

### R01 — Manipulasi Hasil Analisis

- **Threat:** T10
- **Risk Score:** 20
- **Prioritas:** Sangat tinggi
- **Alasan:** Hasil analisis merupakan fungsi utama CyberShield. Karena proses dan hasil masih berada pada client, manipulasi dapat membuat pengguna menerima keputusan keamanan yang salah.

### R02 — Penyalahgunaan Fungsi Client-Side

- **Threat:** T09
- **Risk Score:** 16
- **Prioritas:** Tinggi
- **Alasan:** Logika analisis pada v0.1 berjalan di browser sehingga pengguna dapat memodifikasi perilaku client dan memengaruhi keandalan proses analisis.

### R03 — Manipulasi Aturan Deteksi

- **Threat:** T03
- **Risk Score:** 15
- **Prioritas:** Tinggi
- **Alasan:** Aturan deteksi menjadi dasar penentuan risk score. Manipulasi aturan dapat menyebabkan banyak hasil analisis menjadi tidak akurat.

### R04 — Manipulasi URL Input

- **Threat:** T01
- **Risk Score:** 12
- **Prioritas:** Tinggi
- **Alasan:** URL merupakan input utama CyberShield dan berasal dari pengguna sehingga harus diperlakukan sebagai data yang tidak sepenuhnya terpercaya.

### R05 — Pengungkapan Hasil Analisis

- **Threat:** T05
- **Risk Score:** 12
- **Prioritas:** Tinggi
- **Alasan:** Hasil analisis ditampilkan pada browser dan dapat berkaitan dengan URL yang diperiksa pengguna. Tidak adanya akun atau kontrol akses pada v0.1 meningkatkan risiko privasi pada pengembangan berikutnya.