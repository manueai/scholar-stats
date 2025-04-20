import os
import requests
import time
from bs4 import BeautifulSoup
import json
import datetime
from dotenv import load_dotenv
import logging
import urllib3

# Disable SSL warnings (use with caution in production)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_environment_variables():
    """Load environment variables from .env file or environment"""
    load_dotenv()
    
    # Required environment variables
    required_vars = [
        'PROXY_USERNAME', 
        'PROXY_PASSWORD',
        'PROXY_SERVER',
        'PROXY_PORT',
        'SCHOLAR_ID'
    ]
    
    # Check if all required variables are set
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        raise EnvironmentError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
    return {var: os.getenv(var) for var in required_vars}

def get_html_content(url):
    """Fetch HTML content using Oxylabs proxy"""
    env_vars = load_environment_variables()
    
    username = env_vars['PROXY_USERNAME']
    password = env_vars['PROXY_PASSWORD']
    proxy_server = env_vars['PROXY_SERVER']
    proxy_port = env_vars['PROXY_PORT']
    
    proxy = f"{proxy_server}:{proxy_port}"
    
    proxies = {
        "https": f"https://user-{username}:{password}@{proxy}"
    }
    
    try:
        logger.info(f"Fetching URL: {url}")
        time.sleep(15)
        response = requests.get(
            url,
            proxies=proxies,
            timeout=30,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            verify=False  # Disable SSL verification
        )
        
        response.raise_for_status()
        return response.text
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching URL {url}: {e}")
        return None

def get_scholar_stats(scholar_id):
    """Get statistics for a Google Scholar profile"""
    url = f"https://scholar.google.com/citations?user={scholar_id}&hl=en"
    html = get_html_content(url)
    
    if not html:
        logger.error(f"Failed to get data for Scholar ID: {scholar_id}")
        return None
    
    soup = BeautifulSoup(html, "html.parser")
    
    try:
        # Extract profile information
        profile_data = {}
        
        # Name
        name_elem = soup.select_one('#gsc_prf_in')
        if name_elem:
            profile_data['name'] = name_elem.text.strip()
        
        # Affiliation
        affiliation_elem = soup.select_one('.gsc_prf_il')
        if affiliation_elem:
            profile_data['affiliation'] = affiliation_elem.text.strip()
        
        # Research interests
        interests = []
        interest_elems = soup.select('#gsc_prf_int .gs_ibl')
        for elem in interest_elems:
            interests.append(elem.text.strip())
        profile_data['interests'] = interests
        
        # Citation metrics
        metrics = {}
        
        # Overall metrics table
        citation_stats = {}
        stats_table = soup.select('table.gsc_rsb_st tr')
        
        for row in stats_table[1:]:  # Skip the header row
            cells = row.select('td')
            if len(cells) >= 3:
                metric = cells[0].text.strip()
                all_time = cells[1].text.strip()
                since_2018 = cells[2].text.strip()
                citation_stats[metric] = {'all': all_time, 'since_2018': since_2018}
        
        metrics['citation_stats'] = citation_stats
        
        # h-index and i10-index
        indices = {}
        indices_table = soup.select('table.gsc_rsb_st')
        if len(indices_table) > 1:
            rows = indices_table[1].select('tr')
            for row in rows[1:]:  # Skip the header row
                cells = row.select('td')
                if len(cells) >= 3:
                    metric = cells[0].text.strip()
                    all_time = cells[1].text.strip()
                    since_2018 = cells[2].text.strip()
                    indices[metric] = {'all': all_time, 'since_2018': since_2018}
        
        metrics['indices'] = indices
        
        # Citation history (graph data)
        graph_data = []
        years_elem = soup.select('#gsc_rsb_cit tr.gsc_g_t')
        citations_elem = soup.select('#gsc_rsb_cit .gsc_g_a')
        
        if years_elem and citations_elem:
            years = [year.text.strip() for year in years_elem[0].select('th')]
            citations = [int(citation.text.strip() or 0) for citation in citations_elem]
            
            if len(years) == len(citations):
                for i in range(len(years)):
                    graph_data.append({
                        'year': years[i],
                        'citations': citations[i]
                    })
        
        metrics['citation_history'] = graph_data
        
        # Combine all data
        scholar_stats = {
            'profile': profile_data,
            'metrics': metrics,
            'updated_at': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return scholar_stats
    
    except Exception as e:
        logger.error(f"Error parsing Google Scholar profile: {e}")
        return None

def save_json_data(data, filename="data/scholar_stats.json"):
    """Save data to JSON file"""
    # Ensure directory exists
    directory = os.path.dirname(filename)
    
    if not os.path.exists(directory):
        logger.info(f"Creating directory: {directory}")
        os.makedirs(directory, exist_ok=True)
    else:
        logger.info(f"Directory already exists: {directory}")
    
    # Check if we can write to the location
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"Data successfully saved to {filename}")
    except Exception as e:
        logger.error(f"Error saving data to {filename}: {e}")
        raise
    
    # Verify file exists after saving
    if os.path.exists(filename):
        file_size = os.path.getsize(filename)
        logger.info(f"Verified file exists: {filename} (Size: {file_size} bytes)")
    else:
        logger.error(f"File does not exist after saving: {filename}")
        
#def save_json_data(data, filename="data/scholar_stats.json"):
#    """Save data to JSON file"""
#    # Ensure directory exists
#    os.makedirs(os.path.dirname(filename), exist_ok=True)
#    
#    with open(filename, 'w', encoding='utf-8') as f:
#        json.dump(data, f, ensure_ascii=False, indent=2)
#    
#    logger.info(f"Data saved to {filename}")

def main():
    """Main function to retrieve Google Scholar stats"""
    try:
        # Load environment variables
        env_vars = load_environment_variables()
        scholar_id = env_vars['SCHOLAR_ID']
        
        # Get scholar stats
        logger.info(f"Retrieving stats for Scholar ID: {scholar_id}")
        scholar_stats = get_scholar_stats(scholar_id)
        
        if scholar_stats:
            # Save results
            save_json_data(scholar_stats)
            logger.info(f"Successfully retrieved stats for {scholar_stats['profile'].get('name', scholar_id)}")
        else:
            logger.error(f"Failed to retrieve stats for Scholar ID: {scholar_id}")
        
    except EnvironmentError as e:
        logger.error(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
