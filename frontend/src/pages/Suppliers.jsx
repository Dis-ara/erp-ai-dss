import { useEffect, useState } from "react";
import api from "../api/client";

const emptyForm = { name: "", leadTimeDays: "", deliveryPerformance: "", productAvailability: "High" };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const loadSuppliers = () => {
    api
      .get("/suppliers")
      .then((res) => setSuppliers(res.data))
      .catch(() => setError("Could not load suppliers. Is the backend running?"));
  };

  useEffect(loadSuppliers, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/suppliers", {
        ...form,
        leadTimeDays: Number(form.leadTimeDays),
        deliveryPerformance: Number(form.deliveryPerformance),
      });
      setForm(emptyForm);
      loadSuppliers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create supplier");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Suppliers</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <input name="name" placeholder="Supplier Name" value={form.name} onChange={handleChange} className="border rounded px-3 py-2" required />
        <input name="leadTimeDays" type="number" placeholder="Lead Time (days)" value={form.leadTimeDays} onChange={handleChange} className="border rounded px-3 py-2" required />
        <input name="deliveryPerformance" type="number" placeholder="Delivery Performance %" value={form.deliveryPerformance} onChange={handleChange} className="border rounded px-3 py-2" required />
        <select name="productAvailability" value={form.productAvailability} onChange={handleChange} className="border rounded px-3 py-2">
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <button className="col-span-2 md:col-span-4 bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700">
          Add Supplier
        </button>
      </form>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Lead Time (days)</th>
              <th className="px-4 py-2">Delivery Performance</th>
              <th className="px-4 py-2">Availability</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{s.leadTimeDays}</td>
                <td className="px-4 py-2">{s.deliveryPerformance}%</td>
                <td className="px-4 py-2">{s.productAvailability}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
