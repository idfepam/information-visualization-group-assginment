// Bar chart rendering logic - approval rate analysis
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { margin, statusNames, colors } from './config.js';
import { state } from './state.js';

let barTooltip;

export function initializeBarChartTooltip() {
    barTooltip = d3
        .select("body")
        .append("div")
        .attr("class", "bar-chart-tooltip")
        .style("opacity", 0);
}

export function renderBarChart(containerId, chartConfig, data) {
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

    // Calculate approval rates
    const grouped = d3.rollups(
        filteredData,
        (v) => {
            const total = v.length;
            const approved = v.filter(d => d.loan_status === 1).length;
            return {
                total,
                approved,
                rate: total > 0 ? (approved / total) * 100 : 0
            };
        },
        (d) => {
            if (chartConfig.groupBy === 'product_type') return d.product_type;
            if (chartConfig.groupBy === 'loan_intent') return d.loan_intent;
            if (chartConfig.groupBy === 'occupation_status') return d.occupation_status;
            return 'All';
        }
    );

    const chartData = grouped.map(([group, stats]) => ({
        group,
        ...stats
    })).sort((a, b) => b.rate - a.rate);

    if (chartData.length === 0) return;

    // Scales
    const x = d3.scaleBand()
        .domain(chartData.map(d => d.group))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, 100])
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
        .text(`Loan Approval Rate by ${getGroupByLabel(chartConfig.groupBy)}`);

    // Add bars
    const bars = svg.selectAll(".bar")
        .data(chartData)
        .enter()
        .append("g")
        .attr("class", "bar");

    bars.append("rect")
        .attr("x", d => x(d.group))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", colors.approved)
        .attr("rx", 4)
        .on("mouseover", (event, d) => {
            if (!barTooltip) initializeBarChartTooltip();
            barTooltip
                .style("opacity", 1)
                .html(`
                    <strong>${d.group}</strong><br>
                    Approval Rate: ${d.rate.toFixed(1)}%<br>
                    Approved: ${d.approved.toLocaleString()}<br>
                    Total: ${d.total.toLocaleString()}
                `);
        })
        .on("mousemove", (event) => {
            if (!barTooltip) initializeBarChartTooltip();
            barTooltip
                .style("top", event.pageY - 20 + "px")
                .style("left", event.pageX + 20 + "px");
        })
        .on("mouseout", () => {
            if (!barTooltip) initializeBarChartTooltip();
            barTooltip.style("opacity", 0);
        })
        .transition()
        .duration(800)
        .attr("y", d => y(d.rate))
        .attr("height", d => height - y(d.rate));

    // Add value labels
    bars.append("text")
        .attr("x", d => x(d.group) + x.bandwidth() / 2)
        .attr("y", d => y(d.rate) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#333")
        .text(d => `${d.rate.toFixed(1)}%`);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", "#666")
        .attr("transform", "rotate(-15)")
        .attr("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => d + "%"))
        .selectAll("text")
        .style("font-size", "11px")
        .style("fill", "#666");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 15)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#666")
        .text("Approval Rate (%)");
}

function getGroupByLabel(groupBy) {
    const labels = {
        'product_type': 'Product Type',
        'loan_intent': 'Loan Intent',
        'occupation_status': 'Occupation Status'
    };
    return labels[groupBy] || groupBy;
}
