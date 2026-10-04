import { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import {
  Building2,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  Search,
} from "lucide-react";

const emptyForm = { name: "", leadTimeDays: "", deliveryPerformance: "90", productAvailability: "High" };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");

  const loadSuppliers = () => {
    api
      .get("/suppliers")
      .then((res) => setSuppliers(res.data || []))
      .catch(() => setError("Could not load suppliers. Ensure the backend is active."));
  };

  useEffect(loadSuppliers, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/suppliers", {
        ...form,
        leadTimeDays: Number(form.leadTimeDays),
        deliveryPerformance: Number(form.deliveryPerformance),
      });
      setForm(emptyForm);
      setError("");
      setShowAddForm(false);
      loadSuppliers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to onboard supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter((s) => s.name?.toLowerCase().includes(q));
  }, [suppliers, search]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">Vendor Directory</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
              {suppliers.length} Verified Partners
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Supplier lead-times directly modulate the Mamdani fuzzy risk scoring algorithm. Shorter and consistent lead-times reduce safety stock requirements.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary text-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showAddForm ? "Hide Form" : "Onboard New Vendor"}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Onboard Form */}
      {showAddForm && (
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden animate-fadeIn">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />
          <h2 className="font-display font-semibold text-lg text-white mb-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            Onboard Supply Partner
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Register vendor SLA lead times and fulfillment compliance metrics.
          </p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                Vendor Name
              </label>
              <input
                name="name"
                placeholder="e.g. Apex Hardware Logistics"
                value={form.name}
                onChange={handleChange}
                className="input text-xs"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                Lead Time (Days)
              </label>
              <input
                name="leadTimeDays"
                type="number"
                min="1"
                placeholder="e.g. 7"
                value={form.leadTimeDays}
                onChange={handleChange}
                className="input text-xs"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                On-Time Delivery SLA (%)
              </label>
              <input
                name="deliveryPerformance"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 95"
                value={form.deliveryPerformance}
                onChange={handleChange}
                className="input text-xs"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                Availability Tier
              </label>
              <select
                name="productAvailability"
                value={form.productAvailability}
                onChange={handleChange}
                className="input text-xs"
              >
                <option value="High">High (Immediate PO Fulfillment)</option>
                <option value="Medium">Medium (Moderate Delays)</option>
                <option value="Low">Low (Backorders Frequent)</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? "Registering..." : "Complete Vendor Onboarding"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSuppliers.map((s) => {
          const perf = s.deliveryPerformance ?? 90;
          const perfColor =
            perf >= 90 ? "text-emerald-400" : perf >= 75 ? "text-amber-400" : "text-rose-400";
          const perfBar =
            perf >= 90 ? "bg-emerald-400" : perf >= 75 ? "bg-amber-400" : "bg-rose-500";

          return (
            <div
              key={s._id}
              className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group hover:border-slate-700"
            >
              {/* Top Hairline */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />

              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-teal-400 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-display font-semibold text-lg text-white group-hover:text-teal-300 transition-colors">
                        {s.name}
                      </h2>
                      <span className="text-[10px] font-mono text-slate-500">ID #{s._id.slice(-6)}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      s.productAvailability === "High"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : s.productAvailability === "Medium"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {s.productAvailability || "High"} Supply
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Standard Lead Time</span>
                    <span className="text-base font-mono font-bold text-white mt-0.5 block flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      {s.leadTimeDays} days
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Fulfillment SLA</span>
                    <span className={`text-base font-mono font-bold mt-0.5 block ${perfColor}`}>
                      {perf}% On-Time
                    </span>
                  </div>
                </div>

                {/* SLA bar */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>Delivery Reliability</span>
                    <span className={perfColor}>{perf}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div style={{ width: `${perf}%` }} className={`h-full rounded-full ${perfBar}`} />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  SLA Active
                </span>
                <span className="font-mono text-slate-500">Tier 1 Partner</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

