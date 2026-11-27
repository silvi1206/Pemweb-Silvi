"use client";

import { use, useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getAnalysisByIdAction,
  updateAnalysisAction,
  deleteAnalysisAction,
} from "@/app/actions/analysis";
import {
  createIndicatorAction,
  updateIndicatorAction,
  deleteIndicatorAction,
} from "@/app/actions/indicators";

interface Indicator {
  id: string;
  analysisId: string;
  type: string;
  status: string;
  isAlert: boolean;
  detail: string;
  createdAt: string;
}

interface AnalysisDetail {
  id: string;
  url: string;
  riskScore: number;
  isSafe: boolean;
  recommendation: string;
  sha256: string;
  hmac: string;
  encryptedNotes?: string | null;
  createdAt: string;
  indicators: Indicator[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function HistoryDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);

  // Form states for Updating Analysis
  const [showEditAnalysis, setShowEditAnalysis] = useState(false);
  const [editRecommendation, setEditRecommendation] = useState("");
  const [editRiskScore, setEditRiskScore] = useState(0);
  const [editIsSafe, setEditIsSafe] = useState("true");
  const [editNotes, setEditNotes] = useState("");

  // Form states for Creating Indicator
  const [showAddIndicator, setShowAddIndicator] = useState(false);
  const [newType, setNewType] = useState("CUSTOM");
  const [newStatus, setNewStatus] = useState("Peringatan");
  const [newIsAlert, setNewIsAlert] = useState(true);
  const [newDetail, setNewDetail] = useState("");
  // Modul 7 (Perbaikan Galat 4 - Issue #14): nilai turunan dihitung langsung saat render tanpa state sisa & useEffect
  const sisaKarakterDetail = 500 - newDetail.length;

