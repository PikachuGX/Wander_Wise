const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");

/**
 * @route GET /api/recommendations/places
 * @desc Get recommendations for places (hotels, restaurants, gas stations)
 * @access Public
 */
router.get("/places", recommendationController.getPlaceRecommendations);

/**
 * @route GET /api/recommendations/hotels
 * @desc Get hotel recommendations near a specific location or along a route
 * @access Public
 */
router.get("/hotels", recommendationController.getHotelRecommendations);

/**
 * @route GET /api/recommendations/restaurants
 * @desc Get restaurant recommendations near a specific location or along a route
 * @access Public
 */
router.get(
  "/restaurants",
  recommendationController.getRestaurantRecommendations
);

/**
 * @route GET /api/recommendations/gas-stations
 * @desc Get gas station recommendations along a route
 * @access Public
 */
router.get(
  "/gas-stations",
  recommendationController.getGasStationRecommendations
);

module.exports = router;
