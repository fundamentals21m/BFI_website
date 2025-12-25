/**
 * Bitcoin for Institutions - Portfolio Allocation Calculator
 * Interactive tool for modeling Bitcoin allocation impact on portfolios
 */

// Portfolio Calculator State
const portfolioCalc = {
  portfolioSize: 1000000,
  stockAllocation: 60,
  bondAllocation: 40,
  btcAllocation: 0,
  timeHorizon: 10,
  startYear: 2014,

  // Validation constants
  minPortfolioSize: 10000,
  maxPortfolioSize: 1000000000,
  minAllocation: 0,
  maxAllocation: 100,

  // Historical annual returns (approximate)
  historicalReturns: {
    stocks: { // S&P 500
      2014: 13.7, 2015: 1.4, 2016: 12.0, 2017: 21.8, 2018: -4.4,
      2019: 31.5, 2020: 18.4, 2021: 28.7, 2022: -18.1, 2023: 26.3, 2024: 25.0
    },
    bonds: { // AGG
      2014: 6.0, 2015: 0.5, 2016: 2.6, 2017: 3.5, 2018: 0.0,
      2019: 8.7, 2020: 7.5, 2021: -1.5, 2022: -13.0, 2023: 5.5, 2024: 1.2
    },
    bitcoin: {
      2014: -58, 2015: 35, 2016: 125, 2017: 1318, 2018: -73,
      2019: 95, 2020: 301, 2021: 60, 2022: -65, 2023: 155, 2024: 120
    }
  }
};

// Utility function
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Validation functions
function validatePortfolioSize(value) {
  const size = parseFloat(value);
  if (isNaN(size)) return false;
  return size >= portfolioCalc.minPortfolioSize && size <= portfolioCalc.maxPortfolioSize;
}

function validateAllocation(stock, bond, btc) {
  const total = stock + bond + btc;
  const tolerance = 0.1;
  return Math.abs(total - 100) <= tolerance &&
         stock >= portfolioCalc.minAllocation && stock <= portfolioCalc.maxAllocation &&
         bond >= portfolioCalc.minAllocation && bond <= portfolioCalc.maxAllocation &&
         btc >= portfolioCalc.minAllocation && btc <= portfolioCalc.maxAllocation;
}

function sanitizeInput(value, min = -Infinity, max = Infinity) {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return Math.max(min, Math.min(max, num));
}

// Initialize calculator
function initPortfolioCalculator() {
  // Set up event listeners
  const inputs = ['portfolioSize', 'stockAllocation', 'bondAllocation', 'btcAllocation', 'timeHorizon', 'startYear'];

  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', handleInputChange);
      el.addEventListener('change', handleInputChange);
    }
  });

  // Initialize sliders display
  updateSliderDisplays();

  // Run initial calculation
  calculatePortfolio();
}

function handleInputChange(e) {
  try {
    const id = e.target.id;
    let value = sanitizeInput(e.target.value);

    // Validate portfolio size
    if (id === 'portfolioSize') {
      if (!validatePortfolioSize(value)) {
        // Clamp to valid range
        value = Math.max(portfolioCalc.minPortfolioSize, Math.min(portfolioCalc.maxPortfolioSize, value));
        const el = document.getElementById(id);
        if (el) el.value = value;
      }
      portfolioCalc[id] = value;
    }
    // Handle allocation constraints
    else if (id === 'btcAllocation') {
      value = clamp(value, 0, 50);
      portfolioCalc.btcAllocation = value;
      // Proportionally reduce stocks and bonds
      const remaining = 100 - value;
      const ratio = portfolioCalc.stockAllocation / (portfolioCalc.stockAllocation + portfolioCalc.bondAllocation) || 0.6;
      portfolioCalc.stockAllocation = Math.round(remaining * ratio);
      portfolioCalc.bondAllocation = remaining - portfolioCalc.stockAllocation;

      const stockEl = document.getElementById('stockAllocation');
      const bondEl = document.getElementById('bondAllocation');
      if (stockEl) stockEl.value = portfolioCalc.stockAllocation;
      if (bondEl) bondEl.value = portfolioCalc.bondAllocation;
    } else if (id === 'stockAllocation' || id === 'bondAllocation') {
      value = clamp(value, 0, 100);
      portfolioCalc[id] = value;
      // Adjust BTC to make total 100%
      const stockBond = portfolioCalc.stockAllocation + portfolioCalc.bondAllocation;
      if (stockBond > 100) {
        if (id === 'stockAllocation') {
          portfolioCalc.bondAllocation = 100 - value - portfolioCalc.btcAllocation;
          const bondEl = document.getElementById('bondAllocation');
          if (bondEl) bondEl.value = Math.max(0, portfolioCalc.bondAllocation);
        } else {
          portfolioCalc.stockAllocation = 100 - value - portfolioCalc.btcAllocation;
          const stockEl = document.getElementById('stockAllocation');
          if (stockEl) stockEl.value = Math.max(0, portfolioCalc.stockAllocation);
        }
      }
      portfolioCalc.btcAllocation = clamp(100 - portfolioCalc.stockAllocation - portfolioCalc.bondAllocation, 0, 100);
      const btcEl = document.getElementById('btcAllocation');
      if (btcEl) btcEl.value = portfolioCalc.btcAllocation;
    } else {
      portfolioCalc[id] = value;
    }

    updateSliderDisplays();
    calculatePortfolio();
  } catch (err) {
    console.error('Error handling input change:', err);
  }
}

