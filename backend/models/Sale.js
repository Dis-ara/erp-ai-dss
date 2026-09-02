const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    date: { type: Date, required: true },
    quantitySold: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    season: { type: String }, // e.g. "Q1", "Festive", "Normal"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", saleSchema);
