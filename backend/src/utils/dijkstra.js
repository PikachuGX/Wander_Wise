/**
 * Implementation of Dijkstra's algorithm for finding the shortest path
 * between two locations on a map.
 */

// Helper to calculate distance between two points
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
const createGraph = (waypoints) => {
  const graph = {};

  waypoints.forEach((point) => {
    const pointKey = `${point[0]},${point[1]}`;
    graph[pointKey] = {};

    // Connect to other points
    waypoints.forEach((neighbor) => {
      if (point !== neighbor) {
        const neighborKey = `${neighbor[0]},${neighbor[1]}`;
        const distance = calculateDistance(point, neighbor);
        graph[pointKey][neighborKey] = distance;
      }
    });
  });

  return graph;
};

// Dijkstra's algorithm implementation
const dijkstra = (graph, startVertex, endVertex) => {
  const vertices = Object.keys(graph);

  // Initialize distances and visited
  const distances = {};
  const previous = {};
  const visited = {};

  // Set initial distances
  vertices.forEach((vertex) => {
    if (vertex === startVertex) {
      distances[vertex] = 0;
    } else {
      distances[vertex] = Infinity;
    }
    previous[vertex] = null;
  });

  // Main algorithm loop
  let currVertex = startVertex;

  while (currVertex !== endVertex) {
    visited[currVertex] = true;

    // Check neighbors
    const neighbors = Object.keys(graph[currVertex]);
    neighbors.forEach((neighbor) => {
      if (!visited[neighbor]) {
        const newDistance = distances[currVertex] + graph[currVertex][neighbor];
        if (newDistance < distances[neighbor]) {
          distances[neighbor] = newDistance;
          previous[neighbor] = currVertex;
        }
      }
    });

    // Find next vertex to visit (closest unvisited)
    let minDistance = Infinity;
    let nextVertex = null;

    Object.keys(distances).forEach((vertex) => {
      if (!visited[vertex] && distances[vertex] < minDistance) {
        minDistance = distances[vertex];
        nextVertex = vertex;
      }
    });

    // If no path exists
    if (nextVertex === null) {
      return null;
    }

    currVertex = nextVertex;
  }

  // Reconstruct path
  const path = [];
  let current = endVertex;

  while (current !== null) {
    path.unshift(current.split(",").map(Number));
    current = previous[current];
  }

  return {
    path,
    distance: distances[endVertex],
    estimatedTime: distances[endVertex] / 13.89, // ~50 km/h in m/s
  };
};

/**
 * Find the shortest path between source and destination
 * @param {Object} source - Source coordinates {lat, lng}
 * @param {Object} destination - Destination coordinates {lat, lng}
 * @param {Object} options - Additional options
 * @returns {Object} Route information
 */
exports.findShortestPath = (source, destination, options = {}) => {
  // In a real app, we would fetch actual waypoints from a map service
  // For this demo, we're generating waypoints between source and destination

  // Convert to [lng, lat] format that our algorithm expects
  const sourcePoint = [source.lng, source.lat];
  const destPoint = [destination.lng, destination.lat];

  // Generate some waypoints (in real app, these would come from map data)
  const waypoints = [
    sourcePoint,
    [sourcePoint[0] + 0.01, sourcePoint[1] + 0.01],
    [sourcePoint[0] + 0.02, sourcePoint[1] + 0.015],
    [sourcePoint[0] + 0.025, sourcePoint[1] + 0.02],
    [destPoint[0] - 0.015, destPoint[1] - 0.01],
    [destPoint[0] - 0.005, destPoint[1] - 0.005],
    destPoint,
  ];

  // Create graph from waypoints
  const graph = createGraph(waypoints);

  // Run Dijkstra's algorithm
  const startVertex = `${sourcePoint[0]},${sourcePoint[1]}`;
  const endVertex = `${destPoint[0]},${destPoint[1]}`;

  const result = dijkstra(graph, startVertex, endVertex);

  if (!result) {
    throw new Error("No path found between the given points");
  }

  // Calculate total distance
  const totalDistance = result.distance;

  // Estimate travel time based on average speed (in seconds)
  const avgSpeed = options.avgSpeed || 50; // km/h
  const estimatedTime = totalDistance / 1000 / (avgSpeed / 3600); // in seconds

  return {
    path: result.path,
    distance: totalDistance,
    estimatedTime: estimatedTime,
    points: result.path,
  };
};