function updateSliderDisplays() {
  try {
    // Update displayed values next to sliders
    const displays = {
      'stockAllocationValue': portfolioCalc.stockAllocation + '%',
      'bondAllocationValue': portfolioCalc.bondAllocation + '%',
      'btcAllocationValue': portfolioCalc.btcAllocation + '%',
      'timeHorizonValue': portfolioCalc.timeHorizon + ' years'
    };

    Object.entries(displays).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });

    // Update ARIA values for sliders
    const sliders = {
      'stockAllocation': portfolioCalc.stockAllocation,
      'bondAllocation': portfolioCalc.bondAllocation,
      'btcAllocation': portfolioCalc.btcAllocation,
      'timeHorizon': portfolioCalc.timeHorizon
    };

    Object.entries(sliders).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('aria-valuenow', value);
    });
  } catch (err) {
    console.error('Error updating slider displays:', err);
  }
}

function calculatePortfolio() {
  const { portfolioSize, stockAllocation, bondAllocation, btcAllocation, timeHorizon, startYear } = portfolioCalc;

  // Calculate both portfolios (with and without BTC)
  const traditionalResults = simulatePortfolio(portfolioSize, 60, 40, 0, timeHorizon, startYear);
  const btcResults = simulatePortfolio(portfolioSize, stockAllocation, bondAllocation, btcAllocation, timeHorizon, startYear);

  // Update metrics
  updateMetrics(traditionalResults, btcResults);

  // Update chart
  updateChart(traditionalResults, btcResults);
}

function simulatePortfolio(initialValue, stockPct, bondPct, btcPct, years, startYear) {
  const results = {
    years: [],
    values: [],
    returns: [],
    finalValue: initialValue,
    totalReturn: 0,
    cagr: 0,
    volatility: 0,
    maxDrawdown: 0,
    sharpe: 0
  };

  let value = initialValue;
  let peak = initialValue;

  for (let i = 0; i < years; i++) {
    const year = startYear + i;

    // Get returns for this year (use last available if beyond data)
    const stockReturn = portfolioCalc.historicalReturns.stocks[year] ?? portfolioCalc.historicalReturns.stocks[2024];
    const bondReturn = portfolioCalc.historicalReturns.bonds[year] ?? portfolioCalc.historicalReturns.bonds[2024];
    const btcReturn = portfolioCalc.historicalReturns.bitcoin[year] ?? portfolioCalc.historicalReturns.bitcoin[2024];

    // Calculate weighted return
    const portfolioReturn = (stockPct / 100 * stockReturn) +
                           (bondPct / 100 * bondReturn) +
                           (btcPct / 100 * btcReturn);

    results.returns.push(portfolioReturn);
    value = value * (1 + portfolioReturn / 100);
    results.years.push(year);
    results.values.push(value);

    // Track max drawdown
    if (value > peak) peak = value;
    const drawdown = (peak - value) / peak * 100;
    if (drawdown > results.maxDrawdown) results.maxDrawdown = drawdown;
  }

  results.finalValue = value;
  results.totalReturn = ((value - initialValue) / initialValue) * 100;
  if (years > 0 && initialValue > 0) {
    results.cagr = (Math.pow(value / initialValue, 1 / years) - 1) * 100;
  } else {
    results.cagr = 0;
  }
  results.volatility = calculateStdDev(results.returns);
  results.sharpe = results.volatility > 0 ? (results.cagr - 2) / results.volatility : 0; // Assume 2% risk-free

  return results;
}

