import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import StatCard from "../components/StatCard";
import InventoryTrendChart from "../components/InventoryTrendChart";

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
          type: "Possible Stockout",
          tone: "rose",
          product: p.name,
          productId: p._id,
          message: `Zero units in stock. Immediate inventory stockout affecting fulfillment.`,
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
          actionHint: "Review AI Advice",
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
          type: "High Predicted Demand",
          tone: "indigo",
          product: p.name,
          productId: p._id,
          message: `Next cycle demand (${p.predictedDemand} units) surpasses current on-hand inventory (${p.currentStock} units).`,
          actionHint: "Stock Up",
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
            <div className="h-9 w-64 bg-white/10 rounded-xl mb-2" />
            <div className="h-4 w-96 bg-white/5 rounded-lg" />
          </div>
          <div className="h-10 w-28 bg-white/10 rounded-xl" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl border border-white/10" />
          ))}
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl border border-white/10" />
          ))}
        </div>

        {/* Insights Skeleton */}
        <div className="h-48 bg-white/5 rounded-2xl border border-white/10" />
      </div>
    );
  }

  // Backend Error State
  if (error) {
    return (
      <div className="glass rounded-2xl p-8 border border-rose-500/30 text-center max-w-2xl mx-auto my-12">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="font-display text-2xl text-white mb-2">Backend Connection Interrupted</h2>
        <p className="text-sm text-slate-300 mb-6">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry Connection
        </button>
      </div>
    );
  }

  // Empty State: No Products
  if (!summary || summary.totalProducts === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-display text-4xl">Dashboard</h1>
          <p className="text-slate-400 mt-1">Live inventory health with AI demand and risk overlay.</p>
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/products"
              className="glass rounded-xl p-4 flex items-center gap-3 hover:border-teal-400/40 hover:bg-white/10 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-400/20 text-teal-300 flex items-center justify-center font-bold">
                +
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-teal-300 transition">Add Product</p>
                <p className="text-xs text-slate-400">Register catalog SKU</p>
              </div>
            </Link>
            <Link
              to="/sales"
              className="glass rounded-xl p-4 flex items-center gap-3 hover:border-indigo-400/40 hover:bg-white/10 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-400/20 text-indigo-300 flex items-center justify-center font-bold">
                $
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition">Record Sale</p>
                <p className="text-xs text-slate-400">Log order outflow</p>
              </div>
            </Link>
            <Link
              to="/inventory"
              className="glass rounded-xl p-4 flex items-center gap-3 hover:border-amber-400/40 hover:bg-white/10 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                ⇄
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition">Stock Moves</p>
                <p className="text-xs text-slate-400">Log IN / OUT flow</p>
              </div>
            </Link>
            <Link
              to="/recommendations"
              className="glass rounded-xl p-4 flex items-center gap-3 hover:border-purple-400/40 hover:bg-white/10 transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-400/20 text-purple-300 flex items-center justify-center font-bold">
                ✦
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition">AI Recommendations</p>
                <p className="text-xs text-slate-400">Forecasting engine</p>
              </div>
            </Link>
          </div>
        </section>

        <div className="glass rounded-2xl p-10 text-center max-w-xl mx-auto my-8 border border-dashed border-white/20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-400/10 text-teal-300 flex items-center justify-center border border-teal-400/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="font-display text-2xl text-white mb-2">No Products in Inventory Yet</h2>
          <p className="text-sm text-slate-400 mb-6">
            Get started by adding your first product SKU or loading demo seed data to activate the inventory decision support system.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/products" className="btn-primary">
              + Add First Product
            </Link>
          </div>
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
            <h1 className="font-display text-3xl sm:text-4xl text-white">Dashboard</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                aiAvailable
                  ? "bg-teal-400/15 text-teal-300 border-teal-400/30"
                  : "bg-amber-400/15 text-amber-300 border-amber-400/30"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${aiAvailable ? "bg-teal-400 animate-pulse" : "bg-amber-400"}`} />
              {aiAvailable ? "AI DSS Connected" : "AI Offline (port 8000)"}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time SME inventory monitoring and machine learning decision support.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition flex items-center gap-2"
          title="Refresh dashboard data"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-300" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* 6. QUICK ACTIONS */}
      <section>
        <p className="text-xs uppercase tracking-widest text-slate-400 mb-3 font-semibold">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            to="/products"
            className="glass rounded-xl p-3.5 flex items-center gap-3 hover:border-teal-400/40 hover:bg-white/10 transition group"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-400/20 text-teal-300 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              +
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-teal-300 transition truncate">Add Product</p>
              <p className="text-[11px] text-slate-400 truncate">Create catalog SKU</p>
            </div>
          </Link>

          <Link
            to="/sales"
            className="glass rounded-xl p-3.5 flex items-center gap-3 hover:border-indigo-400/40 hover:bg-white/10 transition group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-400/20 text-indigo-300 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              $
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition truncate">Record Sale</p>
              <p className="text-[11px] text-slate-400 truncate">Log outflow & price</p>
            </div>
          </Link>

          <Link
            to="/inventory"
            className="glass rounded-xl p-3.5 flex items-center gap-3 hover:border-amber-400/40 hover:bg-white/10 transition group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              ⇄
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition truncate">View Stock Moves</p>
              <p className="text-[11px] text-slate-400 truncate">Post IN receipts / OUT</p>
            </div>
          </Link>

          <Link
            to="/recommendations"
            className="glass rounded-xl p-3.5 flex items-center gap-3 hover:border-purple-400/40 hover:bg-white/10 transition group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-400/20 text-purple-300 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              ✦
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition truncate">AI Recommendations</p>
              <p className="text-[11px] text-slate-400 truncate">Deep fuzzy & ML advice</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 1. TOP SUMMARY CARDS (6 Metrics) */}
      <section>
        <p className="text-xs uppercase tracking-widest text-slate-400 mb-3 font-semibold">Inventory Overview</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Total Products"
            value={summary.totalProducts}
            hint="catalog size"
            tone="indigo"
          />

          <StatCard
            label="Inventory Value"
            value={`Rs. ${Number(summary.totalInventoryValue || 0).toLocaleString()}`}
            hint="on-hand valuation"
            tone="teal"
          />

          <StatCard
            label="Low Stock"
            value={summary.lowStockCount}
            hint="at or below min"
            tone="amber"
            badge={summary.lowStockCount > 0 ? "Warning" : null}
          />

          <StatCard
            label="Out of Stock"
            value={summary.outOfStockCount}
            hint="zero on hand"
            tone="rose"
            badge={summary.outOfStockCount > 0 ? "Critical" : null}
          />

          <StatCard
            label="High Risk"
            value={aiAvailable ? highRiskProducts.length : "Unavailable"}
            hint={aiAvailable ? "fuzzy risk critical/high" : "start AI service"}
            tone="purple"
            badge={aiAvailable && highRiskProducts.length > 0 ? `${highRiskProducts.length} items` : null}
          />

          <StatCard
            label="Reorder Required"
            value={reorderRequiredProducts.length}
            hint="below min or AI flag"
            tone="cyan"
            badge={reorderRequiredProducts.length > 0 ? "Action needed" : null}
          />
        </div>
      </section>

      {/* 2. AI SUMMARY SECTION: AI Inventory Insights */}
      <section className="glass rounded-2xl p-6 relative overflow-hidden border border-teal-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-2xl text-white">AI Inventory Insights</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full border bg-gradient-to-r from-teal-400/10 to-indigo-500/10 text-teal-300 border-teal-400/30 font-medium">
                Intelligent DSS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-model pipeline synthesizing linear regression forecasts, fuzzy logic risk scoring, and rule-based orders.
            </p>
          </div>

          <Link
            to="/recommendations"
            className="text-xs text-teal-300 hover:text-teal-200 font-medium flex items-center gap-1.5 transition"
          >
            <span>Explore Full AI Counsel</span>
            <span>→</span>
          </Link>
        </div>

        {/* AI Insight Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {/* Card A: Predicted Demand */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs uppercase tracking-wider text-slate-400">Predicted Demand</p>
            {aiAvailable ? (
              totalPredictedDemand != null ? (
                <>
                  <p className="text-2xl font-bold text-white mt-1.5">
                    {Math.round(totalPredictedDemand)} <span className="text-xs font-normal text-slate-400">units total</span>
                  </p>
                  <p className="text-xs text-teal-300 mt-1">
                    {recs.length} analyzed SKU{recs.length !== 1 ? "s" : ""}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-amber-300 mt-2">No prediction available</p>
                  <p className="text-[11px] text-slate-400 mt-1">Record sales history to generate forecast</p>
                </>
              )
            ) : (
              <>
                <p className="text-sm font-medium text-slate-400 mt-2">Data not available</p>
                <p className="text-[11px] text-slate-500 mt-1">AI service offline (port 8000)</p>
              </>
            )}
          </div>

          {/* Card B: High Risk Products */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs uppercase tracking-wider text-slate-400">High Risk Products</p>
            {aiAvailable ? (
              <>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <p className="text-2xl font-bold text-white">{highRiskProducts.length}</p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      highRiskProducts.length > 0 ? "bg-rose-500/20 text-rose-300" : "bg-teal-500/20 text-teal-300"
                    }`}
                  >
                    {highRiskProducts.length > 0 ? "Attention required" : "Buffer safe"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {highRiskProducts.length > 0
                    ? `${highRiskProducts.map((p) => p.name).join(", ")}`
                    : "No stockout risks detected"}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-400 mt-2">Data not available</p>
                <p className="text-[11px] text-slate-500 mt-1">Fuzzy evaluation unavailable</p>
              </>
            )}
          </div>

          {/* Card C: Products Requiring Reorder */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs uppercase tracking-wider text-slate-400">Products Requiring Reorder</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <p className="text-2xl font-bold text-white">{reorderRequiredProducts.length}</p>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  reorderRequiredProducts.length > 0 ? "bg-amber-500/20 text-amber-300" : "bg-teal-500/20 text-teal-300"
                }`}
              >
                {reorderRequiredProducts.length > 0 ? "Replenish" : "Stock healthy"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {reorderRequiredProducts.length > 0
                ? `${reorderRequiredProducts.slice(0, 2).map((p) => p.name).join(", ")}${
                    reorderRequiredProducts.length > 2 ? ` +${reorderRequiredProducts.length - 2} more` : ""
                  }`
                : "No items below reorder threshold"}
            </p>
          </div>

          {/* Card D: Important AI Alerts Summary */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs uppercase tracking-wider text-slate-400">Active Signals</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <p className="text-2xl font-bold text-white">{aiAlerts.length}</p>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  aiAlerts.length > 0 ? "bg-rose-500/20 text-rose-300" : "bg-teal-500/20 text-teal-300"
                }`}
              >
                {aiAlerts.length > 0 ? "Active alerts" : "Optimal"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {aiAlerts.length > 0
                ? `${aiAlerts.filter((a) => a.tone === "rose").length} critical, ${
                    aiAlerts.filter((a) => a.tone === "amber").length
                  } warnings`
                : "Continuous fuzzy & demand monitoring"}
            </p>
          </div>
        </div>

        {/* AI Offline Banner inside insights if down */}
        {!aiAvailable && (
          <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span>
                <strong>Python AI Service is offline:</strong> Start the service with{" "}
                <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-100">python app.py</code> in the{" "}
                <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-100">ai-service</code> directory to activate live demand forecasts.
              </span>
            </div>
            <Link to="/recommendations" className="text-amber-300 underline whitespace-nowrap ml-3">
              Details →
            </Link>
          </div>
        )}
      </section>

      {/* Main Grid: INVENTORY WATCHLIST & AI ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. INVENTORY WATCHLIST (Spans 2 columns on lg) */}
        <section className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl text-white">Inventory Watchlist</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                  {watchlistItems.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted list of inventory items with live stock, fuzzy risk, and actionable recommendations.
              </p>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setWatchlistFilter("attention")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  watchlistFilter === "attention"
                    ? "bg-amber-400/20 text-amber-300 font-medium shadow-sm border border-amber-400/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Needs Attention ({combinedProducts.filter((p) => p.needsAttention).length})
              </button>
              <button
                type="button"
                onClick={() => setWatchlistFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  watchlistFilter === "all"
                    ? "bg-white/15 text-white font-medium shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All Products ({combinedProducts.length})
              </button>
            </div>
          </div>

          {/* Watchlist Cards */}
          {watchlistItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
              <svg className="w-10 h-10 mx-auto mb-2 text-teal-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-slate-300">All products are healthy</p>
              <p className="text-xs text-slate-500 mt-1">
                No items are currently below minimum thresholds or flagged by high risk assessments.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {watchlistItems.map((p) => {
                const riskPill = {
                  CRITICAL: "bg-rose-500/20 text-rose-300 border-rose-400/30",
                  HIGH: "bg-rose-500/20 text-rose-300 border-rose-400/30",
                  MEDIUM: "bg-amber-500/20 text-amber-300 border-amber-400/30",
                  LOW: "bg-teal-500/20 text-teal-300 border-teal-400/30",
                }[p.riskLevel] || "bg-white/5 text-slate-400 border-white/10";

                const statusPill = {
                  rose: "bg-rose-500/20 text-rose-300 border-rose-400/30",
                  amber: "bg-amber-500/20 text-amber-300 border-amber-400/30",
                  teal: "bg-teal-500/20 text-teal-300 border-teal-400/30",
                  indigo: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
                }[p.statusTone];

                return (
                  <div
                    key={p._id}
                    className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all duration-200"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-semibold text-white capitalize">{p.name}</h3>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${statusPill}`}>
                            {p.stockStatus}
                          </span>
                        </div>
                        {p.category && (
                          <p className="text-xs text-slate-400 capitalize mt-0.5">{p.category}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to="/inventory"
                          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition"
                        >
                          Stock Move
                        </Link>
                        <Link
                          to="/recommendations"
                          className="px-3 py-1 rounded-lg bg-teal-400/10 hover:bg-teal-400/20 border border-teal-400/30 text-xs text-teal-300 transition"
                        >
                          AI Advice →
                        </Link>
                      </div>
                    </div>

                    {/* Metric details grid matching the requested layout */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-white/5 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Current Stock</span>
                        <span className="text-base font-bold text-white mt-0.5 block">{p.currentStock} units</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Minimum Stock</span>
                        <span className="text-base font-semibold text-slate-300 mt-0.5 block">{p.minStockLevel} units</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Risk Level</span>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${riskPill}`}>
                          {p.riskLevel ? `${p.riskLevel}${p.riskScore != null ? ` (${p.riskScore})` : ""}` : "No prediction"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Action</span>
                        <span className="text-teal-300 font-semibold mt-1 block truncate">
                          {p.recAction
                            ? p.recAction.replaceAll("_", " ")
                            : p.isLowStock || p.isOutOfStock
                            ? "Reorder"
                            : "Maintain Stock"}
                          {p.recQty > 0 ? ` (${p.recQty} units)` : ""}
                        </span>
                      </div>
                    </div>

                    {/* AI reasoning text */}
                    {p.recReason && (
                      <p className="text-[11px] text-slate-400 mt-2.5 flex items-start gap-1.5">
                        <span className="text-teal-400">💡</span>
                        <span>{p.recReason}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. AI ALERTS SECTION */}
        <section className="glass rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-xl text-white flex items-center gap-2">
                <span>AI Alerts</span>
                {aiAlerts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-rose-500/20 text-rose-300 border border-rose-400/30 font-semibold">
                    {aiAlerts.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time alerts triggered by intelligent DSS rules.</p>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {!aiAvailable ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                <p className="font-semibold mb-1">AI Alerts Inactive</p>
                <p className="text-slate-400">
                  AI engine is not reachable on port 8000. Start the Python service to see live fuzzy risk and forecast alerts.
                </p>
              </div>
            ) : aiAlerts.length === 0 ? (
              <div className="py-10 text-center text-slate-400 bg-white/[0.02] rounded-xl border border-dashed border-white/10 my-auto">
                <div className="w-10 h-10 rounded-full bg-teal-400/10 text-teal-300 mx-auto mb-2 flex items-center justify-center">
                  ✓
                </div>
                <p className="text-sm font-medium text-slate-300">No active alerts</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                  All monitored inventory levels are currently within safe operational parameters.
                </p>
              </div>
            ) : (
              aiAlerts.map((alert) => {
                const toneBorder = {
                  rose: "border-rose-500/30 bg-rose-500/5",
                  amber: "border-amber-500/30 bg-amber-500/5",
                  indigo: "border-indigo-500/30 bg-indigo-500/5",
                }[alert.tone] || "border-white/10 bg-white/5";

                const badgeTone = {
                  rose: "bg-rose-500/20 text-rose-300",
                  amber: "bg-amber-500/20 text-amber-300",
                  indigo: "bg-indigo-500/20 text-indigo-300",
                }[alert.tone] || "bg-white/10 text-white";

                return (
                  <div key={alert.id} className={`p-3.5 rounded-xl border ${toneBorder} transition hover:bg-white/[0.04]`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeTone}`}>
                        {alert.type}
                      </span>
                      <span className="text-xs font-semibold text-white capitalize">{alert.product}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-2.5">{alert.message}</p>

                    <div className="flex justify-end">
                      <Link
                        to={alert.actionRoute}
                        className="text-[11px] font-medium text-teal-300 hover:text-teal-200 transition flex items-center gap-1"
                      >
                        <span>{alert.actionHint}</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* AI DSS Diagnostics footer note */}
          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-500 flex justify-between items-center">
            <span>Model: {aiStatus.modelLoaded ? "Linear Regression + Fuzzy DSS" : "Fuzzy Risk Logic"}</span>
            <Link to="/recommendations" className="text-slate-400 hover:text-teal-300">
              Details
            </Link>
          </div>
        </section>
      </div>

      {/* 5. INVENTORY TREND */}
      <section>
        <InventoryTrendChart sales={sales} transactions={transactions} />
      </section>
    </div>
  );
}
