# Security Control Plan CyberShield

## R01 — Manipulasi Hasil Analisis

- **Threat:** T10 — Manipulasi Hasil Analisis
- **Risk Score:** 20
- **Kontrol:** Memindahkan proses analisis dan perhitungan risk score yang penting ke server-side.
- **Implementasi:** URL yang dikirim pengguna divalidasi dan dianalisis di server. Frontend hanya menerima dan menampilkan hasil analisis dari server.
- **Efek:** Mengurangi likelihood manipulasi hasil karena hasil tidak lagi sepenuhnya ditentukan oleh client-side JavaScript.
- **Mapping:** Tugas 2


## R02 — Penyalahgunaan Fungsi Client-Side

- **Threat:** T09 — Penyalahgunaan Fungsi Client-Side
- **Risk Score:** 16
- **Kontrol:** Memisahkan logika keamanan penting dari client-side dan melakukan validasi ulang di server.
- **Implementasi:** Fungsi yang menentukan keputusan keamanan, seperti validasi URL dan perhitungan risk score, tidak hanya dipercayakan kepada browser. Server melakukan pemeriksaan ulang sebelum menghasilkan hasil analisis.
- **Efek:** Mengurangi likelihood penyalahgunaan atau manipulasi fungsi melalui browser pengguna.
- **Mapping:** Tugas 2


## R03 — Manipulasi Aturan Deteksi

- **Threat:** T03 — Manipulasi Aturan Deteksi
- **Risk Score:** 15
- **Kontrol:** Menyimpan aturan deteksi pada sisi server dan membatasi akses perubahan terhadap aturan tersebut.
- **Implementasi:** Detection rules tidak diletakkan sebagai sumber kebenaran utama di client. Perubahan rules hanya dapat dilakukan oleh komponen atau akun yang memiliki hak akses sesuai. Integrity protection dapat ditambahkan untuk memastikan rules tidak berubah secara tidak sah.
- **Efek:** Mengurangi likelihood perubahan detection rules dan menjaga integritas proses analisis.
- **Mapping:** Tugas 2


## R04 — Manipulasi URL Input

- **Threat:** T01 — Manipulasi URL Input
- **Risk Score:** 12
- **Kontrol:** Melakukan validasi dan sanitasi URL pada server-side.
- **Implementasi:** URL dari pengguna diperlakukan sebagai input yang tidak terpercaya. Server memeriksa format, skema, dan karakteristik URL sebelum URL diteruskan ke proses analisis.
- **Efek:** Mengurangi likelihood input berbahaya atau input yang telah dimanipulasi mencapai proses analisis tanpa pemeriksaan.
- **Mapping:** Tugas 2


## R05 — Pengungkapan Hasil Analisis

- **Threat:** T05 — Pengungkapan Hasil Analisis
- **Risk Score:** 12
- **Kontrol:** Menggunakan komunikasi HTTPS serta menerapkan kontrol akses dan minimisasi data ketika sistem sudah memiliki backend dan akun pengguna.
- **Implementasi:** Data hasil analisis dikirim melalui koneksi terenkripsi. Pada pengembangan dengan akun pengguna, hasil analisis hanya dapat diakses oleh pengguna yang berhak. Data yang tidak diperlukan tidak disimpan atau ditampilkan.
- **Efek:** Mengurangi likelihood penyadapan data selama transmisi dan mengurangi impact jika terjadi pengungkapan data yang tidak diperlukan.
- **Mapping:** Tugas 3