"""
Demand Forecasting module.

Uses historical sales data (date + quantity_sold) to predict demand for the
next period. For a small SME dataset a simple, explainable model is more
appropriate than a deep model, so this uses linear regression over a
time-indexed, monthly-aggregated series with a fallback to a weighted
moving average when there isn't enough history for a trend fit.
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression


def _monthly_series(sales_history):
    """Aggregate a list of {date, quantity_sold} dicts into a monthly series."""
    df = pd.DataFrame(sales_history)
    df["date"] = pd.to_datetime(df["date"])
    df["period"] = df["date"].dt.to_period("M")
    monthly = df.groupby("period")["quantity_sold"].sum().sort_index()
    return monthly


def forecast_demand(sales_history, periods_ahead=1):
    """
    sales_history: list of dicts like {"date": "2026-01-15", "quantity_sold": 12}
    Returns: {
        "predicted_demand": float,
        "method": str,
        "history_points": int
    }
    """
    monthly = _monthly_series(sales_history)

    if len(monthly) == 0:
        return {"predicted_demand": 0.0, "method": "no_data", "history_points": 0}

    if len(monthly) < 3:
        # Not enough points for a trend line - use weighted moving average
        weights = np.arange(1, len(monthly) + 1)
        avg = np.average(monthly.values, weights=weights)
        return {
            "predicted_demand": round(float(avg), 2),
            "method": "weighted_moving_average",
            "history_points": int(len(monthly)),
        }

    # Linear regression on month index vs quantity to capture trend + growth
    X = np.arange(len(monthly)).reshape(-1, 1)
    y = monthly.values
    model = LinearRegression()
    model.fit(X, y)

    future_X = np.arange(len(monthly), len(monthly) + periods_ahead).reshape(-1, 1)
    prediction = model.predict(future_X)
    predicted_demand = max(float(prediction[-1]), 0.0)  # demand can't be negative

    return {
        "predicted_demand": round(predicted_demand, 2),
        "method": "linear_regression",
        "history_points": int(len(monthly)),
    }
