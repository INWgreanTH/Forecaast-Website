/**
 * Tap Ma Basin Hub - Integrated Live Portal Script
 * Year: 2569 BE / 2026 AD
 * Implementation: Z.38 (Ban Khao Bot) - Ultra Fast & Non-Blocking
 */

// --- 1. Global DOM Connections ---
const app = document.getElementById('app');
const panel = document.getElementById('panel');
const panelContent = document.getElementById('panel-content');
const panelTitle = document.getElementById('panel-title');
const closeBtn = document.getElementById('close');

let waterRefreshTimer;
let timeLeft = 300;

// --- 2. Category Content Database ---
const pages = {
    rainRadar: {
        title: "Radar Monitoring System",
        content: `
            <div class="card">
                <div class="radar-toolbar">
                    <button class="radar-btn active" onclick="switchRadar('ryg', this)">ระยอง</button>
                    <button class="radar-btn" onclick="switchRadar('ryg-e', this)">ภาคตะวันออก</button>
                    <button class="radar-btn" onclick="switchRadar('svp', this)">สุวรรณภูมิ</button>
                    <button class="radar-btn" onclick="switchRadar('skm', this)">สมุทรสงคราม</button>
                </div>
                <div id="radar-display" style="margin-top:20px;"></div>
            </div>`
    },
    waterLevel: {
        title: "สถานี Z.38 (บ้านเขาโบสถ์) - คลองทับมา",
        content: `
            <div class="water-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <p id="water-date-label" style="color: #888; font-size: 0.85rem; margin:0;"></p>
                    <div id="sync-status" style="font-size: 0.75rem; color: #00d2ff; background: rgba(0,210,255,0.1); padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(0,210,255,0.2);">
                        NEXT SYNC: <span id="timer-text">05:00</span>
                    </div>
                </div>
                <div id="water-loading" class="water-status">📡 กำลังเชื่อมต่อ RID API (Non-Blocking Mode)...</div>
                <div class="water-table-responsive" id="water-display-area" style="display:none;">
                    <table class="water-main-table">
                        <thead id="water-table-head"></thead>
                        <tbody id="water-table-body"></tbody>
                    </table>
                </div>
            </div>`
    },
    rainForecast: {
        title: "พยากรณ์อากาศรายชั่วโมง - Rayong",
        content: `<div class="card"><iframe src="https://www.yr.no/en/content/2-7735915/table.html"></iframe></div>`
    },
    seaTides: {
        title: "ระดับน้ำทะเล (ปากน้ำระยอง) ปี 2569",
        content: `
            <div class="card">
                <div class="tide-grid-container">
                    ${[
                        {n:'ม.ค.', u:'https://img2.pic.in.th/PakNamRayong_Page_01.jpg'},
                        {n:'ก.พ.', u:'https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_02.jpg'},
                        {n:'มี.ค.', u:'https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_03.jpg'},
                        {n:'เม.ย.', u:'https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_04.jpg'},
                        {n:'พ.ค.', u:'https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_05.jpg'},
                        {n:'มิ.ย.', u:'https://img2.pic.in.th/PakNamRayong_Page_06.jpg'},
                        {n:'ก.ค.', u:'https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_07.jpg'},
                        {n:'ส.ค.', u:'https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_08.jpg'},
                        {n:'ก.ย.', u:'https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_09.jpg'},
                        {n:'ต.ค.', u:'https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_10.jpg'},
                        {n:'พ.ย.', u:'https://img5.pic.in.th/file/secure-sv1/PakNamRayong_Page_11.jpg'},
                        {n:'ธ.ค.', u:'https://img2.pic.in.th/PakNamRayong_Page_12.jpg'}
                    ].map(m =>
                        `<button class="tide-btn" onclick="updateTideImage('${m.u}')">${m.n}</button>`
                    ).join('')}
                </div>
                <div class="tide-viewer">
                    <img id="current-tide-img" src="https://img2.pic.in.th/PakNamRayong_Page_01.jpg" class="tide-img-fluid" onerror="this.src='https://via.placeholder.com/800x600?text=กำลังโหลดข้อมูล...'">
                </div>
            </div>`
    },
    airQualityPM25: {
        title: "คุณภาพอากาศ PM 2.5",
        content: `<div class="card"><iframe src="https://map.purpleair.com/air-quality-standards-us-epa-aqi?select=190049#11/12.68/101.25"></iframe></div>`
    },
    earthquakeReports: {
        title: "รายงานแผ่นดินไหว",
        content: `<div class="card"><iframe src="https://earthquake.tmd.go.th/"></iframe></div>`
    }
};

