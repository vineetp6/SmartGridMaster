import logging
import numpy as np
from datetime import datetime, timedelta
from models import GridData, RenewableData, PowerOutage, LoadBalancingEvent
from api_client import CEAClient

logger = logging.getLogger(__name__)
cea_client = CEAClient()

def get_grid_summary():
    """
    Get a summary of the current grid status
    Returns key metrics and indicators for the dashboard
    """
    try:
        # Get latest power data
        power_data = cea_client.get_latest_power_data()
        
        # Get renewable data
        renewable_data = cea_client.get_renewable_data()
        
        # Get potential faults
        grid_status = cea_client.get_grid_status()
        
        # Calculate renewable percentage
        total_generation = power_data.get('total_generation', 0)
        renewable_generation = (
            renewable_data.get('current_generation', {}).get('solar', 0) +
            renewable_data.get('current_generation', {}).get('wind', 0) +
            renewable_data.get('current_generation', {}).get('hydro', 0) +
            renewable_data.get('current_generation', {}).get('biomass', 0) +
            renewable_data.get('current_generation', {}).get('others', 0)
        )
        
        renewable_percentage = (renewable_generation / total_generation * 100) if total_generation > 0 else 0
        
        # Calculate grid margin
        reserve_margin = ((total_generation - power_data.get('total_consumption', 0)) / total_generation * 100) if total_generation > 0 else 0
        
        # Get potential issues
        potential_issues = grid_status.get('potential_issues', [])
        
        # Create summary
        summary = {
            'timestamp': power_data.get('timestamp', datetime.now().isoformat()),
            'total_generation': total_generation,
            'total_consumption': power_data.get('total_consumption', 0),
            'reserve_margin': round(reserve_margin, 2),
            'frequency': grid_status.get('grid_health', {}).get('frequency', 50.0),
            'renewable_percentage': round(renewable_percentage, 2),
            'regional_data': power_data.get('regions', {}),
            'generation_mix': power_data.get('generation_mix', {}),
            'potential_issues': potential_issues,
            'status': grid_status.get('grid_health', {}).get('overall_status', 'unknown')
        }
        
        return summary
        
    except Exception as e:
        logger.error(f"Error creating grid summary: {str(e)}")
        return None

def detect_grid_faults(grid_status):
    """
    Analyze grid status data to detect potential faults
    """
    try:
        faults = []
        
        # Check for frequency issues
        frequency = grid_status.get('grid_health', {}).get('frequency', 50.0)
        if frequency < 49.7 or frequency > 50.3:
            faults.append({
                'type': 'frequency_deviation',
                'value': frequency,
                'threshold': '49.7-50.3 Hz',
                'severity': 'high' if (frequency < 49.5 or frequency > 50.5) else 'medium',
                'timestamp': datetime.now().isoformat(),
                'description': f"Grid frequency outside acceptable limits: {frequency} Hz"
            })
        
        # Check regional issues
        for region, data in grid_status.get('regions', {}).items():
            # Check load percentage
            load_percentage = data.get('load_percentage', 0)
            if load_percentage > 90:
                faults.append({
                    'type': 'high_load',
                    'region': region,
                    'value': f"{load_percentage}%",
                    'threshold': '90%',
                    'severity': 'critical' if load_percentage > 95 else 'high',
                    'timestamp': datetime.now().isoformat(),
                    'description': f"High load in {region} region: {load_percentage}%"
                })
            
            # Check frequency deviation
            region_freq = data.get('frequency', 50.0)
            if abs(region_freq - 50.0) > 0.3:
                faults.append({
                    'type': 'regional_frequency_deviation',
                    'region': region,
                    'value': region_freq,
                    'threshold': '49.7-50.3 Hz',
                    'severity': 'medium',
                    'timestamp': datetime.now().isoformat(),
                    'description': f"Frequency deviation in {region} region: {region_freq} Hz"
                })
        
        # Include reported issues
        for issue in grid_status.get('potential_issues', []):
            faults.append({
                'type': issue.get('issue_type', 'unknown'),
                'region': issue.get('region', 'unknown'),
                'substation': issue.get('substation', 'unknown'),
                'severity': issue.get('severity', 'low'),
                'timestamp': issue.get('timestamp', datetime.now().isoformat()),
                'description': f"{issue.get('issue_type', 'Issue')} at {issue.get('substation', 'substation')} in {issue.get('region', 'region')}"
            })
        
        return faults
        
    except Exception as e:
        logger.error(f"Error detecting grid faults: {str(e)}")
        return []

