// Main initialization file for radar chart visualization
import { initializeChart, updateChart, updateHandlesState } from './radar-chart/chart.js';
import { initializeInputs, initializeDragHandlers } from './radar-chart/interactions.js';
import { initializeCustomerSearch, loadCustomerData } from './radar-chart/customers.js';
import { initializeLoanParameters } from './radar-chart/prediction.js';
import { state } from './radar-chart/state.js';

// Инициализация переключателя "Show My Data"
function initializeShowMyDataToggle() {
    const toggle = document.getElementById('show-my-data-toggle');
    if (toggle) {
        toggle.checked = state.showManualData;
        toggle.addEventListener('change', function() {
            state.showManualData = this.checked;
            updateChart(true); // Обновляем только график, предсказание и таблица остаются активными
        });
    }
}

// Инициализация - ждем загрузки DOM
function init() {
    initializeChart();
    updateChart(false);
    initializeInputs();
    initializeDragHandlers();
    initializeCustomerSearch();
    initializeShowMyDataToggle();
    initializeLoanParameters();
    updateHandlesState();
    loadCustomerData();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM уже загружен
    init();
}

