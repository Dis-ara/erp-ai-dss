const axios = require("axios");
const Product = require("../models/Product");
const Sale = require("../models/Sale");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

function buildPayload(product, sales) {
  return {
    product_id: product._id.toString(),
    product_name: product.name,
    current_stock: product.currentStock,
    min_stock_level: product.minStockLevel,
    supplier_lead_time_days: product.supplier ? product.supplier.leadTimeDays : 7,
    unit_price: product.unitPrice || 0,
    sales_history: sales.map((s) => ({
      date: s.date.toISOString().slice(0, 10),
      quantity_sold: s.quantitySold,
    })),
  };
}

exports.getRecommendation = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).populate("supplier");
    if (!product) return res.status(404).json({ error: "Product not found" });

    const sales = await Sale.find({ product: productId }).sort({ date: 1 });
    if (sales.length === 0) {
      return res.status(400).json({ error: "No historical sales data for this product yet" });
    }

    const { data } = await axios.post(`${AI_SERVICE_URL}/analyze`, buildPayload(product, sales), {
      timeout: 20000,
    });
    res.json(data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(502).json({
      error: "AI service unavailable. Start the Python service on port 8000.",
      detail: err.message,
    });
  }
};

exports.getAllRecommendations = async (req, res) => {
  try {
    const products = await Product.find().populate("supplier");
    const results = [];

    for (const product of products) {
      const sales = await Sale.find({ product: product._id }).sort({ date: 1 });
      if (sales.length === 0) continue;

      try {
        const { data } = await axios.post(
          `${AI_SERVICE_URL}/analyze`,
          buildPayload(product, sales),
          { timeout: 20000 }
        );
        results.push(data);
      } catch (innerErr) {
        results.push({
          product_id: product._id.toString(),
          product_name: product.name,
          error: innerErr.response?.data?.detail || innerErr.message || "AI analysis failed",
        });
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
