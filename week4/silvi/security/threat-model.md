# Threat Model CyberShield

Threat model ini dibuat berdasarkan kondisi CyberShield v0.1 yang berjalan sebagai
prototype frontend untuk analisis risiko URL.

## Referensi Elemen DFD

| ID | Elemen |
|---|---|
| E01 | Pengguna |
| P01 | Input & Validasi URL |
| P02 | Analisis Risiko URL |
| P03 | Generate Hasil Analisis |
| D01 | Aturan Deteksi |
| D02 | Mock/Sample URL |
| F01 | URL yang akan dianalisis |
| F02 | Pesan validasi |
| F03 | URL valid |
| F04 | Aturan deteksi |
| F05 | Contoh URL |
| F06 | Indikator risiko & risk score |
| F07 | Hasil analisis & rekomendasi |

## Referensi Aset

| ID | Aset |
|---|---|
| A01 | URL yang dianalisis |
| A02 | Hasil analisis URL |
| A03 | Aturan deteksi URL |
| A04 | Mock/sample URL |
| A05 | Halaman analisis URL |
| A06 | Mesin analisis URL |

---

## T01 — Manipulasi URL Input

- **Kategori STRIDE:** Tampering
- **Elemen DFD:** F01 → P01
- **Aset terdampak:** A01 — URL yang dianalisis
- **Threat:** Penyerang memanipulasi input URL agar berbeda dari data yang
  seharusnya dianalisis atau mencoba memasukkan format yang tidak sesuai
  dengan validasi aplikasi.
- **Kondisi produk:** URL berasal langsung dari input pengguna dan diteruskan
  ke proses validasi sebelum dianalisis.
- **Dampak:** URL yang tidak sesuai dapat diproses atau menghasilkan hasil
  analisis yang tidak sesuai dengan tujuan pengguna.

---

## T02 — Manipulasi Proses Validasi

- **Kategori STRIDE:** Tampering
- **Elemen DFD:** P01 — Input & Validasi URL
- **Aset terdampak:** A01 — URL yang dianalisis
- **Threat:** Penyerang mencoba memanfaatkan kelemahan pada validasi URL agar
  input yang seharusnya ditolak dapat diteruskan ke proses analisis.
- **Kondisi produk:** Validasi URL dilakukan pada sisi aplikasi frontend.
- **Dampak:** Input yang tidak sesuai dapat mencapai proses analisis dan
  memengaruhi hasil pemeriksaan.

---

## T03 — Manipulasi Aturan Deteksi

- **Kategori STRIDE:** Tampering
- **Elemen DFD:** D01 → P02
- **Aset terdampak:** A03 — Aturan deteksi URL
- **Threat:** Aturan deteksi yang digunakan oleh mesin analisis dapat
  dimodifikasi sehingga indikator keamanan tidak lagi sesuai dengan aturan
  yang dirancang.
- **Kondisi produk:** Aturan seperti suspicious TLD, keyword, dan dangerous
  extension digunakan langsung oleh mesin analisis URL pada prototype.
- **Dampak:** Perubahan aturan dapat menghasilkan risk score dan klasifikasi
  yang tidak akurat.

---

## T04 — Tidak Ada Jejak Aktivitas Analisis

- **Kategori STRIDE:** Repudiation
- **Elemen DFD:** P02 — Analisis Risiko URL
- **Aset terdampak:** A02 — Hasil analisis URL
- **Threat:** Aktivitas analisis tidak dapat ditelusuri kembali apabila terjadi
  perselisihan mengenai hasil analisis.
- **Kondisi produk:** CyberShield v0.1 belum memiliki logging aktivitas analisis
  terpusat.
- **Dampak:** Sulit menentukan kapan suatu analisis dilakukan dan bagaimana
  hasil tersebut dihasilkan.

---

## T05 — Pengungkapan Hasil Analisis

- **Kategori STRIDE:** Information Disclosure
- **Elemen DFD:** F07 — Hasil analisis & rekomendasi
- **Aset terdampak:** A02 — Hasil analisis URL
- **Threat:** Hasil analisis URL dapat terlihat oleh pihak lain yang memiliki
  akses ke perangkat atau sesi browser pengguna.
- **Kondisi produk:** Hasil analisis ditampilkan langsung pada antarmuka
  browser dan prototype belum memiliki mekanisme akun atau kontrol akses.
- **Dampak:** Informasi mengenai URL yang diperiksa dan hasil penilaiannya
  dapat diketahui pihak yang tidak dimaksudkan.

---

## T06 — Pengungkapan Aturan Deteksi

- **Kategori STRIDE:** Information Disclosure
- **Elemen DFD:** D01 → P02
- **Aset terdampak:** A03 — Aturan deteksi URL
- **Threat:** Detail aturan deteksi dapat diketahui oleh pihak yang tidak
  berwenang dan digunakan untuk mempelajari cara kerja analisis CyberShield.
- **Kondisi produk:** Aturan deteksi pada v0.1 merupakan bagian dari aplikasi
  frontend dan bukan layanan backend yang terpisah.
