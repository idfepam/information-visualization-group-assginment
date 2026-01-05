// Shared data loader - loads CSV once and caches it
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

let cachedData = null;
let dataLoadPromise = null;

export function loadLoanData() {
    // If data is already cached, return it immediately
    if (cachedData) {
        return Promise.resolve(cachedData);
    }
    
    // If data is currently loading, return the existing promise
    if (dataLoadPromise) {
        return dataLoadPromise;
    }
    
    // Load data and cache it
    dataLoadPromise = d3.csv("data/Loan_approval_data_2025.csv").then(function (data) {
        // Convert numeric values
        data.forEach((d) => {
            d.annual_income = +d.annual_income;
            d.credit_score = +d.credit_score;
            d.loan_amount = +d.loan_amount;
            d.loan_status = +d.loan_status;
            d.debt_to_income_ratio = +d.debt_to_income_ratio;
            d.interest_rate = +d.interest_rate;
            d.savings_assets = +d.savings_assets;
            d.current_debt = +d.current_debt;
        });
        
        cachedData = data;
        return data;
    }).catch(function(error) {
        console.error('Error loading CSV:', error);
        dataLoadPromise = null; // Reset promise on error so it can be retried
        throw error;
    });
    
    return dataLoadPromise;
}

// Clear cache (useful for testing or forced reload)
export function clearDataCache() {
    cachedData = null;
    dataLoadPromise = null;
}
