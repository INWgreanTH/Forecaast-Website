const app = document.getElementById('app');
const panel = document.getElementById('panel');
const panelContent = document.getElementById('panel-content');
const panelTitle = document.getElementById('panel-title');
const closeBtn = document.getElementById('close');

const pages = {
rainRadar: {
    title: "Rain Radar - Rayong Station",
    content: `
        <div class="dual-grid">
            <div class="card">
                <h3>📡 Latest Static (Rayong)</h3>
                <div style="width: 100%; height: 45vh; border-radius: 10px; background: #fff; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    <img src="https://semet.uk/latest/RYGLatest.jpg?t=${new Date().getTime()}" 
                         style="width: 100%; height: 100%; object-fit: contain;" 
                         onerror="this.src='https://via.placeholder.com/800x600.png?text=Static+Radar+Offline';">
                </div>
            </div>
            <div class="card">
                <h3>🔄 Latest Loop (Animation)</h3>
                <div style="width: 100%; height: 45vh; border-radius: 10px; background: #fff; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    <img src="https://semet.uk/loop/RYGLoop.gif?t=${new Date().getTime()}" 
                         style="width: 100%; height: 100%; object-fit: contain;"
                         onerror="this.src='https://via.placeholder.com/800x600.png?text=Radar+Loop+Offline';">
                </div>
            </div>
        </div>
        <div class="card">
            <h3>🌊 KU Flood Monitoring</h3>
            <iframe src="https://ryradar4flood.eng.ku.ac.th/r4fry/pages/situation/situation_urbs.php" 
                    style="width: 100%; height: 60vh; border-radius: 10px;"></iframe>
        </div>`
},
rainForecast: {
        title: "พยากรณ์อากาศ - YR.no (Norway)",
        content: `
            <div class="card" style="height: 85vh; display: flex; flex-direction: column;">
                <h3>📊 ตารางพยากรณ์รายชั่วโมง (Rayong)</h3>
                <iframe src="https://www.yr.no/en/content/2-7735915/table.html" 
                        style="flex-grow: 1; width: 100%; border-radius: 10px; border: none; background: #fff;">
                </iframe>
                
                <div style="margin-top: 15px; text-align: center;">
                    <a href="https://www.yr.no/en/forecast/daily-table/2-7735915/Thailand/Rayong/Rayong" 
                       target="_blank" 
                       style="display: inline-block; background: #0088ff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 0.9rem;">
                       เปิดหน้าตารางพยากรณ์แบบเต็มหน้าจอ ↗
                    </a>
                </div>
            </div>`
    },
rainfallVolume: {
        title: "ThaiWater Monitoring",
        content: `
            <div class="card" style="text-align:center; padding: 60px 20px;">
                <h3 style="font-size: 1.5rem; margin-bottom: 20px;">💧 ThaiWater Rayong Portal</h3>
                <p style="color: #7f95ad; margin-bottom: 30px; font-size: 1.1rem;">
                    This source does not allow embedding for security reasons. 
                    Please click below to view the live water levels.
                </p>
                <a href="https://rayong.thaiwater.net/" 
                   target="_blank" 
                   style="display: inline-block; background: var(--accent); color: #000; padding: 15px 40px; border-radius: 8px; font-weight: bold; text-decoration: none; transition: 0.3s;"
                   onmouseover="this.style.filter='brightness(1.2)'" 
                   onmouseout="this.style.filter='none'">
                   OPEN LIVE DATA PORTAL ↗
                </a>
            </div>`
    },
    airQualityPM25: {
        title: "Air Quality (PM 2.5)",
        content: `<div class="card"><h3>😷 PurpleAir Live Map</h3><iframe src="https://map.purpleair.com/air-quality-standards-us-epa-aqi?select=190049#9.55/12.675/101.4181"></iframe></div>`
    },
 seaTides: {
    title: "ระดับน้ำทะเลและน้ำขึ้นน้ำลง (ปากน้ำระยอง)",
    content: `
        <div class="card">
            <h3 style="color: var(--accent); margin-bottom: 20px;">📅 เลือกดูข้อมูลรายเดือน</h3>
            
            <div class="tide-grid-container">
                <button class="tide-btn" onclick="updateTideImage('https://img2.pic.in.th/PakNamRayong_Page_01.jpg')">มกราคม</button>
                <button class="tide-btn" onclick="updateTideImage('https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_02.jpg')">กุมภาพันธ์</button>
                <button class="tide-btn" onclick="updateTideImage('https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_03.jpg')">มีนาคม</button>
                <button class="tide-btn" onclick="updateTideImage('https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_04.jpg')">เมษายน</button>
                <button class="tide-btn" onclick="updateTideImage('https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_05.jpg')">พฤษภาคม</button>
                <button class="tide-btn" onclick="updateTideImage('https://img2.pic.in.th/PakNamRayong_Page_06.jpg')">มิถุนายน</button>
                <button class="tide-btn" onclick="updateTideImage('https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_07.jpg')">กรกฎาคม</button>
                <button class="tide-btn" onclick="updateTideImage('https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_08.jpg')">สิงหาคม</button>
                <button class="tide-btn" onclick="updateTideImage('https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_09.jpg')">กันยายน</button>
                <button class="tide-btn" onclick="updateTideImage('https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_10.jpg')">ตุลาคม</button>
                <button class="tide-btn" onclick="updateTideImage('https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_11.jpg')">พฤศจิกายน</button>
                <button class="tide-btn" onclick="updateTideImage('https://img2.pic.in.th/PakNamRayong_Page_12.jpg')">ธันวาคม</button>
            </div>

            <div id="tide-display" class="tide-viewer">
                <img id="current-tide-img" src="https://img2.pic.in.th/file/picinth/PakNamRayong_Page_01.jpg" 
                     alt="Tide Table" class="tide-img-fluid">
            </div>
        </div>`
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
// ฟังก์ชันสลับรูปภาพตารางน้ำรายเดือน
window.updateTideImage = function(imageUrl) {
    const tideImg = document.getElementById('current-tide-img');
    if (tideImg) {
        tideImg.style.opacity = '0'; // เพิ่ม Effect จางลงก่อนเปลี่ยนรูป
        setTimeout(() => {
            tideImg.src = imageUrl;
            tideImg.style.opacity = '1';
        }, 200);
    }
}
