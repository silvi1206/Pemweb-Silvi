# Dokumentasi Vulnerability Scanning dan Pengelolaan SBOM CyberShield

## 1. Pendahuluan

Dokumen ini mendefinisikan prosedur, hasil pemindaian kerentanan (*vulnerability scanning*), serta spesifikasi *Software Bill of Materials* (SBOM) untuk citra kontainer CyberShield.

Pemindaian citra kontainer dilakukan dengan mengacu pada standar **OWASP Top 10**, kerangka kerja **CIS Benchmarks**, dan basis data **CVE (Common Vulnerabilities and Exposures)** / **GHSA (GitHub Security Advisories)** menggunakan alat pemindai keamanan standar industri: **Trivy** (Aqua Security).

---

## 2. Alat dan Prosedur Scanning

### A. Vulnerability Scanner: Trivy
Trivy digunakan untuk mendeteksi:
1. Kerentanan pada sistem operasi Alpine Linux (OS packages: apk).
2. Kerentanan pada dependensi aplikasi (Node.js npm packages).
3. Kerentanan pada image migrator dan runtime runner.

### B. Referensi Berkas Evidence Scanning
Hasil pemindaian aktual tersimpan pada direktori evidence:
- **Laporan Pemindaian Citra App**: [`security/evidence/container-security/app-scan.json`](file:///d:/Project%20CyberShield/cybershield/security/evidence/container-security/app-scan.json)
- **Laporan Pemindaian Citra Migrator**: [`security/evidence/container-security/migrator-scan.json`](file:///d:/Project%20CyberShield/cybershield/security/evidence/container-security/migrator-scan.json)
- **Dokumen SBOM CycloneDX**: [`security/evidence/container-security/sbom.cdx.json`](file:///d:/Project%20CyberShield/cybershield/security/evidence/container-security/sbom.cdx.json)

---

## 3. Hasil Pemindaian Aktual (Trivy Scan Results)

Berdasarkan hasil pemindaian langsung menggunakan Trivy terhadap citra kontainer CyberShield, berikut adalah ringkasan kerentanan yang terdeteksi:

### Rangkuman Kerentanan
| Target Image / Service | Total Kerentanan | UNKNOWN / LOW / MEDIUM | HIGH | CRITICAL | Status Kepatuhan |
|---|---|---|---|---|---|
| **`cybershield-app`** | **13** | 0 | **11** | **2** | **BELUM MEMENUHI TARGET (Temuan Terbuka)** |
| **`cybershield-migrator`** | **15** | 0 | **11** | **4** | **BELUM MEMENUHI TARGET (Temuan Terbuka)** |

> [!WARNING]
> **Status Evaluasi Kepatuhan:**
> Citra kontainer saat ini **belum memenuhi target 0 CRITICAL**. Kerentanan-kerentanan dengan tingkat keparahan CRITICAL dan HIGH yang terdeteksi pada pustaka pihak ketiga (*third-party dependencies*) masih menjadi **temuan aktif yang perlu ditindaklanjuti (Remediation Required)** pada fase pembaruan dependensi mendatang. Klaim awal yang menyatakan 0 HIGH dan 0 CRITICAL telah diperbarui dan diselaraskan dengan hasil scan aktual ini.

---

## 4. Rincian Temuan Kerentanan Kritis (CRITICAL Vulnerabilities)

### A. Kerentanan CRITICAL pada Framework Next.js (Mempengaruhi App & Migrator)
Pada kedua citra kontainer (`app` dan `migrator`), terdeteksi 2 kerentanan berstatus CRITICAL yang berasal dari dependensi paket `next`:

| Advisory ID | Paket Terdampak | Versi Terpasang | Versi Perbaikan (Fixed) | Deskripsi Singkat Kerentanan |
|---|---|---|---|---|
| **GHSA-2464-fhr4-w9xw** | `next` | `16.3.8` | `16.4.1` (atau `15.5.28`) | Kelemahan keamanan kritis pada penanganan request/routing internal Next.js. |
| **GHSA-673q-mjm6-r5xr** | `next` | `16.3.8` | `16.4.1` | Kerentanan kritis terkait eksploitasi kontrol akses atau pemrosesan header Next.js. |

### B. Kerentanan CRITICAL Tambahan pada Citra Migrator (`tinypool`)
Pada citra `migrator`, terdeteksi 2 kerentanan CRITICAL tambahan yang berasal dari dependensi tooling Node.js (`tinypool`):

| Advisory ID | Paket Terdampak | Versi Terpasang | Versi Perbaikan (Fixed) | Deskripsi Singkat Kerentanan |
|---|---|---|---|---|
| **CVE-2026-104848** | `tinypool` | `1.1.1` | `2.1.1` | Celah keamanan kritis worker thread pool execution pada `tinypool`. |
| **CVE-2026-104849** | `tinypool` | `1.1.1` | `2.1.2` | Kerentanan eksekusi asinkron pada worker manager `tinypool`. |

### C. Kerentanan HIGH (11 Temuan)
Sebanyak 11 kerentanan dengan tingkat keparahan **HIGH** terdeteksi pada paket-paket dependensi eksternal:
- `next` (v16.3.8): `CVE-2026-94482` (fixed di `16.4.1`)
- `brace-expansion` (v2.0.2): `CVE-2026-102276`, `CVE-2026-102278`, `CVE-2026-13149`, `CVE-2026-14257`, `CVE-2026-69152`
- `ip-address` (v10.1.0): `CVE-2026-69192` (fixed di `10.3.1`)
- `pacote` (v19.0.2 / v20.0.1): `CVE-2026-9496`
- `picomatch` (v4.0.3): `CVE-2026-33671`
- `sigstore` (v3.1.0): `CVE-2026-48815`

---

## 5. Rencana Tindak Lanjut Remediasi (Action Plan)

Untuk mencapai target **0 CRITICAL**, langkah mitigasi dan perbaikan dependensi berikut perlu ditindaklanjuti pada iterasi berikutnya:
1. **Pembaruan Next.js**: Melakukan upgrade paket `next` dari `16.3.8` ke versi patch `16.4.1` atau lebih baru untuk menyelesaikan `GHSA-2464-fhr4-w9xw`, `GHSA-673q-mjm6-r5xr`, dan `CVE-2026-94482`.
2. **Pembaruan Dependensi Tooling / Migrator**: Memperbarui dependensi Prisma/NPM yang menarik `tinypool` versi `1.1.1` ke versi `2.1.2+` guna mengatasi `CVE-2026-104848` dan `CVE-2026-104849`.
3. **Pemberlakuan Mitigasi Runtime Kompensasi**: Selagi proses upgrade dependensi dijadwalkan, kontrol hardening container yang aktif (`ReadonlyRootfs=true`, `CapDrop=["ALL"]`, `SecurityOpt=["no-new-privileges:true"]`, isolasi port non-root) bertindak sebagai kontrol kompensasi untuk memitigasi dampak potensial eksploitasi di tingkat sistem operasi.

---

## 6. Software Bill of Materials (SBOM)

SBOM aplikasi CyberShield dikelola menggunakan spesifikasi standar **CycloneDX**.

- **Format Berkas**: CycloneDX JSON
- **Spesifikasi Versi (specVersion)**: **1.7**
- **Skema Validasi**: `http://cyclonedx.org/schema/bom-1.7.schema.json`
- **Lokasi Berkas Evidence**: [`security/evidence/container-security/sbom.cdx.json`](file:///d:/Project%20CyberShield/cybershield/security/evidence/container-security/sbom.cdx.json)
- **Status Validasi JSON**: **VALID** (telah diverifikasi dan lolos validasi parsing JSON standar).

### Ringkasan Komponen yang Tercatat dalam SBOM
SBOM memuat total **417 komponen** perangkat lunak, mencakup:
- **Framework & Runtime**: `next` (v16.3.8), `react` & `react-dom` (v19.2.8), Node.js v22 runtime.
- **Database & Kriptografi**: `@prisma/client` & `@prisma/adapter-pg` (v7.10.1), `pg` (v8.23.1), `zod` (v4.6.7).
- **Komponen Sistem Operasi Minimal (Alpine Linux)**: `musl`, `openssl`, `libc6-compat`, `dumb-init`.
