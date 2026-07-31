/**
 * BTM CHEMFLO - DEALER PRESENTATION LOGIC
 * Renders dealer-specific content from Google Sheet data
 *
 * Uses:
 * - window_presentationData (from api-handler.js)
 * - Toast notifications (toast-notifications.js)
 */

/**
 * RENDER INDUSTRIES SECTION
 * Display industries served with applications
 */
function renderIndustries() {
  const container = document.getElementById('industries-grid');
  if (!container) return;

  const industries = getDataSection('industries');
  if (!industries || industries.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; color: var(--color-gray-dark);">No industries data available</p>';
    return;
  }

  container.innerHTML = industries.map(industry => `
    <div class="card">
      <div class="card-icon">${industry.Icon || '🏭'}</div>
      <div class="card-title">${industry.Name || 'Industry'}</div>
      <div class="card-description">
        ${industry['Key Applications'] || 'Key applications available'}
      </div>
    </div>
  `).join('');
}

/**
 * RENDER PRODUCTS TABLE
 * Display all products with categories and applications
 */
function renderProducts() {
  const container = document.getElementById('products-container');
  if (!container) return;

  const products = getDataSection('products');
  if (!products || products.length === 0) {
    container.innerHTML = '<p style="color: var(--color-gray-dark);">No products data available</p>';
    return;
  }

  const html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Product Name</th>
          <th>Category</th>
          <th>Application</th>
          <th>Markets</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(product => `
          <tr>
            <td><strong>${product.Name || '-'}</strong></td>
            <td>${product.Category || '-'}</td>
            <td>${product.Application || '-'}</td>
            <td>${product.Markets || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

/**
 * RENDER PRICING TABLE
 * Display pricing with volume discounts
 */
function renderPricing() {
  const container = document.getElementById('pricing-container');
  if (!container) return;

  // Create sample pricing table (would come from Google Sheet in real implementation)
  const pricingData = [
    {
      volume: '1-5 units',
      discount: 'Base Price',
      discountPercent: '0%',
      description: 'Standard pricing'
    },
    {
      volume: '6-20 units',
      discount: 'Volume Discount',
      discountPercent: '5%',
      description: 'For bulk orders'
    },
    {
      volume: '21-50 units',
      discount: 'Bulk Discount',
      discountPercent: '10%',
      description: 'For large projects'
    },
    {
      volume: '50+ units',
      discount: 'Enterprise',
      discountPercent: '15%',
      description: 'Contact sales for custom pricing'
    }
  ];

  const html = `
    <div style="margin: var(--spacing-lg) 0;">
      <p style="color: var(--color-gray-dark); margin-bottom: var(--spacing-md);">
        Volume-based pricing available. Contact our sales team for detailed quotations.
      </p>
      <table class="data-table">
        <thead>
          <tr>
            <th>Order Volume</th>
            <th>Discount Type</th>
            <th>Discount %</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${pricingData.map(price => `
            <tr>
              <td><strong>${price.volume}</strong></td>
              <td>${price.discount}</td>
              <td><strong>${price.discountPercent}</strong></td>
              <td>${price.description}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div style="margin-top: var(--spacing-xl); padding: var(--spacing-lg); background: var(--color-info-bg); border-radius: var(--radius-md);">
      <p style="color: var(--color-info-text); margin: 0;">
        <strong>💡 Tip:</strong> For custom pricing and project-specific quotes, contact our sales team directly.
      </p>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * RENDER CONTACT INFORMATION
 * Update contact details in footer
 */
function renderContact() {
  const contact = getDataSection('contact');
  if (!contact || Object.keys(contact).length === 0) {
    console.warn('No contact data available');
    return;
  }

  // Could update footer or create contact section
  console.log('Contact data:', contact);
}

/**
 * INITIALIZE DEALER PRESENTATION
 * Called when data is loaded
 */
function initializeDealerPresentation() {
  console.log('Initializing dealer presentation...');

  if (!isDataLoaded()) {
    console.warn('Data not loaded yet');
    setTimeout(initializeDealerPresentation, 500);
    return;
  }

  try {
    // Render all sections
    renderIndustries();
    renderProducts();
    renderPricing();
    renderContact();

    // Update last update time
    updateLastUpdateTime();

    console.log('✓ Dealer presentation initialized successfully');
    toastSuccess('Presentation loaded successfully', 2000);

  } catch (error) {
    console.error('Error initializing presentation:', error);
    toastError(`Error rendering presentation: ${error.message}`, 4000);
  }
}

/**
 * UPDATE LAST UPDATE TIME IN FOOTER
 */
function updateLastUpdateTime() {
  const lastUpdateSpan = document.getElementById('last-update');
  if (lastUpdateSpan && isDataLoaded()) {
    lastUpdateSpan.textContent = getLastUpdateTime();

    // Update every minute
    setInterval(() => {
      if (isDataLoaded()) {
        lastUpdateSpan.textContent = getLastUpdateTime();
      }
    }, 60000);
  }
}

/**
 * HANDLE DATA REFRESH
 * Called when data auto-updates every 5 minutes
 */
function handleDataRefresh() {
  console.log('Data refreshed, updating presentation...');

  try {
    renderIndustries();
    renderProducts();
    renderPricing();
    updateLastUpdateTime();

    toastSuccess('✓ Presentation updated with latest data', 2000);

  } catch (error) {
    console.error('Error updating presentation:', error);
  }
}

/**
 * FILTER PRODUCTS BY CATEGORY
 */
function filterProductsByCategory(category) {
  const filteredProducts = filterData('products', { Category: category });
  console.log(`Filtered products (${category}):`, filteredProducts);

  // Could render filtered list
  return filteredProducts;
}

/**
 * SEARCH PRODUCTS
 */
function searchProducts(query) {
  const results = searchData('products', query, ['Name', 'Application', 'Category']);
  console.log(`Search results for "${query}":`, results);

  return results;
}

/**
 * HANDLE PRINT/DOWNLOAD
 */
function printPresentation() {
  console.log('Printing presentation...');
  toastInfo('Opening print dialog...', 1000);

  window.print();
}

/**
 * EXPORT DATA AS CSV (for analysis)
 */
function exportProductsAsCSV() {
  const products = getDataSection('products');
  if (!products || products.length === 0) {
    toastError('No products to export', 3000);
    return;
  }

  // Create CSV
  const headers = Object.keys(products[0]);
  const rows = products.map(product =>
    headers.map(header => `"${product[header] || ''}"`).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `btm-products-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toastSuccess('Products exported as CSV', 2000);
}

/**
 * RELOAD PRESENTATION
 */
function reloadPresentation() {
  console.log('Reloading presentation...');
  toastInfo('Reloading...', 1000);

  // Force refresh data
  fetchPresentationData(true).then(() => {
    initializeDealerPresentation();
  });
}

/**
 * INITIALIZATION HOOK
 * Wait for data to load, then initialize
 */
function waitForDataAndInitialize() {
  if (isDataLoaded()) {
    initializeDealerPresentation();
  } else {
    // Check every 100ms
    setTimeout(waitForDataAndInitialize, 100);
  }
}

/**
 * AUTO-UPDATE HANDLER
 * Called whenever data is auto-refreshed (every 5 minutes)
 */
const originalFetchPresentationData = window.fetchPresentationData;
window.fetchPresentationData = async function(forceRefresh = false) {
  const result = await originalFetchPresentationData.call(this, forceRefresh);

  // Re-render when data updates
  if (forceRefresh && isDataLoaded()) {
    handleDataRefresh();
  }

  return result;
};

/**
 * START PRESENTATION
 * Called when auth system loads presentation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Dealer logic loaded');

  // Wait for data and initialize
  waitForDataAndInitialize();

  // Also initialize when auth completes
  const originalHidePasswordSplash = window.hidePasswordSplash;
  if (originalHidePasswordSplash) {
    window.hidePasswordSplash = function() {
      originalHidePasswordSplash.call(this);

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeDealerPresentation();
      }, 500);
    };
  }
});

/**
 * UTILITY: Get product by name
 */
function getProductByName(name) {
  return getDataItem('products', 'Name', name);
}

/**
 * UTILITY: Get industry by name
 */
function getIndustryByName(name) {
  return getDataItem('industries', 'Name', name);
}

console.log('Dealer Logic initialized');
