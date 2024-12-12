import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import Plot from 'react-plotly.js';
import "react-datepicker/dist/react-datepicker.css";
import './App.css';

const STOCK_OPTIONS = [
  { value: 'AAPL', label: 'Apple (AAPL)' },
  { value: 'MSFT', label: 'Microsoft (MSFT)' },
  { value: 'AMZN', label: 'Amazon (AMZN)' },
  { value: 'AVGO', label: 'Broadcom (AVGO)' },
  { value: 'META', label: 'Meta (META)' },
  { value: 'NDX', label: 'NASDAQ-100 (NDX)' }
];

function App() {
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [startDate, setStartDate] = useState(new Date('2019-01-01'));
  const [endDate, setEndDate] = useState(new Date('2023-12-31'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/fetch-data', {
        tickers: selectedStocks.map(s => s.value),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      setData(response.data);

      // Fetch heatmap data
      const heatmapResponse = await axios.post('http://localhost:5000/api/heatmap', {
        tickers: selectedStocks.map(s => s.value),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      setHeatmapData(heatmapResponse.data.heatmap);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching data. Please try again.');
    }
    setLoading(false);
  };

  const renderPerformanceChart = () => {
    if (!data) return null;

    const traces = Object.entries(data).map(([ticker, stockData]) => {
      const prices = stockData.prices;
      const dates = stockData.dates;
      const basePrice = prices[0];
      const rebasedPrices = prices.map(price => (price / basePrice) * 100);

      return {
        x: dates,
        y: rebasedPrices,
        type: 'scatter',
        mode: 'lines',
        name: ticker
      };
    });

    return (
      <Plot
        data={traces}
        layout={{
          title: 'Stock Performance (Rebased to 100)',
          xaxis: { title: 'Date' },
          yaxis: { title: 'Rebased Price' }
        }}
        style={{ width: '100%', height: '500px' }}
      />
    );
  };

  const renderSharpeRatios = () => {
    if (!data) return null;

    const traces = Object.entries(data).map(([ticker, stockData]) => ({
      x: Object.keys(stockData.sharpe_ratios),
      y: Object.values(stockData.sharpe_ratios),
      type: 'bar',
      name: ticker
    }));

    return (
      <Plot
        data={traces}
        layout={{
          title: 'Sharpe Ratios',
          xaxis: { title: 'Period' },
          yaxis: { title: 'Sharpe Ratio' },
          barmode: 'group'
        }}
        style={{ width: '100%', height: '500px' }}
      />
    );
  };

  return (
    <div className="App">
      <h1>Stock Performance Analytics</h1>
      
      <div className="controls">
        <div className="select-container">
          <label>Select Stocks:</label>
          <Select
            isMulti
            options={STOCK_OPTIONS}
            value={selectedStocks}
            onChange={setSelectedStocks}
            className="stock-select"
          />
        </div>
        
        <div className="date-container">
          <div>
            <label>Start Date:</label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              className="date-picker"
            />
          </div>
          <div>
            <label>End Date:</label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              className="date-picker"
            />
          </div>
        </div>
        
        <button 
          onClick={fetchData}
          disabled={loading || selectedStocks.length === 0}
        >
          {loading ? 'Loading...' : 'Analyze'}
        </button>
      </div>

      {data && (
        <div className="results">
          {renderPerformanceChart()}
          {renderSharpeRatios()}
          
          {/* Add Heatmap */}
          {heatmapData && (
            <div className="heatmap-container">
              <h2>Returns Correlation Heatmap</h2>
              <img 
                src={`data:image/png;base64,${heatmapData}`}
                alt="Correlation Heatmap"
                style={{ maxWidth: '100%', height: 'auto', marginTop: '20px' }}
              />
            </div>
          )}
          
          <div className="metrics-table">
            <h2>Performance Metrics</h2>
            <table>
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>1M</th>
                  <th>3M</th>
                  <th>6M</th>
                  <th>1Y</th>
                  <th>3Y</th>
                  <th>5Y</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data).map(([ticker, stockData]) => (
                  <tr key={ticker}>
                    <td>{ticker}</td>
                    {['1M', '3M', '6M', '12M', '36M', '60M'].map(period => (
                      <td key={period}>
                        {(stockData.annualized_returns[period] * 100).toFixed(2)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
