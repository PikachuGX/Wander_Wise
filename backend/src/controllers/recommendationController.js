const Place = require("../models/Place");
const axios = require("axios");

/**
 * Get recommendations for places (hotels, restaurants, gas stations)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getPlaceRecommendations = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, type = "all" } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    // In a real system, this would use the ML model from ml_models
    // Here we're just querying a simulated database or using Google Places API

    // Mocked response for demonstration
    const places = await Place.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: radius,
        },
      },
      ...(type !== "all" && { type }),
    }).limit(20);

    return res.status(200).json({
      success: true,
      places,
    });
  } catch (error) {
    console.error("Error getting place recommendations:", error);
    return res
      .status(500)
      .json({
        message: "Error fetching recommendations",
        error: error.message,
      });
  }
};

/**
 * Get hotel recommendations
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getHotelRecommendations = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, priceLevel } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    // Build query
    const query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: radius,
        },
      },
      type: "hotel",
    };

    if (priceLevel) {
      query.priceLevel = { $lte: parseInt(priceLevel) };
    }

    const hotels = await Place.find(query).limit(10);

    return res.status(200).json({
      success: true,
      hotels,
    });
  } catch (error) {
    console.error("Error getting hotel recommendations:", error);
    return res
      .status(500)
      .json({
        message: "Error fetching hotel recommendations",
        error: error.message,
      });
  }
};

/**
 * Get restaurant recommendations
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getRestaurantRecommendations = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, cuisine } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    // Build query
    const query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: radius,
        },
      },
      type: "restaurant",
    };

    if (cuisine) {
      query.cuisine = cuisine;
    }

    const restaurants = await Place.find(query).limit(10);

    return res.status(200).json({
      success: true,
      restaurants,
    });
  } catch (error) {
    console.error("Error getting restaurant recommendations:", error);
    return res
      .status(500)
      .json({
        message: "Error fetching restaurant recommendations",
        error: error.message,
      });
  }
};

/**
 * Get gas station recommendations
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getGasStationRecommendations = async (req, res) => {
  try {
    const { route, maxDetour = 2000 } = req.query;

    if (!route) {
      return res.status(400).json({ message: "Route is required" });
    }

    // Parse route points
    const routePoints = JSON.parse(route);

    // In real app, would find gas stations with minimum detour from route
    // For now, mocking the response
    const gasStations = await Place.find({
      type: "gas_station",
      // Complex query to find places near route would go here
    }).limit(5);

    return res.status(200).json({
      success: true,
      gasStations,
    });
  } catch (error) {
    console.error("Error getting gas station recommendations:", error);
    return res
      .status(500)
      .json({
        message: "Error fetching gas station recommendations",
        error: error.message,
      });
  }
};
