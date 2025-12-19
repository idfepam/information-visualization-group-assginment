# Information Visualization - Group Assignment

Interactive visualization project for loan approval data analysis.

## Project Structure

```
.
├── data/
│   └── Loan_approval_data_2025.csv       # Dataset
├── js/
│   ├── radar-chart/                      # Radar chart visualization module
│   │   ├── config.js                     # Configuration and constants
│   │   ├── state.js                      # Shared application state
│   │   ├── utils.js                      # Utility functions
│   │   ├── chart.js                      # Chart rendering and SVG setup
│   │   ├── interactions.js               # Input handlers and drag interactions
│   │   ├── customers.js                  # Customer list, selection, virtual scroll
│   │   └── prediction.js                 # Loan approval prediction model
│   └── main.js                           # Main initialization
├── styles/
│   └── radar-chart.css                   # Styles for radar chart visualization
├── index.html                            # Main HTML file
└── README.md                             # This file
```

## Module Overview

### `js/radar-chart/config.js`
- Chart dimensions and constants
- Axis definitions
- Color palette and color generation
- Configuration constants

### `js/radar-chart/state.js`
- Shared application state
- Values, customer data, selections
- Loan parameters
- Virtual scroll state

### `js/radar-chart/utils.js`
- Data normalization functions
- Value formatting
- Constraint and rounding utilities
- Distance calculations

### `js/radar-chart/chart.js`
- SVG initialization
- Chart rendering
- Polygon updates
- Handle management

### `js/radar-chart/interactions.js`
- Input field handlers
- Drag and drop handlers for chart handles
- Real-time value updates

### `js/radar-chart/customers.js`
- Customer data loading
- Customer list rendering with virtual scrolling
- Customer selection/deselection
- Expandable customer details
- Customer tags under input fields

### `js/radar-chart/prediction.js`
- K-Nearest Neighbors prediction model
- Loan parameter handling
- Prediction display updates

### `js/main.js`
- Application initialization
- Module coordination
- DOM ready handling

## Adding New Visualizations

To add a new visualization (e.g., bar chart, scatter plot):

1. Create a new folder under `js/` (e.g., `js/bar-chart/`)
2. Follow the same modular structure:
   - `config.js` - Configuration
   - `state.js` - State management
   - `chart.js` - Rendering logic
   - `interactions.js` - User interactions
   - etc.
3. Create corresponding CSS in `styles/bar-chart.css`
4. Create a new HTML file or add to existing one
5. Import and initialize in a new `main.js` or extend existing one

## Dependencies

- D3.js v7.8.5 (loaded via CDN in HTML)

## Usage

Open `index.html` in a web browser. The application will:
1. Load customer data from CSV
2. Initialize the radar chart
3. Allow interactive exploration of loan approval data

## Features

- Interactive radar chart with draggable handles
- Customer selection and comparison
- Virtual scrolling for large datasets (50k+ customers)
- Loan approval prediction using KNN
- Real-time updates based on input changes
- Expandable customer details

