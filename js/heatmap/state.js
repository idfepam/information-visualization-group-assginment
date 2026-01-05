// State management for heatmap
export let state = {
    rawData: [],
    filters: {
        productType: 'all',
        loanIntent: 'all',
        occupationStatus: 'all'
    }
};

// Save state to localStorage (excluding rawData)
export function saveState() {
    try {
        const stateToSave = {
            filters: state.filters
        };
        localStorage.setItem('heatmapState', JSON.stringify(stateToSave));
    } catch (error) {
        console.warn('Failed to save heatmap state:', error);
    }
}

// Load state from localStorage
export function loadState() {
    try {
        const saved = localStorage.getItem('heatmapState');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.filters) {
                state.filters = { ...state.filters, ...parsed.filters };
            }
        }
    } catch (error) {
        console.warn('Failed to load heatmap state:', error);
    }
}
