import { useEffect, useState } from "react";
import api from "../api/client";

const priorityColor = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-green-100 text-green-700",
};

const riskColor = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-green-100 text-green-700",
};

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/ai/recommend")
      .then((res) => setData(res.data))
      .catch(() =>
        setError(
          "Could not load AI recommendations. Make sure both the backend and the Python AI service are running."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Running AI analysis...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">AI Inventory Recommendations</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {data.map((item) =>
          item.error ? (
            <div key={item.product_id} className="bg-white rounded-lg shadow-sm p-5 text-red-600 text-sm">
              Analysis failed for product {item.product_id}
            </div>
          ) : (
            <div key={item.product_id} className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex justify-between items-start mb-3">
                <h2 className="font-semibold">{item.product_name}</h2>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColor[item.recommendation.priority]}`}>
                  {item.recommendation.priority} PRIORITY
                </span>
              </div>
              <div className="text-sm space-y-1 text-slate-600">
                <p>Current Stock: <span className="font-medium text-slate-800">{item.current_stock}</span></p>
                <p>Predicted Demand: <span className="font-medium text-slate-800">{item.forecast.predicted_demand}</span></p>
                <p>
                  Inventory Risk:{" "}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskColor[item.risk.risk_level]}`}>
                    {item.risk.risk_level} ({item.risk.risk_score}%)
                  </span>
                </p>
              </div>
              <div className="mt-4 border-t pt-3">
                <p className="font-medium">
                  Recommended Action: <span className="text-blue-700">{item.recommendation.action.replace("_", " ")}</span>
                </p>
                {item.recommendation.recommended_quantity > 0 && (
                  <p className="text-sm text-slate-600">
                    Recommended Quantity: {item.recommendation.recommended_quantity} units
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">{item.recommendation.reason}</p>
              </div>
            </div>
          )
        )}
        {data.length === 0 && (
          <p className="text-slate-500">
            No recommendations yet — add products with historical sales data first.
          </p>
        )}
      </div>
    </div>
  );
}
