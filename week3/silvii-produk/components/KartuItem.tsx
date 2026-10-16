import type { Item, Kategori } from "@/lib/tipe";

const labelKategori: Record<Kategori, string> = {
  energi: "Energi",
  lingkungan: "Lingkungan",
  kampus: "Kampus",
};

export default function KartuItem({ item }: { item: Item }) {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      
      <span className="mb-3 w-fit rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
        {labelKategori[item.kategori]}
      </span>

      <h3 className="mb-2 text-lg font-bold text-gray-900">
        {item.judul}
      </h3>

      <p className="mb-4 text-sm text-gray-600 flex-grow">
        {item.deskripsi}
      </p>

      {!item.tersedia && (
        <div className="mt-auto rounded-md bg-red-50 p-2 text-center text-sm font-medium text-red-600">
          Sementara tidak tersedia
        </div>
      )}
      
    </div>
  );
}