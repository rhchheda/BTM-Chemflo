/**
 * BTM CHEMFLO - API HANDLER
 * Fetches live data from Google Sheet via Google Apps Script API
 * Handles caching, auto-refresh, and error handling
 *
 * Usage in HTML:
 * 1. Set API_URL before loading this script
 * 2. Call: fetchPresentationData()
 * 3. Use: window.presentationData for all sheet data
 */

// ⚠️ IMPORTANT: Set this BEFORE loading api-handler.js
// const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/usercontent';

const API_CONFIG = {
  autoRefreshInterval: 5 * 60 * 1000,  // 5 minutes
  cacheExpiry: 10 * 60 * 1000,         // 10 minutes
  retryAttempts: 3,
  retryDelay: 2000,                    // 2 seconds
  timeout: 10000                       // 10 seconds
};

// Global data storage
let window_presentationData = null;
let lastFetchTime = null;
let autoRefreshTimeout = null;
let isFetching = false;

/**
 * FETCH PRESENTATION DATA
 * Fetches all data from Google Sheet API
 *
 * @param {boolean} forceRefresh - Force fresh fetch (ignore cache)
 * @returns {Promise<Object>} Presentation data
 *
 * @example
 * const data = await fetchPresentationData();
 * console.log(data.financials);
 * console.log(data.testimonials);
 */
