import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <main id="konten" className="mx-auto max-w-md p-8 text-center mt-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-2xl">
        404
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-slate-600 text-sm mb-6">
        Halaman yang Anda tuju tidak ditemukan atau telah dipindahkan.
      </p>
      <Link
        href="/"
        className="inline-block px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </main>
  );
}
