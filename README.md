# Traveler Guide System

A full-stack application that helps travelers find optimal routes, predict travel times, and get recommendations for places along their journey.

## 🔹 Features

- Interactive Google Maps with route visualization
- Location autocomplete for source and destination
- Optimal route calculation using Dijkstra's and A\* algorithms
- Travel time prediction using ML (Random Forest Regression)
- Place recommendations (hotels, restaurants, gas stations) using K-Means clustering
- Preferences-based routing (no tolls, shortest, safest, scenic)
- Ability to save routes for offline access

## 🔹 Tech Stack

- **Frontend**: React.js with Google Maps JavaScript API, Chakra UI
- **Backend**: Node.js with Express
- **ML Models**: Python with scikit-learn and TensorFlow
- **Database**: MongoDB

## 🔹 Project Structure

- `/frontend` - React app that integrates Google Maps and UI components
- `/backend` - Express server with RESTful APIs
- `/ml_models` - Python code for ML-based predictions and recommendations
- `/data` - Mock historical data for training models

## 🔹 Setup and Installation

### Prerequisites

- Node.js (v14+)
- Python (v3.7+) with pip
- MongoDB (local or Atlas)
- Google Maps API key

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### ML Models Setup

```bash
cd ml_models
pip install -r requirements.txt
python travel_time_prediction.py
python place_recommendation.py
```

## 🔹 API Endpoints

### Route APIs

- `POST /api/routes/calculate` - Calculate optimal route
- `POST /api/routes/preferences` - Calculate route with preferences
- `GET /api/routes/offline/:routeId` - Get saved route
- `POST /api/routes/save` - Save route for offline access

### Recommendation APIs

- `GET /api/recommendations/places` - Get place recommendations
- `GET /api/recommendations/hotels` - Get hotel recommendations
- `GET /api/recommendations/restaurants` - Get restaurant recommendations
- `GET /api/recommendations/gas-stations` - Get gas station recommendations

### Prediction APIs

- `POST /api/predictions/travel-time` - Predict travel time
- `POST /api/predictions/traffic` - Predict traffic conditions
- `GET /api/predictions/historical-data` - Get historical travel data

## 🔹 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## 🔹 License

This project is licensed under the MIT License - see the LICENSE file for details.