async function fetchPresentationData(forceRefresh = false) {
  // Check if already fetching
  if (isFetching && !forceRefresh) {
    console.warn('Data fetch already in progress');
    return window_presentationData || null;
  }

  // Check cache (if not forced refresh)
  if (!forceRefresh && window_presentationData && lastFetchTime) {
    const cacheAge = Date.now() - lastFetchTime;
    if (cacheAge < API_CONFIG.cacheExpiry) {
      console.log(`✓ Using cached data (${Math.floor(cacheAge / 1000)}s old)`);
      return window_presentationData;
    }
  }

  // Show loading toast
  toastInfo(ToastMessages.DATA.LOADING);

  isFetching = true;

  try {
    // Validate API_URL is set
    if (typeof API_URL === 'undefined' || !API_URL) {
      throw new Error(
        'API_URL not set. Please add this to your HTML:\n' +
        'const API_URL = "https://script.google.com/macros/s/YOUR_ID/usercontent";'
      );
    }

    // Fetch with retry
    let data = null;
    let lastError = null;

    for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
      try {
        console.log(`Fetching data (attempt ${attempt}/${API_CONFIG.retryAttempts})...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        const response = await fetch(API_URL, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        data = await response.json();

        // Validate data structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data format received');
        }

        // Success!
        console.log('✓ Data fetched successfully');
        console.log('Data sections:', Object.keys(data));
        break;

      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error.message);

        if (attempt < API_CONFIG.retryAttempts) {
          console.log(`Retrying in ${API_CONFIG.retryDelay}ms...`);
          await delay(API_CONFIG.retryDelay);
        }
      }
    }

    // Check if we got data
    if (!data) {
      throw new Error(`Failed after ${API_CONFIG.retryAttempts} attempts: ${lastError.message}`);
    }

    // Store in global
    window_presentationData = data;
    lastFetchTime = Date.now();

    // Show success toast
    toastSuccess(ToastMessages.DATA.LOADED);

    // Schedule auto-refresh
    scheduleAutoRefresh();

    return data;

  } catch (error) {
    console.error('❌ Data fetch failed:', error);

    toastError(
      `Failed to load data: ${error.message}. Retrying in 30 seconds...`,
      5000
    );

    isFetching = false;

    // Retry fetch after delay
    setTimeout(() => fetchPresentationData(true), 30000);

    // Return cached data if available
    return window_presentationData;

  } finally {
    isFetching = false;
  }
}

/**
 * SCHEDULE AUTO-REFRESH
 * Refreshes data every 5 minutes
 * @private
 */
function scheduleAutoRefresh() {
  // Clear previous timeout
  if (autoRefreshTimeout) {
    clearTimeout(autoRefreshTimeout);
  }

  // Schedule next refresh
  autoRefreshTimeout = setTimeout(() => {
    console.log('Auto-refreshing data...');
    toastInfo(ToastMessages.DATA.SYNC, 2000);

    fetchPresentationData(true)
      .then(() => {
        console.log('✓ Auto-refresh complete');
        toastSuccess(ToastMessages.DATA.SYNCED, 2000);
      })
      .catch(error => {
        console.error('Auto-refresh failed:', error);
      });
  }, API_CONFIG.autoRefreshInterval);

  console.log(`Auto-refresh scheduled in ${API_CONFIG.autoRefreshInterval / 1000}s`);
}

/**
 * GET DATA SECTION
 * Safely access a data section with fallback
 *
 * @param {string} sectionName - Name of section (e.g., 'kpis', 'financials')
 * @returns {any} Section data or empty array/object
 *
 * @example
 * const kpis = getDataSection('kpis');
 * const financial = getDataSection('financial');
 */
function getDataSection(sectionName) {
  if (!window_presentationData) {
    console.warn(`No data available. Section '${sectionName}' not loaded.`);
    return null;
  }

  if (!(sectionName in window_presentationData)) {
    console.warn(`Section '${sectionName}' not found in data`);
    return null;
  }

  return window_presentationData[sectionName];
}

/**
 * GET SINGLE DATA ITEM
 * Get specific item from a data array
 *
 * @param {string} sectionName - Data section name
 * @param {string} fieldName - Field to match
 * @param {string} value - Value to match
 * @returns {Object} Matched item or null
 *
 * @example
 * const oilGasCase = getDataItem('caseStudies', 'Industry', 'Oil & Gas');
 */
function getDataItem(sectionName, fieldName, value) {
  const section = getDataSection(sectionName);
  if (!Array.isArray(section)) {
    console.warn(`Section '${sectionName}' is not an array`);
    return null;
  }

  return section.find(item => item[fieldName] === value) || null;
}

/**
 * SEARCH DATA
 * Search across multiple fields
 *
 * @param {string} sectionName - Data section name
 * @param {string} query - Search query
 * @param {string[]} fields - Fields to search in
 * @returns {Array} Matching items
 *
 * @example
 * const results = searchData('caseStudies', 'pump', ['Challenge', 'Solution']);
 */
function searchData(sectionName, query, fields = []) {
  const section = getDataSection(sectionName);
  if (!Array.isArray(section)) return [];

  const lowerQuery = query.toLowerCase();

  if (fields.length === 0) {
    // Search all fields
    return section.filter(item => {
      return Object.values(item).some(value =>
        String(value).toLowerCase().includes(lowerQuery)
      );
    });
  } else {
    // Search specific fields
    return section.filter(item => {
      return fields.some(field =>
        String(item[field] || '').toLowerCase().includes(lowerQuery)
      );
    });
  }
}

/**
 * FILTER DATA
 * Filter data array by criteria
 *
 * @param {string} sectionName - Data section name
 * @param {Object} criteria - Filter criteria {field: value, ...}
 * @returns {Array} Filtered items
 *
 * @example
 * const powerCases = filterData('caseStudies', { Industry: 'Power' });
 */
function filterData(sectionName, criteria = {}) {
  const section = getDataSection(sectionName);
  if (!Array.isArray(section)) return [];

  return section.filter(item => {
    return Object.entries(criteria).every(([field, value]) => {
      return item[field] === value;
    });
  });
}

/**
 * CHECK DATA LOADED
 * Verify if data is loaded and ready
 *
 * @returns {boolean} True if data is loaded
 */
function isDataLoaded() {
  return window_presentationData !== null && window_presentationData !== undefined;
}

/**
 * GET LAST UPDATE TIME
 * Get when data was last fetched
 *
 * @returns {string} Time string or 'Never'
 */
function getLastUpdateTime() {
  if (!lastFetchTime) return 'Never';

  const date = new Date(lastFetchTime);
  return date.toLocaleTimeString();
}

/**
 * CANCEL AUTO-REFRESH
 * Stop automatic data refresh
 */
function cancelAutoRefresh() {
  if (autoRefreshTimeout) {
    clearTimeout(autoRefreshTimeout);
    autoRefreshTimeout = null;
    console.log('Auto-refresh cancelled');
  }
}

/**
 * HELPER: Delay function
 * @private
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * INITIALIZE DATA FETCH
 * Call this when page loads
 */
async function initializeData() {
  console.log('Initializing data fetch...');

  // Check if API_URL is configured
  if (typeof API_URL === 'undefined' || !API_URL) {
    console.error(
      '❌ API_URL not configured. Add this to your HTML:\n' +
      'const API_URL = "https://script.google.com/macros/s/YOUR_ID/usercontent";'
    );

    toastError(
      'API configuration error. Contact support.',
      0
    );

    return null;
  }

  // Fetch data
  const data = await fetchPresentationData();

  if (data) {
    console.log('✓ Initial data loaded successfully');
    return data;
  } else {
    console.warn('⚠ Could not load initial data');
    return null;
  }
}

/**
 * USAGE EXAMPLES
 *
 * // Initialize on page load
 * document.addEventListener('DOMContentLoaded', initializeData);
 *
 * // Access data
 * const kpis = getDataSection('kpis');
 * const testimonials = getDataSection('testimonials');
 * const cases = filterData('caseStudies', { Industry: 'Oil & Gas' });
 *
 * // Search data
 * const searchResults = searchData('products', 'pump', ['Name', 'Application']);
 *
 * // Force refresh
 * await fetchPresentationData(true);
 *
 * // Check status
 * console.log(isDataLoaded());  // true/false
 * console.log(getLastUpdateTime());  // "10:30:45 AM"
 *
 * // Stop auto-refresh
 * cancelAutoRefresh();
 */

// Log initialization
console.log('API Handler loaded. Awaiting initialization...');
