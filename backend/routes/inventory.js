const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/inventoryController");

router.get("/transactions", ctrl.getTransactions);
router.post("/transactions", ctrl.createTransaction);
router.get("/summary", ctrl.getInventorySummary);

module.exports = router;
