// Google Maps configuration file
// This file provides a consistent configuration for the Google Maps loader across the application

// List of libraries used by the application
export const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry'];

// API key from environment variables (should be set in .env file)
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Default map options
export const MAP_OPTIONS = {
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

// Default map style
export const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "calc(100vh - 160px)",
};

// Default center position (San Francisco)
export const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 }; 