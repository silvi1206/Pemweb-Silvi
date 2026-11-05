import type { AnalysisResult as AnalysisResultType } from "@/types/analysis";
import RiskScore from "./RiskScore";
import SecurityIndicator from "./SecurityIndicator";

interface CryptoResult {
  fingerprint: string;
  hmac: string;
  verified: boolean;
}

interface AnalysisResultProps {
  result: AnalysisResultType;
  cryptoResult: CryptoResult | null;
}

export default function AnalysisResult({
  result,
  cryptoResult,
}: AnalysisResultProps) {
  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl border-2 transition-all ${
        result.isSafe
          ? "bg-emerald-50/50 border-emerald-300"
          : "bg-red-50/50 border-red-300 shadow-lg shadow-red-100/50"
      }`}
      role="region"
      aria-label="Hasil analisis URL"
    >
      {/* Result Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1DDE3]">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
              result.isSafe
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
            }`}
            aria-hidden="true"
          >
            {result.isSafe ? "✓" : "⚠"}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3
                className={`text-base sm:text-lg font-black ${
                  result.isSafe ? "text-emerald-800" : "text-rose-700"
                }`}
              >
                {result.isSafe
                  ? "Tautan Terindikasi Aman"
                  : "Peringatan: Tautan Mencurigakan!"}
              </h3>

              <span className="text-[10px] font-bold text-[#A64463] bg-[#F8E5EB] px-2 py-0.5 rounded-full border border-[#F1DDE3] hidden sm:inline-block">
                Evaluasi CyberShield
              </span>
            </div>

            <p className="text-xs font-mono text-slate-600 break-all mt-0.5">
              {result.url}
            </p>
          </div>
        </div>

        <RiskScore score={result.riskScore} isSafe={result.isSafe} />
      </div>

      {/* Security Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        <SecurityIndicator
          title="Protokol Enkripsi"
          status={result.protocol.isHttps ? "HTTPS" : "HTTP"}
          isAlert={!result.protocol.isHttps}
          detail={result.protocol.detail}
        />

        <SecurityIndicator
          title="Reputasi Domain"
          status={
            result.domainCheck.isSuspicious ? "Mencurigakan" : "Standar"
          }
          isAlert={result.domainCheck.isSuspicious}
          detail={result.domainCheck.detail}
        />

        <SecurityIndicator
          title="Rekayasa Sosial"
          status={result.keywordCheck.isTriggered ? "Terdeteksi" : "Nihil"}
          isAlert={result.keywordCheck.isTriggered}
          detail={
            result.keywordCheck.isTriggered
              ? `Kata pancingan: "${result.keywordCheck.keywords.join(", ")}"`
              : "Tidak ditemukan kata umpan hadiah atau pemaksaan verifikasi."
          }
        />

        <SecurityIndicator
          title="Muatan Berkas"
          status={
            result.extensionCheck.isDangerous ? "Bahaya" : "Bersih"
          }
          isAlert={result.extensionCheck.isDangerous}
          detail={
            result.extensionCheck.isDangerous
              ? `Tautan mengarah ke unduhan berkas ${result.extensionCheck.ext.toUpperCase()} (potensi malware)`
              : "Tidak terdeteksi unduhan executable mencurigakan."
          }
        />
      </div>

      {/* Cryptographic Integrity */}
      {cryptoResult && (
        <div className="mt-4 p-4 rounded-xl bg-[#FFF8FA] border border-[#F1DDE3]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h4 className="text-sm font-bold text-[#29242A]">
                Integritas Kriptografi
              </h4>

              <p className="text-xs text-[#766B70] mt-0.5">
                Fingerprint URL dan verifikasi hasil analisis
              </p>
            </div>

            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                cryptoResult.verified
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {cryptoResult.verified
                ? "✓ HMAC Terverifikasi"
                : "✕ Verifikasi Gagal"}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-[#5F565B] mb-1">
                SHA-256 URL Fingerprint
              </p>

              <code className="block text-[11px] sm:text-xs font-mono text-[#5F565B] bg-white border border-[#F1DDE3] rounded-lg p-2 break-all">
                {cryptoResult.fingerprint}
              </code>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#5F565B] mb-1">
                HMAC-SHA-256
              </p>

              <code className="block text-[11px] sm:text-xs font-mono text-[#5F565B] bg-white border border-[#F1DDE3] rounded-lg p-2 break-all">
                {cryptoResult.hmac}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div
        className={`mt-4 p-4 rounded-xl flex items-start gap-3 shadow-2xs ${
          result.isSafe
            ? "bg-emerald-50/90 border border-emerald-200"
            : "bg-rose-50/90 border border-rose-200"
        }`}
      >
        <span className="text-lg shrink-0" aria-hidden="true">
          💡
        </span>

        <div className="text-sm text-slate-800">
          <span className="font-bold text-slate-900 block mb-0.5">
            Rekomendasi Tindakan:
          </span>

          {result.recommendation}
        </div>
      </div>
    </div>
  );
}