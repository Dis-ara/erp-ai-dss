"""
Rule-Based Reasoning module for reorder recommendations.

Combines the forecasted demand and the fuzzy risk assessment into an
explainable recommendation, following the rules described in the project
proposal (section 7.3).
"""


def recommend_reorder(current_stock, predicted_demand, risk_level, min_stock_level=0):
    """
    Returns: {
        "action": "NO_REORDER" | "REORDER" | "URGENT_REORDER",
        "recommended_quantity": float,
        "priority": "LOW" | "MEDIUM" | "HIGH",
        "reason": str
    }
    """
    shortfall = predicted_demand - current_stock
    safety_stock = max(min_stock_level, 0.1 * predicted_demand)

    if predicted_demand <= current_stock and risk_level in ("LOW", "MEDIUM"):
        return {
            "action": "NO_REORDER",
            "recommended_quantity": 0,
            "priority": "LOW",
            "reason": "Current stock covers predicted demand and risk is acceptable.",
        }

    if risk_level == "CRITICAL" or (shortfall > 0 and risk_level == "HIGH"):
        quantity = max(shortfall + safety_stock, safety_stock)
        return {
            "action": "URGENT_REORDER",
            "recommended_quantity": round(quantity, 2),
            "priority": "HIGH",
            "reason": "Predicted demand exceeds current stock and inventory risk is high/critical.",
        }

    if shortfall > 0 or risk_level == "HIGH":
        quantity = max(shortfall + safety_stock, safety_stock)
        return {
            "action": "REORDER",
            "recommended_quantity": round(quantity, 2),
            "priority": "MEDIUM",
            "reason": "Predicted demand is close to or above current stock, or risk is elevated.",
        }

    return {
        "action": "NO_REORDER",
        "recommended_quantity": 0,
        "priority": "LOW",
        "reason": "No immediate reorder need identified.",
    }
