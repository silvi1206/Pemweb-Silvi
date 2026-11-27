interface RiskScoreProps {
  score: number;
  isSafe: boolean;
}

export default function RiskScore({ score, isSafe }: RiskScoreProps) {
  const label = isSafe ? "Aman" : score >= 70 ? "Bahaya Tinggi" : "Mencurigakan";
  const colorClass = isSafe
    ? "text-emerald-700"
    : score >= 70
      ? "text-rose-700"
      : "text-amber-800";
  const barColor = isSafe
    ? "bg-emerald-500"
    : score >= 70
      ? "bg-rose-500"
      : "bg-amber-500";
  const bgColor = isSafe
    ? "bg-emerald-50/80 border-emerald-200 shadow-2xs"
    : score >= 70
      ? "bg-rose-50/80 border-rose-200 shadow-2xs"
      : "bg-amber-50/80 border-amber-200 shadow-2xs";

  return (
    <div
      className={`flex items-center gap-3 p-3 px-4 rounded-2xl border ${bgColor}`}
      role="status"
      aria-label={`Risk score: ${score} persen, status: ${label}`}
    >
      <div className="text-right">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Risk Score
        </span>
        <span className={`text-2xl font-black ${colorClass}`}>{score}%</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="w-16 h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={`text-[10px] font-bold ${colorClass}`}>{label}</span>
      </div>
    </div>
  );
}
