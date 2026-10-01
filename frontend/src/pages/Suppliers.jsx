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
      setError("");
      loadSuppliers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create supplier");
    }
  };

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Supplier mesh</h1>
      <p className="text-slate-400 mb-6">Lead time feeds the fuzzy risk engine. Keep performance honest.</p>
      {error && <p className="text-rose-300 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <input name="name" placeholder="Supplier name" value={form.name} onChange={handleChange} className="input" required />
        <input name="leadTimeDays" type="number" placeholder="Lead time (days)" value={form.leadTimeDays} onChange={handleChange} className="input" required />
        <input name="deliveryPerformance" type="number" placeholder="On-time %" value={form.deliveryPerformance} onChange={handleChange} className="input" required />
        <select name="productAvailability" value={form.productAvailability} onChange={handleChange} className="input">
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <button className="btn-primary col-span-2 md:col-span-4">Add supplier</button>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {suppliers.map((s) => (
          <div key={s._id} className="glass rounded-2xl p-5">
            <h2 className="font-display text-xl">{s.name}</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Lead time</p>
                <p>{s.leadTimeDays} days</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">On-time</p>
                <p>{s.deliveryPerformance}%</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Availability</p>
                <p>{s.productAvailability}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
