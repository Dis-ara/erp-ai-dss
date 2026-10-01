import { useEffect, useState } from "react";
import api from "../api/client";

const emptyForm = {
  name: "",
  category: "",
  unitPrice: "",
  minStockLevel: "",
  maxStockLevel: "",
  currentStock: "",
  supplier: "",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = () => {
    Promise.all([api.get("/products"), api.get("/suppliers")])
      .then(([p, s]) => {
        setProducts(p.data);
        setSuppliers(s.data);
      })
      .catch(() => setError("Could not load products. Is the backend running?"));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create product");
    }
  };

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Products</h1>
      <p className="text-slate-400 mb-6">Catalog products, bind a supplier, and keep min/max policy in one place.</p>
      {error && <p className="text-rose-300 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 mb-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} className="input" required />
        <input name="category" placeholder="Category" value={form.category} onChange={handleChange} className="input" required />
        <input name="unitPrice" type="number" placeholder="Unit price" value={form.unitPrice} onChange={handleChange} className="input" required />
        <input name="minStockLevel" type="number" placeholder="Min stock" value={form.minStockLevel} onChange={handleChange} className="input" required />
        <input name="maxStockLevel" type="number" placeholder="Max stock" value={form.maxStockLevel} onChange={handleChange} className="input" required />
        <input name="currentStock" type="number" placeholder="Current stock" value={form.currentStock} onChange={handleChange} className="input" required />
        <select name="supplier" value={form.supplier} onChange={handleChange} className="input col-span-2 md:col-span-3">
          <option value="">No supplier linked</option>
          {suppliers.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} · {s.leadTimeDays}d lead
            </option>
          ))}
        </select>
        <button className="btn-primary col-span-2 md:col-span-3">Add product</button>
      </form>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400 bg-white/5">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Policy</th>
              <th className="px-4 py-3">Supplier</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-slate-400">{p.category}</td>
                <td className="px-4 py-3">Rs. {p.unitPrice}</td>
                <td className="px-4 py-3">{p.currentStock}</td>
                <td className="px-4 py-3 text-slate-400">{p.minStockLevel} / {p.maxStockLevel}</td>
                <td className="px-4 py-3 text-slate-400">{p.supplier?.name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
