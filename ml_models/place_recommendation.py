import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
import os
import json

# Define model file path
MODEL_FILE = 'place_recommendation_model.joblib'

class PlaceRecommendationModel:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.features = ['latitude', 'longitude', 'rating', 'price_level', 'popularity_score']
        
    def preprocess_data(self, data):
        """
        Preprocess the input data for model training or clustering
        """
        # Create scaler if it doesn't exist
        if self.scaler is None:
            self.scaler = StandardScaler()
            data_scaled = self.scaler.fit_transform(data[self.features])
        else:
            data_scaled = self.scaler.transform(data[self.features])
            
        return data_scaled
    
    def train(self, training_data_path, n_clusters=8):
        """
        Train the K-means clustering model on place data
        """
        # Load data
        try:
            df = pd.read_csv(training_data_path)
        except FileNotFoundError:
            print(f"Training data file not found: {training_data_path}")
            # Generate mock data for demo purposes
            df = self._generate_mock_data()
            
        # Preprocess data
        X = self.preprocess_data(df)
        
        # Create and train KMeans model
        self.model = KMeans(n_clusters=n_clusters, random_state=42)
        self.model.fit(X)
        
        # Add cluster labels to original data
        df['cluster'] = self.model.labels_
        
        # Save the model
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'features': self.features
        }, MODEL_FILE)
        print(f"Model saved to {MODEL_FILE}")
        
        # Analyze clusters
        cluster_info = self._analyze_clusters(df)
        
        return cluster_info
    
    def recommend(self, user_location, preferences=None, k=5):
        """
        Recommend places based on user location and preferences
        
        Args:
            user_location (dict): Dictionary with 'latitude' and 'longitude'
            preferences (dict): User preferences (e.g., 'max_price', 'min_rating')
            k (int): Number of recommendations to return
            
        Returns:
            list: Top k recommended places
        """
        if self.model is None:
            if os.path.exists(MODEL_FILE):
                model_data = joblib.load(MODEL_FILE)
                self.model = model_data['model']
                self.scaler = model_data['scaler']
                self.features = model_data['features']
            else:
                print("Model not trained yet. Training with mock data...")
                self.train('mock_places.csv')
        
        # Load all places (in real system, would fetch from database)
        try:
            places_df = pd.read_csv('mock_places.csv')
        except FileNotFoundError:
            places_df = self._generate_mock_data()
            
        # Find user's cluster
        user_data = pd.DataFrame({
            'latitude': [user_location['latitude']],
            'longitude': [user_location['longitude']],
            'rating': [0],  # Placeholder values
            'price_level': [2],
            'popularity_score': [0]
        })
        
        user_scaled = self.scaler.transform(user_data[self.features])
        user_cluster = self.model.predict(user_scaled)[0]
        
        # Filter places by user preferences
        filtered_places = places_df.copy()
        
        if preferences:
            if 'max_price' in preferences:
                filtered_places = filtered_places[filtered_places['price_level'] <= preferences['max_price']]
            if 'min_rating' in preferences:
                filtered_places = filtered_places[filtered_places['rating'] >= preferences['min_rating']]
            if 'place_type' in preferences:
                filtered_places = filtered_places[filtered_places['type'] == preferences['place_type']]
                
        # Calculate distance from user location
        filtered_places['distance'] = filtered_places.apply(
            lambda row: self._haversine_distance(
                user_location['latitude'], user_location['longitude'],
                row['latitude'], row['longitude']
            ),
            axis=1
        )
        
        # Prioritize places from user's cluster and then by proximity and rating
        # Combine into a score: distance weight (0.5) + rating weight (0.3) + cluster match (0.2)
        max_distance = filtered_places['distance'].max() or 1  # Avoid division by zero
        
        filtered_places['score'] = (
            (1 - filtered_places['distance'] / max_distance) * 0.5 +
            (filtered_places['rating'] / 5) * 0.3 +
            (filtered_places['cluster'] == user_cluster).astype(int) * 0.2
        )
        
        # Get top k recommendations
        top_recommendations = filtered_places.sort_values('score', ascending=False).head(k)
        
        # Convert to list of dictionaries for API response
        recommendations = top_recommendations.to_dict('records')
        
        return recommendations
    
    def _haversine_distance(self, lat1, lon1, lat2, lon2):
        """
        Calculate the Haversine distance between two points in kilometers
        """
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        c = 2 * np.arcsin(np.sqrt(a))
        r = 6371  # Radius of earth in kilometers
        
        return c * r
    
    def _analyze_clusters(self, df):
        """
        Analyze clusters to understand what each represents
        """
        cluster_info = {}
        
        for cluster_id in range(self.model.n_clusters):
            cluster_df = df[df['cluster'] == cluster_id]
            
            # Get cluster characteristics
            cluster_info[cluster_id] = {
                'size': len(cluster_df),
                'avg_rating': cluster_df['rating'].mean(),
                'avg_price': cluster_df['price_level'].mean(),
                'avg_popularity': cluster_df['popularity_score'].mean(),
                'most_common_type': cluster_df['type'].value_counts().index[0] if 'type' in cluster_df else 'unknown'
            }
            
        return cluster_info
    
    def _generate_mock_data(self, n_samples=200):
        """
        Generate mock place data for demonstration purposes
        """
        np.random.seed(42)
        
        # Generate place types and their rough geographical regions
        place_types = ['hotel', 'restaurant', 'gas_station', 'attraction', 'rest_area']
        type_regions = {
            'hotel': {'lat_range': (34.0, 34.2), 'lng_range': (-118.4, -118.2)},
            'restaurant': {'lat_range': (34.05, 34.15), 'lng_range': (-118.35, -118.25)},
            'gas_station': {'lat_range': (34.0, 34.3), 'lng_range': (-118.5, -118.1)},
            'attraction': {'lat_range': (34.05, 34.1), 'lng_range': (-118.33, -118.28)},
            'rest_area': {'lat_range': (34.02, 34.25), 'lng_range': (-118.45, -118.15)}
        }
        
        data = []
        place_ids = []
        
        for i in range(n_samples):
            place_type = np.random.choice(place_types)
            region = type_regions[place_type]
            
            # Generate location within the type's typical region
            lat = np.random.uniform(region['lat_range'][0], region['lat_range'][1])
            lng = np.random.uniform(region['lng_range'][0], region['lng_range'][1])
            
            # Generate other attributes
            rating = np.random.uniform(1, 5)
            price_level = np.random.randint(1, 5)
            popularity = np.random.uniform(0, 100)
            
            # Generate a unique place_id
            place_id = f"place_{i}"
            place_ids.append(place_id)
            
            # Generate place name based on type
            if place_type == 'hotel':
                name = f"{np.random.choice(['Grand', 'Luxury', 'Comfort', 'Budget', 'Royal'])} Hotel {i}"
            elif place_type == 'restaurant':
                name = f"{np.random.choice(['Tasty', 'Delicious', 'Gourmet', 'Quick', 'Fancy'])} Eats {i}"
            elif place_type == 'gas_station':
                name = f"{np.random.choice(['Fast', 'Quick', 'Super', 'Economy', 'Value'])} Gas {i}"
            elif place_type == 'attraction':
                name = f"{np.random.choice(['Amazing', 'Spectacular', 'Historic', 'Fun', 'Must-See'])} Attraction {i}"
            else:  # rest_area
                name = f"Rest Stop {i}"
                
            data.append({
                'place_id': place_id,
                'name': name,
                'type': place_type,
                'latitude': lat,
                'longitude': lng,
                'rating': rating,
                'price_level': price_level,
                'popularity_score': popularity,
                'address': f"{i} Mock Street, Los Angeles, CA"
            })
            
        df = pd.DataFrame(data)
        
        # Save mock data
        df.to_csv('mock_places.csv', index=False)
        
        return df

