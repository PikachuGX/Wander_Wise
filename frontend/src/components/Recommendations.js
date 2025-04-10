import React, { useState, useEffect } from "react";
import {
  FaHotel,
  FaUtensils,
  FaGasPump,
  FaShoppingBag,
  FaStore,
  FaInfoCircle,
  FaDirections,
  FaMapMarkerAlt,
  FaTimes,
  FaLocationArrow,
} from "react-icons/fa";

const Recommendations = ({ userLocation }) => {
  const [selectedCategory, setSelectedCategory] = useState("hotels");
  const [searchRadius, setSearchRadius] = useState(5); // km
  const [isLoading, setIsLoading] = useState(false);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isAroundMe, setIsAroundMe] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    if (isAroundMe) {
      getCurrentLocation();
    } else if (userLocation) {
      fetchNearbyPlaces();
    }
  }, [userLocation, searchRadius, selectedCategory, isAroundMe]);

  // Get current user location
  const getCurrentLocation = () => {
    setLocationError(null);
    setIsLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "Your Current Location"
          };
          setCurrentLocation(location);
          fetchNearbyPlaces(location);
        },
        (error) => {
          setLocationError("Couldn't access your location. Please enable location services.");
          setIsLoading(false);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLoading(false);
    }
  };

  // Generate a unique location key
  const getLocationKey = (location, category) => {
    if (!location) return null;
    const roundToThreeDecimals = num => Math.round(num * 1000) / 1000;
    const lat = roundToThreeDecimals(location.lat);
    const lng = roundToThreeDecimals(location.lng);
    return `places_${lat}_${lng}_${category}`;
  };

  // Fetch nearby places from localStorage or generate new ones
  const fetchNearbyPlaces = async (location = null) => {
    // Use provided location or fallback to appropriate location based on mode
    const targetLocation = location || (isAroundMe ? currentLocation : userLocation);
    
    if (!targetLocation) return;

    setIsLoading(true);

    try {
      const locationKey = getLocationKey(targetLocation, selectedCategory);
      
      // Check if we already have data for this location in localStorage
      const storedPlaces = localStorage.getItem(locationKey);
      
      if (storedPlaces) {
        // Use cached places
        setPlaces(JSON.parse(storedPlaces));
        setIsLoading(false);
      } else {
        // Generate new mock places
        setTimeout(() => {
          const mockPlaces = generateMockPlaces(selectedCategory, 8, targetLocation);
          
          // Store the generated places in localStorage
          localStorage.setItem(locationKey, JSON.stringify(mockPlaces));
          
          setPlaces(mockPlaces);
          setIsLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Error fetching places:", error);
      setPlaces([]);
      setIsLoading(false);
    }
  };

  // Generate price ranges for different categories in Indian Rupees (₹)
  const getPriceRanges = (category, priceLevel) => {
    const priceRanges = {
      hotels: {
        1: { min: 1000, max: 2500 }, // Budget
        2: { min: 2500, max: 5000 }, // Standard
        3: { min: 5000, max: 10000 }, // Premium
        4: { min: 10000, max: 25000 }, // Luxury
      },
      restaurants: {
        1: { min: 200, max: 500 }, // Budget
        2: { min: 500, max: 1200 }, // Casual
        3: { min: 1200, max: 2500 }, // Fine dining
        4: { min: 2500, max: 5000 }, // Gourmet
      },
      gasStations: {
        1: { min: 90, max: 105 }, // Regular
        2: { min: 95, max: 110 }, // Premium
      },
      shops: {
        1: { min: 100, max: 500 }, // Budget
        2: { min: 500, max: 2000 }, // Mid-range
        3: { min: 2000, max: 7500 }, // Premium
        4: { min: 7500, max: 25000 }, // Luxury
      },
    };

    const range = priceRanges[category][priceLevel] || { min: 0, max: 0 };
    
    // Add some randomness within the range
    if (range.min !== range.max) {
      range.min = Math.round(range.min * (0.9 + Math.random() * 0.2));
      range.max = Math.round(range.max * (0.9 + Math.random() * 0.2));
    }
    
    return range;
  };

  // Generate mock places
  const generateMockPlaces = (category, count, location) => {
    const categoryData = {
      hotels: {
        names: [
          "Grand Hotel",
          "Comfort Inn",
          "Seaside Resort",
          "Mountain View Hotel",
          "City Center Lodge",
          "Sunset Hotel",
          "Riverside Inn",
          "Park Plaza",
        ],
        ratings: [4.7, 4.2, 4.8, 3.9, 4.5, 4.1, 3.8, 4.6],
        priceLevels: [3, 2, 4, 2, 3, 2, 1, 3],
        addresses: [
          "123 Main St",
          "456 Oak Ave",
          "789 Beach Rd",
          "321 Pine St",
          "555 Center Blvd",
          "888 Sunset Dr",
          "777 River Rd",
          "444 Park Ave",
        ],
      },
      restaurants: {
        names: [
          "Tasty Bites",
          "Ocean View Restaurant",
          "Mountain Grill",
          "City Bistro",
          "Sunset Cafe",
          "River House",
          "Park Diner",
          "Flavor Fusion",
        ],
        ratings: [4.5, 4.3, 4.6, 4.0, 4.2, 3.9, 4.1, 4.7],
        priceLevels: [2, 3, 2, 2, 1, 3, 1, 3],
        addresses: [
          "100 Food St",
          "200 Ocean Ave",
          "300 Mountain Rd",
          "400 City Blvd",
          "500 Sunset Dr",
          "600 River Rd",
          "700 Park Ave",
          "800 Fusion St",
        ],
      },
      gasStations: {
        names: [
          "Quick Gas",
          "Ocean Fuel",
          "Mountain Petrol",
          "City Gas",
          "Sunset Fuel",
          "River Gas",
          "Park Petrol",
          "Express Gas",
        ],
        ratings: [3.8, 4.0, 3.9, 3.7, 4.1, 3.6, 3.8, 4.2],
        priceLevels: [1, 2, 2, 1, 2, 1, 1, 2],
        addresses: [
          "150 Gas St",
          "250 Ocean Ave",
          "350 Mountain Rd",
          "450 City Blvd",
          "550 Sunset Dr",
          "650 River Rd",
          "750 Park Ave",
          "850 Express St",
        ],
      },
      shops: {
        names: [
          "City Market",
          "Ocean Shop",
          "Mountain Store",
          "Downtown Mall",
          "Sunset Shop",
          "River Market",
          "Park Store",
          "Express Shop",
        ],
        ratings: [4.2, 4.1, 4.3, 3.9, 4.0, 3.8, 4.1, 4.4],
        priceLevels: [2, 2, 3, 2, 1, 2, 2, 2],
        addresses: [
          "175 Market St",
          "275 Ocean Ave",
          "375 Mountain Rd",
          "475 City Blvd",
          "575 Sunset Dr",
          "675 River Rd",
          "775 Park Ave",
          "875 Express St",
        ],
      },
    };

    const data = categoryData[category];
    return Array.from({ length: count }, (_, i) => {
      const priceLevel = data.priceLevels[i % data.priceLevels.length];
      const priceRange = getPriceRanges(category, priceLevel);
      
      return {
        id: `place-${category}-${i}`,
        name: data.names[i % data.names.length],
        rating: data.ratings[i % data.ratings.length],
        user_ratings_total: Math.floor(Math.random() * 500) + 50,
        price_level: priceLevel,
        price_range: priceRange,
        vicinity: data.addresses[i % data.addresses.length],
        geometry: {
          location: {
            lat: location.lat + (Math.random() * 0.02 - 0.01),
            lng: location.lng + (Math.random() * 0.02 - 0.01),
          },
        },
        opening_hours: {
          open_now: Math.random() > 0.3,
        },
        distance: Math.random() * (searchRadius * 0.8) + 0.2,
      };
    });
  };

  // Format price display
  const formatPrice = (priceRange, category) => {
    if (category === "gasStations") {
      return `₹${priceRange.min.toFixed(2)}/L - ₹${priceRange.max.toFixed(2)}/L`;
    }
    
    // For hotels, show per night
    if (category === "hotels") {
      return `₹${priceRange.min.toLocaleString()} - ₹${priceRange.max.toLocaleString()}/night`;
    }
    
    // For restaurants and shops
    return `₹${priceRange.min.toLocaleString()} - ₹${priceRange.max.toLocaleString()}`;
  };

  // Get icon based on category
  const getCategoryIcon = (category) => {
    switch (category) {
      case "hotels":
        return <FaHotel className="w-5 h-5" />;
      case "restaurants":
        return <FaUtensils className="w-5 h-5" />;
      case "gasStations":
        return <FaGasPump className="w-5 h-5" />;
      case "shops":
        return <FaShoppingBag className="w-5 h-5" />;
      default:
        return <FaStore className="w-5 h-5" />;
    }
  };

  // Format rating stars
  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`star-${i}`} className="text-yellow-500">
          ★
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half-star" className="text-yellow-500">
          ✮
        </span>
      );
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-star-${i}`} className="text-gray-300">
          ☆
        </span>
      );
    }

    return stars;
  };

  // Format distance for display
  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  // Calculate estimated time to reach
  const calculateETA = (distance) => {
    // Average walking speed: 5 km/h
    const walkingMinutes = Math.round((distance / 5) * 60);
    
    // Average car speed in city: 30 km/h
    const drivingMinutes = Math.round((distance / 30) * 60);
    
    return { walkingMinutes, drivingMinutes };
  };

  // Toggle directions panel
  const toggleDirections = (place) => {
    if (selectedPlace && selectedPlace.id === place.id) {
      setSelectedPlace(null);
    } else {
      setSelectedPlace(place);
    }
  };

  // Toggle between destination mode and around me mode
  const toggleLocationMode = () => {
    setIsAroundMe(!isAroundMe);
    setSelectedPlace(null);
  };

  return (
    <div className="py-6">
      {(!userLocation && !isAroundMe) || (isAroundMe && !currentLocation && locationError) ? (
        <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 rounded-lg border border-yellow-200">
          <FaInfoCircle className="text-yellow-500 text-3xl mb-4" />
          <h3 className="text-lg font-medium text-yellow-800">
            {locationError || "No Location Selected"}
          </h3>
          <p className="text-yellow-700 mt-2 text-center">
            {locationError 
              ? "Please enable location services and try again." 
              : "Please use the Map tab to select a source location or use 'Around Me' feature."}
          </p>
          {!isAroundMe && (
            <button 
              onClick={toggleLocationMode}
              className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-full flex items-center"
            >
              <FaLocationArrow className="mr-2" /> Use Around Me Instead
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {isAroundMe 
                  ? "Places around your current location" 
                  : `Places near ${userLocation?.name || "your location"}`}
              </h2>
              <button 
                onClick={toggleLocationMode}
                className={`px-4 py-2 rounded-full flex items-center ${
                  isAroundMe ? "bg-teal-100 text-teal-800" : "bg-teal-500 text-white"
                }`}
              >
                <FaLocationArrow className="mr-2" /> 
                {isAroundMe ? "Use Destination" : "Around Me"}
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                className={`px-4 py-2 rounded-full flex items-center ${
                  selectedCategory === "hotels"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
                onClick={() => setSelectedCategory("hotels")}
              >
                <FaHotel className="mr-2" /> Hotels
              </button>
              <button
                className={`px-4 py-2 rounded-full flex items-center ${
                  selectedCategory === "restaurants"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
                onClick={() => setSelectedCategory("restaurants")}
              >
                <FaUtensils className="mr-2" /> Restaurants
              </button>
              <button
                className={`px-4 py-2 rounded-full flex items-center ${
                  selectedCategory === "gasStations"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
                onClick={() => setSelectedCategory("gasStations")}
              >
                <FaGasPump className="mr-2" /> Gas Stations
              </button>
              <button
                className={`px-4 py-2 rounded-full flex items-center ${
                  selectedCategory === "shops"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
                onClick={() => setSelectedCategory("shops")}
              >
                <FaShoppingBag className="mr-2" /> Shops
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Search radius:</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 5, 10, 15, 20].map((radius) => (
                  <button
                    key={radius}
                    onClick={() => setSearchRadius(radius)}
                    className={`px-4 py-2 rounded-md ${
                      searchRadius === radius
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {radius} km
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {place.name}
                        </h3>
                        <div className="flex items-center mt-1">
                          <div className="flex">{renderRatingStars(place.rating)}</div>
                          <span className="text-sm text-gray-500 ml-1">
                            ({place.user_ratings_total})
                          </span>
                        </div>
                      </div>
                      <div className="p-2 bg-teal-50 rounded-full">
                        {getCategoryIcon(selectedCategory)}
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-600">
                      <p>{place.vicinity}</p>
                      <p className="mt-1 flex items-center">
                        <span className="font-medium text-teal-700">
                          {formatPrice(place.price_range, selectedCategory)}
                        </span>
                      </p>
                      <p className="mt-1">
                        <span
                          className={
                            place.opening_hours?.open_now
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {place.opening_hours?.open_now ? "Open now" : "Closed"}
                        </span>
                        {" · "}
                        <span>{formatDistance(place.distance)}</span>
                      </p>
                    </div>

                    <div className="mt-4 flex justify-between">
                      <button className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 text-sm">
                        View Details
                      </button>
                      <button 
                        className={`px-4 py-2 ${selectedPlace && selectedPlace.id === place.id ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} rounded hover:bg-gray-700 hover:text-white text-sm flex items-center`}
                        onClick={() => toggleDirections(place)}
                      >
                        <FaDirections className="mr-1" /> Directions
                      </button>
                    </div>
                  </div>

                  {/* Directions Panel */}
                  {selectedPlace && selectedPlace.id === place.id && (
                    <div className="bg-gray-50 border-t p-4 relative">
                      <button 
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        onClick={() => setSelectedPlace(null)}
                      >
                        <FaTimes />
                      </button>
                      
                      <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                        <FaDirections className="mr-2 text-teal-600" /> Directions to {place.name}
                      </h4>
                      
                      <div className="flex items-start mb-2">
                        <div className="bg-teal-100 p-1 rounded-full mr-2 mt-1">
                          <FaMapMarkerAlt className="text-teal-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">From</div>
                          <div className="text-sm font-medium">
                            {userLocation?.name || "Your Current Location"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start mb-4">
                        <div className="bg-red-100 p-1 rounded-full mr-2 mt-1">
                          <FaMapMarkerAlt className="text-red-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">To</div>
                          <div className="text-sm font-medium">{place.name}</div>
                          <div className="text-xs text-gray-500">{place.vicinity}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                        <div className="bg-white p-3 rounded border">
                          <div className="font-medium text-gray-700">Distance</div>
                          <div className="text-lg font-bold text-teal-700">
                            {formatDistance(place.distance)}
                          </div>
                        </div>
                        
                        <div className="bg-white p-3 rounded border">
                          <div className="font-medium text-gray-700">Travel Time</div>
                          <div>
                            <div className="flex justify-between items-center">
                              <span>🚶 Walking:</span>
                              <span className="font-medium">
                                {calculateETA(place.distance).walkingMinutes} min
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span>🚗 Driving:</span>
                              <span className="font-medium">
                                {calculateETA(place.distance).drivingMinutes} min
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 bg-teal-50 p-3 rounded text-sm text-teal-800">
                        The quickest route from your location to {place.name} is about {formatDistance(place.distance)}.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isLoading && places.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No places found in this area. Try increasing the search radius.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
