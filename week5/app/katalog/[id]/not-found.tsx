import Link from "next/link";

export default function NotFound() {
  return (
    <main id="konten" className="mx-auto max-w-md p-8 text-center mt-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-2xl">
        404
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Item Tidak Ditemukan</h1>
      <p className="text-slate-600 text-sm mb-6">
        Item dengan ID yang diminta tidak ditemukan di dalam katalog.
      </p>
      <Link
        href="/katalog"
        className="inline-block px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors"
      >
        Kembali ke Katalog
      </Link>
    </main>
  );
}
