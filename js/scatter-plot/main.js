// Main initialization for scatter plot dashboard
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { renderScatterPlot, initializeScatterTooltip } from './scatter-plot.js';
import { initializeNavigation } from '../shared/navigation.js';
import { loadLoanData } from '../shared/data-loader.js';
import { state, loadState, saveState } from './state.js';

// Initialize navigation
initializeNavigation();

// Initialize tooltips
initializeScatterTooltip();

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
    const chartContainer = d3.select("#scatter-charts-grid");
    chartContainer.html(`
        <div style="text-align: center; padding: 40px; color: #dc2626; font-size: 16px; font-weight: 600;">
            Error loading loan data. Please check the data file.
        </div>
    `);
});

function populateFilterButtons(data) {
    // Product types
    const productTypes = [...new Set(data.map(d => d.product_type))].sort();
    const container = document.getElementById('scatter-filter-product-type');
    if (container) {
        productTypes.forEach(type => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.dataset.value = type;
            button.textContent = type;
            container.appendChild(button);
        });
    }

    // Loan intents
    const loanIntents = [...new Set(data.map(d => d.loan_intent))].sort();
    const intentContainer = document.getElementById('scatter-filter-loan-intent');
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
    const occupationContainer = document.getElementById('scatter-filter-occupation');
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
    // Scatter plot filters
    setupButtonGroup('scatter-x-axis-buttons', (value, event) => {
        const chart = state.scatterCharts[state.selectedScatterChart];
        if (chart) {
            // Prevent selecting same axis for Y
            if (value === chart.yAxis) {
                return;
            }
            const oldXAxis = chart.xAxis;
            chart.xAxis = value;
            // Check if this creates a duplicate (excluding current chart)
            if (!isScatterChartUnique(chart, chart.id)) {
                chart.xAxis = oldXAxis; // Revert
                updateScatterAxisButtons();
                return;
            }
            updateScatterAxisButtons();
            saveState();
            renderSingleChart(state.selectedScatterChart);
        }
    });
    setupButtonGroup('scatter-y-axis-buttons', (value, event) => {
        const chart = state.scatterCharts[state.selectedScatterChart];
        if (chart) {
            // Prevent selecting same axis for X
            if (value === chart.xAxis) {
                return;
            }
            const oldYAxis = chart.yAxis;
            chart.yAxis = value;
            // Check if this creates a duplicate (excluding current chart)
            if (!isScatterChartUnique(chart, chart.id)) {
                chart.yAxis = oldYAxis; // Revert
                updateScatterAxisButtons();
                return;
            }
            updateScatterAxisButtons();
            saveState();
            renderSingleChart(state.selectedScatterChart);
        }
    });
    setupFilterGroup('scatter-filter-product-type', 'productType');
    setupFilterGroup('scatter-filter-loan-intent', 'loanIntent');
    setupFilterGroup('scatter-filter-occupation', 'occupationStatus');

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
            
            const selectedChart = state.scatterCharts[state.selectedScatterChart];
            
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
            if (!isScatterChartUnique(selectedChart, selectedChart.id)) {
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
            
            // Re-render the selected chart if no duplicate
            saveState();
            renderSingleChart(state.selectedScatterChart);
        }
    });
}

function updateScatterAxisButtons() {
    const selectedChart = state.scatterCharts[state.selectedScatterChart];
    if (!selectedChart) return;
    
    // Update X axis buttons - disable the one that matches Y axis or would create duplicate
    document.querySelectorAll('#scatter-x-axis-buttons .filter-button').forEach(btn => {
        const isActive = btn.dataset.value === selectedChart.xAxis;
        const matchesYAxis = btn.dataset.value === selectedChart.yAxis;
        
        // Check if selecting this would create a duplicate (only if not already active)
        let wouldBeDuplicate = false;
        if (!isActive) {
            const testChart = { ...selectedChart, xAxis: btn.dataset.value };
            wouldBeDuplicate = !isScatterChartUnique(testChart, selectedChart.id);
        }
        
        const isDisabled = matchesYAxis || wouldBeDuplicate;
        btn.classList.toggle('active', isActive);
        btn.disabled = isDisabled;
        btn.style.opacity = isDisabled ? '0.5' : '1';
        btn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
    });
    
    // Update Y axis buttons - disable the one that matches X axis or would create duplicate
    document.querySelectorAll('#scatter-y-axis-buttons .filter-button').forEach(btn => {
        const isActive = btn.dataset.value === selectedChart.yAxis;
        const matchesXAxis = btn.dataset.value === selectedChart.xAxis;
        
        // Check if selecting this would create a duplicate (only if not already active)
        let wouldBeDuplicate = false;
        if (!isActive) {
            const testChart = { ...selectedChart, yAxis: btn.dataset.value };
            wouldBeDuplicate = !isScatterChartUnique(testChart, selectedChart.id);
        }
        
        const isDisabled = matchesXAxis || wouldBeDuplicate;
        btn.classList.toggle('active', isActive);
        btn.disabled = isDisabled;
        btn.style.opacity = isDisabled ? '0.5' : '1';
        btn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
    });
}

