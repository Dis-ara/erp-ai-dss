const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/productController");

router.get("/", ctrl.getProducts);
router.get("/:id", ctrl.getProduct);
router.post("/", ctrl.createProduct);
router.put("/:id", ctrl.updateProduct);
router.delete("/:id", ctrl.deleteProduct);

module.exports = router;
