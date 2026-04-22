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
    airQualityPM25: {
        title: "คุณภาพอากาศ PM 2.5",
        content: `<div class="card"><iframe src="https://map.purpleair.com/air-quality-standards-us-epa-aqi?select=190049#11/12.68/101.25"></iframe></div>`
    },
    rainForecast: {
        title: "พยากรณ์อากาศรายชั่วโมง - Rayong",
        content: `<div class="card"><iframe src="https://www.yr.no/en/content/2-7735915/table.html"></iframe></div>`
    },
    cctvMonitor: {
        title: "CCTV River & Highway Surveillance",
        content: `
            <div class="card" style="height: 75vh; padding: 15px; overflow-y: auto; background: #0b0b0c;">
                <div style="background: #1a1a1a; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 15px; border-radius: 8px;">
                    <span style="font-size: 0.85rem; color: #ff4444; font-weight: 800; animation: pulse 2s infinite;">🔴 LIVE CCTVs</span>
                    <span style="font-size: 0.8rem; color: var(--accent); font-family: monospace;">RAYONG MUNICIPALITY</span>
                </div>
                <div class="cctv-grid" id="cctv-grid-container"></div>
            </div>`
    },
    seaTides: {
        title: "ระดับน้ำทะเล (ปากน้ำระยอง) ปี 2569",
        content: `
            <div class="card">
                <div class="tide-grid-container">
                    ${[
                        {n:'ม.ค.', u:'Jan.png'},
                        {n:'ก.พ.', u:'Feb.png'},
                        {n:'มี.ค.', u:'March.png'},
                        {n:'เม.ย.', u:'Apr.png'},
                        {n:'พ.ค.', u:'May.png'},
                        {n:'มิ.ย.', u:'Jun.png'},
                        {n:'ก.ค.', u:'July.png'},
                        {n:'ส.ค.', u:'Aug.png'},
                        {n:'ก.ย.', u:'Sep.png'},
                        {n:'ต.ค.', u:'Oct.png'},
                        {n:'พ.ย.', u:'Nov.png'},
                        {n:'ธ.ค.', u:'Dec.png'}
                    ].map(m =>
                        `<button class="tide-btn" onclick="updateTideImage('${m.u}')">${m.n}</button>`
                    ).join('')}
                </div>
                <div class="tide-viewer">
                    <img id="current-tide-img" src="Jan.png" class="tide-img-fluid" onerror="this.src='https://via.placeholder.com/800x600?text=กำลังโหลดข้อมูล...'">
                </div>
            </div>`
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
        case 'ryg-e': data = { s: 'https://weather.tmd.go.th/ryg/ryg240_HQ_latest.gif', l: 'https://weather.tmd.go.th/ryg/ryg240LoopHQ.gif', c: 'focus-east' }; break;
        case 'svp': data = { s: 'https://weather.tmd.go.th/svp/svp240_HQ_latest.gif', l: 'https://weather.tmd.go.th/svp/svp240LoopHQ.gif', c: '' }; break;
        case 'skm': data = { s: 'https://weather.tmd.go.th/skm/skm240_HQ_latest.gif', l: 'https://weather.tmd.go.th/skm/skm240LoopHQ.gif', c: '' }; break;
        default: data = { s: 'https://semet.uk/latest/RYGLatest.jpg', l: 'https://semet.uk/loop/RYGLoop.gif', c: '' };
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
        <div style="text-align:center; margin-top:10px; font-size:0.8rem; color:#666;">สถานะภาพ: อัปเดตล่าสุดทุก 5 นาทีอัตโนมัติ</div>`;
};

window.refreshWaterIframe = () => {
    const frame = document.getElementById('rid-iframe');
    if(frame) frame.src = frame.src;
};

window.updateTideImage = (url) => {
    const img = document.getElementById('current-tide-img');
    if(img) {
        img.style.opacity = '0';
        setTimeout(() => { img.src = url; img.style.opacity = '1'; }, 200);
    }
};

// --- 4. CCTV Grid Logic ---
const CCTV_SOURCES = [
    { url: 'https://stream1.ioc.pattaya.go.th/live/RC-025.m3u8', label: 'ถ.สุขุมวิท พัทยา' },
    { url: 'https://streaming2.highwaytraffic.go.th/Phase12/PER_12_022.stream/playlist.m3u8', label: 'ถ.สาย36 ขาเข้า ต.โป่ง' },
    { url: 'https://streaming2.highwaytraffic.go.th/Phase11/PER_11_030.stream/playlist.m3u8', label: 'ถ.สาย331 ห้วยใหญ่ เหนือ' },
    { url: 'https://streaming2.highwaytraffic.go.th/P16/PER_16_013.stream/playlist.m3u8', label: 'ถ.สาย331 พลูตาหลวง ใต้' },
    { url: 'https://streaming2.highwaytraffic.go.th/Phase12/PER_12_028.stream/playlist.m3u8', label: 'ถ.สาย3191 แยกนิคมฯ เหนือ' },
    { url: 'https://streaming2.highwaytraffic.go.th/P16/PER_16_016_OUT.stream/playlist.m3u8', label: 'ถ.สาย36 หนองบอน เข้าเมือง' },
    { url: 'https://streaming2.highwaytraffic.go.th/P16/PER_16_016_IN.stream/playlist.m3u8', label: 'ถ.สาย36 หนองบอน ออกเมือง' },
    { url: 'https://streaming1.highwaytraffic.go.th/Phase5/PER_5_003.stream/playlist.m3u8', label: 'ถ.สุขุมวิท มาบตาพุด' },
    { url: 'https://streaming2.highwaytraffic.go.th/Phase12/PER_12_029_IN.stream/playlist.m3u8', label: 'ถ.สาย3138 บ้านค่าย ขาเข้า' },
    { url: 'https://streaming2.highwaytraffic.go.th/Phase12/PER_12_029_OUT.stream/playlist.m3u8', label: 'ถ.สาย3138 บ้านค่าย ขาออก' },
    { url: 'https://telemetry.dwr.go.th/api/public/cctv/mjpegStream?stnCode=TA170203', label: 'ถ.ค.2 แยกโรงทราย' },
    { url: 'https://coastalradar.gistda.or.th/cctvlive/106503982638575697228475930513862621829/live.html', label: 'หาดพยูน บ้านฉาง', iframe: true, zoom: true },
    { url: 'https://coastalradar.gistda.or.th/cctvlive/153740451252623587407017825114242711603/live.html', label: 'หาดแสงจันทร์ ปากน้ำ', iframe: true, zoom: true },
    { url: 'https://coastalradar.gistda.or.th/cctvlive/100352499133831682028641249087836640405/live.html', label: 'ลานหินขาว ตะพง', iframe: true, zoom: true },
    { url: 'https://coastalradar.gistda.or.th/cctvlive/116185462407234580845451996571834281111/live.html', label: 'หาดแหลมแม่พิมพ์', iframe: true, zoom: true }
];

function initCCTVGrid() {
    const grid = document.getElementById('cctv-grid-container');
    if (!grid) return;
    grid.innerHTML = ''; 

    CCTV_SOURCES.forEach(src => {
        const wrap = document.createElement('div');
        wrap.className = 'cctv-player-wrap';
        if (src.zoom) wrap.classList.add('cctv-zoom20');

        if (src.url.includes('.m3u8')) {
            const video = document.createElement('video');
            // บังคับ Mute และ Autoplay เพื่อให้เบราว์เซอร์อนุญาตให้เล่น
            video.muted = true;
            video.playsInline = true;
            video.autoplay = true;
            video.setAttribute('autoplay', '');
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            
            // เปิดให้ผู้ใช้กด Control (ขยายจอ) ได้
            video.controls = true; 
            
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // สำหรับ Safari / iOS
                video.src = src.url;
                video.addEventListener('loadedmetadata', () => {
                    video.play().catch(e => console.log("Native Autoplay prevented:", e));
                });
            } else if (window.Hls && Hls.isSupported()) {
                // สำหรับ Chrome / Edge / Firefox
                const hls = new Hls({ maxBufferLength: 10, liveSyncDurationCount: 3 });
                hls.loadSource(src.url);
                hls.attachMedia(video);
                
                // บังคับ Play ทันทีเมื่อ HLS จัดเตรียมไฟล์เสร็จ
                hls.on(Hls.Events.MANIFEST_PARSED, function() {
                    video.play().catch(e => console.log("HLS Autoplay prevented:", e));
                });
            }
            wrap.appendChild(video);
        } else if (src.iframe) {
            const iframe = document.createElement('iframe');
            iframe.src = src.url;
            iframe.allowFullscreen = true;
            wrap.appendChild(iframe);
        } else if (src.url.includes('mjpegStream')) {
            const img = document.createElement('img');
            img.src = src.url;
            img.alt = src.label;
            wrap.appendChild(img);
        }

        const label = document.createElement('div');
        label.className = 'cctv-label';
        label.textContent = src.label;
        wrap.appendChild(label);

        grid.appendChild(wrap);
    });
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
            
            if (key === 'waterLevel') setTimeout(initWaterData, 100);
            if (key === 'rainRadar') setTimeout(() => switchRadar('ryg'), 100);
            // เมื่อกดเข้าหน้า CCTV ให้รันฟังก์ชันโหลดกล้องทันที
            if (key === 'cctvMonitor') setTimeout(initCCTVGrid, 100);
        }
    });
});

closeBtn.onclick = () => {
    panel.classList.remove('open');
    app.classList.remove('panel-open');
    setTimeout(() => { panelContent.innerHTML = ''; }, 600);
};
