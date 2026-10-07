import { useEffect, useState } from "react";
import api from "../api/client";

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

  const load = () => {
    Promise.all([api.get("/inventory/transactions"), api.get("/products")])
      .then(([t, p]) => {
        setRows(t.data);
        setProducts(p.data);
      })
      .catch(() => setError("Could not load inventory. Is the backend running?"));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    }
  };

  const handleDelete = async (id, productName, type, qty) => {
    if (!window.confirm(`Are you sure you want to delete this ${type} transaction (${productName} - Qty: ${qty})? This will revert the stock balance.`)) {
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

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Stock moves</h1>
      <p className="text-slate-400 mb-6">IN receipts and OUT issues update current stock immediately.</p>
      {error && <p className="text-rose-300 mb-3 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl text-sm">{error}</p>}
      {success && <p className="text-teal-300 mb-3 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-xl text-sm">{success}</p>}

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 mb-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        <select name="product" value={form.product} onChange={handleChange} className="input" required>
          <option value="">Select product</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.currentStock} in stock)
            </option>
          ))}
        </select>
        <select name="type" value={form.type} onChange={handleChange} className="input">
          <option value="IN">Stock IN</option>
          <option value="OUT">Stock OUT</option>
        </select>
        <input name="quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={handleChange} className="input" required />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} className="input" />
        <input name="note" placeholder="Note" value={form.note} onChange={handleChange} className="input" />
        <button className="btn-primary">Post movement</button>
      </form>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400 bg-white/5">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-t border-white/10 hover:bg-white/[0.02] transition">
                <td className="px-4 py-3">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                <td className="px-4 py-3 font-medium">{r.product?.name || r.product}</td>
                <td className={`px-4 py-3 font-medium ${r.type === "IN" ? "text-teal-300" : "text-amber-300"}`}>{r.type}</td>
                <td className="px-4 py-3">{r.quantity}</td>
                <td className="px-4 py-3 text-slate-400">{r.location}</td>
                <td className="px-4 py-3 text-right">
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
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No stock movements recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

