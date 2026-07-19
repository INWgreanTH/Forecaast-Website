/**
 * Tap Ma Basin Hub — script.js
 * Year: 2569 BE / 2026 AD
 */

// ============================================================
// 0. Config
// ============================================================
const CONFIG = {
    WAQI_TOKEN:        'demo',    // ลงทะเบียนฟรี: https://aqicn.org/api/
    THAIWATER_TOKEN:   '',        // ลงทะเบียนฟรี: standard.thaiwater.net (ใส่ token ที่นี่เพื่อรับข้อมูลจริง)
    TICKER_REFRESH_MS: 300000,    // refresh ทุก 5 นาที
    TICKER_PX_PER_SEC: 45,        // ความเร็วแถบวิ่ง (px/s)
    RADAR_AUTO_REFRESH_MS: 300000,// refresh ภาพเรดาร์อัตโนมัติทุก 5 นาที
};

// เก็บค่า API ไว้ใช้ร่วมกับกราฟ
window.latestRain = 0;
window.latestAQI = 30;
window.latestWaterLevel = null;

// ============================================================
// 1. DOM refs
// ============================================================
const app          = document.getElementById('app');
const panel        = document.getElementById('panel');
const panelContent = document.getElementById('panel-content');
const panelTitle   = document.getElementById('panel-title');
const closeBtn     = document.getElementById('close');
const hoverLabel   = document.getElementById('hover-label');

// ============================================================
// 2. Page content (โหมด Iframe + โหมด Dashboard)
// ============================================================
const MONTHS = [
    {n:'ม.ค.',u:'Jan.png'},{n:'ก.พ.',u:'Feb.png'},{n:'มี.ค.',u:'March.png'},
    {n:'เม.ย.',u:'Apr.png'},{n:'พ.ค.',u:'May.png'},{n:'มิ.ย.',u:'Jun.png'},
    {n:'ก.ค.',u:'July.png'},{n:'ส.ค.',u:'Aug.png'},{n:'ก.ย.',u:'Sep.png'},
    {n:'ต.ค.',u:'Oct.png'},{n:'พ.ย.',u:'Nov.png'},{n:'ธ.ค.',u:'Dec.png'}
];

const currentMonthIdx = new Date().getMonth();

