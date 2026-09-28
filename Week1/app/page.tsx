"use client";

import React, { useState, useEffect, useCallback } from "react";

interface Greeting {
  word: string;
  language: string;
  flag: string;
  pronounce: string;
  description: string;
}

const GREETINGS: Greeting[] = [
  {
    word: "Hola",
    language: "Español",
    flag: "🇪🇸",
    pronounce: "/ˈo.la/",
    description: "Un saludo cálido y enérgico para comenzar.",
  },
  {
    word: "Halo",
    language: "Bahasa Indonesia",
    flag: "🇮🇩",
    pronounce: "/ha.lo/",
    description: "Sapaan ramah dan bersahabat untuk semua.",
  },
  {
    word: "Bonjour",
    language: "Français",
    flag: "🇫🇷",
    pronounce: "/bɔ̃.ʒuʁ/",
    description: "Sapaan anggun penuh kehangatan dan keanggunan.",
  },
];

interface Slide {
  id: number;
  category: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    category: "01 • Pembuka",
    title: "Salam Hangat & Selamat Datang",
    subtitle: "Menyambut audiens dengan kesederhanaan dan kehangatan dalam harmoni merah muda dan putih.",
  },
  {
    id: 2,
    category: "02 • Konsep Desain",
    title: "Filosofi Minimalis Modern",
    subtitle: "Mengutamakan kejernihan, ruang bernapas, serta estetika visual yang menenangkan.",
  },
  {
    id: 3,
    category: "03 • Pilar Utama",
    title: "Tiga Landasan Esensial",
    subtitle: "Fokus pada struktur bersih, tipografi proporsional, dan palet warna yang kohesif.",
  },
  {
    id: 4,
    category: "04 • Dampak & Nilai",
    title: "Mengapa Desain Sederhana Menang",
    subtitle: "Menghilangkan kebisingan visual agar pesan utama tersampaikan tanpa distraksi.",
  },
  {
    id: 5,
    category: "05 • Penutup",
    title: "Terima Kasih & Tanya Jawab",
    subtitle: "Mari berkolaborasi menciptakan pengalaman visual yang bernilai dan berkesan.",
  },
];

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeGreetingIdx, setActiveGreetingIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [likesCount, setLikesCount] = useState(24);
  const [hasLiked, setHasLiked] = useState(false);

  // Auto-rotate greetings on slide 1
  useEffect(() => {
    if (currentSlide === 0) {
      const greetingTimer = setInterval(() => {
        setActiveGreetingIdx((prev) => (prev + 1) % GREETINGS.length);
      }, 3200);
      return () => clearInterval(greetingTimer);
    }
  }, [currentSlide]);

  // Autoplay presentation slides
  useEffect(() => {
    if (!isAutoPlaying) return;
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(slideTimer);
  }, [isAutoPlaying]);

  const goToNextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev < SLIDES.length - 1 ? prev + 1 : 0));
  }, []);

  const goToPrevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : SLIDES.length - 1));
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goToNextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goToPrevSlide();
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextSlide, goToPrevSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const activeGreeting = GREETINGS[activeGreetingIdx];

  const handleLike = () => {
    if (!hasLiked) {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
    } else {
      setLikesCount((prev) => prev - 1);
      setHasLiked(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50/90 via-white to-pink-100/70 text-zinc-800 flex flex-col justify-between p-4 sm:p-6 md:p-10 select-none overflow-x-hidden font-sans">
      {/* Background Soft Glow Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-pink-300/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full bg-rose-100/50 blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between py-3 px-5 sm:px-6 rounded-2xl bg-white/80 backdrop-blur-md border border-pink-100/80 shadow-[0_4px_20px_rgba(244,114,182,0.08)]">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-pink-200">
            P
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-zinc-900">
              Presensi & Presentasi
            </h1>
            <p className="text-[11px] text-pink-500 font-medium tracking-wider uppercase">
              Silvi • Minimalist Deck
            </p>
          </div>
        </div>

        {/* Floating Greeting Pill Badges in Header */}
        <div className="hidden md:flex items-center gap-2 bg-pink-50/70 px-3 py-1.5 rounded-full border border-pink-100">
          <span className="text-[11px] font-medium text-pink-600">Salam:</span>
          {["Hola", "Halo", "Bonjour"].map((word, idx) => (
            <button
              key={word}
              onClick={() => {
                setCurrentSlide(0);
                setActiveGreetingIdx(idx);
              }}
              className={`text-xs px-2.5 py-0.5 rounded-full transition-all duration-200 font-medium ${
                activeGreeting.word === word && currentSlide === 0
                  ? "bg-pink-500 text-white shadow-sm"
                  : "text-zinc-600 hover:text-pink-600 hover:bg-white/80"
              }`}
            >
              {word}
            </button>
          ))}
        </div>

        {/* Slide Counter & Fullscreen Action */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-zinc-500 bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-100">
            <span className="text-pink-600 font-bold">0{currentSlide + 1}</span>
            <span className="mx-1 text-zinc-300">/</span>
            <span>0{SLIDES.length}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh (F)" : "Layar Penuh (F)"}
            className="p-2 rounded-xl text-zinc-500 hover:text-pink-600 hover:bg-pink-50 transition-colors border border-transparent hover:border-pink-100"
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9L4 4m0 0l5 0m-5 0l0 5m11 11l5-5m0 0l-5 0m5 0l0 5M4 15l5 5m-5 0l0-5m0 5l5 0m11-11l-5-5m5 0l-5 0m5 0l0 5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Slide Presentation Stage */}
      <main className="relative z-10 w-full max-w-5xl mx-auto my-auto py-4 sm:py-6">
        <div className="relative bg-white/90 backdrop-blur-xl border border-pink-100/90 rounded-3xl p-6 sm:p-10 md:p-14 shadow-[0_20px_60px_-15px_rgba(244,114,182,0.18)] min-h-[460px] sm:min-h-[500px] flex flex-col justify-between transition-all duration-300">
          
          {/* Subtle Pink Header Ribbon / Slide Category */}
          <div className="flex items-center justify-between border-b border-pink-50 pb-4">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-pink-600 uppercase bg-pink-50/80 px-3 py-1 rounded-full border border-pink-100">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
              {SLIDES[currentSlide].category}
            </span>

            <span className="text-xs text-zinc-400 hidden sm:inline-block">
              Tekan panah keyboard ◄ ► untuk navigasi
            </span>
          </div>

          {/* Dynamic Slide Content */}
          <div className="my-auto py-6">
            {currentSlide === 0 && (
              <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
                
                {/* Greeting Showcase Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200/80 text-pink-600 text-xs font-medium tracking-wide">
                  <span>{activeGreeting.flag}</span>
                  <span>{activeGreeting.language}</span>
                  <span className="text-zinc-300">•</span>
                  <span className="italic text-zinc-500">{activeGreeting.pronounce}</span>
                </div>

                {/* Big Bold Greeting Word Display */}
                <div className="relative group cursor-pointer" onClick={() => setActiveGreetingIdx((prev) => (prev + 1) % GREETINGS.length)}>
                  <h2 className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-500 to-pink-400 py-1 transition-all duration-500 transform hover:scale-105">
                    {activeGreeting.word}!
                  </h2>
                  <p className="text-xs text-pink-400 mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    (Klik untuk mengganti salam)
                  </p>
                </div>

                {/* Greeting Selector Cards: Hola, Halo, Bonjour */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full max-w-lg mt-4">
                  {GREETINGS.map((g, idx) => {
                    const isSelected = activeGreetingIdx === idx;
                    return (
                      <button
                        key={g.word}
                        onClick={() => setActiveGreetingIdx(idx)}
                        className={`p-3.5 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center gap-1 ${
                          isSelected
                            ? "bg-gradient-to-b from-pink-50 to-white border-pink-300 shadow-md shadow-pink-100 scale-105"
                            : "bg-white/60 border-pink-100 hover:border-pink-200 hover:bg-pink-50/40 text-zinc-600"
                        }`}
                      >
                        <span className="text-lg">{g.flag}</span>
                        <span className={`text-base font-bold ${isSelected ? "text-pink-600" : "text-zinc-700"}`}>
                          {g.word}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate max-w-full">
                          {g.language}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-sm sm:text-base text-zinc-600 max-w-xl font-normal leading-relaxed pt-2">
                  {activeGreeting.description} Sebuah presentasi berkelas dengan sentuhan minimalis, ramah, dan memikat.
                </p>
              </div>
            )}

            {currentSlide === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900">
                    Estetika Merah Muda & Putih
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-500 max-w-2xl">
                    Kombinasi palet warna lembut menghadirkan kejelasan pikiran tanpa beban visual yang berlebihan.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="bg-pink-50/60 p-5 rounded-2xl border border-pink-100/90 flex flex-col justify-between space-y-3 hover:bg-pink-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white border border-pink-200 flex items-center justify-center text-pink-600 shadow-xs">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-800 text-base">Cepat & Ringan</h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Struktur satu berkas yang efisien tanpa ketergantungan berat.
                      </p>
                    </div>
                  </div>

                  <div className="bg-pink-50/60 p-5 rounded-2xl border border-pink-100/90 flex flex-col justify-between space-y-3 hover:bg-pink-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white border border-pink-200 flex items-center justify-center text-pink-600 shadow-xs">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-800 text-base">Modern & Adaptif</h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Tampilan responsif di layar ponsel, tablet, hingga proyektor.
                      </p>
                    </div>
                  </div>

                  <div className="bg-pink-50/60 p-5 rounded-2xl border border-pink-100/90 flex flex-col justify-between space-y-3 hover:bg-pink-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white border border-pink-200 flex items-center justify-center text-pink-600 shadow-xs">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-800 text-base">Pengalaman Hangat</h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Membangun koneksi personal dengan audiens melalui salam multibahasa.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentSlide === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900">
                    Pilar Desain Elegan
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-500 max-w-xl mt-1">
                    Prinsip sederhana yang menghasilkan presentasi yang mudah diingat.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    {
                      no: "01",
                      title: "White Space yang Lapang",
                      desc: "Memberi ruang istirahat bagi mata penonton agar tidak cepat lelah.",
                    },
                    {
                      no: "02",
                      title: "Aksen Merah Muda Terarah",
                      desc: "Menghidupkan poin terpenting sebagai penanda visual yang manis.",
                    },
                    {
                      no: "03",
                      title: "Tipografi Berhirarki Jelas",
                      desc: "Teks judul tegas berpadu dengan deskripsi yang mudah dipindai cepat.",
                    },
                  ].map((pillar) => (
                    <div
                      key={pillar.no}
                      className="p-4 rounded-2xl bg-white border border-pink-100 flex items-start gap-4 hover:border-pink-200 hover:shadow-sm transition-all"
                    >
                      <span className="font-mono text-sm font-bold text-pink-500 bg-pink-50 px-2.5 py-1 rounded-lg">
                        {pillar.no}
                      </span>
                      <div>
                        <h4 className="font-semibold text-zinc-800 text-sm sm:text-base">
                          {pillar.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                          {pillar.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentSlide === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900">
                    Indikator Performa Visual
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-500">
                    Keseimbangan ideal antara estetika dan kemudahan pencernaan informasi.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
                  {[
                    { value: "100%", label: "Single File", sub: "Mandiri & siap pakai" },
                    { value: "0 ms", label: "Delay", sub: "Animasi instan & mulus" },
                    { value: "3+", label: "Salam Dunia", sub: "Hola, Halo, Bonjour" },
                    { value: "100%", label: "Minimalis", sub: "Bebas dari kebisingan" },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white to-pink-50/50 border border-pink-100/80 text-center flex flex-col justify-center items-center"
                    >
                      <span className="text-2xl sm:text-3xl font-extrabold text-pink-600">
                        {stat.value}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-zinc-800 mt-1">
                        {stat.label}
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-0.5">
                        {stat.sub}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Greeting Reminder Banner */}
                <div className="bg-pink-50/70 border border-pink-200/60 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🌸</span>
                    <p className="text-xs sm:text-sm text-pink-900">
                      Sapa audiens Anda dalam berbagai bahasa: <span className="font-semibold text-pink-600">Halo</span>, <span className="font-semibold text-pink-600">Hola</span>, dan <span className="font-semibold text-pink-600">Bonjour</span>.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentSlide(0)}
                    className="text-xs font-semibold text-pink-600 hover:text-pink-700 bg-white px-3 py-1.5 rounded-lg border border-pink-200 shrink-0 shadow-xs"
                  >
                    Buka Salam
                  </button>
                </div>
              </div>
            )}

            {currentSlide === 4 && (
              <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-2xl shadow-sm border border-pink-200">
                  💖
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
                    Merci & Terima Kasih
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-500">
                    Semoga presentasi ini menginspirasi dan memberikan kesan mendalam bagi audiens Anda.
                  </p>
                </div>

                {/* Interactive Feedback / Reaction Button */}
                <div className="flex flex-col items-center gap-3 pt-2">
                  <button
                    onClick={handleLike}
                    className={`inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 shadow-md ${
                      hasLiked
                        ? "bg-pink-600 text-white shadow-pink-200 scale-105"
                        : "bg-white text-pink-600 border border-pink-200 hover:bg-pink-50 shadow-pink-100"
                    }`}
                  >
                    <svg className={`w-4 h-4 ${hasLiked ? "fill-white" : "fill-none"}`} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Kirim Salam & Apresiasi</span>
                    <span className="text-xs bg-pink-100 text-pink-700 font-mono px-2 py-0.5 rounded-full">
                      {likesCount}
                    </span>
                  </button>

                  <p className="text-xs text-zinc-400">
                    Klik untuk memberi reaksi positif pada presentasi ini.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Slide Progress Dots & Indicators */}
          <div className="pt-4 border-t border-pink-50 flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === idx
                      ? "w-8 bg-pink-500 shadow-xs shadow-pink-300"
                      : "w-2 bg-pink-100 hover:bg-pink-200"
                  }`}
                  title={`Ke Slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">
                {SLIDES[currentSlide].title}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Control Bar */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {/* Slide Jump Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-all ${
                currentSlide === idx
                  ? "bg-white text-pink-600 border border-pink-200 shadow-xs font-semibold"
                  : "text-zinc-500 hover:text-pink-600 hover:bg-white/60"
              }`}
            >
              Slide {idx + 1}
            </button>
          ))}
        </div>

        {/* Action Controls: Previous, Autoplay, Next */}
        <div className="flex items-center gap-2">
          {/* Autoplay Button */}
          <button
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isAutoPlaying
                ? "bg-pink-50 border-pink-300 text-pink-600"
                : "bg-white/80 border-pink-100 text-zinc-600 hover:bg-white"
            }`}
            title="Otomatis putar slide"
          >
            {isAutoPlaying ? (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                <span>Putar Otomatis</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Otomatis</span>
              </>
            )}
          </button>

          {/* Previous Button */}
          <button
            onClick={goToPrevSlide}
            className="p-2.5 rounded-xl bg-white/90 border border-pink-100 hover:border-pink-200 text-zinc-700 hover:text-pink-600 shadow-xs transition-all active:scale-95"
            title="Slide Sebelumnya (◄)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={goToNextSlide}
            className="px-4 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-medium text-xs shadow-md shadow-pink-200 flex items-center gap-1.5 transition-all active:scale-95"
            title="Slide Berikutnya (► / Spasi)"
          >
            <span>Selanjutnya</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
