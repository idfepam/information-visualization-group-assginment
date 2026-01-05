// Configuration and constants for radar chart
export const CHART_CONFIG = {
    width: 600,
    height: 600,
    margin: 100
};

export const radius = Math.min(CHART_CONFIG.width, CHART_CONFIG.height) / 2 - CHART_CONFIG.margin;

// Axis definitions (6 dimensions)
export const axes = [
    { name: 'Credit Score', min: 300, max: 850 },
    { name: 'Annual Income', min: 25000, max: 175000 },
    { name: 'Current Debt', min: 0, max: 100000 },
    { name: 'Years Employed', min: 0, max: 20 },
    { name: 'Savings Assets', min: 0, max: 150000 },
    { name: 'DTI Ratio', min: 0, max: 100 }
];

export const angleSlice = (Math.PI * 2) / axes.length;

// Colors for customers
export const customerColors = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
export const MAX_RECOMMENDED_CUSTOMERS = 10;

// Generate color for customer by index
export function getCustomerColor(index) {
    // Use predefined colors for first 8
    if (index < customerColors.length) {
        return customerColors[index];
    }
    
    // For additional customers generate colors using HSL
    // Use golden ratio for even distribution of hues
    const goldenRatio = 0.618033988749895;
    const hue = ((index * goldenRatio * 360) % 360);
    
    // Use different saturation and lightness levels for better distinction
    const saturation = 60 + (index % 3) * 10; // 60-80%
    const lightness = 45 + (Math.floor(index / 3) % 3) * 5; // 45-55%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