// --- 3. Radar Logic ---
window.switchRadar = (station, btn) => {
    if(btn) {
        document.querySelectorAll('.radar-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    const display = document.getElementById('radar-display');
    let data = { s: 'https://semet.uk/latest/RYGLatest.jpg', l: 'https://semet.uk/loop/RYGLoop.gif', c: '' };
    
    switch(station) {
        case 'ryg-e':
            data = { s: 'https://weather.tmd.go.th/ryg/ryg240_HQ_latest.gif', l: 'https://weather.tmd.go.th/ryg/ryg240LoopHQ.gif', c: 'focus-east' };
            break;
        case 'svp':
            data = { s: 'https://weather.tmd.go.th/svp/svp240_HQ_latest.gif', l: 'https://weather.tmd.go.th/svp/svp240LoopHQ.gif', c: '' };
            break;
        case 'skm':
            data = { s: 'https://weather.tmd.go.th/skm/skm240_HQ_latest.gif', l: 'https://weather.tmd.go.th/skm/skm240LoopHQ.gif', c: '' };
            break;
        default:
            data = { s: 'https://semet.uk/latest/RYGLatest.jpg', l: 'https://semet.uk/loop/RYGLoop.gif', c: '' };
    }

    display.innerHTML = `
        <div class="radar-grid">
            <div class="radar-zoom-wrap ${data.c}"><img src="${data.s}?t=${Date.now()}" alt="Static"></div>
            <div class="radar-zoom-wrap ${data.c}"><img src="${data.l}?t=${Date.now()}" alt="Loop"></div>
        </div>`;
};

// --- 4. Water Level Logic (New Async Implementation) ---

function initWaterData() {
    const dates = [];
    for (let i = 0; i < 4; i++) {
        let d = new Date();
        d.setDate(d.getDate() - i);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear() + 543; 
        dates.push(`${dd}/${mm}/${yyyy}`);
    }
    dates.reverse();

    // วาดตารางเปล่าทันที เพื่อไม่ให้หน้าจอค้าง
    renderSkeletonTable(dates);
    document.getElementById('water-loading').style.display = 'none';
    document.getElementById('water-display-area').style.display = 'block';
    if(document.getElementById('water-date-label')) 
        document.getElementById('water-date-label').innerText = `ช่วงเวลา: ${dates[0]} - ${dates[3]}`;

    // ทยอยดึงข้อมูลทีละวัน (Non-blocking)
    dates.forEach((dateStr, index) => {
        fetchWaterByDay(dateStr, index);
    });
}

function renderSkeletonTable(dates) {
    const head = document.getElementById('water-table-head');
    const body = document.getElementById('water-table-body');
    
    let hHtml = `<tr><th rowspan="2" class="time-column">เวลา</th>`;
    dates.forEach(d => hHtml += `<th colspan="2" class="date-row-header">${d}</th>`);
    hHtml += `</tr><tr>`;
    dates.forEach(() => hHtml += `<th class="sub-h">ม.รสม.</th><th class="sub-h">Q</th>`);
    hHtml += `</tr>`;
    head.innerHTML = hHtml;

    let bHtml = '';
    for (let h = 1; h <= 24; h++) {
        bHtml += `<tr><td class="time-column">${h}:00</td>`;
        dates.forEach((_, dIdx) => {
            bHtml += `<td id="wl-${dIdx}-${h}">-</td><td id="q-${dIdx}-${h}">-</td>`;
        });
        bHtml += `</tr>`;
    }
    body.innerHTML = bHtml;
}

async function fetchWaterByDay(dateStr, dayIdx) {
    const params = new URLSearchParams({
        'DW[StationGroupID]': '690',
        'DW[TimeCurrent]': dateStr,
        'rows': '100'
    });
    // ใช้ Proxy แบบดึงตรง (Raw) เพื่อเลี่ยงการค้างที่ JSON Contents
    const proxy = "https://api.allorigins.win/raw?url=";
    const target = `https://hyd-app.rid.go.th/webservice/getGroupHourlyWaterLevelReportHL.ashx?${params.toString()}`;

    try {
        const response = await fetch(proxy + encodeURIComponent(target));
        const data = await response.json();
        
        if (data && data.rows) {
            data.rows.forEach(row => {
                const h = parseInt(row.hourlytime);
                const wlCell = document.getElementById(`wl-${dayIdx}-${h}`);
                const qCell = document.getElementById(`q-${dayIdx}-${h}`);
                
                if (wlCell && row.wlvalues1) {
                    wlCell.innerText = parseFloat(row.wlvalues1).toFixed(2);
                    wlCell.style.color = "var(--water-green)";
                    wlCell.style.fontWeight = "bold";
                }
                if (qCell && row.qvalues1) {
                    qCell.innerText = row.qvalues1;
                    qCell.style.color = "var(--water-orange)";
                }
            });
        }
    } catch (e) {
        console.warn(`Load failed for ${dateStr}`);
    }
}

// --- 5. Utilities & Counters ---

function startWaterTimer() {
    clearInterval(waterRefreshTimer);
    timeLeft = 300;
    const timerText = document.getElementById('timer-text');
    waterRefreshTimer = setInterval(() => {
        timeLeft--;
        let mins = Math.floor(timeLeft / 60);
        let secs = timeLeft % 60;
        if(timerText) timerText.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        if(timeLeft <= 0) { initWaterData(); timeLeft = 300; }
    }, 1000);
}

async function initVisitorCounter() {
    const vCount = document.getElementById('v-count');
    const siteKey = "tapma-basin-hub-2026"; 
    try {
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.countapi.xyz/hit/'+siteKey+'/visits')}`);
        const data = await res.json();
        animateValue(vCount, 0, data.value, 1500);
    } catch (e) {
        vCount.innerText = "1,204"; 
    }
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// --- 6. Event Listeners ---
document.querySelectorAll('.hex-group').forEach(group => {
    group.addEventListener('click', () => {
        const key = group.dataset.page;
        if (pages[key]) {
            panelTitle.innerText = pages[key].title;
            panelContent.innerHTML = pages[key].content;
            panel.classList.add('open');
            app.classList.add('panel-open');
            if (key === 'waterLevel') initWaterData(), startWaterTimer();
            if (key === 'rainRadar') setTimeout(() => switchRadar('ryg'), 100);
        }
    });
});

closeBtn.onclick = () => {
    panel.classList.remove('open');
    app.classList.remove('panel-open');
    clearInterval(waterRefreshTimer);
};

window.updateTideImage = (url) => {
    const img = document.getElementById('current-tide-img');
    if(img) { img.style.opacity = '0'; setTimeout(() => { img.src = url; img.style.opacity = '1'; }, 200); }
};

// Start Services
initVisitorCounter();