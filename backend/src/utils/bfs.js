/**
 * Implementation of Breadth-First Search (BFS) algorithm for finding a path
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

// BFS algorithm implementation
const bfs = (graph, startVertex, endVertex) => {
  const vertices = Object.keys(graph);
  
  // Initialize queue, visited, and previous
  const queue = [startVertex];
  const visited = {};
  const previous = {};
  const distances = {};
  
  // Set initial values
  vertices.forEach((vertex) => {
    visited[vertex] = false;
    previous[vertex] = null;
    distances[vertex] = Infinity;
  });
  
  visited[startVertex] = true;
  distances[startVertex] = 0;
  
  // Main BFS loop
  while (queue.length > 0) {
    const currVertex = queue.shift();
    
    // If we've reached the destination
    if (currVertex === endVertex) {
      break;
    }
    
    // Visit all neighbors
    const neighbors = Object.keys(graph[currVertex]);
    neighbors.forEach((neighbor) => {
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        previous[neighbor] = currVertex;
        distances[neighbor] = distances[currVertex] + graph[currVertex][neighbor];
        queue.push(neighbor);
      }
    });
  }
  
  // If no path exists
  if (!visited[endVertex]) {
    return null;
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
 * Find a path between source and destination using BFS
 * @param {Object} source - Source coordinates {lat, lng}
 * @param {Object} destination - Destination coordinates {lat, lng}
 * @param {Object} options - Additional options
 * @returns {Object} Route information
 */
exports.findPath = (source, destination, options = {}) => {
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

  // Run BFS algorithm
  const startVertex = `${sourcePoint[0]},${sourcePoint[1]}`;
  const endVertex = `${destPoint[0]},${destPoint[1]}`;

  const result = bfs(graph, startVertex, endVertex);

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