const pages = {
    rainRadar: {
        title: "Radar Monitoring System",
        content: `
            <div class="card">
                <div class="radar-toolbar">
                    <button class="radar-btn active" data-station="ryg"   onclick="switchRadar('ryg',this)">ระยอง</button>
                    <button class="radar-btn"         data-station="ryg-e" onclick="switchRadar('ryg-e',this)">ภาคตะวันออก</button>
                    <button class="radar-btn"         data-station="svp"   onclick="switchRadar('svp',this)">สุวรรณภูมิ</button>
                    <button class="radar-btn"         data-station="skm"   onclick="switchRadar('skm',this)">สมุทรสงคราม</button>
                    <button class="radar-btn"         data-station="kkw"   onclick="switchRadar('kkw',this)">นครนายก</button>
                    <button class="radar-btn"         data-station="windy" onclick="switchRadar('windy',this)">🌐 Windy</button>
                </div>
                <div id="radar-display" style="margin-top:20px;"></div>
            </div>`
    },
    waterLevel: {
        title: "ระดับน้ำในคลองทับมา (RID Real-time)",
        content: `
            <div class="card" style="height:75vh;padding:0;overflow:hidden;">
                <div style="background:#1a1a1a;padding:10px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:0.8rem;color:var(--accent);">Source: กรมชลประทาน</span>
                    <button class="radar-btn" onclick="refreshWaterIframe()" style="font-size:0.7rem;padding:5px 10px;">🔄 REFRESH</button>
                </div>
                <iframe id="rid-iframe" src="https://hyd-app.rid.go.th/hydro6h.html" style="width:100%;height:100%;border:none;background:white;"></iframe>
            </div>`
    },
    airQualityPM25: {
        title: "คุณภาพอากาศ PM 2.5",
        content: `<div class="card"><iframe src="https://map.purpleair.com/air-quality-standards-us-epa-aqi?select=190049#11/12.68/101.25"></iframe></div>`
    },
    rainForecast: {
        title: "พยากรณ์อากาศรายชั่วโมง — Rayong",
        content: `<div class="card"><iframe src="https://www.yr.no/en/content/2-7735915/table.html" title="พยากรณ์อากาศ YR.no ระยอง"></iframe></div>`
    },
    cctvMonitor: {
        title: "CCTV River & Highway Surveillance",
        content: `
            <div class="card" style="height:75vh;padding:15px;overflow-y:auto;background:#0b0b0c;">
                <div class="cctv-header">
                    <span style="color:#ff4444;font-weight:800;">🔴 LIVE CCTVs</span>
                    <span style="color:var(--accent);font-family:monospace;font-size:0.8rem;">RAYONG MUNICIPALITY</span>
                </div>
                <div class="cctv-grid" id="cctv-grid-container"></div>
            </div>`
    },
    seaTides: {
        title: "ระดับน้ำทะเล (ปากน้ำระยอง) ปี 2569",
        content: `
            <div class="card">
                <div class="tide-view-toggle">
                    <button class="tide-view-btn active" onclick="switchTideView('table',this)">📋 ตารางน้ำ</button>
                    <button class="tide-view-btn" onclick="switchTideView('chart',this)">📈 กราฟพยากรณ์</button>
                </div>
                <div id="tide-table-view">
                    <div class="tide-grid-container">
                        ${MONTHS.map((m, i) =>
                            `<button class="tide-btn${i === currentMonthIdx ? ' active' : ''}"
                                     onclick="selectTide(this,'${m.u}')">${m.n}</button>`
                        ).join('')}
                    </div>
                    <div class="tide-viewer">
                        <img id="current-tide-img" src="${MONTHS[currentMonthIdx].u}" class="tide-img-fluid"
                             alt="ตารางน้ำขึ้นน้ำลงเดือน${MONTHS[currentMonthIdx].n}"
                             onerror="this.src='https://placehold.co/800x600/111a24/555?text=ไม่พบไฟล์รูปภาพ'">
                    </div>
                </div>
                <div id="tide-chart-view" style="display:none;">
                    <iframe src="tides-forecast.html" style="width:100%;height:70vh;border:none;border-radius:8px;background:#080808;" loading="lazy"></iframe>
                </div>
            </div>`
    },
    summaryDashboard: {
        title: "📊 กราฟสรุปสถานการณ์ (Data Visualization)",
        content: `
            <div class="card" style="padding:20px; background:#0b0b0c; margin-bottom:20px;">
                <div id="water-summary-box" style="padding:15px; border-radius:10px; margin-bottom:15px; border:1px solid #00d2ff; background:rgba(0, 210, 255, 0.08);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <h3 style="color:#00d2ff; margin:0; font-size:1.1rem;">🌊 สรุปสถานการณ์น้ำ Z.38 คลองทับมา</h3>
                        <span id="water-data-badge" style="font-size:0.68rem; padding:3px 9px; border-radius:20px; background:rgba(0,210,255,0.15); color:#00d2ff; white-space:nowrap; flex-shrink:0; margin-left:8px;">⏳ กำลังโหลด...</span>
                    </div>
                    <p id="water-summary-text" style="font-size:0.95rem; color:#fff;">กำลังประมวลผล...</p>
                    <p style="font-size:0.72rem; color:#555; margin-top:8px;">
                        📎 ข้อมูลจริง: <a href="https://hyd-app.rid.go.th/hydro6h.html" target="_blank" rel="noopener" style="color:#00d2ff; opacity:0.65;">กรมชลประทาน hyd-app.rid.go.th</a>
                    </p>
                </div>
                <div style="position: relative; height:30vh; width:100%;"><canvas id="waterChart"></canvas></div>
            </div>

            <div class="card" style="padding:15px; background:#fff; border-radius:10px;">
                <h3 style="color:#333; margin-bottom:10px; font-size:1.1rem; border-bottom:1px solid #eee; padding-bottom:10px;">
                    🌤️ พยากรณ์อากาศล่วงหน้า (MET Norway)
                </h3>
                <div style="position: relative; height:35vh; width:100%; display: flex; justify-content: center; align-items: center; overflow:hidden;">
                    <img 
                        src="https://www.yr.no/en/content/2-7735915/meteogram.svg" 
                        alt="Meteogram Rayong YR.no"
                        style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
            </div>`
    }
};