def simulate_load_balancing(scenario='normal', regions=None):
    """
    Simulate load balancing across regions
    
    Scenarios:
    - normal: Normal load conditions
    - peak: Peak demand conditions
    - renewable_surplus: High renewable generation in some regions
    - outage: Simulated outage in one region
    """
    try:
        # Get latest power data
        power_data = cea_client.get_latest_power_data()
        regional_data = power_data.get('regions', {})
        
        # If no regions specified, use all
        if not regions:
            regions = list(regional_data.keys())
        
        # Filter data to only include specified regions
        regional_data = {k: v for k, v in regional_data.items() if k in regions}
        
        # Calculate initial load imbalance
        initial_status = {}
        for region, data in regional_data.items():
            generation = data.get('generation', 0)
            consumption = data.get('consumption', 0)
            balance = generation - consumption
            initial_status[region] = {
                'generation': generation,
                'consumption': consumption,
                'balance': balance,
                'frequency': data.get('frequency', 50.0)
            }
        
        # Apply scenario modifications
        if scenario == 'peak':
            # Increase consumption in all regions by 10-20%
            for region in initial_status:
                increase_factor = 1.1 + (np.random.random() * 0.1)  # 10-20% increase
                initial_status[region]['consumption'] *= increase_factor
                initial_status[region]['balance'] = (
                    initial_status[region]['generation'] - initial_status[region]['consumption']
                )
                # Decrease frequency slightly due to higher load
                initial_status[region]['frequency'] -= 0.05 + (np.random.random() * 0.1)
                
        elif scenario == 'renewable_surplus':
            # Increase generation in some regions due to favorable weather
            surplus_regions = np.random.choice(list(initial_status.keys()), size=2, replace=False)
            for region in surplus_regions:
                increase_factor = 1.15 + (np.random.random() * 0.15)  # 15-30% increase
                initial_status[region]['generation'] *= increase_factor
                initial_status[region]['balance'] = (
                    initial_status[region]['generation'] - initial_status[region]['consumption']
                )
                # Increase frequency slightly due to excess generation
                initial_status[region]['frequency'] += 0.05 + (np.random.random() * 0.1)
                
        elif scenario == 'outage':
            # Simulate outage in one region
            outage_region = np.random.choice(list(initial_status.keys()))
            decrease_factor = 0.6 + (np.random.random() * 0.2)  # 60-80% decrease
            initial_status[outage_region]['generation'] *= decrease_factor
            initial_status[outage_region]['balance'] = (
                initial_status[outage_region]['generation'] - initial_status[outage_region]['consumption']
            )
            # Decrease frequency due to sudden generation loss
            initial_status[outage_region]['frequency'] -= 0.2 + (np.random.random() * 0.2)
        
        # Calculate system imbalance
        total_imbalance = sum(r['balance'] for r in initial_status.values())
        
        # Apply load balancing algorithm
        balancing_actions = []
        balanced_status = initial_status.copy()
        
        # Sort regions by balance (surplus to deficit)
        sorted_regions = sorted(balanced_status.keys(), key=lambda r: balanced_status[r]['balance'], reverse=True)
        surplus_regions = [r for r in sorted_regions if balanced_status[r]['balance'] > 0]
        deficit_regions = [r for r in sorted_regions if balanced_status[r]['balance'] < 0]
        
        # Transfer power from surplus to deficit regions
        for surplus_region in surplus_regions:
            available_surplus = balanced_status[surplus_region]['balance']
            if available_surplus <= 0:
                continue
                
            for deficit_region in deficit_regions:
                needed_power = abs(balanced_status[deficit_region]['balance'])
                if needed_power <= 0:
                    continue
                    
                # Calculate transfer amount
                transfer_amount = min(available_surplus, needed_power)
                if transfer_amount <= 0:
                    continue
                
                # Update balances
                balanced_status[surplus_region]['balance'] -= transfer_amount
                balanced_status[deficit_region]['balance'] += transfer_amount
                
                # Record the transfer
                balancing_actions.append({
                    'source': surplus_region,
                    'target': deficit_region,
                    'amount': round(transfer_amount, 2),
                    'timestamp': datetime.now().isoformat()
                })
                
                # Update available surplus
                available_surplus -= transfer_amount
                if available_surplus <= 0:
                    break
        
        # Calculate final frequencies after balancing
        for region in balanced_status:
            # Adjust frequency based on final balance
            initial_freq = balanced_status[region]['frequency']
            balance_change = balanced_status[region]['balance'] - initial_status[region]['balance']
            freq_change = balance_change / initial_status[region]['consumption'] * 0.1  # Simplified model
            balanced_status[region]['frequency'] = min(50.2, max(49.8, initial_freq + freq_change))
        
        # Calculate system metrics
        remaining_imbalance = sum(r['balance'] for r in balanced_status.values())
        improvement_percentage = (
            (abs(total_imbalance) - abs(remaining_imbalance)) / abs(total_imbalance) * 100
        ) if total_imbalance != 0 else 0
        
        # Compile result
        result = {
            'scenario': scenario,
            'initial_status': initial_status,
            'balanced_status': balanced_status,
            'balancing_actions': balancing_actions,
            'metrics': {
                'initial_imbalance': round(total_imbalance, 2),
                'remaining_imbalance': round(remaining_imbalance, 2),
                'improvement_percentage': round(improvement_percentage, 2),
                'transfers_count': len(balancing_actions),
                'total_power_transferred': round(sum(a['amount'] for a in balancing_actions), 2)
            }
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error simulating load balancing: {str(e)}")
        return {
            'error': str(e),
            'scenario': scenario,
            'regions': regions
        }
