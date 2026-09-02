const Sale = require("../models/Sale");

exports.getSales = async (req, res) => {
  try {
    const filter = {};
    if (req.query.product) filter.product = req.query.product;
    const sales = await Sale.find(filter).populate("product").sort({ date: 1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSale = async (req, res) => {
  try {
    const sale = await Sale.create(req.body);
    res.status(201).json(sale);
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
