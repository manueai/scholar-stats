// Get references to DOM elements
const scholarNameElement = document.getElementById('scholar-name');
const scholarAffiliationElement = document.getElementById('scholar-affiliation');
const scholarInterestsElement = document.getElementById('scholar-interests');
const metricsGridElement = document.getElementById('metrics-grid');
const lastUpdatedElement = document.getElementById('last-updated');
const citationChartElement = document.getElementById('citation-chart');

// Citation chart instance
let citationChart;

// Fetch the scholar stats data
async function fetchScholarStats() {
    try {
        const response = await fetch('data/scholar_stats.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        displayScholarStats(data);
    } catch (error) {
        console.error('Error fetching scholar stats:', error);
        
        // Display error message on the page
        document.querySelector('.container').innerHTML = `
            <div class="error-message">
                <h2>Error Loading Data</h2>
                <p>Could not load scholar statistics. Please try again later.</p>
                <p>Error details: ${error.message}</p>
            </div>
        `;
    }
}

// Display the scholar stats on the page
function displayScholarStats(data) {
    // Display profile information
    if (data.profile) {
        scholarNameElement.textContent = data.profile.name || 'Scholar Statistics';
        scholarInterestsElement.textContent = Array.isArray(data.profile.interests)
            ? data.profile.interests.join(', ')
            : (data.profile.interests || '');
    }
    
    // Display citation metrics
    if (data.metrics && data.metrics.citation_stats) {
        displayCitationMetrics(data.metrics.citation_stats);
    }
    
    // Display last updated timestamp
    if (data.updated_at) {
        lastUpdatedElement.textContent = data.updated_at;
    }
    
    // Create citation history chart (filtered from 2000 onwards)
    createCitationChart(data.metrics?.citation_history || []);
}

// Display citation metrics
function displayCitationMetrics(citationStats) {
    // Clear any existing metrics
    metricsGridElement.innerHTML = '';
    
    // Display each metric
    for (const [metric, values] of Object.entries(citationStats)) {
        const metricItem = document.createElement('div');
        metricItem.className = 'metric-item';
        
        // Find the "since" entry in the values and extract the year
        let sinceLabel = 'Since recent';
        let sinceValue = '';
        
        const sinceKey = Object.keys(values).find(key => key.startsWith('since_'));
        if (sinceKey) {
            // Extract year from the key (e.g., "since_2020" becomes "2020")
            const yearMatch = sinceKey.match(/since_(\d{4})/);
            if (yearMatch) {
                sinceLabel = `Since ${yearMatch[1]}`;
            }
            sinceValue = values[sinceKey];
        }
        
        metricItem.innerHTML = `
            <span class="metric-label">${metric}</span>
            <div class="metric-value">${values.all}</div>
            <div class="sub-value">${sinceLabel}: ${sinceValue}</div>
        `;
        
        metricsGridElement.appendChild(metricItem);
    }
}

// Create the citation history chart (filtered from 2000 onwards)
function createCitationChart(historyData) {
    if (!historyData || historyData.length === 0) {
        console.log('No citation history data available');
        return;
    }
    
    // Filter data to only include years from 2000 onwards
    const filteredData = historyData.filter(item => {
        const year = parseInt(item.year);
        if (isNaN(year)) {
            console.warn(`Invalid year format: ${item.year}`);
            return false;
        }
        return year >= 2000;
    });
    
    console.log(`Filtered citation data: ${historyData.length} total years, ${filteredData.length} from 2000 onwards`);
    
    if (filteredData.length === 0) {
        console.log('No citation data from 2000 onwards');
        // Display a message on the chart area
        citationChartElement.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No citation data available from 2000 onwards</p>';
        return;
    }
    
    // Sort data by year
    filteredData.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    // Extract labels and data
    const labels = filteredData.map(item => item.year);
    const citationData = filteredData.map(item => item.citations);
    
    console.log('Chart data:', { labels, citationData });
    
    // Destroy previous chart if it exists
    if (citationChart) {
        citationChart.destroy();
    }
    
    // Create the chart
    citationChart = new Chart(citationChartElement, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Citations',
                data: citationData,
                backgroundColor: 'rgba(26, 115, 232, 0.7)',
                borderColor: 'rgba(26, 115, 232, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Citations'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year (from 2000)'
                    }
                }
            },
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
                },
                title: {
                    display: true,
                    text: 'Citation History (2000 onwards)',
                    font: {
                        size: 14
                    }
                }
            }
        }
    });
}

// Load data when the page loads
document.addEventListener('DOMContentLoaded', fetchScholarStats);
