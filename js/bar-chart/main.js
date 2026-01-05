// Main initialization for bar chart dashboard
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { renderBarChart, initializeBarChartTooltip } from './chart.js';
import { initializeNavigation } from '../shared/navigation.js';
import { loadLoanData } from '../shared/data-loader.js';
import { state, loadState, saveState } from './state.js';

// Initialize navigation
initializeNavigation();

// Initialize tooltips
initializeBarChartTooltip();

// Load saved state from localStorage
loadState();

// Load and render data (using shared data loader)
loadLoanData().then(function (data) {
    // Store raw data in state
    state.rawData = data;

    // Populate filter buttons
    populateFilterButtons(data);

    // Initialize all filters and render charts
    initializeAllFilters();
    renderAllCharts();
}).catch(function(error) {
    console.error('Error loading CSV:', error);
    const chartContainer = d3.select("#bar-charts-grid");
    chartContainer.append('div')
        .style('text-align', 'center')
        .style('padding', '40px')
        .style('color', '#dc2626')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .text('Error loading loan data. Please check the data file.');
});

function populateFilterButtons(data) {
    // Product types
    const productTypes = [...new Set(data.map(d => d.product_type))].sort();
    const productContainer = document.getElementById('bar-filter-product-type');
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
    const intentContainer = document.getElementById('bar-filter-loan-intent');
    if (intentContainer) {
        loanIntents.forEach(intent => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.dataset.value = intent;
            button.textContent = intent;
            intentContainer.appendChild(button);
        });
    }

    // Occupations
    const occupations = [...new Set(data.map(d => d.occupation_status))].sort();
    const occupationContainer = document.getElementById('bar-filter-occupation');
    if (occupationContainer) {
        occupations.forEach(occ => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.dataset.value = occ;
            button.textContent = occ;
            occupationContainer.appendChild(button);
        });
    }
}

function initializeAllFilters() {
    // Bar chart filters
    setupButtonGroup('bar-group-by-buttons', (value) => {
        const chart = state.barCharts[state.selectedBarChart];
        if (chart) {
            const oldGroupBy = chart.groupBy;
            chart.groupBy = value;
            // Check if this creates a duplicate (excluding current chart)
            if (!isBarChartUnique(chart, chart.id)) {
                chart.groupBy = oldGroupBy; // Revert
                updateFilterButtons();
                return;
            }
            updateFilterButtons(); // Update to disable duplicate options
            saveState();
            renderSingleChart(state.selectedBarChart);
        }
    });
    setupFilterGroup('bar-filter-product-type', 'bar', 'productType');
    setupFilterGroup('bar-filter-loan-intent', 'bar', 'loanIntent');
    setupFilterGroup('bar-filter-occupation', 'bar', 'occupationStatus');

    // Chart selectors
    updateChartSelectors();
    setupChartSelectors();
    
    // Add chart buttons
    setupAddChartButtons();
    updateAddChartButtons();
}

function setupButtonGroup(containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', function(event) {
        if (event.target.classList.contains('filter-button')) {
            const button = event.target;
            // Don't process if button is disabled
            if (button.disabled) {
                return;
            }
            container.querySelectorAll('.filter-button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            callback(button.dataset.value, event);
        }
    });
}

function setupFilterGroup(containerId, filterKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', function(event) {
        if (event.target.classList.contains('filter-button')) {
            const button = event.target;
            // Don't process if button is disabled
            if (button.disabled) {
                return;
            }
            const value = button.dataset.value;
            
            const selectedChart = state.barCharts[state.selectedBarChart];
            
            if (!selectedChart) return;
            
            // Store old value for potential revert
            const oldValue = selectedChart.filters[filterKey];
            
            if (value === 'all') {
                container.querySelectorAll('.filter-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                selectedChart.filters[filterKey] = 'all';
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
                    selectedChart.filters[filterKey] = 'all';
                } else {
                    selectedChart.filters[filterKey] = value;
                    container.querySelectorAll('.filter-button').forEach(btn => {
                        if (btn !== button && btn.dataset.value !== 'all') {
                            btn.classList.remove('active');
                        }
                    });
                }
            }
            
            // Check for duplicates and revert if needed
            if (!isBarChartUnique(selectedChart, selectedChart.id)) {
                // Revert the change
                selectedChart.filters[filterKey] = oldValue;
                // Restore button states
                container.querySelectorAll('.filter-button').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.value === oldValue || (oldValue === 'all' && btn.dataset.value === 'all')) {
                        btn.classList.add('active');
                    }
                });
                updateFilterButtons();
                return;
            }
            
            // Only re-render the selected chart if no duplicate
            saveState();
            renderSingleChart(state.selectedBarChart);
        }
    });
}

function updateChartSelectors() {
    // Bar chart selector
    const barSelector = document.getElementById('bar-chart-selector');
    if (barSelector) {
        barSelector.innerHTML = '';
        state.barCharts.forEach((chart, index) => {
            const button = document.createElement('button');
            button.className = `filter-button ${index === state.selectedBarChart ? 'active' : ''}`;
            button.dataset.index = index;
            button.textContent = `Chart ${index + 1}`;
            barSelector.appendChild(button);
        });
    }
}

