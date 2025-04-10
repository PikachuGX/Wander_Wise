import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib
import os
import json

# Define model file path
MODEL_FILE = 'travel_time_model.joblib'

class TravelTimePredictionModel:
    def __init__(self):
        self.model = None
        self.features = ['distance', 'day_of_week', 'hour_of_day', 'is_holiday', 'is_rush_hour', 'weather_condition']
        
    def preprocess_data(self, data):
        """
        Preprocess the input data for model training or prediction
        """
        # Convert weather condition to numerical
        weather_mapping = {
            'clear': 0,
            'rain': 1,
            'snow': 2,
            'fog': 3,
            'storm': 4
        }
        
        # Apply mapping if string weather condition
        if 'weather_condition' in data and isinstance(data['weather_condition'][0], str):
            data['weather_condition'] = data['weather_condition'].map(weather_mapping)
        
        # One-hot encode day of week
        if 'day_of_week' in data:
            data = pd.get_dummies(data, columns=['day_of_week'], prefix='day')
        
        return data
    
    def train(self, training_data_path):
        """
        Train the model on historical travel time data
        """
        # Load data
        try:
            df = pd.read_csv(training_data_path)
        except FileNotFoundError:
            print(f"Training data file not found: {training_data_path}")
            # Generate mock data for demo purposes
            df = self._generate_mock_data()
            
        # Preprocess data
        df = self.preprocess_data(df)
        
        # Split features and target
        X = df[self.features]
        y = df['travel_time_minutes']
        
        # Split into training and validation sets
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Create and train the model
        self.model = Pipeline([
            ('scaler', StandardScaler()),
            ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
        ])
        
        self.model.fit(X_train, y_train)
        
        # Evaluate the model
        train_score = self.model.score(X_train, y_train)
        val_score = self.model.score(X_val, y_val)
        
        print(f"Model training complete. Train R² score: {train_score:.4f}, Validation R² score: {val_score:.4f}")
        
        # Save the model
        joblib.dump(self.model, MODEL_FILE)
        print(f"Model saved to {MODEL_FILE}")
        
        return train_score, val_score
    
    def predict(self, features):
        """
        Predict travel time given input features
        
        Args:
            features (dict): Dictionary containing feature values
            
        Returns:
            float: Predicted travel time in minutes
        """
        if self.model is None:
            if os.path.exists(MODEL_FILE):
                self.model = joblib.load(MODEL_FILE)
            else:
                print("Model not trained yet. Training with mock data...")
                self.train('mock_data.csv')
        
        # Convert input to DataFrame
        input_df = pd.DataFrame([features])
        
        # Preprocess input
        input_df = self.preprocess_data(input_df)
        
        # Make prediction
        prediction = self.model.predict(input_df)[0]
        
        return prediction
    
    def _generate_mock_data(self, n_samples=1000):
        """
        Generate mock data for demonstration purposes
        """
        np.random.seed(42)
        
        data = {
            'distance': np.random.uniform(1, 100, n_samples),  # km
            'day_of_week': np.random.randint(0, 7, n_samples),  # 0=Sunday, 6=Saturday
            'hour_of_day': np.random.randint(0, 24, n_samples),
            'is_holiday': np.random.choice([0, 1], n_samples, p=[0.9, 0.1]),
            'is_rush_hour': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),
            'weather_condition': np.random.randint(0, 5, n_samples),  # 0=clear, 1=rain, 2=snow, 3=fog, 4=storm
        }
        
        df = pd.DataFrame(data)
        
        # Generate travel time based on features with some noise
        base_speed = 60  # km/h
        
        # Effect of different factors
        rush_hour_factor = 0.7  # 30% slower in rush hour
        holiday_factor = 1.1    # 10% faster on holidays
        weather_factors = [1.0, 0.9, 0.7, 0.8, 0.6]  # Speed factors for different weather conditions
        
        # Calculate travel time
        travel_times = []
        for i in range(n_samples):
            speed = base_speed
            
            # Adjust for rush hour
            if df.loc[i, 'is_rush_hour'] == 1:
                speed *= rush_hour_factor
                
            # Adjust for holidays
            if df.loc[i, 'is_holiday'] == 1:
                speed *= holiday_factor
                
            # Adjust for weather
            weather = int(df.loc[i, 'weather_condition'])
            speed *= weather_factors[weather]
            
            # Calculate time (hours) = distance / speed
            time_hours = df.loc[i, 'distance'] / speed
            
            # Convert to minutes and add random noise
            time_minutes = time_hours * 60 * (1 + np.random.normal(0, 0.1))
            travel_times.append(max(1, time_minutes))  # Ensure positive time
            
        df['travel_time_minutes'] = travel_times
        
        # Save mock data
        df.to_csv('mock_data.csv', index=False)
        
        return df

def serve_prediction(data):
    """
    Serve prediction from JSON input for API integration
    
    Args:
        data (dict): JSON input with prediction features
        
    Returns:
        dict: Prediction results
    """
    model = TravelTimePredictionModel()
    
    try:
        prediction = model.predict(data)
        
        return {
            'predicted_time_minutes': round(prediction, 2),
            'confidence': 0.85,  # Mock confidence score
            'status': 'success'
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

if __name__ == "__main__":
    # Example of training and using the model
    model = TravelTimePredictionModel()
    
    # Train model with mock data
    model.train('mock_data.csv')
    
    # Example prediction
    test_features = {
        'distance': 50,  # 50 km
        'day_of_week': 1,  # Monday
        'hour_of_day': 8,  # 8 AM (rush hour)
        'is_holiday': 0,  # Not a holiday
        'is_rush_hour': 1,  # Rush hour
        'weather_condition': 0  # Clear weather
    }
    
    prediction = model.predict(test_features)
    print(f"Predicted travel time: {prediction:.2f} minutes") 