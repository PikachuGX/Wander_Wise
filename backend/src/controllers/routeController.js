const Route = require("../models/Route");
const dijkstra = require("../utils/dijkstra");
const aStar = require("../utils/aStar");
const bfs = require("../utils/bfs");
const dfs = require("../utils/dfs");

/**
 * Calculate optimal route using Dijkstra or A* algorithm
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.calculateRoute = async (req, res) => {
  try {
    const { source, destination, algorithm = "a-star", transportMode = "driving" } = req.body;

    if (!source || !destination) {
      return res
        .status(400)
        .json({ message: "Source and destination are required" });
    }

    // Get speed based on transport mode
    const transportSpeeds = {
      "driving": 50,
      "flying": 800,
      "walking": 5,
      "transit": 35,
    };
    
    const avgSpeed = transportSpeeds[transportMode] || 50;
    const options = { avgSpeed, transportMode };

    // Choose algorithm based on request
    let route;
    if (algorithm === "dijkstra") {
      route = dijkstra.findShortestPath(source, destination, options);
    } else if (algorithm === "bfs") {
      route = bfs.findPath(source, destination, options);
    } else if (algorithm === "dfs") {
      route = dfs.findPath(source, destination, options);
    } else {
      route = aStar.findOptimalPath(source, destination, options);
    }

    return res.status(200).json({
      success: true,
      route: {
        path: route.path,
        distance: route.distance,
        estimatedTime: route.estimatedTime,
        points: route.points,
        algorithm: algorithm,
        transportMode: transportMode,
      },
    });
  } catch (error) {
    console.error("Error calculating route:", error);
    return res
      .status(500)
      .json({ message: "Error calculating route", error: error.message });
  }
};

/**
 * Calculate route with specific preferences
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.calculateRouteWithPreferences = async (req, res) => {
  try {
    const { source, destination, preferences } = req.body;

    if (!source || !destination) {
      return res
        .status(400)
        .json({ message: "Source and destination are required" });
    }

    // Apply preferences to algorithm
    const route = aStar.findOptimalPath(source, destination, preferences);

    return res.status(200).json({
      success: true,
      route: {
        path: route.path,
        distance: route.distance,
        estimatedTime: route.estimatedTime,
        points: route.points,
        preferences: preferences,
      },
    });
  } catch (error) {
    console.error("Error calculating route with preferences:", error);
    return res
      .status(500)
      .json({ message: "Error calculating route", error: error.message });
  }
};

/**
 * Get pre-downloaded route data for offline mode
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getOfflineRouteData = async (req, res) => {
  try {
    const { routeId } = req.params;

    if (!routeId) {
      return res.status(400).json({ message: "Route ID is required" });
    }

    const route = await Route.findById(routeId);

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    return res.status(200).json({
      success: true,
      route,
    });
  } catch (error) {
    console.error("Error getting offline route data:", error);
    return res
      .status(500)
      .json({ message: "Error retrieving route data", error: error.message });
  }
};

/**
 * Save route for offline access
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.saveRouteForOffline = async (req, res) => {
  try {
    const { source, destination, path, points } = req.body;

    if (!source || !destination || !path || !points) {
      return res.status(400).json({ message: "All route data is required" });
    }

    const route = new Route({
      source,
      destination,
      path,
      points,
      createdAt: new Date(),
    });

    await route.save();

    return res.status(201).json({
      success: true,
      routeId: route._id,
      message: "Route saved for offline access",
    });
  } catch (error) {
    console.error("Error saving route for offline:", error);
    return res
      .status(500)
      .json({ message: "Error saving route", error: error.message });
  }
};
