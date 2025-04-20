// scripts/fetch-scholar.js
// Script to fetch Google Scholar citation data and save it as a static JSON file

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Get the Google Scholar profile ID from environment variable or arguments
const PROFILE_ID = process.env.SCHOLAR_ID || process.argv[2];

if (!PROFILE_ID) {
  console.error('Please provide a Google Scholar profile ID via SCHOLAR_ID env variable or as an argument');
  process.exit(1);
}

async function fetchScholarData() {
  console.log(`Fetching Google Scholar data for profile: ${PROFILE_ID}`);
  
  try {
    // Make the HTTP request to Google Scholar
    const response = await axios.get(`https://scholar.google.com/citations?user=${PROFILE_ID}&hl=en`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });

    // Load HTML into Cheerio for parsing
    const $ = cheerio.load(response.data);
    
    // Extract citation metrics
    const totalCitations = parseInt($('.gsc_rsb_sc1:nth-child(1) .gsc_rsb_std').text().trim()) || 0;
    const h_index = parseInt($('.gsc_rsb_sc1:nth-child(2) .gsc_rsb_std').text().trim()) || 0;
    const i10_index = parseInt($('.gsc_rsb_sc1:nth-child(3) .gsc_rsb_std').text().trim()) || 0;

    // Extract citation data by year
    const citationsByYear = {};
    
    // Process the citation graph data
    $('div.gsc_md_hist_b .gsc_g_t').each((index, element) => {
      const year = $(element).text().trim();
      // Locate the citation count for this year
      const citationCount = parseInt($(`div.gsc_md_hist_b .gsc_g_a[style*="z-index: ${10-index}"] .gsc_g_al`).text().trim()) || 0;
      citationsByYear[year] = citationCount;
    });

    // Get profile details
    const profileName = $('.gsc_prf_in').first().text().trim();
    const profileInstitution = $('.gsc_prf_il').first().text().trim();
    
    // Compile the data
    const scholarData = {
      metadata: {
        profileId: PROFILE_ID,
        name: profileName,
        institution: profileInstitution,
        fetchedAt: new Date().toISOString()
      },
      metrics: {
        totalCitations,
        h_index,
        i10_index
      },
      citationsByYear
    };

    return scholarData;
  } catch (error) {
    console.error('Error fetching Google Scholar data:', error.message);
    if (error.response) {
      console.error('Status code:', error.response.status);
    }
    throw error;
  }
}

async function saveData() {
  try {
    const data = await fetchScholarData();
    
    // Create directory path if it doesn't exist
    const dataDir = path.join(__dirname, '../js/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write data to JSON file
    const filePath = path.join(dataDir, 'citations.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    console.log(`Data successfully saved to ${filePath}`);
    console.log('Citation metrics:', data.metrics);
  } catch (error) {
    console.error('Failed to save data:', error);
    process.exit(1);
  }
}

// Execute the script
saveData();
