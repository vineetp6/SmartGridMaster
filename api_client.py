import os
import logging
import requests
import json
from datetime import datetime, timedelta

# Note: pandas is available but not needed in this implementation
# import pandas as pd

logger = logging.getLogger(__name__)

class CEAClient:
    """Client for interacting with the Central Electricity Authority API"""
    
    def __init__(self):
        # For demo purposes, this client will always use fallback methods
        # In a real implementation, the following values would be set:
        self.base_url = "https://cea.nic.in/api"  # Example URL
        self.api_key = os.environ.get("CEA_API_KEY", "")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}" if self.api_key else "",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        # Set use_fallback to True to always use simulated data
        self.use_fallback = True
        
    def _handle_response(self, response):
        """Handle API response and log errors"""
        try:
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            if response.text:
                logger.error(f"Response content: {response.text}")
            raise
        except json.JSONDecodeError:
            logger.error(f"Failed to decode JSON from response: {response.text}")
            raise ValueError("Invalid JSON response from API")
            
    def get_latest_power_data(self):
        """
        Get the latest power generation and consumption data
        
        This is a placeholder implementation as we don't have actual API documentation.
        Replace with actual API endpoints when available.
        """
        # If use_fallback is True, return fallback data immediately
        if self.use_fallback:
            logger.info("Using fallback data for power data")
            return self._get_fallback_power_data()
            
        try:
            # Example endpoint - replace with actual API endpoint
            endpoint = "/power/current"
            response = requests.get(f"{self.base_url}{endpoint}", headers=self.headers)
            data = self._handle_response(response)
            
            # If API call fails or is not available, use the fallback method
            if not data:
                logger.warning("Using fallback method for power data")
                return self._get_fallback_power_data()
                
            return data
            
        except Exception as e:
            logger.error(f"Error fetching latest power data: {str(e)}")
            # Fallback to simulated data for development/demo
            return self._get_fallback_power_data()
    
    def get_historical_data(self, region="all", days=30):
        """
        Get historical power data for the specified region and time period
        
        This is a placeholder implementation as we don't have actual API documentation.
        Replace with actual API endpoints when available.
        """
        # If use_fallback is True, return fallback data immediately
        if self.use_fallback:
            logger.info("Using fallback data for historical data")
            return self._get_fallback_historical_data(region, days)
            
        try:
            # Example endpoint - replace with actual API endpoint
            endpoint = f"/power/historical?region={region}&days={days}"
            response = requests.get(f"{self.base_url}{endpoint}", headers=self.headers)
            data = self._handle_response(response)
            
            # If API call fails or is not available, use the fallback method
            if not data:
                logger.warning("Using fallback method for historical data")
                return self._get_fallback_historical_data(region, days)
                
            return data
            
        except Exception as e:
            logger.error(f"Error fetching historical data: {str(e)}")
            # Fallback to simulated data for development/demo
            return self._get_fallback_historical_data(region, days)
    
    def get_renewable_data(self):
        """
        Get data on renewable energy sources
        
        This is a placeholder implementation as we don't have actual API documentation.
        Replace with actual API endpoints when available.
        """
        # If use_fallback is True, return fallback data immediately
        if self.use_fallback:
            logger.info("Using fallback data for renewable data")
            return self._get_fallback_renewable_data()
            
        try:
            # Example endpoint - replace with actual API endpoint
            endpoint = "/power/renewable"
            response = requests.get(f"{self.base_url}{endpoint}", headers=self.headers)
            data = self._handle_response(response)
            
            # If API call fails or is not available, use the fallback method
            if not data:
                logger.warning("Using fallback method for renewable data")
                return self._get_fallback_renewable_data()
                
            return data
            
        except Exception as e:
            logger.error(f"Error fetching renewable data: {str(e)}")
            # Fallback to simulated data for development/demo
            return self._get_fallback_renewable_data()

    def get_grid_status(self):
        """
        Get current grid status including potential faults
        
        This is a placeholder implementation as we don't have actual API documentation.
        Replace with actual API endpoints when available.
        """
        # If use_fallback is True, return fallback data immediately
        if self.use_fallback:
            logger.info("Using fallback data for grid status")
            return self._get_fallback_grid_status()
            
        try:
            # Example endpoint - replace with actual API endpoint
            endpoint = "/grid/status"
            response = requests.get(f"{self.base_url}{endpoint}", headers=self.headers)
            data = self._handle_response(response)
            
            # If API call fails or is not available, use the fallback method
            if not data:
                logger.warning("Using fallback method for grid status")
                return self._get_fallback_grid_status()
                
            return data
            
        except Exception as e:
            logger.error(f"Error fetching grid status: {str(e)}")
            # Fallback to simulated data for development/demo
            return self._get_fallback_grid_status()
    
    def _get_fallback_power_data(self):
        """Generate fallback power data for development/demo purposes"""
        return {
            "timestamp": datetime.now().isoformat(),
            "total_generation": 325750,  # MW
            "total_consumption": 318200,  # MW
            "regions": {
                "northern": {
                    "generation": 85000,
                    "consumption": 83500,
                    "frequency": 49.98
                },
                "western": {
                    "generation": 105000,
                    "consumption": 102000,
                    "frequency": 50.01
                },
                "southern": {
                    "generation": 65000,
                    "consumption": 63700,
                    "frequency": 49.99
                },
                "eastern": {
                    "generation": 50750,
                    "consumption": 49000,
                    "frequency": 50.02
                },
                "northeastern": {
                    "generation": 20000,
                    "consumption": 20000,
                    "frequency": 50.00
                }
            },
            "generation_mix": {
                "thermal": 190000,
                "hydro": 45750,
                "nuclear": 10000,
                "solar": 45000,
                "wind": 30000,
                "others": 5000
            }
        }
    
    def _get_fallback_historical_data(self, region="all", days=30):
        """Generate fallback historical data for development/demo purposes"""
        data = []
        base_demand = 320000  # Base demand in MW
        
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            daily_variation = 10000 * (((i % 7) - 3) / 3)  # Weekly pattern
            seasonal_variation = 15000 * (0.5 * (i % 365) / 182.5)  # Seasonal pattern
            
            data.append({
                "date": date,
                "peak_demand": int(base_demand + daily_variation + seasonal_variation),
                "minimum_demand": int((base_demand + daily_variation + seasonal_variation) * 0.65),
                "average_demand": int((base_demand + daily_variation + seasonal_variation) * 0.82)
            })
        
        return data
    
    def _get_fallback_renewable_data(self):
        """Generate fallback renewable energy data for development/demo purposes"""
        return {
            "timestamp": datetime.now().isoformat(),
            "renewable_capacity": {
                "solar": 65000,  # MW
                "wind": 45000,   # MW
                "hydro": 52000,  # MW
                "biomass": 8000,  # MW
                "others": 2000    # MW
            },
            "current_generation": {
                "solar": int(65000 * 0.6),  # Assuming 60% capacity utilization
                "wind": int(45000 * 0.48),  # Assuming 48% capacity utilization
                "hydro": int(52000 * 0.72),  # Assuming 72% capacity utilization
                "biomass": int(8000 * 0.65),  # Assuming 65% capacity utilization
                "others": int(2000 * 0.55)    # Assuming 55% capacity utilization
            },
            "regions": {
                "northern": {
                    "solar": 20000,
                    "wind": 8000,
                    "hydro": 15000,
                    "biomass": 2000,
                    "others": 500
                },
                "western": {
                    "solar": 18000,
                    "wind": 12000,
                    "hydro": 8000,
                    "biomass": 2500,
                    "others": 600
                },
                "southern": {
                    "solar": 15000,
                    "wind": 18000,
                    "hydro": 10000,
                    "biomass": 2000,
                    "others": 400
                },
                "eastern": {
                    "solar": 8000,
                    "wind": 4000,
                    "hydro": 12000,
                    "biomass": 1000,
                    "others": 300
                },
                "northeastern": {
                    "solar": 4000,
                    "wind": 3000,
                    "hydro": 7000,
                    "biomass": 500,
                    "others": 200
                }
            }
        }
    
    def _get_fallback_grid_status(self):
        """Generate fallback grid status data for development/demo purposes"""
        return {
            "timestamp": datetime.now().isoformat(),
            "grid_health": {
                "overall_status": "stable",
                "frequency": 49.98,  # Hz
                "voltage_profile": "normal",
                "congestion": "low"
            },
            "potential_issues": [
                {
                    "region": "western",
                    "substation": "Satna",
                    "issue_type": "voltage_fluctuation",
                    "severity": "low",
                    "timestamp": (datetime.now() - timedelta(hours=2)).isoformat()
                },
                {
                    "region": "southern",
                    "substation": "Trichy",
                    "issue_type": "line_loading",
                    "severity": "medium",
                    "timestamp": (datetime.now() - timedelta(hours=1)).isoformat()
                }
            ],
            "regions": {
                "northern": {
                    "status": "stable",
                    "frequency": 49.97,
                    "load_percentage": 78
                },
                "western": {
                    "status": "stable",
                    "frequency": 50.01,
                    "load_percentage": 82
                },
                "southern": {
                    "status": "alert",
                    "frequency": 49.94,
                    "load_percentage": 88
                },
                "eastern": {
                    "status": "stable",
                    "frequency": 50.02,
                    "load_percentage": 75
                },
                "northeastern": {
                    "status": "stable",
                    "frequency": 50.00,
                    "load_percentage": 70
                }
            }
        }
