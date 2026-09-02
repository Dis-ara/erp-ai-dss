"""
Fuzzy Logic Inventory Risk Assessment module.

Inputs: current stock (relative to a reasonable max reference), predicted
demand, and supplier lead time (days).
Output: a crisp risk score 0-100 plus a linguistic risk category, derived
from Mamdani-style fuzzy rules (as outlined in the project proposal).
"""

import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

# Universe ranges - tuned generically; stock/demand are expressed as a ratio
# so the same rule base works across products with very different volumes.
stock_ratio = ctrl.Antecedent(np.arange(0, 3.01, 0.01), "stock_ratio")  # current_stock / predicted_demand
lead_time = ctrl.Antecedent(np.arange(0, 61, 1), "lead_time")  # days
risk = ctrl.Consequent(np.arange(0, 101, 1), "risk")

# Membership functions
stock_ratio["low"] = fuzz.trimf(stock_ratio.universe, [0, 0, 0.8])
stock_ratio["medium"] = fuzz.trimf(stock_ratio.universe, [0.5, 1.0, 1.5])
stock_ratio["high"] = fuzz.trimf(stock_ratio.universe, [1.2, 3.0, 3.0])

lead_time["short"] = fuzz.trimf(lead_time.universe, [0, 0, 15])
lead_time["medium"] = fuzz.trimf(lead_time.universe, [10, 22, 35])
lead_time["long"] = fuzz.trimf(lead_time.universe, [25, 60, 60])

risk["low"] = fuzz.trimf(risk.universe, [0, 0, 40])
risk["medium"] = fuzz.trimf(risk.universe, [25, 50, 75])
risk["high"] = fuzz.trimf(risk.universe, [60, 80, 100])
risk["critical"] = fuzz.trimf(risk.universe, [85, 100, 100])

rules = [
    ctrl.Rule(stock_ratio["low"] & lead_time["long"], risk["critical"]),
    ctrl.Rule(stock_ratio["low"] & lead_time["medium"], risk["high"]),
    ctrl.Rule(stock_ratio["low"] & lead_time["short"], risk["medium"]),
    ctrl.Rule(stock_ratio["medium"] & lead_time["long"], risk["high"]),
    ctrl.Rule(stock_ratio["medium"] & lead_time["medium"], risk["medium"]),
    ctrl.Rule(stock_ratio["medium"] & lead_time["short"], risk["low"]),
    ctrl.Rule(stock_ratio["high"] & lead_time["long"], risk["medium"]),
    ctrl.Rule(stock_ratio["high"] & lead_time["medium"], risk["low"]),
    ctrl.Rule(stock_ratio["high"] & lead_time["short"], risk["low"]),
]

risk_ctrl_system = ctrl.ControlSystem(rules)


def _categorize(score):
    if score >= 85:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    return "LOW"


def assess_risk(current_stock, predicted_demand, supplier_lead_time_days):
    """
    Returns: {"risk_score": float, "risk_level": str}
    """
    # Avoid division by zero; if there's no predicted demand, ratio is capped high (safe)
    ratio = current_stock / predicted_demand if predicted_demand > 0 else 3.0
    ratio = min(ratio, 3.0)
    lead = min(max(supplier_lead_time_days, 0), 60)

    sim = ctrl.ControlSystemSimulation(risk_ctrl_system)
    sim.input["stock_ratio"] = ratio
    sim.input["lead_time"] = lead
    sim.compute()

    score = float(sim.output["risk"])
    return {"risk_score": round(score, 2), "risk_level": _categorize(score)}
