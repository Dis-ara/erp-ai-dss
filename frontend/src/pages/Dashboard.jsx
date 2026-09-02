import { useEffect, useState } from "react";
import api from "../api/client";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/inventory/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Could not load inventory summary. Is the backend running?"));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!summary) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Inventory Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Products" value={summary.totalProducts} />
        <StatCard
          label="Total Inventory Value"
          value={`Rs. ${summary.totalInventoryValue.toLocaleString()}`}
        />
        <StatCard
          label="Low Stock Products"
          value={summary.lowStockCount}
          accent="text-amber-600"
        />
        <StatCard
          label="Out of Stock Products"
          value={summary.outOfStockCount}
          accent="text-red-600"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold mb-3">Low Stock Products</h2>
          {summary.lowStockProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">None right now.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {summary.lowStockProducts.map((p) => (
                <li key={p._id}>
                  {p.name} — {p.currentStock} units (min {p.minStockLevel})
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold mb-3">Out of Stock Products</h2>
          {summary.outOfStockProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">None right now.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {summary.outOfStockProducts.map((p) => (
                <li key={p._id}>{p.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
