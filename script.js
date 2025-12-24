const panel = document.getElementById("panel");
const panelContent = document.getElementById("panel-content");
const closeBtn = document.getElementById("close");

/* PAGE CONTENT */
const pages = {
  rainRadar: `
    <h2>Rain Radar – Satellite Imagery</h2>

    <div class="accordion">
      <div class="accordion-header">
        🌧️ TMD Radar ระยอง
        <span>▼</span>
      </div>
      <div class="accordion-content">
        <div class="accordion-inner">
          <iframe
            src="https://weather.tmd.go.th/ryg240_HQ_edit2.php"
            loading="lazy">
          </iframe>
          <p style="font-size:13px;opacity:0.7;margin-top:8px;">
            Source: Thai Meteorological Department (TMD)
          </p>
        </div>
      </div>
    </div>
  `,
  rainfallVolume: `<h2>Amount of Water and Rain</h2>`,
  rainForecast: `<h2>Rain Forecast</h2>`,
  seaTides: `<h2>Sea Level and Tides</h2>`,
  earthquakeReports: `<h2>Earthquake</h2>`,
  airQualityPM25: `<h2>PM2.5 in Rayong</h2>`
};

/* HEX CLICK */
document.querySelectorAll(".hex-face").forEach(hex => {
  hex.addEventListener("click", () => {
    const key = hex.dataset.page;
    panelContent.innerHTML = pages[key] || "";
    panel.classList.add("open");
    setupAccordion();
  });
});

/* CLOSE PANEL */
closeBtn.addEventListener("click", () => {
  panel.classList.remove("open");
});

/* ACCORDION LOGIC */
function setupAccordion() {
  const header = document.querySelector(".accordion-header");
  const content = document.querySelector(".accordion-content");

  if (!header) return;

  header.addEventListener("click", () => {
    content.classList.toggle("open");
  });
}
