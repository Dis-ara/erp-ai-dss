const InventoryTransaction = require("../models/InventoryTransaction");
const Product = require("../models/Product");

exports.getTransactions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.product) filter.product = req.query.product;
    const transactions = await InventoryTransaction.find(filter)
      .populate("product")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Records a stock IN/OUT transaction and updates the product's currentStock.
exports.createTransaction = async (req, res) => {
  try {
    const { product, type, quantity, location, note } = req.body;

    const productDoc = await Product.findById(product);
    if (!productDoc) return res.status(404).json({ error: "Product not found" });

    if (type === "IN") {
      productDoc.currentStock += quantity;
    } else if (type === "OUT") {
      if (productDoc.currentStock < quantity) {
        return res.status(400).json({ error: "Insufficient stock for this OUT transaction" });
      }
      productDoc.currentStock -= quantity;
    } else {
      return res.status(400).json({ error: "type must be IN or OUT" });
    }

    await productDoc.save();
    const transaction = await InventoryTransaction.create({
      product,
      type,
      quantity,
      location,
      note,
    });

    res.status(201).json({ transaction, updatedStock: productDoc.currentStock });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Simple dashboard summary of inventory status
exports.getInventorySummary = async (req, res) => {
  try {
    const products = await Product.find();
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.currentStock * p.unitPrice,
      0
    );
    const lowStock = products.filter((p) => p.currentStock <= p.minStockLevel && p.currentStock > 0);
    const outOfStock = products.filter((p) => p.currentStock === 0);

    res.json({
      totalProducts,
      totalInventoryValue,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      lowStockProducts: lowStock,
      outOfStockProducts: outOfStock,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await InventoryTransaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    // Revert the stock effect on the product
    const productDoc = await Product.findById(transaction.product);
    if (productDoc) {
      if (transaction.type === "IN") {
        productDoc.currentStock = Math.max(0, productDoc.currentStock - transaction.quantity);
      } else if (transaction.type === "OUT") {
        productDoc.currentStock += transaction.quantity;
      }
      await productDoc.save();
    }

    await InventoryTransaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Transaction deleted successfully", updatedStock: productDoc ? productDoc.currentStock : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

