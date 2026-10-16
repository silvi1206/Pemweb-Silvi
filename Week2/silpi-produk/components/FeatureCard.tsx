interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-pink-100/90 shadow-xs hover:border-pink-300 hover:shadow-[0_8px_24px_rgba(236,72,153,0.08)] transition-all">
      <div
        className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100/80 text-pink-600 flex items-center justify-center text-xl mb-3 shadow-2xs"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
