// Main initialization file for radar chart visualization
import { initializeChart, updateChart, updateHandlesState } from './radar-chart/chart.js';
import { initializeInputs, initializeDragHandlers } from './radar-chart/interactions.js';
import { initializeCustomerSearch, loadCustomerData } from './radar-chart/customers.js';
import { initializeLoanParameters } from './radar-chart/prediction.js';
import { initializeNavigation } from './shared/navigation.js';
import { state, loadState, saveState } from './radar-chart/state.js';

// Инициализация переключателя "Show My Data"
function initializeShowMyDataToggle() {
    const toggle = document.getElementById('show-my-data-toggle');
    if (toggle) {
        toggle.checked = state.showManualData;
        toggle.addEventListener('change', function() {
            state.showManualData = this.checked;
            saveState();
            updateChart(true); // Обновляем только график, предсказание и таблица остаются активными
        });
    }
}

// Инициализация - ждем загрузки DOM
function init() {
    try {
        initializeNavigation();
        
        // Load saved state from localStorage (before initializing chart)
        loadState();
        
        // Check if chart container exists
        const chartContainer = document.getElementById('chart');
        if (!chartContainer) {
            console.error('Chart container not found');
            return;
        }
        
        initializeChart();
        initializeInputs();
        initializeDragHandlers();
        initializeCustomerSearch();
        initializeShowMyDataToggle();
        initializeLoanParameters();
        
        // Render chart immediately with manual data
        updateChart(false);
        updateHandlesState();
        
        // Load customer data and update chart again if there are selected customers
        loadCustomerData().then(() => {
            // Update chart again after customer data is loaded (to show selected customers)
            updateChart(false);
            updateHandlesState();
        }).catch((error) => {
            console.error('Error loading customer data:', error);
        });
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM уже загружен
    init();
}

