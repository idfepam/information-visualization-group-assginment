# Information Visualization - Group Assignment

Interactive visualization project for loan approval data analysis with multiple visualization types.

## Project Structure

```
.
├── data/
│   └── Loan_approval_data_2025.csv       # Dataset (50k+ loan records)
├── js/
│   ├── shared/                           # Shared utilities
│   │   ├── navigation.js                 # Navigation bar logic
│   │   └── data-loader.js                # Shared CSV data loader with caching
│   ├── radar-chart/                      # Radar chart visualization
│   │   ├── config.js                     # Configuration and constants
│   │   ├── state.js                      # State management with localStorage persistence
│   │   ├── utils.js                      # Utility functions
│   │   ├── chart.js                      # Chart rendering and SVG setup
│   │   ├── interactions.js               # Input handlers and drag interactions
│   │   ├── customers.js                  # Customer list, selection, virtual scroll
│   │   └── prediction.js                 # Loan approval prediction model (KNN)
│   ├── bar-chart/                        # Bar chart visualization
│   │   ├── config.js                     # Configuration
│   │   ├── state.js                      # State management with localStorage persistence
│   │   ├── chart.js                      # Bar chart rendering
│   │   ├── filters.js                    # Filter logic
│   │   └── main.js                       # Main initialization
│   ├── scatter-plot/                      # Scatter plot visualization
│   │   ├── config.js                     # Configuration
│   │   ├── state.js                      # State management with localStorage persistence
│   │   ├── scatter-plot.js               # Scatter plot rendering (optimized)
│   │   └── main.js                       # Main initialization
│   ├── heatmap/                          # Heatmap visualization
│   │   ├── config.js                     # Configuration
│   │   ├── state.js                      # State management with localStorage persistence
│   │   ├── data-processor.js             # Data aggregation for heatmap
│   │   ├── chart.js                      # Heatmap rendering
│   │   └── main.js                       # Main initialization
│   └── main.js                           # Radar chart initialization
├── styles/
│   ├── shared.css                        # Shared styles (navigation, layout)
│   ├── radar-chart.css                   # Radar chart styles
│   ├── bar-chart.css                     # Bar chart styles
│   ├── scatter-plot.css                  # Scatter plot styles
│   └── heatmap.css                       # Heatmap styles
├── index.html                            # Radar chart page
├── bar-chart.html                        # Bar chart page
├── scatter-plot.html                     # Scatter plot page
├── sunburst.html                         # Heatmap page
└── README.md                             # This file
```

## Visualizations

### 1. Radar Chart (`index.html`)
**Purpose**: Individual customer analysis and loan approval prediction

**Features**:
- Interactive radar chart with 6 financial metrics (Credit Score, Annual Income, Current Debt, Years Employed, Savings Assets, DTI Ratio)
- Draggable handles for real-time value adjustment
- Manual data input with validation
- Customer selection from database (50k+ customers)
- Multiple customer comparison with color-coded polygons
- Virtual scrolling for efficient customer list rendering
- Expandable customer details with loan information
- Loan approval prediction using K-Nearest Neighbors (KNN) algorithm
- Loan parameter selection (Product Type, Loan Intent, Loan Amount)
- "Show My Data" toggle to show/hide manual input polygon
- Customer value tags displayed under input fields
- State persistence across page navigation

**Modules**:
- `config.js`: Chart dimensions, axes definitions, colors
- `state.js`: State management with localStorage persistence
- `chart.js`: SVG setup and rendering
- `interactions.js`: Input and drag handlers
- `customers.js`: Customer list with virtual scrolling
- `prediction.js`: KNN prediction model

### 2. Bar Chart (`bar-chart.html`)
**Purpose**: Aggregate analysis of loan approval rates and distributions

**Features**:
- Multiple chart support (up to 4 charts simultaneously)
- Chart types: Approval Rate Analysis, Distribution Comparison, Metric Comparison
- Grouping options: Product Type, Loan Intent, Occupation Status
- Filters: Product Type, Loan Intent, Occupation Status
- Independent chart configurations
- Chart uniqueness validation (prevents duplicate charts)
- Dynamic grid layout (1x1, 2x1, 2x2)
- State persistence across page navigation

**Modules**:
- `config.js`: Chart dimensions, metrics, colors
- `state.js`: State management with localStorage persistence
- `chart.js`: Bar chart rendering with multiple chart types
- `filters.js`: Filter and grouping logic
- `main.js`: Initialization and chart management

### 3. Scatter Plot (`scatter-plot.html`)
**Purpose**: Relationship analysis between numerical variables

