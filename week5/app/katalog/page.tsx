import type { Metadata } from "next";
import Link from "next/link";
import { daftarItem } from "@/lib/data";

export const metadata: Metadata = { title: "Katalog Item | CyberShield" };

export default function HalamanKatalog() {
  return (
    <main id="konten" className="mx-auto max-w-4xl p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Katalog Item</h1>
          <p className="text-sm text-slate-600 mt-1">
            Daftar perangkat dan komponen terdaftar pada sistem.
          </p>
        </div>
        <Link
          href="/katalog/tambah"
          className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 transition-colors shadow-sm"
        >
          + Tambah item
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {daftarItem.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                {item.kategori}
              </span>
              <span
                className={`text-xs font-bold ${
                  item.tersedia ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {item.tersedia ? "Tersedia" : "Tidak Tersedia"}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-3">
              {item.judul}
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              {item.deskripsi}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href={`/katalog/${item.id}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Lihat Detail #{item.id} →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