function setupChartSelectors() {
    // Bar chart selector
    const barSelector = document.getElementById('bar-chart-selector');
    if (barSelector) {
        barSelector.addEventListener('click', function(event) {
            if (event.target.classList.contains('filter-button')) {
                const index = parseInt(event.target.dataset.index);
                state.selectedBarChart = index;
                saveState();
                updateChartSelectors();
                updateFilterButtons();
                // No need to re-render, just update filter buttons
            }
        });
    }
}

function updateFilterButtons() {
    const selectedChart = state.barCharts[state.selectedBarChart];
    if (!selectedChart) return;

    // Update group by - disable options that would create duplicates
    document.querySelectorAll('#bar-group-by-buttons .filter-button').forEach(btn => {
        const isActive = btn.dataset.value === selectedChart.groupBy;
        const testChart = { ...selectedChart, groupBy: btn.dataset.value };
        const wouldBeDuplicate = !isBarChartUnique(testChart, selectedChart.id);
        
        btn.classList.toggle('active', isActive);
        btn.disabled = wouldBeDuplicate && !isActive;
        btn.style.opacity = (wouldBeDuplicate && !isActive) ? '0.5' : '1';
        btn.style.cursor = (wouldBeDuplicate && !isActive) ? 'not-allowed' : 'pointer';
    });
    
    // Update filters - disable options that would create duplicates
    const filterMap = {
        productType: 'bar-filter-product-type',
        loanIntent: 'bar-filter-loan-intent',
        occupationStatus: 'bar-filter-occupation'
    };
    
    Object.keys(filterMap).forEach(filterKey => {
        const container = document.getElementById(filterMap[filterKey]);
        if (container) {
            container.querySelectorAll('.filter-button').forEach(btn => {
                const isActive = btn.dataset.value === selectedChart.filters[filterKey];
                const testChart = { ...selectedChart };
                testChart.filters = { ...selectedChart.filters, [filterKey]: btn.dataset.value };
                const wouldBeDuplicate = !isBarChartUnique(testChart, selectedChart.id);
                
                btn.classList.toggle('active', isActive);
                btn.disabled = wouldBeDuplicate && !isActive;
                btn.style.opacity = (wouldBeDuplicate && !isActive) ? '0.5' : '1';
                btn.style.cursor = (wouldBeDuplicate && !isActive) ? 'not-allowed' : 'pointer';
            });
        }
    });
}

function renderAllCharts() {
    if (!state.rawData || state.rawData.length === 0) return;
    renderBarCharts();
}

function renderSingleChart(chartIndex) {
    if (!state.rawData || state.rawData.length === 0) return;
    
    const chart = state.barCharts[chartIndex];
    if (chart) {
        renderBarChart(`bar-chart-${chartIndex}`, chart, state.rawData);
    }
}

function updateBarGridLayout() {
    const grid = document.getElementById('bar-charts-grid');
    if (!grid) return;
    
    const numCharts = state.barCharts.length;
    
    // Set grid layout based on number of charts
    if (numCharts === 1) {
        grid.style.gridTemplateColumns = '1fr';
        grid.style.gridTemplateRows = '1fr';
    } else if (numCharts === 2) {
        grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        grid.style.gridTemplateRows = '1fr';
    } else if (numCharts === 3) {
        grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        grid.style.gridTemplateRows = 'repeat(2, 1fr)';
    } else {
        grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        grid.style.gridTemplateRows = 'repeat(2, 1fr)';
    }
}

function renderBarCharts() {
    const grid = document.getElementById('bar-charts-grid');
    if (!grid) return;

    // Clear and render charts (only on initial load)
    grid.innerHTML = '';
    
    // Update grid layout
    updateBarGridLayout();
    
    state.barCharts.forEach((chart, index) => {
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        chartWrapper.innerHTML = `
            <div class="chart-header">
                <span class="chart-title">Chart ${index + 1}</span>
                <button class="chart-remove-btn" data-index="${index}">×</button>
            </div>
            <div class="chart-content" id="bar-chart-${index}"></div>
        `;
        grid.appendChild(chartWrapper);
    });

    // Update "Add Chart" button visibility
    updateAddChartButtons();

    // Setup remove buttons
    document.querySelectorAll('.chart-remove-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const index = parseInt(this.dataset.index);
            removeBarChart(index);
        });
    });

    // Render charts after DOM is ready
    setTimeout(() => {
        state.barCharts.forEach((chart, index) => {
            renderBarChart(`bar-chart-${index}`, chart, state.rawData);
        });
    }, 0);
}


