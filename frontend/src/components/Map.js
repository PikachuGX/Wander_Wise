import React, { useState, useRef, useCallback, useEffect } from "react";
/* global google */
import {
  FaLocationArrow,
  FaTimes,
  FaCar,
  FaTree,
  FaMoneyBillWave,
  FaInfoCircle,
  FaPlane,
  FaWalking,
  FaTrain,
  FaUser,
  FaHotel,
  FaUtensils,
  FaGasPump,
  FaStore
} from "react-icons/fa";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
  InfoWindow,
  Polyline,
  useJsApiLoader,
  Circle
} from "@react-google-maps/api";

import { routesService } from "../services/api";
import { 
  GOOGLE_MAPS_LIBRARIES, 
  GOOGLE_MAPS_API_KEY, 
  MAP_OPTIONS, 
  MAP_CONTAINER_STYLE, 
  DEFAULT_CENTER 
} from "../utils/mapsConfig";

// Algorithm path colors
const algorithmColors = {
  "a-star": "#4285F4", // Blue for A*
  "dijkstra": "#FF0000", // Red for Dijkstra
  "bfs": "#00FF00", // Green for BFS
  "dfs": "#FFA500", // Orange for DFS
};

// Transport mode speeds in km/h
const transportSpeeds = {
  "driving": 50,
  "flying": 800,
  "walking": 5,
  "transit": 35,
};

