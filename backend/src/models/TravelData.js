const mongoose = require("mongoose");

const travelDataSchema = new mongoose.Schema({
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
  distance: {
    type: Number, // in meters
    required: true,
  },
  duration: {
    type: Number, // in seconds
    required: true,
  },
  departureTime: {
    type: Date,
    required: true,
  },
  arrivalTime: {
    type: Date,
    required: true,
  },
  trafficConditions: {
    type: String,
    enum: ["light", "moderate", "heavy"],
    default: "moderate",
  },
  weatherConditions: {
    type: String,
    enum: ["clear", "rain", "snow", "fog", "storm"],
    default: "clear",
  },
  dayOfWeek: {
    type: Number, // 0 = Sunday, 1 = Monday, etc.
    min: 0,
    max: 6,
    required: true,
  },
  isHoliday: {
    type: Boolean,
    default: false,
  },
  isRushHour: {
    type: Boolean,
    default: false,
  },
  travelMode: {
    type: String,
    enum: ["driving", "walking", "bicycling", "transit"],
    default: "driving",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for querying
travelDataSchema.index({ "source.location": "2dsphere" });
travelDataSchema.index({ "destination.location": "2dsphere" });
travelDataSchema.index({ date: -1 });
travelDataSchema.index({ dayOfWeek: 1 });
travelDataSchema.index({ departureTime: 1 });

const TravelData = mongoose.model("TravelData", travelDataSchema);

module.exports = TravelData;
