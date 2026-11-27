# Panduan dan Spesifikasi Container Hardening CyberShield

## 1. Ringkasan Arsitektur Kontainer

Implementasi kontainerisasi CyberShield dirancang berdasarkan prinsip **Defense in Depth**, **Least Privilege**, dan standar **CIS Docker Benchmark**. Layanan dibagi menjadi kontainer-kontainer terisolasi:
1. **Layanan Aplikasi (`cybershield-app`)**: Menjalankan Next.js 16 (App Router) pada runtime Node.js Alpine hardened.
2. **Layanan Database (`cybershield-db`)**: Menjalankan PostgreSQL (`postgres:18-alpine`) pada segmen jaringan internal privat.
3. **Layanan Migrasi (`cybershield-migrator`)**: Menjalankan migrasi skema database one-off secara non-root sebelum aplikasi aktif.

---

## 2. Fitur Pengerasan Kontainer (Container Hardening Controls)

### A. Non-Root User Execution (`USER nextjs`)
- **Implementasi**: Dalam `Dockerfile`, dibuat pengguna sistem `nextjs` (UID 1001). Pada runtime aktual, aplikasi berjalan di bawah identitas `uid=1001(nextjs) gid=65533(nogroup)`.
- **Tujuan**: Mencegah penyerang memperoleh hak akses `root` host jika terjadi kerentanan pada container.
- **Direktif Dockerfile**:
  ```dockerfile
  RUN addgroup --system --gid 1001 nodejs && \
      adduser --system --uid 1001 nextjs
  USER nextjs
  ```

### B. Linux Capability Dropping (`CapDrop=["ALL"]`)
- **Implementasi**: Seluruh Linux Kernel Capabilities yang biasanya diwariskan ke kontainer dicabut secara menyeluruh pada `cybershield-app` (`CapDrop=["ALL"]`).
- **Tujuan**: Mencegah proses di dalam kontainer mengubah routing jaringan, me-mount sistem berkas, memanipulasi waktu sistem, atau mengubah kepemilikan file (`CAP_CHOWN`, `CAP_DAC_OVERRIDE`, `CAP_NET_RAW`, dsb).
- **Konfigurasi Compose**:
  ```yaml
  cap_drop:
    - ALL
  ```

### C. No New Privileges Flag (`SecurityOpt=["no-new-privileges:true"]`)
- **Implementasi**: Menetapkan flag Linux kernel `PR_SET_NO_NEW_PRIVS`.
- **Tujuan**: Mencegah eskalasi hak akses melalui biner dengan flag `setuid` atau `setgid` (seperti `sudo` atau `su`) di dalam kontainer.

### D. Read-Only Root Filesystem (`ReadonlyRootfs=true`) & Tmpfs
- **Implementasi**: Sistem berkas kontainer aplikasi dikonfigurasi sebagai *read-only* murni (`ReadonlyRootfs=true`). Area yang memerlukan akses tulis (seperti cache kompilasi Next.js dan file sementara) dialokasikan secara eksplisit menggunakan in-memory `tmpfs` berizin UID/GID 1001:
  - `/tmp` (`size=64m,uid=1001,gid=1001`)
  - `/app/.next/cache` (`size=256m,uid=1001,gid=1001`)
- **Tujuan**: Mencegah injeksi kode berbahaya, modifikasi biner aplikasi, dan persistensi malware pada filesystem kontainer.

### E. Multi-Stage Build & Minimal Attack Surface
- **Stage 1 (`deps`)**: Mengunduh dan mengompilasi dependensi menggunakan `npm ci`.
- **Stage 2 (`prod-deps`)**: Menyiapkan dependensi produksi tanpa `devDependencies` (`npm ci --omit=dev`).
- **Stage 3 (`builder`)**: Menghasilkan Prisma client dan artefak build Next.js dengan dummy build-time `DATABASE_URL`.
- **Stage 4 (`migrator`)**: Image terpisah khusus untuk eksekusi migrasi skema basis data one-off.
- **Stage 5 (`runner`)**: Hanya menyalin file runtime yang mutlak dibutuhkan. Source code mentah TypeScript, compiler, dan devDependencies (`vitest`, `eslint`) ditinggalkan di luar stage produksi.
- Menggunakan `dumb-init` sebagai PID 1 untuk menangani penjalaran sinyal sistem UNIX (`SIGTERM`, `SIGINT`) secara benar guna mencegah *zombie processes*.

### F. Isolasi Jaringan dan Database Port Masking
- Database PostgreSQL (`postgres:18-alpine`) berada dalam jaringan Docker internal `cybershield-net`.
- **Port 5432 PostgreSQL TIDAK dipublikasikan ke host** (tidak ada port mapping pada interface host).
- Hanya kontainer dalam bridge network `cybershield-net` yang memiliki akses jaringan ke kontainer `db`.
- Aplikasi `app` dipublikasikan ke host pada antarmuka ganda: `0.0.0.0:3000` (IPv4) dan `[::]:3000` (IPv6).

