# Stock Performance Analytics

A web application for analyzing stock performance and risk metrics. This application allows users to:
- Compare multiple stocks against the NASDAQ-100 benchmark
- Calculate returns over various time periods
- Analyze risk-adjusted returns using Sharpe Ratio
- Visualize performance with interactive charts

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Flask server:
```bash
python app.py
```

The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on http://localhost:3000

## Features

- Multi-stock selection with NASDAQ-100 benchmark
- Interactive date range selection
- Performance metrics:
  - Monthly returns
  - Cumulative returns (1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y)
  - Annualized returns
  - Sharpe ratios
- Interactive visualizations:
  - Price performance chart (rebased to 100)
  - Sharpe ratio comparison

## Technology Stack

- Backend: Flask (Python)
- Frontend: React.js
- Data Analysis: pandas, numpy
- Stock Data: yfinance
- Visualization: Plotly

## API Endpoints

### POST /api/fetch-data
Fetches and analyzes stock data for the selected tickers and date range.

Request body:
```json
{
  "tickers": ["AAPL", "MSFT", "NDX"],
  "startDate": "2019-01-01",
  "endDate": "2023-12-31"
}
```
