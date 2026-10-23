# Modul 4 — Praktikum Pengembangan Aplikasi Web
Nama : Silviana Maristha Ginting
Nim : 105224001

## 1. Identitas Project

| Keterangan | Isi |
|---|---|
| Nama Project | CyberShield |
| Fungsi | URL Security Analyzer |
| Framework | Next.js |
| Next.js | 16.3.8 |
| React | 19.2.8 |
| TypeScript | 5.x |
| Styling | Tailwind CSS v4 |
| Routing | App Router |
| Cache Components | Tidak aktif |
| Branch saat pengerjaan | `main` / perubahan Week 4 |
| Repository | `https://github.com/silvi1206/Pemweb-Silvi.git` |

Project CyberShield merupakan prototype aplikasi untuk melakukan analisis keamanan URL. Pada Modul 4, implementasi difokuskan pada routing Next.js menggunakan App Router, dynamic route, struktur layout, pembagian Server dan Client Components, serta verifikasi TypeScript, lint, dan production build.

---

## 2. Versi Next.js dan Cache Components

Versi Next.js yang digunakan pada project adalah **Next.js 16.3.8**. Versi tersebut terlihat pada hasil `npm run build`.

File konfigurasi `next.config.ts` tidak mengaktifkan opsi:

```ts
cacheComponents: true
```

Sehingga **Cache Components tidak diaktifkan** pada project ini.

Konfigurasi saat ini:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

Dengan demikian, pengerjaan routing dilakukan menggunakan perilaku App Router standar pada Next.js.

---

## 3. Struktur Folder App Router

Struktur utama folder `app/` pada project:

```text
app/
│
├── favicon.ico
├── globals.css
├── layout.tsx
├── page.tsx
│
├── about/
│   └── page.tsx
│
├── analyze/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
│
└── latihan-routing/
    ├── page.tsx
    └── [id]/
        └── page.tsx
```

Folder `[id]` digunakan untuk membuat **dynamic route segment**, sehingga nilai `id` dapat diperoleh dari URL.

---

## 4. Route Map

Berikut route yang tersedia pada project CyberShield:

| URL | File | Jenis | Isi Halaman |
|---|---|---|---|
| `/` | `app/page.tsx` | Static | Halaman utama CyberShield, penjelasan URL security analyzer dan fitur aplikasi |
| `/about` | `app/about/page.tsx` | Static | Informasi CyberShield, proses analisis, indikator keamanan, risk score, dan keterbatasan |
| `/analyze` | `app/analyze/page.tsx` | Static | Halaman analisis URL dan komponen `UrlAnalyzer` |
| `/analyze/[id]` | `app/analyze/[id]/page.tsx` | Dynamic | Detail sampel kasus berdasarkan parameter `id` |
| `/latihan-routing` | `app/latihan-routing/page.tsx` | Static | Daftar data latihan dynamic routing |
| `/latihan-routing/[id]` | `app/latihan-routing/[id]/page.tsx` | Dynamic | Detail data latihan berdasarkan parameter `id` |

### Dynamic Route

Dynamic route menggunakan folder:

```text
app/analyze/[id]/page.tsx
app/latihan-routing/[id]/page.tsx
```

Parameter `id` diperoleh dari URL. Contohnya:

```text
/analyze/1
/analyze/2
/latihan-routing/1
/latihan-routing/2
```

Pada kedua dynamic route juga digunakan `generateStaticParams()` sehingga data ID yang tersedia dapat dipersiapkan saat proses build.

---

## 5. Implementasi Dynamic Routing

### 5.1 Dynamic Route `/latihan-routing/[id]`

File:

```text
app/latihan-routing/[id]/page.tsx
```

Halaman mengambil parameter `id` dari URL dan menggunakan fungsi:

```ts
getLatihanItemById(id)
```

untuk mencari data latihan berdasarkan ID.

Contoh URL:

```text
http://localhost:3000/latihan-routing/1
```

Hasil pengujian menunjukkan halaman **Analisis URL Demo** berhasil ditampilkan dan parameter `id` terbaca sebagai `1`.

![Dynamic route latihan ID 1](docs/praktikum/routing.png)

### 5.2 Dynamic Route dengan ID Tidak Ditemukan

