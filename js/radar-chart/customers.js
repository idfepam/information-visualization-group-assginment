// D3 is loaded globally via CDN in HTML
const d3 = window.d3;
import { state, saveState } from './state.js';
import { MAX_RECOMMENDED_CUSTOMERS, getCustomerColor } from './config.js';
import { formatValue } from './utils.js';
import { axes } from './config.js';
import { updateChart, updateHandlesState } from './chart.js';
import { updatePrediction } from './prediction.js';
import { loadLoanData } from '../shared/data-loader.js';

// Load customer data from CSV
export function loadCustomerData() {
    return loadLoanData().then(function(data) {
        state.customerData = data;
        
        // Initialize virtual scrolling
        populateCustomerList();
        updatePrediction();
        updateClearAllButton();
        return data;
    }).catch(function(error) {
        console.error('Error loading CSV:', error);
        const container = d3.select('#customer-list-container');
        container.append('div')
            .style('text-align', 'center')
            .style('padding', '20px')
            .style('color', '#dc2626')
            .text('Error loading customer data');
        return [];
    });
}

// Create expandable section for customer
function createExpandableSection(wrapper, customer, originalIndex, wasExpanded) {
    const color = getCustomerColor(originalIndex);
    const isApproved = parseInt(customer.loan_status) === 1;
    
    // Add expandable container
    const expandable = wrapper.append('div')
        .attr('class', 'customer-expandable')
        .style('display', wasExpanded ? 'block' : 'none');
    
    // Loan details
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

// Update individual customer list item
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
        // Customer is selected - add expand button and section if they don't exist
        if (existingExpandBtn.empty()) {
            const originalIndex = state.selectedCustomerIds.indexOf(customerId);
            const wasExpanded = state.expandedCustomerIds.has(customerId);
            
            const expandBtn = row.append('button')
                .attr('class', 'customer-expand-btn')
                .html(wasExpanded ? '▲' : '▼')
                .on('click', function(event) {
                    event.stopPropagation();
                    
                    // Check state from the Set instead of DOM for immediate response
                    const isExpanded = state.expandedCustomerIds.has(customerId);
                    const expandable = wrapper.select('.customer-expandable');
                    
                    // Disable button briefly to prevent multiple clicks
                    expandBtn.style('pointer-events', 'none');
                    
                    if (isExpanded) {
                        // Collapse
                        expandable.style('display', 'none');
                        expandBtn.html('▼');
                        state.expandedCustomerIds.delete(customerId);
                    } else {
                        // Expand
                        expandable.style('display', 'block');
                        expandBtn.html('▲');
                        state.expandedCustomerIds.add(customerId);
                    }
                    saveState();
                    
                    // Update virtual scroll
                    requestAnimationFrame(() => {
                        updateVirtualScroll();
                    });
                    
                    // Re-enable button after short delay
                    setTimeout(() => {
                        expandBtn.style('pointer-events', 'all');
                    }, 100);
                });
            
            if (existingExpandable.empty()) {
                createExpandableSection(wrapper, customer, originalIndex, wasExpanded);
            }
        }
    } else {
        // Customer not selected - remove expand button and section
        existingExpandBtn.remove();
        existingExpandable.remove();
    }
    
    // Update button selection
    wrapper.select('.customer-item')
        .classed('selected', isSelected);
}

// Calculate visible range for virtual scrolling
function calculateVisibleRange() {
    const container = document.getElementById('customer-list-container');
    if (!container || state.customerData.length === 0) return;
    
    const containerHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    const buffer = state.virtualScrollState.buffer;
    
    // Calculate start and end indices
    const startIndex = Math.max(0, Math.floor(scrollTop / state.virtualScrollState.itemHeight) - buffer);
    const endIndex = Math.min(
        state.customerData.length - 1,
        Math.ceil((scrollTop + containerHeight) / state.virtualScrollState.itemHeight) + buffer
    );
    
    state.virtualScrollState.visibleStart = startIndex;
    state.virtualScrollState.visibleEnd = endIndex;
    state.virtualScrollState.scrollTop = scrollTop;
}

// Update virtual scroll
export function updateVirtualScroll() {
    const container = d3.select('#customer-list-container');
    
    if (state.customerData.length === 0) {
        container.selectAll('*').remove();
        return;
    }
    
    calculateVisibleRange();
    
    // Get visible elements
    const visibleData = state.customerData.slice(
        state.virtualScrollState.visibleStart,
        state.virtualScrollState.visibleEnd + 1
    );
    
    // Create virtual structure if it doesn't exist
    let virtualContainer = container.select('.customer-list-virtual');
    if (virtualContainer.empty()) {
        virtualContainer = container.append('div')
            .attr('class', 'customer-list-virtual');
        
        // Spacer for correct scrollbar height
        virtualContainer.append('div')
            .attr('class', 'customer-list-spacer');
        
        // Container for visible elements
        virtualContainer.append('div')
            .attr('class', 'customer-list-content');
        
        // Scroll handler with throttling (only if not already added)
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
    
    // Set spacer height for correct scrollbar
    const totalHeight = state.customerData.length * state.virtualScrollState.itemHeight;
    spacer.style('height', totalHeight + 'px');
    
    // Position content
    const offsetY = state.virtualScrollState.visibleStart * state.virtualScrollState.itemHeight;
    content.style('transform', `translateY(${offsetY}px)`);
    
    // Update visible elements
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

// Populate customer list (uses virtual scrolling)
export function populateCustomerList() {
    updateVirtualScroll();
}

// Update customer count warning
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

// Toggle customer selection (add/remove)
export function toggleCustomer(customerId) {
    const index = state.selectedCustomerIds.indexOf(customerId);
    if (index === -1) {
        // Add customer
        state.selectedCustomerIds.push(customerId);
    } else {
        // Remove customer
        state.selectedCustomerIds.splice(index, 1);
        // Remove from expanded set if was expanded
        state.expandedCustomerIds.delete(customerId);
    }
    
    // Update chart
    updateChart(true);
    
    // Update virtual scroll
    updateVirtualScroll();
    
    updateHandlesState();
    updateCustomerTags();
    updateCustomerWarning();
    updateClearAllButton();
}

// Clear all selected customers
export function clearAllCustomers() {
    state.selectedCustomerIds = [];
    state.expandedCustomerIds.clear();
    saveState();
    
    // Update chart
    updateChart(true);
    
    // Update virtual scroll
    updateVirtualScroll();
    
    updateHandlesState();
    updateCustomerTags();
    updateCustomerWarning();
    updateClearAllButton();
}

// Update "Clear All" button state
export function updateClearAllButton() {
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.disabled = state.selectedCustomerIds.length === 0;
    }
}

// Add customer by ID from search field
export function addCustomerById(customerId) {
    // Normalize ID (can be entered in any case)
    const normalizedId = customerId.toUpperCase();
    const customer = state.customerData.find(d => d.customer_id.toUpperCase() === normalizedId);
    
    if (!customer) {
        alert(`Customer ID "${customerId}" not found!`);
        return;
    }
    
    // Add if not already added
    if (state.selectedCustomerIds.indexOf(customer.customer_id) === -1) {
        toggleCustomer(customer.customer_id);
    }
}

// Update tags with customer values
export function updateCustomerTags() {
    // Map axis indices to data field indices
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
            
            // For DTI Ratio multiply by 100 for percentage
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

// Initialize customer search
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
    
    // Initialize "Clear All" button
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            clearAllCustomers();
        });
        // Initialize button state
        updateClearAllButton();
    }
}

