import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-white/80 backdrop-blur-xs border-t border-pink-100 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-pink-600 via-pink-500 to-rose-400 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            CS
          </div>
          <span className="text-sm font-bold text-slate-800">
            CyberShield &copy; {new Date().getFullYear()}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">• URL Security Prototype</span>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
            <li>
              <Link
                href="/"
                className="hover:text-pink-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/analyze"
                className="hover:text-pink-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded"
              >
                Analyze URL
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="hover:text-pink-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/latihan-routing"
                className="hover:text-pink-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded"
              >
                Latihan
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
