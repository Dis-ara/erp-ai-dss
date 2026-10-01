"""
Demand forecasting: trained sklearn model when feature inputs are given,
plus a linear-regression trend model when only sales history is available.
"""

import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LinearRegression


MODEL_PATH = Path(__file__).resolve().parent / "model" / "demand_model.pkl"

try:
    trained_model = joblib.load(MODEL_PATH)
except Exception:
    trained_model = None


def forecast_from_sales(sales_history):
    """Linear regression on chronological sales quantities (next period)."""
    y = np.array(
        [float(s.get("quantity_sold", 0) or 0) for s in sales_history],
        dtype=float,
    )
    if len(y) == 0:
        return {
            "predicted_demand": 0.0,
            "method": "empty_history",
            "r2": None,
            "history": [],
        }
    if len(y) == 1:
        return {
            "predicted_demand": round(float(y[0]), 2),
            "method": "last_value",
            "r2": None,
            "history": y.tolist(),
        }

    X = np.arange(len(y)).reshape(-1, 1)
    model = LinearRegression().fit(X, y)
    predicted = max(float(model.predict(np.array([[len(y)]]))[0]), 0.0)
    return {
        "predicted_demand": round(predicted, 2),
        "method": "linear_regression",
        "slope": round(float(model.coef_[0]), 4),
        "r2": round(float(model.score(X, y)), 3),
        "history": [round(v, 2) for v in y.tolist()],
    }


def forecast_with_model(
    inventory_level,
    units_sold,
    units_ordered,
    supplier_lead_time,
    price,
    discount_percent,
    promotion,
):
    if trained_model is None:
        raise RuntimeError("Trained demand model is not available")

    data = pd.DataFrame(
        [
            {
                "Inventory_Level": inventory_level,
                "Units_Sold": units_sold,
                "Units_Ordered": units_ordered,
                "Supplier_Lead_Time": supplier_lead_time,
                "Price": price,
                "Discount_Percent": discount_percent,
                "Promotion": promotion,
            }
        ]
    )
    prediction = trained_model.predict(data)
    predicted_demand = max(float(prediction[0]), 0.0)
    return round(predicted_demand, 2)


def forecast_demand(*args, **kwargs):
    """
    Dual entry point:
    - forecast_demand(sales_list) -> dict (used by /analyze)
    - forecast_demand(inventory, sold, ordered, lead, price, discount, promo) -> float
    """
    if args and isinstance(args[0], list):
        return forecast_from_sales(args[0])

    return forecast_with_model(
        kwargs.get("inventory_level", args[0] if len(args) > 0 else 0),
        kwargs.get("units_sold", args[1] if len(args) > 1 else 0),
        kwargs.get("units_ordered", args[2] if len(args) > 2 else 0),
        kwargs.get("supplier_lead_time", args[3] if len(args) > 3 else 0),
        kwargs.get("price", args[4] if len(args) > 4 else 0),
        kwargs.get("discount_percent", args[5] if len(args) > 5 else 0),
        kwargs.get("promotion", args[6] if len(args) > 6 else 0),
    )
