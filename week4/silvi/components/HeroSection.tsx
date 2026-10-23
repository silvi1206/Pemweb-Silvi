import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="py-12 sm:py-16 lg:py-20 text-center"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#F8E5EB] text-[#A64463] border border-[#F1DDE3] shadow-2xs">
          <span
            className="w-2 h-2 rounded-full bg-[#D96C8A] animate-pulse"
            aria-hidden="true"
          />
          Prototype — Rule-Based Analysis
        </span>

        <h1
          id="hero-heading"
          className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#29242A] leading-tight"
        >
          Periksa Keamanan URL{" "}
          <span className="text-[#D96C8A]">Sebelum Anda Klik</span>
        </h1>

        <p className="text-base sm:text-lg text-[#766B70] leading-relaxed max-w-2xl mx-auto">
          CyberShield membantu Anda menganalisis tautan mencurigakan dan
          mendeteksi potensi phishing. Dapatkan risk score dan rekomendasi
          keamanan secara instan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#D96C8A] hover:bg-[#C65373] shadow-md shadow-[#F1DDE3]/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96C8A] focus-visible:ring-offset-2 active:scale-[0.99]"
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#5F565B] bg-white hover:bg-[#FFF1F4] border border-[#F1DDE3] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96C8A] focus-visible:ring-offset-2 active:scale-[0.99]"
          >
            Pelajari Cara Kerja
          </Link>
        </div>
      </div>
    </section>
  );
}