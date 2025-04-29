// Map.js - Grid map visualization using Leaflet

// Initialize map when document is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('grid-map')) {
        initializeGridMap();
    }
});

// Initialize the grid map
function initializeGridMap() {
    // Create map centered on India
    const map = L.map('grid-map').setView([22.5937, 78.9629], 5);
    
    // Add dark theme tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    // Store map in window object for access by other functions
    window.gridMap = map;
    
    // Load grid data
    loadGridMapData();
}

// Load grid data for the map
function loadGridMapData() {
    fetch('/api/grid-data')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateGridMap(data.data);
            } else {
                console.error('Error loading grid data for map:', data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching grid data for map:', error);
        });
        
    // Also load fault data
    fetch('/api/detect-faults')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateFaultMarkers(data.faults);
            } else {
                console.error('Error loading fault data for map:', data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching fault data for map:', error);
        });
}

// Update grid map with data
function updateGridMap(data) {
    if (!window.gridMap) return;
    
    // Define approximate region centers in India (for demonstration)
    const regionCoordinates = {
        northern: [29.5, 77.0],
        western: [21.0, 73.0],
        southern: [13.0, 78.0],
        eastern: [23.0, 87.0],
        northeastern: [26.0, 92.0]
    };
    
    // Clear existing markers and circles
    if (window.regionMarkers) {
        window.regionMarkers.forEach(marker => window.gridMap.removeLayer(marker));
    }
    
    window.regionMarkers = [];
    
    // Add regional markers
    Object.entries(data.regions).forEach(([region, regionData]) => {
        if (!regionCoordinates[region]) return;
        
        const loadPercentage = (regionData.consumption / regionData.generation * 100).toFixed(1);
        
        // Determine circle color based on load percentage
        let circleColor = '#28a745'; // success/green
        if (loadPercentage > 95) {
            circleColor = '#dc3545'; // danger/red
        } else if (loadPercentage > 85) {
            circleColor = '#ffc107'; // warning/yellow
        }
        
        // Determine circle radius based on generation capacity
        const radius = Math.sqrt(regionData.generation) * 500 / 100;
        
        // Create circle marker
        const circle = L.circle(regionCoordinates[region], {
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.3,
            weight: 2,
            radius: radius // in meters
        }).addTo(window.gridMap);
        
        // Create tooltip
        const tooltip = `
            <strong class="text-capitalize">${region} Region</strong><br>
            Generation: ${formatNumber(regionData.generation)} MW<br>
            Consumption: ${formatNumber(regionData.consumption)} MW<br>
            Load: ${loadPercentage}%<br>
            Frequency: ${regionData.frequency.toFixed(2)} Hz
        `;
        
        circle.bindTooltip(tooltip);
        
        // Add click event to show more details
        circle.on('click', function() {
            showRegionDetails(region, regionData);
        });
        
        window.regionMarkers.push(circle);
    });
    
    // Add power flow lines between regions
    drawPowerFlowLines(data);
}

// Draw power flow lines between regions
function drawPowerFlowLines(data) {
    // Define approximate region centers in India
    const regionCoordinates = {
        northern: [29.5, 77.0],
        western: [21.0, 73.0],
        southern: [13.0, 78.0],
        eastern: [23.0, 87.0],
        northeastern: [26.0, 92.0]
    };
    
    // Clear existing flow lines
    if (window.flowLines) {
        window.flowLines.forEach(line => window.gridMap.removeLayer(line));
    }
    
    window.flowLines = [];
    
    // Define power exchange between regions (mock data for demonstration)
    // In a real implementation, this would come from the API
    const powerExchanges = [
        { from: 'western', to: 'northern', amount: 2500 },
        { from: 'western', to: 'southern', amount: 1800 },
        { from: 'eastern', to: 'northeastern', amount: 1200 },
        { from: 'eastern', to: 'northern', amount: 1500 },
        { from: 'northern', to: 'northeastern', amount: 800 }
    ];
    
    // Draw lines for each power exchange
    powerExchanges.forEach(exchange => {
        if (!regionCoordinates[exchange.from] || !regionCoordinates[exchange.to]) return;
        
        // Determine line thickness based on power amount
        const weight = Math.max(2, Math.min(8, exchange.amount / 500));
        
        // Draw line
        const line = L.polyline([
            regionCoordinates[exchange.from],
            regionCoordinates[exchange.to]
        ], {
            color: '#0dcaf0',
            weight: weight,
            opacity: 0.7,
            dashArray: '10, 10',
            animate: {
                duration: 5000,
                iterations: Infinity
            }
        }).addTo(window.gridMap);
        
        // Create tooltip
        const tooltip = `
            <strong>Power Flow</strong><br>
            From: ${capitalizeFirstLetter(exchange.from)}<br>
            To: ${capitalizeFirstLetter(exchange.to)}<br>
            Amount: ${formatNumber(exchange.amount)} MW
        `;
        
        line.bindTooltip(tooltip);
        window.flowLines.push(line);
        
        // Add animated flow marker
        addFlowMarker(regionCoordinates[exchange.from], regionCoordinates[exchange.to], '#0dcaf0');
    });
}

