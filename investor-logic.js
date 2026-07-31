/**
 * BTM CHEMFLO - INVESTOR PRESENTATION LOGIC
 * Renders investor-specific content from Google Sheet data
 *
 * Uses:
 * - window_presentationData (from api-handler.js)
 * - Chart.js (for financial charts)
 * - Toast notifications (toast-notifications.js)
 */

let currentTestimonialIndex = 0;

/**
 * RENDER KPI CARDS
 * Display hyperlinked key performance indicators
 */
function renderKPIs() {
  const container = document.getElementById('kpi-container');
  if (!container) return;

  const kpis = getDataSection('kpis');
  if (!kpis || kpis.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; color: var(--color-gray-dark);">No KPI data available</p>';
    return;
  }

  container.innerHTML = kpis.map(kpi => `
    <div class="kpi-card" onclick="scrollToSection('${kpi.Link || 'financial'}')">
      <div class="kpi-number">${kpi.Number || '-'}</div>
      <div class="kpi-label">${kpi.Label || 'Metric'}</div>
      <div style="font-size: var(--font-size-sm); color: var(--color-gray-dark); margin-top: var(--spacing-md);">
        ${kpi.Description || ''}
      </div>
    </div>
  `).join('');
}

/**
 * RENDER TIMELINE
 * Display company history and milestones
 */
