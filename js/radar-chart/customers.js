// D3 is loaded globally via CDN in HTML
const d3 = window.d3;
import { state } from './state.js';
import { MAX_RECOMMENDED_CUSTOMERS, getCustomerColor } from './config.js';
import { formatValue } from './utils.js';
import { axes } from './config.js';
import { updateChart, updateHandlesState } from './chart.js';
import { updatePrediction } from './prediction.js';

// Загрузка данных из CSV
export function loadCustomerData() {
    d3.csv('data/Loan_approval_data_2025.csv').then(function(data) {
        state.customerData = data;
        
        // Инициализируем виртуальный скроллинг
        populateCustomerList();
        updatePrediction();
        updateClearAllButton();
    }).catch(function(error) {
        console.error('Error loading CSV:', error);
        const container = d3.select('#customer-list-container');
        container.append('div')
            .style('text-align', 'center')
            .style('padding', '20px')
            .style('color', '#dc2626')
            .text('Error loading customer data');
    });
}

// Создание expandable секции для клиента
function createExpandableSection(wrapper, customer, originalIndex, wasExpanded) {
    const color = getCustomerColor(originalIndex);
    const isApproved = parseInt(customer.loan_status) === 1;
    
    // Добавляем expandable контейнер
    const expandable = wrapper.append('div')
        .attr('class', 'customer-expandable')
        .style('display', wasExpanded ? 'block' : 'none');
    
    // Детали займа
    const details = expandable.append('div')
        .attr('class', 'customer-loan-details')
        .style('border-left-color', color);
    
    const header = details.append('div')
        .attr('class', 'loan-info-item-header');
    
    header.append('div')
        .attr('class', `loan-status-badge ${isApproved ? 'approved' : 'rejected'}`)
        .text(isApproved ? 'Approved' : 'Rejected');
    
    const infoGrid = details.append('div')
        .attr('class', 'loan-info-details');
    
    infoGrid.append('div')
        .attr('class', 'loan-info-detail')
        .html(`<div class="loan-info-detail-label">Product Type</div><div class="loan-info-detail-value">${customer.product_type}</div>`);
    
    infoGrid.append('div')
        .attr('class', 'loan-info-detail')
        .html(`<div class="loan-info-detail-label">Loan Intent</div><div class="loan-info-detail-value">${customer.loan_intent}</div>`);
    
    infoGrid.append('div')
        .attr('class', 'loan-info-detail')
        .html(`<div class="loan-info-detail-label">Loan Amount</div><div class="loan-info-detail-value">$${parseFloat(customer.loan_amount).toLocaleString()}</div>`);
    
    infoGrid.append('div')
        .attr('class', 'loan-info-detail')
        .html(`<div class="loan-info-detail-label">Interest Rate</div><div class="loan-info-detail-value">${parseFloat(customer.interest_rate).toFixed(2)}%</div>`);
    
    return expandable;
}

// Обновление отдельного элемента списка клиентов
function updateCustomerListItem(customerId) {
    const customer = state.customerData.find(d => d.customer_id === customerId);
    if (!customer) return;
    
    const wrapper = d3.select(`.customer-item-wrapper[data-customer-id="${customerId}"]`);
    if (wrapper.empty()) return;
    
    const row = wrapper.select('.customer-item-row');
    const isSelected = state.selectedCustomerIds.indexOf(customerId) !== -1;
    const existingExpandBtn = row.select('.customer-expand-btn');
    const existingExpandable = wrapper.select('.customer-expandable');
    
    if (isSelected) {
        // Клиент выбран - добавляем expand button и секцию, если их еще нет
        if (existingExpandBtn.empty()) {
            const originalIndex = state.selectedCustomerIds.indexOf(customerId);
            const wasExpanded = state.expandedCustomerIds.has(customerId);
            
            const expandBtn = row.append('button')
                .attr('class', 'customer-expand-btn')
                .html(wasExpanded ? '▲' : '▼')
                .on('click', function(event) {
                    event.stopPropagation();
                    const expandable = wrapper.select('.customer-expandable');
                    const isExpanded = expandable.style('display') !== 'none';
                    
                    // Отключаем кнопку на время анимации для предотвращения множественных кликов
                    expandBtn.style('pointer-events', 'none');
                    
                    // Используем двойной requestAnimationFrame для плавной анимации
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            if (isExpanded) {
                                // Сворачиваем
                                expandable.style('display', 'none');
                                expandBtn.html('▼');
                                state.expandedCustomerIds.delete(customerId);
                            } else {
                                // Разворачиваем
                                expandable.style('display', 'block');
                                expandBtn.html('▲');
                                state.expandedCustomerIds.add(customerId);
                            }
                            
                            // Включаем кнопку обратно после небольшой задержки
                            setTimeout(() => {
                                expandBtn.style('pointer-events', 'all');
                                // Обновляем виртуальный скролл после расширения (для корректной высоты)
                                requestAnimationFrame(() => {
                                    updateVirtualScroll();
                                });
                            }, 300);
                        });
                    });
                });
            
            if (existingExpandable.empty()) {
                createExpandableSection(wrapper, customer, originalIndex, wasExpanded);
            }
        }
    } else {
        // Клиент не выбран - удаляем expand button и секцию
        existingExpandBtn.remove();
        existingExpandable.remove();
    }
    
    // Обновляем выделение кнопки
    wrapper.select('.customer-item')
        .classed('selected', isSelected);
}

