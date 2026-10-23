import type { Metadata } from "next";
import Link from "next/link";
import { SAMPLE_URLS, analyzeUrl } from "@/lib/url-analyzer";
import { sha256 } from "@/lib/crypto/hash";
import { generateHmacKey, createHmac, verifyHmac } from "@/lib/crypto/hmac";
import AnalysisResult from "@/components/AnalysisResult";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return SAMPLE_URLS.map((_, index) => ({
    id: String(index + 1),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const index = parseInt(id, 10);
  const sample =
    !isNaN(index) && index >= 1 && index <= SAMPLE_URLS.length
      ? SAMPLE_URLS[index - 1]
      : null;

  if (!sample) {
    return {
      title: "Kasus Tidak Ditemukan - CyberShield",
      description: "Kasus analisis sampel dengan ID tersebut tidak ditemukan.",
    };
  }

  return {
    title: `Kasus #${id}: ${sample.name} - CyberShield`,
    description: `Detail analisis keamanan rule-based dan verifikasi kriptografis untuk sampel ${sample.name}.`,
  };
}

export default async function AnalyzeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const index = parseInt(id, 10);
  const isValidIndex =
    !isNaN(index) && index >= 1 && index <= SAMPLE_URLS.length;
  const sample = isValidIndex ? SAMPLE_URLS[index - 1] : null;

  // Jika ID tidak valid / tidak ada di SAMPLE_URLS
  if (!sample) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
        <div className="p-8 rounded-2xl bg-white border border-[#F1DDE3] shadow-xs text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-2xl font-bold">
            ✕
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              Param ID: &quot;{id}&quot;
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 pt-2">
              Sampel Kasus Tidak Ditemukan
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              ID rute dinamis yang Anda akses tidak terdaftar. CyberShield saat ini
              menyediakan {SAMPLE_URLS.length} sampel kasus (ID 1 hingga{" "}
              {SAMPLE_URLS.length}).
            </p>
          </div>

          <div className="pt-2">
            <p className="text-xs font-bold text-slate-500 mb-3">
              Pilih salah satu ID sampel yang tersedia:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SAMPLE_URLS.map((s, idx) => (
                <Link
                  key={s.url}
                  href={`/analyze/${idx + 1}`}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#F8E5EB] text-slate-800 border border-[#F1DDE3] hover:border-[#D96C8A] transition-all shadow-2xs"
                >
                  Kasus #{idx + 1}: {s.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F1DDE3] flex justify-center gap-3">
            <Link
              href="/analyze"
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#D96C8A] hover:bg-[#C65373] transition-all"
            >
              ← Kembali ke Analisis Utama
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Lakukan analisis URL sampel
  const analysisResult = analyzeUrl(sample.url);

  // Kriptografi: Fingerprint SHA-256
  const fingerprint = await sha256(sample.url);

  // Kriptografi: HMAC-SHA-256
  const key = await generateHmacKey();
  const resultData = JSON.stringify({
    url: analysisResult.url,
    riskScore: analysisResult.riskScore,
    isSafe: analysisResult.isSafe,
    recommendation: analysisResult.recommendation,
  });

  const hmac = await createHmac(resultData, key);
  const verified = await verifyHmac(resultData, hmac, key);

  const cryptoResult = {
    fingerprint,
    hmac,
    verified,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Breadcrumb & Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-medium text-slate-500"
      >
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <Link
          href="/analyze"
          className="hover:text-slate-900 transition-colors"
        >
          Analyze
        </Link>
        <span>/</span>
        <span className="text-[#D96C8A] font-bold">Kasus #{id}</span>
      </nav>

      {/* Header Info Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#F1DDE3] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F8E5EB] text-[#A64463] border border-[#F1DDE3]">
                <span>🔍</span>
                <span>Dynamic Route: /analyze/[id]</span>
              </span>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                id = &quot;{id}&quot;
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  sample.type === "safe"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {sample.type === "safe"
                  ? "✓ Kategori Aman"
                  : "⚠ Kategori Phishing"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
              {sample.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Kategori Studi Kasus:{" "}
              <strong className="text-slate-700">{sample.category}</strong>
            </p>
          </div>

          <Link
            href="/analyze"
            className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-bold text-[#A64463] bg-[#F8E5EB] hover:bg-[#F1DDE3] border border-[#F1DDE3] transition-all"
          >
            ← Input URL Manual
          </Link>
        </div>

        {/* URL Box */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 break-all">
          Target URL: <strong>{sample.url}</strong>
        </div>

        {/* Sample switcher */}
        <div className="pt-2 border-t border-[#F1DDE3]">
          <p className="text-xs font-bold text-slate-500 mb-2">
            Jelajahi Sampel Kasus Lainnya:
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_URLS.map((s, idx) => {
              const sampleId = String(idx + 1);
              const isActive = sampleId === id;
              return (
                <Link
                  key={s.url}
                  href={`/analyze/${sampleId}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    isActive
                      ? "bg-[#D96C8A] text-white border-[#D96C8A] shadow-xs"
                      : "bg-white text-slate-700 border-[#F1DDE3] hover:border-[#D96C8A] hover:bg-[#F8E5EB]"
                  }`}
                >
                  #{sampleId} {s.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Analysis Result Component */}
      <AnalysisResult result={analysisResult} cryptoResult={cryptoResult} />
    </div>
  );
}

