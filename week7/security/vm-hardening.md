# PANDUAN DAN CHECKLIST VM HARDENING CYBERSHIELD (MILESTONE 2)

> [!NOTE]
> Pekerjaan hardening VM dan SSH akan dilakukan secara manual oleh pemilik project pada server target/virtual machine. Dokumen ini berfungsi sebagai panduan standar dan checklist operasional.

---

## 1. Hardening Layanan SSH (`sshd`)

### A. Tujuan Keamanan
Mencegah serangan brute-force credential SSH, credential stuffing, dan kompromi akun privileged `root`.

### B. Konfigurasi File `/etc/ssh/sshd_config` (atau `/etc/ssh/sshd_config.d/99-cybershield.conf`)

Pastikan direktif berikut aktif dan bernilai tepat:

```ini
# Nonaktifkan autentikasi password
PasswordAuthentication no

# Aktifkan autentikasi kunci publik (Public Key Authentication)
PubkeyAuthentication yes

# Tolak login langsung sebagai akun root
PermitRootLogin no

# Nonaktifkan otentikasi berbasis host dan rhosts
HostbasedAuthentication no
IgnoreRhosts yes

# Batasi percobaan login gagal
MaxAuthTries 3

# Nonaktifkan forwarding X11 yang tidak diperlukan
X11Forwarding no

# Batasi algoritma pertukaran kunci dan cipher ke standar modern (opsional)
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group-exchange-sha256
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
```

### C. Prosedur Penerapan & Validasi

1. **Uji Validitas Sintaks Konfigurasi:**
   ```bash
   sudo sshd -t
   ```
2. **Periksa Konfigurasi Efektif:**
   ```bash
   sudo sshd -T | grep -E "passwordauthentication|pubkeyauthentication|permitrootlogin|maxauthtries"
   ```
   *Expected Output:*
   ```text
   passwordauthentication no
   pubkeyauthentication yes
   permitrootlogin no
   maxauthtries 3
   ```
3. **Restart Layanan SSH (JANGAN tutup sesi terminal aktif sebelum teruji!):**
   ```bash
   sudo systemctl restart sshd
   ```
4. **Pengujian Login Kunci SSH dari Host Lokal:**
   ```bash
   # Harus BERHASIL dengan private key yang terdaftar
   ssh -i ~/.ssh/id_ed25519 user_deploy@<IP_VM>

   # Harus DITOLAK jika mencoba autentikasi dengan password atau root
   ssh -o PubkeyAuthentication=no user_deploy@<IP_VM>
   # Output: Permission denied (publickey)
   ssh root@<IP_VM>
   # Output: Permission denied (publickey)
   ```

---

## 2. Prosedur Audit Keamanan Sistem Operasi Menggunakan Lynis

### A. Tahap 1: Audit Sebelum Hardening (Baseline)
Jalankan perintah berikut sebelum konfigurasi diubah untuk mencatat skor awal:
```bash
sudo lynis audit system --quick > security/evidence/lynis-before.txt
```
Periksa indeks awal di baris rangkuman Lynis:
```bash
grep -E "Hardening index" security/evidence/lynis-before.txt
```

### B. Tahap 2: Menerapkan Rekomendasi Hardening
Terapkan perbaikan pada:
- Hardening SSH (`PasswordAuthentication no`, `PermitRootLogin no`).
- Update paket OS (`sudo apt update && sudo apt upgrade -y`).
- Aktifkan firewall UFW (`sudo ufw default deny incoming`, `sudo ufw allow 22/tcp`, `sudo ufw allow 80/tcp`, `sudo ufw allow 443/tcp`, `sudo ufw enable`).
- Konfigurasi proteksi kernel `/etc/sysctl.d/99-security.conf` (ASLR, IP forwarding disabled, ICMP redirect disabled).

### C. Tahap 3: Audit Setelah Hardening
Jalankan audit ulang:
```bash
sudo lynis audit system --quick > security/evidence/lynis-after.txt
```

### D. Kriteria Kelulusan
- [ ] Hardening Index Lynis mencapai **minimal 70**.
- [ ] `PasswordAuthentication` terbukti `no`.
- [ ] `PermitRootLogin` terbukti `no`.
- [ ] Berkas bukti `security/evidence/lynis-before.txt` dan `security/evidence/lynis-after.txt` terisi dengan output riil.

---

## 3. Status Pengujian Saat Ini

| Item Pengujian | Metode | Pelaksana | Status |
|---|---|---|---|
| Penonaktifan Password SSH | Manual Server Test | Pemilik Project | `NOT TESTED - MANUAL` |
| Autentikasi Public Key SSH | Manual Server Test | Pemilik Project | `NOT TESTED - MANUAL` |
| Penolakan Root Login SSH | Manual Server Test | Pemilik Project | `NOT TESTED - MANUAL` |
| Verifikasi Lynis Baseline | Eksekusi Lynis CLI | Pemilik Project | `NOT TESTED - MANUAL` |
| Verifikasi Lynis Hardened (Skor >= 70) | Eksekusi Lynis CLI | Pemilik Project | `NOT TESTED - MANUAL` |
