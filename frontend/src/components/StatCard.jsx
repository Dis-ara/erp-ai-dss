export default function StatCard({ label, value, hint, tone = "teal", badge = null, icon = null }) {
  const tones = {
    teal: {
      bg: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      accent: "from-teal-500/20 to-transparent",
      topLine: "via-teal-400/40",
      iconBg: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    },
    amber: {
      bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      accent: "from-amber-500/20 to-transparent",
      topLine: "via-amber-400/40",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    rose: {
      bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      accent: "from-rose-500/20 to-transparent",
      topLine: "via-rose-400/40",
      iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    indigo: {
      bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      accent: "from-indigo-500/20 to-transparent",
      topLine: "via-indigo-400/40",
      iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
    emerald: {
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      accent: "from-emerald-500/20 to-transparent",
      topLine: "via-emerald-400/40",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    cyan: {
      bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      accent: "from-cyan-500/20 to-transparent",
      topLine: "via-cyan-400/40",
      iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
  }[tone] || {
    bg: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    accent: "from-teal-500/20 to-transparent",
    topLine: "via-teal-400/40",
    iconBg: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
      {/* Top Hairline Accent */}
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${tones.topLine} to-transparent`} />
      
      {/* Subtle corner radial */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tones.accent} rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity`} />

      <div className="flex items-center justify-between relative z-10 mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">{label}</span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${tones.iconBg} transition-transform group-hover:scale-110 duration-200`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 relative z-10">
        <p className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">{value}</p>
        {badge && (
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${tones.bg}`}>
            {badge}
          </span>
        )}
      </div>

      {hint && <p className="text-xs text-slate-400 mt-2.5 relative z-10">{hint}</p>}
    </div>
  );
}

