import type { Metadata } from "next";
import UrlAnalyzer from "@/components/UrlAnalyzer";

export const metadata: Metadata = {
  title: "Analyze URL",
  description:
    "Analisis keamanan URL secara instan. Masukkan tautan mencurigakan untuk mendapatkan risk score dan indikator keamanan.",
};

export default function AnalyzePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="space-y-2 mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" aria-hidden="true" />
          Engine Deteksi Prototype
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Analisis Keamanan <span className="text-pink-600">URL</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Masukkan URL yang ingin Anda periksa. CyberShield akan menganalisis
          tautan berdasarkan beberapa indikator keamanan dan memberikan risk
          score serta rekomendasi.
        </p>
      </div>

      <UrlAnalyzer />

      {/* Disclaimer */}
      <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
        <p className="font-bold mb-1">⚠️ Disclaimer</p>
        <p className="text-xs leading-relaxed">
          CyberShield adalah prototype yang menggunakan analisis berbasis rule
          sederhana. Hasil analisis bersifat edukatif dan tidak menggantikan
          solusi keamanan profesional. Selalu gunakan perangkat antivirus dan
          berhati-hati saat mengklik tautan dari sumber tidak dikenal.
        </p>
      </div>
    </div>
  );
}