function renderTimeline() {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  const timeline = getDataSection('timeline');
  if (!timeline || timeline.length === 0) {
    container.innerHTML = '<p style="color: var(--color-gray-dark);">No timeline data available</p>';
    return;
  }

  const html = timeline.map((item, idx) => `
    <div style="margin-bottom: var(--spacing-lg); padding: var(--spacing-lg); background: var(--color-primary-white); border-radius: var(--radius-md); border-left: 4px solid var(--color-primary-orange);">
      <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-primary-orange); margin-bottom: var(--spacing-sm);">
        ${item.Year || '-'} ${item.Icon || ''}
      </div>
      <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-primary-blue); margin-bottom: var(--spacing-sm);">
        ${item.Title || 'Milestone'}
      </div>
      <div style="color: var(--color-gray-dark);">
        ${item.Description || ''}
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
}

/**
 * RENDER FINANCIAL CHARTS
 * Display revenue and EBITDA charts using Chart.js
 */
function renderFinancialCharts() {
  const financial = getDataSection('financial');
  if (!financial || Object.keys(financial).length === 0) {
    console.warn('No financial data available');
    return;
  }

  // Revenue Chart
  const revenueData = financial.revenue || null;
  if (revenueData) {
    const ctx = document.getElementById('revenue-chart');
    if (ctx) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: revenueData.labels || [],
          datasets: [{
            label: 'Revenue (₹ Crores)',
            data: revenueData.values || [],
            borderColor: '#FF9500',
            backgroundColor: 'rgba(255, 149, 0, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 2,
            pointRadius: 6,
            pointBackgroundColor: '#FF9500',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top' }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: '₹ Crores' } }
          }
        }
      });
    }
  }

  // EBITDA Chart
  const ebitdaData = financial.ebitda_margin || null;
  if (ebitdaData) {
    const ctx = document.getElementById('ebitda-chart');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ebitdaData.labels || [],
          datasets: [{
            label: 'EBITDA Margin (%)',
            data: ebitdaData.values || [],
            backgroundColor: '#0A1428',
            borderColor: '#FF9500',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top' }
          },
          scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: '%' } }
          }
        }
      });
    }
  }
}

/**
 * RENDER CASE STUDIES (Filterable by industry)
 */
function renderCaseStudies() {
  const caseStudies = getDataSection('caseStudies');
  if (!caseStudies || caseStudies.length === 0) {
    const container = document.getElementById('case-study-tabs');
    if (container) {
      container.innerHTML = '<p style="color: var(--color-gray-dark);">No case studies available</p>';
    }
    return;
  }

  // Get unique industries
  const industries = [...new Set(caseStudies.map(cs => cs.Industry))];

  // Create tabs
  const tabsContainer = document.getElementById('case-study-tabs');
  if (tabsContainer) {
    tabsContainer.innerHTML = industries.map((industry, idx) => `
      <button class="tab-btn ${idx === 0 ? 'active' : ''}" onclick="showCaseStudyTab('${industry}')">
        ${industry}
      </button>
    `).join('');
  }

  // Create content
  const contentContainer = document.getElementById('case-study-content');
  if (contentContainer) {
    contentContainer.innerHTML = industries.map((industry, idx) => `
      <div class="tab-content ${idx === 0 ? 'active' : ''}" id="case-${industry}">
        ${caseStudies
          .filter(cs => cs.Industry === industry)
          .map(cs => `
            <div style="background: var(--color-primary-white); border: 1px solid var(--color-gray-border); border-radius: var(--radius-lg); padding: var(--spacing-lg); margin-bottom: var(--spacing-lg);">
              <div style="color: var(--color-primary-orange); font-weight: bold; margin-bottom: var(--spacing-md);">
                ${cs.Industry}
              </div>
              <div style="margin-bottom: var(--spacing-md);">
                <strong>Challenge:</strong> ${cs.Challenge}
              </div>
              <div style="margin-bottom: var(--spacing-md);">
                <strong>Solution:</strong> ${cs.Solution}
              </div>
              <div style="margin-bottom: var(--spacing-md);">
                <strong>Results:</strong> ${cs.Results}
              </div>
              <div style="background: var(--color-success-bg); color: var(--color-success-text); padding: var(--spacing-md); border-radius: var(--radius-md); font-weight: bold; text-align: center;">
                ROI: ${cs.ROI}
              </div>
            </div>
          `).join('')}
      </div>
    `).join('');
  }
}

/**
 * SHOW CASE STUDY TAB
 */
function showCaseStudyTab(industry) {
  // Hide all
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  // Show selected
  const tab = document.getElementById(`case-${industry}`);
  if (tab) tab.classList.add('active');

  // Highlight button
  event.target.classList.add('active');
}

/**
 * RENDER TESTIMONIALS CAROUSEL
 */
function renderTestimonials() {
  const testimonials = getDataSection('testimonials');
  if (!testimonials || testimonials.length === 0) {
    const container = document.getElementById('testimonials-carousel');
    if (container) {
      container.innerHTML = '<p style="color: var(--color-gray-dark);">No testimonials available</p>';
    }
    return;
  }

  const container = document.getElementById('testimonials-carousel');
  if (container) {
    container.innerHTML = testimonials.map((testimonial, idx) => `
      <div class="carousel-item ${idx === 0 ? 'active' : ''}">
        <blockquote style="font-size: var(--font-size-lg); font-style: italic; margin-bottom: var(--spacing-lg); color: var(--color-primary-blue);">
          "${testimonial.Quote}"
        </blockquote>
        <div style="font-weight: bold; color: var(--color-primary-orange); margin-bottom: var(--spacing-sm);">
          ${testimonial.Author}
        </div>
        <div style="color: var(--color-gray-dark);">
          ${testimonial.Role} at ${testimonial.Company}
        </div>
        <div style="color: var(--color-gray-dark); font-size: var(--font-size-sm); margin-top: var(--spacing-sm);">
          ${testimonial.Industry}
        </div>
      </div>
    `).join('');
  }
}

/**
 * CHANGE TESTIMONIAL (Carousel)
 */
function changeTestimonial(direction) {
  const items = document.querySelectorAll('.carousel-item');
  if (items.length === 0) return;

  items[currentTestimonialIndex].classList.remove('active');
  currentTestimonialIndex = (currentTestimonialIndex + direction + items.length) % items.length;
  items[currentTestimonialIndex].classList.add('active');
}

/**
 * RENDER TEAM
 */
function renderTeam() {
  const container = document.getElementById('team-container');
  if (!container) return;

  const team = getDataSection('team');
  if (!team || team.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; color: var(--color-gray-dark);">No team data available</p>';
    return;
  }

  container.innerHTML = team.map(member => `
    <div class="card">
      <div style="font-size: var(--font-size-sm); color: var(--color-primary-orange); font-weight: bold; margin-bottom: var(--spacing-md);">
        👤
      </div>
      <div class="card-title">${member.Name}</div>
      <div style="color: var(--color-primary-orange); font-weight: bold; margin-bottom: var(--spacing-md);">
        ${member.Position}
      </div>
      <div style="font-size: var(--font-size-sm); color: var(--color-gray-dark); margin-bottom: var(--spacing-md);">
        <strong>${member.Experience}</strong> of experience
      </div>
      <div style="font-size: var(--font-size-sm); color: var(--color-gray-dark);">
        <strong>Expertise:</strong> ${member.Expertise}
      </div>
      <div style="font-size: var(--font-size-sm); color: var(--color-gray-dark); margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--color-gray-border);">
        ${member.Background}
      </div>
    </div>
  `).join('');
}

/**
 * RENDER CERTIFICATIONS
 */
function renderCertifications() {
  const container = document.getElementById('certifications-container');
  if (!container) return;

  const certifications = getDataSection('certifications');
  if (!certifications || certifications.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; color: var(--color-gray-dark);">No certifications available</p>';
    return;
  }

  container.innerHTML = certifications.map(cert => `
    <div class="card">
      <div style="font-size: var(--font-size-2xl); margin-bottom: var(--spacing-md);">
        ${cert.Icon || '🏆'}
      </div>
      <div class="card-title">${cert.Name}</div>
      <div class="card-description">${cert.Description}</div>
      <div style="font-size: var(--font-size-sm); color: var(--color-primary-orange); font-weight: bold; margin-top: var(--spacing-md);">
        Scope: ${cert.Scope}
      </div>
    </div>
  `).join('');
}

/**
 * RENDER ROADMAP
 */
function renderRoadmap() {
  const container = document.getElementById('roadmap-container');
  if (!container) return;

  const roadmap = getDataSection('roadmap');
  if (!roadmap || roadmap.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; color: var(--color-gray-dark);">No roadmap data available</p>';
    return;
  }

  container.innerHTML = roadmap.map(item => `
    <div class="card">
      <div style="color: var(--color-primary-orange); font-weight: bold; margin-bottom: var(--spacing-md);">
        📌 ${item.Timeline}
      </div>
      <div class="card-title">${item.Initiative}</div>
      <div class="card-description">${item.Impact}</div>
      <div style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--color-gray-border);">
        <div style="font-size: var(--font-size-sm); color: var(--color-gray-dark);">
          <strong>Investment:</strong> ${item.Investment}
        </div>
        <div style="font-size: var(--font-size-sm); color: var(--color-gray-dark); margin-top: var(--spacing-sm);">
          <strong>Expected:</strong> ${item['Expected Outcome']}
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * INITIALIZE INVESTOR PRESENTATION
 */
function initializeInvestorPresentation() {
  console.log('Initializing investor presentation...');

  if (!isDataLoaded()) {
    console.warn('Data not loaded yet');
    setTimeout(initializeInvestorPresentation, 500);
    return;
  }

  try {
    renderKPIs();
    renderTimeline();
    renderFinancialCharts();
    renderCaseStudies();
    renderTestimonials();
    renderTeam();
    renderCertifications();
    renderRoadmap();

    updateLastUpdateTime();

    console.log('✓ Investor presentation initialized');
    toastSuccess('Presentation loaded successfully', 2000);

  } catch (error) {
    console.error('Error initializing presentation:', error);
    toastError(`Error: ${error.message}`, 4000);
  }
}

/**
 * UPDATE FOOTER TIMESTAMP
 */
function updateLastUpdateTime() {
  const lastUpdate = document.getElementById('last-update');
  if (lastUpdate && isDataLoaded()) {
    lastUpdate.textContent = getLastUpdateTime();
    setInterval(() => {
      if (isDataLoaded()) lastUpdate.textContent = getLastUpdateTime();
    }, 60000);
  }
}

/**
 * INITIALIZATION HOOK
 */
function waitForDataAndInitialize() {
  if (isDataLoaded()) {
    initializeInvestorPresentation();
  } else {
    setTimeout(waitForDataAndInitialize, 100);
  }
}

/**
 * START
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Investor logic loaded');
  waitForDataAndInitialize();
});

console.log('Investor Logic initialized');
