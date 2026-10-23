"use client";

import { useRef, useState, useId } from "react";
import type { AnalysisResult as AnalysisResultType } from "@/types/analysis";
import { analyzeUrl, validateUrl, SAMPLE_URLS } from "@/lib/url-analyzer";
import { sha256 } from "@/lib/crypto/hash";
import {
  createHmac,
  generateHmacKey,
  verifyHmac,
} from "@/lib/crypto/hmac";
import AnalysisResult from "./AnalysisResult";
import SampleUrl from "./SampleUrl";

interface CryptoResult {
  fingerprint: string;
  hmac: string;
  verified: boolean;
}

export default function UrlAnalyzer() {
  const [inputUrl, setInputUrl] = useState("");
  const [result, setResult] = useState<AnalysisResultType | null>(null);
  const [cryptoResult, setCryptoResult] = useState<CryptoResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlInputId = useId();
  const errorId = useId();

  // Kunci HMAC hanya dibuat selama runtime dan tidak disimpan di repository.
  const hmacKeyRef = useRef<CryptoKey | null>(null);

  const getHmacKey = async () => {
    if (!hmacKeyRef.current) {
      hmacKeyRef.current = await generateHmacKey();
    }

    return hmacKeyRef.current;
  };

  const performAnalysis = async (url: string) => {
    const analysisResult = analyzeUrl(url);

    const fingerprint = await sha256(url);

    const key = await getHmacKey();

    const resultData = JSON.stringify({
      url: analysisResult.url,
      riskScore: analysisResult.riskScore,
      isSafe: analysisResult.isSafe,
      recommendation: analysisResult.recommendation,
    });

    const hmac = await createHmac(resultData, key);
    const verified = await verifyHmac(resultData, hmac, key);

    setResult(analysisResult);
    setCryptoResult({
      fingerprint,
      hmac,
      verified,
    });

    setIsAnalyzing(false);
  };

  const handleAnalyze = () => {
    const validationError = validateUrl(inputUrl);

    if (validationError) {
      setError(validationError);
      setResult(null);
      setCryptoResult(null);
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setResult(null);
    setCryptoResult(null);

    setTimeout(() => {
      void performAnalysis(inputUrl);
    }, 600);
  };

  const handleSampleSelect = (url: string) => {
    setInputUrl(url);
    setError(null);
    setIsAnalyzing(true);
    setResult(null);
    setCryptoResult(null);

    setTimeout(() => {
      void performAnalysis(url);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalyze();
  };

  return (
    <div className="space-y-6">
      {/* Input Form Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#F1DDE3] shadow-xs">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor={urlInputId}
              className="block text-sm font-bold text-[#29242A] mb-2"
            >
              Masukkan URL yang ingin dianalisis
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  id={urlInputId}
                  type="url"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://contoh-domain.com/halaman"
                  aria-invalid={error ? "true" : undefined}
                  aria-describedby={error ? errorId : undefined}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-mono border transition-all focus:outline-none focus:ring-2 ${
                    error
                      ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-200"
                      : "border-[#F1DDE3] bg-white focus:border-[#D96C8A] focus:ring-[#F8E5EB]"
                  }`}
                />

                {error && (
                  <p
                    id={errorId}
                    role="alert"
                    className="mt-1.5 text-sm text-red-600 font-medium flex items-center gap-1.5"
                  >
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#D96C8A] hover:bg-[#C65373] disabled:bg-[#E9A0B3] disabled:cursor-not-allowed shadow-md shadow-[#F1DDE3]/80 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96C8A] focus-visible:ring-offset-2 shrink-0 active:scale-[0.99]"
              >
                {isAnalyzing ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>

                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <span>Analisis</span>

                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Sample URLs */}
        <div className="mt-5 pt-4 border-t border-[#F1DDE3]">
          <SampleUrl samples={SAMPLE_URLS} onSelect={handleSampleSelect} />
        </div>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div
          className="p-6 rounded-2xl bg-[#FFF1F4] border border-[#F1DDE3] text-center animate-in fade-in duration-200"
          role="status"
          aria-label="Sedang menganalisis URL"
        >
          <div className="flex items-center justify-center gap-3">
            <svg
              className="w-5 h-5 animate-spin text-[#D96C8A]"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />

              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>

            <span className="text-sm font-semibold text-[#5F565B]">
              Menganalisis parameter keamanan URL...
            </span>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !isAnalyzing && (
        <AnalysisResult
          result={result}
          cryptoResult={cryptoResult}
        />
      )}
    </div>
  );
}