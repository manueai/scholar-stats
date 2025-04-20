// Get references to DOM elements
const scholarNameElement = document.getElementById('scholar-name');
const scholarAffiliationElement = document.getElementById('scholar-affiliation');
const citationStatsElement = document.getElementById('citation-stats');
const indicesStatsElement = document.getElementById('indices-stats');
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
        scholarAffiliationElement.textContent = data.profile.affiliation || '';
    }
    
    // Display citation stats
    if (data.metrics && data.metrics.citation_stats) {
        citationStatsElement.innerHTML = '';
        
        for (const [metric, values] of Object.entries(data.metrics.citation_stats)) {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            statItem.innerHTML = `
                <span class="stat-label">${metric}</span>
                <div class="stat-value">${values.all}</div>
                <div class="sub-value">Since 2018: ${values.since_2018}</div>
            `;
            
            citationStatsElement.appendChild(statItem);
        }
    }
    
    // Display indices stats
    if (data.metrics && data.metrics.indices) {
        indicesStatsElement.innerHTML = '';
        
        for (const [metric, values] of Object.entries(data.metrics.indices)) {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            statItem.innerHTML = `
                <span class="stat-label">${metric}</span>
                <div class="stat-value">${values.all}</div>
                <div class="sub-value">Since 2018: ${values.since_2018}</div>
            `;
            
            indicesStatsElement.appendChild(statItem);
        }
    }
    
    // Display last updated timestamp
    if (data.updated_at) {
        lastUpdatedElement.textContent = data.updated_at;
    }
    
    // Create citation history chart
    createCitationChart(data.metrics?.citation_history || []);
}

// Create the citation history chart
function createCitationChart(historyData) {
    if (!historyData || historyData.length === 0) {
        return;
    }
    
    // Sort data by year
    historyData.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    // Extract labels and data
    const labels = historyData.map(item => item.year);
    const citationData = historyData.map(item => item.citations);
    
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
                        text: 'Year'
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
                }
            }
        }
    });
}

// Load data when the page loads
document.addEventListener('DOMContentLoaded', fetchScholarStats);
