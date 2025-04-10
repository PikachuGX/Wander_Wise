const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
  source: {
    name: { type: String, required: true },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
  },
  destination: {
    name: { type: String, required: true },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
  },
  path: {
    type: [[Number]], // Array of [lng, lat] coordinates
    required: true,
  },
  distance: {
    type: Number, // in meters
    required: true,
  },
  estimatedTime: {
    type: Number, // in seconds
    required: true,
  },
  preferences: {
    avoidTolls: { type: Boolean, default: false },
    avoidHighways: { type: Boolean, default: false },
    mode: {
      type: String,
      default: "driving",
      enum: ["driving", "walking", "bicycling", "transit"],
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for geospatial queries
routeSchema.index({ "source.location": "2dsphere" });
routeSchema.index({ "destination.location": "2dsphere" });

const Route = mongoose.model("Route", routeSchema);

module.exports = Route;
