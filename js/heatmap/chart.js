// Heatmap chart rendering logic
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { margin, width, height, ageGroups, incomeBrackets } from './config.js';

let svg, tooltip, colorScale;

export function initializeChart() {
    // Clear existing chart
    d3.select("#heatmap").selectAll("*").remove();

    // Create SVG
    svg = d3.select("#heatmap")
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create tooltip
    tooltip = d3.select("body")
        .append('div')
        .attr('class', 'heatmap-tooltip')
        .style('opacity', 0);

    // Color scale (red -> yellow -> green)
    colorScale = d3.scaleSequential()
        .domain([0, 100])
        .interpolator(d3.interpolateRdYlGn);
}

export function renderChart(processedData) {
    if (!svg) initializeChart();

    const { heatmapData, stats } = processedData;

    // Display statistics
    d3.select('#stats').html(`
        <div class="stat-item">
            <div class="stat-value">${stats.totalApplications.toLocaleString()}</div>
            <div class="stat-label">Total Applications</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.overallApprovalRate.toFixed(1)}%</div>
            <div class="stat-label">Overall Approval Rate</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">$${(stats.avgLoanAmount / 1000).toFixed(1)}K</div>
            <div class="stat-label">Avg Loan Amount</div>
        </div>
    `);

    // Create scales
    const xScale = d3.scaleBand()
        .domain(incomeBrackets)
        .range([0, width])
        .padding(0.05);

    const yScale = d3.scaleBand()
        .domain(ageGroups)
        .range([0, height])
        .padding(0.05);

    // Create gradient for legend
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'approval-gradient')
        .attr('x1', '0%')
        .attr('x2', '100%');

    gradient.selectAll('stop')
        .data([0, 25, 50, 75, 100])
        .enter()
        .append('stop')
        .attr('offset', d => `${d}%`)
        .attr('stop-color', d => colorScale(d));

    d3.select('#legend-gradient')
        .style('background', 'linear-gradient(to right, ' +
            colorScale(0) + ', ' +
            colorScale(25) + ', ' +
            colorScale(50) + ', ' +
            colorScale(75) + ', ' +
            colorScale(100) + ')');

    // Clear previous paths
    svg.selectAll(".cell").remove();
    svg.selectAll(".cell-text").remove();
    svg.selectAll(".axis").remove();
    svg.selectAll(".axis-label").remove();

    // Draw heatmap cells
    const cells = svg.selectAll('.cell')
        .data(heatmapData)
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('x', d => xScale(d.incomeBracket))
        .attr('y', d => yScale(d.ageGroup))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => d.count > 0 ? colorScale(d.approvalRate) : '#e2e8f0')
        .attr('opacity', 0)
        .on('mouseover', function(event, d) {
            tooltip
                .style('opacity', 1)
                .html(`
                    <div class="tooltip-title">${d.ageGroup} years, ${d.incomeBracket}</div>
                    <div><strong>Applications:</strong> ${d.count.toLocaleString()}</div>
                    <div><strong>Approval Rate:</strong> ${d.approvalRate.toFixed(1)}%</div>
                    <div><strong>Approved:</strong> ${d.approved.toLocaleString()} / ${d.count.toLocaleString()}</div>
                    <div><strong>Avg Loan:</strong> $${(d.avgLoanAmount / 1000).toFixed(1)}K</div>
                `)
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 15) + 'px');
        })
        .on('mousemove', function(event) {
            tooltip
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 15) + 'px');
        })
        .on('mouseout', function() {
            tooltip.style('opacity', 0);
        });

    // Animate cells
    cells.transition()
        .duration(800)
        .delay((d, i) => i * 20)
        .attr('opacity', 1);

    // Add percentage text to cells
    svg.selectAll('.cell-text')
        .data(heatmapData)
        .enter()
        .append('text')
        .attr('class', 'cell-text')
        .attr('x', d => xScale(d.incomeBracket) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.ageGroup) + yScale.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', d => d.approvalRate > 50 ? '#1a202c' : '#2d3748')
        .attr('font-size', '13px')
        .attr('font-weight', 'bold')
        .attr('opacity', 0)
        .text(d => d.count > 0 ? `${d.approvalRate.toFixed(0)}%` : 'N/A')
        .transition()
        .duration(800)
        .delay((d, i) => i * 20 + 400)
        .attr('opacity', d => d.count > 0 ? 0.8 : 0.3);

    // Add X axis
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('text-anchor', 'middle');

    // Add Y axis
    svg.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale));

    // Add X axis label
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .attr('text-anchor', 'middle')
        .text('Income Bracket');

    // Add Y axis label
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .attr('text-anchor', 'middle')
        .text('Age Group');

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', '#2d3748')
        .text('Loan Approval Rates by Demographics');
}
