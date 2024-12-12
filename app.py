from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import seaborn as sns
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)
CORS(app)

def calculate_returns(prices):
    monthly_returns = prices.pct_change()
    return monthly_returns

def calculate_cumulative_returns(monthly_returns, periods):
    result = {}
    for period in periods:
        if period <= len(monthly_returns):
            cum_return = (1 + monthly_returns[-period:]).prod() - 1
            result[f"{period}M"] = cum_return
    return result

def calculate_annualized_returns(monthly_returns, periods):
    result = {}
    for period in periods:
        if period <= len(monthly_returns):
            cum_return = (1 + monthly_returns[-period:]).prod() - 1
            if period <= 12:  # Less than or equal to 1 year
                result[f"{period}M"] = cum_return
            else:  # More than 1 year
                years = period / 12
                result[f"{period}M"] = (1 + cum_return) ** (1/years) - 1
    return result

def calculate_sharpe_ratio(monthly_returns, risk_free_rate=0.03):
    annualized_return = (1 + monthly_returns.mean()) ** 12 - 1
    annualized_std = monthly_returns.std() * np.sqrt(12)
    sharpe_ratio = (annualized_return - risk_free_rate) / annualized_std
    return sharpe_ratio

@app.route('/api/fetch-data', methods=['POST'])
def fetch_data():
    data = request.json
    tickers = data.get('tickers', [])
    start_date = data.get('startDate')
    end_date = data.get('endDate')

    results = {}
    for ticker in tickers:
        stock = yf.Ticker(ticker)
        hist = stock.history(start=start_date, end=end_date, interval='1mo')
        
        if not hist.empty:
            monthly_returns = calculate_returns(hist['Close'])
            
            periods = [1, 3, 6, 12, 24, 36, 60]  # months
            cum_returns = calculate_cumulative_returns(monthly_returns, periods)
            ann_returns = calculate_annualized_returns(monthly_returns, periods)
            
            # Calculate Sharpe ratios for different periods
            sharpe_ratios = {}
            for period in [12, 24, 36, 48, 60]:  # 1Y to 5Y
                if len(monthly_returns) >= period:
                    period_returns = monthly_returns[-period:]
                    sharpe_ratios[f"{period//12}Y"] = calculate_sharpe_ratio(period_returns)

            results[ticker] = {
                'prices': hist['Close'].tolist(),
                'dates': hist.index.strftime('%Y-%m-%d').tolist(),
                'cumulative_returns': cum_returns,
                'annualized_returns': ann_returns,
                'sharpe_ratios': sharpe_ratios
            }

    return jsonify(results)

@app.route('/api/heatmap', methods=['POST'])
def generate_heatmap():
    data = request.json
    tickers = data.get('tickers', [])
    start_date = data.get('startDate')
    end_date = data.get('endDate')

    # Fetch data for all tickers
    stock_data = {}
    for ticker in tickers:
        stock = yf.Ticker(ticker)
        hist = stock.history(start=start_date, end=end_date, interval='1mo')
        if not hist.empty:
            stock_data[ticker] = hist['Close'].pct_change()

    # Create DataFrame with returns
    returns_df = pd.DataFrame(stock_data)
    
    # Calculate correlation matrix
    correlation_matrix = returns_df.corr()

    # Create heatmap
    plt.figure(figsize=(10, 8))
    sns.heatmap(correlation_matrix, 
                annot=True,  # Show correlation values
                cmap='coolwarm',  # Color scheme
                vmin=-1, vmax=1,  # Value range
                center=0,  # Center the colormap at 0
                square=True,  # Make cells square
                fmt='.2f')  # Format correlation values
    plt.title('Stock Returns Correlation Heatmap')
    
    # Save plot to bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close()
    buf.seek(0)
    
    # Encode the image to base64
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    
    return jsonify({'heatmap': img_base64})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