**Features**:
- Multiple chart support (up to 4 charts simultaneously)
- X and Y axis selection (Credit Score, Annual Income, Loan Amount, Interest Rate, DTI Ratio)
- Axis uniqueness validation (X and Y cannot be the same)
- Filters: Product Type, Loan Intent, Occupation Status
- Performance optimization: Data sampling (max 10,000 points)
- Interactive tooltips on hover
- Color-coded by approval status
- Chart uniqueness validation
- Dynamic grid layout
- State persistence across page navigation

**Modules**:
- `config.js`: Chart dimensions, axis options, colors
- `state.js`: State management with localStorage persistence
- `scatter-plot.js`: Optimized scatter plot rendering
- `main.js`: Initialization and chart management

### 4. Heatmap (`sunburst.html`)
**Purpose**: Demographic cross-tabulation analysis

**Features**:
- Age group vs Income bracket heatmap
- Approval rates visualization
- Average loan amounts
- Filters: Product Type, Loan Intent, Occupation Status
- Color intensity encoding
- Interactive tooltips
- Statistics panel
- State persistence across page navigation

**Modules**:
- `config.js`: Chart dimensions, age/income brackets
- `state.js`: State management with localStorage persistence
- `data-processor.js`: Data aggregation for heatmap
- `chart.js`: Heatmap rendering
- `main.js`: Initialization

## Shared Features

### Navigation System
- Consistent navigation bar across all pages
- Active page highlighting
- Smooth page transitions

### Data Loading
- **Shared data loader** (`js/shared/data-loader.js`):
  - Loads CSV once and caches it
  - All pages share the same cached data
  - Eliminates duplicate network requests
  - Faster page navigation

### State Persistence
- All visualizations save their state to localStorage
- Charts, filters, selections, and configurations are preserved
- State is restored when returning to a page
- Excludes large datasets (rawData) from storage

### Performance Optimizations
- **Virtual scrolling**: Efficient rendering of large customer lists (50k+ items)
- **Data sampling**: Scatter plots sample data when >10,000 points
- **Shared data caching**: Data loaded once, used by all pages
- **Optimized rendering**: Only affected charts re-render on changes

## Dependencies

- **D3.js v7.8.5**: Loaded via CDN in HTML files
- Modern browser with ES6 module support

## Usage

1. Open any HTML file in a web browser:
   - `index.html` - Radar Chart
   - `bar-chart.html` - Bar Charts
   - `scatter-plot.html` - Scatter Plots
   - `sunburst.html` - Heatmap

2. The application will:
   - Load data from `data/Loan_approval_data_2025.csv` (first time only, then cached)
   - Initialize the visualization
   - Restore previous state from localStorage (if available)

3. Navigate between pages using the top navigation bar

## Key Features

### Radar Chart
- Interactive financial profile visualization
- Real-time loan approval prediction
- Customer comparison and selection
- Manual data input with validation

### Bar Charts
- Multiple simultaneous charts
- Flexible grouping and filtering
- Approval rate analysis
- Distribution comparisons

### Scatter Plots
- Relationship visualization
- Multiple axis combinations
- Performance-optimized rendering
- Interactive exploration

### Heatmap
- Demographic analysis
- Cross-tabulation visualization
- Approval rate patterns
- Statistical summaries

## Technical Details

### State Management
- Each visualization has its own state module
- State is saved to localStorage on changes
- State is loaded on page initialization
- Large datasets are excluded from persistence

### Performance
- Virtual scrolling for large lists
- Data sampling for scatter plots
- Shared data caching
- Optimized re-rendering (only affected charts)

### Modular Architecture
- Each visualization is self-contained
- Shared utilities in `js/shared/`
- Consistent structure across visualizations
- Easy to add new visualizations

## Adding New Visualizations

To add a new visualization:

1. Create a new folder under `js/` (e.g., `js/new-viz/`)
2. Follow the modular structure:
   - `config.js` - Configuration and constants
   - `state.js` - State management with `saveState()` and `loadState()`
   - `chart.js` - Rendering logic
   - `main.js` - Initialization
3. Create CSS in `styles/new-viz.css`
4. Create HTML file (e.g., `new-viz.html`)
5. Add navigation link in all HTML files
6. Use `loadLoanData()` from `js/shared/data-loader.js` for data loading

## Data Format

The CSV file should contain the following columns:
- `customer_id`: Unique customer identifier
- `credit_score`: Credit score (300-850)
- `annual_income`: Annual income in dollars
- `current_debt`: Current debt in dollars
- `years_employed`: Years of employment
- `savings_assets`: Savings/assets in dollars
- `debt_to_income_ratio`: Debt-to-income ratio (0-1)
- `loan_status`: Loan approval status (0=rejected, 1=approved)
- `product_type`: Type of loan product
- `loan_intent`: Purpose of loan
- `occupation_status`: Employment status
- `loan_amount`: Requested loan amount
- `interest_rate`: Interest rate

## License

This project is part of a university assignment for Information Visualization course.