// ============================================================
// 3. Radar & Tides
// ============================================================
let radarRefreshTimer = null;

const RADAR_STATIONS = {
    'ryg':   { s: 'https://semet.uk/latest/RYGLatest.jpg',                l: 'https://semet.uk/loop/RYGLoop.gif',                c: '' },
    'ryg-e': { s: 'https://weather.tmd.go.th/ryg/ryg240_latest.jpg',      l: 'https://weather.tmd.go.th/ryg/rygloop.gif',        c: '' },
    'svp':   { s: 'https://weather.tmd.go.th/svp/svp240_latest.jpg',      l: 'https://weather.tmd.go.th/svp/svploop.gif',        c: '' },
    'skm':   { s: 'https://weather.tmd.go.th/skm/skm240_latest.jpg',      l: 'https://weather.tmd.go.th/skm/skmloop.gif',        c: 'focus-skm' },
    'kkw':   { s: 'https://weather.tmd.go.th/kkw/kkw240_latest.jpg',      l: 'https://weather.tmd.go.th/kkw/kkwLoop.gif',        c: '' },
};

const WINDY_SRC = 'https://embed.windy.com/embed2.html?lat=12.68&lon=101.28&zoom=8&level=surface&overlay=radar&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&detailLat=12.68&detailLon=101.28&metricWind=default&metricTemp=default&radarRange=-1';

window.switchRadar = (station, btn) => {
    if (btn) {
        document.querySelectorAll('.radar-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    const display = document.getElementById('radar-display');
    if (!display) return;

    clearInterval(radarRefreshTimer);

    if (station === 'windy') {
        display.innerHTML = `
            <div style="position:relative;width:100%;padding-top:62%;border-radius:8px;overflow:hidden;">
                <iframe src="${WINDY_SRC}"
                    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"
                    allowfullscreen loading="lazy"></iframe>
            </div>
            <p class="radar-note">แหล่งข้อมูล: Windy.com — Interactive · อัปเดตอัตโนมัติ</p>`;
        return;
    }

    const data = RADAR_STATIONS[station] || RADAR_STATIONS['ryg'];
    const ts   = Date.now();

    display.innerHTML = `
        <div class="radar-grid">
            <div class="radar-zoom-wrap ${data.c}">
                <img src="${data.s}?t=${ts}" alt="เรดาร์ภาพนิ่ง" loading="lazy"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div class="radar-error" style="display:none;">⚠️ โหลดภาพไม่ได้</div>
            </div>
            <div class="radar-zoom-wrap ${data.c}">
                <img src="${data.l}?t=${ts}" alt="เรดาร์ภาพเคลื่อนไหว" loading="lazy"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div class="radar-error" style="display:none;">⚠️ โหลดภาพไม่ได้</div>
            </div>
        </div>
        <p class="radar-note">อัปเดตทุก 5 นาที — คลิกรูปเพื่อขยาย</p>`;

    display.querySelectorAll('img').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => window.open(img.src.split('?')[0], '_blank'));
    });

    radarRefreshTimer = setInterval(() => {
        const activeBtn = document.querySelector('.radar-btn.active');
        if (activeBtn) switchRadar(activeBtn.dataset.station || station, null);
    }, CONFIG.RADAR_AUTO_REFRESH_MS);
};

window.refreshWaterIframe = () => {
    const frame = document.getElementById('rid-iframe');
    if (frame) frame.src = frame.src;
};

