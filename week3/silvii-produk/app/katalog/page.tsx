import DaftarItem from "@/components/DaftarItem";
import { daftarItem } from "@/lib/data";

export default function HalamanKatalog() {
  return (
    <main id="konten" className="mx-auto max-w-6xl p-4">
      <section className="py-8">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Katalog Produk
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          Daftar produk energi, lingkungan, dan fasilitas kampus.
        </p>
      </section>

      <DaftarItem items={daftarItem} />
    </main>
  );
}