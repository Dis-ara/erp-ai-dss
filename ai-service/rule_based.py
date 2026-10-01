"""Rule-based reorder recommendation with explainable reason text."""


def recommend_reorder(
    inventory_level=None,
    predicted_demand=None,
    risk_level="LOW",
    min_stock_level=0,
    **kwargs,
):
    if inventory_level is None:
        inventory_level = kwargs.get("current_stock", 0)
    predicted_demand = predicted_demand if predicted_demand is not None else 0
    min_stock_level = kwargs.get("min_stock_level", min_stock_level) or 0
    lead_time = float(kwargs.get("supplier_lead_time_days", kwargs.get("supplier_lead_time", 7)) or 7)
    period_days = float(kwargs.get("period_days", 30) or 30)

    lead_demand = predicted_demand * (lead_time / period_days)
    target = max(lead_demand + min_stock_level, predicted_demand, min_stock_level)
    shortfall = max(target - inventory_level, 0)
    below_min = inventory_level <= min_stock_level

    def pack(action, quantity, priority, reason):
        return {
            "recommendation": action.replace("_", " "),
            "action": action,
            "quantity": int(round(quantity)),
            "recommended_quantity": int(round(quantity)),
            "priority": priority,
            "reason": reason,
        }

    if risk_level == "CRITICAL" or (below_min and predicted_demand > inventory_level):
        return pack(
            "URGENT_REORDER",
            max(shortfall, 1) if shortfall == 0 and below_min else shortfall,
            "HIGH",
            "Stock cannot cover forecasted demand across supplier lead time. Reorder before a stock-out.",
        )

    if risk_level == "HIGH":
        return pack(
            "REORDER",
            shortfall,
            "HIGH",
            "High stock-out risk versus lead-time demand. Place a replenishment order.",
        )

    if risk_level == "MEDIUM" or below_min:
        return pack(
            "REORDER",
            shortfall,
            "MEDIUM",
            "Inventory is tight versus demand or the minimum stock policy. Plan a replenishment.",
        )

    return pack(
        "NO_REORDER",
        0,
        "LOW",
        "Current stock covers predicted lead-time demand and sits above the minimum stock level.",
    )
