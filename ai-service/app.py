from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from demand_forecasting import forecast_from_sales, forecast_with_model, trained_model
from fuzzy_risk import assess_risk
from rule_based import recommend_reorder

app = FastAPI(
    title="ERP AI Decision Support Service",
    description="Demand forecasting + fuzzy risk + rule-based reorder recommendation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SalePoint(BaseModel):
    date: str
    quantity_sold: float


class AnalyzeRequest(BaseModel):
    product_id: str
    product_name: str
    current_stock: float
    min_stock_level: float = 0
    supplier_lead_time_days: float = 7
    sales_history: List[SalePoint]
    unit_price: float = 0
    discount_percent: float = 0
    promotion: float = 0


class InventoryRequest(BaseModel):
    inventory_level: float
    units_sold: float
    units_ordered: float
    supplier_lead_time: float
    price: float
    discount_percent: float = 0
    promotion: float = 0


@app.get("/")
def home():
    return {"message": "ERP AI Service is running", "analyze": "/analyze", "predict": "/predict"}


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": trained_model is not None}


def _pipeline(
    *,
    product_id: str,
    product_name: str,
    current_stock: float,
    min_stock_level: float,
    lead_time: float,
    sales_history: list,
    unit_price: float,
    discount_percent: float,
    promotion: float,
):
    trend = forecast_from_sales(sales_history)
    quantities = [s["quantity_sold"] if isinstance(s, dict) else s.quantity_sold for s in sales_history]
    last_sold = float(quantities[-1]) if quantities else 0.0
    avg_sold = float(sum(quantities) / len(quantities)) if quantities else 0.0

    model_prediction = None
    predicted = trend["predicted_demand"]
    method = trend.get("method", "linear_regression")

    if trained_model is not None:
        try:
            model_prediction = forecast_with_model(
                current_stock,
                last_sold,
                avg_sold,
                lead_time,
                unit_price,
                discount_percent,
                promotion,
            )
        except Exception:
            model_prediction = None

    risk = assess_risk(
        inventory_level=current_stock,
        predicted_demand=predicted,
        supplier_lead_time=lead_time,
        period_days=30,
    )
    recommendation = recommend_reorder(
        inventory_level=current_stock,
        predicted_demand=predicted,
        risk_level=risk["risk_level"],
        min_stock_level=min_stock_level,
        supplier_lead_time_days=lead_time,
        period_days=30,
    )

    return {
        "product_id": product_id,
        "product_name": product_name,
        "current_stock": current_stock,
        "forecast": {
            "predicted_demand": predicted,
            "method": method,
            "trend_prediction": trend["predicted_demand"],
            "model_prediction": model_prediction,
            "history": trend.get("history", []),
            "slope": trend.get("slope"),
            "r2": trend.get("r2"),
        },
        "risk": risk,
        "recommendation": recommendation,
    }


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    if not req.sales_history:
        raise HTTPException(status_code=400, detail="sales_history must not be empty")

    return _pipeline(
        product_id=req.product_id,
        product_name=req.product_name,
        current_stock=req.current_stock,
        min_stock_level=req.min_stock_level,
        lead_time=req.supplier_lead_time_days,
        sales_history=[s.model_dump() for s in req.sales_history],
        unit_price=req.unit_price,
        discount_percent=req.discount_percent,
        promotion=req.promotion,
    )


@app.post("/predict")
def predict_inventory(data: InventoryRequest):
    predicted_demand = forecast_with_model(
        data.inventory_level,
        data.units_sold,
        data.units_ordered,
        data.supplier_lead_time,
        data.price,
        data.discount_percent,
        data.promotion,
    )
    risk = assess_risk(data.inventory_level, predicted_demand, data.supplier_lead_time)
    reorder = recommend_reorder(data.inventory_level, predicted_demand, risk["risk_level"])
    return {
        "predicted_demand": predicted_demand,
        "risk_level": risk["risk_level"],
        "risk_score": risk["risk_score"],
        "recommendation": reorder["recommendation"],
        "reorder_quantity": reorder["quantity"],
        "priority": reorder["priority"],
        "reason": reorder["reason"],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
