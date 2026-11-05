import type { Item } from "./tipe";
import type { MasukanItem } from "./skema";

export const daftarItem: Item[] = [
  {
    id: 1,
    judul: "Pengukur Daya Listrik Surya",
    kategori: "energi",
    deskripsi: "Alat monitoring keluaran panel surya secara real-time di lingkungan laboratorium.",
    tersedia: true,
  },
  {
    id: 2,
    judul: "Sensor Kualitas Udara Kampus",
    kategori: "lingkungan",
    deskripsi: "Sensor partikulat PM2.5 untuk memantau kebersihan udara area terbuka hijau.",
    tersedia: true,
  },
  {
    id: 3,
    judul: "Sistem Pengendalian Lampu Gedung",
    kategori: "kampus",
    deskripsi: "Sistem otomatisasi jadwal pencahayaan ruang kelas cerdas untuk efisiensi energi.",
    tersedia: false,
  },
];

export function cariItem(id: number): Item | undefined {
  return daftarItem.find((i) => i.id === id);
}

export function judulSudahAda(judul: string) {
  const dicari = judul.toLowerCase();
  return daftarItem.some((i) => i.judul.toLowerCase() === dicari);
}

export function tambahItem(masukan: MasukanItem): Item {
  const id = Math.max(0, ...daftarItem.map((i) => i.id)) + 1;
  const item: Item = { id, ...masukan };
  daftarItem.push(item);
  return item;
}

