"use client";

import React, { useState, useEffect, useId, useMemo } from "react";

// ============================================================================
// DATA & TYPES: GREETINGS, SAMPLES, AND PHISHING COMPARISON
// ============================================================================

interface GreetingItem {
  id: string;
  word: string;
  lang: string;
  flag: string;
  tagline: string;
}

const GREETINGS: GreetingItem[] = [
  {
    id: "fr",
    word: "BONJOUR!",
    lang: "Français",
    flag: "🇫🇷",
    tagline: "Protégez vos données et naviguez en toute sécurité.",
  },
  {
    id: "es",
    word: "HOLA!",
    lang: "Español",
    flag: "🇪🇸",
    tagline: "¡Detecta enlaces fraudulentos y defiende tu privacidad digital!",
  },
  {
    id: "id",
    word: "HALO!",
    lang: "Bahasa Indonesia",
    flag: "🇮🇩",
    tagline: "Waspada terhadap phishing: satu klik ceroboh bisa menguras aset digital Anda.",
  },
];

interface SampleUrl {
  name: string;
  url: string;
  type: "safe" | "phishing";
  category: string;
}

const SAMPLE_URLS: SampleUrl[] = [
  {
    name: "KlikBCA Resmi",
    url: "https://klikbca.com/login",
    type: "safe",
    category: "Perbankan Resmi",
  },
  {
    name: "Tiruan Bank (Hadiah Gebyar)",
    url: "http://bca-klaim-hadiah-gebyar.xyz/login.php",
    type: "phishing",
    category: "Phishing Finansial",
  },
  {
    name: "Undangan WhatsApp Palsu (APK)",
    url: "http://surat-undangan-nikah-digital.online/update.apk",
    type: "phishing",
    category: "Malware & Phishing APK",
  },
  {
    name: "Dana Kaget Palsu",
    url: "http://klaim-saldo-dana-kaget-gratis.site/verifikasi",
    type: "phishing",
    category: "Social Engineering",
  },
  {
    name: "Portal Kominfo Resmi",
    url: "https://kemkominfo.go.id/keamanan-siber",
    type: "safe",
    category: "Layanan Publik Resmi",
  },
];

interface AnalysisResult {
  url: string;
  isSafe: boolean;
  riskScore: number; // 0 - 100%
  protocol: { isHttps: boolean; detail: string };
  domainCheck: { isSuspicious: boolean; detail: string };
  keywordCheck: { isTriggered: boolean; keywords: string[] };
  extensionCheck: { isDangerous: boolean; ext: string };
  recommendation: string;
}

// ============================================================================
// MAIN PAGE COMPONENT: CYBERSHIELD
// ============================================================================

