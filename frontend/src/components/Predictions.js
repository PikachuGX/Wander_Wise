import React, { useState } from "react";
import {
  FaClock,
  FaChartLine,
  FaRegCalendarAlt,
  FaInfoCircle,
} from "react-icons/fa";
import { predictionsService } from "../services/api";

const TrafficLevels = {
  light: { color: "bg-green-400", text: "Light Traffic" },
  moderate: { color: "bg-yellow-400", text: "Moderate Traffic" },
  heavy: { color: "bg-red-400", text: "Heavy Traffic" },
};

const Predictions = ({ source, destination, onPredictionComplete }) => {
  // State
  const [predictionType, setPredictionType] = useState("travel-time");
  const [trafficModel, setTrafficModel] = useState("best_guess");
  const [departureTime, setDepartureTime] = useState("now");
  const [customDate, setCustomDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [customTime, setCustomTime] = useState("08:00");
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [trafficPrediction, setTrafficPrediction] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Make prediction
  const makePrediction = async () => {
    if (!source || !destination) {
      showToast(
        "Please calculate a route first to get source and destination locations",
        "error"
      );
      return;
    }

    setIsLoading(true);

    try {
      // Get departure date/time
      let departureTimeValue;
      if (departureTime === "now") {
        departureTimeValue = new Date().toISOString();
      } else if (departureTime === "custom") {
        const dateTimeStr = `${customDate}T${customTime}:00`;
        departureTimeValue = new Date(dateTimeStr).toISOString();
      }

      if (predictionType === "travel-time") {
        // Predict travel time
        const response = await predictionsService.predictTravelTime(
          source,
          destination,
          departureTimeValue,
          trafficModel
        );

        setPrediction(response.data.prediction);
        setTrafficPrediction(null);
        setHistoricalData(null);

        // Notify parent component about the prediction
        if (onPredictionComplete) {
          onPredictionComplete(response.data.prediction);
        }
      } else if (predictionType === "traffic") {
        // Predict traffic
        const response = await predictionsService.predictTraffic(
          [source, destination],
          departureTimeValue
        );

        setTrafficPrediction(response.data.prediction);
        setPrediction(null);
        setHistoricalData(null);
      } else if (predictionType === "historical") {
        // Get historical data
        const response = await predictionsService.getHistoricalData(
          JSON.stringify(source),
          JSON.stringify(destination),
          10 // limit to 10 entries
        );

        setHistoricalData(response.data.data);
        setPrediction(null);
        setTrafficPrediction(null);
      }

      showToast(
        "AI model has generated the prediction based on historical data"
      );
    } catch (error) {
      console.error("Error making prediction:", error);
      showToast(error.message || "Error making prediction", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Format duration in human-readable form
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours === 0) {
      return `${mins} minutes`;
    } else if (mins === 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    } else {
      return `${hours} hour${hours > 1 ? "s" : ""} ${mins} min`;
    }
  };

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Travel Time & Traffic Predictions
      </h2>

      {!source || !destination ? (
        <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 rounded-lg border border-yellow-200">
          <FaInfoCircle className="text-yellow-500 text-3xl mb-4" />
          <h3 className="text-lg font-medium text-yellow-800">
            No Route Selected
          </h3>
          <p className="text-yellow-700 mt-2 text-center">
            Please use the Map tab to calculate a route first.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prediction Type
              </label>
              <select
                value={predictionType}
                onChange={(e) => setPredictionType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
              >
                <option value="travel-time">Travel Time</option>
                <option value="traffic">Traffic Conditions</option>
                <option value="historical">Historical Data</option>
              </select>
            </div>

            {predictionType === "travel-time" && (
              <div className="w-full md:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Traffic Model
                </label>
                <select
                  value={trafficModel}
                  onChange={(e) => setTrafficModel(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                >
                  <option value="best_guess">Best Guess</option>
                  <option value="optimistic">Optimistic</option>
                  <option value="pessimistic">Pessimistic</option>
                </select>
              </div>
            )}

            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Time
              </label>
              <select
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
              >
                <option value="now">Now</option>
                <option value="custom">Custom Date/Time</option>
              </select>
            </div>

            {departureTime === "custom" && (
              <>
                <div className="w-full md:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="w-full md:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                  />
                </div>
              </>
            )}

            <div className="w-full md:w-48 flex items-end">
              <button
                onClick={makePrediction}
                disabled={isLoading}
                className="w-full p-2 bg-teal-500 text-white font-medium rounded hover:bg-teal-600 transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <FaChartLine className="mr-2" />
                )}
                Generate Prediction
              </button>
            </div>
          </div>

          {/* Results Section */}
          {prediction && (
            <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FaClock className="mr-2 text-teal-500" /> Travel Time
                Prediction
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-600 text-sm">
                    Predicted Travel Time
                  </div>
                  <div className="text-2xl font-bold text-teal-600">
                    {formatDuration(prediction.travelTimeMinutes)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {trafficModel === "best_guess"
                      ? "Based on typical conditions"
                      : trafficModel === "optimistic"
                      ? "Assuming light traffic"
                      : "Assuming heavy traffic"}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-600 text-sm">Distance</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {prediction.distanceKm.toFixed(1)} km
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(prediction.distanceKm * 0.621371).toFixed(1)} miles
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-600 text-sm">Average Speed</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {prediction.averageSpeedKmh.toFixed(0)} km/h
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(prediction.averageSpeedKmh * 0.621371).toFixed(0)} mph
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-800 text-sm">
                <strong>Note:</strong> Predictions are based on historical data,
                current conditions, and machine learning algorithms. Actual
                travel times may vary.
              </div>
            </div>
          )}

          {trafficPrediction && (
            <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">
                Traffic Conditions Prediction
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-600 text-sm">Traffic Level</div>
                  <div
                    className={`text-xl font-bold mt-1 px-2 py-1 rounded-md inline-block ${
                      TrafficLevels[trafficPrediction.trafficLevel].color
                    } text-white`}
                  >
                    {TrafficLevels[trafficPrediction.trafficLevel].text}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Congestion Level:{" "}
                    {(trafficPrediction.congestionPercentage * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-600 text-sm">Expected Delay</div>
                  <div className="text-xl font-bold text-red-600 mt-1">
                    +{formatDuration(trafficPrediction.delayMinutes)}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {trafficPrediction.delayMinutes > 10
                      ? "Consider alternative routes"
                      : "Delay within acceptable range"}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Congestion Forecast</h4>
                <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      trafficPrediction.congestionPercentage < 0.3
                        ? "bg-green-500"
                        : trafficPrediction.congestionPercentage < 0.7
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${trafficPrediction.congestionPercentage * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Light</span>
                  <span>Moderate</span>
                  <span>Heavy</span>
                </div>
              </div>
            </div>
          )}

          {historicalData && historicalData.length > 0 && (
            <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FaRegCalendarAlt className="mr-2 text-teal-500" /> Historical
                Travel Data
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Travel Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Traffic Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historicalData.map((data, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(data.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(data.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(data.travelTimeMinutes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              data.trafficLevel === "light"
                                ? "bg-green-100 text-green-800"
                                : data.trafficLevel === "moderate"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {data.trafficLevel.charAt(0).toUpperCase() +
                              data.trafficLevel.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast notification */}
      {toast.show && (
        <div
          className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg 
            ${
              toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Predictions;
