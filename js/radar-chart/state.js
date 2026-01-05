// Shared state for radar chart
export const state = {
    // Начальные значения
    values: [650, 75000, 30000, 5, 15000, 40],
    isDragging: false,
    customerData: [],
    selectedCustomerIds: [],
    showManualData: true,
    expandedCustomerIds: new Set(),
    loanParameters: {
        productType: 'Credit Card',
        loanIntent: 'Business',
        loanAmount: 50000
    },
    virtualScrollState: {
        itemHeight: 40,
        expandedItemHeight: 200,
        visibleStart: 0,
        visibleEnd: 50,
        buffer: 10,
        scrollTop: 0
    }
};

// Save state to localStorage (excluding customerData and virtualScrollState)
export function saveState() {
    try {
        const stateToSave = {
            values: state.values,
            selectedCustomerIds: state.selectedCustomerIds,
            showManualData: state.showManualData,
            expandedCustomerIds: Array.from(state.expandedCustomerIds), // Convert Set to Array
            loanParameters: state.loanParameters
        };
        localStorage.setItem('radarChartState', JSON.stringify(stateToSave));
    } catch (error) {
        console.warn('Failed to save radar chart state:', error);
    }
}

// Load state from localStorage
export function loadState() {
    try {
        const saved = localStorage.getItem('radarChartState');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.values && Array.isArray(parsed.values) && parsed.values.length === 6) {
                state.values = parsed.values;
            }
            if (parsed.selectedCustomerIds && Array.isArray(parsed.selectedCustomerIds)) {
                state.selectedCustomerIds = parsed.selectedCustomerIds;
            }
            if (typeof parsed.showManualData === 'boolean') {
                state.showManualData = parsed.showManualData;
            }
            if (parsed.expandedCustomerIds && Array.isArray(parsed.expandedCustomerIds)) {
                state.expandedCustomerIds = new Set(parsed.expandedCustomerIds);
            }
            if (parsed.loanParameters) {
                state.loanParameters = { ...state.loanParameters, ...parsed.loanParameters };
            }
        }
    } catch (error) {
        console.warn('Failed to load radar chart state:', error);
    }
}