function isBarChartUnique(newChart, excludeId = null) {
    return !state.barCharts.some(chart => 
        chart.id !== excludeId &&
        chart.groupBy === newChart.groupBy &&
        chart.filters.productType === newChart.filters.productType &&
        chart.filters.loanIntent === newChart.filters.loanIntent &&
        chart.filters.occupationStatus === newChart.filters.occupationStatus
    );
}

function addBarChart() {
    if (state.barCharts.length >= 4) return;
    
    const newChart = {
        id: state.barCharts.length,
        groupBy: 'product_type',
        filters: {
            productType: 'all',
            loanIntent: 'all',
            occupationStatus: 'all'
        }
    };
    
    // Try to find a unique configuration
    const groupByOptions = ['product_type', 'loan_intent', 'occupation_status'];
    let foundUnique = false;
    
    for (const groupBy of groupByOptions) {
        newChart.groupBy = groupBy;
        if (isBarChartUnique(newChart)) {
            foundUnique = true;
            break;
        }
    }
    
    // If still not unique, try different filter combinations
    if (!foundUnique) {
        const filterOptions = ['all', 'Credit Card', 'Personal Loan', 'Line of Credit'];
        for (const productType of filterOptions) {
            newChart.filters.productType = productType;
            if (isBarChartUnique(newChart)) {
                foundUnique = true;
                break;
            }
        }
    }
    
    // Only add if unique
    if (!isBarChartUnique(newChart)) {
        return; // Silently fail if duplicate
    }
    
    state.barCharts.push(newChart);
    state.selectedBarChart = newChart.id;
    saveState();
    
    // Update grid layout first
    updateBarGridLayout();
    
    // Add only the new chart to the grid
    const grid = document.getElementById('bar-charts-grid');
    if (grid) {
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        chartWrapper.innerHTML = `
            <div class="chart-header">
                <span class="chart-title">Chart ${newChart.id + 1}</span>
                <button class="chart-remove-btn" data-index="${newChart.id}">×</button>
            </div>
            <div class="chart-content" id="bar-chart-${newChart.id}"></div>
        `;
        grid.appendChild(chartWrapper);
        
        // Setup remove button for new chart
        const removeBtn = chartWrapper.querySelector('.chart-remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const index = parseInt(this.dataset.index);
                removeBarChart(index);
            });
        }
        
        // Wait for layout to settle, then render all charts (they need to resize)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Re-render all charts to ensure proper sizing
                state.barCharts.forEach((chart, index) => {
                    renderBarChart(`bar-chart-${index}`, chart, state.rawData);
                });
            });
        });
    }
    
    updateChartSelectors();
    updateFilterButtons();
    updateAddChartButtons();
}

function removeBarChart(index) {
    if (state.barCharts.length <= 1) return;
    
    // Remove the chart wrapper from DOM first (before state changes)
    const grid = document.getElementById('bar-charts-grid');
    if (grid) {
        const chartWrapper = grid.querySelector(`#bar-chart-${index}`)?.closest('.chart-wrapper');
        if (chartWrapper) {
            chartWrapper.remove();
        }
    }
    
    // Remove chart from state
    state.barCharts.splice(index, 1);
    
    // Reassign IDs
    state.barCharts.forEach((chart, i) => {
        chart.id = i;
    });
    
    // Adjust selected chart
    if (state.selectedBarChart >= state.barCharts.length) {
        state.selectedBarChart = state.barCharts.length - 1;
    }
    saveState();
    
    // Update grid layout
    updateBarGridLayout();
    
    // Update chart titles and IDs for charts after the removed one
    if (grid) {
        const wrappers = Array.from(grid.querySelectorAll('.chart-wrapper'));
        wrappers.forEach((wrapper, i) => {
            const chart = state.barCharts[i];
            if (chart) {
                // Update the ID in the content div
                const contentDiv = wrapper.querySelector('.chart-content');
                if (contentDiv) {
                    contentDiv.id = `bar-chart-${chart.id}`;
                }
                // Update title
                const title = wrapper.querySelector('.chart-title');
                if (title) {
                    title.textContent = `Chart ${chart.id + 1}`;
                }
                // Update remove button index
                const removeBtn = wrapper.querySelector('.chart-remove-btn');
                if (removeBtn) {
                    removeBtn.dataset.index = chart.id;
                }
            }
        });
        
        // Wait for layout to settle, then re-render all charts (they need to resize)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                state.barCharts.forEach((chart, index) => {
                    renderBarChart(`bar-chart-${index}`, chart, state.rawData);
                });
            });
        });
    }
    
    updateChartSelectors();
    updateFilterButtons();
    updateAddChartButtons();
}

function setupAddChartButtons() {
    const barAddBtn = document.getElementById('bar-add-chart-btn');
    if (barAddBtn) {
        barAddBtn.addEventListener('click', () => addBarChart());
    }
}

function updateAddChartButtons() {
    const barAddBtn = document.getElementById('bar-add-chart-btn');
    if (barAddBtn) {
        barAddBtn.style.display = state.barCharts.length < 4 ? 'flex' : 'none';
        barAddBtn.disabled = state.barCharts.length >= 4;
    }
}
