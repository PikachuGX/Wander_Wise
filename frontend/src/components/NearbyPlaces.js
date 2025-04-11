import React, { useState, useEffect } from "react";
import { 
  FaHotel, 
  FaUtensils, 
  FaGasPump, 
  FaStore, 
  FaSearch,
  FaStar,
  FaMapMarkerAlt
} from "react-icons/fa";
import { useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY } from "../utils/mapsConfig";

const NearbyPlaces = ({ destination }) => {
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

  // Detect country from coordinates
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

  // Find nearby places based on category and radius
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

  // Load all nearby places on first render or when destination/radius changes
  useEffect(() => {
    async function loadNearbyPlaces() {
      if (!destination || !destination.lat || !destination.lng) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const location = { lat: destination.lat, lng: destination.lng };
        
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
    }

    loadNearbyPlaces();
  }, [destination, searchRadius]);

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
      // Just show the dollar signs without the label
      return (
        <div className="text-green-600 text-sm">
          {Array(level + 1).fill(localCurrency.symbol).join("")}
        </div>
      );
    }
    
    // If price level is not available, show estimated ranges based on place type
    return (
      <div className="text-gray-600 text-sm">
        {placeType === "gasStations" ? "Local fuel prices" : "Price info unavailable"}
      </div>
    );
  };

  // Generate price range based on place rating and type
  const getRandomizedPriceRange = (place, placeType) => {
    // Convert USD prices to local currency
    const convertPrice = (usdPrice) => {
      const localPrice = usdPrice * localCurrency.exchangeRate;
      // Round appropriately based on currency
      if (localCurrency.code === 'JPY' || localCurrency.code === 'KRW') {
        return Math.round(localPrice);
      }
      return Math.round(localPrice * 10) / 10;
    };
    
    // For gas stations, return a fixed price range
    if (placeType === "gasStations") {
      const basePrice = 3.5; // Base price per gallon/liter
      const localBasePrice = convertPrice(basePrice);
      const localHighPrice = convertPrice(basePrice + 0.5);
      return `${localCurrency.symbol}${localBasePrice}-${localHighPrice}/gallon`;
    }

    // Use rating to determine base price (higher rating = higher price)
    // If no rating, use a default value of 3.0
    const rating = place.rating || 3.0;
    
    // Base price ranges by type
    let minPrice, maxPrice, unit;
    
    if (placeType === "hotels") {
      // Hotels: base price $50-100, can go up to $300+ for 5-star
      minPrice = 50 + (rating * 10);
      maxPrice = 100 + (rating * 40);
      unit = "/night";
    } else if (placeType === "restaurants") {
      // Restaurants: base price $10-25, can go up to $100+ for 5-star
      minPrice = 10 + (rating * 5);
      maxPrice = 25 + (rating * 15);
      unit = "/meal";
    } else if (placeType === "shops") {
      // Shops: wide price range
      minPrice = 10 + (rating * 5);
      maxPrice = 50 + (rating * 25);
      unit = "";
    } else {
      // Default
      minPrice = 20;
      maxPrice = 50;
      unit = "";
    }
    
    // Add some randomness (±20%)
    const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
    minPrice = Math.round(minPrice * randomFactor);
    maxPrice = Math.round(maxPrice * randomFactor);
    
    // Convert to local currency
    const localMinPrice = convertPrice(minPrice);
    const localMaxPrice = convertPrice(maxPrice);
    
    return `${localCurrency.symbol}${localMinPrice}-${localMaxPrice}${unit}`;
  };

  // If Google Maps isn't loaded yet, show loading state
  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  // If no destination, prompt user to calculate a route first
  if (!destination) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <FaMapMarkerAlt className="mx-auto text-gray-400 text-5xl mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Destination Selected</h2>
          <p className="text-gray-600">
            Please use the Map tab to calculate a route first. 
            Then we can show you nearby places at your destination.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Nearby Places</h1>
        <p className="text-gray-600">
          Discover places near your destination: {destination.name || "Selected Location"}
          {countryName && <span className="ml-1 text-gray-500">({countryName})</span>}
        </p>
      </div>

      {/* Radius selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Search Radius</label>
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

      {/* Category tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveCategory("hotels")}
            className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeCategory === "hotels"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaHotel className="inline-block mr-2" />
            Hotels
            {nearbyPlaces.hotels.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {nearbyPlaces.hotels.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveCategory("restaurants")}
            className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeCategory === "restaurants"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaUtensils className="inline-block mr-2" />
            Restaurants
            {nearbyPlaces.restaurants.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {nearbyPlaces.restaurants.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveCategory("gasStations")}
            className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeCategory === "gasStations"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaGasPump className="inline-block mr-2" />
            Gas Stations
            {nearbyPlaces.gasStations.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {nearbyPlaces.gasStations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveCategory("shops")}
            className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeCategory === "shops"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaStore className="inline-block mr-2" />
            Shops
            {nearbyPlaces.shops.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {nearbyPlaces.shops.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Results section */}
      <div className="mt-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading nearby places...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded">
            <p>{error}</p>
          </div>
        ) : getActivePlaces().length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {getActivePlaces().map((place) => (
              <div
                key={place.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{place.name}</h3>
                  
                  <div className="flex justify-between items-center mb-2">
                    {renderStars(place.rating)}
                    {renderPriceLevel(place.priceLevel, activeCategory)}
                  </div>
                  
                  {place.vicinity && (
                    <p className="text-gray-600 text-sm mb-1">{place.vicinity}</p>
                  )}
                  
                  {/* Price range description based on level */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    {place.priceLevel !== undefined ? (
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-medium text-gray-700">Price Range:</p>
                        <p className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                          {place.priceLevel === 0 && "Very inexpensive"}
                          {place.priceLevel === 1 && "Inexpensive"}
                          {place.priceLevel === 2 && "Moderate"}
                          {place.priceLevel === 3 && "Expensive"} 
                          {place.priceLevel === 4 && "Very expensive"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-medium text-gray-700">Estimated Prices:</p>
                        <p className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {getRandomizedPriceRange(place, activeCategory)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No {activeCategory} found within {searchRadius/1000}km of your destination.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Try increasing the search radius or selecting a different category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyPlaces; 