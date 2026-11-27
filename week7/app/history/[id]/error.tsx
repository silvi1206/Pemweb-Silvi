"use client"; // error boundary harus Client Component

import { useEffect } from "react";

export default function GalatAnalisis({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-xl p-6 my-8 rounded-2xl bg-white border border-rose-200 shadow-xs">
      <h2 className="text-xl font-bold text-slate-900">Item gagal diproses</h2>
      <p className="mt-2 text-sm text-gray-600">
        Kode rujukan: {error.digest ?? "tidak ada"}
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 rounded-xl border border-[#F1DDE3] bg-[#D96C8A] text-white font-bold text-xs px-4 py-2 hover:bg-[#C65373] transition-colors"
      >
        Coba lagi
      </button>
    </div>
  );
}
