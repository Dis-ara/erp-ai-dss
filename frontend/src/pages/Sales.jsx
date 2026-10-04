import { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import {
  TrendingUp,
  DollarSign,
  Package,
  PlusCircle,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

const empty = { product: "", quantitySold: "", sellingPrice: "", date: "", season: "Normal" };

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    Promise.all([api.get("/sales"), api.get("/products")])
      .then(([s, p]) => {
        setSales(s.data || []);
        setProducts(p.data || []);
      })
      .catch(() => setError("Could not load sales ledger. Ensure backend is running."));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Auto-fill selling price when product is selected
  const handleProductSelect = (e) => {
    const prodId = e.target.value;
    const selected = products.find((p) => p._id === prodId);
    setForm({
      ...form,
      product: prodId,
      sellingPrice: selected ? selected.unitPrice : form.sellingPrice,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/sales", {
        ...form,
        quantitySold: Number(form.quantitySold),
        sellingPrice: Number(form.sellingPrice),
        date: form.date || new Date().toISOString(),
      });
      setForm(empty);
      setError("");
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record sale");
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalVolume = useMemo(() => sales.reduce((sum, s) => sum + Number(s.quantitySold || 0), 0), [sales]);
  const grossTurnover = useMemo(
    () => sales.reduce((sum, s) => sum + Number(s.quantitySold || 0) * Number(s.sellingPrice || 0), 0),
    [sales]
  );
  const avgOrderValue = sales.length > 0 ? Math.round(grossTurnover / sales.length) : 0;

  // Filtered sales
  const filteredSales = useMemo(() => {
    if (!search.trim()) return sales;
    const q = search.toLowerCase();
    return sales.filter((s) => {
      const name = (s.product?.name || s.product || "").toLowerCase();
      const season = (s.season || "").toLowerCase();
      return name.includes(q) || season.includes(q);
    });
  }, [sales, search]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">Sales Pulse Ledger</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Demand Training Feed
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Each logged outflow automatically deducts physical warehouse stock and updates chronological demand vectors for the regression forecasting pipeline.
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Total Volume Sold</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{totalVolume} <span className="text-xs text-slate-400 font-normal">units</span></p>
          <p className="text-xs text-slate-400 mt-1">{sales.length} logged transactions</p>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Realized Gross Turnover</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-teal-400">Rs. {grossTurnover.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Cash and credit receipts</p>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Average Order Value</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-white">Rs. {avgOrderValue.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Per transaction ticket</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Record Sale Form */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />
        <h2 className="font-display font-semibold text-lg text-white mb-1 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-teal-400" />
          Log Outflow Transaction
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Record customer sale to instantly decrement inventory and update time-series demand models.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end">
          <div className="lg:col-span-2">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
              Select Product SKU
            </label>
            <select
              name="product"
              value={form.product}
              onChange={handleProductSelect}
              className="input text-xs"
              required
            >
              <option value="">Select target product...</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.currentStock} in stock)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
              Quantity Sold
            </label>
            <input
              name="quantitySold"
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={form.quantitySold}
              onChange={handleChange}
              className="input text-xs"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
              Unit Price (Rs.)
            </label>
            <input
              name="sellingPrice"
              type="number"
              min="0"
              placeholder="Price"
              value={form.sellingPrice}
              onChange={handleChange}
              className="input text-xs"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
              Sale Date
            </label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="input text-xs"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full h-[42px] text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submitting ? "Posting..." : "Record Outflow"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sales History Ledger */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-semibold text-lg text-white">Transaction History</h2>
            <p className="text-xs text-slate-400 mt-0.5">Audit ledger of verified stock decrement records.</p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 py-2 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 bg-slate-950/60 uppercase font-mono tracking-wider text-[10px] border-b border-slate-800/80">
              <tr>
                <th className="px-5 py-3.5">Execution Date</th>
                <th className="px-5 py-3.5">Product SKU</th>
                <th className="px-5 py-3.5">Volume Sold</th>
                <th className="px-5 py-3.5">Selling Price</th>
                <th className="px-5 py-3.5">Total Value</th>
                <th className="px-5 py-3.5">Cycle Season</th>
                <th className="px-5 py-3.5">Ledger Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-500 font-sans">
                    No transactions matched your criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const lineTotal = Number(s.quantitySold || 0) * Number(s.sellingPrice || 0);
                  return (
                    <tr key={s._id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-3.5 text-slate-300">
                        {s.date ? new Date(s.date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3.5 font-sans font-medium text-white">
                        {s.product?.name || s.product}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 font-bold text-teal-300 border border-slate-700">
                          {s.quantitySold} units
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        Rs. {Number(s.sellingPrice).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-white">
                        Rs. {lineTotal.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800/60 text-slate-400 border border-slate-700/60">
                          {s.season || "Normal"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-sans">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Stock Deducted
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

