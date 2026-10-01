require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const productRoutes = require("./routes/products");
const supplierRoutes = require("./routes/suppliers");
const saleRoutes = require("./routes/sales");
const inventoryRoutes = require("./routes/inventory");
const aiRoutes = require("./routes/ai");

const app = express();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());

app.get("/api/health", async (req, res) => {
  let ai = { status: "down" };
  try {
    const { data } = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 2500 });
    ai = { status: "ok", ...data };
  } catch (err) {
    ai = { status: "down", error: err.message };
  }

  res.json({
    status: "ok",
    mongo: mongoose.connection.readyState === 1 ? "ok" : "down",
    ai,
  });
});

app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/ai", aiRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`ERP DSS backend running on port ${PORT}`));
});
