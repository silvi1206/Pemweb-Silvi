import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllLatihanItems,
  getLatihanItemById,
  getAdjacentLatihanItemIds,
} from "@/data/latihan-routing";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAllLatihanItems().map((item) => ({
    id: item.id,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = getLatihanItemById(id);

  if (!item) {
    return {
      title: "Data Tidak Ditemukan | CyberShield",
      description:
        "Data dengan ID tersebut tidak ditemukan pada modul latihan dynamic routing.",
    };
  }

  return {
    title: `${item.name} - Dynamic Routing | CyberShield`,
    description: item.description,
  };
}

export default async function LatihanRoutingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = getLatihanItemById(id);
  const allItems = getAllLatihanItems();

  // Handling ketika ID tidak ditemukan (misal: /latihan-routing/999 atau /latihan-routing/abc)
  if (!item) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-medium text-slate-500"
        >
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <Link
            href="/latihan-routing"
            className="hover:text-slate-900 transition-colors"
          >
            Latihan Dynamic Routing
          </Link>
          <span>/</span>
          <span className="text-rose-600 font-bold">Data Tidak Ditemukan</span>
        </nav>

        {/* Not Found Card */}
        <section
          aria-labelledby="not-found-heading"
          className="p-6 sm:p-10 rounded-2xl bg-white border border-[#F1DDE3] shadow-xs text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-3xl mx-auto">
            ⚠
          </div>

          <div className="space-y-2">
            <span className="inline-block text-xs font-mono font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Param ID Diminta: &quot;{id}&quot;
            </span>

            <h1
              id="not-found-heading"
              className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1"
            >
              Data Tidak Ditemukan
            </h1>

            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Data dengan ID <code className="font-mono text-rose-600 font-bold">{id}</code> tidak
              tersedia pada sistem. Modul latihan ini hanya menyediakan{" "}
              <strong>ID 1 sampai {allItems.length}</strong>.
            </p>
          </div>

          {/* Available valid IDs */}
          <div className="pt-3 border-t border-[#F1DDE3] max-w-md mx-auto">
            <p className="text-xs font-bold text-slate-600 mb-2.5">
              Pilih salah satu ID yang tersedia untuk dicoba:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {allItems.map((validItem) => (
                <Link
                  key={validItem.id}
                  href={`/latihan-routing/${validItem.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-[#F8E5EB] text-slate-800 border border-[#F1DDE3] hover:border-[#D96C8A] transition-all shadow-2xs"
                >
                  #{validItem.id} {validItem.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/latihan-routing"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#D96C8A] hover:bg-[#C65373] shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96C8A] focus-visible:ring-offset-2"
            >
              ← Kembali ke Latihan Dynamic Routing
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const { prevId, nextId } = getAdjacentLatihanItemIds(id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Top Navigation Links */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <Link
          href="/latihan-routing"
          className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-[#A64463] transition-colors group"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          <span>Kembali ke Daftar Latihan</span>
        </Link>

        <Link
          href="/"
          className="font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-medium text-slate-500"
      >
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <Link
          href="/latihan-routing"
          className="hover:text-slate-900 transition-colors"
        >
          Latihan Dynamic Routing
        </Link>
        <span>/</span>
        <span className="text-[#D96C8A] font-bold">Detail #{id}</span>
      </nav>

      {/* Main Detail Card */}
      <article
        aria-labelledby="detail-heading"
        className="p-6 sm:p-8 rounded-2xl bg-white border border-[#F1DDE3] shadow-xs space-y-6"
      >
        {/* Header detail */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F1DDE3]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#F8E5EB] text-[#A64463] border border-[#F1DDE3]">
                <span>🔍</span>
                <span>Segment [id]</span>
              </span>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                id = &quot;{item.id}&quot;
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                {item.category}
              </span>
            </div>

            <h1
              id="detail-heading"
              className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
            >
              {item.name}
            </h1>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-[#F8E5EB] text-[#A64463] text-lg font-black flex items-center justify-center border border-[#F1DDE3] shrink-0">
            #{item.id}
          </div>
        </div>

        {/* Data detail fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              ID Data
            </span>
            <p className="text-sm font-mono font-bold text-slate-900">
              {item.id}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Kategori
            </span>
            <p className="text-sm font-bold text-slate-900">{item.category}</p>
          </div>
        </div>

        {/* Description & Details */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Deskripsi Modul
          </h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            {item.description}
          </p>
          {item.details && (
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
              {item.details}
            </p>
          )}
        </div>

        {/* Feature list */}
        {item.features && item.features.length > 0 && (
          <div className="space-y-2 pt-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Karakteristik Modul Demo
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
              {item.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#D96C8A] font-bold shrink-0">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Explanation callout for demonstration */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#FFF8FA] border border-[#F1DDE3] space-y-2">
          <h3 className="text-xs font-bold text-[#A64463] flex items-center gap-1.5 uppercase tracking-wider">
            <span>🎓</span>
            <span>Penjelasan Teknis Dynamic Routing</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Halaman ini dirender oleh Server Component di file{" "}
            <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#F1DDE3] text-[#A64463]">
              app/latihan-routing/[id]/page.tsx
            </code>
            . Nilai segmen URL dinamis diekstrak melalui parameter:
          </p>
          <pre className="p-3 bg-white rounded-lg border border-[#F1DDE3] text-[11px] font-mono text-slate-800 overflow-x-auto">
            {`const { id } = await params;\n// id bernilai: "${item.id}"\nconst item = getLatihanItemById("${item.id}");`}
          </pre>
        </div>
      </article>

      {/* Prev / List / Next Pagination Navigation */}
      <nav
        aria-label="Navigasi antar item"
        className="p-4 rounded-2xl bg-white border border-[#F1DDE3] shadow-xs flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          {prevId ? (
            <Link
              href={`/latihan-routing/${prevId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#A64463] bg-[#F8E5EB] hover:bg-[#F1DDE3] border border-[#F1DDE3] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96C8A]"
            >
              <span>← Sebelumnya</span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-50 border border-slate-100 cursor-not-allowed"
            >
              <span>← Sebelumnya</span>
            </span>
          )}
        </div>

        <Link
          href="/latihan-routing"
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          Daftar Data
        </Link>

        <div>
          {nextId ? (
            <Link
              href={`/latihan-routing/${nextId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#A64463] bg-[#F8E5EB] hover:bg-[#F1DDE3] border border-[#F1DDE3] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96C8A]"
            >
              <span>Berikutnya →</span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-50 border border-slate-100 cursor-not-allowed"
            >
              <span>Berikutnya →</span>
            </span>
          )}
        </div>
      </nav>

      {/* Footer Back Link */}
      <div className="pt-2 flex justify-center">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