window.selectTide = (btn, filename) => {
    document.querySelectorAll('.tide-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const img = document.getElementById('current-tide-img');
    if (!img) return;
    img.style.opacity = '0';
    setTimeout(() => {
        img.src = filename;
        img.alt = `ตารางน้ำขึ้นน้ำลง ${filename}`;
        img.style.opacity = '1';
    }, 200);
};

window.switchTideView = (view, btn) => {
    document.querySelectorAll('.tide-view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tableView = document.getElementById('tide-table-view');
    const chartView = document.getElementById('tide-chart-view');
    if (!tableView || !chartView) return;
    if (view === 'chart') {
        tableView.style.display = 'none';
        chartView.style.display = 'block';
    } else {
        chartView.style.display = 'none';
        tableView.style.display = 'block';
    }
};

// ============================================================
// 4. CCTV
// ============================================================
const CCTV_SOURCES = [
    { url: 'https://stream1.ioc.pattaya.go.th/live/RC-025.m3u8',                                                  label: 'ถ.สุขุมวิท พัทยา' },
    { url: 'https://streaming2.highwaytraffic.go.th/Phase12/PER_12_022.stream/playlist.m3u8',                     label: 'ถ.สาย36 ขาเข้า ต.โป่ง' },
    { url: 'https://streaming2.highwaytraffic.go.th/Phase11/PER_11_030.stream/playlist.m3u8',                     label: 'ถ.สาย331 ห้วยใหญ่ เหนือ' },
    { url: 'https://streaming2.highwaytraffic.go.th/P16/PER_16_013.stream/playlist.m3u8',                         label: 'ถ.สาย331 พลูตาหลวง ใต้' },
    { url: 'https://streaming2.highwaytraffic.go.th/Phase12/PER_12_028.stream/playlist.m3u8',                     label: 'ถ.สาย3191 แยกนิคมฯ เหนือ' },
    { url: 'https://streaming2.highwaytraffic.go.th/P16/PER_16_016_OUT.stream/playlist.m3u8',                     label: 'ถ.สาย36 หนองบอน เข้าเมือง' },
    { url: 'https://streaming2.highwaytraffic.go.th/P16/PER_16_016_IN.stream/playlist.m3u8',                      label: 'ถ.สาย36 หนองบอน ออกเมือง' },
    { url: 'https://streaming1.highwaytraffic.go.th/Phase5/PER_5_003.stream/playlist.m3u8',                       label: 'ถ.สุขุมวิท มาบตาพุด' },
    { url: 'https://streaming2.highwaytraffic.go.th/Phase12/PER_12_029_IN.stream/playlist.m3u8',                  label: 'ถ.สาย3138 บ้านค่าย ขาเข้า' },
    { url: 'https://streaming2.highwaytraffic.go.th/Phase12/PER_12_029_OUT.stream/playlist.m3u8',                 label: 'ถ.สาย3138 บ้านค่าย ขาออก' },
    { url: 'https://telemetry.dwr.go.th/api/public/cctv/mjpegStream?stnCode=TA170203',                            label: 'ถ.ค.2 แยกโรงทราย' },
    { url: 'https://coastalradar.gistda.or.th/cctvlive/106503982638575697228475930513862621829/live.html',         label: 'หาดพยูน บ้านฉาง',     iframe: true, zoom: true },
    { url: 'https://coastalradar.gistda.or.th/cctvlive/153740451252623587407017825114242711603/live.html',         label: 'หาดแสงจันทร์ ปากน้ำ', iframe: true, zoom: true },
    { url: 'https://coastalradar.gistda.or.th/cctvlive/100352499133831682028641249087836640405/live.html',         label: 'ลานหินขาว ตะพง',      iframe: true, zoom: true },
    { url: 'https://coastalradar.gistda.or.th/cctvlive/116185462407234580845451996571834281111/live.html',         label: 'หาดแหลมแม่พิมพ์',     iframe: true, zoom: true }
];

let hlsInstances = [];

function destroyHLSInstances() {
    hlsInstances.forEach(hls => { try { hls.destroy(); } catch (_) {} });
    hlsInstances = [];
}

function initCCTVGrid() {
    destroyHLSInstances();
    const grid = document.getElementById('cctv-grid-container');
    if (!grid) return;
    grid.innerHTML = '';

    CCTV_SOURCES.forEach(src => {
        const wrap = document.createElement('div');
        wrap.className = 'cctv-player-wrap';
        if (src.zoom) wrap.classList.add('cctv-zoom20');

        const favStar = document.createElement('div');
        favStar.className    = 'fav-star';
        favStar.textContent  = '★';
        favStar.setAttribute('role',         'button');
        favStar.setAttribute('tabindex',     '0');
        favStar.setAttribute('aria-label',   `ปักหมุดกล้อง ${src.label}`);
        favStar.onclick = (e) => {
            e.stopPropagation();
            const fav = !wrap.classList.contains('is-fav');
            wrap.classList.toggle('is-fav', fav);
            favStar.setAttribute('aria-pressed', String(fav));
            if (fav) grid.prepend(wrap);
        };
        wrap.appendChild(favStar);

        const showOffline = (msg = '📵 กล้องออฟไลน์') => {
            if (wrap.querySelector('.cctv-offline')) return;
            const el = document.createElement('div');
            el.className   = 'cctv-offline';
            el.textContent = msg;
            wrap.insertBefore(el, wrap.querySelector('.cctv-label'));
        };

        const clearOffline = () => wrap.querySelector('.cctv-offline')?.remove();

        if (src.url.includes('.m3u8')) {
            const video = document.createElement('video');
            Object.assign(video, { muted: true, playsInline: true, autoplay: true, controls: true });

            // ลบ banner ออกทันทีที่วิดีโอเล่นได้จริง (HLS อาจ recover หลัง play() fail)
            video.addEventListener('playing', clearOffline, { once: true });

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src.url;
                video.play().catch(() => setTimeout(() => {
                    if (video.paused && video.readyState < 2) showOffline();
                }, 8000));
            } else if (window.Hls && Hls.isSupported()) {
                const hls = new Hls({ maxBufferLength: 10, liveSyncDurationCount: 3, debug: false });
                hls.loadSource(src.url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => {
                        // play() fail ครั้งแรก — รอให้ HLS buffer แล้ว retry
                        const tryPlay = () => {
                            if (!video.paused) return; // recover ได้เองแล้ว
                            if (video.readyState >= 2) {
                                video.play().catch(showOffline);
                            } else {
                                showOffline();
                            }
                        };
                        video.addEventListener('canplay', tryPlay, { once: true });
                        setTimeout(() => {
                            video.removeEventListener('canplay', tryPlay);
                            tryPlay();
                        }, 10000);
                    });
                });
                hls.on(Hls.Events.ERROR, (_, data) => {
                    if (!data.fatal) return;
                    const msg = data.details?.includes('demux') || data.type === 'mediaError'
                        ? '⚠️ รูปแบบวิดีโอไม่รองรับ'
                        : '📵 กล้องออฟไลน์';
                    showOffline(msg);
                });
                // ตรวจจับ DEMUXER_ERROR จาก video element โดยตรง
                video.addEventListener('error', () => {
                    const m = video.error?.message || '';
                    showOffline(m.includes('DEMUXER') || m.includes('PIPELINE')
                        ? '⚠️ รูปแบบวิดีโอไม่รองรับ'
                        : '📵 กล้องออฟไลน์');
                }, { once: true });
                hlsInstances.push(hls);
            } else { showOffline(); }
            wrap.appendChild(video);

        } else if (src.iframe) {
            const iframe = document.createElement('iframe');
            iframe.src = src.url; iframe.allowFullscreen = true;
            wrap.appendChild(iframe);

        } else if (src.url.includes('mjpegStream')) {
            const img  = document.createElement('img');
            img.src = src.url; img.onerror = showOffline;
            wrap.appendChild(img);
        }

        const label = document.createElement('div');
        label.className = 'cctv-label'; label.textContent = src.label;
        wrap.appendChild(label);
        grid.appendChild(wrap);
    });
}

