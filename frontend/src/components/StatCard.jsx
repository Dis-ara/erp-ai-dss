export default function StatCard({ label, value, accent = "text-slate-800" }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}
