/**
 * Implementation of A* algorithm for finding the optimal path
 * between two locations on a map.
 */

// Helper to calculate distance between two points (Haversine formula)
const calculateDistance = (point1, point2) => {
  const [lng1, lat1] = point1;
  const [lng2, lat2] = point2;

  // Convert latitude and longitude from degrees to radians
  const radLat1 = (Math.PI * lat1) / 180;
  const radLat2 = (Math.PI * lat2) / 180;
  const theta = lng1 - lng2;
  const radTheta = (Math.PI * theta) / 180;

  let dist =
    Math.sin(radLat1) * Math.sin(radLat2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radTheta);

  dist =
    ((Math.acos(Math.min(dist, 1)) * 180) / Math.PI) *
    60 *
    1.1515 *
    1.609344 *
    1000;

  return dist; // in meters
};

// Helper to create a graph from waypoints
const createGraph = (waypoints, preferences = {}) => {
  const graph = {};

  waypoints.forEach((point) => {
    const pointKey = `${point[0]},${point[1]}`;
    graph[pointKey] = {};

    // Connect to other points
    waypoints.forEach((neighbor) => {
      if (point !== neighbor) {
        const neighborKey = `${neighbor[0]},${neighbor[1]}`;
        let distance = calculateDistance(point, neighbor);

        // Apply preference weights
        if (preferences.avoidHighways && point[2] === "highway") {
          distance *= 1.5; // Increase cost for highways
        }
        if (preferences.avoidTolls && point[3] === "toll") {
          distance *= 2; // Increase cost for toll roads
        }
        if (preferences.scenic && point[4] === "scenic") {
          distance *= 0.8; // Decrease cost for scenic routes
        }

        graph[pointKey][neighborKey] = distance;
      }
    });
  });

  return graph;
};

// A* algorithm implementation
const aStar = (graph, startVertex, endVertex, endPoint) => {
  const vertices = Object.keys(graph);

  // Open and closed sets
  const openSet = new Set([startVertex]);
  const closedSet = new Set();

  // Cost from start to current node
  const gScore = {};
  vertices.forEach((vertex) => {
    gScore[vertex] = Infinity;
  });
  gScore[startVertex] = 0;

  // Estimated total cost from start to goal through current
  const fScore = {};
  vertices.forEach((vertex) => {
    fScore[vertex] = Infinity;
  });

  // Heuristic cost (straight line distance to end)
  const endCoords = endPoint;
  fScore[startVertex] = calculateDistance(
    startVertex.split(",").map(Number),
    endCoords
  );

  // Track path
  const cameFrom = {};

  // Main algorithm loop
  while (openSet.size > 0) {
    // Get node with lowest fScore from openSet
    let currentVertex = null;
    let lowestFScore = Infinity;

    openSet.forEach((vertex) => {
      if (fScore[vertex] < lowestFScore) {
        lowestFScore = fScore[vertex];
        currentVertex = vertex;
      }
    });

    // If we've reached the end
    if (currentVertex === endVertex) {
      // Reconstruct path
      const path = [];
      let current = endVertex;

      while (current) {
        path.unshift(current.split(",").map(Number));
        current = cameFrom[current];
      }

      return {
        path,
        distance: gScore[endVertex],
        estimatedTime: gScore[endVertex] / 13.89, // ~50 km/h in m/s
      };
    }

    // Move current from open to closed
    openSet.delete(currentVertex);
    closedSet.add(currentVertex);

    // Check all neighbors
    Object.keys(graph[currentVertex]).forEach((neighbor) => {
      if (closedSet.has(neighbor)) {
        return; // Skip neighbors in closed set
      }

      // Calculate tentative gScore
      const tentativeGScore =
        gScore[currentVertex] + graph[currentVertex][neighbor];

      // If this is a new node or better path
      if (!openSet.has(neighbor) || tentativeGScore < gScore[neighbor]) {
        // Record this path
        cameFrom[neighbor] = currentVertex;
        gScore[neighbor] = tentativeGScore;

        // Update fScore with heuristic
        const heuristic = calculateDistance(
          neighbor.split(",").map(Number),
          endCoords
        );
        fScore[neighbor] = gScore[neighbor] + heuristic;

        // Add to open set if not there
        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        }
      }
    });
  }

  // If we get here, no path found
  return null;
};

/**
 * Find the optimal path between source and destination using A* algorithm
 * @param {Object} source - Source coordinates {lat, lng}
 * @param {Object} destination - Destination coordinates {lat, lng}
 * @param {Object} options - Options including preferences, transportMode and avgSpeed 
 * @returns {Object} Route information
 */
exports.findOptimalPath = (source, destination, options = {}) => {
  const { transportMode, avgSpeed, ...preferences } = options;
  
  // Convert to [lng, lat] format
  const sourcePoint = [source.lng, source.lat];
  const destPoint = [destination.lng, destination.lat];

  // In a real app, these waypoints would come from a map service
  // For this demo, we're generating mock waypoints
  const waypoints = [
    sourcePoint,
    [
      sourcePoint[0] + 0.01,
      sourcePoint[1] + 0.01,
      "normal",
      "no-toll",
      "not-scenic",
    ],
    [
      sourcePoint[0] + 0.02,
      sourcePoint[1] + 0.015,
      "highway",
      "toll",
      "not-scenic",
    ],
    [
      sourcePoint[0] + 0.018,
      sourcePoint[1] + 0.02,
      "normal",
      "no-toll",
      "scenic",
    ],
    [
      sourcePoint[0] + 0.025,
      sourcePoint[1] + 0.025,
      "highway",
      "no-toll",
      "not-scenic",
    ],
    [destPoint[0] - 0.015, destPoint[1] - 0.01, "normal", "no-toll", "scenic"],
    [
      destPoint[0] - 0.005,
      destPoint[1] - 0.005,
      "normal",
      "no-toll",
      "not-scenic",
    ],
    destPoint,
  ];

  // Create weighted graph based on preferences
  const graph = createGraph(waypoints, preferences);

  // Run A* algorithm
  const startVertex = `${sourcePoint[0]},${sourcePoint[1]}`;
  const endVertex = `${destPoint[0]},${destPoint[1]}`;

  const result = aStar(graph, startVertex, endVertex, destPoint);

  if (!result) {
    throw new Error("No path found between the given points");
  }

  // Calculate total distance
  const totalDistance = result.distance;

  // Determine travel speed based on transport mode and preferences
  let speed = avgSpeed || 50; // Default 50 km/h
  
  // Adjust for specific preferences
  if (preferences.fastestRoute) {
    speed *= 1.2; // 20% faster
  } else if (preferences.scenic) {
    speed *= 0.8; // 20% slower for scenic routes
  }

  // Special handling for flying mode
  if (transportMode === "flying") {
    // For flying, we use a direct path, but the algorithm still works
    // In real app, we'd handle this differently
    speed = 800; // 800 km/h for flights
  }

  const estimatedTime = totalDistance / 1000 / (speed / 3600); // in seconds

  return {
    path: result.path,
    distance: totalDistance,
    estimatedTime: estimatedTime,
    points: result.path,
    transportMode: transportMode || "driving"
  };
};
