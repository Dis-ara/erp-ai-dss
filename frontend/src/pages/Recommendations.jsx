import { useEffect, useState } from "react";
import api from "../api/client";

const priorityColor = {
  HIGH: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  MEDIUM: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  LOW: "bg-teal-500/20 text-teal-200 border-teal-400/30",
  CRITICAL: "bg-rose-500/30 text-rose-100 border-rose-400/40",
};

const riskColor = {
  CRITICAL: "bg-rose-600 text-white",
  HIGH: "bg-rose-500/20 text-rose-200",
  MEDIUM: "bg-amber-500/20 text-amber-200",
  LOW: "bg-teal-500/20 text-teal-200",
};

function SparkBars({ history = [] }) {
  const max = Math.max(...history, 1);
  return (
    <div className="flex items-end gap-1 h-12 mt-3">
      {history.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-gradient-to-t from-indigo-500 to-teal-300"
          style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
          title={String(v)}
        />
      ))}
    </div>
  );
}

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const run = () => {
    setLoading(true);
    setError("");
    api
      .get("/ai/recommend")
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(
          err.response?.data?.error ||
            "Could not load AI recommendations. Start MongoDB, the Node backend (5000), and the Python AI service (8000)."
        )
      )
      .finally(() => setLoading(false));
  };

  useEffect(run, []);

  if (loading) return <p className="text-slate-400">Running forecast → fuzzy risk → rules…</p>;
  if (error) return <p className="text-rose-300">{error}</p>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-4xl">AI Recommendations</h1>
      
        </div>
        <button onClick={run} className="btn-primary">Re-run pipeline</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {data.map((item) =>
          item.error ? (
            <div key={item.product_id} className="glass rounded-2xl p-5 text-rose-300 text-sm">
              {item.product_name || item.product_id}: {item.error}
            </div>
          ) : (
            <article key={item.product_id} className="glass rounded-2xl p-5">
              <div className="flex justify-between items-start mb-3 gap-3">
                <h2 className="font-display text-xl">{item.product_name}</h2>
                <span className={`text-[11px] px-2 py-1 rounded-full border font-medium ${priorityColor[item.recommendation.priority] || priorityColor.LOW}`}>
                  {item.recommendation.priority} priority
                </span>
              </div>
              <div className="text-sm space-y-1 text-slate-300">
                <p>On hand <span className="text-white font-medium">{item.current_stock}</span></p>
                <p>
                  Predicted demand{" "}
                  <span className="text-white font-medium">{item.forecast.predicted_demand}</span>
                  <span className="text-slate-500"> · {item.forecast.method}</span>
                </p>
                <p>
                  Risk{" "}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskColor[item.risk.risk_level]}`}>
                    {item.risk.risk_level} ({item.risk.risk_score})
                  </span>
                </p>
              </div>
              {item.forecast.history?.length > 0 && <SparkBars history={item.forecast.history} />}
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="font-medium">
                  Action{" "}
                  <span className="text-teal-300">
                    {(item.recommendation.action || item.recommendation.recommendation || "").replaceAll("_", " ")}
                  </span>
                </p>
                {item.recommendation.recommended_quantity > 0 && (
                  <p className="text-sm text-slate-300 mt-1">
                    Suggested qty: {item.recommendation.recommended_quantity} units
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2">{item.recommendation.reason}</p>
              </div>
            </article>
          )
        )}
        {data.length === 0 && (
          <p className="text-slate-400">
            No recommendations yet. Run <code>npm run seed</code> in backend, or record sales against products.
          </p>
        )}
      </div>
    </div>
  );
}
