// Populates the database with sample products, a supplier, and historical
// sales so the AI recommendations page has something to analyze out of the box.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./db");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const Sale = require("../models/Sale");

const run = async () => {
  await connectDB();

  await Promise.all([Product.deleteMany({}), Supplier.deleteMany({}), Sale.deleteMany({})]);

  const supplier = await Supplier.create({
    name: "TechDistributors Lanka",
    leadTimeDays: 30,
    deliveryPerformance: 85,
    productAvailability: "Medium",
  });

  const laptop = await Product.create({
    name: "Laptop",
    category: "Electronics",
    unitPrice: 250000,
    minStockLevel: 50,
    maxStockLevel: 600,
    currentStock: 150,
    supplier: supplier._id,
  });

  const mouse = await Product.create({
    name: "Wireless Mouse",
    category: "Electronics",
    unitPrice: 2500,
    minStockLevel: 100,
    maxStockLevel: 1000,
    currentStock: 400,
    supplier: supplier._id,
  });

  // Rising demand for laptops -> should trigger a HIGH/CRITICAL risk + reorder,
  // mirroring the worked example in the project proposal.
  const laptopSales = [100, 150, 200, 280, 350].map((qty, i) => ({
    product: laptop._id,
    date: new Date(2026, i, 10),
    quantitySold: qty,
    sellingPrice: 255000,
    season: "Normal",
  }));

  // Stable, low demand for mice -> should stay low-risk / no reorder.
  const mouseSales = [120, 110, 130, 115, 125].map((qty, i) => ({
    product: mouse._id,
    date: new Date(2026, i, 10),
    quantitySold: qty,
    sellingPrice: 2600,
    season: "Normal",
  }));

  await Sale.insertMany([...laptopSales, ...mouseSales]);

  console.log("Seed data created successfully.");
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
