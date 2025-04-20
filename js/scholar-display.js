// js/scholar-display.js

// DOM elements to update
const scholarNameEl = document.querySelector('.scholar-name');
const scholarInstitutionEl = document.querySelector('.scholar-institution');
const citationCountEl = document.querySelector('.citation-count');
const hIndexEl = document.querySelector('.h-index');
const i10IndexEl = document.querySelector('.i10-index');
const lastUpdatedEl = document.querySelector('.last-updated');
const chartCanvas = document.getElementById('citationChart');

// Chart instance
let citationChart;

// Load citation data
async function loadCitationData() {
  try {
    const response = await fetch('js/data/citations.json');
    if (!response.ok) {
      throw new Error('Failed to load citation data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading citation data:', error);
    displayError('Failed to load citation data. Please try again later.');
    return null;
  }
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Update the metrics display
function updateMetrics(data) {
  // Update profile information
  scholarNameEl.textContent = data.metadata.name || 'Academic Profile';
  scholarInstitutionEl.textContent = data.metadata.institution || '';
  
  // Update citation metrics
  citationCountEl.textContent = data.metrics.totalCitations.toLocaleString();
  hIndexEl.textContent = data.metrics.h_index;
  i10IndexEl.textContent = data.metrics.i10_index;
  
  // Update last updated timestamp
  lastUpdatedEl.textContent = `Last updated: ${formatDate(data.metadata.fetchedAt)}`;
}

// Create the citation histogram
function createCitationHistogram(data) {
  // Convert citation data to chart format
  const years = Object.keys(data.citationsByYear).sort();
  const citations = years.map(year => data.citationsByYear[year]);

  // Prepare background colors with a gradient
  const backgroundColors = years.map((_, index) => {
    const opacity = 0.5 + (index / years.length) * 0.5;
    return `rgba(52, 152, 219, ${opacity})`;
  });

  // Create the chart
  if (citationChart) {
    citationChart.destroy(); // Destroy existing chart if it exists
  }

  citationChart = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [{
        label: 'Citations',
        data: citations,
        backgroundColor: backgroundColors,
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Citations: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Citation Count'
          },
          ticks: {
            precision: 0
          }
        },
        x: {
          title: {
            display: true,
            text: 'Year'
          }
        }
      }
    }
  });
}

// Display error message
function displayError(message) {
  // Show error in console
  console.error(message);
  
  // Update UI with error message
  scholarInstitutionEl.textContent = 'Error loading data';
  scholarInstitutionEl.style.color = '#e74c3c';
  
  // Create empty chart to show no data
  createEmptyChart();
}

// Create empty chart when no data is available
function createEmptyChart() {
  if (citationChart) {
    citationChart.destroy();
  }
  
  citationChart = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels: ['No Data Available'],
      datasets: [{
        data: [0],
        backgroundColor: 'rgba(200, 200, 200, 0.3)',
        borderColor: 'rgba(200, 200, 200, 0.5)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          display: false
        }
      }
    }
  });
}

// Initialize the page
async function initialize() {
  const data = await loadCitationData();
  if (data) {
    updateMetrics(data);
    createCitationHistogram(data);
  }
}

// When the DOM is loaded, initialize the page
document.addEventListener('DOMContentLoaded', initialize);
