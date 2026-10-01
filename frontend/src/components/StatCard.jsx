export default function StatCard({ label, value, hint, tone = "teal" }) {
  const glow = {
    teal: "from-teal-400/20 to-transparent",
    amber: "from-amber-400/20 to-transparent",
    rose: "from-rose-400/25 to-transparent",
    indigo: "from-indigo-400/20 to-transparent",
  }[tone];

  return (
    <div className={`glass rounded-2xl p-5 relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${glow} pointer-events-none`} />
      <p className="text-xs uppercase tracking-widest text-slate-400 relative">{label}</p>
      <p className="text-3xl font-semibold mt-2 relative tabular-nums tracking-tight">{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-2 relative">{hint}</p>}
    </div>
  );
}