const Map = ({ onRouteCalculated, sourceValue, destinationValue, onInputValueChange, onLocationUpdate }) => {
  // Add API loader
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // References
  const sourceRef = useRef(null);
  const destinationRef = useRef(null);
  const mapRef = useRef(null);

  // State
  const [map, setMap] = useState(null);
  const [startMarker, setStartMarker] = useState(null);
  const [endMarker, setEndMarker] = useState(null);
  const [airports, setAirports] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [flightPath, setFlightPath] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [routePreferences, setRoutePreferences] = useState({
    avoidTolls: false,
    avoidHighways: false,
    mode: "driving",
  });
  const [algorithm, setAlgorithm] = useState("a-star");
  const [transportMode, setTransportMode] = useState("driving");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [showAlgorithmInfo, setShowAlgorithmInfo] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Callback when map loads
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMap(map);
  }, []);

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Get address from coordinates
  const getAddressFromCoordinates = async (coords) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: coords }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error("Geocoding failed"));
          }
        });
      });
      return response;
    } catch (error) {
      console.error("Error getting address:", error);
      return "Current Location";
    }
  };

  // Calculate route using Google Directions Service
  const calculateRoute = async () => {
    if (!sourceRef.current.value || !destinationRef.current.value) {
      showToast("Please enter both source and destination", "error");
      return;
    }

    setIsLoading(true);
    setAirports(null);
    setFlightPath(null);
    // Close the algorithm panel after starting calculation
    setShowAlgorithmInfo(false);

    try {
      // Get the places from autocomplete
      const sourcePlace = sourceRef.current.value;
      const destPlace = destinationRef.current.value;

      // First, use Google's Geocoding to get coordinates
      const geocoder = new google.maps.Geocoder();
      
      // Get source coordinates
      const sourceGeocode = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: sourcePlace }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK) {
            resolve(results[0]);
          } else {
            reject(new Error(`Geocoding failed for ${sourcePlace}`));
          }
        });
      });
      
      // Get destination coordinates
      const destGeocode = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: destPlace }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK) {
            resolve(results[0]);
          } else {
            reject(new Error(`Geocoding failed for ${destPlace}`));
          }
        });
      });

      const sourceCoords = {
        lat: sourceGeocode.geometry.location.lat(),
        lng: sourceGeocode.geometry.location.lng(),
      };

      const destCoords = {
        lat: destGeocode.geometry.location.lat(),
        lng: destGeocode.geometry.location.lng(),
      };

      // Set markers for source and destination (except for flights)
      setStartMarker(sourceCoords);
      setEndMarker(destCoords);

      // Center the map to show both points
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(sourceCoords);
      bounds.extend(destCoords);
      map.fitBounds(bounds);

      // Now, use our backend API for route calculation using selected algorithm
      const source = {
        name: sourcePlace,
        lat: sourceCoords.lat,
        lng: sourceCoords.lng,
      };

      const destination = {
        name: destPlace,
        lat: destCoords.lat,
        lng: destCoords.lng,
      };

      // Call our API to calculate path using the selected algorithm
      await routesService.calculateRoute(
        source,
        destination,
        algorithm,
        transportMode
      );

      // Calculate appropriate distance and time based on transport mode
      let distanceValue, durationValue, directionsResult;
      
      if (transportMode === "flying") {
        // For flights, calculate direct distance and find airports
        const directDistance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(sourceCoords),
          new google.maps.LatLng(destCoords)
        );
        distanceValue = directDistance;
        durationValue = (directDistance / 1000) / transportSpeeds.flying * 3600;
        
        // Find nearby airports
        const sourceAirport = await findNearbyAirports(sourceCoords);
        const destAirport = await findNearbyAirports(destCoords);
        
        // Set airport markers
        if (sourceAirport && destAirport) {
          setAirports({
            source: sourceAirport,
            destination: destAirport
          });
          
          // Create flight path
          setFlightPath([
            sourceCoords,
            sourceAirport.position, // From source to airport
            destAirport.position,   // From airport to airport (flight)
            destCoords              // From airport to destination
          ]);
          
          // Get directions to and from airports
          const directionsService = new google.maps.DirectionsService();
          
          // Source to source airport
          const toAirportDirections = await directionsService.route({
            origin: sourceCoords,
            destination: sourceAirport.position,
            travelMode: google.maps.TravelMode.DRIVING,
          });
          
          // Destination airport to destination
          const fromAirportDirections = await directionsService.route({
            origin: destAirport.position,
            destination: destCoords,
            travelMode: google.maps.TravelMode.DRIVING,
          });
          
          // Add these distances to total
          const toAirportDistance = toAirportDirections.routes[0].legs[0].distance.value;
          const fromAirportDistance = fromAirportDirections.routes[0].legs[0].distance.value;
          
          // Update total distance to include travel to/from airports
          distanceValue += toAirportDistance + fromAirportDistance;
          
          // Update duration to include travel to/from airports
          const toAirportDuration = toAirportDirections.routes[0].legs[0].duration.value;
          const fromAirportDuration = fromAirportDirections.routes[0].legs[0].duration.value;
          durationValue += toAirportDuration + fromAirportDuration;
          
          // Plus 2 hours for airport procedures
          durationValue += 2 * 60 * 60; // 2 hours in seconds
        }
        
        // Clear any existing directions
        setDirectionsResponse(null);
      } else {
        // For other modes, get directions from Google
        const directionsService = new google.maps.DirectionsService();
        directionsResult = await directionsService.route({
          origin: sourceCoords,
          destination: destCoords,
          travelMode: google.maps.TravelMode[transportMode.toUpperCase()],
          avoidTolls: routePreferences.avoidTolls,
          avoidHighways: routePreferences.avoidHighways,
        });
        
        distanceValue = directionsResult.routes[0].legs[0].distance.value;
        durationValue = directionsResult.routes[0].legs[0].duration.value;
        
        // Set directions with custom styling for algorithms
        const rendererOptions = {
          directions: directionsResult,
          options: {
            polylineOptions: {
              strokeColor: algorithmColors[algorithm],
              strokeWeight: 6,
              strokeOpacity: 0.8
            },
            suppressMarkers: true // Suppress default markers since we're using custom ones
          }
        };
        
        setDirectionsResponse(rendererOptions);
        setFlightPath(null);
        setAirports(null);
      }

      // Format distance
      let distanceText;
      if (distanceValue < 1000) {
        distanceText = `${Math.round(distanceValue)} m`;
      } else {
        distanceText = `${(distanceValue / 1000).toFixed(2)} km`;
      }

      // Format duration
      let durationText;
      if (durationValue < 60) {
        durationText = `${Math.round(durationValue)} sec`;
      } else if (durationValue < 3600) {
        durationText = `${Math.floor(durationValue / 60)} min`;
      } else {
        const hours = Math.floor(durationValue / 3600);
        const minutes = Math.floor((durationValue % 3600) / 60);
        durationText = `${hours} hr ${minutes} min`;
      }

      setDistance(distanceText);
      setDuration(durationText);

      // Notify parent component about the calculated route
      if (onRouteCalculated) {
        onRouteCalculated(source, destination, {
          source,
          destination,
          distance: distanceValue,
          duration: durationValue,
        });
      }

      // Show success message
      let algorithmName;
      switch (algorithm) {
        case "dijkstra":
          algorithmName = "Dijkstra's";
          break;
        case "bfs":
          algorithmName = "BFS";
          break;
        case "dfs":
          algorithmName = "DFS";
          break;
        default:
          algorithmName = "A*";
      }

      showToast(`Route calculated using ${algorithmName} algorithm`);
    } catch (error) {
      console.error("Error calculating route:", error);
      showToast(error.message || "Error calculating route", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear route
  const clearRoute = () => {
    setStartMarker(null);
    setEndMarker(null);
    setDirectionsResponse(null);
    setFlightPath(null);
    setAirports(null);
    setDistance("");
    setDuration("");
    // Update parent state
    onInputValueChange('source', '');
    onInputValueChange('destination', '');
  };

  // Clear a specific field (origin or destination)
  const clearField = (field) => {
    if (field === 'source') {
      onInputValueChange('source', '');
      sourceRef.current.value = '';
      if (startMarker) {
        setStartMarker(null);
        // If we have a route calculated, clear it
        if (directionsResponse || flightPath) {
          clearRoute();
        }
      }
    } else if (field === 'destination') {
      onInputValueChange('destination', '');
      destinationRef.current.value = '';
      if (endMarker) {
        setEndMarker(null);
        // If we have a route calculated, clear it
        if (directionsResponse || flightPath) {
          clearRoute();
        }
      }
    }
  };

  // Update input refs when props change
  useEffect(() => {
    if (sourceRef.current && sourceValue) {
      sourceRef.current.value = sourceValue;
    }
    if (destinationRef.current && destinationValue) {
      destinationRef.current.value = destinationValue;
    }
  }, [sourceValue, destinationValue]);

  // Center map on current position
  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (error) => reject(error),
            { 
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        });

        // Set current location first time we get it
        if (!currentLocation) {
          setCurrentLocation(position);
          
          // Pass location to parent component
          if (onLocationUpdate) {
            onLocationUpdate(position);
          }
        }
        
        showToast("Exact location found!");
        
        // Set the source field to current location
        if (sourceRef.current) {
          const address = await getAddressFromCoordinates(position);
          sourceRef.current.value = address;
          handleInputChange('source', address);
        }
        
        if (map) {
          map.setCenter(position);
          map.setZoom(16); // Higher zoom for more precise location view
        }
      } catch (error) {
        console.error("Error getting current location:", error);
        showToast("Unable to retrieve your exact location", "error");
      } finally {
        setIsLoading(false);
      }
    } else {
      showToast("Error: Your browser doesn't support geolocation", "error");
    }
  };

  // Effect when component mounts - try to get current location automatically
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(pos);
          
          // Pass current location to parent component
          if (onLocationUpdate) {
            onLocationUpdate(pos);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, []);

  // Handle route preference changes
  const handlePreferenceChange = (e) => {
    const { name, value, checked, type } = e.target;

    setRoutePreferences((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle algorithm change
  const handleAlgorithmChange = (e) => {
    setAlgorithm(e.target.value);
    
    // Update route color if directions exist
    if (directionsResponse) {
      setDirectionsResponse({
        ...directionsResponse,
        options: {
          ...directionsResponse.options,
          polylineOptions: {
            ...directionsResponse.options.polylineOptions,
            strokeColor: algorithmColors[e.target.value]
          }
        }
      });
    }
  };

  // Handle transport mode change
  const handleTransportModeChange = (mode) => {
    setTransportMode(mode);
    if (mode !== "flying") {
      setAirports(null);
      setFlightPath(null);
    }
  };

  // Toggle algorithm info
  const toggleAlgorithmInfo = () => {
    setShowAlgorithmInfo(!showAlgorithmInfo);
  };

  // Get icon for transport mode button
  const getTransportIcon = (mode) => {
    switch (mode) {
      case "flying":
        return <FaPlane />;
      case "walking":
        return <FaWalking />;
      case "transit":
        return <FaTrain />;
      default:
        return <FaCar />;
    }
  };

  // Find nearby airports
  const findNearbyAirports = async (location) => {
    try {
      // In a real app, we'd use a Places API call
      // For demonstration, we'll simulate finding airports
      
      // Generate a fake airport nearby (within ~10-20km)
      const airportOffset = () => (Math.random() * 0.2) - 0.1; // Random offset of ~10km
      
      const airportLat = location.lat + airportOffset();
      const airportLng = location.lng + airportOffset();
      
      // Generate an IATA code
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetter = () => alphabet[Math.floor(Math.random() * alphabet.length)];
      const iataCode = randomLetter() + randomLetter() + randomLetter();
      
      return {
        position: { lat: airportLat, lng: airportLng },
        name: `${iataCode} International Airport`,
        iata: iataCode
      };
    } catch (error) {
      console.error("Error finding airports:", error);
      return null;
    }
  };

  // Handle input changes and pass to parent component
  const handleInputChange = (type, value) => {
    if (onInputValueChange) {
      onInputValueChange(type, value);
    }
  };

  // Render loading state if Google Maps isn't loaded yet
  if (!isLoaded) {
    return <div>Loading Maps...</div>;
  }

  return (
    <div className="flex h-full">
      {/* Main map container */}
      <div className="relative w-full h-full">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={DEFAULT_CENTER}
          zoom={10}
          options={MAP_OPTIONS}
          onLoad={onMapLoad}
        >
          {directionsResponse && (
            <DirectionsRenderer 
              directions={directionsResponse.directions}
              options={directionsResponse.options}
            />
          )}

          {/* Flight path visualization with arcs */}
          {flightPath && (
            <>
              {/* Source to departure airport path */}
              <Polyline
                path={[flightPath[0], flightPath[1]]}
                options={{
                  strokeColor: "#808080", // Gray for ground transport
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                }}
              />
              
              {/* Air route with arc */}
              <Polyline
                path={[flightPath[1], flightPath[2]]}
                options={{
                  strokeColor: algorithmColors[algorithm],
                  strokeOpacity: 0.8,
                  strokeWeight: 5,
                  geodesic: true, // Creates an arc for flight path
                  icons: [{
                    icon: {
                      path: 'M 0,-1 0,1',
                      strokeOpacity: 1,
                      scale: 4
                    },
                    offset: '0',
                    repeat: '20px'
                  }]
                }}
              />
              
              {/* Arrival airport to destination path */}
              <Polyline
                path={[flightPath[2], flightPath[3]]}
                options={{
                  strokeColor: "#808080", // Gray for ground transport
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                }}
              />
            </>
          )}

          {startMarker && (
            <Marker
              position={startMarker}
              label="A"
            />
          )}

          {endMarker && (
            <Marker
              position={endMarker}
              label="B"
            />
          )}

          {/* Airport markers */}
          {airports && (
            <>
              <Marker
                position={airports.source.position}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                  scaledSize: new google.maps.Size(32, 32)
                }}
                onClick={() => setSelectedMarker({
                  position: airports.source.position,
                  title: airports.source.name,
                  description: `Airport code: ${airports.source.iata}`
                })}
              />
              <Marker
                position={airports.destination.position}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                  scaledSize: new google.maps.Size(32, 32)
                }}
                onClick={() => setSelectedMarker({
                  position: airports.destination.position,
                  title: airports.destination.name,
                  description: `Airport code: ${airports.destination.iata}`
                })}
              />
            </>
          )}

          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-1">
                <h3 className="font-bold text-gray-900 mb-1">
                  {selectedMarker.title}
                </h3>
                {selectedMarker.type && (
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    {selectedMarker.type}
                  </div>
                )}
                {selectedMarker.rating && (
                  <div className="text-xs text-yellow-500 font-medium mb-1">
                    Rating: {selectedMarker.rating} ★
                  </div>
                )}
                {selectedMarker.description && (
                  <p className="text-xs text-gray-600">
                    {selectedMarker.description}
                  </p>
                )}
              </div>
            </InfoWindow>
          )}

          {/* Current location marker with accuracy circle */}
          {currentLocation && (
            <>
              <Marker
                position={currentLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  scale: 8,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2,
                }}
                title="Your Exact Location"
              />
              <Circle 
                center={currentLocation}
                radius={50}
                options={{
                  fillColor: '#4285F4',
                  fillOpacity: 0.15,
                  strokeColor: '#4285F4',
                  strokeOpacity: 0.5,
                  strokeWeight: 1,
                }}
              />
            </>
          )}
        </GoogleMap>

        {/* Controls container */}
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md w-72">
          <div className="space-y-3">
            <h3 className="font-bold text-lg">WanderWise Router</h3>
            
            <div>
              <Autocomplete>
                <div className="relative">
                  <input
                    ref={sourceRef}
                    type="text"
                    placeholder="Origin"
                    defaultValue={sourceValue}
                    onChange={(e) => onInputValueChange('source', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                  />
                  {sourceValue && (
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => clearField('source')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </Autocomplete>
            </div>
            <div>
              <Autocomplete>
                <div className="relative">
                  <input
                    ref={destinationRef}
                    type="text"
                    placeholder="Destination"
                    defaultValue={destinationValue}
                    onChange={(e) => onInputValueChange('destination', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                  />
                  {destinationValue && (
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => clearField('destination')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </Autocomplete>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <div className="mr-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    name="avoidTolls"
                    checked={routePreferences.avoidTolls}
                    onChange={handlePreferenceChange}
                    className="rounded text-teal-500 focus:ring-teal-500"
                  />
                  <span className="flex items-center">
                    <FaMoneyBillWave className="text-teal-500 mr-1" /> No Tolls
                  </span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    name="avoidHighways"
                    checked={routePreferences.avoidHighways}
                    onChange={handlePreferenceChange}
                    className="rounded text-teal-500 focus:ring-teal-500"
                  />
                  <span className="flex items-center">
                    <FaTree className="text-teal-500 mr-1" /> Scenic
                  </span>
                </label>
              </div>
            </div>

            {/* Algorithm Selection - Box Style */}
            <div className="mt-2">
              <div className="border border-gray-300 rounded overflow-hidden">
                <button 
                  onClick={toggleAlgorithmInfo}
                  className={`w-full px-3 py-2 text-sm font-medium ${showAlgorithmInfo ? 'bg-teal-50 text-teal-600' : 'text-gray-700 hover:bg-gray-50'} flex justify-between items-center`}
                  title="Click to select routing algorithm"
                >
                  <span>Algorithms</span>
                  <FaInfoCircle className={`transition-transform ${showAlgorithmInfo ? 'transform rotate-180' : ''}`} />
                </button>
              </div>
              
              {showAlgorithmInfo && (
                <div className="mt-2 p-2 bg-gray-100 rounded border border-gray-200 text-xs">
                  <div className="mb-2">
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="algorithm" 
                        value="a-star"
                        checked={algorithm === "a-star"}
                        onChange={handleAlgorithmChange}
                        className="mr-1"
                      />
                      <span className="font-medium">A* Algorithm</span>
                    </label>
                    <p className="text-gray-600 ml-4">Optimized pathfinding, fastest routes.</p>
                  </div>
                  
                  <div className="mb-2">
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="algorithm" 
                        value="dijkstra"
                        checked={algorithm === "dijkstra"}
                        onChange={handleAlgorithmChange}
                        className="mr-1"
                      />
                      <span className="font-medium">Dijkstra's Algorithm</span>
                    </label>
                    <p className="text-gray-600 ml-4">Finds shortest path, considers all options.</p>
                  </div>
                  
                  <div className="mb-2">
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="algorithm" 
                        value="bfs"
                        checked={algorithm === "bfs"}
                        onChange={handleAlgorithmChange}
                        className="mr-1"
                      />
                      <span className="font-medium">BFS (Breadth-First Search)</span>
                    </label>
                    <p className="text-gray-600 ml-4">Explores routes level by level, good for shorter distances.</p>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="algorithm" 
                        value="dfs"
                        checked={algorithm === "dfs"}
                        onChange={handleAlgorithmChange}
                        className="mr-1"
                      />
                      <span className="font-medium">DFS (Depth-First Search)</span>
                    </label>
                    <p className="text-gray-600 ml-4">Explores deep routes first, can find scenic alternatives.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Transport Mode Selection */}
            <div className="flex justify-between mt-3">
              <button
                onClick={() => handleTransportModeChange("driving")}
                className={`p-2 rounded-full ${
                  transportMode === "driving"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                title="Car"
              >
                <FaCar />
              </button>
              <button
                onClick={() => handleTransportModeChange("flying")}
                className={`p-2 rounded-full ${
                  transportMode === "flying"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                title="Flight"
              >
                <FaPlane />
              </button>
              <button
                onClick={() => handleTransportModeChange("walking")}
                className={`p-2 rounded-full ${
                  transportMode === "walking"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                title="Walking"
              >
                <FaWalking />
              </button>
              <button
                onClick={() => handleTransportModeChange("transit")}
                className={`p-2 rounded-full ${
                  transportMode === "transit"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                title="Transit"
              >
                <FaTrain />
              </button>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={calculateRoute}
                className="flex items-center justify-center bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600 transition"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Calculating..."
                ) : (
                  <>
                    {transportMode === "driving" ? <FaCar className="mr-2" /> :
                    transportMode === "flying" ? <FaPlane className="mr-2" /> :
                    transportMode === "walking" ? <FaWalking className="mr-2" /> :
                    <FaTrain className="mr-2" />}
                    Calculate
                  </>
                )}
              </button>
              <button
                onClick={clearRoute}
                className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
              >
                <FaTimes />
              </button>
              <button
                onClick={getCurrentLocation}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
              >
                <FaLocationArrow />
              </button>
            </div>

            {/* Display distance and duration */}
            {distance && duration && (
              <div className="mt-2 p-2 bg-gray-100 rounded">
                <div className="text-sm"><strong>Distance:</strong> {distance}</div>
                <div className="text-sm"><strong>Duration:</strong> {duration}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Calculated using {algorithm === "a-star" ? "A*" : 
                    algorithm === "dijkstra" ? "Dijkstra's" : 
                    algorithm === "bfs" ? "BFS" : "DFS"} algorithm
                </div>
                <div className="text-xs text-gray-500">
                  Transport mode: {transportMode === "driving" ? "Car" :
                    transportMode === "flying" ? "Flight" :
                    transportMode === "walking" ? "Walking" : "Transit"}
                </div>
              </div>
            )}
            
            {/* Toast notification */}
            {toast.show && (
              <div className={`mt-2 p-2 rounded text-sm ${
                toast.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {toast.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;