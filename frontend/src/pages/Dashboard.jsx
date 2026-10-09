import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import StatCard from "../components/StatCard";
import InventoryTrendChart from "../components/InventoryTrendChart";
import {
  Package,
  TrendingUp,
  ArrowDownUp,
  BrainCircuit,
  Plus,
  DollarSign,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [recs, setRecs] = useState([]);
  const [aiStatus, setAiStatus] = useState({ online: false, modelLoaded: false, checked: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [watchlistFilter, setWatchlistFilter] = useState("attention"); // "attention" | "all"

  const fetchDashboardData = useCallback(() => {
    setLoading(true);
    setError("");

    // Fetch core ERP data in parallel
    const summaryReq = api.get("/inventory/summary").then((res) => res.data);
    const productsReq = api.get("/products").then((res) => res.data).catch(() => []);
    const salesReq = api.get("/sales").then((res) => res.data).catch(() => []);
    const transReq = api.get("/inventory/transactions").then((res) => res.data).catch(() => []);
    const healthReq = api.get("/health").then((res) => res.data).catch(() => null);
    const aiReq = api.get("/ai/recommend").then((res) => (Array.isArray(res.data) ? res.data : [])).catch(() => []);

    Promise.all([summaryReq, productsReq, salesReq, transReq, healthReq, aiReq])
      .then(([summaryData, productsData, salesData, transData, healthData, aiData]) => {
        setSummary(summaryData);
        setProducts(productsData || []);
        setSales(salesData || []);
        setTransactions(transData || []);
        setRecs(aiData || []);

        const isAiUp = healthData?.ai?.status === "ok";
        const isModelLoaded = Boolean(healthData?.ai?.model_loaded);
        setAiStatus({ online: isAiUp, modelLoaded: isModelLoaded, checked: true });
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setError("Could not reach the backend on port 5000. Ensure Node server and MongoDB are running, then retry.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Combine product data with AI recommendations for complete decision-support analysis
  const combinedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    return products.map((product) => {
      const rec = recs.find((r) => r.product_id === product._id && !r.error);
      const isOutOfStock = product.currentStock === 0;
      const isLowStock = product.currentStock > 0 && product.currentStock <= product.minStockLevel;

      let stockStatus = "Healthy Stock";
      let statusTone = "teal";
      if (isOutOfStock) {
        stockStatus = "Out of Stock";
        statusTone = "rose";
      } else if (isLowStock) {
        stockStatus = "Low Stock";
        statusTone = "amber";
      } else if (product.maxStockLevel && product.currentStock > product.maxStockLevel) {
        stockStatus = "Overstocked";
        statusTone = "indigo";
      }

      const riskLevel = rec?.risk?.risk_level || null;
      const riskScore = rec?.risk?.risk_score ?? null;
      const predictedDemand = rec?.forecast?.predicted_demand ?? null;
      const forecastMethod = rec?.forecast?.method || null;
      const recAction = rec?.recommendation?.action || rec?.recommendation?.recommendation || null;
      const recQty = rec?.recommendation?.recommended_quantity ?? 0;
      const recReason = rec?.recommendation?.reason || null;
      const recPriority = rec?.recommendation?.priority || null;

      // Determine if product requires attention
      const needsAttention =
        isOutOfStock ||
        isLowStock ||
        riskLevel === "CRITICAL" ||
        riskLevel === "HIGH" ||
        recAction === "URGENT_REORDER" ||
        recAction === "REORDER" ||
        recQty > 0;

      return {
        ...product,
        stockStatus,
        statusTone,
        isOutOfStock,
        isLowStock,
        riskLevel,
        riskScore,
        predictedDemand,
        forecastMethod,
        recAction,
        recQty,
        recReason,
        recPriority,
        needsAttention,
        hasAiData: Boolean(rec),
      };
    });
  }, [products, recs]);

  // High risk products from AI
  const highRiskProducts = useMemo(() => {
    return combinedProducts.filter((p) => p.riskLevel === "CRITICAL" || p.riskLevel === "HIGH");
  }, [combinedProducts]);

  // Products requiring reorder (from low/out-of-stock or AI rule recommendation)
  const reorderRequiredProducts = useMemo(() => {
    return combinedProducts.filter(
      (p) =>
        p.isLowStock ||
        p.isOutOfStock ||
        p.recAction === "URGENT_REORDER" ||
        p.recAction === "REORDER" ||
        p.recQty > 0
    );
  }, [combinedProducts]);

  // Total predicted demand aggregate across analyzed catalog
  const totalPredictedDemand = useMemo(() => {
    const validRecs = recs.filter((r) => !r.error && r.forecast?.predicted_demand != null);
    if (validRecs.length === 0) return null;
    return validRecs.reduce((sum, r) => sum + Number(r.forecast.predicted_demand || 0), 0);
  }, [recs]);

  // Real data-driven AI alerts
  const aiAlerts = useMemo(() => {
    const alerts = [];

    combinedProducts.forEach((p) => {
      // Alert 1: Possible Stockout / Zero stock
      if (p.isOutOfStock) {
        alerts.push({
          id: `stockout-${p._id}`,
          type: "Stockout Event",
          tone: "rose",
          product: p.name,
          productId: p._id,
          message: `Zero units in stock. Immediate replenishment required to maintain service level agreements.`,
          actionHint: "Record Stock IN",
          actionRoute: "/inventory",
        });
      }

      // Alert 2: High inventory risk from fuzzy logic
      if (p.riskLevel === "CRITICAL" || p.riskLevel === "HIGH") {
        alerts.push({
          id: `risk-${p._id}`,
          type: "High Inventory Risk",
          tone: "rose",
          product: p.name,
          productId: p._id,
          message: `Fuzzy risk score ${p.riskScore}/100 (${p.riskLevel}). Current stock cannot safely cover demand across lead time.`,
          actionHint: "Review Advisory",
          actionRoute: "/recommendations",
        });
      }

      // Alert 3: Reorder required by business rules
      if (p.recAction === "URGENT_REORDER" || (p.isLowStock && p.recAction !== "NO_REORDER")) {
        alerts.push({
          id: `reorder-${p._id}`,
          type: "Reorder Required",
          tone: "amber",
          product: p.name,
          productId: p._id,
          message: p.recReason || `Stock sits at ${p.currentStock} (below min ${p.minStockLevel}). Order suggested.`,
          actionHint: p.recQty > 0 ? `Reorder ${p.recQty} units` : "Order stock",
          actionRoute: "/inventory",
        });
      }

      // Alert 4: High predicted demand vs inventory
      if (
        p.predictedDemand != null &&
        p.predictedDemand > p.currentStock &&
        !p.isOutOfStock &&
        p.riskLevel !== "CRITICAL"
      ) {
        alerts.push({
          id: `demand-${p._id}`,
          type: "Demand Surge",
          tone: "indigo",
          product: p.name,
          productId: p._id,
          message: `Next cycle demand (${p.predictedDemand} units) surpasses current on-hand inventory (${p.currentStock} units).`,
          actionHint: "Adjust Stock",
          actionRoute: "/inventory",
        });
      }
    });

    return alerts;
  }, [combinedProducts]);

  // Filtered watchlist products
  const watchlistItems = useMemo(() => {
    if (watchlistFilter === "attention") {
      return combinedProducts.filter((p) => p.needsAttention);
    }
    return combinedProducts;
  }, [combinedProducts, watchlistFilter]);

  // Loading State
  if (loading && !summary) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-9 w-64 bg-slate-800 rounded-xl mb-2" />
            <div className="h-4 w-96 bg-slate-800/60 rounded-lg" />
          </div>
          <div className="h-10 w-28 bg-slate-800 rounded-xl" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
        </div>

        {/* Insights Skeleton */}
        <div className="h-48 bg-slate-900/60 rounded-2xl border border-slate-800" />
      </div>
    );
  }

  // Backend Error State
  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 border border-rose-500/30 text-center max-w-2xl mx-auto my-12">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Backend Connection Interrupted</h2>
        <p className="text-sm text-slate-300 mb-6">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="btn-primary"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Connection
        </button>
      </div>
    );
  }

  // Empty State: No Products
  if (!summary || summary.totalProducts === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">Executive Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Live inventory health with AI demand and risk overlay.</p>
        </div>

        <div className="glass-card rounded-2xl p-10 text-center max-w-xl mx-auto my-8 border border-dashed border-slate-800">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-2">No Products in Inventory Yet</h2>
          <p className="text-sm text-slate-400 mb-6">
            Register your first product SKU to activate the machine learning demand forecasting engine.
          </p>
          <Link to="/products" className="btn-primary">
            <Plus className="w-4 h-4" />
            Add First Product
          </Link>
        </div>
      </div>
    );
  }

  const aiAvailable = aiStatus.online;

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">Executive Overview</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-medium border flex items-center gap-1.5 ${
                aiAvailable
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${aiAvailable ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {aiAvailable ? "AI DSS Connected · Random Forest Ready" : "AI Offline (port 8000)"}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time supply chain monitoring, automated reorder triggers, and machine learning demand intelligence.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="btn-secondary text-xs"
          title="Refresh dashboard data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-400" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* QUICK ACTIONS ROW */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Operational Fast-Paths
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <Link
            to="/products"
            className="glass-card rounded-2xl p-4 flex items-center gap-3.5 group hover:border-teal-500/40"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 group-hover:bg-teal-500/20 transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-teal-300 transition truncate">Add Product</p>
              <p className="text-[11px] text-slate-400 truncate">Register catalog SKU</p>
            </div>
          </Link>

          <Link
            to="/sales"
            className="glass-card rounded-2xl p-4 flex items-center gap-3.5 group hover:border-indigo-500/40"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 group-hover:bg-indigo-500/20 transition-all">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition truncate">Record Sale</p>
              <p className="text-[11px] text-slate-400 truncate">Log order outflow</p>
            </div>
          </Link>

          <Link
            to="/inventory"
            className="glass-card rounded-2xl p-4 flex items-center gap-3.5 group hover:border-amber-500/40"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 group-hover:bg-amber-500/20 transition-all">
              <ArrowDownUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition truncate">Stock Moves</p>
              <p className="text-[11px] text-slate-400 truncate">Post IN / OUT voucher</p>
            </div>
          </Link>

          <Link
            to="/recommendations"
            className="glass-card rounded-2xl p-4 flex items-center gap-3.5 group hover:border-purple-500/40"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 group-hover:bg-purple-500/20 transition-all">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition truncate">AI Recommendations</p>
              <p className="text-[11px] text-slate-400 truncate">Multi-model counsel</p>
            </div>
          </Link>
        </div>
      </section>

      {/* TOP SUMMARY CARDS (6 Metrics) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Supply Chain Key Metrics
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            label="Total SKUs"
            value={summary.totalProducts}
            hint="active catalog"
            tone="indigo"
            icon={<Package className="w-4 h-4" />}
          />

          <StatCard
            label="Inventory Value"
            value={`Rs. ${Number(summary.totalInventoryValue || 0).toLocaleString()}`}
            hint="total on-hand valuation"
            tone="teal"
            icon={<DollarSign className="w-4 h-4" />}
          />

          <StatCard
            label="Low Stock"
            value={summary.lowStockCount}
            hint="at or below threshold"
            tone="amber"
            badge={summary.lowStockCount > 0 ? "Warning" : null}
            icon={<AlertTriangle className="w-4 h-4" />}
          />

          <StatCard
            label="Stockout"
            value={summary.outOfStockCount}
            hint="zero on hand"
            tone="rose"
            badge={summary.outOfStockCount > 0 ? "Critical" : null}
            icon={<AlertOctagon className="w-4 h-4" />}
          />

          <StatCard
            label="High Risk"
            value={aiAvailable ? highRiskProducts.length : "Offline"}
            hint={aiAvailable ? "fuzzy risk score > 50" : "start AI service"}
            tone="purple"
            badge={aiAvailable && highRiskProducts.length > 0 ? `${highRiskProducts.length} items` : null}
            icon={<BrainCircuit className="w-4 h-4" />}
          />

          <StatCard
            label="Reorders"
            value={reorderRequiredProducts.length}
            hint="action recommended"
            tone="cyan"
            badge={reorderRequiredProducts.length > 0 ? "Action needed" : null}
            icon={<RefreshCw className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* AI SUMMARY SECTION: AI Inventory Insights */}
      <section className="glass-card rounded-2xl p-6 sm:p-7 relative overflow-hidden group">
        {/* Top Hairline Gradient Accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display font-bold text-2xl text-white tracking-tight flex items-center gap-2">
                <BrainCircuit className="w-6 h-6 text-teal-400" />
                AI Decision Support Intelligence
              </h2>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold">
                Multi-Model Core
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Synthesizes linear regression demand curves, Random Forest trained regression, Mamdani fuzzy logic risk scoring, and automated replenishment policies.
            </p>
          </div>

          <Link
            to="/recommendations"
            className="btn-secondary text-xs group"
          >
            <span>Explore Full AI Counsel</span>
            <ChevronRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* AI Insight Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {/* Card A: Predicted Demand */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 hover:border-slate-700/80 transition-all">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Predicted Cycle Demand
            </span>
            {aiAvailable ? (
              totalPredictedDemand != null ? (
                <>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-mono font-bold text-white">
                      {Math.round(totalPredictedDemand)}
                    </p>
                    <span className="text-xs text-slate-400 font-mono">units aggregate</span>
                  </div>
                  <p className="text-xs text-teal-400 font-mono mt-1">
                    ✓ {recs.length} analyzed SKU{recs.length !== 1 ? "s" : ""}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-amber-400 mt-2">No historical sales</p>
                  <p className="text-[11px] text-slate-400 mt-1">Log sales under "Sales Pulse" to activate forecast</p>
                </>
              )
            ) : (
              <>
                <p className="text-sm font-medium text-slate-400 mt-2">Service offline</p>
                <p className="text-[11px] text-slate-500 mt-1">FastAPI listening on port 8000</p>
              </>
            )}
          </div>

          {/* Card B: High Risk Products */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 hover:border-slate-700/80 transition-all">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Fuzzy Risk Alerts
            </span>
            {aiAvailable ? (
              <>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-2xl font-mono font-bold text-white">{highRiskProducts.length}</p>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                      highRiskProducts.length > 0 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {highRiskProducts.length > 0 ? "Buffer Critical" : "Safe Buffer"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  {highRiskProducts.length > 0
                    ? highRiskProducts.map((p) => p.name).join(", ")
                    : "No stockout risks detected"}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-400 mt-2">Unavailable</p>
                <p className="text-[11px] text-slate-500 mt-1">Fuzzy evaluation waiting for port 8000</p>
              </>
            )}
          </div>

          {/* Card C: Products Requiring Reorder */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 hover:border-slate-700/80 transition-all">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Action Required
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-mono font-bold text-white">{reorderRequiredProducts.length}</p>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                  reorderRequiredProducts.length > 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {reorderRequiredProducts.length > 0 ? "Replenish" : "Stock Optimal"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {reorderRequiredProducts.length > 0
                ? `${reorderRequiredProducts.slice(0, 2).map((p) => p.name).join(", ")}${
                    reorderRequiredProducts.length > 2 ? ` +${reorderRequiredProducts.length - 2} more` : ""
                  }`
                : "All items satisfy safety stock"}
            </p>
          </div>

          {/* Card D: Active Signals */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 hover:border-slate-700/80 transition-all">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Telemetry Signals
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-mono font-bold text-white">{aiAlerts.length}</p>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                  aiAlerts.length > 0 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {aiAlerts.length > 0 ? "Active Signals" : "Continuous"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {aiAlerts.length > 0
                ? `${aiAlerts.filter((a) => a.tone === "rose").length} critical, ${
                    aiAlerts.filter((a) => a.tone === "amber").length
                  } warnings`
                : "Continuous telemetry active"}
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid: INVENTORY WATCHLIST & AI ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INVENTORY WATCHLIST (Spans 2 columns on lg) */}
        <section className="lg:col-span-2 glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-xl text-white">Inventory Watchlist</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-teal-400 font-mono font-semibold">
                  {watchlistItems.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Active catalog SKUs mapped against safety thresholds and fuzzy demand risks.
              </p>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setWatchlistFilter("attention")}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                  watchlistFilter === "attention"
                    ? "bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Needs Attention ({combinedProducts.filter((p) => p.needsAttention).length})
              </button>
              <button
                type="button"
                onClick={() => setWatchlistFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                  watchlistFilter === "all"
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All Products ({combinedProducts.length})
              </button>
            </div>
          </div>

          {/* Watchlist Cards */}
          {watchlistItems.length === 0 ? (
            <div className="py-14 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400/80" />
              <p className="text-sm font-semibold text-slate-200">Catalog is 100% Healthy</p>
              <p className="text-xs text-slate-500 mt-1">
                No items are currently below minimum thresholds or flagged by high risk assessments.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {watchlistItems.map((p) => {
                const riskPill = {
                  CRITICAL: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                  HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  LOW: "bg-teal-500/10 text-teal-400 border-teal-500/20",
                }[p.riskLevel] || "bg-slate-800/60 text-slate-400 border-slate-700/60";

                const statusPill = {
                  rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  teal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
                  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                }[p.statusTone];

                return (
                  <div
                    key={p._id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all duration-200"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-display font-semibold text-base text-white">{p.name}</h3>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${statusPill}`}>
                            {p.stockStatus}
                          </span>
                        </div>
                        {p.category && (
                          <p className="text-xs text-slate-400 mt-0.5">{p.category}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to="/inventory"
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Stock Move
                        </Link>
                        <Link
                          to="/recommendations"
                          className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-xs text-teal-300 font-medium transition flex items-center gap-1"
                        >
                          <span>AI Advice</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Metric details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-800/60 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-mono uppercase">On-Hand Stock</span>
                        <span className="text-sm font-mono font-bold text-white mt-0.5 block">{p.currentStock} units</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-mono uppercase">Min Safety Level</span>
                        <span className="text-sm font-mono font-semibold text-slate-300 mt-0.5 block">{p.minStockLevel} units</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-mono uppercase">Fuzzy Risk</span>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${riskPill}`}>
                          {p.riskLevel ? `${p.riskLevel}${p.riskScore != null ? ` (${p.riskScore})` : ""}` : "No prediction"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-mono uppercase">AI Suggested Action</span>
                        <span className="text-teal-400 font-semibold mt-1 block truncate">
                          {p.recAction
                            ? p.recAction.replaceAll("_", " ")
                            : p.isLowStock || p.isOutOfStock
                            ? "Reorder"
                            : "Stock Optimal"}
                          {p.recQty > 0 ? ` (${p.recQty} units)` : ""}
                        </span>
                      </div>
                    </div>

                    {/* AI reasoning text */}
                    {p.recReason && (
                      <p className="text-xs text-slate-400 mt-2.5 flex items-start gap-1.5 leading-relaxed">
                        <Sparkles className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                        <span>{p.recReason}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* AI ALERTS SECTION */}
        <section className="glass-card rounded-2xl p-6 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
            <div>
              <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <span>AI Advisory Signals</span>
                {aiAlerts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                    {aiAlerts.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Automated algorithmic decision notices.</p>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {!aiAvailable ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                <p className="font-semibold mb-1">AI Engine Inactive</p>
                <p className="text-slate-400">
                  AI service is offline on port 8000. Start Python service to view dynamic alerts.
                </p>
              </div>
            ) : aiAlerts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 my-auto">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400/80" />
                <p className="text-sm font-semibold text-slate-200">All Safe</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                  All monitored inventory levels are currently within safe parameters.
                </p>
              </div>
            ) : (
              aiAlerts.map((alert) => {
                const toneBorder = {
                  rose: "border-rose-500/30 bg-rose-500/5",
                  amber: "border-amber-500/30 bg-amber-500/5",
                  indigo: "border-indigo-500/30 bg-indigo-500/5",
                }[alert.tone] || "border-slate-800 bg-slate-950/60";

                const badgeTone = {
                  rose: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
                  amber: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                  indigo: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
                }[alert.tone] || "bg-slate-800 text-white";

                return (
                  <div key={alert.id} className={`p-4 rounded-xl border ${toneBorder} transition hover:border-slate-700`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeTone}`}>
                        {alert.type}
                      </span>
                      <span className="text-xs font-semibold text-white">{alert.product}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{alert.message}</p>

                    <div className="flex justify-end">
                      <Link
                        to={alert.actionRoute}
                        className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition flex items-center gap-1"
                      >
                        <span>{alert.actionHint}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* AI DSS Diagnostics footer note */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex justify-between items-center">
            <span>Model: {aiStatus.modelLoaded ? "Random Forest + Linear + Fuzzy" : "Linear + Fuzzy"}</span>
            <Link to="/recommendations" className="text-slate-400 hover:text-teal-300 transition">
              Telemetry →
            </Link>
          </div>
        </section>
      </div>

      {/* INVENTORY TREND CHART */}
      <section>
        <InventoryTrendChart sales={sales} transactions={transactions} />
      </section>
    </div>
  );
}

