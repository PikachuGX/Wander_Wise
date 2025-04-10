const express = require("express");
const router = express.Router();
const predictionController = require("../controllers/predictionController");

/**
 * @route POST /api/predictions/travel-time
 * @desc Predict travel time based on source, destination, and other factors
 * @access Public
 */
router.post("/travel-time", predictionController.predictTravelTime);

/**
 * @route POST /api/predictions/traffic
 * @desc Predict traffic conditions on a given route
 * @access Public
 */
router.post("/traffic", predictionController.predictTraffic);

/**
 * @route GET /api/predictions/historical-data
 * @desc Get historical travel time data for analysis
 * @access Public
 */
router.get("/historical-data", predictionController.getHistoricalData);

module.exports = router;
