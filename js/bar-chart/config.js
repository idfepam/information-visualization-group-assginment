// Configuration for bar chart
export const margin = { top: 40, right: 40, bottom: 60, left: 80 };
export const chartWidth = 1000;
export const chartHeight = 600;

export const statusNames = {
    0: "Rejected",
    1: "Approved",
};

export const colors = {
    approved: "#16a34a",
    rejected: "#dc2626",
    neutral: "#6b7280",
    credit_score: "#2563eb",
    annual_income: "#16a34a",
    dti_ratio: "#f59e0b",
    interest_rate: "#8b5cf6",
};

// Chart types
export const chartTypes = {
    APPROVAL_RATE: 'approval_rate',
    DISTRIBUTION: 'distribution',
    COMPARISON: 'comparison',
};
