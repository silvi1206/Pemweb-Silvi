"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUserAction, logoutAction } from "@/app/actions/auth";
import type { SessionData } from "@/lib/auth/session";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/analyze", label: "Analyze" },
  { href: "/history", label: "History" },
  { href: "/about", label: "About" },
  { href: "/latihan-routing", label: "Latihan" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getCurrentUserAction().then((res) => {
      if (isMounted && res.success && res.data) {
        setSession(res.data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutAction();
    setSession(null);
    setIsLoggingOut(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#F1DDE3] shadow-[0_2px_16px_rgba(217,108,138,0.06)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="CyberShield — Kembali ke halaman utama"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C65373] via-[#D96C8A] to-[#E9A0B3] flex items-center justify-center text-white shadow-md shadow-[#F1DDE3]/80 transition-transform group-hover:scale-105">
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
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-[#29242A]">
                Cyber<span className="text-[#D96C8A]">Shield</span>
              </span>
            </div>

            <p className="text-[11px] text-[#766B70] font-medium hidden sm:block">
              URL Security Analyzer
            </p>
          </div>
        </Link>

        {/* Navigation & Auth */}
        <div className="flex items-center gap-3">
          <nav aria-label="Navigasi utama">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96C8A] focus-visible:ring-offset-2 ${
                        isActive
                          ? "bg-[#F8E5EB] text-[#A64463] border border-[#F1DDE3] shadow-xs"
                          : "text-[#5F565B] hover:text-[#C65373] hover:bg-[#FFF1F4]"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center pl-2 border-l border-[#F1DDE3] gap-2">
            {session ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-bold text-[#29242A] leading-tight">
                    {session.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      session.role === "admin"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-[#F8E5EB] text-[#A64463] border border-[#F1DDE3]"
                    }`}
                  >
                    {session.role.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#A64463] bg-[#F8E5EB] hover:bg-rose-100 border border-[#F1DDE3] transition-colors cursor-pointer"
                >
                  {isLoggingOut ? "Keluar..." : "Keluar"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#5F565B] hover:text-[#C65373] hover:bg-[#FFF1F4] transition-all"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#C65373] to-[#D96C8A] hover:opacity-95 shadow-xs transition-all"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
