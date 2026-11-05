# Dokumen Teknis Modul 6 — PostgreSQL dan Prisma ORM

**Nama/NIM**: silviana m ginting / 105224001

**Repositori**: https://github.com/silvi1206/Pemweb-Silvi

## 1. Rancangan Data
- Diagram dua entitas (Item dan Ulasan) beserta relasi 1:N, primary key, foreign key, serta constraint unik (`Item_judul_key`, `Ulasan_itemId_nama_key`).
- Aturan `onDelete: Restrict` dipilih untuk memastikan penghapusan item hanya lewat transaksi yang juga menghapus ulasan terkait.

![Diagram Entitas](file:///C:/Users/silvi/.gemini/antigravity/brain/261b2126-f968-4b6e-a74d-3353804855e9/docs/praktikum/diagram.png)

## 2. Skema dan Migrasi
- **prisma/schema.prisma**
```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Kategori {
  energi
  lingkungan
  kampus
}

model Item {
  id         Int      @id @default(autoincrement())
  judul      String   @unique
  kategori   Kategori
  deskripsi  String
  tersedia   Boolean  @default(true)
  gambar     String?  // null allowed
  dibuatPada DateTime @default(now())
  ulasan     Ulasan[]
}

model Ulasan {
  id         Int      @id @default(autoincrement())
  nama       String
  nilai      Int
  komentar   String
  dibuatPada DateTime @default(now())
  itemId     Int
  item       Item     @relation(fields: [itemId], references: [id], onDelete: Restrict)
  @@unique([itemId, nama])
}
```
- **Folder migrations**: `prisma/migrations/20261030093540_init` berisi `migration.sql` yang menciptakan tabel, indeks, dan foreign key sebagaimana di atas.
- Tangkapan layar hasil `\d "Ulasan"` menampilkan indeks unik dan foreign key (`Ulasan_itemId_fkey`).

![PSQL \d Ulasan](file:///C:/Users/silvi/.gemini/antigravity/brain/261b2126-f968-4b6e-a74d-3353804855e9/docs/praktikum/psql_ulasan.png)

## 3. Seed dan Prisma Client
- **Output seed** (dijalankan dua kali):
```
Seed selesai: 6 item, 6 ulasan
Seed selesai: 6 item, 6 ulasan
```
- Seed berada di `prisma/seed.ts` dan tidak mengimpor `lib/prisma.ts` sehingga dapat dijalankan secara terpisah.

## 4. Operasi CRUD
| Entitas | Halaman / Aksi | Metode Prisma | Galat yang ditangani |
|---------|----------------|---------------|----------------------|
| Item    | `/katalog` (tambah) | `prisma.item.create` | `P2002` – judul duplikat |
| Item    | `/katalog/[id]` (ubah) | `prisma.item.update` | `P2002` – judul duplikat, `P2025` – tidak ditemukan |
| Ulasan  | `/katalog/[id]` (tambah) | `prisma.ulasan.create` | `P2002` – nama duplikat per item, `P2003` – item tidak ditemukan |
| Ulasan  | `/katalog/[id]` (hapus) | `prisma.ulasan.deleteMany` | – |
| Item    | hapus (tanpa transaksi) | `prisma.item.delete` | foreign‑key error (RESTRICT) |
| Item    | hapus (dengan transaksi) | `prisma.$transaction([...])` | rollback pada kegagalan |

Tangkapan layar pesan galat pada formulir (contoh `P2002`):

![Galat P2002](file:///C:/Users/silvi/.gemini/antigravity/brain/261b2126-f968-4b6e-a74d-3353804855e9/docs/praktikum/p2002.png)

## 5. Transaksi dan Rollback
- **Tanpa transaksi**: menghapus item yang memiliki ulasan menghasilkan galat foreign key (RESTRICT) yang ditangkap di `error.tsx`.
- **Dengan transaksi**: `prisma.$transaction([prisma.ulasan.deleteMany({where:{itemId}}), prisma.item.delete({where:{id}})])` memastikan kedua operasi berhasil atau semua dibatalkan.
- Bukti rollback (sebelum & sesudah) ditunjukkan dengan perintah `SELECT "itemId", COUNT(*) FROM "Ulasan" GROUP BY "itemId";` dimana jumlah ulasan tetap sama setelah percobaan gagal.

## 6. Skenario Uji
| No | Skenario | Langkah | Hasil yang Diharapkan |
|----|----------|--------|------------------------|
| 1 | Tambah item sah | Isi form valid, submit | Item muncul di katalog |
| 2 | Tambah item judul ganda | Isi judul yang sudah ada | Galat `P2002` ditampilkan |
| 3 | Tambah item judul kosong | Kosongkan judul, submit | Galat Zod, tidak ada query |
| 4 | Ubah deskripsi item | Edit deskripsi, submit | Perubahan tersimpan, terlihat di detail |
| 5 | Ubah item yang sudah dihapus | Submit update pada id yang tidak ada | Galat `P2025`, pesan tidak ditemukan |
| 6 | Buka `/katalog/abc` | Akses slug tidak numerik | Halaman 404 |
| 7 | Hapus item beserta ulasannya | Klik hapus, konfirmasi | Item & ulasan hilang dari katalog |
| 8 | Hapus item, perintah kedua gagal | Simulasikan error pada delete ulasan | Rollback, ulasan tetap ada |
| 9 | Tambah ulasan nilai 6 | Nilai >5, submit | Galat Zod pada nilai |
|10 | Ulasan kedua dengan nama yang sama | Nama duplikat pada same item | Galat `P2002` pada ulasan |

## 7. Kendala dan Penyelesaian
- **Shadow database tidak dapat dibuat**: ditangani dengan memberikan user PostgreSQL hak `CREATEDB` atau memakai container Docker dengan user `postgres` superuser.
- **`npx prisma generate` tidak dijalankan otomatis**: dijalankan manual setelah setiap `migrate dev`.
- **Seed gagal karena mengimpor `lib/prisma.ts`**: dipisahkan menjadi `prisma/seed.ts` yang membuat PrismaClient sendiri dengan adapter PG.

## 8. Catatan Pemanfaatan AI
Alat: `git`, `npm`, `prisma`, `next`, `zod`.
Bagian yang digunakan: schema Prisma, migrasi, seed, Server Actions, transaksi.
Verifikasi: menjalankan `npm run lint`, `npm run test`, melihat output seed dan migrasi, serta screenshot galat.

**Tidak menggunakan AI**

