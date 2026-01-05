// D3 is loaded globally via CDN in HTML
const d3 = window.d3;
import { axes, angleSlice, radius } from './config.js';
import { state, saveState } from './state.js';
import { constrainAndRound } from './utils.js';
import { updateChart, getHandles, updateHandlesState } from './chart.js';
import { updatePrediction } from './prediction.js';

// Update input fields
export function updateInputs() {
    state.values.forEach((value, i) => {
        const input = document.getElementById(`input${i}`);
        if (input && document.activeElement !== input) {
            input.value = value;
        }
    });
}

// Initialize input fields and event handlers
export function initializeInputs() {
    axes.forEach((axis, i) => {
        const input = document.getElementById(`input${i}`);
        if (!input) return;
        
        // Set initial value
        input.value = state.values[i];
        
        // Update chart on input (without aggressive rounding)
        input.addEventListener('input', function() {
            let value = parseFloat(this.value);
            if (isNaN(value)) return;
            
            // Apply only min/max constraints, don't round while user is typing
            value = Math.max(axis.min, Math.min(axis.max, value));
            
            // Update value and chart in real-time
            state.values[i] = value;
            saveState();
            updateChart(true);
            updatePrediction();
        });
        
        // Apply rounding and final constraints when user finishes input
        input.addEventListener('blur', function() {
            let value = parseFloat(this.value);
            if (isNaN(value)) {
                this.value = state.values[i];
                return;
            }
            
            value = constrainAndRound(value, i);
            state.values[i] = value;
            this.value = value;
            saveState();
            updateChart(true);
            updatePrediction();
        });
        
        // Also apply rounding on Enter key
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                this.blur(); // This will trigger the blur handler
            }
        });
    });
}

// Initialize drag handlers for handles
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
            // Check if dragging is allowed (only if no customers are selected)
            if (state.selectedCustomerIds.length > 0) return;
            
            const i = axes.indexOf(d);
            const angle = angleSlice * i - Math.PI / 2;
            
            // Calculate projection onto axis
            const dotProduct = event.x * Math.cos(angle) + event.y * Math.sin(angle);
            let distance = dotProduct;
            
            // Constrain by radius
            distance = Math.max(0, Math.min(radius, distance));
            
            // Convert to value
            const normalized = distance / radius;
            const value = d.min + normalized * (d.max - d.min);
            
            // Apply constraints and rounding
            const roundedValue = constrainAndRound(value, i);
            
            state.values[i] = roundedValue;
            saveState();
            updateChart(false); // No animation while dragging
            updateInputs();
            updatePrediction();
        })
        .on('end', function() {
            state.isDragging = false;
            saveState();
            d3.select(this)
                .style('cursor', 'grab')
                .transition()
                .duration(100)
                .attr('r', 10);
        })
    );
}

