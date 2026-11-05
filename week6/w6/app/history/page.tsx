"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AnalysisRecord {
  id: string;
  url: string;
  riskScore: number;
  isSafe: boolean;
  recommendation: string;
  createdAt: string; // ISO string
}

interface ApiResponse {
  success: boolean;
  data?: AnalysisRecord[];
  message?: string;
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<AnalysisRecord[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/analysis");
        const json: ApiResponse = await res.json();
        if (!json.success) {
          setError(json.message ?? "Gagal mengambil riwayat analisis.");
          setRecords(null);
        } else {
          setRecords(json.data ?? []);
        }
      } catch (e) {
        setError("Terjadi kesalahan jaringan saat mengambil data.");
        setRecords(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const statusBadge = (record: AnalysisRecord) => {
    const { isSafe, riskScore } = record;
    let label = "Mencurigakan";
    let color = "bg-amber-200 text-amber-800";
    if (isSafe) {
      label = "Aman";
      color = "bg-emerald-200 text-emerald-800";
    } else if (riskScore >= 70) {
      label = "Berbahaya";
      color = "bg-rose-200 text-rose-800";
    }
    return (
      <span className={`inline-block px-2 py-0.5 rounded ${color} text-sm font-medium`}>
        {label}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <nav className="flex gap-4 text-sm">
        <Link href="/" className="text-pink-600 hover:underline">Home</Link>
        <Link href="/analyze" className="text-pink-600 hover:underline">Analyze</Link>
        <Link href="/history" className="text-pink-600 hover:underline font-bold">History</Link>
      </nav>

      <h1 className="text-2xl font-bold text-pink-700">Riwayat Analisis</h1>

      {loading && <p className="text-gray-600">Memuat data…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && records && records.length === 0 && (
        <p className="text-gray-600">Tidak ada data analisis.</p>
      )}

      {!loading && !error && records && records.length > 0 && (
        <ul className="space-y-4">
          {records.map((rec) => (
            <li
              key={rec.id}
              className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex-1">
                  <p className="font-medium break-all">{rec.url}</p>
                  <p className="text-sm text-gray-600">{rec.recommendation}</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(rec)}
                  <span className="text-xs text-gray-500">{formatDate(rec.createdAt)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