Pengujian dilakukan menggunakan:

```text
http://localhost:3000/latihan-routing/999
```

Karena data yang tersedia hanya ID 1 sampai 5, sistem menampilkan halaman **Data Tidak Ditemukan** dan menunjukkan parameter yang diminta adalah `999`.

![Dynamic route latihan ID 999](docs/praktikum/data-tidak-ditemukan.png)

### 5.3 Dynamic Route `/analyze/[id]`

File:

```text
app/analyze/[id]/page.tsx
```

Route ini digunakan untuk menampilkan detail sampel kasus keamanan berdasarkan ID.

Contoh:

```text
http://localhost:3000/analyze/1
```

Hasil pengujian menunjukkan **Kasus #1 KlikBCA Resmi** berhasil ditampilkan.

![Dynamic route analyze ID 1](docs/praktikum/analyze-1.png)

### 5.4 Dynamic Route dengan ID Tidak Ditemukan

Pengujian menggunakan:

```text
http://localhost:3000/analyze/999
```

Sistem menampilkan pesan **Sampel Kasus Tidak Ditemukan** karena ID `999` tidak tersedia. Sistem juga menampilkan daftar sampel yang tersedia, yaitu ID 1 sampai 5.

![Dynamic route analyze ID 999](docs/praktikum/sample-kasus-tidak-ditemukan.png)

### 5.5 Ringkasan Pengujian Dynamic Route

| URL | Hasil |
|---|---|
| `/latihan-routing/1` | ✅ Data berhasil ditampilkan |
| `/latihan-routing/999` | ✅ Menampilkan Data Tidak Ditemukan |
| `/analyze/1` | ✅ Sampel kasus berhasil ditampilkan |
| `/analyze/999` | ✅ Menampilkan Sampel Kasus Tidak Ditemukan |

---

## 6. `generateStaticParams()`

Kedua dynamic route menggunakan `generateStaticParams()`.

Pada:

```text
app/analyze/[id]/page.tsx
```

parameter ID sampel disiapkan dari data `SAMPLE_URLS`.

Pada:

```text
app/latihan-routing/[id]/page.tsx
```

parameter ID disiapkan dari data latihan routing.

Hal ini juga terlihat pada hasil production build. Next.js menampilkan route dynamic sebagai **SSG menggunakan `generateStaticParams`**.

Contoh hasil build:

```text
/analyze/[id]
├── /analyze/1
├── /analyze/2
├── /analyze/3
└── [+2 more paths]

/latihan-routing/[id]
├── /latihan-routing/1
├── /latihan-routing/2
├── /latihan-routing/3
└── [+2 more paths]
```

---

## 7. Layout dan Template

Project menggunakan Root Layout pada:

```text
app/layout.tsx
```

Root Layout membungkus seluruh halaman dan digunakan untuk elemen UI yang bersifat umum, yaitu:

```tsx
<Navbar />
<main>{children}</main>
<Footer />
```

Dengan struktur tersebut, `Navbar` dan `Footer` tetap digunakan ketika pengguna berpindah antar-route.

### Template

Pada project ini tidak terdapat file:

```text
template.tsx
```

Sehingga project tidak menggunakan Template untuk membuat ulang state/component tree ketika berpindah antar-segment.

### Perbandingan

| Fitur | Project CyberShield |
|---|---|
| Root Layout | Digunakan |
| Nested Layout | Tidak ada |
| `template.tsx` | Tidak digunakan |
| Navbar global | Ada |
| Footer global | Ada |

Kesimpulannya, project menggunakan `layout.tsx` sebagai struktur UI global, sedangkan `template.tsx` belum digunakan.

---

## 8. Loading State

Setelah pemeriksaan struktur `app/`, tidak ditemukan file:

```text
loading.tsx
```

Dengan demikian, project CyberShield **belum menggunakan route-level Loading UI melalui `loading.tsx`**.

Tidak ada implementasi khusus untuk menampilkan fallback loading pada segment route menggunakan file tersebut.

---

## 9. Error State

Pada struktur `app/` juga tidak ditemukan file:

```text
error.tsx
```

Dengan demikian, project CyberShield **belum menerapkan Error Boundary route-level menggunakan `error.tsx`**.

