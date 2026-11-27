"use client"; // error boundary harus Client Component

import { useEffect } from "react";

export default function GalatItem({
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
    <div role="alert" className="mx-auto max-w-xl p-4">
      <h2 className="text-xl font-bold">Item gagal diproses</h2>
      <p className="mt-2 text-sm text-gray-600">
        Kode rujukan: {error.digest ?? "tidak ada"}
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 rounded border px-3 py-1"
      >
        Coba lagi
      </button>
    </div>
  );
}
