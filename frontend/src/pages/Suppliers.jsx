import { useEffect, useState } from "react";
import api from "../api/client";

const emptyForm = { name: "", leadTimeDays: "", deliveryPerformance: "", productAvailability: "High" };

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

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      setSuccess("Supplier added successfully!");
      setTimeout(() => setSuccess(""), 4000);
      loadSuppliers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create supplier");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      return;
    }
    try {
      await api.delete(`/suppliers/${id}`);
      setError("");
      setSuccess(`Supplier "${name}" deleted successfully.`);
      setTimeout(() => setSuccess(""), 4000);
      loadSuppliers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete supplier");
    }
  };

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Supplier mesh</h1>
      <p className="text-slate-400 mb-6">Lead time feeds the fuzzy risk engine. Keep performance honest.</p>
      {error && <p className="text-rose-300 mb-3 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl text-sm">{error}</p>}
      {success && <p className="text-teal-300 mb-3 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-xl text-sm">{success}</p>}

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
          <div key={s._id} className="glass rounded-2xl p-5 relative group hover:border-white/20 transition">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-xl">{s.name}</h2>
              <button
                type="button"
                onClick={() => handleDelete(s._id, s.name)}
                title="Delete supplier"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition inline-flex items-center justify-center"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Lead time</p>
                <p className="font-medium text-slate-200">{s.leadTimeDays} days</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">On-time</p>
                <p className="font-medium text-slate-200">{s.deliveryPerformance}%</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Availability</p>
                <p className="font-medium text-slate-200">{s.productAvailability}</p>
              </div>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <p className="text-slate-500 col-span-2 text-center py-8">No suppliers recorded yet.</p>
        )}
      </div>
    </div>
  );
}

