import { useEffect, useState } from "react";
import api from "../api/client";

const empty = { product: "", quantitySold: "", sellingPrice: "", date: "", season: "Normal" };

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

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
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record sale");
    }
  };

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Sales pulse</h1>
      <p className="text-slate-400 mb-6">Each sale reduces on-hand stock and becomes training history for demand forecast.</p>
      {error && <p className="text-rose-300 mb-3">{error}</p>}

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
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s._id} className="border-t border-white/10">
                <td className="px-4 py-3">{s.date ? new Date(s.date).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">{s.product?.name || s.product}</td>
                <td className="px-4 py-3">{s.quantitySold}</td>
                <td className="px-4 py-3">Rs. {s.sellingPrice}</td>
                <td className="px-4 py-3 text-slate-400">{s.season || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
