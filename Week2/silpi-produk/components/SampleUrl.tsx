import type { SampleUrl as SampleUrlType } from "@/types/analysis";

interface SampleUrlProps {
  samples: SampleUrlType[];
  onSelect: (url: string) => void;
}

export default function SampleUrl({ samples, onSelect }: SampleUrlProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500">
        Atau coba salah satu URL sampel:
      </p>
      <div className="flex flex-wrap gap-2">
        {samples.map((sample) => (
          <button
            key={sample.url}
            type="button"
            onClick={() => onSelect(sample.url)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
              sample.type === "safe"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-2xs"
                : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 shadow-2xs"
            }`}
            title={`Analisis URL: ${sample.url}`}
          >
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="font-bold">{sample.type === "safe" ? "✓" : "⚠"}</span>
              {sample.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
