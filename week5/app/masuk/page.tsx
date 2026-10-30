import type { Metadata } from "next";
import FormMasuk from "@/components/FormMasuk";

export const metadata: Metadata = { title: "Masuk | CyberShield" };

export default function HalamanMasuk() {
  return (
    <main id="konten" className="mx-auto max-w-md p-6 mt-8">
      <h1 className="text-3xl font-bold text-slate-900">Masuk</h1>
      <p className="text-sm text-slate-600 mt-1">
        Masuk menggunakan akun pengelola untuk mengelola item katalog.
      </p>
      <FormMasuk />
    </main>
  );
}

