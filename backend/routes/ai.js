const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/aiController");

router.get("/recommend/:productId", ctrl.getRecommendation);
router.get("/recommend", ctrl.getAllRecommendations);

module.exports = router;