### G. Resource Quotas & Limits
- Membatasi konsumsi CPU dan memori untuk mencegah serangan Denial of Service (DoS) berbasis konsumsi sumber daya (*resource exhaustion*):
  - `app`: Limit 1.5 CPU, 1024MB RAM (Reservation: 0.25 CPU, 256MB RAM).
  - `db`: Limit 1.0 CPU, 512MB RAM (Reservation: 0.20 CPU, 128MB RAM).
  - `migrator`: Limit 0.5 CPU, 256MB RAM (Reservation: 0.10 CPU, 64MB RAM).

---

## 3. Hasil Verifikasi Keamanan Kontainer (Actual Evidence Verification)

Bukti aktual pengujian dan status runtime kontainer tercatat pada direktori evidence:
[`security/evidence/docker-hardening/`](file:///d:/Project%20CyberShield/cybershield/security/evidence/docker-hardening/)

### Pemeriksaan 1: Verifikasi User Non-Root Runtime
- **Evidence File**: [`security/evidence/docker-hardening/container-user.txt`](file:///d:/Project%20CyberShield/cybershield/security/evidence/docker-hardening/container-user.txt)
- **Hasil Pemeriksaan**:
  ```text
  uid=1001(nextjs) gid=65533(nogroup) groups=65533(nogroup)
  ```
- **Analisis**: Kontainer aplikasi terbukti berjalan di bawah pengguna non-root UID 1001 (`nextjs`) dan GID 65533 (`nogroup`). Proses aplikasi tidak memiliki hak akses superuser (UID 0).
- **Status Verifikasi**: **VERIFIED**.

### Pemeriksaan 2: Verifikasi Konfigurasi Keamanan Kontainer (Security Inspection)
- **Evidence File**: [`security/evidence/docker-hardening/app-security.txt`](file:///d:/Project%20CyberShield/cybershield/security/evidence/docker-hardening/app-security.txt)
- **Hasil Pemeriksaan**:
  ```text
  ReadonlyRootfs=true
  CapDrop=["ALL"]
  SecurityOpt=["no-new-privileges:true"]
  ```
- **Analisis**:
  - `ReadonlyRootfs=true`: Filesystem root kontainer berstatus *read-only* secara ketat.
  - `CapDrop=["ALL"]`: Seluruh Linux kernel capabilities dicabut sepenuhnya.
  - `SecurityOpt=["no-new-privileges:true"]`: Eskalasi hak akses baru via setuid/setgid diblokir di level kernel.
- **Status Verifikasi**: **VERIFIED**.
- *(Catatan: Pengujian aktif invasif seperti manipulasi filesystem dengan `chown` atau simulasi container breakout belum dijalankan di environment ini sehingga tidak dicatat sebagai hasil pengujian fungsional).*

### Pemeriksaan 3: Verifikasi Isolasi Port & Publikasi Jaringan
- **Evidence Files**:
  - [`security/evidence/docker-hardening/app-ports.txt`](file:///d:/Project%20CyberShield/cybershield/security/evidence/docker-hardening/app-ports.txt)
  - [`security/evidence/docker-hardening/db-ports.txt`](file:///d:/Project%20CyberShield/cybershield/security/evidence/docker-hardening/db-ports.txt)
- **Hasil Pemeriksaan**:
  - **Aplikasi (`app`)**:
    ```text
    3000/tcp -> 0.0.0.0:3000
    3000/tcp -> [::]:3000
    ```
  - **Database (`db`)**:
    File `db-ports.txt` berukuran 0 byte (kosong, tidak ada port yang dipetakan).
- **Analisis**: Aplikasi web terbuka pada port 3000 IPv4 dan IPv6 host. Port 5432 database PostgreSQL sama sekali tidak dipublikasikan ke host, terisolasi 100% di dalam internal network `cybershield-net`.
- **Status Verifikasi**: **VERIFIED**.

### Pemeriksaan 4: Verifikasi Status Kontainer & Healthcheck
- **Evidence File**: [`security/evidence/docker-hardening/compose-status.txt`](file:///d:/Project%20CyberShield/cybershield/security/evidence/docker-hardening/compose-status.txt)
- **Hasil Pemeriksaan**:
  ```text
  NAME              IMAGE                    COMMAND                  SERVICE   CREATED          STATUS                    PORTS
  cybershield-app   cybershield-docker-app   "/usr/bin/dumb-init …"   app       14 minutes ago   Up 14 minutes (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
  cybershield-db    postgres:18-alpine       "docker-entrypoint.s…"   db        18 minutes ago   Up 18 minutes (healthy)   5432/tcp
  ```
- **Analisis**:
  - Service `cybershield-app` berstatus `Up (healthy)` dengan endpoint healthcheck HTTP `/api/health`.
  - Service `cybershield-db` (`postgres:18-alpine`) berstatus `Up (healthy)` melalui pengecekan `pg_isready`.
- **Status Verifikasi**: **VERIFIED**.
