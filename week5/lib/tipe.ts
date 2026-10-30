export type Kategori = "energi" | "lingkungan" | "kampus";

export type Item = {
  id: number;
  judul: string;
  kategori: Kategori;
  deskripsi: string;
  tersedia: boolean;
};