  // Form states for Editing Indicator
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);
  const [editIndStatus, setEditIndStatus] = useState("");
  const [editIndDetail, setEditIndDetail] = useState("");
  const [editIndIsAlert, setEditIndIsAlert] = useState(false);

  const [isPending, startTransition] = useTransition();

  const reloadData = useCallback(async () => {
    try {
      const res = await getAnalysisByIdAction(id);
      if (res.success && res.data) {
        const item = res.data as AnalysisDetail;
        setAnalysis(item);
        setEditRecommendation(item.recommendation);
        setEditRiskScore(item.riskScore);
        setEditIsSafe(String(item.isSafe));
        setEditNotes(item.encryptedNotes ?? "");
        setError(null);
      } else {
        setError(res.message || "Data analisis tidak ditemukan.");
      }
    } catch (err) {
      console.error("Error loading detail:", err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const res = await getAnalysisByIdAction(id);
        if (!ignore) {
          if (res.success && res.data) {
            const item = res.data as AnalysisDetail;
            setAnalysis(item);
            setEditRecommendation(item.recommendation);
            setEditRiskScore(item.riskScore);
            setEditIsSafe(String(item.isSafe));
            setEditNotes(item.encryptedNotes ?? "");
            setError(null);
          } else {
            setError(res.message || "Data analisis tidak ditemukan.");
          }
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading detail:", err);
          setError("Terjadi kesalahan jaringan.");
          setLoading(false);
        }
      }
    }

    void loadInitial();
    return () => {
      ignore = true;
    };
  }, [id]);

  // Handler: Update Analysis
  const handleUpdateAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysis) return;

    startTransition(async () => {
      const res = await updateAnalysisAction(analysis.id, {
        recommendation: editRecommendation,
        riskScore: Number(editRiskScore),
        isSafe: editIsSafe as unknown as boolean,
        encryptedNotes: editNotes.trim() ? editNotes : null,
      });

      if (res.success) {
        setShowEditAnalysis(false);
        void reloadData();
      } else {
        alert(res.message);
      }
    });
  };

  // Handler: Delete Analysis
  const handleDeleteAnalysis = async () => {
    if (!analysis) return;
    if (
      !window.confirm(
        `Hapus permanen analisis "${analysis.url}" dan seluruh indikator terkait?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteAnalysisAction(analysis.id);
      if (res.success) {
        router.push("/history");
      } else {
        alert(res.message);
      }
    });
  };

  // Handler: Create Indicator (Entitas Kedua)
  const handleCreateIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysis) return;

    startTransition(async () => {
      const res = await createIndicatorAction({
        analysisId: analysis.id,
        type: newType,
        status: newStatus,
        isAlert: newIsAlert,
        detail: newDetail,
      });

      if (res.success) {
        setShowAddIndicator(false);
        setNewDetail("");
        void reloadData();
      } else {
        alert(res.message);
      }
    });
  };

  // Handler: Update Indicator (Entitas Kedua)
  const handleUpdateIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIndicator) return;

    startTransition(async () => {
      const res = await updateIndicatorAction(editingIndicator.id, {
        status: editIndStatus,
        detail: editIndDetail,
        isAlert: editIndIsAlert,
      });

      if (res.success) {
        setEditingIndicator(null);
        void reloadData();
      } else {
        alert(res.message);
      }
    });
  };

  // Handler: Delete Indicator (Entitas Kedua)
  const handleDeleteIndicator = async (indicatorId: string) => {
    if (!window.confirm("Hapus indikator ini dari data analisis?")) return;

    startTransition(async () => {
      const res = await deleteIndicatorAction(indicatorId);
      if (res.success) {
        void reloadData();
      } else {
        alert(res.message);
      }
    });
  };

  const formatDate = (iso: string) => {
    try {
      const date = new Date(iso);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 mx-auto border-3 border-[#D96C8A] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Memuat rincian data analisis dan indikator dari PostgreSQL...
        </p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="p-8 rounded-2xl bg-white border border-[#F1DDE3] text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-bold">
            ✕
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Data Analisis Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            {error ?? `ID "${id}" tidak ditemukan pada database.`}
          </p>
          <div className="pt-2">
            <Link
              href="/history"
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#D96C8A] hover:bg-[#C65373] transition-all"
            >
              ← Kembali ke Riwayat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-medium text-slate-500"
      >
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/history" className="hover:text-slate-900 transition-colors">
          Riwayat Analisis
        </Link>
        <span>/</span>
        <span className="text-[#D96C8A] font-bold">Detail #{analysis.id.substring(0, 8)}</span>
      </nav>

      {/* Main Analysis Card (Entitas 1) */}
      <section
        aria-labelledby="analysis-detail-heading"
        className="p-6 sm:p-8 rounded-2xl bg-white border border-[#F1DDE3] shadow-xs space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F1DDE3]">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#F8E5EB] text-[#A64463] border border-[#F1DDE3]">
                <span>🔍</span>
                <span>Entitas Utama: Analysis</span>
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  analysis.isSafe
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : analysis.riskScore >= 70
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {analysis.isSafe ? "✓ Aman" : analysis.riskScore >= 70 ? "⚠ Berbahaya" : "⚠ Mencurigakan"}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {formatDate(analysis.createdAt)}
              </span>
            </div>

            <h1
              id="analysis-detail-heading"
              className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight break-all pt-1"
            >
              {analysis.url}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Risk Score
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  analysis.isSafe
                    ? "text-emerald-600"
                    : analysis.riskScore >= 70
                    ? "text-rose-600"
                    : "text-amber-600"
                }`}
              >
                {analysis.riskScore}%
              </span>
            </div>

            {/* Action Buttons for Entitas 1 */}
            <div className="flex flex-col gap-1.5 pl-3 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setShowEditAnalysis(!showEditAnalysis)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#A64463] bg-[#F8E5EB] hover:bg-[#F1DDE3] transition-colors"
              >
                {showEditAnalysis ? "Tutup Form Edit" : "Edit Analisis"}
              </button>
              <button
                type="button"
                onClick={handleDeleteAnalysis}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Hapus Analisis
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form for Analysis */}
        {showEditAnalysis && (
          <form
            onSubmit={handleUpdateAnalysis}
            className="p-5 rounded-xl bg-[#FFF8FA] border border-[#F1DDE3] space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900">
              Edit Informasi Rekomendasi & Catatan (Server Action UPDATE)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Risk Score (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editRiskScore}
                  onChange={(e) => setEditRiskScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-xs border border-[#F1DDE3] bg-white text-slate-800"
                  required
                />
              </div>
              <div>
                <label htmlFor="isSafe" className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Keamanan
                </label>
                <select
                  id="isSafe"
                  name="isSafe"
                  value={editIsSafe}
                  onChange={(e) => setEditIsSafe(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs border border-[#F1DDE3] bg-white text-slate-800"
                >
                  <option value="true">Aman (Tersedia)</option>
                  <option value="false">Berisiko (Tidak aman)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Reviewer / Enkripsi
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Catatan tambahan internal..."
                  className="w-full px-3 py-2 rounded-lg text-xs border border-[#F1DDE3] bg-white text-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rekomendasi Tindakan
              </label>
              <textarea
                rows={3}
                value={editRecommendation}
                onChange={(e) => setEditRecommendation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs border border-[#F1DDE3] bg-white text-slate-800"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditAnalysis(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#D96C8A] hover:bg-[#C65373] disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}

        {/* Recommendation & Details */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Rekomendasi Tindakan
          </h2>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed">
            {analysis.recommendation}
          </div>
        </div>

        {/* Cryptographic Integrity Section */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#FFF8FA] border border-[#F1DDE3] space-y-3">
          <h2 className="text-xs font-bold text-[#A64463] uppercase tracking-wider flex items-center gap-1.5">
            <span>🔒</span>
            <span>Jaminan Integritas Kriptografis (SHA-256 & HMAC)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-white border border-[#F1DDE3]">
              <span className="text-[10px] text-slate-400 block mb-0.5">SHA-256 Fingerprint</span>
              <span className="text-slate-700 break-all">{analysis.sha256}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#F1DDE3]">
              <span className="text-[10px] text-slate-400 block mb-0.5">HMAC-SHA-256 Auth Tag</span>
              <span className="text-slate-700 break-all">{analysis.hmac}</span>
            </div>
          </div>
          {analysis.encryptedNotes && (
            <div className="pt-2 border-t border-[#F1DDE3] text-xs text-slate-600">
              <span className="font-bold text-slate-700">Catatan Khusus:</span> {analysis.encryptedNotes}
            </div>
          )}
        </div>
      </section>

      {/* Relasi: Indicators Section (Entitas 2) */}
      <section aria-labelledby="indicators-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h2 id="indicators-heading" className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>📊</span>
              <span>Indikator Keamanan ({analysis.indicators.length} Item Relasi)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Entitas kedua yang berelasi dengan analisis ini (Relasi One-to-Many).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddIndicator(!showAddIndicator)}
            className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#D96C8A] hover:bg-[#C65373] shadow-xs transition-all"
          >
            + Tambah Indikator Baru
          </button>
        </div>

        {/* Add Indicator Form */}
        {showAddIndicator && (
          <form
            onSubmit={handleCreateIndicator}
            className="p-5 rounded-2xl bg-white border border-[#F1DDE3] shadow-xs space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900">
              Tambah Indikator Keamanan Baru (Server Action CREATE Entitas Kedua)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipe Indikator
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs border border-[#F1DDE3] bg-white text-slate-800"
                >
                  <option value="PROTOCOL">PROTOCOL</option>
                  <option value="DOMAIN">DOMAIN</option>
                  <option value="KEYWORD">KEYWORD</option>
                  <option value="EXTENSION">EXTENSION</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Ringkas
                </label>
                <input
                  type="text"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  placeholder="Misal: Mencurigakan / Bersih"
                  className="w-full px-3 py-2 rounded-lg text-xs border border-[#F1DDE3] bg-white text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Status
                </label>
                <select
                  value={newIsAlert ? "alert" : "safe"}
                  onChange={(e) => setNewIsAlert(e.target.value === "alert")}
                  className="w-full px-3 py-2 rounded-lg text-xs border border-[#F1DDE3] bg-white text-slate-800"
                >
                  <option value="alert">Peringatan / Alert (Berisiko)</option>
                  <option value="safe">Normal / Aman</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="detail" className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi / Temuan Rinci
              </label>
              <textarea
                id="detail"
                name="detail"
                rows={2}
                maxLength={500}
                value={newDetail}
                onChange={(e) => setNewDetail(e.target.value)}
                placeholder="Rincian hasil temuan indikator pada URL..."
                className="w-full px-3 py-2 rounded-lg text-xs border border-[#F1DDE3] bg-white text-slate-800"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                {sisaKarakterDetail} karakter tersisa
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddIndicator(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#D96C8A] hover:bg-[#C65373] disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : "Simpan Indikator"}
              </button>
            </div>
          </form>
        )}

        {/* Edit Modal / Form for Indicator */}
        {editingIndicator && (
          <form
            onSubmit={handleUpdateIndicator}
            className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-4"
          >
            <h3 className="text-sm font-bold text-amber-900">
              Edit Indikator #{editingIndicator.type} (Server Action UPDATE Entitas Kedua)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Ringkas
                </label>
                <input
                  type="text"
                  value={editIndStatus}
                  onChange={(e) => setEditIndStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs border border-amber-300 bg-white text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Peringatan
                </label>
                <select
                  value={editIndIsAlert ? "alert" : "safe"}
                  onChange={(e) => setEditIndIsAlert(e.target.value === "alert")}
                  className="w-full px-3 py-2 rounded-lg text-xs border border-amber-300 bg-white text-slate-800"
                >
                  <option value="alert">Peringatan / Alert (Berisiko)</option>
                  <option value="safe">Normal / Aman</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Rinci
              </label>
              <textarea
                rows={2}
                value={editIndDetail}
                onChange={(e) => setEditIndDetail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs border border-amber-300 bg-white text-slate-800"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingIndicator(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
              >
                {isPending ? "Memperbarui..." : "Update Indikator"}
              </button>
            </div>
          </form>
        )}

        {/* Indicators List Grid */}
        {analysis.indicators.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-[#F1DDE3] text-xs text-slate-500">
            Belum ada indikator tersimpan untuk analisis ini. Klik tombol di atas untuk menambahkan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.indicators.map((ind) => (
              <div
                key={ind.id}
                className={`p-4 rounded-xl bg-white border transition-all flex flex-col justify-between shadow-2xs ${
                  ind.isAlert ? "border-rose-200" : "border-emerald-200"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {ind.type}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        ind.isAlert
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {ind.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {ind.detail}
                  </p>
                </div>

                {/* Indicator CRUD controls */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndicator(ind);
                      setEditIndStatus(ind.status);
                      setEditIndDetail(ind.detail);
                      setEditIndIsAlert(ind.isAlert);
                    }}
                    className="text-slate-600 hover:text-[#A64463] font-semibold"
                  >
                    Edit
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteIndicator(ind.id)}
                    disabled={isPending}
                    className="text-rose-600 hover:text-rose-800 font-semibold"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Back button */}
      <div className="pt-4 border-t border-[#F1DDE3] flex justify-between items-center text-xs">
        <Link
          href="/history"
          className="text-slate-600 hover:text-[#A64463] font-bold transition-colors"
        >
          ← Kembali ke Seluruh Riwayat
        </Link>
        <span className="text-slate-400">
          CyberShield v0.2 • Server Actions & Relational Persistence
        </span>
      </div>
    </div>
  );
}
