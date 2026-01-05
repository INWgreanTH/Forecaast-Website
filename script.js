const app = document.getElementById('app');
const panel = document.getElementById('panel');
const panelContent = document.getElementById('panel-content');
const panelTitle = document.getElementById('panel-title');
const closeBtn = document.getElementById('close');

const pages = {
    rainRadar: {
        title: "Rain Radar Monitoring",
        content: `
            <div class="card"><h3>🛰️ TMD Rayong Radar</h3><iframe src="https://weather.tmd.go.th/ryg240_HQ_edit2.php"></iframe></div>
            <div class="card"><h3>🌊 KU Radar for Flood</h3><iframe src="https://ryradar4flood.eng.ku.ac.th/r4fry/pages/situation/situation_urbs.php"></iframe></div>
            <div class="card"><h3>✈️ Sattahip Radar (Royal Rain)</h3><iframe src="https://file.royalrain.go.th/opendata/radar_data/cappi/?station=sattahip"></iframe></div>`
    },
    rainfallVolume: {
        title: "Water Levels & Rainfall",
        content: `
            <div class="card"><h3>💧 ThaiWater: Rayong Portal</h3><iframe src="https://rayong.thaiwater.net/"></iframe></div>
            <div class="card"><h3>📊 RID Hydro: กรมชลประทาน</h3><iframe src="https://hyd-app.rid.go.th/hydro6h.html"></iframe></div>`
    },
    airQualityPM25: {
        title: "Air Quality (PM 2.5)",
        content: `
            <div class="card"><h3>😷 PurpleAir Live Sensor</h3><iframe src="https://map.purpleair.com/air-quality-standards-us-epa-aqi?select=190049#9.55/12.675/101.4181"></iframe></div>`
    },
    seaTides: {
        title: "Sea Level & Tides",
        content: `
            <div class="card">
                <h3>⚓ Paknam Rayong: Tide Predictions 2026</h3>
                <a href="https://www.hydro.navy.mi.th/download/Water_lever69/LLW/PR2026.pdf" target="_blank" class="external-link">Download 2026 Tide Chart (PDF)</a>
                <iframe src="https://www.hydro.navy.mi.th/" style="margin-top:25px"></iframe>
            </div>`
    },
    rainForecast: {
        title: "Weather Predictions",
        content: `<div class="card"><h3>☁️ TMD Rayong Province Forecast</h3><iframe src="https://www.tmd.go.th/province?id=49"></iframe></div>`
    },
    earthquakeReports: {
        title: "Earthquake Reports",
        content: `<div class="card"><h3>🌍 Seismic Activity Monitoring</h3><iframe src="https://earthquake.tmd.go.th/"></iframe></div>`
    }
};

document.querySelectorAll('.hex-group').forEach(group => {
    group.addEventListener('click', () => {
        const key = group.dataset.page;
        const data = pages[key];
        panelTitle.innerText = data.title;
        panelContent.innerHTML = data.content;
        panel.classList.add('open');
        app.classList.add('panel-open');
    });
});

closeBtn.addEventListener('click', () => {
    panel.classList.remove('open');
    app.classList.remove('panel-open');
});