// State management for bar chart dashboard
export let state = {
    rawData: [],
    
    // Bar chart state - array of chart configurations
    barCharts: [
        {
            id: 0,
            groupBy: 'product_type',
            filters: {
                productType: 'all',
                loanIntent: 'all',
                occupationStatus: 'all'
            }
        }
    ],
    
    // Currently selected chart for filter editing
    selectedBarChart: 0,
};

// Save state to localStorage (excluding rawData)
export function saveState() {
    try {
        const stateToSave = {
            barCharts: state.barCharts,
            selectedBarChart: state.selectedBarChart
        };
        localStorage.setItem('barChartState', JSON.stringify(stateToSave));
    } catch (error) {
        console.warn('Failed to save bar chart state:', error);
    }
}

// Load state from localStorage
export function loadState() {
    try {
        const saved = localStorage.getItem('barChartState');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.barCharts && Array.isArray(parsed.barCharts) && parsed.barCharts.length > 0) {
                state.barCharts = parsed.barCharts;
                // Ensure IDs are correct
                state.barCharts.forEach((chart, i) => {
                    chart.id = i;
                });
            }
            if (typeof parsed.selectedBarChart === 'number') {
                state.selectedBarChart = Math.min(parsed.selectedBarChart, state.barCharts.length - 1);
            }
        }
    } catch (error) {
        console.warn('Failed to load bar chart state:', error);
    }
}
