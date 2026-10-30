"use client";

import { useActionState } from "react";
import { simpanItem } from "@/app/katalog/actions";
import type { StatusForm } from "@/lib/status-form";

const awal: StatusForm = {};
const kolom = "mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none";

export default function FormItem() {
  const [status, aksi, pending] = useActionState(simpanItem, awal);
  const g = status.galat;
  const n = status.nilai;

  return (
    <form action={aksi} className="mt-6 space-y-4">
      <div>
        <label htmlFor="judul" className="font-medium text-slate-800">
          Judul
        </label>
        <input
          id="judul"
          name="judul"
          required
          minLength={3}
          maxLength={80}
          defaultValue={n?.judul}
          className={kolom}
          aria-invalid={!!g?.judul}
          aria-describedby="galat-judul"
        />
        <p id="galat-judul" className="text-sm text-red-700 mt-1">
          {g?.judul?.[0]}
        </p>
      </div>

      <div>
        <label htmlFor="kategori" className="font-medium text-slate-800">
          Kategori
        </label>
        <select
          id="kategori"
          name="kategori"
          required
          key={n?.kategori ?? "awal"}
          defaultValue={n?.kategori ?? ""}
          className={kolom}
          aria-invalid={!!g?.kategori}
          aria-describedby="galat-kategori"
        >
          <option value="" disabled>
            Pilih kategori
          </option>
          <option value="energi">Energi</option>
          <option value="lingkungan">Lingkungan</option>
          <option value="kampus">Kampus</option>
        </select>
        <p id="galat-kategori" className="text-sm text-red-700 mt-1">
          {g?.kategori?.[0]}
        </p>
      </div>

      <div>
        <label htmlFor="deskripsi" className="font-medium text-slate-800">
          Deskripsi
        </label>
        <textarea
          id="deskripsi"
          name="deskripsi"
          required
          minLength={10}
          maxLength={300}
          rows={4}
          defaultValue={n?.deskripsi}
          className={kolom}
          aria-invalid={!!g?.deskripsi}
          aria-describedby="galat-deskripsi"
        />
        <p id="galat-deskripsi" className="text-sm text-red-700 mt-1">
          {g?.deskripsi?.[0]}
        </p>
      </div>

      <label className="flex items-center gap-2 text-slate-800">
        <input type="checkbox" name="tersedia" defaultChecked />
        Tersedia
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-60 transition-colors"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>

      {status.pesan && (
        <p role="status" aria-live="polite" className="text-sm font-semibold text-slate-700">
          {status.pesan}
        </p>
      )}
    </form>
  );
}