// ============================================================
// 5. Data Visualization (Chart.js)
// ============================================================
let waterChartInstance = null;

// ── ระดับน้ำพื้นฐานตามฤดูกาล (ม.) สำหรับ Z.38 คลองทับมา ระยอง
// อิงจากข้อมูลจริง hyd-app.rid.go.th: พ.ค. ~0.60 ม., ช่วงน้ำหลาก ก.ย. ~1.35 ม.
const WATER_MONTHLY_BASE = [0.35, 0.28, 0.32, 0.48, 0.58, 0.88, 1.10, 1.22, 1.35, 1.18, 0.72, 0.45];

// คำนวณระดับน้ำปัจจุบัน (ม.) จากฤดูกาล + ฝนปัจจุบัน
function computeCurrentWaterEstimate(rainMm) {
    const month = new Date().getMonth();
    const hour  = new Date().getHours();
    const base  = WATER_MONTHLY_BASE[month];
    const rain  = Math.min((rainMm || 0) * 0.15, 0.80);
    const tidal = 0.04 * Math.sin((hour / 24) * 2 * Math.PI);
    return Math.max(0.10, base + rain + tidal);
}

// สร้างข้อมูล 7 ช่วงชั่วโมงย้อนหลัง (ประมาณการตามฤดูกาล + ฝน)
function buildEstimatedWaterData(rainMm) {
    const now   = new Date();
    const month = now.getMonth();
    const base  = WATER_MONTHLY_BASE[month];
    const obs   = [];
    let level   = base + Math.min((rainMm || 0) * 0.06, 0.30);

    for (let i = 6; i >= 0; i--) {
        const t    = new Date(now.getTime() - i * 3600000);
        const tid  = 0.04 * Math.sin((t.getHours() / 24) * 2 * Math.PI);
        level     += (Math.random() * 0.04 - 0.02) + tid * 0.3;
        if (i === 0) level += Math.min((rainMm || 0) * 0.12, 0.50);
        obs.push({ datetime: t.toISOString(), waterLevel: Math.max(0.10, level) });
    }

    return {
        metadata: { version: '1.0', dataProviderName: 'ประมาณการตามฤดูกาล + ฝนปัจจุบัน', waterDatatype: 'Water Level Observation' },
        station: [{ stationMetadata: { stationCode: 'Z.38', stationName: 'คลองทับมา', locationCode: '210103' }, observation: obs }],
        isEstimated: true
    };
}

