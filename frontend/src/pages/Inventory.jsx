import { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import {
  ArrowDownUp,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  MapPin,
  FileText,
  Search,
  CheckCircle2,
  Boxes,
  PlusCircle,
} from "lucide-react";

const empty = { product: "", type: "IN", quantity: "", location: "Main Warehouse", note: "" };

export default function Inventory() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState("ALL"); // ALL, IN, OUT
  const [search, setSearch] = useState("");

  const load = () => {
    Promise.all([api.get("/inventory/transactions"), api.get("/products")])
      .then(([t, p]) => {
        setRows(t.data || []);
        setProducts(p.data || []);
      })
      .catch(() => setError("Could not load inventory ledger. Is the backend running?"));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/inventory/transactions", {
        ...form,
        quantity: Number(form.quantity),
      });
      setForm(empty);
      setError("");
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record movement");
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalIn = useMemo(
    () => rows.filter((r) => r.type === "IN").reduce((sum, r) => sum + Number(r.quantity || 0), 0),
    [rows]
  );
  const totalOut = useMemo(
    () => rows.filter((r) => r.type === "OUT").reduce((sum, r) => sum + Number(r.quantity || 0), 0),
    [rows]
  );
  const netDelta = totalIn - totalOut;

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesType = filterType === "ALL" || r.type === filterType;
      const name = (r.product?.name || r.product || "").toLowerCase();
      const loc = (r.location || "").toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = !q || name.includes(q) || loc.includes(q);
      return matchesType && matchesSearch;
    });
  }, [rows, filterType, search]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">Stock Movements</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Warehouse Ledger
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Audit trail of physical receipts (Stock IN) and order dispatches (Stock OUT) that adjust on-hand inventory levels in real-time.
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Total Stock Received (IN)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-400">+{totalIn} <span className="text-xs text-slate-400 font-normal">units</span></p>
          <p className="text-xs text-slate-400 mt-1">Vendor shipments & receipts</p>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Total Stock Dispatched (OUT)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-amber-400">-{totalOut} <span className="text-xs text-slate-400 font-normal">units</span></p>
          <p className="text-xs text-slate-400 mt-1">Outbound orders & fulfillment</p>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Net Movement Delta</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-white">
            {netDelta >= 0 ? `+${netDelta}` : netDelta} <span className="text-xs text-slate-400 font-normal">units</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Net flow across active period</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Movement Voucher Form */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
        <h2 className="font-display font-semibold text-lg text-white mb-1 flex items-center gap-2">
          <ArrowDownUp className="w-5 h-5 text-indigo-400" />
          Post Inventory Voucher
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Execute physical stock adjustments, receipt PO intake, or write-off issues.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end">
          <div className="lg:col-span-2">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
              Select Product SKU
            </label>
            <select
              name="product"
              value={form.product}
              onChange={handleChange}
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
              Movement Direction
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="input text-xs font-semibold"
            >
              <option value="IN">Stock IN (Receipt)</option>
              <option value="OUT">Stock OUT (Issue)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
              Quantity
            </label>
            <input
              name="quantity"
              type="number"
              min="1"
              placeholder="e.g. 50"
              value={form.quantity}
              onChange={handleChange}
              className="input text-xs"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
              Warehouse Location
            </label>
            <input
              name="location"
              placeholder="e.g. Main Warehouse"
              value={form.location}
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
              <span>{submitting ? "Posting..." : "Post Voucher"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Audit Trail Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-semibold text-lg text-white">Movement Audit Ledger</h2>
            <p className="text-xs text-slate-400 mt-0.5">Immutable record of physical stock transactions.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Toggle */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1 rounded-lg transition-all font-medium ${
                  filterType === "ALL" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All ({rows.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("IN")}
                className={`px-3 py-1 rounded-lg transition-all font-medium ${
                  filterType === "IN" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                IN Receipts
              </button>
              <button
                type="button"
                onClick={() => setFilterType("OUT")}
                className={`px-3 py-1 rounded-lg transition-all font-medium ${
                  filterType === "OUT" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                OUT Issues
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 bg-slate-950/60 uppercase font-mono tracking-wider text-[10px] border-b border-slate-800/80">
              <tr>
                <th className="px-5 py-3.5">Logged At</th>
                <th className="px-5 py-3.5">Product SKU</th>
                <th className="px-5 py-3.5">Movement Type</th>
                <th className="px-5 py-3.5">Quantity</th>
                <th className="px-5 py-3.5">Warehouse Location</th>
                <th className="px-5 py-3.5">Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-500 font-sans">
                    No stock movements matched your criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3.5 text-slate-300">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-sans font-medium text-white">
                      {r.product?.name || r.product}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${
                          r.type === "IN"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {r.type === "IN" ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        Stock {r.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">
                      {r.quantity} units
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 flex items-center gap-1.5 font-sans">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {r.location || "Main Warehouse"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-sans">
                      {r.note || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

