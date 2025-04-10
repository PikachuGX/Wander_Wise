const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: {
      type: String,
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  address: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["hotel", "restaurant", "gas_station", "attraction", "rest_area"],
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  priceLevel: {
    type: Number,
    min: 1,
    max: 4,
    default: 2,
  },
  cuisine: {
    type: String,
    required: function () {
      return this.type === "restaurant";
    },
  },
  amenities: {
    type: [String],
    default: [],
  },
  photos: {
    type: [String],
    default: [],
  },
  openNow: {
    type: Boolean,
    default: false,
  },
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for geospatial queries
placeSchema.index({ location: "2dsphere" });
placeSchema.index({ type: 1 });

const Place = mongoose.model("Place", placeSchema);

module.exports = Place;