// ลอง ThaiWater API ก่อน — ถ้าไม่ได้ก็ใช้ประมาณการ
async function fetchWaterLevelData(rainMm) {
    if (CONFIG.THAIWATER_TOKEN.trim()) {
        try {
            const now  = new Date();
            const from = new Date(now.getTime() - 6 * 3600000).toISOString();
            const url  = `https://api.thaiwater.net/api/v1/thaiwater/waterlevel/?station_id=Z.38&from=${from}&to=${now.toISOString()}`;
            const res  = await fetch(url, {
                headers: { 'Authorization': `Bearer ${CONFIG.THAIWATER_TOKEN}`, 'Accept': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                return { ...data, isEstimated: false };
            }
        } catch (e) { console.warn('[ThaiWater API]', e.message); }
    }
    return buildEstimatedWaterData(rainMm);
}

// กราฟน้ำ (async): ดึงข้อมูลจริงหรือประมาณการ แล้วแสดงผล
async function renderWaterChart(currentRain) {
    const ctx = document.getElementById('waterChart');
    if (!ctx) return;
    if (waterChartInstance) waterChartInstance.destroy();

    const apiData    = await fetchWaterLevelData(currentRain);
    const stationData = apiData.station[0];

    const labels = [], hourlyData = [];
    stationData.observation.forEach((obs, i) => {
        const h = String(new Date(obs.datetime).getHours()).padStart(2, '0');
        labels.push(i === stationData.observation.length - 1 ? 'ปัจจุบัน' : `${h}:00 น.`);
        hourlyData.push(+obs.waterLevel.toFixed(2));
    });

    const currentWater = hourlyData[hourlyData.length - 1];
    window.latestWaterLevel = currentWater;

    // อัปเดต badge แหล่งข้อมูล
    const badge = document.getElementById('water-data-badge');
    if (badge) {
        if (apiData.isEstimated) {
            badge.textContent = '📊 ประมาณการตามฤดูกาล';
            badge.style.background = 'rgba(255,204,0,0.15)';
            badge.style.color = '#ffcc00';
        } else {
            badge.textContent = '🔴 LIVE — ThaiWater API';
            badge.style.background = 'rgba(255,68,68,0.18)';
            badge.style.color = '#ff6b6b';
        }
    }

    // อัปเดต summary box
    const summaryBox  = document.getElementById('water-summary-box');
    const summaryText = document.getElementById('water-summary-text');
    const srcNote     = apiData.isEstimated ? ' <span style="font-size:0.78rem;color:#888;">(ประมาณการ)</span>' : '';

    if (currentWater >= 2.50) {
        summaryBox.style.borderColor = '#ff4444'; summaryBox.style.background = 'rgba(255,68,68,0.10)';
        summaryText.innerHTML = `⚠️ <b>วิกฤต:</b> ระดับน้ำ ${currentWater.toFixed(2)} ม.${srcNote} สูงเกินระดับตลิ่ง (2.50 ม.)<br>เสี่ยงน้ำท่วมล้นตลิ่งสูงมาก ควรเตรียมอพยพทันที`;
    } else if (currentWater >= 2.00) {
        summaryBox.style.borderColor = '#ffcc00'; summaryBox.style.background = 'rgba(255,204,0,0.10)';
        summaryText.innerHTML = `⚠️ <b>เฝ้าระวัง:</b> ระดับน้ำ ${currentWater.toFixed(2)} ม.${srcNote} ใกล้ระดับตลิ่ง (2.50 ม.)<br>ควรติดตามสถานการณ์และพยากรณ์อากาศอย่างใกล้ชิด`;
    } else {
        summaryBox.style.borderColor = '#00ff88'; summaryBox.style.background = 'rgba(0,255,136,0.10)';
        summaryText.innerHTML = `✅ <b>ปกติ:</b> ระดับน้ำ ${currentWater.toFixed(2)} ม.${srcNote} ต่ำกว่าระดับตลิ่ง (2.50 ม.)<br>ความจุคลองยังสามารถรับน้ำฝนได้อีก`;
    }

    const chartLabel = `ระดับน้ำ ${stationData.stationMetadata.stationName} (${stationData.stationMetadata.stationCode})`;
    const critLine   = Array(hourlyData.length).fill(2.50);

    waterChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: chartLabel,
                    data: hourlyData,
                    borderColor: '#00d2ff', backgroundColor: 'rgba(0,210,255,0.18)',
                    borderWidth: 3, fill: true, tension: 0.4,
                    borderDash: apiData.isEstimated ? [4, 3] : []
                },
                {
                    label: 'ระดับวิกฤตตลิ่ง (2.50 ม.)',
                    data: critLine,
                    borderColor: '#ff4444', borderDash: [5, 5], borderWidth: 2, fill: false, pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#fff', font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} ม.`
                    }
                }
            },
            scales: {
                y: { min: 0, max: 3.5, ticks: { color: '#aaa', callback: v => `${v.toFixed(1)} ม.` }, grid: { color: 'rgba(255,255,255,0.08)' } },
                x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.08)' } }
            }
        }
    });
}

