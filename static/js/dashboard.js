// Dashboard.js - Main functionality for the Smart Grid Dashboard

// Initialize charts and data displays when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initial data load
    loadDashboardData();
    
    // Set up refresh interval (every 30 seconds)
    setInterval(loadDashboardData, 30000);
    
    // Initialize charts
    initializeCharts();
    
    // Set up event listeners
    document.querySelectorAll('.region-selector').forEach(item => {
        item.addEventListener('click', function() {
            const region = this.getAttribute('data-region');
            updateRegionalView(region);
        });
    });
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Load dashboard data from API
function loadDashboardData() {
    fetch('/api/grid-data')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateDashboardUI(data.data);
            } else {
                console.error('Error loading grid data:', data.error);
                displayError('Error loading grid data');
            }
        })
        .catch(error => {
            console.error('Error fetching grid data:', error);
            displayError('Failed to fetch grid data. Please check your connection.');
        });
    
    // Also load renewable energy data
    fetch('/api/renewable-data')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateRenewableUI(data.data);
            } else {
                console.error('Error loading renewable data:', data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching renewable data:', error);
        });
    
    // Load fault detection data
    fetch('/api/detect-faults')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateFaultUI(data.faults);
            } else {
                console.error('Error loading fault data:', data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching fault data:', error);
        });
}

// Update the dashboard UI with the latest data
function updateDashboardUI(data) {
    // Update timestamp
    const timestamp = new Date(data.timestamp);
    document.getElementById('data-timestamp').textContent = timestamp.toLocaleString();
    
    // Update main metrics
    document.getElementById('total-generation').textContent = formatNumber(data.total_generation) + ' MW';
    document.getElementById('total-consumption').textContent = formatNumber(data.total_consumption) + ' MW';
    
    // Calculate and update reserve margin
    const reserveMargin = ((data.total_generation - data.total_consumption) / data.total_generation * 100).toFixed(2);
    document.getElementById('reserve-margin').textContent = reserveMargin + '%';
    
    // Update frequency
    const frequencyElement = document.getElementById('grid-frequency');
    frequencyElement.textContent = data.frequency.toFixed(2) + ' Hz';
    
    // Update frequency status color
    if (data.frequency < 49.7 || data.frequency > 50.3) {
        frequencyElement.classList.add('text-danger');
        frequencyElement.classList.remove('text-success', 'text-warning');
    } else if (data.frequency < 49.85 || data.frequency > 50.15) {
        frequencyElement.classList.add('text-warning');
        frequencyElement.classList.remove('text-success', 'text-danger');
    } else {
        frequencyElement.classList.add('text-success');
        frequencyElement.classList.remove('text-warning', 'text-danger');
    }
    
    // Update grid health status
    const gridStatusElement = document.getElementById('grid-status');
    gridStatusElement.textContent = capitalizeFirstLetter(data.status || 'unknown');
    
    // Update status color
    if (data.status === 'stable') {
        gridStatusElement.className = 'badge bg-success';
    } else if (data.status === 'alert') {
        gridStatusElement.className = 'badge bg-warning';
    } else if (data.status === 'emergency') {
        gridStatusElement.className = 'badge bg-danger';
    } else {
        gridStatusElement.className = 'badge bg-secondary';
    }
    
    // Update regional data
    updateRegionalTable(data.regions);
    
    // Update generation mix chart
    updateGenerationMixChart(data.generation_mix);
    
    // Update load trend chart with new data point
    addDataPointToLoadChart(timestamp, data.total_consumption);
}

// Update renewable energy UI
function updateRenewableUI(data) {
    // Update renewable percentage
    const renewable_gen = Object.values(data.current_generation).reduce((sum, val) => sum + val, 0);
    const total_capacity = Object.values(data.renewable_capacity).reduce((sum, val) => sum + val, 0);
    
    document.getElementById('renewable-percentage').textContent = 
        ((renewable_gen / total_capacity) * 100).toFixed(1) + '%';
    
    // Update renewable energy chart
    updateRenewableChart(data.current_generation, data.renewable_capacity);
    
    // Update regional renewable table if it exists
    if (document.getElementById('renewable-regional-table')) {
        updateRenewableRegionalTable(data.regions);
    }
}

