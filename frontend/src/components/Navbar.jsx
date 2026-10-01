import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/client";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/products", label: "Products" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/sales", label: "Sales Pulse" },
  { to: "/inventory", label: "Stock Moves" },
  { to: "/recommendations", label: "AI Recommendations" },
];

const pill = (ok) =>
  ok ? "bg-teal-400/20 text-teal-300 border-teal-400/30" : "bg-rose-500/20 text-rose-300 border-rose-400/30";

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

  return (
    <aside className="lg:w-64 w-full lg:min-h-screen glass lg:rounded-none border-x-0 border-t-0">
      <div className="px-5 py-6">
        
        <h1 className="font-display text-2xl leading-tight mt-1">
          Nexus<span className="text-teal-300">ERP</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">AI inventory decision support</p>
      </div>

      <nav className="px-3 pb-4 flex lg:flex-col gap-1 overflow-x-auto">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 mt-auto">
        <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">Live links</p>
        <div className="flex flex-wrap lg:flex-col gap-2 text-xs">
          <span className={`px-2 py-1 rounded-lg border ${pill(health?.status === "ok")}`}>
            API {health?.status === "ok" ? "online" : "offline"}
          </span>
          <span className={`px-2 py-1 rounded-lg border ${pill(health?.mongo === "ok")}`}>
            Mongo {health?.mongo === "ok" ? "connected" : "down"}
          </span>
          <span className={`px-2 py-1 rounded-lg border ${pill(health?.ai?.status === "ok")}`}>
            AI {health?.ai?.status === "ok" ? "ready" : "down"}
          </span>
        </div>
      </div>
    </aside>
  );
}