- **Dampak:** Penyerang dapat mempelajari indikator yang digunakan CyberShield
  dan menyesuaikan URL agar lebih sulit terdeteksi oleh aturan tersebut.

---

## T07 — Beban Berlebih pada Analisis URL

- **Kategori STRIDE:** Denial of Service
- **Elemen DFD:** P02 — Analisis Risiko URL
- **Aset terdampak:** A06 — Mesin analisis URL
- **Threat:** Pengguna atau pihak lain dapat melakukan input analisis secara
  berulang sehingga membebani proses analisis.
- **Kondisi produk:** Prototype v0.1 belum memiliki backend rate limiting atau
  mekanisme pembatasan request.
- **Dampak:** Jika mekanisme analisis dikembangkan menjadi layanan terpusat,
  penggunaan berlebihan dapat menurunkan ketersediaan layanan.

---

## T08 — Input Berulang pada Validasi URL

- **Kategori STRIDE:** Denial of Service
- **Elemen DFD:** P01 — Input & Validasi URL
- **Aset terdampak:** A05 — Halaman analisis URL
- **Threat:** Input URL dalam jumlah sangat banyak atau dilakukan secara
  otomatis dapat membebani proses validasi dan antarmuka.
- **Kondisi produk:** Form analisis pada v0.1 belum memiliki rate limiting atau
  pembatasan jumlah percobaan.
- **Dampak:** Respons antarmuka dapat terganggu apabila aplikasi menerima
  input berulang dalam jumlah besar.

---

## T09 — Penyalahgunaan Fungsi Client-Side

- **Kategori STRIDE:** Elevation of Privilege
- **Elemen DFD:** P01 dan P02
- **Aset terdampak:** A05 — Halaman analisis URL dan A06 — Mesin analisis URL
- **Threat:** Penyerang dapat memodifikasi atau memanipulasi kode client-side
  untuk mengubah perilaku proses analisis yang berjalan di browser.
- **Kondisi produk:** Logika analisis URL pada v0.1 berjalan pada sisi client
  dan belum diverifikasi oleh backend.
- **Dampak:** Hasil yang ditampilkan kepada pengguna dapat dimanipulasi
  sehingga tidak merepresentasikan proses analisis yang sebenarnya.

---

## T10 — Manipulasi Hasil Analisis

- **Kategori STRIDE:** Tampering
- **Elemen DFD:** P03 — Generate Hasil Analisis
- **Aset terdampak:** A02 — Hasil analisis URL
- **Threat:** Hasil risk score, indikator, atau rekomendasi dapat dimanipulasi
  pada sisi client sebelum atau ketika ditampilkan kepada pengguna.
- **Kondisi produk:** Hasil analisis pada v0.1 dihasilkan dan ditampilkan pada
  aplikasi frontend tanpa validasi hasil dari backend.
- **Dampak:** Pengguna dapat menerima rekomendasi keamanan yang tidak sesuai
  dengan hasil perhitungan sebenarnya.

---

## T11 — Pengungkapan Mock/Sample URL

- **Kategori STRIDE:** Information Disclosure
- **Elemen DFD:** D02 — Mock/Sample URL
- **Aset terdampak:** A04 — Mock/sample URL
- **Threat:** Data contoh yang digunakan untuk demonstrasi dapat diketahui atau
  disalin oleh pihak lain.
- **Kondisi produk:** Mock/sample URL merupakan bagian dari aplikasi dan
  digunakan secara langsung untuk demonstrasi fitur.
- **Dampak:** Dampaknya relatif rendah karena data tersebut bukan data pribadi
  atau data rahasia, tetapi tetap dapat mengungkap contoh input yang digunakan
  dalam aplikasi.

---

## T12 — Penyalahgunaan Identitas Pengguna

- **Kategori STRIDE:** Spoofing
- **Elemen DFD:** E01 → F01
- **Aset terdampak:** A01 — URL yang dianalisis
- **Threat:** Pihak lain dapat menggunakan perangkat atau sesi browser pengguna
  untuk melakukan analisis tanpa dapat dibedakan dari pengguna sebenarnya.
- **Kondisi produk:** CyberShield v0.1 belum memiliki sistem akun dan
  autentikasi pengguna.
- **Dampak:** Aktivitas analisis tidak dapat dikaitkan dengan identitas
  pengguna tertentu dan dapat menyulitkan proses audit pada pengembangan
  berikutnya.

---

## Ringkasan Threat STRIDE

| ID | STRIDE | Elemen DFD | Aset |
|---|---|---|---|
| T01 | Tampering | F01 → P01 | A01 |
| T02 | Tampering | P01 | A01 |
| T03 | Tampering | D01 → P02 | A03 |
| T04 | Repudiation | P02 | A02 |
| T05 | Information Disclosure | F07 | A02 |
| T06 | Information Disclosure | D01 → P02 | A03 |
| T07 | Denial of Service | P02 | A06 |
| T08 | Denial of Service | P01 | A05 |
| T09 | Elevation of Privilege | P01/P02 | A05, A06 |
| T10 | Tampering | P03 | A02 |
| T11 | Information Disclosure | D02 | A04 |
| T12 | Spoofing | E01 → F01 | A01 |