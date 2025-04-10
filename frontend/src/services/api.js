import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Routes API service
export const routesService = {
  // Calculate optimal route
  calculateRoute: (source, destination, algorithm = "a-star", transportMode = "driving") => {
    return apiClient.post("/routes/calculate", {
      source,
      destination,
      algorithm,
      transportMode,
    });
  },

  // Calculate route with preferences
  calculateRouteWithPreferences: (source, destination, preferences) => {
    return apiClient.post("/routes/preferences", {
      source,
      destination,
      preferences,
    });
  },

  // Get offline route data
  getOfflineRoute: (routeId) => {
    return apiClient.get(`/routes/offline/${routeId}`);
  },

  // Save route for offline access
  saveRouteForOffline: (routeData) => {
    return apiClient.post("/routes/save", routeData);
  },
};

// Predictions API service
export const predictionsService = {
  // Predict travel time
  predictTravelTime: (
    source,
    destination,
    departureTime,
    trafficModel = "best_guess"
  ) => {
    return apiClient.post("/predictions/travel-time", {
      source,
      destination,
      departureTime,
      traffic: trafficModel,
    });
  },

  // Predict traffic conditions
  predictTraffic: (route, time) => {
    return apiClient.post("/predictions/traffic", {
      route,
      time,
    });
  },

  // Get historical travel data
  getHistoricalData: (source, destination, limit = 10) => {
    return apiClient.get("/predictions/historical-data", {
      params: { source, destination, limit },
    });
  },
};

// Simple placeholder service for future implementation
export const placesService = {
  getNearbyPlaces: (location, type, radius) => {
    return Promise.resolve({
      data: {
        places: [],
      },
    });
  },
};

export default { routesService, placesService, predictionsService };
