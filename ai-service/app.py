from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

from demand_forecasting import forecast_demand
from fuzzy_risk import assess_risk
from rule_based import recommend_reorder

app = FastAPI(
    title="ERP AI Decision Support Service",
    description="Demand forecasting + fuzzy risk assessment + rule-based reorder recommendation",
    version="1.0.0",
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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    if not req.sales_history:
        raise HTTPException(status_code=400, detail="sales_history must not be empty")

    sales_dicts = [s.dict() for s in req.sales_history]

    forecast = forecast_demand(sales_dicts)
    risk = assess_risk(
        current_stock=req.current_stock,
        predicted_demand=forecast["predicted_demand"],
        supplier_lead_time_days=req.supplier_lead_time_days,
    )
    recommendation = recommend_reorder(
        current_stock=req.current_stock,
        predicted_demand=forecast["predicted_demand"],
        risk_level=risk["risk_level"],
        min_stock_level=req.min_stock_level,
    )

    return {
        "product_id": req.product_id,
        "product_name": req.product_name,
        "current_stock": req.current_stock,
        "forecast": forecast,
        "risk": risk,
        "recommendation": recommendation,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