// Вычисление видимого диапазона для виртуального скроллинга
function calculateVisibleRange() {
    const container = document.getElementById('customer-list-container');
    if (!container || state.customerData.length === 0) return;
    
    const containerHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    const buffer = state.virtualScrollState.buffer;
    
    // Вычисляем начальный и конечный индексы
    const startIndex = Math.max(0, Math.floor(scrollTop / state.virtualScrollState.itemHeight) - buffer);
    const endIndex = Math.min(
        state.customerData.length - 1,
        Math.ceil((scrollTop + containerHeight) / state.virtualScrollState.itemHeight) + buffer
    );
    
    state.virtualScrollState.visibleStart = startIndex;
    state.virtualScrollState.visibleEnd = endIndex;
    state.virtualScrollState.scrollTop = scrollTop;
}

// Обновление виртуального скролла
export function updateVirtualScroll() {
    const container = d3.select('#customer-list-container');
    
    if (state.customerData.length === 0) {
        container.selectAll('*').remove();
        return;
    }
    
    calculateVisibleRange();
    
    // Получаем видимые элементы
    const visibleData = state.customerData.slice(
        state.virtualScrollState.visibleStart,
        state.virtualScrollState.visibleEnd + 1
    );
    
    // Создаем виртуальную структуру, если её нет
    let virtualContainer = container.select('.customer-list-virtual');
    if (virtualContainer.empty()) {
        virtualContainer = container.append('div')
            .attr('class', 'customer-list-virtual');
        
        // Spacer для правильной высоты скроллбара
        virtualContainer.append('div')
            .attr('class', 'customer-list-spacer');
        
        // Контейнер для видимых элементов
        virtualContainer.append('div')
            .attr('class', 'customer-list-content');
        
        // Обработчик скролла с throttling (только если еще не добавлен)
        if (!container.node().hasAttribute('data-scroll-handler')) {
            container.node().setAttribute('data-scroll-handler', 'true');
            let scrollTimeout;
            container.node().addEventListener('scroll', function() {
                clearTimeout(scrollTimeout);
                scrollTimeout = requestAnimationFrame(() => {
                    updateVirtualScroll();
                });
            }, { passive: true });
        }
    }
    
    const spacer = virtualContainer.select('.customer-list-spacer');
    const content = virtualContainer.select('.customer-list-content');
    
    // Устанавливаем высоту spacer для правильного скроллбара
    const totalHeight = state.customerData.length * state.virtualScrollState.itemHeight;
    spacer.style('height', totalHeight + 'px');
    
    // Позиционируем контент
    const offsetY = state.virtualScrollState.visibleStart * state.virtualScrollState.itemHeight;
    content.style('transform', `translateY(${offsetY}px)`);
    
    // Обновляем видимые элементы
    const customerItems = content.selectAll('.customer-item-wrapper')
        .data(visibleData, d => d.customer_id);
    
    customerItems.exit().remove();
    
    const customerItemsEnter = customerItems.enter()
        .append('div')
        .attr('class', 'customer-item-wrapper')
        .attr('data-customer-id', d => d.customer_id);
    
    const itemRows = customerItemsEnter.append('div')
        .attr('class', 'customer-item-row');
    
    itemRows.append('button')
        .attr('class', 'customer-item')
        .text(d => d.customer_id.toUpperCase())
        .on('click', function(event, d) {
            event.stopPropagation();
            toggleCustomer(d.customer_id);
        });
    
    const customerItemsUpdate = customerItemsEnter.merge(customerItems);
    
    customerItemsUpdate.each(function(d) {
        updateCustomerListItem(d.customer_id);
    });
}

