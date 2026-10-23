import type { Metadata } from "next";
import Link from "next/link";
import { getAllLatihanItems } from "@/data/latihan-routing";

export const metadata: Metadata = {
  title: "Latihan Dynamic Routing | CyberShield",
  description:
    "Halaman demonstrasi Dynamic Routing pada Next.js menggunakan parameter ID.",
};

export default function LatihanRoutingPage() {
  const items = getAllLatihanItems();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Navigation to Home */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#A64463] transition-colors group"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Header Section */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F8E5EB] text-[#A64463] border border-[#F1DDE3] shadow-2xs">
            <span>🚀</span>
            <span>Next.js App Router</span>
          </span>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
            app/latihan-routing/page.tsx
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Latihan <span className="text-[#D96C8A]">Dynamic Routing</span>
        </h1>

        <p className="text-base sm:text-lg font-medium text-slate-700">
          Halaman demonstrasi Dynamic Routing pada Next.js menggunakan parameter ID.
        </p>

        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Setiap data memiliki ID yang digunakan sebagai dynamic segment pada URL.
          Pilih salah satu data untuk melihat halaman detail berdasarkan ID.
        </p>

        {/* Info Box Edukasi */}
        <div className="p-4 rounded-xl bg-[#FFF8FA] border border-[#F1DDE3] text-xs text-slate-700 space-y-1.5">
          <p className="font-bold text-[#A64463] flex items-center gap-1.5">
            <span>💡</span>
            <span>Konsep Pembelajaran:</span>
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
            <li>
              Dynamic Route Segment: folder{" "}
              <code className="font-mono text-[#D96C8A]">[id]</code> menangkap nilai parameter dari URL.
            </li>
            <li>
              Navigasi menggunakan komponen bawaan Next.js{" "}
              <code className="font-mono text-[#D96C8A]">&lt;Link&gt;</code> untuk transisi instan tanpa reload.
            </li>
            <li>
              Prerendering statis dengan fungsi{" "}
              <code className="font-mono text-[#D96C8A]">generateStaticParams()</code>.
            </li>
          </ul>
        </div>
      </header>

      {/* List Card Section */}
      <section aria-labelledby="daftar-item-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="daftar-item-heading"
            className="text-lg sm:text-xl font-bold text-slate-900"
          >
            Daftar Data Latihan ({items.length} Data)
          </h2>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Pilih salah satu card untuk melihat rute dinamis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {items.map((item) => (
            <article
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-[#F1DDE3] shadow-xs hover:border-[#D96C8A] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#F8E5EB] text-[#A64463] text-xs font-black flex items-center justify-center border border-[#F1DDE3]">
                    #{item.id}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {item.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>

                <div className="pt-1">
                  <span className="text-[11px] font-mono text-slate-400 block">
                    URL: /latihan-routing/{item.id}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#F1DDE3]">
                <Link
                  href={`/latihan-routing/${item.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#D96C8A] hover:bg-[#C65373] shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96C8A] focus-visible:ring-offset-2 active:scale-[0.99]"
                >
                  <span>Lihat Detail</span>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Bottom Navigation */}
      <footer className="pt-6 border-t border-[#F1DDE3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#A64463] font-semibold transition-colors"
        >
          <span>← Kembali ke Beranda</span>
        </Link>
        <span className="text-slate-400">
          CyberShield • Modul Latihan Dynamic Routing Terisolasi
        </span>
      </footer>
    </div>
  );
}