function calculateStdDev(arr) {
  if (!arr || arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const squaredDiffs = arr.map(x => Math.pow(x - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / arr.length);
}

function updateMetrics(traditional, withBtc) {
  // Traditional portfolio metrics
  setMetric('traditionalFinal', formatCurrency(traditional.finalValue));
  setMetric('traditionalCAGR', traditional.cagr.toFixed(1) + '%');
  setMetric('traditionalVol', traditional.volatility.toFixed(1) + '%');
  setMetric('traditionalSharpe', traditional.sharpe.toFixed(2));
  setMetric('traditionalDrawdown', traditional.maxDrawdown.toFixed(1) + '%');

  // BTC portfolio metrics
  setMetric('btcFinal', formatCurrency(withBtc.finalValue));
  setMetric('btcCAGR', withBtc.cagr.toFixed(1) + '%');
  setMetric('btcVol', withBtc.volatility.toFixed(1) + '%');
  setMetric('btcSharpe', withBtc.sharpe.toFixed(2));
  setMetric('btcDrawdown', withBtc.maxDrawdown.toFixed(1) + '%');

  // Comparison
  const valueDiff = withBtc.finalValue - traditional.finalValue;
  const cagrDiff = withBtc.cagr - traditional.cagr;

  setMetric('valueDiff', (valueDiff >= 0 ? '+' : '') + formatCurrency(valueDiff), valueDiff >= 0);
  setMetric('cagrDiff', (cagrDiff >= 0 ? '+' : '') + cagrDiff.toFixed(1) + '%', cagrDiff >= 0);
}

function setMetric(id, value, isPositive = null) {
  try {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
      if (isPositive !== null) {
        el.classList.remove('positive', 'negative');
        el.classList.add(isPositive ? 'positive' : 'negative');
      }
    }
  } catch (e) {
    console.error('Error setting metric:', id, e);
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function updateChart(traditional, withBtc) {
  try {
    const ctx = document.getElementById('portfolioChart');
    const errorDiv = document.getElementById('chartError');

    if (!ctx) {
      console.error('Chart canvas not found');
      if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = '';
        const title = document.createElement('div');
        title.className = 'callout-title';
        title.textContent = 'Chart Container Error';
        const msg = document.createElement('p');
        msg.textContent = 'Unable to find chart element on the page.';
        errorDiv.appendChild(title);
        errorDiv.appendChild(msg);
      }
      return;
    }

    // Destroy existing chart if it exists
    if (window.portfolioChartInstance) {
      window.portfolioChartInstance.destroy();
    }

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded');
      if (errorDiv) {
        errorDiv.style.display = 'block';
      }
      ctx.style.display = 'none';
      return;
    }

    // Hide error message and show chart
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
    ctx.style.display = 'block';

    window.portfolioChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: traditional.years,
      datasets: [
        {
          label: '60/40 Portfolio',
          data: traditional.values,
          borderColor: '#8B949E',
          backgroundColor: 'rgba(139, 148, 158, 0.1)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'With Bitcoin',
          data: withBtc.values,
          borderColor: '#F7931A',
          backgroundColor: 'rgba(247, 147, 26, 0.1)',
          tension: 0.1,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#E6EDF3'
          }
        },
        tooltip: {
          backgroundColor: '#1C2128',
          titleColor: '#E6EDF3',
          bodyColor: '#8B949E',
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.raw);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#21262D' },
          ticks: { color: '#8B949E' }
        },
        y: {
          grid: { color: '#21262D' },
          ticks: {
            color: '#8B949E',
            callback: function(value) {
              return '$' + (value / 1000000).toFixed(1) + 'M';
            }
          }
        }
      }
    }
  });
  } catch (err) {
    console.error('Error creating chart:', err);
    const errorDiv = document.getElementById('chartError');
    const ctx = document.getElementById('portfolioChart');

    if (errorDiv) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = '';
      const title = document.createElement('div');
      title.className = 'callout-title';
      title.textContent = 'Chart Error';
      const msg = document.createElement('p');
      msg.textContent = 'An error occurred while creating the chart: ' + (err.message || 'Unknown error');
      errorDiv.appendChild(title);
      errorDiv.appendChild(msg);
    }
    if (ctx) {
      ctx.style.display = 'none';
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initPortfolioCalculator);
