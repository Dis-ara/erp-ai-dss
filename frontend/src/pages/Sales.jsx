import { useEffect, useState } from "react";
import api from "../api/client";

const empty = { product: "", quantitySold: "", sellingPrice: "", date: "", season: "Normal" };

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

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    Promise.all([api.get("/sales"), api.get("/products")])
      .then(([s, p]) => {
        setSales(s.data);
        setProducts(p.data);
      })
      .catch(() => setError("Could not load sales. Is the backend running?"));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/sales", {
        ...form,
        quantitySold: Number(form.quantitySold),
        sellingPrice: Number(form.sellingPrice),
        date: form.date || new Date().toISOString(),
      });
      setForm(empty);
      setError("");
      setSuccess("Sale recorded successfully!");
      setTimeout(() => setSuccess(""), 4000);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record sale");
    }
  };

  const handleDelete = async (id, productName, qty) => {
    if (!window.confirm(`Are you sure you want to delete this sale record (${productName} - Qty: ${qty})? This will restore the quantity back to the product stock.`)) {
      return;
    }
    try {
      await api.delete(`/sales/${id}`);
      setError("");
      setSuccess(`Sale record deleted and product stock restored. AI forecast updated.`);
      setTimeout(() => setSuccess(""), 4000);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete sale");
    }
  };

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Sales pulse</h1>
      <p className="text-slate-400 mb-6">Each sale reduces on-hand stock and becomes training history for demand forecast.</p>
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
        <input name="quantitySold" type="number" placeholder="Qty sold" value={form.quantitySold} onChange={handleChange} className="input" required />
        <input name="sellingPrice" type="number" placeholder="Selling price" value={form.sellingPrice} onChange={handleChange} className="input" required />
        <input name="date" type="date" value={form.date} onChange={handleChange} className="input" />
        <select name="season" value={form.season} onChange={handleChange} className="input">
          <option>Normal</option>
          <option>Festive</option>
          <option>Q1</option>
          <option>Q2</option>
          <option>Q3</option>
          <option>Q4</option>
        </select>
        <button className="btn-primary">Record sale</button>
      </form>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400 bg-white/5">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Season</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s._id} className="border-t border-white/10 hover:bg-white/[0.02] transition">
                <td className="px-4 py-3">{s.date ? new Date(s.date).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 font-medium">{s.product?.name || s.product}</td>
                <td className="px-4 py-3">{s.quantitySold}</td>
                <td className="px-4 py-3">Rs. {s.sellingPrice}</td>
                <td className="px-4 py-3 text-slate-400">{s.season || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(s._id, s.product?.name || "Product", s.quantitySold)}
                    title="Delete sale record"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition inline-flex items-center justify-center"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No sales recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

