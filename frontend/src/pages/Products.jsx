import { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import {
  Package,
  PlusCircle,
  AlertTriangle,
  Building2,
  Boxes,
  Search,
  Tag,
  CheckCircle2,
} from "lucide-react";

const emptyForm = {
  name: "",
  category: "General",
  unitPrice: "",
  minStockLevel: "10",
  maxStockLevel: "100",
  currentStock: "0",
  supplier: "",
};

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

export default function Products() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const load = () => {
    Promise.all([api.get("/products"), api.get("/suppliers")])
      .then(([p, s]) => {
        setProducts(p.data || []);
        setSuppliers(s.data || []);
      })
      .catch(() => setError("Could not load products. Ensure the backend server is running."));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/products", {
        ...form,
        unitPrice: Number(form.unitPrice),
        minStockLevel: Number(form.minStockLevel),
        maxStockLevel: Number(form.maxStockLevel),
        currentStock: Number(form.currentStock),
        supplier: form.supplier || undefined,
      });
      setForm(emptyForm);
      setError("");
      setShowAddForm(false);
      setSuccess("Product added successfully!");
      setTimeout(() => setSuccess(""), 4000);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create product SKU");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"? This will also remove associated sales and stock movements.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/products/${id}`);
      setError("");
      setSuccess(`Product "${name}" deleted. AI recommendations updated.`);
      setTimeout(() => setSuccess(""), 4000);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete product");
    }
  };

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      const sup = (p.supplier?.name || "").toLowerCase();
      return name.includes(q) || cat.includes(q) || sup.includes(q);
    });
  }, [products, search]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">Product Master</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {products.length} Registered SKUs
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Central repository of catalog items, safety thresholds (min/max), unit valuation, and assigned vendor supply paths.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary text-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showAddForm ? "Hide SKU Form" : "Register New SKU"}</span>
        </button>
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

      {/* Add Product Form */}
      {showAddForm && (
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden animate-fadeIn">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />
          <h2 className="font-display font-semibold text-lg text-white mb-1 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-400" />
            Register Catalog SKU
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Configure unit costs, minimum buffer constraints, and default vendor delivery channels.
          </p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                SKU Name
              </label>
              <input
                name="name"
                placeholder="e.g. Wireless Ergonomic Mouse"
                value={form.name}
                onChange={handleChange}
                className="input text-xs"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                Category
              </label>
              <input
                name="category"
                placeholder="e.g. Peripherals"
                value={form.category}
                onChange={handleChange}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                Unit Valuation (Rs.)
              </label>
              <input
                name="unitPrice"
                type="number"
                min="0"
                placeholder="e.g. 4500"
                value={form.unitPrice}
                onChange={handleChange}
                className="input text-xs"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                Initial On-Hand Quantity
              </label>
              <input
                name="currentStock"
                type="number"
                min="0"
                placeholder="e.g. 50"
                value={form.currentStock}
                onChange={handleChange}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                Min Safety Buffer
              </label>
              <input
                name="minStockLevel"
                type="number"
                min="0"
                placeholder="e.g. 15"
                value={form.minStockLevel}
                onChange={handleChange}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                Max Stock Ceiling
              </label>
              <input
                name="maxStockLevel"
                type="number"
                min="0"
                placeholder="e.g. 250"
                value={form.maxStockLevel}
                onChange={handleChange}
                className="input text-xs"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                Assigned Logistics Vendor
              </label>
              <select
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                className="input text-xs"
              >
                <option value="">Unassigned (Self-sourced)</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} (SLA: {s.leadTimeDays}d lead, {s.deliveryPerformance}% reliability)
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? "Registering SKU..." : "Confirm & Save Product SKU"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table Card */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display font-semibold text-lg text-white">Catalog Inventory Matrix</h2>
            <p className="text-xs text-slate-400">Policy thresholds dictate automated replenishment alert triggers.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search SKUs or vendors..."
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
                <th className="px-5 py-3.5">SKU Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Unit Price</th>
                <th className="px-5 py-3.5">On-Hand Stock</th>
                <th className="px-5 py-3.5">Stock Capacity Bar</th>
                <th className="px-5 py-3.5">Policy (Min/Max)</th>
                <th className="px-5 py-3.5">Assigned Supplier</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-500 font-sans">
                    No products found matching query.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const maxCap = p.maxStockLevel || 100;
                  const ratio = Math.min((p.currentStock / maxCap) * 100, 100);
                  const isLow = p.currentStock <= p.minStockLevel;
                  const isOut = p.currentStock === 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-3.5 font-sans font-semibold text-white">
                        {p.name}
                      </td>
                      <td className="px-5 py-3.5 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-200">
                        Rs. {Number(p.unitPrice).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-bold">
                        <span
                          className={`${
                            isOut ? "text-rose-400" : isLow ? "text-amber-400" : "text-white"
                          }`}
                        >
                          {p.currentStock} units
                        </span>
                      </td>
                      <td className="px-5 py-3.5 w-40">
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${ratio}%` }}
                            className={`h-full rounded-full transition-all ${
                              isOut
                                ? "bg-rose-500"
                                : isLow
                                ? "bg-amber-400"
                                : "bg-gradient-to-r from-teal-500 to-emerald-400"
                            }`}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {p.minStockLevel} / {p.maxStockLevel}
                      </td>
                      <td className="px-5 py-3.5 font-sans text-slate-300 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {p.supplier?.name || "Unassigned"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => handleDelete(p._id, p.name)}
                          title="Delete product"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition inline-flex items-center justify-center"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
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
