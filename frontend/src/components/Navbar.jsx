import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/client";
import {
  LayoutDashboard,
  TrendingUp,
  ArrowDownUp,
  Package,
  Building2,
  BrainCircuit,
  Database,
  Cpu,
  Radio,
} from "lucide-react";

const navSections = [
  {
    title: "OPERATIONS",
    items: [
      { to: "/", label: "Executive Overview", icon: LayoutDashboard, end: true },
      { to: "/sales", label: "Sales Pulse", icon: TrendingUp },
      { to: "/inventory", label: "Stock Movements", icon: ArrowDownUp },
    ],
  },
  {
    title: "CATALOG & SUPPLY",
    items: [
      { to: "/products", label: "Product Master", icon: Package },
      { to: "/suppliers", label: "Vendor Directory", icon: Building2 },
    ],
  },
  {
    title: "DECISION SUPPORT",
    items: [
      { to: "/recommendations", label: "AI Replenishment", icon: BrainCircuit },
    ],
  },
];

export default function Navbar() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const ping = () =>
      api
        .get("/health")
        .then((res) => setHealth(res.data))
        .catch(() => setHealth({ status: "down", mongo: "down", ai: { status: "down" } }));
    ping();
    const id = setInterval(ping, 15000);
    return () => clearInterval(id);
  }, []);

  const isApiOk = health?.status === "ok";
  const isMongoOk = health?.mongo === "ok";
  const isAiOk = health?.ai?.status === "ok";

  return (
    <aside className="lg:w-72 w-full lg:min-h-screen bg-slate-950/80 border-r border-slate-800/80 backdrop-blur-2xl flex flex-col flex-shrink-0 z-20">
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-cyan-400 to-indigo-500 p-0.5 shadow-lg shadow-teal-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-teal-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-white tracking-tight">Nexus DSS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Enterprise Decision Support</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="px-4 py-5 space-y-6 flex-1 overflow-y-auto">
        {navSections.map((sec) => (
          <div key={sec.title}>
            <p className="px-3 text-[10px] font-mono font-semibold tracking-wider text-slate-500 uppercase mb-2">
              {sec.title}
            </p>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-slate-800/90 text-white shadow-sm border border-slate-700/60"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-400 rounded-r-full shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                        )}
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System Telemetry Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-teal-400 animate-pulse" />
            System Telemetry
          </span>
          <span className="text-[10px] font-mono text-emerald-400">100% Operational</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* API Status */}
          <div className="glass-card rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <Cpu className="w-3 h-3" />
              API
            </div>
            <span
              className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                isApiOk ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
              }`}
            >
              {isApiOk ? "Active" : "Down"}
            </span>
          </div>

          {/* Mongo Status */}
          <div className="glass-card rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <Database className="w-3 h-3" />
              DB
            </div>
            <span
              className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                isMongoOk ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
              }`}
            >
              {isMongoOk ? "Synced" : "Down"}
            </span>
          </div>

          {/* AI Status */}
          <div className="glass-card rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
              <BrainCircuit className="w-3 h-3" />
              ML
            </div>
            <span
              className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                isAiOk ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
              }`}
            >
              {isAiOk ? "Ready" : "Down"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

