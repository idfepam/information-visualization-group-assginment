// Scatter plot visualization
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { margin, statusNames, colors } from './config.js';

let scatterTooltip;

export function initializeScatterTooltip() {
    scatterTooltip = d3
        .select("body")
        .append("div")
        .attr("class", "scatter-tooltip")
        .style("opacity", 0);
}

export function renderScatterPlot(containerId, chartConfig, data) {
    const container = d3.select(`#${containerId}`);
    container.selectAll("*").remove();

    // Get container dimensions for responsive sizing
    const containerNode = container.node();
    const containerWidth = containerNode ? containerNode.clientWidth || 450 : 450;
    const containerHeight = containerNode ? containerNode.clientHeight || 500 : 500;
    
    const chartWidth = containerWidth - 40; // Account for padding
    const chartHeight = containerHeight - 40;
    
    const width = chartWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    // Filter data based on THIS chart's config (not selected chart)
    let filteredData = [...data];
    if (chartConfig.filters.productType && chartConfig.filters.productType !== 'all') {
        filteredData = filteredData.filter(d => d.product_type === chartConfig.filters.productType);
    }
    if (chartConfig.filters.loanIntent && chartConfig.filters.loanIntent !== 'all') {
        filteredData = filteredData.filter(d => d.loan_intent === chartConfig.filters.loanIntent);
    }
    if (chartConfig.filters.occupationStatus && chartConfig.filters.occupationStatus !== 'all') {
        filteredData = filteredData.filter(d => d.occupation_status === chartConfig.filters.occupationStatus);
    }

    // Prepare data
    const plotData = filteredData.map(d => ({
        x: +d[chartConfig.xAxis],
        y: +d[chartConfig.yAxis],
        status: d.loan_status,
        credit_score: +d.credit_score,
        annual_income: +d.annual_income,
        loan_amount: +d.loan_amount,
        dti: +d.debt_to_income_ratio
    })).filter(d => !isNaN(d.x) && !isNaN(d.y));

    if (plotData.length === 0) return;

    // Scales
    const x = d3.scaleLinear()
        .domain(d3.extent(plotData, d => d.x))
        .nice()
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain(d3.extent(plotData, d => d.y))
        .nice()
        .range([height, 0]);

    // Create SVG
    const svg = container
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "700")
        .style("fill", "#333")
        .text(`${getAxisLabel(chartConfig.yAxis)} vs ${getAxisLabel(chartConfig.xAxis)}`);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => formatAxisValue(d, chartConfig.xAxis)))
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", "#666");

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => formatAxisValue(d, chartConfig.yAxis)))
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", "#666");

    // Axis labels
    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#666")
        .text(getAxisLabel(chartConfig.xAxis));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 15)
        .attr("x", -height / 2)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#666")
        .text(getAxisLabel(chartConfig.yAxis));

    // Sample data if too many points for performance
    const MAX_POINTS = 10000; // Render max 5000 points for performance
    let displayData = plotData;
    if (plotData.length > MAX_POINTS) {
        // Sample data while preserving distribution
        const step = Math.ceil(plotData.length / MAX_POINTS);
        displayData = plotData.filter((d, i) => i % step === 0);
    }
    
    // Add points with optimized rendering
    const dots = svg.selectAll(".dot")
        .data(displayData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", plotData.length > MAX_POINTS ? 1.5 : 2.5) // Smaller dots when sampled
        .attr("fill", d => d.status === 1 ? colors.approved : colors.rejected)
        .attr("opacity", plotData.length > MAX_POINTS ? 0.4 : 0.6) // Slightly more transparent when sampled
        .style("pointer-events", "all")
        .on("mouseover", (event, d) => {
            if (!scatterTooltip) initializeScatterTooltip();
            scatterTooltip
                .style("opacity", 1)
                .html(`
                    <strong>${d.status === 1 ? 'Approved' : 'Rejected'}</strong><br>
                    ${getAxisLabel(chartConfig.xAxis)}: ${formatAxisValue(d.x, chartConfig.xAxis)}<br>
                    ${getAxisLabel(chartConfig.yAxis)}: ${formatAxisValue(d.y, chartConfig.yAxis)}<br>
                    Credit Score: ${d.credit_score}<br>
                    Annual Income: $${(d.annual_income / 1000).toFixed(0)}k
                `);
        })
        .on("mousemove", (event) => {
            if (!scatterTooltip) initializeScatterTooltip();
            scatterTooltip
                .style("top", event.pageY - 20 + "px")
                .style("left", event.pageX + 20 + "px");
        })
        .on("mouseout", () => {
            if (!scatterTooltip) initializeScatterTooltip();
            scatterTooltip.style("opacity", 0);
        });

    // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 100}, 20)`);

    const legendData = [
        { label: "Approved", color: colors.approved },
        { label: "Rejected", color: colors.rejected }
    ];

    legend.selectAll(".legend-item")
        .data(legendData)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`)
        .each(function(d) {
            const g = d3.select(this);
            g.append("circle")
                .attr("r", 4)
                .attr("fill", d.color);
            g.append("text")
                .attr("x", 10)
                .attr("y", 4)
                .style("font-size", "11px")
                .style("fill", "#666")
                .text(d.label);
        });
}

function getAxisLabel(axis) {
    const labels = {
        'credit_score': 'Credit Score',
        'annual_income': 'Annual Income',
        'loan_amount': 'Loan Amount',
        'debt_to_income_ratio': 'DTI Ratio',
        'interest_rate': 'Interest Rate',
        'savings_assets': 'Savings Assets',
        'current_debt': 'Current Debt'
    };
    return labels[axis] || axis;
}

function formatAxisValue(value, axis) {
    if (axis === 'annual_income' || axis === 'loan_amount' || axis === 'savings_assets' || axis === 'current_debt') {
        return '$' + (value / 1000).toFixed(0) + 'k';
    } else if (axis === 'debt_to_income_ratio') {
        return (value * 100).toFixed(1) + '%';
    } else if (axis === 'interest_rate') {
        return value.toFixed(1) + '%';
    } else {
        return value.toFixed(0);
    }
}
