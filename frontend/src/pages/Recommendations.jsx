import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import {
  BrainCircuit,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ChevronRight,
  Boxes,
} from "lucide-react";

const priorityStyles = {
  CRITICAL: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  LOW: "bg-teal-500/10 text-teal-400 border-teal-500/20",
};

const riskBadge = {
  CRITICAL: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  HIGH: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  LOW: "bg-teal-500/15 text-teal-400 border-teal-500/30",
};

function SparkBars({ history = [] }) {
  const max = Math.max(...history, 1);
  return (
    <div className="pt-2">
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
        <span>Demand Trajectory History</span>
        <span>Peak: {max} units</span>
      </div>
      <div className="flex items-end gap-1.5 h-14 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
        {history.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-gradient-to-t from-teal-500/40 via-cyan-400/70 to-teal-300 hover:brightness-125 transition-all group relative cursor-pointer"
            style={{ height: `${Math.max((v / max) * 100, 10)}%` }}
          >
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-[10px] font-mono px-1.5 py-0.5 rounded text-white pointer-events-none z-20">
              {v}
            </div>
          </div>
        ))}
      </div>
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
      .then((res) => setData(res.data || []))
      .catch((err) =>
        setError(
          err.response?.data?.error ||
            "Could not load AI recommendations. Ensure Python AI service (port 8000) and Node backend (port 5000) are active."
        )
      )
      .finally(() => setLoading(false));
  };

  useEffect(run, []);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto animate-pulse">
          <BrainCircuit className="w-7 h-7" />
        </div>
        <p className="font-display font-semibold text-lg text-white">Synthesizing Machine Learning Pipeline...</p>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Computing linear regression demand trends, evaluating Random Forest feature model, and fuzzifying risk surfaces.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 border border-rose-500/30 text-center max-w-xl mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="font-display font-bold text-xl text-white mb-2">Advisory Service Unavailable</h2>
        <p className="text-xs text-slate-300 mb-6 leading-relaxed">{error}</p>
        <button onClick={run} className="btn-primary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Pipeline
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">AI Replenishment Advisory</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-teal-400" />
              Continuous Synthesis
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Algorithmic decision recommendations synthesized across empirical historical sales velocity, supplier lead time constraints, and Mamdani fuzzy stockout surfaces.
          </p>
        </div>

        <button
          onClick={run}
          className="btn-primary text-xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Re-Run AI Synthesis</span>
        </button>
      </div>

      {/* Advisory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data && data.length > 0 ? (
          data.map((item) => {
            if (item.error) {
              return (
                <div key={item.product_id} className="glass-card rounded-2xl p-6 border border-rose-500/30">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{item.product_name || item.product_id}</span>
                  </div>
                  <p className="text-xs text-slate-300">{item.error}</p>
                </div>
              );
            }

            const priority = item.recommendation?.priority || "LOW";
            const riskLvl = item.risk?.risk_level || "LOW";
            const riskScr = item.risk?.risk_score ?? "—";
            const actionText = (item.recommendation?.action || item.recommendation?.recommendation || "").replaceAll("_", " ");
            const reorderQty = item.recommendation?.recommended_quantity ?? 0;

            return (
              <article
                key={item.product_id}
                className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group"
              >
                {/* Top Hairline Accent */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />

                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div>
                      <h2 className="font-display font-bold text-xl text-white tracking-tight">{item.product_name}</h2>
                      <span className="text-[11px] font-mono text-slate-400">SKU #{item.product_id.slice(-6)}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                        priorityStyles[priority] || priorityStyles.LOW
                      }`}
                    >
                      {priority} Priority
                    </span>
                  </div>

                  {/* 3-Metric Tiles */}
                  <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">On-Hand</span>
                      <span className="text-sm font-mono font-bold text-white mt-0.5 block">{item.current_stock} units</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Forecasted</span>
                      <span className="text-sm font-mono font-bold text-teal-400 mt-0.5 block">
                        {item.forecast?.predicted_demand} units
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Fuzzy Risk</span>
                      <span
                        className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                          riskBadge[riskLvl] || riskBadge.LOW
                        }`}
                      >
                        {riskLvl} ({riskScr})
                      </span>
                    </div>
                  </div>

                  {/* Trajectory SparkBars */}
                  {item.forecast?.history?.length > 0 && <SparkBars history={item.forecast.history} />}
                </div>

                {/* Footer Action & Rationale */}
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Advisory Stance</span>
                      <span className="text-sm font-bold text-white">{actionText}</span>
                    </div>

                    {reorderQty > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 font-mono font-bold text-xs border border-teal-500/20">
                        Order +{reorderQty} units
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {item.recommendation?.reason || "Stock covers estimated lead-time demand."}
                  </p>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-[10px] font-mono text-slate-500">
                      Method: {item.forecast?.method || "linear_regression"}
                    </span>

                    <Link
                      to="/inventory"
                      className="btn-secondary text-xs px-3 py-1.5 group/btn"
                    >
                      <span>Post Stock Voucher</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-2 glass-card rounded-2xl p-12 text-center text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No Advisory Recommendations Available</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Please ensure products exist in the catalog and have historical sales entries under "Sales Pulse" to trigger demand forecasting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