// Add fault markers to the map
function updateFaultMarkers(faults) {
    if (!window.gridMap) return;
    
    // Clear existing fault markers
    if (window.faultMarkers) {
        window.faultMarkers.forEach(marker => window.gridMap.removeLayer(marker));
    }
    
    window.faultMarkers = [];
    
    // Define substations with their coordinates (mock data for demonstration)
    // In a real implementation, this would come from the API
    const substations = {
        'Satna': [24.6005, 80.8299],
        'Trichy': [10.7905, 78.7047],
        'Delhi': [28.6139, 77.2090],
        'Mumbai': [19.0760, 72.8777],
        'Chennai': [13.0827, 80.2707],
        'Kolkata': [22.5726, 88.3639],
        'Bangalore': [12.9716, 77.5946],
        'Hyderabad': [17.3850, 78.4867],
        'Patna': [25.5941, 85.1376],
        'Guwahati': [26.1445, 91.7362]
    };
    
    // Add marker for each fault
    faults.forEach(fault => {
        // Skip if no substation or coordinates
        if (!fault.substation || !substations[fault.substation]) return;
        
        // Determine icon based on severity
        let iconColor = 'blue';
        if (fault.severity === 'critical') {
            iconColor = 'red';
        } else if (fault.severity === 'high') {
            iconColor = 'orange';
        } else if (fault.severity === 'medium') {
            iconColor = 'yellow';
        }
        
        // Create marker
        const icon = L.divIcon({
            className: `fault-marker-${fault.severity}`,
            html: `<i class="fa fa-exclamation-triangle" style="color: ${iconColor}; font-size: 24px;"></i>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        const marker = L.marker(substations[fault.substation], {
            icon: icon,
            zIndexOffset: getSeverityZIndex(fault.severity)
        }).addTo(window.gridMap);
        
        // Create tooltip
        const timestamp = new Date(fault.timestamp).toLocaleTimeString();
        const tooltip = `
            <strong>${formatFaultType(fault.type)}</strong><br>
            Location: ${fault.substation}, ${capitalizeFirstLetter(fault.region)}<br>
            Severity: <span class="text-${getSeverityClass(fault.severity).text}">${fault.severity.toUpperCase()}</span><br>
            Detected: ${timestamp}<br>
            ${fault.description || ''}
        `;
        
        marker.bindTooltip(tooltip);
        
        // Pulse animation for critical faults
        if (fault.severity === 'critical') {
            // Add pulse circle
            const pulseCircle = L.circle(substations[fault.substation], {
                color: 'red',
                fillColor: 'red',
                fillOpacity: 0.3,
                weight: 2,
                radius: 15000, // 15km
                className: 'pulse-circle'
            }).addTo(window.gridMap);
            
            window.faultMarkers.push(pulseCircle);
        }
        
        window.faultMarkers.push(marker);
    });
}

// Add animated flow marker along a line
function addFlowMarker(start, end, color) {
    // Calculate midpoint
    const midLat = (start[0] + end[0]) / 2;
    const midLng = (start[1] + end[1]) / 2;
    
    // Create flow marker
    const flowIcon = L.divIcon({
        className: 'flow-marker',
        html: `<i class="fa fa-chevron-right" style="color: ${color}; font-size: 16px;"></i>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
    
    const marker = L.marker([midLat, midLng], {
        icon: flowIcon,
        zIndexOffset: 1000
    }).addTo(window.gridMap);
    
    window.flowLines.push(marker);
    
    // Animate the marker (simplified, in a real app would use proper animation)
    let direction = 1;
    let counter = 0;
    setInterval(() => {
        counter += direction;
        if (counter >= 10 || counter <= 0) direction *= -1;
        
        const ratio = 0.5 + (counter / 20 - 0.25);
        const lat = start[0] + (end[0] - start[0]) * ratio;
        const lng = start[1] + (end[1] - start[1]) * ratio;
        
        marker.setLatLng([lat, lng]);
    }, 200);
}

// Show detailed region information
function showRegionDetails(region, data) {
    // In a real application, this would show a modal or panel with detailed information
    console.log(`Showing details for ${region} region`, data);
    
    // Update regional view in dashboard if applicable
    if (typeof updateRegionalView === 'function') {
        updateRegionalView(region);
    }
}

// Format numbers with thousands separator
function formatNumber(num) {
    return new Intl.NumberFormat().format(Math.round(num));
}

// Capitalize first letter of a string
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Get z-index for severity levels
function getSeverityZIndex(severity) {
    switch (severity) {
        case 'critical': return 1000;
        case 'high': return 900;
        case 'medium': return 800;
        case 'low': default: return 700;
    }
}

// Format fault type for display
function formatFaultType(type) {
    if (!type) return 'Unknown Issue';
    
    // Replace underscores with spaces and capitalize
    return type.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Get severity class
function getSeverityClass(severity) {
    switch (severity) {
        case 'critical':
            return {text: 'danger'};
        case 'high':
            return {text: 'warning'};
        case 'medium':
            return {text: 'info'};
        case 'low':
        default:
            return {text: 'secondary'};
    }
}
