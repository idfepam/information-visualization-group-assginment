// Configuration for heatmap chart
export const margin = { top: 60, right: 40, bottom: 80, left: 100 };
export const width = 900 - margin.left - margin.right;
export const height = 500 - margin.top - margin.bottom;

// Age groups and income brackets definitions
export const ageGroups = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
export const incomeBrackets = ['<$30K', '$30-50K', '$50-75K', '$75-100K', '$100K+'];

// Helper function to assign age group
export function getAgeGroup(age) {
    if (age < 26) return '18-25';
    if (age < 36) return '26-35';
    if (age < 46) return '36-45';
    if (age < 56) return '46-55';
    if (age < 66) return '56-65';
    return '65+';
}

// Helper function to assign income bracket
export function getIncomeBracket(income) {
    if (income < 30000) return '<$30K';
    if (income < 50000) return '$30-50K';
    if (income < 75000) return '$50-75K';
    if (income < 100000) return '$75-100K';
    return '$100K+';
}
