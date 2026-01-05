// State management for scatter plot dashboard
export let state = {
    rawData: [],
    
    // Scatter plot state - array of chart configurations
    scatterCharts: [
        {
            id: 0,
            xAxis: 'credit_score',
            yAxis: 'annual_income',
            filters: {
                productType: 'all',
                loanIntent: 'all',
                occupationStatus: 'all'
            }
        }
    ],
    
    // Currently selected chart for filter editing
    selectedScatterChart: 0,
};

// Save state to localStorage (excluding rawData)
export function saveState() {
    try {
        const stateToSave = {
            scatterCharts: state.scatterCharts,
            selectedScatterChart: state.selectedScatterChart
        };
        localStorage.setItem('scatterPlotState', JSON.stringify(stateToSave));
    } catch (error) {
        console.warn('Failed to save scatter plot state:', error);
    }
}

// Load state from localStorage
export function loadState() {
    try {
        const saved = localStorage.getItem('scatterPlotState');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.scatterCharts && Array.isArray(parsed.scatterCharts) && parsed.scatterCharts.length > 0) {
                state.scatterCharts = parsed.scatterCharts;
                // Ensure IDs are correct
                state.scatterCharts.forEach((chart, i) => {
                    chart.id = i;
                });
            }
            if (typeof parsed.selectedScatterChart === 'number') {
                state.selectedScatterChart = Math.min(parsed.selectedScatterChart, state.scatterCharts.length - 1);
            }
        }
    } catch (error) {
        console.warn('Failed to load scatter plot state:', error);
    }
}
