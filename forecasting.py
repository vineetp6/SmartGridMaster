import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

logger = logging.getLogger(__name__)

class DemandForecaster:
    """
    Demand forecasting module for power grid optimization
    Uses machine learning to predict future power demand
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        
    def _prepare_features(self, historical_data):
        """Prepare features for the forecasting model"""
        df = pd.DataFrame(historical_data)
        
        # Extract date components
        df['date'] = pd.to_datetime(df['date'])
        df['dayofweek'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['day'] = df['date'].dt.day
        df['is_weekend'] = df['dayofweek'].apply(lambda x: 1 if x >= 5 else 0)
        
        # Sort by date (oldest first)
        df = df.sort_values('date')
        
        # Create lag features
        df['demand_lag1'] = df['average_demand'].shift(1)
        df['demand_lag2'] = df['average_demand'].shift(2)
        df['demand_lag7'] = df['average_demand'].shift(7)  # Previous week
        
        # Create rolling window features
        df['demand_rolling_mean3'] = df['average_demand'].rolling(window=3).mean()
        df['demand_rolling_mean7'] = df['average_demand'].rolling(window=7).mean()
        
        # Drop rows with NaN (first 7 rows)
        df = df.dropna()
        
        # Features to use in the model
        feature_columns = [
            'dayofweek', 'month', 'day', 'is_weekend',
            'demand_lag1', 'demand_lag2', 'demand_lag7',
            'demand_rolling_mean3', 'demand_rolling_mean7'
        ]
        
        # Target
        target_column = 'average_demand'
        
        X = df[feature_columns].values
        y = df[target_column].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled, y, df, feature_columns
    
    def train_model(self, historical_data):
        """Train the forecasting model on historical data"""
        try:
            X_scaled, y, df, feature_columns = self._prepare_features(historical_data)
            
            # Split data into training and validation sets
            X_train, X_val, y_train, y_val = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42
            )
            
            # Train a Random Forest model
            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            model.fit(X_train, y_train)
            
            # Evaluate the model
            train_score = model.score(X_train, y_train)
            val_score = model.score(X_val, y_val)
            
            logger.info(f"Model training complete. Train R² score: {train_score:.4f}, Validation R² score: {val_score:.4f}")
            
            self.model = model
            return {
                "success": True,
                "train_score": train_score,
                "validation_score": val_score,
                "feature_importance": dict(zip(feature_columns, model.feature_importances_.tolist()))
            }
            
        except Exception as e:
            logger.error(f"Error training demand forecasting model: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def forecast_demand(self, historical_data, forecast_days=7):
        """Generate power demand forecast for the specified number of days"""
        try:
            # First, train the model if not already trained
            if self.model is None:
                training_result = self.train_model(historical_data)
                if not training_result["success"]:
                    return training_result
            
            # Prepare features
            X_scaled, y, df, feature_columns = self._prepare_features(historical_data)
            
            # Start forecasting from the last date in the historical data
            last_date = df['date'].max()
            
            # Initialize forecast results
            forecast_results = []
            
            # Create a copy of the latest data for forecasting
            last_row = df.iloc[-1].copy()
            
            # Forecast for each day
            for i in range(1, forecast_days + 1):
                forecast_date = last_date + timedelta(days=i)
                
                # Update date-related features
                last_row['date'] = forecast_date
                last_row['dayofweek'] = forecast_date.dayofweek
                last_row['month'] = forecast_date.month
                last_row['day'] = forecast_date.day
                last_row['is_weekend'] = 1 if forecast_date.dayofweek >= 5 else 0
                
                # Extract features for prediction
                X_forecast = last_row[feature_columns].values.reshape(1, -1)
                X_forecast_scaled = self.scaler.transform(X_forecast)
                
                # Make prediction
                predicted_demand = self.model.predict(X_forecast_scaled)[0]
                
                # Add to forecast results
                forecast_results.append({
                    "date": forecast_date.strftime("%Y-%m-%d"),
                    "predicted_demand": round(predicted_demand, 2),
                    "lower_bound": round(predicted_demand * 0.95, 2),  # 5% lower bound
                    "upper_bound": round(predicted_demand * 1.05, 2)   # 5% upper bound
                })
                
                # Update lag features for next prediction
                # Store current prediction for next iteration's lag features
                last_row['demand_lag7'] = last_row['demand_lag2']  # Shift previous lag2 to lag7
                last_row['demand_lag2'] = last_row['demand_lag1']  # Shift previous lag1 to lag2
                last_row['demand_lag1'] = predicted_demand  # Set lag1 to current prediction
                
                # Update rolling means
                last_row['demand_rolling_mean3'] = (
                    last_row['demand_lag1'] + last_row['demand_lag2'] + 
                    (last_row['average_demand'] if i == 1 else forecast_results[-2]['predicted_demand'])
                ) / 3
                
                # Update rolling mean for 7 days
                # For simplicity, use the available values and pad with the predicted_demand
                last_row['demand_rolling_mean7'] = (
                    last_row['demand_lag1'] + last_row['demand_lag2'] + last_row['demand_lag7'] + 
                    predicted_demand * 4  # Fill the missing values with the current prediction
                ) / 7
            
            return {
                "success": True,
                "forecast": forecast_results
            }
            
        except Exception as e:
            logger.error(f"Error generating demand forecast: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                # Provide a fallback forecast for UI development
                "fallback_forecast": self._get_fallback_forecast(forecast_days)
            }
    
    def _get_fallback_forecast(self, forecast_days=7):
        """Generate a fallback forecast when the model fails"""
        base_demand = 320000  # Base demand in MW
        forecast_results = []
        
        for i in range(1, forecast_days + 1):
            forecast_date = datetime.now() + timedelta(days=i)
            daily_variation = 15000 * (((i % 7) - 3) / 3)  # Weekly pattern
            
            predicted_demand = base_demand + daily_variation
            
            forecast_results.append({
                "date": forecast_date.strftime("%Y-%m-%d"),
                "predicted_demand": round(predicted_demand, 2),
                "lower_bound": round(predicted_demand * 0.95, 2),
                "upper_bound": round(predicted_demand * 1.05, 2)
            })
        
        return forecast_results
