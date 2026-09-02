const axios = require("axios");
const Product = require("../models/Product");
const Sale = require("../models/Sale");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Builds the full AI recommendation for a single product by gathering its
// historical sales + supplier info, then calling the Python AI service.
exports.getRecommendation = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).populate("supplier");
    if (!product) return res.status(404).json({ error: "Product not found" });

    const sales = await Sale.find({ product: productId }).sort({ date: 1 });
    if (sales.length === 0) {
      return res.status(400).json({ error: "No historical sales data for this product yet" });
    }

    const payload = {
      product_id: product._id.toString(),
      product_name: product.name,
      current_stock: product.currentStock,
      min_stock_level: product.minStockLevel,
      supplier_lead_time_days: product.supplier ? product.supplier.leadTimeDays : 7,
      sales_history: sales.map((s) => ({
        date: s.date.toISOString().slice(0, 10),
        quantity_sold: s.quantitySold,
      })),
    };

    const { data } = await axios.post(`${AI_SERVICE_URL}/analyze`, payload);
    res.json(data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: err.message });
  }
};

// Runs the recommendation for every product, used to populate the dashboard.
exports.getAllRecommendations = async (req, res) => {
  try {
    const products = await Product.find().populate("supplier");
    const results = [];

    for (const product of products) {
      const sales = await Sale.find({ product: product._id }).sort({ date: 1 });
      if (sales.length === 0) continue;

      const payload = {
        product_id: product._id.toString(),
        product_name: product.name,
        current_stock: product.currentStock,
        min_stock_level: product.minStockLevel,
        supplier_lead_time_days: product.supplier ? product.supplier.leadTimeDays : 7,
        sales_history: sales.map((s) => ({
          date: s.date.toISOString().slice(0, 10),
          quantity_sold: s.quantitySold,
        })),
      };

      try {
        const { data } = await axios.post(`${AI_SERVICE_URL}/analyze`, payload);
        results.push(data);
      } catch (innerErr) {
        results.push({ product_id: product._id.toString(), error: "AI analysis failed" });
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
