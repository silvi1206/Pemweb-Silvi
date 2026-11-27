"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setIsLoading(false);
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    const res = await registerAction({ name, email, password });
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        router.push("/history");
        router.refresh();
      }, 800);
    } else {
      setErrorMessage(res.message || "Gagal melakukan pendaftaran.");
    }
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
                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.765z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#29242A] tracking-tight">
            Daftar Akun Cyber<span className="text-[#D96C8A]">Shield</span>
          </h1>
          <p className="text-xs text-[#766B70]">
            Buat akun untuk menyimpan hasil analisis dan mengelola indikator keamanan Anda.
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
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1DDE3] bg-[#FCF8F9] text-sm text-[#29242A] focus:outline-none focus:border-[#D96C8A] focus:bg-white transition-all"
            />
          </div>

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
              placeholder="Min. 8 karakter (huruf besar, kecil, angka)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1DDE3] bg-[#FCF8F9] text-sm text-[#29242A] focus:outline-none focus:border-[#D96C8A] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5F565B] mb-1.5">
              Ulangi Kata Sandi
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1DDE3] bg-[#FCF8F9] text-sm text-[#29242A] focus:outline-none focus:border-[#D96C8A] focus:bg-white transition-all"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-700">Ketentuan Kata Sandi Aman:</div>
            <div>• Minimal 8 karakter</div>
            <div>• Mengandung setidaknya 1 huruf besar dan 1 huruf kecil</div>
            <div>• Mengandung setidaknya 1 angka</div>
            <div>• Di-hash aman menggunakan algoritma Scrypt (NIST SP 800-132)</div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C65373] to-[#D96C8A] hover:opacity-95 text-white font-bold text-sm shadow-md shadow-[#D96C8A]/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Memproses Pendaftaran..." : "Daftar Akun"}
          </button>
        </form>

        <div className="text-center text-xs text-[#766B70]">
          Sudah memiliki akun?{" "}
          <Link href="/login" className="font-bold text-[#D96C8A] hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
