const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/saleController");

router.get("/", ctrl.getSales);
router.post("/", ctrl.createSale);
router.post("/bulk", ctrl.bulkCreateSales);
router.delete("/:id", ctrl.deleteSale);

module.exports = router;