Validasi data pada dynamic route dilakukan langsung di halaman masing-masing. Contohnya, ketika ID `999` tidak ditemukan, halaman menampilkan pesan:

```text
Sampel Kasus Tidak Ditemukan
```

atau:

```text
Data Tidak Ditemukan
```

Hal ini berbeda dengan penggunaan `error.tsx`, karena pesan tersebut merupakan UI yang dibuat langsung pada halaman dynamic route.

---

## 10. Server Component dan Client Component

Project menggunakan kombinasi Server Component dan Client Component.

### Server Components

| File | Jenis | Alasan |
|---|---|---|
| `app/page.tsx` | Server Component | Tidak menggunakan `"use client"` |
| `app/about/page.tsx` | Server Component | Tidak menggunakan `"use client"` |
| `app/analyze/page.tsx` | Server Component | Tidak menggunakan `"use client"` |
| `app/analyze/[id]/page.tsx` | Server Component | Mengambil parameter dynamic route dan menampilkan data |
| `app/latihan-routing/page.tsx` | Server Component | Mengambil data latihan |
| `app/latihan-routing/[id]/page.tsx` | Server Component | Mengambil data berdasarkan parameter route |

### Client Components

| File | Jenis | Alasan |
|---|---|---|
| `components/UrlAnalyzer.tsx` | Client Component | Menggunakan `useState`, `useRef`, dan `useId` serta membutuhkan interaksi pengguna |
| `components/Navbar.tsx` | Client Component | Menggunakan `usePathname()` untuk mengetahui route yang sedang aktif |

`UrlAnalyzer.tsx` menggunakan directive:

```tsx
"use client";
```

karena komponen membutuhkan state, event handler, dan API browser.

`Navbar.tsx` juga menggunakan:

```tsx
"use client";
```

karena membutuhkan `usePathname()`.

---

## 11. Server-Only Boundary

Project CyberShield belum menggunakan package:

```text
server-only
```

dan belum memiliki modul yang secara eksplisit diberi boundary server-only.

Data pada:

```text
data/latihan-routing.ts
```

digunakan oleh Server Component, tetapi tidak diberi import `server-only`.

Dengan kondisi tersebut, **server-only boundary eksplisit belum diterapkan** pada project.

Pengujian khusus dengan mengimpor modul `server-only` ke Client Component juga tidak dilakukan karena project belum memiliki modul yang ditetapkan sebagai server-only.

---

## 12. Pemeriksaan TypeScript

Pemeriksaan TypeScript dilakukan menggunakan:

```bash
npx tsc --noEmit
```

Hasil:

```text
Tidak terdapat output error.
```

Artinya pemeriksaan TypeScript berhasil dan tidak ditemukan error tipe pada project.

**Status: ✅ Lolos**

---

## 13. Pemeriksaan ESLint

Pemeriksaan lint dilakukan menggunakan:

```bash
npm run lint
```

Hasil:

```text
Tidak terdapat error.
```

**Status: ✅ Lolos**

---

## 14. Production Build

Production build dilakukan menggunakan:

```bash
npm run build
```

Build berhasil dengan Next.js 16.3.8.

Hasil utama:

```text
✓ Compiled successfully
✓ Finished TypeScript
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

Build juga berhasil menghasilkan route static dan dynamic.

Ringkasan:

```text
Route (app)

○ /
○ /about
○ /analyze
  /analyze/[id]
  /analyze/1
  /analyze/2
  /analyze/3
  ...
○ /latihan-routing
  /latihan-routing/[id]
  /latihan-routing/1
  /latihan-routing/2
  /latihan-routing/3
  ...
