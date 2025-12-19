// D3 is loaded globally via CDN in HTML
const d3 = window.d3;
import { CHART_CONFIG, radius, axes, angleSlice, getCustomerColor } from './config.js';
import { state } from './state.js';
import { constrainAndRound } from './utils.js';

// SVG elements
let svg, g, customerPolygonsGroup, manualDataPolygon, handles, lineGenerator;

// Initialize chart SVG structure
export function initializeChart() {
    svg = d3.select('#chart')
        .append('svg')
        .attr('width', CHART_CONFIG.width)
        .attr('height', CHART_CONFIG.height);

    g = svg.append('g')
        .attr('transform', `translate(${CHART_CONFIG.width/2}, ${CHART_CONFIG.height/2})`);

    // Рисуем концентрические круги для справки
    for (let i = 1; i <= 5; i++) {
        g.append('circle')
            .attr('r', (radius / 5) * i)
            .attr('fill', 'none')
            .attr('stroke', '#f0f0f0')
            .attr('stroke-width', 1);
    }

    // Рисуем внешний шестиугольник (максимальные значения)
    const outerPoints = axes.map((axis, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        return {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        };
    });

    lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveLinearClosed);

    // Внешний шестиугольник
    g.append('path')
        .datum(outerPoints)
        .attr('d', lineGenerator)
        .attr('fill', 'rgba(240, 240, 240, 0.5)')
        .attr('stroke', '#999')
        .attr('stroke-width', 2);

    // Линии осей
    axes.forEach((axis, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        g.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', radius * Math.cos(angle))
            .attr('y2', radius * Math.sin(angle))
            .attr('stroke', '#ccc')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5');

        // Подписи осей
        const labelRadius = radius + 50;
        g.append('text')
            .attr('x', labelRadius * Math.cos(angle))
            .attr('y', labelRadius * Math.sin(angle))
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '13px')
            .style('font-weight', '700')
            .style('fill', '#444')
            .text(axis.name);
    });

    // Контейнер для полигонов клиентов
    customerPolygonsGroup = g.append('g').attr('class', 'customer-polygons');

    // Полигон для ручных данных
    manualDataPolygon = g.append('path')
        .attr('class', 'manual-data-polygon')
        .attr('fill', '#2563eb')
        .attr('fill-opacity', 0.2)
        .attr('stroke', '#2563eb')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '8,4')
        .attr('stroke-linejoin', 'round');

    // Точки для перетаскивания
    handles = g.selectAll('.handle')
        .data(axes)
        .enter()
        .append('circle')
        .attr('class', 'handle')
        .attr('r', 10)
        .attr('fill', '#2563eb')
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .style('cursor', 'grab')
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
}

// Get handles for drag interaction
export function getHandles() {
    return handles;
}

// Get line generator
export function getLineGenerator() {
    return lineGenerator;
}

// Получение данных клиента для графика
export function getCustomerValues(customer) {
    return [
        constrainAndRound(parseFloat(customer.credit_score), 0),
        constrainAndRound(parseFloat(customer.annual_income), 1),
        constrainAndRound(parseFloat(customer.current_debt), 2),
        constrainAndRound(parseFloat(customer.years_employed), 3),
        constrainAndRound(parseFloat(customer.savings_assets), 4),
        constrainAndRound(parseFloat(customer.debt_to_income_ratio) * 100, 5)
    ];
}

// Обновление графика
export function updateChart(animate = true) {
    // Обновляем полигоны для выбранных клиентов
    const polygons = customerPolygonsGroup.selectAll('.customer-polygon')
        .data(state.selectedCustomerIds.map((id, originalIndex) => {
            const customer = state.customerData.find(d => d.customer_id === id);
            return customer ? { id, customer, originalIndex } : null;
        }).filter(d => d !== null), d => d.id);

    polygons.exit().remove();

    const polygonsEnter = polygons.enter()
        .append('path')
        .attr('class', 'customer-polygon')
        .attr('fill', d => getCustomerColor(d.originalIndex))
        .attr('fill-opacity', 0.3)
        .attr('stroke', d => getCustomerColor(d.originalIndex))
        .attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round');

    const polygonsUpdate = polygonsEnter.merge(polygons);

    polygonsUpdate.each(function(d) {
        const customerValues = getCustomerValues(d.customer);
        const points = axes.map((axis, i) => {
            const value = customerValues[i];
            const normalized = (value - axis.min) / (axis.max - axis.min);
            const r = normalized * radius;
            const angle = angleSlice * i - Math.PI / 2;
            return {
                x: r * Math.cos(angle),
                y: r * Math.sin(angle)
            };
        });

        const path = d3.select(this);
        if (animate && !state.isDragging) {
            path
                .transition()
                .duration(300)
                .ease(d3.easeCubicOut)
                .attr('d', lineGenerator(points));
        } else {
            path.attr('d', lineGenerator(points));
        }
    });

    // Обновляем полигон для ручных данных
    const manualPoints = axes.map((axis, i) => {
        const value = state.values[i];
        const normalized = (value - axis.min) / (axis.max - axis.min);
        const r = normalized * radius;
        const angle = angleSlice * i - Math.PI / 2;
        return {
            x: r * Math.cos(angle),
            y: r * Math.sin(angle)
        };
    });

    if (state.showManualData) {
        if (animate && !state.isDragging) {
            manualDataPolygon
                .transition()
                .duration(300)
                .ease(d3.easeCubicOut)
                .attr('d', lineGenerator(manualPoints))
                .style('display', 'block');
        } else {
            manualDataPolygon
                .attr('d', lineGenerator(manualPoints))
                .style('display', 'block');
        }
    } else {
        manualDataPolygon.style('display', 'none');
    }

    // Обновляем точки для перетаскивания
    if (state.showManualData) {
        if (animate && !state.isDragging) {
            handles
                .transition()
                .duration(300)
                .ease(d3.easeCubicOut)
                .attr('cx', (d, i) => manualPoints[i].x)
                .attr('cy', (d, i) => manualPoints[i].y)
                .style('display', 'block');
        } else {
            handles
                .attr('cx', (d, i) => manualPoints[i].x)
                .attr('cy', (d, i) => manualPoints[i].y)
                .style('display', 'block');
        }
    } else {
        handles.style('display', 'none');
    }

    // Включаем/выключаем ручки в зависимости от режима
    updateHandlesState();
}

// Обновление состояния ручек (включить/выключить)
export function updateHandlesState() {
    const isManualMode = state.selectedCustomerIds.length === 0;
    handles
        .classed('disabled', !isManualMode)
        .style('pointer-events', isManualMode ? 'all' : 'none')
        .style('opacity', isManualMode ? 1 : 0.3);
}

