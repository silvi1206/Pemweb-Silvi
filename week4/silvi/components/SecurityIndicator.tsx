interface SecurityIndicatorProps {
  title: string;
  status: string;
  isAlert: boolean;
  detail: string;
}

const getIcon = (title: string) => {
  if (title.includes("Protokol")) return "🔒";
  if (title.includes("Domain")) return "🌐";
  if (title.includes("Sosial")) return "🎣";
  if (title.includes("Berkas")) return "📦";
  return "🛡️";
};

export default function SecurityIndicator({
  title,
  status,
  isAlert,
  detail,
}: SecurityIndicatorProps) {
  const icon = getIcon(title);

  return (
    <div className="bg-white p-4 rounded-2xl border border-pink-100/90 shadow-2xs hover:border-pink-200 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span aria-hidden="true">{icon}</span>
          {title}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isAlert
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{detail}</p>
    </div>
  );
}
