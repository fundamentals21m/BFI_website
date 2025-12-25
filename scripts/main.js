/**
 * Bitcoin for Institutions - Main JavaScript Utilities
 */

// ===== Constants =====
const STORAGE_PREFIX = 'bfi_';

// ===== DOM Utilities =====
function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function createElement(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content) el.innerHTML = content;
  return el;
}

// ===== Animation Utilities =====
function animate(element, keyframes, options = {}) {
  const defaultOptions = {
    duration: 300,
    easing: 'ease-out',
    fill: 'forwards'
  };
  return element.animate(keyframes, { ...defaultOptions, ...options });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fadeIn(element, duration = 300) {
  element.style.display = '';
  return animate(element, [
    { opacity: 0 },
    { opacity: 1 }
  ], { duration });
}

function fadeOut(element, duration = 300) {
  return animate(element, [
    { opacity: 1 },
    { opacity: 0 }
  ], { duration }).finished.then(() => {
    element.style.display = 'none';
  });
}

// ===== Number Formatting =====
function formatNumber(num, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

function formatCurrency(num, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

function formatPercent(num, decimals = 1) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num / 100);
}

function formatBTC(num, decimals = 4) {
  return formatNumber(num, decimals) + ' BTC';
}

// ===== Math Utilities =====
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Financial calculations
function calculateCAGR(startValue, endValue, years) {
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

function calculateSharpeRatio(returns, riskFreeRate = 0) {
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  return stdDev === 0 ? 0 : (avgReturn - riskFreeRate) / stdDev;
}

function calculateMaxDrawdown(values) {
  let maxDrawdown = 0;
  let peak = values[0];

  for (const value of values) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = (peak - value) / peak * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

function calculateVolatility(returns) {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
  return Math.sqrt(variance);
}

// ===== Local Storage =====
function saveToStorage(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Error saving to localStorage:', e);
    return false;
  }
}

function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Error loading from localStorage:', e);
    return defaultValue;
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
    return true;
  } catch (e) {
    console.error('Error removing from localStorage:', e);
    return false;
  }
}

// ===== Reading Progress =====
const readingProgress = {
  chapters: loadFromStorage('reading_progress', {}),

  markRead(chapterId) {
    this.chapters[chapterId] = {
      completed: true,
      timestamp: Date.now()
    };
    saveToStorage('reading_progress', this.chapters);
    this.updateUI();
  },

  isRead(chapterId) {
    return this.chapters[chapterId]?.completed || false;
  },

  getProgress() {
    const totalChapters = 13; // Total chapters in the book
    const readCount = Object.values(this.chapters).filter(c => c.completed).length;
    return (readCount / totalChapters) * 100;
  },

  updateUI() {
    // Update any progress bars on the page
    const progressBars = $$('.reading-progress-fill');
    const progress = this.getProgress();
    progressBars.forEach(bar => {
      bar.style.width = progress + '%';
    });

    // Update chapter status indicators
    $$('.toc-chapter').forEach(el => {
      const chapterId = el.dataset.chapter;
      if (chapterId && this.isRead(chapterId)) {
        const status = el.querySelector('.toc-chapter-status');
        if (status) {
          status.textContent = 'Completed';
          status.classList.add('completed');
        }
      }
    });
  }
};

// ===== Content Toggle =====
function initContentToggle() {
  const toggleBtns = $$('.content-toggle-btn');
  if (!toggleBtns.length) return;

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;

      // Update button states
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update content visibility
      $$('.content-full, .content-summary, .content-tools').forEach(el => {
        el.classList.remove('active');
      });

      const content = $('.content-' + view);
      if (content) {
        content.classList.add('active');
      }

      // Save preference
      saveToStorage('content_view', view);
    });
  });

  // Restore saved preference
  const savedView = loadFromStorage('content_view', 'full');
  const savedBtn = $(`.content-toggle-btn[data-view="${savedView}"]`);
  if (savedBtn) {
    savedBtn.click();
  }
}

// ===== Navigation =====
function initNavigation() {
  // Mobile nav toggle
  const navToggle = $('.nav-toggle');
  const navLinks = $('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Set active nav link based on current page
  const currentPath = window.location.pathname;
  $$('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPath ||
        currentPath.includes(link.getAttribute('href'))) {
      link.classList.add('active');
    }
  });

  // Add scrolled class to nav on scroll
  const nav = $('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }
}

// ===== Scroll Animations =====
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Add staggered delay for grid children
        if (entry.target.classList.contains('card-grid') || 
            entry.target.classList.contains('stats')) {
          const children = entry.target.children;
          Array.from(children).forEach((child, index) => {
            child.style.transitionDelay = `${index * 100}ms`;
            child.classList.add('visible');
          });
        }
      }
    });
  }, observerOptions);

  // Observe elements
  $$('.card, .callout, .stat, .section-title, .section-subtitle').forEach(el => {
    el.classList.add('animate-on-scroll');
    observer.observe(el);
  });

  // Observe grid containers for staggered animations
  $$('.card-grid, .stats').forEach(el => {
    observer.observe(el);
  });
}

// ===== Smooth Scroll =====
function scrollToElement(selector, offset = 80) {
  const element = $(selector);
  if (element) {
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top,
      behavior: 'smooth'
    });
  }
}

// ===== Data Loading =====
async function loadJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error loading JSON:', error);
    return null;
  }
}

// ===== Chart Helpers =====
const chartColors = {
  bitcoin: '#F7931A',
  bitcoinLight: '#FFB84D',
  green: '#3FB950',
  red: '#F85149',
  blue: '#58A6FF',
  purple: '#A371F7',
  gray: '#8B949E',
  gridLines: '#21262D'
};

const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#E6EDF3',
        font: {
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      }
    },
    tooltip: {
      backgroundColor: '#1C2128',
      titleColor: '#E6EDF3',
      bodyColor: '#8B949E',
      borderColor: '#21262D',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      grid: {
        color: '#21262D'
      },
      ticks: {
        color: '#8B949E'
      }
    },
    y: {
      grid: {
        color: '#21262D'
      },
      ticks: {
        color: '#8B949E'
      }
    }
  }
};

// ===== Bitcoin Data (sample for demos) =====
const sampleBitcoinData = {
  // Major drawdowns with approximate dates
  drawdowns: [
    { start: '2011-06-08', peak: 31.91, trough: 2.05, end: '2013-02-28', recovery: 626 },
    { start: '2013-11-30', peak: 1163, trough: 152, end: '2017-01-04', recovery: 1131 },
    { start: '2017-12-17', peak: 19783, trough: 3122, end: '2020-11-30', recovery: 1078 },
    { start: '2021-11-10', peak: 68789, trough: 15476, end: '2024-03-05', recovery: 845 }
  ],

  // Approximate yearly returns
  yearlyReturns: {
    2011: 1473,
    2012: 186,
    2013: 5507,
    2014: -58,
    2015: 35,
    2016: 125,
    2017: 1318,
    2018: -73,
    2019: 95,
    2020: 301,
    2021: 60,
    2022: -65,
    2023: 155,
    2024: 120
  }
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initContentToggle();
  initScrollAnimations();
  readingProgress.updateUI();
});

// ===== Exports for modules =====
window.BFI = {
  $,
  $$,
  createElement,
  animate,
  delay,
  fadeIn,
  fadeOut,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatBTC,
  clamp,
  lerp,
  randomInt,
  calculateCAGR,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateVolatility,
  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  readingProgress,
  scrollToElement,
  loadJSON,
  chartColors,
  defaultChartOptions,
  sampleBitcoinData
};
