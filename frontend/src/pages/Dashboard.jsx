import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recs, setRecs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/inventory/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Could not reach the backend on port 5000. Start Node, MongoDB, then refresh."));

    api
      .get("/ai/recommend")
      .then((res) => setRecs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRecs([]));
  }, []);

  if (error) {
    return (
      <div className="glass rounded-2xl p-6 text-rose-300">
        {error}
      </div>
    );
  }
  if (!summary) return <p className="text-slate-400">Syncing warehouse signals…</p>;

  const urgent = recs.filter((r) => r.recommendation?.priority === "HIGH" || r.risk?.risk_level === "CRITICAL");

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl">Dashboard </h1>
        <p className="text-slate-400 mt-1">Live inventory health with AI demand and risk overlay.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Products" value={summary.totalProducts} hint="catalog size" tone="indigo" />
        <StatCard
          label="Inventory value"
          value={`Rs. ${Number(summary.totalInventoryValue || 0).toLocaleString()}`}
          hint="on-hand × unit price"
          tone="teal"
        />
        <StatCard label="Low stock" value={summary.lowStockCount} hint="at or below min" tone="amber" />
        <StatCard label="Stockouts" value={summary.outOfStockCount} hint="zero on hand" tone="rose" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <section className="glass rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-lg">Watchlist</h2>
            <Link to="/products" className="text-xs text-teal-300">Manage products →</Link>
          </div>
          {summary.lowStockProducts.length === 0 && summary.outOfStockProducts.length === 0 ? (
            <p className="text-sm text-slate-400">All products sit above their minimums.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {summary.outOfStockProducts.map((p) => (
                <li key={p._id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-rose-300">out of stock</span>
                </li>
              ))}
              {summary.lowStockProducts.map((p) => (
                <li key={p._id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-amber-300">{p.currentStock} / min {p.minStockLevel}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-lg">AI flags</h2>
            <Link to="/recommendations" className="text-xs text-teal-300">Full counsel →</Link>
          </div>
          {urgent.length === 0 ? (
            <p className="text-sm text-slate-400">
              No high-priority reorder flags. Open AI Counsel after seed data is loaded.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {urgent.slice(0, 5).map((item) => (
                <li key={item.product_id} className="flex justify-between gap-3">
                  <span>{item.product_name}</span>
                  <span className="text-rose-300">{item.recommendation?.action?.replaceAll("_", " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
