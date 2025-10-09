import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

function App() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRawData, setShowRawData] = useState(false);

  const API_URL = 'https://transactwb.temenos.com/irf-provider-container/api/v3.3.0/holdings/cryptoPortfolios/100291-3';

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPortfolioData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!portfolioData) return [];

    // Example data structure - adjust based on actual API response
    if (portfolioData.holdings) {
      return portfolioData.holdings.map(holding => ({
        name: holding.asset || holding.name || 'Unknown',
        value: parseFloat(holding.value || holding.amount || 0),
        quantity: parseFloat(holding.quantity || 0),
      }));
    }

    // Fallback: create sample visualization from any numeric data
    return Object.keys(portfolioData).map(key => ({
      name: key,
      value: typeof portfolioData[key] === 'number' ? portfolioData[key] : 0,
    })).filter(item => item.value > 0);
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];

  return (
    <div className="App">
      <header className="App-header">
        <h1>Crypto Portfolio Viewer</h1>
        <button className="get-btn" onClick={fetchPortfolioData} disabled={loading}>
          {loading ? 'Loading...' : 'GET'}
        </button>
      </header>

      <main className="portfolio-content">
        {error && (
          <div className="error-message">
            <h3>Error Loading Portfolio</h3>
            <p>{error}</p>
          </div>
        )}

        {portfolioData && (
          <>
            <div className="charts-container">
              <div className="chart-card">
                <h2>Portfolio Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h2>Asset Values</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#667eea" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="portfolio-info">
              <div className="info-header">
                <h2>Portfolio Details</h2>
                <button className="toggle-btn" onClick={() => setShowRawData(!showRawData)}>
                  {showRawData ? 'Hide' : 'Show'} Raw Data
                </button>
              </div>

              {showRawData && (
                <div className="data-display">
                  <pre>{JSON.stringify(portfolioData, null, 2)}</pre>
                </div>
              )}
            </div>
          </>
        )}

        {!portfolioData && !loading && (
          <div className="empty-state">
            <h2>No Data Loaded</h2>
            <p>Click the GET button to fetch portfolio data</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
