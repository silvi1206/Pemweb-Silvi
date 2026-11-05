import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="py-12 sm:py-16 lg:py-20 text-center"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200/80 shadow-2xs">
          <span
            className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"
            aria-hidden="true"
          />
          Prototype — Rule-Based Analysis
        </span>

        <h1
          id="hero-heading"
          className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight"
        >
          Periksa Keamanan URL{" "}
          <span className="text-pink-600">Sebelum Anda Klik</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          CyberShield membantu Anda menganalisis tautan mencurigakan dan
          mendeteksi potensi phishing. Dapatkan risk score dan rekomendasi
          keamanan secara instan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-pink-600 hover:bg-pink-700 shadow-md shadow-pink-200/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 active:scale-[0.99]"
          >
            Mulai Analisis URL
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
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-slate-700 bg-white hover:bg-pink-50/60 border border-pink-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 active:scale-[0.99]"
          >
            Pelajari Cara Kerja
          </Link>
        </div>
      </div>
    </section>
  );
}