export default function CyberShieldApp() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("silvi@cybershield.id");
  const [userPassword, setUserPassword] = useState<string>("keamanan2026");
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Dynamic Greeting State
  const [greetingIdx, setGreetingIdx] = useState<number>(0);

  // Link Checker Simulator State (Available after Login / Guest)
  const [inputUrl, setInputUrl] = useState<string>("http://bca-klaim-hadiah-gebyar.xyz/login.php");
  const [analyzedResult, setAnalyzedResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scannedCount, setScannedCount] = useState<number>(3);

  // Modals State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);

  // Accessible IDs
  const emailInputId = useId();
  const passwordInputId = useId();
  const rememberCheckboxId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const urlInputId = useId();
  const liveStatusId = useId();

  // Contact form state
  const [contactSubject, setContactSubject] = useState("Laporkan Tautan Phishing");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Auto-rotate greetings every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setGreetingIdx((prev) => (prev + 1) % GREETINGS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut: Escape to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileModalOpen(false);
        setIsContactModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentGreeting = GREETINGS[greetingIdx];

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};

    if (!userEmail.trim()) {
      errors.email = "Alamat email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      errors.email = "Format email tidak valid (harus mengandung '@' dan domain).";
    }

    if (!userPassword.trim()) {
      errors.password = "Kata sandi wajib diisi.";
    } else if (userPassword.length < 6) {
      errors.password = "Kata sandi minimal berisi 6 karakter.";
    }

    setLoginErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsLoggingIn(true);
      setTimeout(() => {
        setIsLoggingIn(false);
        setIsLoggedIn(true);
        setIsGuestMode(false);
        // Pre-run analysis on default sample
        analyzeUrl(inputUrl);
      }, 600);
    }
  };

  // Quick Guest Shortcut
  const handleGuestAccess = () => {
    setIsLoggedIn(true);
    setIsGuestMode(true);
    setUserEmail("tamu.keamanan@cybershield.id");
    analyzeUrl(inputUrl);
  };

  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsGuestMode(false);
    setAnalyzedResult(null);
  };

  // URL Security Analysis Engine
  const analyzeUrl = (urlToTest: string) => {
    if (!urlToTest.trim()) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      const lower = urlToTest.toLowerCase().trim();
      const isHttps = lower.startsWith("https://");

      // Suspicious TLD detection
      const suspiciousTlds = [".xyz", ".online", ".site", ".top", ".cc", ".tk", ".fun", ".pw", ".bid"];
      const hasSuspiciousTld = suspiciousTlds.some((tld) => lower.includes(tld));

      // Suspicious keywords indicative of social engineering
      const riskKeywords = ["klaim", "hadiah", "gebyar", "gratis", "kaget", "verifikasi", "update-akun", "undangan-nikah", "apk-download", "saldo"];
      const foundKeywords = riskKeywords.filter((kw) => lower.includes(kw));

      // Suspicious extensions
      const dangerousExts = [".apk", ".exe", ".bat", ".scr", ".zip"];
      const foundExt = dangerousExts.find((ext) => lower.endsWith(ext) || lower.includes(`${ext}?`)) || "";

      // Phishing calculation
      let riskScore = 0;
      if (!isHttps) riskScore += 35;
      if (hasSuspiciousTld) riskScore += 30;
      if (foundKeywords.length > 0) riskScore += Math.min(foundKeywords.length * 15, 30);
      if (foundExt) riskScore += 30;

      // Safe domain check (whitelisted standard patterns)
      const officialWhiteList = ["klikbca.com", "kemkominfo.go.id", "instagram.com", "google.com", "bankmandiri.co.id"];
      const isWhitelisted = officialWhiteList.some((domain) => lower.includes(domain)) && isHttps && !hasSuspiciousTld && foundKeywords.length === 0;

      if (isWhitelisted) {
        riskScore = 0;
      } else {
        riskScore = Math.min(Math.max(riskScore, 15), 98);
      }

      const isSafe = riskScore < 30;

      setAnalyzedResult({
        url: urlToTest,
        isSafe,
        riskScore,
        protocol: {
          isHttps,
          detail: isHttps
            ? "HTTPS Terenkripsi (Sertifikat SSL Aktif)"
            : "HTTP Tidak Terenkripsi (Komunikasi teks terbuka rawan intersepsi)",
        },
        domainCheck: {
          isSuspicious: hasSuspiciousTld,
          detail: hasSuspiciousTld
            ? "Menggunakan domain ekstensi berbiaya murah yang lazim dipakai serangan massal (.xyz/.site/.online)"
            : "Domain tergolong menggunakan standar umum.",
        },
        keywordCheck: {
          isTriggered: foundKeywords.length > 0,
          keywords: foundKeywords,
        },
        extensionCheck: {
          isDangerous: Boolean(foundExt),
          ext: foundExt,
        },
        recommendation: isSafe
          ? "Tautan terindikasi aman dari reputasi domain dan enkripsi. Namun tetap berhati-hati jangan pernah membocorkan kode OTP."
          : "JANGAN KLIK! Tautan ini memiliki ciri khas domain tiruan (phishing). Tutup halaman dan jangan masukkan kredensial atau unduh berkas apapun.",
      });

      setScannedCount((prev) => prev + 1);
      setIsAnalyzing(false);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-pink-50/70 text-slate-900 flex flex-col justify-between font-sans selection:bg-pink-200 selection:text-pink-900 antialiased">
      {/* Background Soft Glow Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-pink-200/50 blur-3xl" />
        <div className="absolute top-1/2 -right-28 w-88 h-88 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 rounded-full bg-pink-100/60 blur-3xl" />
      </div>

      {/* Screen Reader Live Region for Announcements */}
      <div id={liveStatusId} role="status" aria-live="polite" className="sr-only">
        {isLoggedIn ? "Anda berada di dasbor pemeriksa tautan CyberShield." : "Silakan masuk atau gunakan mode tamu untuk mengakses detektor phishing."}
      </div>

      {/* ==================================================================== */}
      {/* HEADER & UPPER BAR: <header role="banner">                           */}
      {/* ==================================================================== */}
      <header
        role="banner"
        className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-[0_2px_16px_rgba(244,114,182,0.12)] transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Identity & Shield Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-pink-600 to-rose-400 flex items-center justify-center text-white shadow-md shadow-pink-200/80 transition-transform hover:scale-105">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Cyber<span className="text-pink-600">Shield</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-pink-100/80 text-pink-700 border border-pink-200">
                  Anti-Phishing Aware
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Deteksi Tautan Mencurigakan & Edukasi Waspada Phishing
              </p>
            </div>
          </div>

          {/* Dynamic Greeting Words Showcase (BONJOUR, HOLA, HALO) */}
          <div
            className="flex items-center gap-2 bg-pink-50/90 px-3 py-1.5 rounded-full border border-pink-200/90 shadow-xs"
            role="region"
            aria-label="Sapaan Multibahasa Digital Safety"
          >
            <span className="text-sm" aria-hidden="true">
              {currentGreeting.flag}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wider text-pink-600 uppercase">
                {currentGreeting.word}
              </span>
              <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
                ({currentGreeting.lang})
              </span>
            </div>

            {/* Quick Interactive Language Switcher */}
            <div className="flex items-center gap-1 ml-1 pl-2 border-l border-pink-200">
              {GREETINGS.map((g, idx) => (
                <button
                  key={g.id}
                  onClick={() => setGreetingIdx(idx)}
                  aria-pressed={greetingIdx === idx}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                    greetingIdx === idx
                      ? "bg-pink-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-pink-600 hover:bg-white"
                  }`}
                  title={`Ganti salam ke bahasa ${g.lang}`}
                >
                  {g.word.replace("!", "")}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Items & User Session Indicator */}
          <nav
            role="navigation"
            aria-label="Navigasi Utama CyberShield"
            className="flex items-center gap-2 sm:gap-3"
          >
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-pink-600 hover:bg-pink-50 border border-transparent hover:border-pink-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
            >
              Profil
            </button>

            <button
              onClick={() => setIsContactModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-pink-600 hover:bg-pink-50 border border-transparent hover:border-pink-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
            >
              Kontak
            </button>

            {/* Login / Logout Toggle Indicator */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2 pl-2 border-l border-pink-200">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 group p-1 rounded-xl hover:bg-pink-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                  aria-label="Buka profil pengguna aktif"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {isGuestMode ? "GM" : "SR"}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-pink-600 leading-tight">
                      {isGuestMode ? "Tamu Keamanan" : "Silvi Ramadhani"}
                    </p>
                    <span className="text-[10px] text-pink-600 font-semibold">
                      {isGuestMode ? "Guest Mode" : "Defender Lv. 1"}
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  title="Keluar dari akun"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-2 border-l border-pink-200">
                <button
                  onClick={handleGuestAccess}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                  title="Akses cepat tanpa login kredensial"
                >
                  Masuk Guest
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MAIN CONTENT AREA: <main role="main">                                */}
      {/* ==================================================================== */}
      <main role="main" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 z-10 space-y-8">
        {/* Dynamic Welcoming Security Banner */}
        <section
          role="region"
          aria-labelledby="hero-banner-heading"
          className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-pink-500 via-pink-600 to-rose-400 text-white shadow-[0_12px_30px_rgba(244,114,182,0.32)] flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">
                {currentGreeting.flag}
              </span>
              <h1 id="hero-banner-heading" className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                {currentGreeting.word} Kenali & Tangkal Serangan Phishing!
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-pink-100 font-normal leading-relaxed">
              {currentGreeting.tagline} Peretas memanfaatkan kelengahan manusia lewat tautan palsu, rekayasa sosial, dan format halaman login tiruan. Pelajari dampak buruknya dan uji keaslian URL Anda di bawah ini.
            </p>
          </div>

          {/* Quick Status / Switch Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/30 text-xs">
            <span className="font-semibold text-pink-100 hidden sm:inline">
              Status Sesi:
            </span>
            <span className="font-black px-2.5 py-1 rounded-xl bg-white text-pink-600 shadow-xs">
              {isLoggedIn ? (isGuestMode ? "Tamu Aktif" : "Member Terverifikasi") : "Belum Masuk"}
            </span>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 1: INTERACTIVE LOGIN SYSTEM (When not logged in)           */}
        {/* ================================================================== */}
        {!isLoggedIn && (
          <section
            role="region"
            aria-labelledby="login-section-heading"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start"
          >
            {/* Login Form Card (5 cols on lg) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-pink-200/90 shadow-[0_15px_35px_rgba(244,114,182,0.12)]">
              <div className="mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 mb-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                  Otentikasi Pengguna
                </span>
                <h2 id="login-section-heading" className="text-2xl font-black text-slate-900 tracking-tight">
                  Masuk ke CyberShield
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Buka akses penuh ke Simulator Analisis Tautan & modul deteksi rekayasa sosial.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                {/* Email Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor={emailInputId}
                      className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
                    >
                      Alamat Email <span className="text-pink-600" aria-hidden="true">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Gunakan email aktif</span>
                  </div>
                  <input
                    id={emailInputId}
                    type="email"
                    autoComplete="email"
                    required
                    aria-required="true"
                    aria-invalid={loginErrors.email ? "true" : "false"}
                    aria-describedby={loginErrors.email ? emailErrorId : undefined}
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="nama@domain.com"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all bg-white text-slate-900 border ${
                      loginErrors.email
                        ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                        : "border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    } focus:outline-none`}
                  />
                  {loginErrors.email && (
                    <p
                      id={emailErrorId}
                      role="alert"
                      className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {loginErrors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor={passwordInputId}
                      className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
                    >
                      Kata Sandi <span className="text-pink-600" aria-hidden="true">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] font-semibold text-pink-600 hover:text-pink-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 rounded"
                    >
                      {showPassword ? "Sembunyikan" : "Tampilkan"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id={passwordInputId}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      aria-required="true"
                      aria-invalid={loginErrors.password ? "true" : "false"}
                      aria-describedby={loginErrors.password ? passwordErrorId : undefined}
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all bg-white text-slate-900 border ${
                        loginErrors.password
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                          : "border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                      } focus:outline-none pr-10`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                  {loginErrors.password && (
                    <p
                      id={passwordErrorId}
                      role="alert"
                      className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {loginErrors.password}
                    </p>
                  )}
                </div>

                {/* "Ingat Saya" Checkbox & Lupa Sandi */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      id={rememberCheckboxId}
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <label
                      htmlFor={rememberCheckboxId}
                      className="text-xs font-medium text-slate-700 cursor-pointer select-none"
                    >
                      Ingat Saya
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      alert("Tautan pemulihan kata sandi telah dikirimkan ke email Anda.")
                    }
                    className="text-xs font-semibold text-pink-600 hover:text-pink-700 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 rounded"
                  >
                    Lupa Sandi?
                  </button>
                </div>

                {/* Action Buttons: "Masuk" and "Masuk Tanpa Login (Guest)" */}
                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-pink-500 hover:bg-pink-600 active:scale-[0.99] disabled:bg-pink-300 shadow-md shadow-pink-200/80 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                  >
                    {isLoggingIn ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                        <span>Memverifikasi Akun...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke CyberShield</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleGuestAccess}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-pink-700 bg-pink-50 hover:bg-pink-100/80 border border-pink-200 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                  >
                    <span>🚀 Masuk Tanpa Login (Mode Guest)</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Platform Feature Spotlight (7 cols on lg) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-pink-200 shadow-sm space-y-5">
              <div>
                <span className="text-xs font-extrabold text-pink-600 uppercase tracking-wider">
                  Misi Keamanan Digital
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                  Lindungi Identitas Anda dari Jebakan Phishing
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Phishing adalah kejahatan siber nomor 1 di mana penipu menyamar sebagai institusi resmi (bank, kurir paket, atau teman) untuk memancing Anda memberikan kata sandi, OTP, atau nomor kartu ATM.
                </p>
              </div>

              {/* 3 Core Shield Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100">
                  <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center text-sm font-bold mb-2">
                    🔍
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Analisis URL</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cek otomatis keaslian domain, sertifikat SSL, dan ekstensi berbahaya.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100">
                  <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center text-sm font-bold mb-2">
                    🛡️
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Edukasi Waspada</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pahami konsekuensi nyata antara perilaku waspada vs abai phishing.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100">
                  <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center text-sm font-bold mb-2">
                    ⚡
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Respons Cepat</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Rekomendasi mitigasi instan jika terlanjur mengklik tautan berbahaya.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-pink-50/80 border border-pink-200 text-xs text-slate-700 flex items-center justify-between gap-3">
                <span className="font-medium">
                  Ingin langsung menguji tautan mencurigakan?
                </span>
                <button
                  onClick={handleGuestAccess}
                  className="px-3.5 py-1.5 rounded-xl font-bold bg-pink-500 hover:bg-pink-600 text-white shadow-xs shrink-0"
                >
                  Buka Simulator
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================== */}
        {/* SECTION 2: INTERACTIVE LINK SIMULATOR / CHECK TOOL (Unlocked)     */}
        {/* ================================================================== */}
        {isLoggedIn && (
          <section
            role="region"
            aria-labelledby="simulator-heading"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-200 shadow-sm space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-pink-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Simulator Aktif
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Total Diperiksa: {scannedCount} URL
                  </span>
                </div>
                <h2 id="simulator-heading" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                  Simulator & Detektor Tautan Phishing
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Masukkan tautan URL asing yang Anda terima melalui SMS, WhatsApp, atau email untuk menguji tingkat risikonya.
                </p>
              </div>

              {/* Sample Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 mr-1">Uji Sampel:</span>
                {SAMPLE_URLS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputUrl(sample.url);
                      analyzeUrl(sample.url);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                      sample.type === "safe"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                    }`}
                    title={`Uji URL: ${sample.url}`}
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Input URL Bar */}
            <div className="space-y-2">
              <label htmlFor={urlInputId} className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Alamat Tautan (URL) yang Ingin Dianalisis
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <input
                    id={urlInputId}
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://contoh-domain.com/login"
                    className="w-full px-4 py-3 rounded-2xl text-sm font-mono border border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none bg-pink-50/30 text-slate-900"
                  />
                  <span className="absolute right-3 top-3 text-slate-400 text-xs">
                    🔗
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => analyzeUrl(inputUrl)}
                  disabled={isAnalyzing || !inputUrl.trim()}
                  className="px-6 py-3 rounded-2xl font-bold text-sm text-white bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 shadow-md shadow-pink-200/80 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 shrink-0"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Menganalisis...</span>
                    </>
                  ) : (
                    <>
                      <span>Analisis Tautan</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Analysis Result Card */}
            {analyzedResult && (
              <div
                className={`p-5 sm:p-6 rounded-3xl border-2 transition-all ${
                  analyzedResult.isSafe
                    ? "bg-emerald-50/40 border-emerald-300"
                    : "bg-rose-50/40 border-rose-300 shadow-[0_10px_25px_rgba(244,63,94,0.12)]"
                }`}
              >
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-pink-100/80">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                        analyzedResult.isSafe ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                      }`}
                    >
                      {analyzedResult.isSafe ? "✓" : "⚠"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-base sm:text-lg font-black uppercase tracking-wide ${
                            analyzedResult.isSafe ? "text-emerald-800" : "text-rose-700"
                          }`}
                        >
                          {analyzedResult.isSafe ? "Tautan Terindikasi Aman" : "Peringatan: Tautan Phishing / Berbahaya!"}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-600 break-all mt-0.5">
                        {analyzedResult.url}
                      </p>
                    </div>
                  </div>

                  {/* Threat Risk Gauge */}
                  <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-2xl border border-pink-100 shadow-xs self-start sm:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Skor Ancaman
                      </span>
                      <span
                        className={`text-xl font-black ${
                          analyzedResult.isSafe ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {analyzedResult.riskScore}%
                      </span>
                    </div>
                    <div className="w-12 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          analyzedResult.isSafe ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${analyzedResult.riskScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Detection Diagnostic Indicators (CSS Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                  {/* Indicator 1: SSL / Protocol */}
                  <div className="bg-white p-3.5 rounded-2xl border border-pink-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-500">Protokol Enkripsi</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          analyzedResult.protocol.isHttps ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {analyzedResult.protocol.isHttps ? "HTTPS" : "HTTP POLOS"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {analyzedResult.protocol.detail}
                    </p>
                  </div>

                  {/* Indicator 2: Domain Extension */}
                  <div className="bg-white p-3.5 rounded-2xl border border-pink-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-500">Reputasi Domain</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          analyzedResult.domainCheck.isSuspicious ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {analyzedResult.domainCheck.isSuspicious ? "Mencurigakan" : "Standar"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {analyzedResult.domainCheck.detail}
                    </p>
                  </div>

                  {/* Indicator 3: Trigger Keywords */}
                  <div className="bg-white p-3.5 rounded-2xl border border-pink-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-500">Rekayasa Sosial</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          analyzedResult.keywordCheck.isTriggered ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {analyzedResult.keywordCheck.isTriggered ? "Terdeteksi" : "Nihil"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {analyzedResult.keywordCheck.isTriggered
                        ? `Kata pancingan: "${analyzedResult.keywordCheck.keywords.join(", ")}"`
                        : "Tidak ditemukan kata umpan hadiah atau pemaksaan verifikasi."}
                    </p>
                  </div>

                  {/* Indicator 4: Dangerous File Extension */}
                  <div className="bg-white p-3.5 rounded-2xl border border-pink-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-500">Muatan Berkas</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          analyzedResult.extensionCheck.isDangerous ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {analyzedResult.extensionCheck.isDangerous ? "Bahaya Malware" : "Bersih"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {analyzedResult.extensionCheck.isDangerous
                        ? `Tautan mengarah ke unduhan berkas ${analyzedResult.extensionCheck.ext.toUpperCase()} (penyusup ponsel/PC)`
                        : "Tidak terdeteksi unduhan executable mencurigakan."}
                    </p>
                  </div>
                </div>

                {/* Final Safety Advice Callout */}
                <div className="mt-4 p-3.5 rounded-2xl bg-white/90 border border-pink-200 flex items-start gap-2.5">
                  <span className="text-base shrink-0">💡</span>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5">
                      Saran Tindakan Keamanan:
                    </span>
                    {analyzedResult.recommendation}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================================================================== */}
        {/* SECTION 3: SIDE-BY-SIDE COMPARISON: WASPADA VS ABAIKAN PHISHING   */}
        {/* (Built with Responsive CSS Grid 2-Columns)                         */}
        {/* ================================================================== */}
        <section
          role="region"
          aria-labelledby="comparison-heading"
          className="space-y-4"
        >
          <div className="text-center max-w-3xl mx-auto space-y-1">
            <span className="text-xs font-extrabold text-pink-600 uppercase tracking-wider bg-pink-100/70 px-3 py-1 rounded-full border border-pink-200">
              Analisis Komparatif Perilaku Siber
            </span>
            <h2 id="comparison-heading" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Apa yang Terjadi Jika Kita Waspada vs Tidak Waspada Terhadap Phishing?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Keputusan Anda sebelum mengklik sebuah tautan menentukan masa depan aset finansial dan privasi keluarga Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
            {/* COLUMN 1: JIKA WASPADA PHISHING (DAMPAK POSITIF) */}
            <article
              role="article"
              className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-300 shadow-[0_12px_35px_rgba(16,185,129,0.1)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      🛡️
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        Jika Kita Waspada Phishing
                      </h3>
                      <span className="text-xs font-bold text-emerald-700">
                        Dampak Positif & Perlindungan Nyata
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                    Aman 100%
                  </span>
                </div>

                <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        Data Pribadi & Kredensial Aman:
                      </strong>
                      Kata sandi, nomor KTP, email, dan kode OTP tetap terlindungi tanpa pernah bocor ke tangan sindikat penipu.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        Terhindar dari Peretasan Akun:
                      </strong>
                      Akun penting seperti WhatsApp, Instagram, dan email bisnis tidak bisa diambil alih lewat sesi kloningan (session hijack).
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        Transaksi Keuangan Terlindungi:
                      </strong>
                      Saldo di rekening bank, m-banking, dan dompet digital (e-wallet) tetap utuh karena tidak tertipu halaman login palsu.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        Kebal Terhadap Rekayasa Sosial (Social Engineering):
                      </strong>
                      Mampu berpikir kritis saat menerima iming-iming hadiah, undian palsu, atau ancaman denda fiktif.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <span>✨</span>
                <span>Hasil: Ketenangan pikiran, reputasi digital terjaga, dan bebas risiko utang pinjaman online fiktif.</span>
              </div>
            </article>

            {/* COLUMN 2: JIKA ABAIKAN PHISHING (DAMPAK BURUK) */}
            <article
              role="article"
              className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-rose-300 shadow-[0_12px_35px_rgba(244,63,94,0.12)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      ⚠️
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        Jika Abaikan Phishing
                      </h3>
                      <span className="text-xs font-bold text-rose-600">
                        Dampak Buruk & Kerugian Fatal
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold bg-rose-100 text-rose-800 px-3 py-1 rounded-full border border-rose-200">
                    Bahaya Fatal
                  </span>
                </div>

                <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✕
                    </span>
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        Pencurian Kata Sandi & Data Finansial:
                      </strong>
                      Kredensial login dikirim langsung ke server pelaku penipuan dan diperjualbelikan di forum dark web.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✕
                    </span>
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        Peretasan WhatsApp & Media Sosial:
                      </strong>
                      Akun Anda dibajak untuk meminjam uang secara massal ke daftar kontak keluarga dan teman dekat Anda.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✕
                    </span>
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        Kerugian Finansial Langsung:
                      </strong>
                      Saldo rekening terkuras seketika melalui transaksi transfer tidak sah atau pembuatan pinjaman atas nama Anda.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✕
                    </span>
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        Penyebaran Malware & Ransomware:
                      </strong>
                      Mengunduh berkas berbahaya (.apk surat undangan/resi paket palsu) yang dapat membaca seluruh SMS OTP tanpa izin.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 font-semibold flex items-center gap-2">
                <span>💥</span>
                <span>Akibat: Kerugian material puluhan juta rupiah, hilangnya reputasi sosial, dan beban stres psikologis.</span>
              </div>
            </article>
          </div>
        </section>
      </main>

      {/* ==================================================================== */}
      {/* FOOTER: <footer role="contentinfo">                                  */}
      {/* ==================================================================== */}
      <footer
        role="contentinfo"
        className="mt-12 w-full bg-white border-t border-pink-200 py-6 sm:py-8 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-pink-500 text-white font-bold text-xs flex items-center justify-center">
              CS
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              CyberShield Platform &copy; 2026
            </span>
            <span className="text-xs text-slate-400">• Arsitektur Frontend oleh Silvi</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="hover:text-pink-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 rounded"
            >
              Tentang CyberShield
            </button>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="hover:text-pink-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 rounded"
            >
              Laporkan URL Penipuan
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-pink-600 font-bold">
              WCAG 2.2 AA & Mobile-First Ready
            </span>
          </div>
        </div>
      </footer>

      {/* ==================================================================== */}
      {/* MODAL 1: PROFIL PENGGUNA (Accessible Dialog)                          */}
      {/* ==================================================================== */}
      {isProfileModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-pink-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                <h3 id="profile-dialog-title" className="text-lg font-black text-slate-900">
                  Profil Pengguna & Status Keamanan
                </h3>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 text-slate-600 hover:text-pink-600 flex items-center justify-center text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                aria-label="Tutup jendela profil"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white font-black text-2xl flex items-center justify-center shadow-md">
                {isGuestMode ? "GM" : "SR"}
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  {isLoggedIn ? (isGuestMode ? "Tamu Keamanan Digital" : "Silvi Ramadhani") : "Pengunjung Belum Masuk"}
                </h4>
                <p className="text-xs text-slate-500">
                  {isLoggedIn ? userEmail : "Gunakan formulir masuk untuk menyimpan riwayat audit"}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                    {isGuestMode ? "Akses Guest Cepat" : "Cyber Defender Lv. 1"}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {isLoggedIn ? "Aktif 2026" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-pink-50/70 p-4 rounded-2xl border border-pink-100 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Status Autentikasi:</span>
                <span className="font-bold text-pink-600">
                  {isLoggedIn ? (isGuestMode ? "Sesi Tamu Terbuka" : "Terverifikasi (Member)") : "Tamu Tidak Terotentikasi"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total URL Dianalisis:</span>
                <span className="font-bold">{scannedCount} Pemindaian</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tingkat Literasi Anti-Phishing:</span>
                <span className="font-bold text-emerald-700">Tinggi (Sadar Ancaman)</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-pink-50 hover:bg-pink-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: KONTAK & LAPOR PHISHING (Accessible Dialog)                 */}
      {/* ==================================================================== */}
      {isContactModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-pink-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📢</span>
                <h3 id="contact-dialog-title" className="text-lg font-black text-slate-900">
                  Kontak Tim CyberShield & Laporkan Tautan
                </h3>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 text-slate-600 hover:text-pink-600 flex items-center justify-center text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                aria-label="Tutup jendela kontak"
              >
                ✕
              </button>
            </div>

            {contactSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="text-2xl">🛡️</div>
                <h4 className="text-sm font-bold text-emerald-800">
                  Laporan Anda Telah Diterima!
                </h4>
                <p className="text-xs text-slate-600">
                  Domain yang Anda laporkan akan diverifikasi dan diteruskan ke database pemblokiran ancaman siber nasional.
                </p>
                <button
                  onClick={() => {
                    setContactSubmitted(false);
                    setIsContactModalOpen(false);
                  }}
                  className="mt-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (contactMessage.trim()) {
                    setContactSubmitted(true);
                  }
                }}
                className="space-y-3.5"
              >
                <div>
                  <label htmlFor="contact-sender-email" className="block text-xs font-bold text-slate-800 mb-1">
                    Email Pelapor
                  </label>
                  <input
                    id="contact-sender-email"
                    type="email"
                    defaultValue={isLoggedIn ? userEmail : "pelapor@domain.com"}
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="contact-category" className="block text-xs font-bold text-slate-800 mb-1">
                    Kategori Laporan / Pertanyaan
                  </label>
                  <select
                    id="contact-category"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                  >
                    <option value="Laporkan Tautan Phishing">Laporkan Tautan Phishing Baru</option>
                    <option value="Akun Terlanjur Teretas">Bantuan Mediasi: Akun Terlanjur Teretas</option>
                    <option value="Kerjasama Edukasi">Konsultasi Edukasi Keamanan Digital</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-msg-body" className="block text-xs font-bold text-slate-800 mb-1">
                    Keterangan Tautan / Pesan Penipuan
                  </label>
                  <textarea
                    id="contact-msg-body"
                    rows={3}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Contoh: Saya menerima SMS mengatasnamakan bank berisi link xyz..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-pink-50 hover:bg-pink-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 shadow-sm"
                  >
                    Kirim Laporan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
