const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Routes
const routeRoutes = require("./routes/routes");
const recommendationRoutes = require("./routes/recommendations");
const predictionRoutes = require("./routes/predictions");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/traveler-guide"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Routes
app.use("/api/routes", routeRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/predictions", predictionRoutes);

// Home route
app.get("/", (req, res) => {
  res.send("Traveler Guide API is running");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
