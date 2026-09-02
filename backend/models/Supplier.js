const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    leadTimeDays: { type: Number, required: true, default: 7 },
    deliveryPerformance: { type: Number, min: 0, max: 100, default: 90 }, // % on-time deliveries
    productAvailability: { type: String, enum: ["High", "Medium", "Low"], default: "High" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);
