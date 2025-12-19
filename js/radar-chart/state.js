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

