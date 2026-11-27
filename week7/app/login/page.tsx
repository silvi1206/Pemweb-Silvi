"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await loginAction({ email, password });
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        router.push("/history");
        router.refresh();
      }, 800);
    } else {
      setErrorMessage(res.message || "Gagal masuk. Periksa email dan kata sandi.");
    }
  }

  // Helper cepat untuk simulasi akun demo saat pengujian dosen
  function fillDemoAccount(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(217,108,138,0.1)] border border-[#F1DDE3] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#C65373] via-[#D96C8A] to-[#E9A0B3] flex items-center justify-center text-white shadow-md shadow-[#F1DDE3]">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#29242A] tracking-tight">
            Masuk ke Cyber<span className="text-[#D96C8A]">Shield</span>
          </h1>
          <p className="text-xs text-[#766B70]">
            Akses riwayat analisis privat dan wewenang sesuai peran akun Anda.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
            <span>✅</span>
            <span>{successMessage} Mengalihkan...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5F565B] mb-1.5">
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@domain.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1DDE3] bg-[#FCF8F9] text-sm text-[#29242A] focus:outline-none focus:border-[#D96C8A] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5F565B] mb-1.5">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1DDE3] bg-[#FCF8F9] text-sm text-[#29242A] focus:outline-none focus:border-[#D96C8A] focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C65373] to-[#D96C8A] hover:opacity-95 text-white font-bold text-sm shadow-md shadow-[#D96C8A]/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Memverifikasi Kredensial..." : "Masuk"}
          </button>
        </form>

        {/* Akun Uji Coba Cepat (Hanya aktif di lingkungan Development) */}
        {process.env.NODE_ENV !== "production" && (
          <div className="pt-4 border-t border-[#F1DDE3] space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-[#766B70] uppercase tracking-wider">
                Akun Sintetis Uji Coba
              </p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Dev Only
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("user.demo@cybershield.test", "DemoUser#2026!")}
                className="px-2.5 py-2 rounded-xl text-left bg-[#F8E5EB] hover:bg-[#F1DDE3] border border-[#F1DDE3] transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-bold text-[#A64463]">Peran: User</div>
                <div className="text-[10px] text-[#766B70] truncate">user.demo@cybershield.test</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("admin.sec@cybershield.test", "CyberAdmin#Secret2026")}
                className="px-2.5 py-2 rounded-xl text-left bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-bold text-purple-700">Peran: Admin</div>
                <div className="text-[10px] text-[#766B70] truncate">admin.sec@cybershield.test</div>
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-[#766B70]">
          Belum punya akun?{" "}
          <Link href="/register" className="font-bold text-[#D96C8A] hover:underline">
            Daftar di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
