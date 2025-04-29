// Configuration and utility functions for charts

// Common chart configuration
const chartConfig = {
    // Common colors for consistent styling
    colors: {
        primary: '#0d6efd',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#0dcaf0',
        light: '#f8f9fa',
        dark: '#212529',
        thermal: '#fd7e14',
        hydro: '#0dcaf0',
        nuclear: '#6f42c1',
        solar: '#ffc107',
        wind: '#20c997',
        biomass: '#198754',
        others: '#6c757d'
    },
    
    // Common chart options
    defaultOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#f8f9fa'
                }
            },
            tooltip: {
                titleColor: '#f8f9fa',
                bodyColor: '#f8f9fa',
                backgroundColor: 'rgba(33, 37, 41, 0.8)',
                borderColor: '#495057',
                borderWidth: 1
            }
        },
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
                ticks: {
                    color: '#adb5bd'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        }
    },
    
    // Create a line chart configuration
    createLineChartConfig: function(title, labels, data, color = this.colors.primary, fill = false) {
        return {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: data,
                    borderColor: color,
                    backgroundColor: this._adjustAlpha(color, 0.1),
                    borderWidth: 2,
                    fill: fill,
                    tension: 0.3,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: this._mergeOptions({
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        color: '#f8f9fa',
                        font: {
                            size: 16
                        }
                    }
                }
            })
        };
    },
    
    // Create a bar chart configuration
    createBarChartConfig: function(title, labels, data, colors = [this.colors.primary]) {
        // If single color provided, convert to array
        if (!Array.isArray(colors)) {
            colors = [colors];
        }
        
        // If fewer colors than data points, repeat colors
        const extendedColors = [];
        for (let i = 0; i < data.length; i++) {
            extendedColors.push(colors[i % colors.length]);
        }
        
        return {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: data,
                    backgroundColor: extendedColors,
                    borderColor: extendedColors,
                    borderWidth: 1
                }]
            },
            options: this._mergeOptions({
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        color: '#f8f9fa',
                        font: {
                            size: 16
                        }
                    }
                }
            })
        };
    },
    
    // Create a doughnut chart configuration
    createDoughnutChartConfig: function(title, labels, data, colors) {
        return {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 1
                }]
            },
            options: this._mergeOptions({
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        color: '#f8f9fa',
                        font: {
                            size: 16
                        }
                    }
                }
            })
        };
    },
    
    // Create a comparison bar chart (e.g., capacity vs generation)
    createComparisonBarChartConfig: function(title, labels, dataset1, dataset2, label1, label2, color1 = this.colors.success, color2 = this.colors.secondary) {
        return {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: label1,
                        data: dataset1,
                        backgroundColor: this._adjustAlpha(color1, 0.8),
                        borderColor: color1,
                        borderWidth: 1
                    },
                    {
                        label: label2,
                        data: dataset2,
                        backgroundColor: this._adjustAlpha(color2, 0.5),
                        borderColor: color2,
                        borderWidth: 1
                    }
                ]
            },
            options: this._mergeOptions({
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        color: '#f8f9fa',
                        font: {
                            size: 16
                        }
                    }
                }
            })
        };
    },
    
    // Create a forecast chart with uncertainty range
    createForecastChartConfig: function(title, labels, data, lowerBound, upperBound) {
        return {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Forecast',
                        data: data,
                        borderColor: this.colors.primary,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.1,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        fill: false
                    },
                    {
                        label: 'Upper Bound',
                        data: upperBound,
                        borderColor: 'transparent',
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: '+1'
                    },
                    {
                        label: 'Lower Bound',
                        data: lowerBound,
                        borderColor: 'transparent',
                        backgroundColor: this._adjustAlpha(this.colors.primary, 0.2),
                        borderWidth: 0,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: false
                    }
                ]
            },
            options: this._mergeOptions({
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        color: '#f8f9fa',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        labels: {
                            filter: function(legendItem, chartData) {
                                // Only show the Forecast label
                                return legendItem.text === 'Forecast';
                            }
                        }
                    }
                }
            })
        };
    },
    
    // Utility function to adjust color opacity
    _adjustAlpha: function(color, alpha) {
        // For hex colors
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        // For rgb colors
        else if (color.startsWith('rgb(')) {
            const rgb = color.match(/\d+/g);
            return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
        }
        // For rgba colors
        else if (color.startsWith('rgba(')) {
            const rgba = color.match(/\d+/g);
            return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${alpha})`;
        }
        return color;
    },
    
    // Merge custom options with default options
    _mergeOptions: function(customOptions) {
        return Object.assign({}, this.defaultOptions, customOptions);
    }
};

// Utility functions for formatting data for charts
const chartUtils = {
    // Format date for charts
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },
    
    // Format time for charts
    formatTime: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    },
    
    // Format numbers with thousands separator
    formatNumber: function(number) {
        return new Intl.NumberFormat().format(Math.round(number));
    },
    
    // Convert timestamps to labels
    timestampsToLabels: function(timestamps, format = 'time') {
        return timestamps.map(ts => {
            return format === 'date' ? this.formatDate(ts) : this.formatTime(ts);
        });
    },
    
    // Extract specific data from an array of objects
    extractDataPoints: function(dataArray, key) {
        return dataArray.map(item => item[key]);
    },
    
    // Find min/max values in a data array
    getDataRange: function(dataArray) {
        const min = Math.min(...dataArray);
        const max = Math.max(...dataArray);
        return { min, max };
    },
    
    // Calculate nice axis bounds based on data range
    calculateAxisBounds: function(dataArray, padding = 0.1) {
        const { min, max } = this.getDataRange(dataArray);
        const range = max - min;
        return {
            min: Math.floor(min - (range * padding)),
            max: Math.ceil(max + (range * padding))
        };
    },
    
    // Create color array based on values (e.g., for thresholds)
    createColorArray: function(values, thresholds, colors) {
        return values.map(value => {
            for (let i = 0; i < thresholds.length; i++) {
                if (value <= thresholds[i]) {
                    return colors[i];
                }
            }
            return colors[colors.length - 1];
        });
    }
};
