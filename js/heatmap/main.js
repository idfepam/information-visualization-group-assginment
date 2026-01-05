// Main initialization for heatmap chart
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { initializeChart, renderChart } from './chart.js';
import { processHeatmapData } from './data-processor.js';
import { initializeNavigation } from '../shared/navigation.js';
import { loadLoanData } from '../shared/data-loader.js';
import { state, loadState, saveState } from './state.js';

// Initialize navigation
initializeNavigation();

// Load saved state from localStorage
loadState();

// Initialize chart
initializeChart();

// Initialize filters
function initializeFilters() {
    // Product Type filter
    setupFilterGroup('heatmap-filter-product-type', 'productType');
    // Loan Intent filter
    setupFilterGroup('heatmap-filter-loan-intent', 'loanIntent');
    // Occupation filter
    setupFilterGroup('heatmap-filter-occupation', 'occupationStatus');
}

function setupFilterGroup(containerId, filterKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', function(event) {
        if (event.target.classList.contains('filter-button')) {
            const button = event.target;
            const value = button.dataset.value;
            
            if (value === 'all') {
                container.querySelectorAll('.filter-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                state.filters[filterKey] = 'all';
            } else {
                button.classList.toggle('active');
                const allButton = container.querySelector('[data-value="all"]');
                if (allButton && allButton.classList.contains('active')) {
                    allButton.classList.remove('active');
                }
                
                const activeValues = Array.from(container.querySelectorAll('.filter-button.active'))
                    .map(btn => btn.dataset.value)
                    .filter(val => val !== 'all');
                
                if (activeValues.length === 0) {
                    allButton.classList.add('active');
                    state.filters[filterKey] = 'all';
                } else {
                    state.filters[filterKey] = value;
                    container.querySelectorAll('.filter-button').forEach(btn => {
                        if (btn !== button && btn.dataset.value !== 'all') {
                            btn.classList.remove('active');
                        }
                    });
                }
            }
            
            // Save state and re-render chart with new filters
            saveState();
            if (state.rawData && state.rawData.length > 0) {
                const processedData = processHeatmapData(state.rawData, state.filters);
                renderChart(processedData);
            }
        }
    });
}

function restoreFilterButtonStates() {
    // Restore active states for filter buttons based on saved state
    Object.keys(state.filters).forEach(filterKey => {
        const value = state.filters[filterKey];
        let containerId;
        if (filterKey === 'productType') {
            containerId = 'heatmap-filter-product-type';
        } else if (filterKey === 'loanIntent') {
            containerId = 'heatmap-filter-loan-intent';
        } else if (filterKey === 'occupationStatus') {
            containerId = 'heatmap-filter-occupation';
        }
        
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.querySelectorAll('.filter-button').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.value === value) {
                        btn.classList.add('active');
                    }
                });
            }
        }
    });
}

function populateFilterButtons(data) {
    // Product types
    const productTypes = [...new Set(data.map(d => d.product_type))].sort();
    const productContainer = document.getElementById('heatmap-filter-product-type');
    if (productContainer) {
        productTypes.forEach(type => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.dataset.value = type;
            button.textContent = type;
            productContainer.appendChild(button);
        });
    }

    // Loan intents
    const loanIntents = [...new Set(data.map(d => d.loan_intent))].sort();
    const intentContainer = document.getElementById('heatmap-filter-loan-intent');
    if (intentContainer) {
        loanIntents.forEach(intent => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.dataset.value = intent;
            button.textContent = intent;
            intentContainer.appendChild(button);
        });
    }

    // Occupation statuses
    const occupations = [...new Set(data.map(d => d.occupation_status))].sort();
    const occupationContainer = document.getElementById('heatmap-filter-occupation');
    if (occupationContainer) {
        occupations.forEach(occupation => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.dataset.value = occupation;
            button.textContent = occupation;
            occupationContainer.appendChild(button);
        });
    }
}

// Load and render data (using shared data loader)
loadLoanData().then(function (data) {
    // Store raw data
    state.rawData = data;
    
    // Populate filter buttons
    populateFilterButtons(data);
    
    // Restore filter button states from saved state
    restoreFilterButtonStates();
    
    // Initialize filters
    initializeFilters();
    
    // Process data
    const processedData = processHeatmapData(data, state.filters);
    
    // Render chart
    renderChart(processedData);
}).catch(function(error) {
    console.error('Error loading CSV:', error);
    const chartContainer = d3.select("#heatmap");
    chartContainer.html(`
        <div class="loading" style="color: #e53e3e;">
            Error loading data. Please check that the file 'data/Loan_approval_data_2025.csv' exists.
        </div>
    `);
});
