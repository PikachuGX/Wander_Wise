const express = require("express");
const router = express.Router();
const routeController = require("../controllers/routeController");

/**
 * @route POST /api/routes/calculate
 * @desc Calculate optimal route using Dijkstra/A* algorithm
 * @access Public
 */
router.post("/calculate", routeController.calculateRoute);

/**
 * @route POST /api/routes/preferences
 * @desc Calculate route with preferences (no tolls, shortest, safest, scenic)
 * @access Public
 */
router.post("/preferences", routeController.calculateRouteWithPreferences);

/**
 * @route GET /api/routes/offline/:routeId
 * @desc Get pre-downloaded route data for offline mode
 * @access Public
 */
router.get("/offline/:routeId", routeController.getOfflineRouteData);

/**
 * @route POST /api/routes/save
 * @desc Save route for offline access
 * @access Public
 */
router.post("/save", routeController.saveRouteForOffline);

module.exports = router;
