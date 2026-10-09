import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Recommendations from "./pages/Recommendations";
import { Sparkles, ShieldCheck, Clock } from "lucide-react";
import { useState, useEffect } from "react";

export default function App() {
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen lg:flex bg-[#070a12] text-slate-100 antialiased selection:bg-teal-500/30 selection:text-teal-200">
      <Navbar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Executive Header Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-6 sm:px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-200">Production Node</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400 font-mono">erp-ai-dss · Random Forest ML</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{time}</span>
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xs font-semibold">
                EX
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-medium text-slate-200">Supply Operations</p>
                <p className="text-[10px] text-teal-400 font-mono">Executive Mode</p>
              </div>
            </div>
          </div>
        </header>

        {/* Global Accent Shimmer Line */}
        <div className="h-0.5 spark w-full opacity-70" />

        {/* Page Content Viewport */}
        <main className="flex-1 px-5 sm:px-8 lg:px-10 py-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/recommendations" element={<Recommendations />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