// ============================================================
// 6. Navigation
// ============================================================
function openPage(key) {
    if (!pages[key]) return;
    panelTitle.textContent   = pages[key].title;
    panelContent.innerHTML   = pages[key].content;
    panel.classList.add('open');
    app.classList.add('panel-open');
    document.body.classList.add('panel-is-open');

    if (key === 'rainRadar')   setTimeout(() => switchRadar('ryg', document.querySelector('.radar-btn.active') || document.querySelector('.radar-btn')), 100);
    if (key === 'cctvMonitor') setTimeout(initCCTVGrid, 100);
    
    if (key === 'summaryDashboard') {
        setTimeout(async () => {
            await renderWaterChart(window.latestRain || 0);
        }, 100);
    }
}

function closePage() {
    panel.classList.remove('open');
    app.classList.remove('panel-open');
    document.body.classList.remove('panel-is-open');
    clearInterval(radarRefreshTimer);
    setTimeout(() => {
        panelContent.innerHTML = '';
        destroyHLSInstances();
        if (waterChartInstance) { waterChartInstance.destroy(); waterChartInstance = null; }
    }, 600);
}

document.querySelectorAll('.hex-group').forEach(group => {
    const label = group.dataset.label || '';
    group.addEventListener('mouseenter', () => { if (hoverLabel) hoverLabel.textContent = label; });
    group.addEventListener('mouseleave', () => { if (hoverLabel) hoverLabel.textContent = 'SELECT A CATEGORY'; });
    group.addEventListener('focus',      () => { if (hoverLabel) hoverLabel.textContent = label; });
    group.addEventListener('blur',       () => { if (hoverLabel) hoverLabel.textContent = 'SELECT A CATEGORY'; });

    group.addEventListener('click', () => openPage(group.dataset.page));
    group.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPage(group.dataset.page); }
    });
});

closeBtn.addEventListener('click', closePage);

// ============================================================
// 7. Help Modal & Ticker Config
// ============================================================
const helpBtn      = document.getElementById('help-btn');
const helpModal    = document.getElementById('help-modal');
const closeHelpBtn = document.getElementById('close-help');

if (helpBtn && helpModal && closeHelpBtn) {
    const openModal  = () => { helpModal.classList.add('active');    helpModal.querySelector('.close-modal-btn').focus(); };
    const closeModal = () => { helpModal.classList.remove('active'); helpBtn.focus(); };
    helpBtn.addEventListener('click',  openModal);
    closeHelpBtn.addEventListener('click', closeModal);
    helpModal.addEventListener('click', e => { if (e.target === helpModal) closeModal(); });
}

