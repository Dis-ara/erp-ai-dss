import { useEffect, useState } from "react";
import api from "../api/client";

const empty = { product: "", type: "IN", quantity: "", location: "Main Warehouse", note: "" };

export default function Inventory() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

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
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record movement");
    }
  };

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Stock moves</h1>
      <p className="text-slate-400 mb-6">IN receipts and OUT issues update current stock immediately.</p>
      {error && <p className="text-rose-300 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 mb-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        <select name="product" value={form.product} onChange={handleChange} className="input" required>
          <option value="">Select product</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
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
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-t border-white/10">
                <td className="px-4 py-3">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                <td className="px-4 py-3">{r.product?.name || r.product}</td>
                <td className={`px-4 py-3 ${r.type === "IN" ? "text-teal-300" : "text-amber-300"}`}>{r.type}</td>
                <td className="px-4 py-3">{r.quantity}</td>
                <td className="px-4 py-3 text-slate-400">{r.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
