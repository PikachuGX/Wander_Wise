import React, { useState, useEffect } from "react";
import { 
  FaHotel, 
  FaUtensils, 
  FaGasPump, 
  FaStore, 
  FaSearch,
  FaStar,
  FaCompass,
  FaLocationArrow
} from "react-icons/fa";
import { useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY } from "../utils/mapsConfig";

const AroundMe = ({ currentLocation }) => {
  // Add API loader to ensure consistent configuration
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // State
  const [nearbyPlaces, setNearbyPlaces] = useState({
    hotels: [],
    restaurants: [],
    gasStations: [],
    shops: []
  });
  const [activeCategory, setActiveCategory] = useState("hotels");
  const [searchRadius, setSearchRadius] = useState(3000); // Default radius increased to 3km
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localCurrency, setLocalCurrency] = useState({ code: 'USD', symbol: '$', exchangeRate: 1 });
  const [countryName, setCountryName] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  // Currency exchange rates (simplified for demo purposes)
  const currencies = {
    'US': { code: 'USD', symbol: '$', exchangeRate: 1 },
    'JP': { code: 'JPY', symbol: '¥', exchangeRate: 110 },
    'GB': { code: 'GBP', symbol: '£', exchangeRate: 0.75 },
    'EU': { code: 'EUR', symbol: '€', exchangeRate: 0.85 },
    'CA': { code: 'CAD', symbol: 'C$', exchangeRate: 1.25 },
    'AU': { code: 'AUD', symbol: 'A$', exchangeRate: 1.35 },
    'IN': { code: 'INR', symbol: '₹', exchangeRate: 75 },
    'CN': { code: 'CNY', symbol: '¥', exchangeRate: 6.5 },
    'SG': { code: 'SGD', symbol: 'S$', exchangeRate: 1.35 },
    'KR': { code: 'KRW', symbol: '₩', exchangeRate: 1200 },
    'AE': { code: 'AED', symbol: 'د.إ', exchangeRate: 3.67 },
    'TH': { code: 'THB', symbol: '฿', exchangeRate: 33 },
    'RU': { code: 'RUB', symbol: '₽', exchangeRate: 74 },
    'BR': { code: 'BRL', symbol: 'R$', exchangeRate: 5.2 },
    'MX': { code: 'MXN', symbol: 'Mex$', exchangeRate: 20 },
  };

  // Detect country from coordinates using geocoding instead of geometry
  const detectCountry = async (location) => {
    if (!location || !window.google) return null;
    
    try {
      const geocoder = new window.google.maps.Geocoder();
      return new Promise((resolve) => {
        geocoder.geocode({ location }, (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
            for (let component of results[0].address_components) {
              if (component.types.includes('country')) {
                resolve({
                  name: component.long_name,
                  code: component.short_name
                });
                return;
              }
            }
          }
          resolve(null);
        });
      });
    } catch (error) {
      console.error("Error detecting country:", error);
      return null;
    }
  };

  // Update currency based on country
  const updateCurrency = async (location) => {
    const country = await detectCountry(location);
    if (country) {
      setCountryName(country.name);
      const currencyInfo = currencies[country.code] || currencies['US']; // Default to USD
      setLocalCurrency(currencyInfo);
    }
  };

  // Find nearby places based on category and radius without using spherical
  const findNearbyPlaces = async (location, category, radius = searchRadius) => {
    if (!location || !window.google) {
      return [];
    }

    setLoading(true);
    try {
      const map = new window.google.maps.Map(document.createElement("div"));
      const placesService = new window.google.maps.places.PlacesService(map);
      
      const types = {
        hotels: "lodging",
        restaurants: "restaurant",
        gasStations: "gas_station",
        shops: "store"
      };
      
      return new Promise((resolve) => {
        placesService.nearbySearch(
          {
            location,
            radius,
            type: types[category]
          },
          (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results.slice(0, 12).map(place => ({
                id: place.place_id,
                name: place.name,
                position: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                rating: place.rating,
                vicinity: place.vicinity,
                icon: place.icon,
                photos: place.photos?.length > 0 ? [place.photos[0].getUrl()] : null,
                priceLevel: place.price_level
              })));
            } else {
              resolve([]);
            }
          }
        );
      });
    } catch (error) {
      console.error(`Error finding nearby ${category}:`, error);
      setError(`Error finding nearby ${category}. Please try again.`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get current location if not provided
  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(pos);
          loadNearbyPlacesFromLocation(pos);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Unable to get your location. Please enable location services and try again.");
          setLoading(false);
        }
      );
    } else {
      setError("Your browser doesn't support geolocation.");
      setLoading(false);
    }
  };

  // Load nearby places based on location
  const loadNearbyPlacesFromLocation = async (location) => {
    if (!location) return;
    
    setLoading(true);
    setError(null);

    try {
      // Update currency based on location
      await updateCurrency(location);
      
      const [hotels, restaurants, gasStations, shops] = await Promise.all([
        findNearbyPlaces(location, "hotels"),
        findNearbyPlaces(location, "restaurants"),
        findNearbyPlaces(location, "gasStations"),
        findNearbyPlaces(location, "shops")
      ]);
      
      setNearbyPlaces({
        hotels,
        restaurants,
        gasStations,
        shops
      });
    } catch (error) {
      console.error("Error loading nearby places:", error);
      setError("Failed to load nearby places. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Use current location from props or get from browser
  useEffect(() => {
    if (currentLocation && currentLocation.lat && currentLocation.lng) {
      setUserLocation(currentLocation);
      loadNearbyPlacesFromLocation(currentLocation);
    } else {
      getCurrentLocation();
    }
  }, [currentLocation]);
  
  // Update when search radius changes
  useEffect(() => {
    if (userLocation) {
      loadNearbyPlacesFromLocation(userLocation);
    }
  }, [searchRadius]);

  // Handle radius change
  const handleRadiusChange = async (newRadius) => {
    setSearchRadius(newRadius);
  };

  // Get active places based on selected category
  const getActivePlaces = () => nearbyPlaces[activeCategory] || [];

  // Get stars display for ratings
  const renderStars = (rating) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center">
        {Array.from({ length: Math.floor(rating) }).map((_, i) => (
          <FaStar key={i} className="text-yellow-400 text-xs" />
        ))}
        {rating % 1 > 0 && <FaStar className="text-yellow-400 text-xs opacity-50" />}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Format price level
  const renderPriceLevel = (level, placeType) => {
    if (level !== undefined && level !== null) {
      const priceText = "•".repeat(level || 1);
      return <span className="text-gray-500 text-sm">{priceText}</span>;
    } else if (placeType === 'hotels' || placeType === 'restaurants') {
      // If no price level provided, show price range for hotels/restaurants
      const priceRange = getRandomizedPriceRange({ rating: 3 }, placeType);
      return <span className="text-gray-500 text-sm">{priceRange}</span>;
    }
    return null;
  };

  // Generate randomized price range for places without price data
  const getRandomizedPriceRange = (place, placeType) => {
    // Convert USD to local currency helper
    const convertPrice = (usdPrice) => {
      const localPrice = usdPrice * localCurrency.exchangeRate;
      
      // Format based on currency
      if (localCurrency.code === 'JPY' || localCurrency.code === 'KRW') {
        return `${Math.round(localPrice)}`;
      } else {
        return localPrice.toFixed(0);
      }
    };
    
    let minPrice, maxPrice;
    const rating = place.rating || 3; // Default to average rating
    const ratingFactor = rating / 5; // 0-1 scale based on rating
    
    // Add slight randomness to make it look realistic
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2 randomizer
    
    if (placeType === 'hotels') {
      // Base hotel price ranges between $50-$300 per night
      minPrice = 50 + (ratingFactor * 100) * randomFactor;
      maxPrice = minPrice * (1.2 + Math.random() * 0.3); // 20-50% higher
      
      return `${localCurrency.symbol}${convertPrice(minPrice)}-${convertPrice(maxPrice)}`;
    } else if (placeType === 'restaurants') {
      // Base restaurant prices: $10-$60 per person
      minPrice = 10 + (ratingFactor * 20) * randomFactor;
      maxPrice = minPrice * (1.4 + Math.random() * 0.3); // 40-70% higher
      
      return `${localCurrency.symbol}${convertPrice(minPrice)}-${convertPrice(maxPrice)}`;
    }
    
    return '';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Left side - Controls */}
        <div className="w-full md:w-72 bg-white p-4 rounded-lg shadow-md mb-6 md:mb-0">
          <div className="flex items-center mb-5">
            <FaCompass className="text-teal-500 text-xl mr-2" />
            <h2 className="text-xl font-bold">Around Me</h2>
          </div>

          {/* Current Location */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Your Location</h3>
              <button 
                onClick={getCurrentLocation} 
                className="p-2 bg-teal-100 text-teal-600 rounded-full hover:bg-teal-200"
                title="Refresh location"
              >
                <FaLocationArrow />
              </button>
            </div>
            
            {userLocation ? (
              <div className="text-sm bg-gray-100 p-2 rounded">
                {countryName || "Location detected"}
                <div className="text-xs text-gray-500 mt-1">
                  {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-orange-500">
                {error || "Detecting your location..."}
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div className="mb-5">
            <h3 className="font-medium mb-2">Category</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveCategory("hotels")}
                className={`flex items-center py-2 px-3 rounded-lg text-sm ${
                  activeCategory === "hotels"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaHotel className="mr-2" /> Hotels
              </button>
              <button
                onClick={() => setActiveCategory("restaurants")}
                className={`flex items-center py-2 px-3 rounded-lg text-sm ${
                  activeCategory === "restaurants"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaUtensils className="mr-2" /> Restaurants
              </button>
              <button
                onClick={() => setActiveCategory("gasStations")}
                className={`flex items-center py-2 px-3 rounded-lg text-sm ${
                  activeCategory === "gasStations"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaGasPump className="mr-2" /> Gas Stations
              </button>
              <button
                onClick={() => setActiveCategory("shops")}
                className={`flex items-center py-2 px-3 rounded-lg text-sm ${
                  activeCategory === "shops"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaStore className="mr-2" /> Shops
              </button>
            </div>
          </div>

          {/* Search Radius Slider */}
          <div className="mb-5">
            <h3 className="font-medium mb-2">Search Radius</h3>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="500"
                max="10000"
                step="500"
                value={searchRadius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm whitespace-nowrap">
                {(searchRadius / 1000).toFixed(1)} km
              </span>
            </div>
          </div>

          {/* Show currency if detected */}
          {countryName && (
            <div className="text-xs bg-gray-100 p-2 rounded mb-4">
              <div className="font-medium">Local Currency:</div>
              <div className="flex justify-between">
                <span>{localCurrency.code}</span>
                <span>{localCurrency.symbol}</span>
              </div>
            </div>
          )}
          
          {/* Loading indicator */}
          {loading && (
            <div className="text-center py-2 px-4 bg-blue-50 text-blue-600 rounded">
              <p>Loading places...</p>
            </div>
          )}
          
          {/* Error message */}
          {error && !loading && (
            <div className="text-center py-2 px-4 bg-red-50 text-red-600 rounded">
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Right side - Places grid */}
        <div className="flex-1">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">
                {activeCategory === "hotels" && "Hotels"}
                {activeCategory === "restaurants" && "Restaurants"}
                {activeCategory === "gasStations" && "Gas Stations"}
                {activeCategory === "shops" && "Shops"}
              </h2>
              <div className="text-sm text-gray-500">
                {getActivePlaces().length} 
                {activeCategory === "hotels" && " hotels"}
                {activeCategory === "restaurants" && " restaurants"}
                {activeCategory === "gasStations" && " gas stations"}
                {activeCategory === "shops" && " shops"}
                {" nearby"}
              </div>
            </div>

            {/* No location warning */}
            {!userLocation && loading === false && (
              <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg text-center">
                <p>Please enable location services to see places around you.</p>
                <button 
                  onClick={getCurrentLocation}
                  className="mt-3 bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 transition"
                >
                  Get My Location
                </button>
              </div>
            )}

            {/* Places grid */}
            {userLocation && !loading && getActivePlaces().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No {activeCategory} found nearby.</p>
                <p className="text-sm mt-2">Try increasing the search radius or check another category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getActivePlaces().map((place) => (
                  <div key={place.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                    <div className="p-3">
                      <div className="flex items-center mb-2">
                        {activeCategory === "hotels" && <FaHotel className="text-teal-500 mr-2" />}
                        {activeCategory === "restaurants" && <FaUtensils className="text-teal-500 mr-2" />}
                        {activeCategory === "gasStations" && <FaGasPump className="text-teal-500 mr-2" />}
                        {activeCategory === "shops" && <FaStore className="text-teal-500 mr-2" />}
                        <h3 className="font-medium text-lg truncate">{place.name}</h3>
                      </div>
                      <p className="text-gray-500 text-sm truncate">{place.vicinity}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          {renderStars(place.rating)}
                        </div>
                        <div>
                          {renderPriceLevel(place.priceLevel, activeCategory)}
                        </div>
                      </div>
                      
                      {/* Show price estimate for hotels and restaurants */}
                      {(activeCategory === "hotels" || activeCategory === "restaurants") && (
                        <div className="mt-1 text-sm">
                          <span className="font-medium">Est. price: </span>
                          {getRandomizedPriceRange(place, activeCategory)}
                          <span className="text-xs text-gray-500 ml-1">
                            {activeCategory === "hotels" ? "/night" : "/person"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AroundMe; 