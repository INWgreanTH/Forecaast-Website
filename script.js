const pages = {
  rainRadar: `
    <h1>Rain Radar</h1>
    <div class="section">
      Real-time radar and satellite visualization of rainfall patterns.
    </div>
  `,
  rainfallVolume: `
    <h1>Rainfall and Water Volume</h1>
    <div class="section">
      Rainfall accumulation, water volume, and hydrological statistics.
    </div>
  `,
  rainForecast: `
    <h1>Rain Forecast</h1>
    <div class="section">
      Short-term and long-term precipitation forecasts for the region.
    </div>
  `,
  seaTides: `
    <h1>Sea Levels and Tides</h1>
    <div class="section">
      Tide levels, sea conditions, and coastal monitoring data.
    </div>
  `,
  earthquakeReports: `
    <h1>Earthquake Reports</h1>
    <div class="section">
      Seismic activity reports and recent earthquake events.
    </div>
  `,
  airQualityPM25: `
    <h1>Air Quality – PM2.5 in Rayong</h1>
    <div class="section">
      Air quality index and PM2.5 concentration monitoring in Rayong Province.
    </div>
  `
};

const panel = document.getElementById('panel');
const panelContent = document.getElementById('panel-content');
const closeBtn = document.getElementById('close');

// Hex click handling
document.querySelectorAll('.hex-face').forEach(hex => {
  hex.addEventListener('click', () => {
    const pageKey = hex.getAttribute('data-page');

    if (pages[pageKey]) {
      panelContent.innerHTML = pages[pageKey];
      panel.classList.add('open');

      // Highlight active hex
      document.querySelectorAll('.hex-face').forEach(h => h.classList.remove('active'));
      hex.classList.add('active');
    }
  });
});

// Close button
closeBtn.addEventListener('click', () => {
  panel.classList.remove('open');
  document.querySelectorAll('.hex-face').forEach(h => h.classList.remove('active'));
});