def serve_recommendations(request_data):
    """
    Serve recommendations from JSON input for API integration
    
    Args:
        request_data (dict): JSON input with user location and preferences
        
    Returns:
        dict: Recommendation results
    """
    model = PlaceRecommendationModel()
    
    try:
        user_location = {
            'latitude': request_data['latitude'],
            'longitude': request_data['longitude']
        }
        
        preferences = request_data.get('preferences', {})
        k = request_data.get('limit', 5)
        
        recommendations = model.recommend(user_location, preferences, k)
        
        return {
            'recommendations': recommendations,
            'count': len(recommendations),
            'status': 'success'
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

if __name__ == "__main__":
    # Example of training and using the model
    model = PlaceRecommendationModel()
    
    # Train model with mock data
    cluster_info = model.train('mock_places.csv')
    print("Cluster information:")
    for cluster_id, info in cluster_info.items():
        print(f"Cluster {cluster_id}: {info}")
    
    # Example recommendation
    user_location = {
        'latitude': 34.1,
        'longitude': -118.3
    }
    
    preferences = {
        'max_price': 3,
        'min_rating': 4,
        'place_type': 'restaurant'
    }
    
    recommendations = model.recommend(user_location, preferences)
    print("\nTop recommendations:")
    for i, place in enumerate(recommendations):
        print(f"{i+1}. {place['name']} ({place['type']})")
        print(f"   Rating: {place['rating']}/5, Price: {place['price_level']}/4")
        print(f"   Distance: {place['distance']:.2f} km")
        print(f"   Score: {place['score']:.2f}")
        print() 