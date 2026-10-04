import { useState, useMemo } from "react";

export default function InventoryTrendChart({ sales = [], transactions = [] }) {
  const [tab, setTab] = useState("sales");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Process Sales Data: aggregate by date chronologically
  const salesData = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    const map = new Map();
    sales.forEach((s) => {
      const d = s.date ? new Date(s.date).toISOString().slice(0, 10) : "Recent";
      const current = map.get(d) || { date: d, quantity: 0, revenue: 0, items: [] };
      current.quantity += Number(s.quantitySold || 0);
      current.revenue += Number(s.quantitySold || 0) * Number(s.sellingPrice || 0);
      current.items.push(s.product?.name || "Product");
      map.set(d, current);
    });

    return Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [sales]);

  // Process Transactions Data: IN vs OUT
  const movesData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const map = new Map();
    transactions.forEach((t) => {
      const d = t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : "Recent";
      const current = map.get(d) || { date: d, inQty: 0, outQty: 0 };
      if (t.type === "IN") current.inQty += Number(t.quantity || 0);
      else if (t.type === "OUT") current.outQty += Number(t.quantity || 0);
      map.set(d, current);
    });

    return Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [transactions]);

  // SVG dimensions
  const width = 640;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Chart computation for sales
  const maxSalesQty = useMemo(() => {
    if (salesData.length === 0) return 10;
    const max = Math.max(...salesData.map((d) => d.quantity));
    return max > 0 ? Math.ceil(max * 1.2) : 10;
  }, [salesData]);

  const salesPoints = useMemo(() => {
    if (salesData.length === 0) return [];
    if (salesData.length === 1) {
      return [{
        ...salesData[0],
        x: paddingX + chartW / 2,
        y: paddingY + chartH / 2,
      }];
    }
    return salesData.map((d, i) => {
      const x = paddingX + (i / (salesData.length - 1)) * chartW;
      const y = paddingY + chartH - (d.quantity / maxSalesQty) * chartH;
      return { ...d, x, y };
    });
  }, [salesData, maxSalesQty, chartW, chartH, paddingX, paddingY]);

  const pathD = useMemo(() => {
    if (salesPoints.length === 0) return "";
    if (salesPoints.length === 1) {
      return `M ${paddingX},${salesPoints[0].y} L ${paddingX + chartW},${salesPoints[0].y}`;
    }
    return salesPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, "");
  }, [salesPoints, paddingX, chartW]);

  const areaD = useMemo(() => {
    if (salesPoints.length === 0) return "";
    const bottom = paddingY + chartH;
    if (salesPoints.length === 1) {
      const p = salesPoints[0];
      return `M ${paddingX},${bottom} L ${paddingX},${p.y} L ${paddingX + chartW},${p.y} L ${paddingX + chartW},${bottom} Z`;
    }
    const start = `M ${salesPoints[0].x.toFixed(1)},${bottom}`;
    const line = salesPoints.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const close = `L ${salesPoints[salesPoints.length - 1].x.toFixed(1)},${bottom} Z`;
    return `${start} ${line} ${close}`;
  }, [salesPoints, paddingX, paddingY, chartH, chartW]);

  const totalSoldUnits = sales.reduce((sum, s) => sum + Number(s.quantitySold || 0), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.quantitySold || 0) * Number(s.sellingPrice || 0), 0);

  return (
    <div className="glass rounded-2xl p-5 relative">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg flex items-center gap-2">
            <span>Inventory & Sales Movement</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical stock velocity from active transactions and POS records.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setTab("sales")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              tab === "sales"
                ? "bg-teal-400/20 text-teal-300 font-medium shadow-sm border border-teal-400/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sales Trend ({sales.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("moves")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              tab === "moves"
                ? "bg-indigo-400/20 text-indigo-300 font-medium shadow-sm border border-indigo-400/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Stock Moves ({transactions.length})
          </button>
        </div>
      </div>

      {tab === "sales" ? (
        salesData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
            <svg className="w-10 h-10 mx-auto mb-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-sm font-medium text-slate-300">No sales recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">Use the "Record Sale" action to log sales and reveal demand velocity curves.</p>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mb-2 gap-2">
              <div className="flex items-center gap-4">
                <span>Total Units: <strong className="text-white">{totalSoldUnits}</strong></span>
                <span>Turnover Value: <strong className="text-teal-300">Rs. {totalRevenue.toLocaleString()}</strong></span>
              </div>
              <span className="text-[11px] text-slate-500">Scale: 0 to {maxSalesQty} units</span>
            </div>

            <div className="w-full overflow-x-auto">
              <div className="min-w-[480px]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
                  <defs>
                    <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
                      <stop offset="70%" stopColor="#818cf8" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2dd4bf" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 0.5, 1].map((ratio) => {
                    const y = paddingY + chartH * ratio;
                    const val = Math.round(maxSalesQty * (1 - ratio));
                    return (
                      <g key={ratio}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={paddingX + chartW}
                          y2={y}
                          stroke="rgba(255,255,255,0.07)"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={paddingX - 8}
                          y={y + 3}
                          fill="#64748b"
                          fontSize="9"
                          textAnchor="end"
                          className="select-none font-mono"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {areaD && <path d={areaD} fill="url(#salesGradient)" />}

                  {/* Line stroke */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="url(#strokeGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Interactive points */}
                  {salesPoints.map((p, idx) => {
                    const isHovered = hoveredPoint?.date === p.date;
                    return (
                      <g
                        key={idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? 6 : 4}
                          className="fill-teal-300 stroke-slate-950 transition-all duration-200"
                          strokeWidth="2"
                        />
                        {isHovered && (
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="11"
                            fill="none"
                            stroke="#2dd4bf"
                            strokeWidth="1.5"
                            className="animate-ping opacity-60"
                          />
                        )}
                        {/* Date label at bottom */}
                        <text
                          x={p.x}
                          y={height - 5}
                          fill="#94a3b8"
                          fontSize="10"
                          textAnchor="middle"
                          className="select-none font-mono"
                        >
                          {p.date.slice(5)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Hover tooltip card */}
            {hoveredPoint && (
              <div className="mt-2 text-xs bg-slate-900/90 border border-teal-500/30 rounded-lg p-2 flex items-center justify-between animate-fadeIn">
                <div>
                  <span className="text-slate-400">Date:</span>{" "}
                  <span className="text-white font-mono">{hoveredPoint.date}</span>
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="text-slate-400">Product:</span>{" "}
                  <span className="text-teal-300">{hoveredPoint.items?.join(", ")}</span>
                </div>
                <div>
                  <span className="text-slate-400">Qty Sold:</span>{" "}
                  <span className="text-white font-semibold">{hoveredPoint.quantity} units</span>
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="text-slate-400">Sales:</span>{" "}
                  <span className="text-indigo-300 font-semibold">Rs. {hoveredPoint.revenue.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* Stock Moves Tab */
        movesData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
            <svg className="w-10 h-10 mx-auto mb-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="text-sm font-medium text-slate-300">No stock movements recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">Record IN receipts or OUT issues under "Stock Moves" to see inventory flows.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" /> Stock IN Receipts
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Stock OUT Issues
              </span>
            </div>

            <div className="space-y-2">
              {movesData.slice(-6).map((m, idx) => {
                const total = Math.max(m.inQty + m.outQty, 1);
                const inPercent = (m.inQty / total) * 100;
                const outPercent = (m.outQty / total) * 100;
                return (
                  <div key={idx} className="bg-white/5 rounded-xl p-3 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-mono text-slate-300">{m.date}</span>
                      <div className="flex gap-3">
                        {m.inQty > 0 && <span className="text-teal-300 font-medium">+{m.inQty} IN</span>}
                        {m.outQty > 0 && <span className="text-amber-300 font-medium">-{m.outQty} OUT</span>}
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                      <div style={{ width: `${inPercent}%` }} className="bg-teal-400 h-full transition-all" />
                      <div style={{ width: `${outPercent}%` }} className="bg-amber-400 h-full transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
