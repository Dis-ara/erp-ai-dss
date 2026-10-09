import { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import {
  ArrowDownUp,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  PlusCircle,
  Clock,
  MapPin,
  FileText,
  Search,
  Filter,
  CheckCircle2,
} from "lucide-react";

const empty = { product: "", type: "IN", quantity: "", location: "Main Warehouse", note: "" };

function TrashIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export default function Inventory() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
      setSuccess("Stock movement posted successfully!");
      setTimeout(() => setSuccess(""), 4000);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record movement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, productName, type, qty) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this ${type} transaction (${productName} - Qty: ${qty})? This will revert the stock balance.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/inventory/transactions/${id}`);
      setError("");
      setSuccess(`Movement deleted and stock balance updated.`);
      setTimeout(() => setSuccess(""), 4000);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete movement");
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

      {success && (
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300">
          {success}
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
              Product SKU
            </label>
            <select
              name="product"
              value={form.product}
              onChange={handleChange}
              className="input text-xs"
              required
            >
              <option value="">Select SKU Target</option>
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
              className="input text-xs"
            >
              <option value="IN">Stock IN (+ Intake)</option>
              <option value="OUT">Stock OUT (- Dispatch)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
              Voucher Quantity
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
              Storage Bay / Bin
            </label>
            <input
              name="location"
              placeholder="e.g. Rack B-12"
              value={form.location}
              onChange={handleChange}
              className="input text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
              Audit Note
            </label>
            <input
              name="note"
              placeholder="e.g. PO #10842 receipt"
              value={form.note}
              onChange={handleChange}
              className="input text-xs"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submitting ? "Posting Voucher..." : "Commit Warehouse Voucher"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Movements Audit Trail Table */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display font-semibold text-lg text-white">Warehouse Transaction Ledger</h2>
            <p className="text-xs text-slate-400">Complete historical journal of all inbound and outbound movements.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Filter Pills */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              {["ALL", "IN", "OUT"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                    filterType === t
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search ledger..."
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
                <th className="px-5 py-3.5">Logged Timestamp</th>
                <th className="px-5 py-3.5">Target SKU</th>
                <th className="px-5 py-3.5">Direction</th>
                <th className="px-5 py-3.5">Volume</th>
                <th className="px-5 py-3.5">Warehouse Location</th>
                <th className="px-5 py-3.5">Reference Note</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-500 font-sans">
                    No transaction entries matched current filter parameters.
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
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.type === "IN"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {r.type === "IN" ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
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
                    <td className="px-5 py-3.5 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => handleDelete(r._id, r.product?.name || "Product", r.type, r.quantity)}
                        title="Delete stock movement"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition inline-flex items-center justify-center"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
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
