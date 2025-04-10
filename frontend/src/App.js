import React, { useState } from "react";
import { FaMapMarkedAlt, FaRoute, FaHotel, FaInfoCircle } from "react-icons/fa";

// Import components
import Map from "./components/Map";
import NearbyPlaces from "./components/NearbyPlaces";
import Recommendations from "./components/Recommendations";

function App() {
  // State
  const [currentRoute, setCurrentRoute] = useState(null);
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [sourceInputValue, setSourceInputValue] = useState('');
  const [destinationInputValue, setDestinationInputValue] = useState('');

  // Handle route calculation
  const handleRouteCalculated = (source, destination, route) => {
    setSourceLocation(source);
    setDestinationLocation(destination);
    setCurrentRoute(route);
    
    // Store the input values in state
    setSourceInputValue(source.name);
    setDestinationInputValue(destination.name);
    
    // Remove automatic switching to nearby places tab
    // setTimeout(() => {
    //   setActiveTab(1);
    // }, 1000);
  };

  // Handle input value changes
  const handleInputValueChange = (type, value) => {
    if (type === 'source') {
      setSourceInputValue(value);
    } else if (type === 'destination') {
      setDestinationInputValue(value);
    }
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
              />
            </div>
          )}

          {/* Nearby Places Tab */}
          {activeTab === 1 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <NearbyPlaces destination={destinationLocation} />
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
                  Traveler Guide is an application designed to help travelers
                  plan their journeys with intelligent routing and nearby place
                  recommendations.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">
                  Key Features
                </h3>

                <div className="pl-4 mb-6">
                  <p className="mb-2">
                    • Interactive Google Maps with route visualization
                  </p>
                  <p className="mb-2">
                    • Optimal route calculation using Dijkstra's and A*
                    algorithms
                  </p>
                  <p className="mb-2">
                    • Place recommendations (hotels, restaurants, gas stations)
                  </p>
                  <p className="mb-2">
                    • Route preferences (no tolls, scenic routes)
                  </p>
                </div>

                <h3 className="text-xl font-semibold mb-3">Technology Stack</h3>

                <div className="pl-4 mb-6">
                  <p className="mb-2">
                    • Frontend: React.js with Google Maps JavaScript API,
                    Tailwind CSS
                  </p>
                  <p className="mb-2">• Backend: Node.js with Express</p>
                  <p className="mb-2">• Database: MongoDB</p>
                </div>

                <div className="mt-5 p-3 bg-yellow-50 text-yellow-800 rounded-md">
                  <h4 className="font-bold">Dijkstra vs A* Algorithms</h4>
                  <p className="text-sm mt-1">
                    Both algorithms find the shortest path between two points,
                    but they work differently:
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm">
                    <li>
                      <b>Dijkstra's Algorithm</b>: Explores all possible paths
                      equally in all directions until it finds the destination
                    </li>
                    <li>
                      <b>A* Algorithm</b>: Uses heuristics to prioritize paths
                      that seem more likely to lead to the destination, making
                      it generally more efficient
                    </li>
                  </ul>
                  <p className="text-sm mt-2">
                    In practical use on road networks, their results are often
                    similar, but A* typically reaches the solution faster.
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
