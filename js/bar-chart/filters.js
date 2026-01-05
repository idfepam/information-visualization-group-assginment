// Filter and control logic for bar chart - button-based
import { state } from './state.js';
import { renderChart } from './chart.js';

export function initializeFilters() {
    // Chart Type Buttons
    const chartTypeButtons = document.querySelectorAll('#chart-type-buttons .filter-button');
    chartTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active from all buttons in group
            chartTypeButtons.forEach(btn => btn.classList.remove('active'));
            // Add active to clicked button
            this.classList.add('active');
            state.chartType = this.dataset.value;
            updateChart();
        });
    });

    // Group By Buttons
    const groupByButtons = document.querySelectorAll('#group-by-buttons .filter-button');
    groupByButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active from all buttons in group
            groupByButtons.forEach(btn => btn.classList.remove('active'));
            // Add active to clicked button
            this.classList.add('active');
            state.groupBy = this.dataset.value;
            updateChart();
        });
    });

    // Product Type Filter Buttons
    setupFilterButtons('filter-product-type-buttons', 'productType');
    
    // Loan Intent Filter Buttons
    setupFilterButtons('filter-loan-intent-buttons', 'loanIntent');
    
    // Occupation Filter Buttons
    setupFilterButtons('filter-occupation-buttons', 'occupationStatus');
}

function setupFilterButtons(containerId, filterKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Use event delegation for dynamically added buttons
    container.addEventListener('click', function(event) {
        if (event.target.classList.contains('filter-button')) {
            const button = event.target;
            const value = button.dataset.value;
            
            // For "All" button, deselect all others
            if (value === 'all') {
                container.querySelectorAll('.filter-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                state.filters[filterKey] = null;
            } else {
                // Toggle the clicked button
                button.classList.toggle('active');
                
                // If "All" was active, remove it
                const allButton = container.querySelector('[data-value="all"]');
                if (allButton && allButton.classList.contains('active')) {
                    allButton.classList.remove('active');
                }
                
                // Collect all active values
                const activeValues = Array.from(container.querySelectorAll('.filter-button.active'))
                    .map(btn => btn.dataset.value)
                    .filter(val => val !== 'all');
                
                // If no filters selected, activate "All"
                if (activeValues.length === 0) {
                    allButton.classList.add('active');
                    state.filters[filterKey] = null;
                } else {
                    // For single selection filters, only keep the last clicked
                    state.filters[filterKey] = value;
                    // Remove active from other buttons except "All"
                    container.querySelectorAll('.filter-button').forEach(btn => {
                        if (btn !== button && btn.dataset.value !== 'all') {
                            btn.classList.remove('active');
                        }
                    });
                }
            }
            
            updateChart();
        }
    });
}

function updateChart() {
    if (state.rawData && state.rawData.length > 0) {
        renderChart(state.rawData);
    }
}

export { updateChart };