```

Keterangan:

```text
○ Static
● SSG using generateStaticParams
```

**Status: ✅ Lolos**

---

## 15. Ringkasan Verifikasi

| Pemeriksaan | Hasil |
|---|---|
| TypeScript | ✅ Lolos |
| ESLint | ✅ Lolos |
| Production Build | ✅ Lolos |
| Static Route | ✅ Berfungsi |
| Dynamic Route | ✅ Berfungsi |
| Dynamic Route valid | ✅ Berfungsi |
| Dynamic Route invalid | ✅ Ditangani |
| Root Layout | ✅ Digunakan |
| Template | Tidak digunakan |
| `loading.tsx` | Belum digunakan |
| `error.tsx` | Belum digunakan |
| Server Components | ✅ Digunakan |
| Client Components | ✅ Digunakan |
| Explicit `server-only` | Belum digunakan |

---

## 16. Git dan Repository

Repository project:

```text
https://github.com/silvi1206/Pemweb-Silvi.git
```

Branch yang tersedia pada repository antara lain:

```text
main
week3
Silvi-w2
```

Pada saat pemeriksaan sebelumnya, repository masih memiliki perubahan Week 4 yang belum seluruhnya di-commit.

Perubahan tersebut mencakup implementasi:

- dynamic routing;
- halaman latihan routing;
- data latihan routing;
- perubahan halaman analyze;
- perubahan komponen UI;
- dokumentasi.

Commit dan Pull Request Week 4 dilakukan setelah dokumentasi Modul 4 selesai dan seluruh perubahan siap dikumpulkan.

---

## 17. AI Usage

AI digunakan sebagai alat bantu selama pengerjaan Modul 4.

Penggunaan AI meliputi:

1. Membantu memahami konsep App Router pada Next.js.
2. Membantu memahami static route dan dynamic route.
3. Membantu memahami penggunaan `[id]` pada dynamic segment.
4. Membantu mengecek pembagian Server Component dan Client Component.
5. Membantu proses troubleshooting dan pemeriksaan project.
6. Membantu menyusun dokumentasi teknis.
7. Membantu menentukan bukti pengujian yang perlu didokumentasikan.

Implementasi tetap dijalankan pada project secara langsung dan hasilnya diverifikasi menggunakan browser, TypeScript, ESLint, dan production build.

---

## 18. Bukti Pengujian

Screenshot hasil pengujian disimpan pada:

```text
docs/praktikum/
```

### Bukti 1 — Dynamic Route `/latihan-routing/1`

File:

```text
docs/praktikum/routing.png
```

Menunjukkan dynamic route dengan ID `1` berhasil menampilkan detail data latihan.

![Bukti Dynamic Route Latihan](docs/praktikum/routing.png)

### Bukti 2 — Invalid Dynamic Route `/latihan-routing/999`

File:

```text
docs/praktikum/data-tidak-ditemukan.png
```

Menunjukkan sistem menangani ID `999` yang tidak tersedia dan menampilkan pesan **Data Tidak Ditemukan**.

![Bukti Data Tidak Ditemukan](docs/praktikum/data-tidak-ditemukan.png)

### Bukti 3 — Dynamic Route `/analyze/1`

File:

```text
docs/praktikum/analyze-1.png
```

Menunjukkan halaman detail sampel kasus dengan ID `1` berhasil ditampilkan.

![Bukti Analyze ID 1](docs/praktikum/analyze-1.png)

### Bukti 4 — Invalid Dynamic Route `/analyze/999`

File:

```text
docs/praktikum/sample-kasus-tidak-ditemukan.png
```

Menunjukkan sistem menangani ID `999` yang tidak tersedia dan menampilkan pesan **Sampel Kasus Tidak Ditemukan**.

![Bukti Sampel Kasus Tidak Ditemukan](docs/praktikum/sample-kasus-tidak-ditemukan.png)

---

## 19. Kesimpulan

Pada Modul 4, project CyberShield berhasil menerapkan routing menggunakan Next.js App Router, termasuk static route dan dynamic route.

Dynamic route diterapkan menggunakan:

```text
/analyze/[id]
/latihan-routing/[id]
```

Pengujian terhadap ID valid dan ID yang tidak tersedia berhasil dilakukan. Project juga menggunakan Root Layout untuk elemen UI global serta menerapkan pembagian Server Component dan Client Component sesuai kebutuhan.

Verifikasi menggunakan TypeScript, ESLint, dan production build berhasil dilakukan tanpa error.

Beberapa fitur yang dibahas dalam modul tetapi belum digunakan pada project adalah:

- `template.tsx`;
- `loading.tsx`;
- `error.tsx`;
- explicit `server-only` boundary.

Dengan demikian, implementasi Modul 4 yang sudah diterapkan pada project dapat diverifikasi melalui hasil pengujian route dan proses build yang berhasil.
