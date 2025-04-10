const TravelData = require("../models/TravelData");
const axios = require("axios");

/**
 * Predict travel time based on route
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.predictTravelTime = async (req, res) => {
  try {
    const {
      source,
      destination,
      departureTime,
      traffic = "best_guess",
    } = req.body;

    if (!source || !destination) {
      return res
        .status(400)
        .json({ message: "Source and destination are required" });
    }

    // In a real system, this would call the ML prediction model
    // Here we're calculating based on simpler factors or using Google's API

    // Placeholder for ML model call
    // const predictionModel = require('../../ml_models/travel_time_prediction');
    // const predictedTime = predictionModel.predict(source, destination, departureTime);

    // For now, simulating a prediction
    // In real app, we would:
    // 1. Retrieve historical data for this route
    // 2. Apply trained ML model
    // 3. Return prediction

    const distance = 100; // in km, would be calculated based on route
    const baseSpeed = 60; // km/h

    let speedFactor = 1;
    if (traffic === "pessimistic") {
      speedFactor = 0.7;
    } else if (traffic === "optimistic") {
      speedFactor = 1.2;
    }

    const predictedTime = (distance / (baseSpeed * speedFactor)) * 60; // in minutes

    return res.status(200).json({
      success: true,
      prediction: {
        travelTimeMinutes: Math.round(predictedTime),
        distance: distance,
        confidence: 0.85,
        departureTime: departureTime || new Date().toISOString(),
        trafficModel: traffic,
      },
    });
  } catch (error) {
    console.error("Error predicting travel time:", error);
    return res
      .status(500)
      .json({ message: "Error making prediction", error: error.message });
  }
};

/**
 * Predict traffic conditions
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.predictTraffic = async (req, res) => {
  try {
    const { route, time } = req.body;

    if (!route) {
      return res.status(400).json({ message: "Route is required" });
    }

    // Mock data - in a real app would be from ML model
    const trafficPrediction = {
      congestionLevel: "moderate",
      averageSpeed: 45, // km/h
      delayProbability: 0.3,
      segments: [
        { start: route[0], end: route[1], congestion: "low" },
        { start: route[1], end: route[2], congestion: "high" },
      ],
    };

    return res.status(200).json({
      success: true,
      prediction: trafficPrediction,
    });
  } catch (error) {
    console.error("Error predicting traffic:", error);
    return res
      .status(500)
      .json({ message: "Error predicting traffic", error: error.message });
  }
};

/**
 * Get historical travel data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getHistoricalData = async (req, res) => {
  try {
    const { source, destination, limit = 10 } = req.query;

    if (!source || !destination) {
      return res
        .status(400)
        .json({ message: "Source and destination are required" });
    }

    // Fetch historical travel data
    const historicalData = await TravelData.find({
      source,
      destination,
    })
      .sort({ date: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data: historicalData,
    });
  } catch (error) {
    console.error("Error getting historical data:", error);
    return res
      .status(500)
      .json({
        message: "Error fetching historical data",
        error: error.message,
      });
  }
};
