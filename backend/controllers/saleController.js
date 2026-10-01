const Sale = require("../models/Sale");
const Product = require("../models/Product");

exports.getSales = async (req, res) => {
  try {
    const filter = {};
    if (req.query.product) filter.product = req.query.product;
    const sales = await Sale.find(filter).populate("product").sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSale = async (req, res) => {
  try {
    const { product, date, quantitySold, sellingPrice, season } = req.body;
    const productDoc = await Product.findById(product);
    if (!productDoc) return res.status(404).json({ error: "Product not found" });

    const qty = Number(quantitySold);
    if (!qty || qty <= 0) return res.status(400).json({ error: "quantitySold must be greater than 0" });
    if (productDoc.currentStock < qty) {
      return res.status(400).json({ error: "Insufficient stock to record this sale" });
    }

    productDoc.currentStock -= qty;
    await productDoc.save();

    const sale = await Sale.create({
      product,
      date: date || new Date(),
      quantitySold: qty,
      sellingPrice: Number(sellingPrice),
      season,
    });

    res.status(201).json({ sale, updatedStock: productDoc.currentStock });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.bulkCreateSales = async (req, res) => {
  try {
    const sales = await Sale.insertMany(req.body);
    res.status(201).json(sales);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