// Заполнение списка клиентов (использует виртуальный скроллинг)
export function populateCustomerList() {
    updateVirtualScroll();
}

// Обновление предупреждения о количестве клиентов
function updateCustomerWarning() {
    const warningDiv = document.getElementById('customer-warning');
    const count = state.selectedCustomerIds.length;
    
    if (count > MAX_RECOMMENDED_CUSTOMERS) {
        warningDiv.style.display = 'block';
        warningDiv.textContent = `⚠️ ${count} customers selected. Consider selecting fewer (${MAX_RECOMMENDED_CUSTOMERS} or less) for better clarity.`;
    } else {
        warningDiv.style.display = 'none';
    }
}

// Переключение выбора клиента (добавить/удалить)
export function toggleCustomer(customerId) {
    const index = state.selectedCustomerIds.indexOf(customerId);
    if (index === -1) {
        // Добавляем клиента
        state.selectedCustomerIds.push(customerId);
    } else {
        // Удаляем клиента
        state.selectedCustomerIds.splice(index, 1);
        // Удаляем из Set развернутых, если был развернут
        state.expandedCustomerIds.delete(customerId);
    }
    
    // Обновляем график
    updateChart(true);
    
    // Обновляем виртуальный скролл
    updateVirtualScroll();
    
    updateHandlesState();
    updateCustomerTags();
    updateCustomerWarning();
    updateClearAllButton();
}

// Очистка всех выбранных клиентов
export function clearAllCustomers() {
    state.selectedCustomerIds = [];
    state.expandedCustomerIds.clear();
    
    // Обновляем график
    updateChart(true);
    
    // Обновляем виртуальный скролл
    updateVirtualScroll();
    
    updateHandlesState();
    updateCustomerTags();
    updateCustomerWarning();
    updateClearAllButton();
}

// Обновление состояния кнопки "Clear All"
export function updateClearAllButton() {
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.disabled = state.selectedCustomerIds.length === 0;
    }
}

// Добавление клиента по ID из поля поиска
export function addCustomerById(customerId) {
    // Нормализуем ID (может быть введен в любом регистре)
    const normalizedId = customerId.toUpperCase();
    const customer = state.customerData.find(d => d.customer_id.toUpperCase() === normalizedId);
    
    if (!customer) {
        alert(`Customer ID "${customerId}" not found!`);
        return;
    }
    
    // Добавляем, если еще не добавлен
    if (state.selectedCustomerIds.indexOf(customer.customer_id) === -1) {
        toggleCustomer(customer.customer_id);
    }
}

// Обновление тегов с значениями клиентов
export function updateCustomerTags() {
    // Маппинг индексов осей к индексам полей данных
    const dataFieldMap = {
        0: 'credit_score',
        1: 'annual_income',
        2: 'current_debt',
        3: 'years_employed',
        4: 'savings_assets',
        5: 'debt_to_income_ratio'
    };

    axes.forEach((axis, axisIndex) => {
        const tagsContainer = d3.select(`#tags${axisIndex}`);
        tagsContainer.selectAll('*').remove();

        state.selectedCustomerIds.forEach((customerId, originalIndex) => {
            const customer = state.customerData.find(d => d.customer_id === customerId);
            if (!customer) return;

            const fieldName = dataFieldMap[axisIndex];
            let value = parseFloat(customer[fieldName]);
            
            // Для DTI Ratio умножаем на 100 для процентов
            if (axisIndex === 5) {
                value = value * 100;
            }

            const color = getCustomerColor(originalIndex);
            
            tagsContainer.append('span')
                .attr('class', 'customer-tag')
                .style('background-color', color)
                .style('opacity', 0.3)
                .text(formatValue(value, axisIndex));
        });
    });
}

// Инициализация поиска клиентов
export function initializeCustomerSearch() {
    const searchInput = document.getElementById('customer-search');
    const searchBtn = document.getElementById('search-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function() {
            const customerId = searchInput.value.trim();
            if (customerId) {
                addCustomerById(customerId);
                searchInput.value = '';
            }
        });
        
        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                const customerId = searchInput.value.trim();
                if (customerId) {
                    addCustomerById(customerId);
                    searchInput.value = '';
                }
            }
        });
    }
    
    // Инициализация кнопки "Clear All"
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            clearAllCustomers();
        });
        // Инициализируем состояние кнопки
        updateClearAllButton();
    }
}

