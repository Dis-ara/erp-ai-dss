const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    minStockLevel: { type: Number, required: true, default: 10 },
    maxStockLevel: { type: Number, required: true, default: 500 },
    currentStock: { type: Number, required: true, default: 0 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
