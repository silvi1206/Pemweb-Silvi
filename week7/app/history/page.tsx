"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { getAnalysesAction, deleteAnalysisAction } from "@/app/actions/analysis";

interface IndicatorRecord {
  id: string;
  type: string;
  status: string;
  isAlert: boolean;
  detail: string;
}

interface AnalysisRecord {
  id: string;
  url: string;
  riskScore: number;
  isSafe: boolean;
  recommendation: string;
  sha256: string;
  hmac: string;
  createdAt: string;
  indicators?: IndicatorRecord[];
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const result = await getAnalysesAction();
      if (result.success && Array.isArray(result.data)) {
        setRecords(result.data as AnalysisRecord[]);
        setError(null);
      } else {
        setError(result.message || "Gagal memuat data riwayat.");
      }
    } catch (err) {
      console.error("Error loading history:", err);
      setError("Terjadi kesalahan jaringan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const result = await getAnalysesAction();
        if (!ignore) {
          if (result.success && Array.isArray(result.data)) {
            setRecords(result.data as AnalysisRecord[]);
            setError(null);
          } else {
            setError(result.message || "Gagal memuat data riwayat.");
          }
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading history:", err);
          setError("Terjadi kesalahan jaringan saat mengambil data.");
          setLoading(false);
        }
      }
    }

    void init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleManualReload = () => {
    setLoading(true);
    void fetchRecords();
  };

  const handleDelete = async (id: string, url: string) => {
    if (!window.confirm(`Yakin ingin menghapus riwayat analisis untuk "${url}"? Seluruh indikator terkait juga akan dihapus.`)) {
      return;
    }

    setDeletingId(id);
    startTransition(async () => {
      try {
        const res = await deleteAnalysisAction(id);
        if (res.success) {
          setRecords((prev) => prev.filter((r) => r.id !== id));
        } else {
          alert(res.message);
        }
      } catch (err) {
        console.error("Gagal menghapus:", err);
        alert("Gagal menghapus data dari server.");
      } finally {
        setDeletingId(null);
      }
    });
  };

  const formatDate = (iso: string) => {
    try {
      const date = new Date(iso);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return iso;
    }
  };

  const filteredRecords = records.filter(
    (rec) =>
      rec.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.recommendation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-medium text-slate-500"
      >
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <span className="text-[#D96C8A] font-bold">Riwayat Analisis</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F1DDE3]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F8E5EB] text-[#A64463] border border-[#F1DDE3] shadow-2xs">
              <span>🗄️</span>
              <span>PostgreSQL Database Persistence</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {records.length} Analisis Tersimpan
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#29242A] tracking-tight">
            Riwayat Analisis <span className="text-[#D96C8A]">Keamanan</span>
          </h1>
          <p className="text-sm text-slate-600">
            Daftar hasil analisis URL yang tersimpan di PostgreSQL beserta relasi indikator keamanan dan bukti integritas kriptografi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#D96C8A] hover:bg-[#C65373] shadow-md shadow-[#F1DDE3]/80 transition-all active:scale-[0.99]"
          >
            <span>+ Analisis URL Baru</span>
          </Link>
        </div>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari URL atau rekomendasi..."
            className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-[#F1DDE3] bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F8E5EB] focus:border-[#D96C8A] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            Aman: {records.filter((r) => r.isSafe).length}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
            Berisiko: {records.filter((r) => !r.isSafe).length}
          </span>
        </div>
      </div>

      {/* Status Loading & Error */}
      {loading && (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#F1DDE3] shadow-xs space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-[#D96C8A] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">
            Memuat riwayat analisis dari database...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
          <p className="font-bold flex items-center gap-2">
            <span>⚠</span>
            <span>Gagal Memuat Riwayat</span>
          </p>
          <p className="text-xs sm:text-sm">{error}</p>
          <button
            type="button"
            onClick={handleManualReload}
            className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredRecords.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#F1DDE3] shadow-xs space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#F8E5EB] text-[#A64463] flex items-center justify-center text-2xl font-black">
            📋
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {searchTerm ? "Tidak Ada Hasil yang Cocok" : "Belum Ada Riwayat Analisis"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? `Tidak ditemukan analisis dengan kata kunci "${searchTerm}".`
                : "Mulai periksa URL mencurigakan pertama Anda melalui halaman Analyze."}
            </p>
          </div>
          {!searchTerm && (
            <Link
              href="/analyze"
              className="inline-block px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#D96C8A] hover:bg-[#C65373] transition-colors"
            >
              Buka Halaman Analyze
            </Link>
          )}
        </div>
      )}

      {/* Record Cards */}
      {!loading && !error && filteredRecords.length > 0 && (
        <div className="space-y-4">
          {filteredRecords.map((rec) => {
            const isDeleting = deletingId === rec.id && isPending;
            const indicatorsCount = rec.indicators ? rec.indicators.length : 0;
            const alertCount = rec.indicators ? rec.indicators.filter((i) => i.isAlert).length : 0;

            return (
              <article
                key={rec.id}
                className={`p-5 sm:p-6 rounded-2xl bg-white border transition-all shadow-xs hover:shadow-md ${
                  rec.isSafe ? "border-emerald-200" : "border-rose-200"
                } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Info Left */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          rec.isSafe
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : rec.riskScore >= 70
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {rec.isSafe ? "✓ Aman" : rec.riskScore >= 70 ? "⚠ Berbahaya" : "⚠ Mencurigakan"}
                      </span>

                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDate(rec.createdAt)}
                      </span>

                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                        {indicatorsCount} Indikator {alertCount > 0 && `(${alertCount} Temuan Peringatan)`}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 break-all">
                      {rec.url}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {rec.recommendation}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-slate-400">
                      <span>SHA-256: {rec.sha256.substring(0, 16)}...</span>
                      <span>•</span>
                      <span>HMAC: {rec.hmac.substring(0, 16)}...</span>
                    </div>
                  </div>

                  {/* Right Actions & Score */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Risk Score
                      </span>
                      <span
                        className={`text-2xl font-black ${
                          rec.isSafe
                            ? "text-emerald-600"
                            : rec.riskScore >= 70
                            ? "text-rose-600"
                            : "text-amber-600"
                        }`}
                      >
                        {rec.riskScore}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/history/${rec.id}`}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#D96C8A] hover:bg-[#C65373] shadow-xs transition-all"
                      >
                        Lihat Detail & Kelola →
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(rec.id, rec.url)}
                        disabled={isDeleting}
                        aria-label={`Hapus analisis ${rec.url}`}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                        title="Hapus analisis"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
