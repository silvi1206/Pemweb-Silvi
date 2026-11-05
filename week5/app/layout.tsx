import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CyberShield — URL Security Analyzer",
    template: "%s | CyberShield",
  },
  description:
    "CyberShield membantu pengguna melakukan pemeriksaan awal terhadap URL mencurigakan dan memberikan risk score serta indikator keamanan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fdfafb] text-slate-900 relative selection:bg-pink-100 selection:text-pink-900">
        {/* Subtle ambient cybersecurity glow */}
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden -z-10"
          aria-hidden="true"
        >
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-pink-100/40 blur-3xl" />
          <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-rose-100/30 blur-3xl" />
        </div>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
