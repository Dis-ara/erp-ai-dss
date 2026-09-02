import { useEffect, useState } from "react";
import api from "../api/client";

const emptyForm = {
  name: "",
  category: "",
  unitPrice: "",
  minStockLevel: "",
  maxStockLevel: "",
  currentStock: "",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const loadProducts = () => {
    api
      .get("/products")
      .then((res) => setProducts(res.data))
      .catch(() => setError("Could not load products. Is the backend running?"));
  };

  useEffect(loadProducts, []);

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
      });
      setForm(emptyForm);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create product");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Products</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-5 mb-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} className="border rounded px-3 py-2" required />
        <input name="category" placeholder="Category" value={form.category} onChange={handleChange} className="border rounded px-3 py-2" required />
        <input name="unitPrice" type="number" placeholder="Unit Price" value={form.unitPrice} onChange={handleChange} className="border rounded px-3 py-2" required />
        <input name="minStockLevel" type="number" placeholder="Min Stock Level" value={form.minStockLevel} onChange={handleChange} className="border rounded px-3 py-2" required />
        <input name="maxStockLevel" type="number" placeholder="Max Stock Level" value={form.maxStockLevel} onChange={handleChange} className="border rounded px-3 py-2" required />
        <input name="currentStock" type="number" placeholder="Current Stock" value={form.currentStock} onChange={handleChange} className="border rounded px-3 py-2" required />
        <button className="col-span-2 md:col-span-3 bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700">
          Add Product
        </button>
      </form>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Unit Price</th>
              <th className="px-4 py-2">Current Stock</th>
              <th className="px-4 py-2">Min / Max</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.category}</td>
                <td className="px-4 py-2">Rs. {p.unitPrice}</td>
                <td className="px-4 py-2">{p.currentStock}</td>
                <td className="px-4 py-2">{p.minStockLevel} / {p.maxStockLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