// Update fault detection UI
function updateFaultUI(faults) {
    const faultContainer = document.getElementById('fault-container');
    if (!faultContainer) return;
    
    // Clear existing fault cards
    faultContainer.innerHTML = '';
    
    if (faults.length === 0) {
        faultContainer.innerHTML = `
            <div class="alert alert-success">
                <i class="fa fa-check-circle me-2"></i> No faults detected in the system.
            </div>
        `;
        return;
    }
    
    // Sort faults by severity
    const severityOrder = {
        'critical': 0,
        'high': 1,
        'medium': 2,
        'low': 3
    };
    
    faults.sort((a, b) => {
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    // Add fault cards
    faults.forEach(fault => {
        const severityClass = getSeverityClass(fault.severity);
        const faultTime = new Date(fault.timestamp).toLocaleTimeString();
        
        const faultCard = document.createElement('div');
        faultCard.className = 'card mb-3 border-0 ' + severityClass.border;
        faultCard.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="card-title ${severityClass.text}">
                        <i class="fa fa-exclamation-triangle me-2"></i>
                        ${formatFaultType(fault.type)}
                    </h5>
                    <span class="badge ${severityClass.bg}">${fault.severity.toUpperCase()}</span>
                </div>
                <p class="card-text">${fault.description}</p>
                <div class="d-flex justify-content-between">
                    <small class="text-muted">
                        ${fault.region ? fault.region.toUpperCase() : 'System'} 
                        ${fault.substation ? '- ' + fault.substation : ''}
                    </small>
                    <small class="text-muted">Detected at ${faultTime}</small>
                </div>
            </div>
        `;
        faultContainer.appendChild(faultCard);
    });
}

// Initialize dashboard charts
function initializeCharts() {
    // Initialize Generation Mix Chart
    const mixCtx = document.getElementById('generation-mix-chart').getContext('2d');
    window.generationMixChart = new Chart(mixCtx, {
        type: 'doughnut',
        data: {
            labels: ['Thermal', 'Hydro', 'Nuclear', 'Solar', 'Wind', 'Others'],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    '#fd7e14', // thermal - orange
                    '#0dcaf0', // hydro - blue
                    '#6f42c1', // nuclear - purple
                    '#ffc107', // solar - yellow
                    '#20c997', // wind - teal
                    '#6c757d'  // others - gray
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#f8f9fa'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return label + ': ' + formatNumber(value) + ' MW';
                        }
                    }
                }
            }
        }
    });
    
    // Initialize Load Trend Chart
    const loadCtx = document.getElementById('load-trend-chart').getContext('2d');
    window.loadTrendChart = new Chart(loadCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Power Consumption (MW)',
                data: [],
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: '#adb5bd'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#adb5bd',
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#f8f9fa'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Consumption: ' + formatNumber(context.raw) + ' MW';
                        }
                    }
                }
            }
        }
    });
    
    // Initialize Renewable Energy Chart if present
    const renewableCtx = document.getElementById('renewable-chart');
    if (renewableCtx) {
        window.renewableChart = new Chart(renewableCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Solar', 'Wind', 'Hydro', 'Biomass', 'Others'],
                datasets: [
                    {
                        label: 'Current Generation (MW)',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(40, 167, 69, 0.8)',
                        borderColor: '#28a745',
                        borderWidth: 1
                    },
                    {
                        label: 'Total Capacity (MW)',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(108, 117, 125, 0.5)',
                        borderColor: '#6c757d',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            color: '#adb5bd'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#adb5bd',
                            callback: function(value) {
                                return formatNumber(value);
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#f8f9fa'
                        }
                    }
                }
            }
        });
    }
}

// Update generation mix chart with new data
function updateGenerationMixChart(mixData) {
    if (!window.generationMixChart || !mixData) return;
    
    const data = [
        mixData.thermal || 0,
        mixData.hydro || 0,
        mixData.nuclear || 0,
        mixData.solar || 0,
        mixData.wind || 0,
        mixData.others || 0
    ];
    
    window.generationMixChart.data.datasets[0].data = data;
    window.generationMixChart.update();
}

// Update renewable energy chart with new data
function updateRenewableChart(currentGen, capacity) {
    if (!window.renewableChart) return;
    
    const currentData = [
        currentGen.solar || 0,
        currentGen.wind || 0,
        currentGen.hydro || 0,
        currentGen.biomass || 0,
        currentGen.others || 0
    ];
    
    const capacityData = [
        capacity.solar || 0,
        capacity.wind || 0,
        capacity.hydro || 0,
        capacity.biomass || 0,
        capacity.others || 0
    ];
    
    window.renewableChart.data.datasets[0].data = currentData;
    window.renewableChart.data.datasets[1].data = capacityData;
    window.renewableChart.update();
}

// Add a new data point to the load trend chart
function addDataPointToLoadChart(timestamp, consumption) {
    if (!window.loadTrendChart) return;
    
    const timeString = new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Keep a maximum of 12 data points (1 hour at 5-minute intervals)
    if (window.loadTrendChart.data.labels.length >= 12) {
        window.loadTrendChart.data.labels.shift();
        window.loadTrendChart.data.datasets[0].data.shift();
    }
    
    window.loadTrendChart.data.labels.push(timeString);
    window.loadTrendChart.data.datasets[0].data.push(consumption);
    window.loadTrendChart.update();
}

// Update the regional data table
function updateRegionalTable(regions) {
    const tableBody = document.getElementById('regional-data-tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    Object.entries(regions).forEach(([region, data]) => {
        const tr = document.createElement('tr');
        
        // Determine frequency status color
        let freqClass = 'text-success';
        if (data.frequency < 49.7 || data.frequency > 50.3) {
            freqClass = 'text-danger';
        } else if (data.frequency < 49.85 || data.frequency > 50.15) {
            freqClass = 'text-warning';
        }
        
        // Calculate load percentage
        const loadPercentage = (data.consumption / data.generation * 100).toFixed(1);
        
        tr.innerHTML = `
            <td class="text-capitalize">${region}</td>
            <td>${formatNumber(data.generation)} MW</td>
            <td>${formatNumber(data.consumption)} MW</td>
            <td class="${freqClass}">${data.frequency.toFixed(2)} Hz</td>
            <td>
                <div class="progress bg-dark">
                    <div class="progress-bar ${getLoadBarClass(loadPercentage)}" 
                         role="progressbar" 
                         style="width: ${loadPercentage}%"
                         aria-valuenow="${loadPercentage}" 
                         aria-valuemin="0" 
                         aria-valuemax="100"
                         data-bs-toggle="tooltip"
                         title="${loadPercentage}% Load">
                    </div>
                </div>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // Reinitialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Update regional renewable energy table
function updateRenewableRegionalTable(regions) {
    const tableBody = document.getElementById('renewable-regional-tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    Object.entries(regions).forEach(([region, data]) => {
        const tr = document.createElement('tr');
        
        // Calculate total regional renewable capacity and generation
        const totalCapacity = Object.values(data).reduce((sum, val) => sum + val, 0);
        
        // Calculate capacity factor (approximation)
        // In a real implementation, this would use actual generation data
        const solarCF = 0.25; // Solar capacity factor (assumed)
        const windCF = 0.35;  // Wind capacity factor (assumed)
        const hydroCF = 0.4;  // Hydro capacity factor (assumed)
        const biomassCF = 0.6; // Biomass capacity factor (assumed)
        const othersCF = 0.5;  // Others capacity factor (assumed)
        
        const solarGen = data.solar * solarCF;
        const windGen = data.wind * windCF;
        const hydroGen = data.hydro * hydroCF;
        const biomassGen = data.biomass * biomassCF;
        const othersGen = data.others * othersCF;
        
        const totalGen = solarGen + windGen + hydroGen + biomassGen + othersGen;
        const renewablePercentage = (totalGen / totalCapacity * 100).toFixed(1);
        
        tr.innerHTML = `
            <td class="text-capitalize">${region}</td>
            <td>${formatNumber(data.solar || 0)} MW</td>
            <td>${formatNumber(data.wind || 0)} MW</td>
            <td>${formatNumber(data.hydro || 0)} MW</td>
            <td>${formatNumber(data.biomass || 0)} MW</td>
            <td>${formatNumber(data.others || 0)} MW</td>
            <td>${formatNumber(totalCapacity)} MW</td>
            <td>
                <div class="progress bg-dark">
                    <div class="progress-bar bg-success" 
                         role="progressbar" 
                         style="width: ${renewablePercentage}%"
                         aria-valuenow="${renewablePercentage}" 
                         aria-valuemin="0" 
                         aria-valuemax="100"
                         data-bs-toggle="tooltip"
                         title="${renewablePercentage}% Utilization">
                    </div>
                </div>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // Reinitialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Display error message
function displayError(message) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alertElement = document.createElement('div');
    alertElement.className = 'alert alert-danger alert-dismissible fade show';
    alertElement.innerHTML = `
        <i class="fa fa-exclamation-circle me-2"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertElement);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => alertElement.remove(), 500);
    }, 5000);
}

// Format numbers for display (add thousands separators)
function formatNumber(num) {
    return new Intl.NumberFormat().format(Math.round(num));
}

// Get load bar class based on percentage
function getLoadBarClass(percentage) {
    percentage = parseFloat(percentage);
    if (percentage >= 95) return 'bg-danger';
    if (percentage >= 85) return 'bg-warning';
    return 'bg-success';
}

// Get severity class for fault display
function getSeverityClass(severity) {
    switch (severity) {
        case 'critical':
            return {bg: 'bg-danger', text: 'text-danger', border: 'border-danger'};
        case 'high':
            return {bg: 'bg-warning', text: 'text-warning', border: 'border-warning'};
        case 'medium':
            return {bg: 'bg-info', text: 'text-info', border: 'border-info'};
        case 'low':
        default:
            return {bg: 'bg-secondary', text: 'text-secondary', border: 'border-secondary'};
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

// Capitalize first letter of a string
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Update view for a specific region
function updateRegionalView(region) {
    // Highlight selected region
    document.querySelectorAll('.region-selector').forEach(item => {
        if (item.getAttribute('data-region') === region) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Load and display regional data
    fetch(`/api/grid-data?region=${region}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update UI with regional focus
                // In a real implementation, this would show more detailed
                // data for the selected region
                console.log(`Switched to ${region} region view`);
            }
        })
        .catch(error => {
            console.error('Error loading regional data:', error);
            displayError(`Failed to load data for ${region} region`);
        });
}
