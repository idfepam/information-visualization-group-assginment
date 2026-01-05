// Line chart visualization
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { margin, chartWidth, chartHeight, statusNames, colors } from './config.js';

let lineSvg, lineTooltip;

export function initializeLineChart() {
    const container = d3.select("#line-chart-container");
    container.selectAll("*").remove();

    const width = chartWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    lineSvg = container
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    lineTooltip = d3
        .select("body")
        .append("div")
        .attr("class", "line-tooltip")
        .style("opacity", 0);
}

export function renderLineChart(data, groupBy, metric, filters) {
    if (!lineSvg) initializeLineChart();

    const width = chartWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    // Filter data
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

    // Group data
    const grouped = d3.rollups(
        filteredData,
        (v) => {
            const values = v.map(d => +d[metric]).filter(v => !isNaN(v));
            return d3.mean(values);
        },
        (d) => {
            if (groupBy === 'product_type') return d.product_type;
            if (groupBy === 'loan_intent') return d.loan_intent;
            if (groupBy === 'occupation_status') return d.occupation_status;
            return 'All';
        }
    );

    const chartData = grouped.map(([group, value]) => ({
        group,
        value
    })).sort((a, b) => {
        // Sort alphabetically for consistent ordering
        return a.group.localeCompare(b.group);
    });

    // Scales
    const x = d3.scaleBand()
        .domain(chartData.map(d => d.group))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.value)])
        .nice()
        .range([height, 0]);

    // Line generator
    const line = d3.line()
        .x(d => x(d.group) + x.bandwidth() / 2)
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    // Clear previous
    lineSvg.selectAll("*").remove();

    // Add title
    lineSvg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "700")
        .style("fill", "#333")
        .text(`${getMetricLabel(metric)} by ${getGroupByLabel(groupBy)}`);

    // Add axes
    lineSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "#666")
        .attr("transform", "rotate(-15)")
        .attr("text-anchor", "end");

    lineSvg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => formatMetricValue(d, metric)))
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "#666");

    // Add grid lines
    lineSvg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat("")
        )
        .selectAll("line")
        .attr("stroke", "#e0e0e0")
        .attr("stroke-dasharray", "2,2");

    // Add line
    lineSvg.append("path")
        .datum(chartData)
        .attr("fill", "none")
        .attr("stroke", colors.credit_score)
        .attr("stroke-width", 3)
        .attr("d", line);

    // Add points
    lineSvg.selectAll(".dot")
        .data(chartData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.group) + x.bandwidth() / 2)
        .attr("cy", d => y(d.value))
        .attr("r", 5)
        .attr("fill", colors.credit_score)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .on("mouseover", (event, d) => {
            lineTooltip
                .style("opacity", 1)
                .html(`
                    <strong>${d.group}</strong><br>
                    ${getMetricLabel(metric)}: ${formatMetricValue(d.value, metric)}
                `);
        })
        .on("mousemove", (event) => {
            lineTooltip
                .style("top", event.pageY - 20 + "px")
                .style("left", event.pageX + 20 + "px");
        })
        .on("mouseout", () => lineTooltip.style("opacity", 0));

    // Y-axis label
    lineSvg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .style("fill", "#666")
        .text(getMetricLabel(metric));
}

function getMetricLabel(metric) {
    const labels = {
        'credit_score': 'Credit Score',
        'annual_income': 'Annual Income',
        'loan_amount': 'Loan Amount',
        'debt_to_income_ratio': 'DTI Ratio',
        'interest_rate': 'Interest Rate'
    };
    return labels[metric] || metric;
}

function getGroupByLabel(groupBy) {
    const labels = {
        'product_type': 'Product Type',
        'loan_intent': 'Loan Intent',
        'occupation_status': 'Occupation Status'
    };
    return labels[groupBy] || groupBy;
}

function formatMetricValue(value, metric) {
    if (metric === 'annual_income' || metric === 'loan_amount') {
        return '$' + (value / 1000).toFixed(0) + 'k';
    } else if (metric === 'debt_to_income_ratio') {
        return (value * 100).toFixed(1) + '%';
    } else if (metric === 'interest_rate') {
        return value.toFixed(1) + '%';
    } else {
        return value.toFixed(0);
    }
}
