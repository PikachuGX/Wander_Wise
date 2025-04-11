import React, { useState } from "react";
import { FaMapMarkedAlt, FaRoute, FaHotel, FaInfoCircle, FaCompass } from "react-icons/fa";

// Import components
import Map from "./components/Map";
import NearbyPlaces from "./components/NearbyPlaces";
import Recommendations from "./components/Recommendations";
import AroundMe from "./components/AroundMe";

function App() {
  // State
  const [currentRoute, setCurrentRoute] = useState(null);
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [sourceInputValue, setSourceInputValue] = useState('');
  const [destinationInputValue, setDestinationInputValue] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);

  // Handle route calculation
  const handleRouteCalculated = (source, destination, route) => {
    setSourceLocation(source);
    setDestinationLocation(destination);
    setCurrentRoute(route);
    
    // Store the input values in state
    setSourceInputValue(source.name);
    setDestinationInputValue(destination.name);
  };

  // Handle input value changes
  const handleInputValueChange = (type, value) => {
    if (type === 'source') {
      setSourceInputValue(value);
    } else if (type === 'destination') {
      setDestinationInputValue(value);
    }
  };

  // Update current location
  const updateCurrentLocation = (location) => {
    setCurrentLocation(location);
  };

  // Tab switching
  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header */}
      <header className="flex items-center justify-between flex-wrap p-4 bg-teal-500 text-white">
        <div className="flex items-center mr-5">
          <FaRoute size={30} />
          <h1 className="text-2xl font-bold ml-2">Traveler Guide System</h1>
        </div>

        <p className="text-sm md:text-base">
          Find optimal routes and nearby places
        </p>
      </header>

      {/* Tabs Navigation */}
      <div className="mt-4">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 flex items-center ${
              activeTab === 0
                ? "border-b-2 border-teal-500 text-teal-600 font-medium"
                : "text-gray-600 hover:text-teal-500"
            }`}
            onClick={() => handleTabClick(0)}
          >
            <FaMapMarkedAlt className="mr-2" /> Map
          </button>
          <button
            className={`px-4 py-2 flex items-center ${
              activeTab === 1
                ? "border-b-2 border-teal-500 text-teal-600 font-medium"
                : "text-gray-600 hover:text-teal-500"
            }`}
            onClick={() => handleTabClick(1)}
          >
            <FaHotel className="mr-2" /> Nearby Places
          </button>
          <button
            className={`px-4 py-2 flex items-center ${
              activeTab === 3
                ? "border-b-2 border-teal-500 text-teal-600 font-medium"
                : "text-gray-600 hover:text-teal-500"
            }`}
            onClick={() => handleTabClick(3)}
          >
            <FaCompass className="mr-2" /> Around Me
          </button>
          <button
            className={`px-4 py-2 flex items-center ${
              activeTab === 2
                ? "border-b-2 border-teal-500 text-teal-600 font-medium"
                : "text-gray-600 hover:text-teal-500"
            }`}
            onClick={() => handleTabClick(2)}
          >
            <FaInfoCircle className="mr-2" /> About
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {/* Map Tab */}
          {activeTab === 0 && (
            <div className="p-0">
              <Map 
                onRouteCalculated={handleRouteCalculated} 
                sourceValue={sourceInputValue}
                destinationValue={destinationInputValue}
                onInputValueChange={handleInputValueChange}
                onLocationUpdate={updateCurrentLocation}
              />
            </div>
          )}

          {/* Nearby Places Tab */}
          {activeTab === 1 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <NearbyPlaces destination={destinationLocation} />
            </div>
          )}

          {/* Around Me Tab */}
          {activeTab === 3 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AroundMe currentLocation={currentLocation} />
            </div>
          )}

          {/* About Tab */}
          {activeTab === 2 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="p-5 shadow-md border border-gray-200 rounded-lg bg-white">
                <h2 className="text-2xl font-bold mb-4">
                  About the Traveler Guide System
                </h2>

                <p className="text-lg mb-4">
                  WanderWise is an intelligent travel application designed to help travelers
                  plan their journeys with smart routing, location discovery, and travel recommendations.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">
                  Key Features
                </h3>

                <div className="pl-4 mb-6">
                  <p className="mb-2">
                    • Interactive Google Maps with multiple route visualization options
                  </p>
                  <p className="mb-2">
                    • Multiple routing algorithms (A*, Dijkstra's, BFS, DFS) for different journey needs
                  </p>
                  <p className="mb-2">
                    • Various transport modes (driving, flying, walking, transit)
                  </p>
                  <p className="mb-2">
                    • Place recommendations near destinations (hotels, restaurants, etc.)
                  </p>
                  <p className="mb-2">
                    • "Around Me" feature to discover places near your current location
                  </p>
                  <p className="mb-2">
                    • Local currency conversion for international travelers
                  </p>
                  <p className="mb-2">
                    • Route preferences (avoid tolls, scenic routes)
                  </p>
                </div>

                <h3 className="text-xl font-semibold mb-3">Technology Stack</h3>

                <div className="pl-4 mb-6">
                  <p className="mb-2">
                    • Frontend: React.js with Google Maps JavaScript API,
                    Tailwind CSS, React Icons
                  </p>
                  <p className="mb-2">• Backend: Node.js with Express</p>
                  <p className="mb-2">• Database: MongoDB</p>
                </div>

                <div className="mt-5 p-3 bg-yellow-50 text-yellow-800 rounded-md">
                  <h4 className="font-bold mb-2">Routing Algorithms Compared</h4>
                  <p className="text-sm">
                    WanderWise implements four different pathfinding algorithms, each with unique characteristics:
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm space-y-2">
                    <li>
                      <b>A* Algorithm</b>: The most efficient option that uses heuristics to 
                      estimate the best path to the destination. Combines Dijkstra's algorithm with 
                      additional information about the target location to find optimal routes faster.
                    </li>
                    <li>
                      <b>Dijkstra's Algorithm</b>: Explores all possible paths by prioritizing the 
                      shortest distances from the starting point. Guaranteed to find the shortest path 
                      but may explore unnecessary areas.
                    </li>
                    <li>
                      <b>BFS (Breadth-First Search)</b>: Explores routes level-by-level from the 
                      origin, making it good for finding the path with the fewest segments or turns. 
                      Effective for shorter distances in dense networks.
                    </li>
                    <li>
                      <b>DFS (Depth-First Search)</b>: Explores routes by going as far as possible 
                      along a branch before backtracking. Can discover interesting alternative routes 
                      and scenic detours that other algorithms might miss.
                    </li>
                  </ul>
                  <p className="text-sm mt-3">
                    Try different algorithms and transport modes to see how routes vary. The visual 
                    color coding (blue for A*, red for Dijkstra, green for BFS, orange for DFS) helps 
                    you identify which algorithm calculated your route.
                  </p>
                </div>

                <div className="mt-5 p-3 bg-blue-50 text-blue-800 rounded-md">
                  <h4 className="font-bold mb-2">Location-Based Features</h4>
                  <p className="text-sm">
                    WanderWise offers two ways to discover places around you:
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm">
                    <li>
                      <b>Nearby Places</b>: Shows points of interest around your destination, 
                      perfect for travel planning before you arrive.
                    </li>
                    <li>
                      <b>Around Me</b>: Displays hotels, restaurants, gas stations and shops near 
                      your current location with real-time data, ideal for travelers on the go.
                    </li>
                  </ul>
                  <p className="text-sm mt-2">
                    Both features include ratings, estimated prices in local currency, and filtering options 
                    to help you make informed decisions during your journey.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
