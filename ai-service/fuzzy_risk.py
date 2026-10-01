"""Inventory risk using scikit-fuzzy when available, with a ratio fallback.

Predicted demand is treated as the next sales-period volume (same cadence as
the history, typically monthly). Lead time is converted into covering periods.
"""


def _coverage(inventory_level, predicted_demand, supplier_lead_time, period_days=30.0):
    demand_per_day = float(predicted_demand) / max(float(period_days), 1.0)
    required = demand_per_day * max(float(supplier_lead_time), 1.0)
    if required <= 0:
        return 2.0, 0.0
    return min(max(float(inventory_level) / required, 0.0), 2.0), required


def _ratio_risk(inventory_level, predicted_demand, supplier_lead_time, period_days=30.0):
    coverage, required = _coverage(inventory_level, predicted_demand, supplier_lead_time, period_days)
    if required <= 0:
        return {"risk_level": "LOW", "risk_score": 0, "method": "ratio", "stock_ratio": 2.0}

    if coverage < 0.5:
        risk_level, risk_score = "CRITICAL", 90
    elif coverage < 0.75:
        risk_level, risk_score = "HIGH", 75
    elif coverage < 1.0:
        risk_level, risk_score = "MEDIUM", 50
    else:
        risk_level, risk_score = "LOW", 20

    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "method": "ratio",
        "stock_ratio": round(float(coverage), 3),
        "required_stock": round(float(required), 2),
    }


def _fuzzy_risk(inventory_level, predicted_demand, supplier_lead_time, period_days=30.0):
    import numpy as np
    import skfuzzy as fuzz
    from skfuzzy import control as ctrl

    coverage, required = _coverage(inventory_level, predicted_demand, supplier_lead_time, period_days)
    lead = min(max(float(supplier_lead_time), 0.0), 60.0)

    coverage_in = ctrl.Antecedent(np.arange(0, 2.01, 0.01), "coverage")
    lead_in = ctrl.Antecedent(np.arange(0, 60.01, 0.1), "lead")
    risk_out = ctrl.Consequent(np.arange(0, 101, 1), "risk")

    coverage_in["low"] = fuzz.trimf(coverage_in.universe, [0, 0, 0.7])
    coverage_in["medium"] = fuzz.trimf(coverage_in.universe, [0.4, 1.0, 1.4])
    coverage_in["high"] = fuzz.trimf(coverage_in.universe, [1.0, 2.0, 2.0])

    lead_in["short"] = fuzz.trimf(lead_in.universe, [0, 0, 14])
    lead_in["medium"] = fuzz.trimf(lead_in.universe, [7, 21, 35])
    lead_in["long"] = fuzz.trimf(lead_in.universe, [28, 60, 60])

    risk_out["LOW"] = fuzz.trimf(risk_out.universe, [0, 0, 35])
    risk_out["MEDIUM"] = fuzz.trimf(risk_out.universe, [20, 45, 70])
    risk_out["HIGH"] = fuzz.trimf(risk_out.universe, [55, 75, 90])
    risk_out["CRITICAL"] = fuzz.trimf(risk_out.universe, [80, 100, 100])

    rules = [
        ctrl.Rule(coverage_in["low"] & lead_in["long"], risk_out["CRITICAL"]),
        ctrl.Rule(coverage_in["low"] & lead_in["medium"], risk_out["HIGH"]),
        ctrl.Rule(coverage_in["low"] & lead_in["short"], risk_out["HIGH"]),
        ctrl.Rule(coverage_in["medium"] & lead_in["long"], risk_out["HIGH"]),
        ctrl.Rule(coverage_in["medium"] & lead_in["medium"], risk_out["MEDIUM"]),
        ctrl.Rule(coverage_in["medium"] & lead_in["short"], risk_out["MEDIUM"]),
        ctrl.Rule(coverage_in["high"] & lead_in["long"], risk_out["MEDIUM"]),
        ctrl.Rule(coverage_in["high"] & lead_in["medium"], risk_out["LOW"]),
        ctrl.Rule(coverage_in["high"] & lead_in["short"], risk_out["LOW"]),
    ]

    system = ctrl.ControlSystem(rules)
    sim = ctrl.ControlSystemSimulation(system)
    sim.input["coverage"] = float(coverage)
    sim.input["lead"] = lead
    sim.compute()
    score = float(sim.output["risk"])

    if score >= 80:
        level = "CRITICAL"
    elif score >= 60:
        level = "HIGH"
    elif score >= 35:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "risk_level": level,
        "risk_score": round(score, 1),
        "method": "fuzzy",
        "stock_ratio": round(float(coverage), 3),
        "required_stock": round(float(required), 2),
    }


def assess_risk(inventory_level=None, predicted_demand=None, supplier_lead_time=None, **kwargs):
    if inventory_level is None:
        inventory_level = kwargs.get("current_stock", 0)
    if supplier_lead_time is None:
        supplier_lead_time = kwargs.get("supplier_lead_time_days", 7)
    predicted_demand = predicted_demand if predicted_demand is not None else 0
    period_days = kwargs.get("period_days", 30.0)

    try:
        return _fuzzy_risk(inventory_level, predicted_demand, supplier_lead_time, period_days)
    except Exception:
        return _ratio_risk(inventory_level, predicted_demand, supplier_lead_time, period_days)
