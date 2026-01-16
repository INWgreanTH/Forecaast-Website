/**
 * Tap Ma Basin Hub - Integrated Live Portal Script
 * Year: 2569 BE / 2026 AD
 * Implementation: Z.38 (Ban Khao Bot) Real-time Monitoring
 */

// --- 1. Global DOM Connections ---
const app = document.getElementById('app');
const panel = document.getElementById('panel');
const panelContent = document.getElementById('panel-content');
const panelTitle = document.getElementById('panel-title');
const closeBtn = document.getElementById('close');

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
        title: "ระดับน้ำในคลองทับมา (RID Real-time)",
        content: `
            <div class="card" style="height: 75vh; padding: 0; overflow: hidden;">
                <div style="background: #1a1a1a; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.8rem; color: var(--accent);">Source: กรมชลประทาน (hyd-app.rid.go.th)</span>
                    <button class="radar-btn" onclick="refreshWaterIframe()" style="font-size: 0.7rem; padding: 5px 10px;">🔄 REFRESH</button>
                </div>
                <iframe 
                    id="rid-iframe"
                    src="https://hyd-app.rid.go.th/hydro6h.html" 
                    style="width: 100%; height: 100%; border: none; background: white;"
                ></iframe>
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

// --- 3. Radar Logic (Station Switcher) ---
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
        default: // 'ryg' local
            data = { s: 'https://semet.uk/latest/RYGLatest.jpg', l: 'https://semet.uk/loop/RYGLoop.gif', c: '' };
    }

    display.innerHTML = `
        <div class="radar-grid">
            <div class="radar-zoom-wrap ${data.c}">
                <img src="${data.s}?t=${Date.now()}" alt="Static Radar">
            </div>
            <div class="radar-zoom-wrap ${data.c}">
                <img src="${data.l}?t=${Date.now()}" alt="Loop Radar">
            </div>
        </div>
        <div style="text-align:center; margin-top:10px; font-size:0.8rem; color:#666;">
            สถานะภาพ: อัปเดตล่าสุดทุก 5 นาทีอัตโนมัติ
        </div>`;
};

window.refreshWaterIframe = () => {
    const frame = document.getElementById('rid-iframe');
    if(frame) frame.src = frame.src;
}

// --- 5. Navigation & UI Listeners ---
document.querySelectorAll('.hex-group').forEach(group => {
    group.addEventListener('click', () => {
        const key = group.dataset.page;
        if (pages[key]) {
            panelTitle.innerText = pages[key].title;
            panelContent.innerHTML = pages[key].content;
            panel.classList.add('open');
            app.classList.add('panel-open');
            
            // Context-specific Initialization
            if (key === 'waterLevel') setTimeout(initWaterData, 100);
            if (key === 'rainRadar') setTimeout(() => switchRadar('ryg'), 100);
        }
    });
});

closeBtn.onclick = () => {
    panel.classList.remove('open');
    app.classList.remove('panel-open');
    panelContent.innerHTML = '';
};

window.updateTideImage = (url) => {
    const img = document.getElementById('current-tide-img');
    if(img) {
        img.style.opacity = '0';
        setTimeout(() => { img.src = url; img.style.opacity = '1'; }, 200);
    }
};