function updateFilterButtons() {
    const selectedChart = state.scatterCharts[state.selectedScatterChart];
    if (!selectedChart) return;

    // Update axes with disabled state
    updateScatterAxisButtons();
    
    // Update filters - disable options that would create duplicates
    const filterMap = {
        productType: 'scatter-filter-product-type',
        loanIntent: 'scatter-filter-loan-intent',
        occupationStatus: 'scatter-filter-occupation'
    };
    
    Object.keys(filterMap).forEach(filterKey => {
        const container = document.getElementById(filterMap[filterKey]);
        if (container) {
            container.querySelectorAll('.filter-button').forEach(btn => {
                const isActive = btn.dataset.value === selectedChart.filters[filterKey];
                const testChart = { ...selectedChart };
                testChart.filters = { ...selectedChart.filters, [filterKey]: btn.dataset.value };
                const wouldBeDuplicate = !isScatterChartUnique(testChart, selectedChart.id);
                
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
    renderScatterPlots();
}

function renderSingleChart(chartIndex) {
    if (!state.rawData || state.rawData.length === 0) return;
    
    const chart = state.scatterCharts[chartIndex];
    if (chart) {
        renderScatterPlot(`scatter-chart-${chartIndex}`, chart, state.rawData);
    }
}

function renderScatterPlots() {
    const grid = document.getElementById('scatter-charts-grid');
    if (!grid) return;

    // Clear and render charts (only on initial load)
    grid.innerHTML = '';
    
    // Update grid layout
    updateGridLayout();
    
    state.scatterCharts.forEach((chart, index) => {
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        chartWrapper.innerHTML = `
            <div class="chart-header">
                <span class="chart-title">Chart ${index + 1}</span>
                <button class="chart-remove-btn" data-index="${index}">×</button>
            </div>
            <div class="chart-content" id="scatter-chart-${index}"></div>
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
            removeScatterChart(index);
        });
    });

    // Render charts after DOM is ready
    setTimeout(() => {
        state.scatterCharts.forEach((chart, index) => {
            renderScatterPlot(`scatter-chart-${index}`, chart, state.rawData);
        });
    }, 0);
}

function isScatterChartUnique(newChart, excludeId = null) {
    return !state.scatterCharts.some(chart => 
        chart.id !== excludeId &&
        chart.xAxis === newChart.xAxis &&
        chart.yAxis === newChart.yAxis &&
        chart.filters.productType === newChart.filters.productType &&
        chart.filters.loanIntent === newChart.filters.loanIntent &&
        chart.filters.occupationStatus === newChart.filters.occupationStatus
    );
}

function addScatterChart() {
    if (state.scatterCharts.length >= 4) return;
    
    const newChart = {
        id: state.scatterCharts.length,
        xAxis: 'credit_score',
        yAxis: 'annual_income',
        filters: {
            productType: 'all',
            loanIntent: 'all',
            occupationStatus: 'all'
        }
    };
    
    // Try to find a unique configuration
    const axisOptions = ['credit_score', 'annual_income', 'loan_amount', 'interest_rate', 'debt_to_income_ratio'];
    let foundUnique = false;
    
    // Try different axis combinations
    for (let i = 0; i < axisOptions.length && !foundUnique; i++) {
        for (let j = 0; j < axisOptions.length && !foundUnique; j++) {
            if (i !== j) { // Ensure X and Y are different
                newChart.xAxis = axisOptions[i];
                newChart.yAxis = axisOptions[j];
                if (isScatterChartUnique(newChart)) {
                    foundUnique = true;
                    break;
                }
            }
        }
    }
    
    // Only add if unique
    if (!isScatterChartUnique(newChart)) {
        return; // Silently fail if duplicate
    }
    
    state.scatterCharts.push(newChart);
    state.selectedScatterChart = newChart.id;
    saveState();
    
    // Update grid layout first
    updateGridLayout();
    
    // Add only the new chart to the grid
    const grid = document.getElementById('scatter-charts-grid');
    if (grid) {
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        chartWrapper.innerHTML = `
            <div class="chart-header">
                <span class="chart-title">Chart ${newChart.id + 1}</span>
                <button class="chart-remove-btn" data-index="${newChart.id}">×</button>
            </div>
            <div class="chart-content" id="scatter-chart-${newChart.id}"></div>
        `;
        grid.appendChild(chartWrapper);
        
        // Setup remove button for new chart
        const removeBtn = chartWrapper.querySelector('.chart-remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const index = parseInt(this.dataset.index);
                removeScatterChart(index);
            });
        }
        
        // Wait for layout to settle, then render all charts (they need to resize)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Re-render all charts to ensure proper sizing
                state.scatterCharts.forEach((chart, index) => {
                    renderScatterPlot(`scatter-chart-${index}`, chart, state.rawData);
                });
            });
        });
    }
    
    updateChartSelectors();
    updateFilterButtons();
    updateAddChartButtons();
}

function removeScatterChart(index) {
    if (state.scatterCharts.length <= 1) return;
    
    // Remove the chart wrapper from DOM first (before state changes)
    const grid = document.getElementById('scatter-charts-grid');
    if (grid) {
        const chartWrapper = grid.querySelector(`#scatter-chart-${index}`)?.closest('.chart-wrapper');
        if (chartWrapper) {
            chartWrapper.remove();
        }
    }
    
    // Remove chart from state
    state.scatterCharts.splice(index, 1);
    
    // Reassign IDs
    state.scatterCharts.forEach((chart, i) => {
        chart.id = i;
    });
    
    // Adjust selected chart
    if (state.selectedScatterChart >= state.scatterCharts.length) {
        state.selectedScatterChart = state.scatterCharts.length - 1;
    }
    saveState();
    
    // Update grid layout
    updateGridLayout();
    
    // Update chart titles and IDs for charts after the removed one
    if (grid) {
        const wrappers = Array.from(grid.querySelectorAll('.chart-wrapper'));
        wrappers.forEach((wrapper, i) => {
            const chart = state.scatterCharts[i];
            if (chart) {
                // Update the ID in the content div
                const contentDiv = wrapper.querySelector('.chart-content');
                if (contentDiv) {
                    contentDiv.id = `scatter-chart-${chart.id}`;
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
                state.scatterCharts.forEach((chart, index) => {
                    renderScatterPlot(`scatter-chart-${index}`, chart, state.rawData);
                });
            });
        });
    }
    
    updateChartSelectors();
    updateFilterButtons();
    updateAddChartButtons();
}

function updateGridLayout() {
    const grid = document.getElementById('scatter-charts-grid');
    if (!grid) return;
    
    const numCharts = state.scatterCharts.length;
    
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

function setupAddChartButtons() {
    const scatterAddBtn = document.getElementById('scatter-add-chart-btn');
    if (scatterAddBtn) {
        scatterAddBtn.addEventListener('click', () => addScatterChart());
    }
}

function updateAddChartButtons() {
    const scatterAddBtn = document.getElementById('scatter-add-chart-btn');
    if (scatterAddBtn) {
        scatterAddBtn.style.display = state.scatterCharts.length < 4 ? 'flex' : 'none';
        scatterAddBtn.disabled = state.scatterCharts.length >= 4;
    }
}

function updateChartSelectors() {
    // Scatter chart selector
    const scatterSelector = document.getElementById('scatter-chart-selector');
    if (scatterSelector) {
        scatterSelector.innerHTML = '';
        state.scatterCharts.forEach((chart, index) => {
            const button = document.createElement('button');
            button.className = `filter-button ${index === state.selectedScatterChart ? 'active' : ''}`;
            button.dataset.index = index;
            button.textContent = `Chart ${index + 1}`;
            scatterSelector.appendChild(button);
        });
    }
}

function setupChartSelectors() {
    // Scatter chart selector
    const scatterSelector = document.getElementById('scatter-chart-selector');
    if (scatterSelector) {
        scatterSelector.addEventListener('click', function(event) {
            if (event.target.classList.contains('filter-button')) {
                const index = parseInt(event.target.dataset.index);
                state.selectedScatterChart = index;
                saveState();
                updateChartSelectors();
                updateFilterButtons();
                // No need to re-render, just update filter buttons
            }
        });
    }
}
