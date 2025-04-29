from app import db
from datetime import datetime

class GridData(db.Model):
    """Model for storing grid power data"""
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    region = db.Column(db.String(50), nullable=False)
    generation = db.Column(db.Float, nullable=False)  # MW
    consumption = db.Column(db.Float, nullable=False)  # MW
    frequency = db.Column(db.Float, nullable=False)   # Hz
    
    def __repr__(self):
        return f"<GridData {self.region} at {self.timestamp}>"

class RenewableData(db.Model):
    """Model for storing renewable energy data"""
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    region = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # solar, wind, hydro, etc.
    capacity = db.Column(db.Float, nullable=False)   # MW
    generation = db.Column(db.Float, nullable=False) # MW
    
    def __repr__(self):
        return f"<RenewableData {self.type} in {self.region} at {self.timestamp}>"

class ForecastData(db.Model):
    """Model for storing demand forecasts"""
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    forecast_date = db.Column(db.Date, nullable=False)
    region = db.Column(db.String(50), nullable=False)
    predicted_demand = db.Column(db.Float, nullable=False)  # MW
    lower_bound = db.Column(db.Float, nullable=True)  # MW
    upper_bound = db.Column(db.Float, nullable=True)  # MW
    
    def __repr__(self):
        return f"<ForecastData for {self.region} on {self.forecast_date}>"

class PowerOutage(db.Model):
    """Model for storing power outage information"""
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    region = db.Column(db.String(50), nullable=False)
    substation = db.Column(db.String(100), nullable=False)
    affected_area = db.Column(db.String(200), nullable=True)
    cause = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(20), default="active")  # active, resolved
    severity = db.Column(db.String(20), nullable=False)  # low, medium, high, critical
    
    def __repr__(self):
        return f"<PowerOutage {self.region} - {self.substation} at {self.start_time}>"

class LoadBalancingEvent(db.Model):
    """Model for storing load balancing events"""
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    source_region = db.Column(db.String(50), nullable=False)
    target_region = db.Column(db.String(50), nullable=False)
    power_transferred = db.Column(db.Float, nullable=False)  # MW
    reason = db.Column(db.String(200), nullable=True)
    
    def __repr__(self):
        return f"<LoadBalancingEvent {self.source_region} to {self.target_region} at {self.timestamp}>"