function calibrateTickerSpeed() {
    const move = document.getElementById('ticker-move');
    if (!move) return;
    const halfWidth = move.scrollWidth / 2;
    if (halfWidth < 100) return; // ยังไม่ render ครบ — คงค่า CSS default ไว้
    const duration = halfWidth / CONFIG.TICKER_PX_PER_SEC;
    move.style.animationDuration = `${duration.toFixed(1)}s`;
}

function updateTimestamp() {
    const el = document.getElementById('ticker-timestamp');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.title = `อัปเดตล่าสุด ${now.toLocaleString('th-TH')}`;
}

// ============================================================
// 8. Live Ticker fetch 
// ============================================================
async function fetchAndUpdateTicker() {
    try {
        const res  = await fetch('https://api.open-meteo.com/v1/forecast?latitude=12.6814&longitude=101.2816&current=temperature_2m,precipitation,weather_code');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d    = await res.json();
        const rain = d.current.precipitation;
        const temp = d.current.temperature_2m;
        
        window.latestRain = rain; 

        const text = rain > 0
            ? `🌧️ <strong style="color:#00d2ff;">สภาพอากาศระยอง:</strong> มีฝนตก ${rain} mm · ${temp}°C`
            : `🌤️ <strong style="color:#00d2ff;">สภาพอากาศระยอง:</strong> ท้องฟ้าโปร่ง · ${temp}°C`;
        ['ticker-weather-1', 'ticker-weather-2'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = text;
        });
    } catch (e) { console.warn('Weather API:', e.message); }

    try {
        const res  = await fetch(`https://api.waqi.info/feed/rayong/?token=${CONFIG.WAQI_TOKEN}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d    = await res.json();
        if (d.status !== 'ok') throw new Error(d.status);
        const aqi  = d.data.aqi;
        
        window.latestAQI = aqi; 

        const text = aqi > 150 ? `😷 <strong style="color:#ff4444;">PM 2.5:</strong> ${aqi} AQI — อันตรายต่อสุขภาพ`
                   : aqi > 100 ? `😷 <strong style="color:#ff4444;">PM 2.5:</strong> ${aqi} AQI — ควรสวมหน้ากาก`
                   : aqi > 50  ? `⚠️ <strong style="color:#ffcc00;">PM 2.5:</strong> ${aqi} AQI — คุณภาพอากาศปานกลาง`
                   :             `🍃 <strong style="color:#00ff88;">PM 2.5:</strong> ${aqi} AQI — คุณภาพอากาศดีมาก`;
        ['ticker-pm25-1', 'ticker-pm25-2'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = text;
        });
    } catch (e) { console.warn('AQI API:', e.message); }

    const wl = computeCurrentWaterEstimate(window.latestRain || 0);
    window.latestWaterLevel = wl;
    let waterText;
    if (wl >= 2.50) {
        waterText = `⚠️ <strong style="color:#ff4444;">ระดับน้ำ Z.38:</strong> ~${wl.toFixed(2)} ม. <span style="color:#ff4444;font-weight:700;">วิกฤต — เสี่ยงท่วม!</span>`;
    } else if (wl >= 2.00) {
        waterText = `⚠️ <strong style="color:#ffcc00;">ระดับน้ำ Z.38:</strong> ~${wl.toFixed(2)} ม. <span style="color:#ffcc00;">เฝ้าระวัง</span>`;
    } else {
        waterText = `📊 <strong style="color:#00d2ff;">ระดับน้ำ Z.38:</strong> ~${wl.toFixed(2)} ม. (ประมาณการ)`;
    }
    ['ticker-water-1', 'ticker-water-2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = waterText;
    });

    updateTimestamp();
    calibrateTickerSpeed();
}

window.addEventListener('load', calibrateTickerSpeed);
fetchAndUpdateTicker();
setInterval(fetchAndUpdateTicker, CONFIG.TICKER_REFRESH_MS);
setInterval(updateTimestamp, 1000);

// ============================================================
// 9. Dashboard Button Listener
// ============================================================
const dashboardBtn = document.getElementById('dashboard-btn');
if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => {
        openPage('summaryDashboard');
    });
}