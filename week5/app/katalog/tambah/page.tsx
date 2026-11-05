import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FormItem from "@/components/FormItem";
import { bacaSesi } from "@/lib/sesi";
import { keluar } from "@/app/masuk/actions";

export const metadata: Metadata = { title: "Tambah Item | CyberShield" };

export default async function HalamanTambahItem() {
  const sesi = await bacaSesi();
  if (!sesi) redirect("/masuk");

  return (
    <main id="konten" className="mx-auto max-w-2xl p-6 mt-8">
      <h1 className="text-3xl font-bold text-slate-900">Tambah Item</h1>
      <div className="flex items-center justify-between mt-3 py-2 border-b border-slate-200">
        <p className="text-sm text-slate-600">
          Masuk sebagai <strong className="text-slate-800">{sesi.email}</strong>
        </p>
        <form action={keluar}>
          <button
            type="submit"
            className="text-sm font-medium text-red-600 underline hover:text-red-800 cursor-pointer"
          >
            Keluar
          </button>
        </form>
      </div>
      <FormItem />
    </main>
  );
}

