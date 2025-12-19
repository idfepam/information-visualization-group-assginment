// D3 is loaded globally via CDN in HTML
const d3 = window.d3;
import { axes, angleSlice, radius } from './config.js';
import { state } from './state.js';
import { constrainAndRound } from './utils.js';
import { updateChart, getHandles, updateHandlesState } from './chart.js';
import { updatePrediction } from './prediction.js';

// Обновление полей ввода
export function updateInputs() {
    state.values.forEach((value, i) => {
        const input = document.getElementById(`input${i}`);
        if (input && document.activeElement !== input) {
            input.value = value;
        }
    });
}

// Инициализация полей ввода и обработчиков событий
export function initializeInputs() {
    axes.forEach((axis, i) => {
        const input = document.getElementById(`input${i}`);
        if (!input) return;
        
        // Устанавливаем начальное значение
        input.value = state.values[i];
        
        // Обновление графика при вводе (без агрессивного округления)
        input.addEventListener('input', function() {
            let value = parseFloat(this.value);
            if (isNaN(value)) return;
            
            // Применяем только ограничения min/max, но не округляем пока пользователь печатает
            value = Math.max(axis.min, Math.min(axis.max, value));
            
            // Обновляем значение и график в реальном времени
            state.values[i] = value;
            updateChart(true);
            updatePrediction();
        });
        
        // Применяем округление и финальные ограничения когда пользователь закончил ввод
        input.addEventListener('blur', function() {
            let value = parseFloat(this.value);
            if (isNaN(value)) {
                this.value = state.values[i];
                return;
            }
            
            value = constrainAndRound(value, i);
            state.values[i] = value;
            this.value = value;
            updateChart(true);
            updatePrediction();
        });
        
        // Также применяем округление при нажатии Enter
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                this.blur(); // Это вызовет обработчик blur
            }
        });
    });
}

// Инициализация drag handlers для handles
export function initializeDragHandlers() {
    const handles = getHandles();
    
    handles.call(d3.drag()
        .on('start', function() {
            state.isDragging = true;
            d3.select(this)
                .style('cursor', 'grabbing')
                .transition()
                .duration(100)
                .attr('r', 12);
        })
        .on('drag', function(event, d) {
            // Проверяем, можно ли перетаскивать (только если нет выбранных клиентов)
            if (state.selectedCustomerIds.length > 0) return;
            
            const i = axes.indexOf(d);
            const angle = angleSlice * i - Math.PI / 2;
            
            // Вычисляем проекцию на ось
            const dotProduct = event.x * Math.cos(angle) + event.y * Math.sin(angle);
            let distance = dotProduct;
            
            // Ограничиваем радиусом
            distance = Math.max(0, Math.min(radius, distance));
            
            // Преобразуем в значение
            const normalized = distance / radius;
            const value = d.min + normalized * (d.max - d.min);
            
            // Применяем ограничения и округление
            const roundedValue = constrainAndRound(value, i);
            
            state.values[i] = roundedValue;
            updateChart(false); // без анимации при перетаскивании
            updateInputs();
            updatePrediction();
        })
        .on('end', function() {
            state.isDragging = false;
            d3.select(this)
                .style('cursor', 'grab')
                .transition()
                .duration(100)
                .attr('r', 10);
        })
    );
}

