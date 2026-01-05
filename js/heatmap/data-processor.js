// Data processing for heatmap
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { ageGroups, incomeBrackets, getAgeGroup, getIncomeBracket } from './config.js';

export function processHeatmapData(data, filters = { productType: 'all', loanIntent: 'all', occupationStatus: 'all' }) {
    // Convert data types
    data.forEach(d => {
        d.age = +d.age;
        d.annual_income = +d.annual_income;
        d.loan_status = +d.loan_status; // 1 = approved, 0 = rejected
        d.loan_amount = +d.loan_amount;
    });

    // Apply filters
    let filteredData = [...data];
    if (filters.productType && filters.productType !== 'all') {
        filteredData = filteredData.filter(d => d.product_type === filters.productType);
    }
    if (filters.loanIntent && filters.loanIntent !== 'all') {
        filteredData = filteredData.filter(d => d.loan_intent === filters.loanIntent);
    }
    if (filters.occupationStatus && filters.occupationStatus !== 'all') {
        filteredData = filteredData.filter(d => d.occupation_status === filters.occupationStatus);
    }

    // Add age group and income bracket to each record
    data.forEach(d => {
        d.ageGroup = getAgeGroup(d.age);
        d.incomeBracket = getIncomeBracket(d.annual_income);
    });

    // Aggregate data: group by age group and income bracket
    const aggregated = d3.rollup(
        filteredData,
        v => ({
            count: v.length,
            approved: d3.sum(v, d => d.loan_status),
            approvalRate: (d3.sum(v, d => d.loan_status) / v.length) * 100,
            avgLoanAmount: d3.mean(v, d => d.loan_amount)
        }),
        d => d.ageGroup,
        d => d.incomeBracket
    );

    // Convert to array format for easier handling
    const heatmapData = [];
    ageGroups.forEach(ageGroup => {
        incomeBrackets.forEach(incomeBracket => {
            const groupData = aggregated.get(ageGroup)?.get(incomeBracket);
            if (groupData) {
                heatmapData.push({
                    ageGroup,
                    incomeBracket,
                    ...groupData
                });
            } else {
                // Add empty cell if no data
                heatmapData.push({
                    ageGroup,
                    incomeBracket,
                    count: 0,
                    approved: 0,
                    approvalRate: 0,
                    avgLoanAmount: 0
                });
            }
        });
    });

    // Calculate statistics
    const totalApplications = d3.sum(heatmapData, d => d.count);
    const totalApproved = d3.sum(heatmapData, d => d.approved);
    const overallApprovalRate = (totalApproved / totalApplications) * 100;
    const avgLoanAmount = d3.mean(filteredData, d => d.loan_amount);

    return {
        heatmapData,
        stats: {
            totalApplications,
            totalApproved,
            overallApprovalRate,
            avgLoanAmount
        }
    };
}
