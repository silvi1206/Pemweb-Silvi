import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cariItem } from "@/lib/data";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = cariItem(Number(id));
  return {
    title: item
      ? `${item.judul} | CyberShield`
      : "Item Tidak Ditemukan | CyberShield",
  };
}

export default async function HalamanDetailItem({ params }: Props) {
  const { id } = await params;
  const item = cariItem(Number(id));

  if (!item) {
    notFound();
  }

  return (
    <main id="konten" className="mx-auto max-w-2xl p-6 mt-8">
      <Link
        href="/katalog"
        className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 mb-4"
      >
        ← Kembali ke Katalog
      </Link>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
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
        <h1 className="text-2xl font-bold text-slate-900">{item.judul}</h1>
        <p className="text-sm text-slate-600 mt-3 leading-relaxed">
          {item.deskripsi}
        </p>
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>ID Item: #{item.id}</span>
          <Link
            href="/katalog/tambah"
            className="text-blue-600 hover:underline font-medium"
          >
            + Tambah item baru
          </Link>
        </div>
      </div>
    </main>
  );
}

