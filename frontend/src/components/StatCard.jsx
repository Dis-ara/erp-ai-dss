export default function StatCard({ label, value, hint, tone = "teal", badge = null, icon = null }) {
  const glow = {
    teal: "from-teal-400/20 to-transparent border-teal-500/20",
    amber: "from-amber-400/20 to-transparent border-amber-500/20",
    rose: "from-rose-400/25 to-transparent border-rose-500/20",
    indigo: "from-indigo-400/20 to-transparent border-indigo-500/20",
    purple: "from-purple-400/20 to-transparent border-purple-500/20",
    cyan: "from-cyan-400/20 to-transparent border-cyan-500/20",
    emerald: "from-emerald-400/20 to-transparent border-emerald-500/20",
  }[tone] || "from-teal-400/20 to-transparent border-teal-500/20";

  const badgeTone = {
    teal: "bg-teal-400/10 text-teal-300 border-teal-400/30",
    amber: "bg-amber-400/10 text-amber-300 border-amber-400/30",
    rose: "bg-rose-400/15 text-rose-300 border-rose-400/30",
    indigo: "bg-indigo-400/10 text-indigo-300 border-indigo-400/30",
    purple: "bg-purple-400/10 text-purple-300 border-purple-400/30",
  }[tone] || "bg-teal-400/10 text-teal-300 border-teal-400/30";

  return (
    <div className={`glass rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-white/20 group`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${glow} pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-start justify-between relative z-10">
        <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
        {icon && <div className="text-slate-400 group-hover:text-slate-200 transition-colors">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2 mt-2 relative z-10">
        <p className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
        {badge && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeTone}`}>
            {badge}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400 mt-2 relative z-10">{hint}</p>}
    </div>
  );
}
