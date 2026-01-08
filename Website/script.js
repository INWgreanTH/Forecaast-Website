// --- 1. การกำหนดตัวแปรพื้นฐานและการเชื่อมต่อ DOM ---
const app = document.getElementById('app');
const panel = document.getElementById('panel');
const panelContent = document.getElementById('panel-content');
const panelTitle = document.getElementById('panel-title');
const closeBtn = document.getElementById('close');

// --- 2. ฐานข้อมูลเนื้อหาของแต่ละหมวดหมู่ ---
const pages = {
    rainRadar: {
        title: "Rain Radar - Rayong Station",
        content: `
            <div class="dual-grid">
                <div class="card"><h3>📡 Latest Static</h3><img src="https://semet.uk/latest/RYGLatest.jpg?t=${new Date().getTime()}" class="radar-loop-img"></div>
                <div class="card"><h3>🔄 Latest Loop</h3><img src="https://semet.uk/loop/RYGLoop.gif?t=${new Date().getTime()}" class="radar-loop-img"></div>
            </div>
            <div class="card"><h3>🌊 KU Flood Monitoring</h3><iframe src="https://ryradar4flood.eng.ku.ac.th/r4fry/pages/situation/situation_urbs.php"></iframe></div>`
    },
    waterLevel: {
        title: "สถานี Z.38 (บ้านเขาโบสถ์) - คลองทับมา",
        content: `
            <div class="water-container">
                <div class="water-header-section">
                    <p style="color: #888; font-size: 0.9rem; margin-bottom: 10px;">รายงานระดับน้ำและปริมาณน้ำย้อนหลัง 4 วัน (ระบบโทรมาตร)</p>
                </div>
                <div id="water-loading" class="water-status">📡 กำลังเชื่อมต่อฐานข้อมูลกรมชลประทาน...</div>
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
        title: "ระดับน้ำทะเล (ปากน้ำระยอง)",
        content: `
            <div class="card">
                <div class="tide-grid-container">
                    ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'].map((m, i) => 
                        `<button class="tide-btn" onclick="updateTideImage('https://img2.pic.in.th/PakNamRayong_Page_${String(i+1).padStart(2,'0')}.jpg')">${m}</button>`).join('')}
                </div>
                <div class="tide-viewer"><img id="current-tide-img" src="https://img2.pic.in.th/PakNamRayong_Page_01.jpg" class="tide-img-fluid"></div>
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

// --- 3. ฟังก์ชันหลักสำหรับดึงข้อมูลระดับน้ำ (แก้ปัญหาปี พ.ศ.) ---
async function initWaterData() {
    const loadingEl = document.getElementById('water-loading');
    const displayArea = document.getElementById('water-display-area');
    const stationId = '690'; // ID สถานี Z.38
    
    // สร้างรายการวันที่ย้อนหลัง 4 วัน โดยใช้ปี พ.ศ. (ค.ศ. + 543)
    const dates = [];
    for (let i = 0; i < 4; i++) {
        let d = new Date();
        d.setDate(d.getDate() - i);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const yearThai = d.getFullYear() + 543; // แปลงเป็น 2569
        dates.push(`${day}/${month}/${yearThai}`);
    }
    const targetDates = dates.reverse();

    try {
        const results = await Promise.all(targetDates.map(async (dateStr) => {
            const formData = new URLSearchParams();
            formData.append('DW[StationGroupID]', stationId);
            formData.append('DW[TimeCurrent]', dateStr);

            const response = await fetch('https://hyd-app.rid.go.th/webservice/getGroupHourlyWaterLevelReportHL.ashx', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            return { date: dateStr, rows: data.rows || [] };
        }));

        // สร้างส่วนหัวของตาราง (Header)
        let hHtml = `<tr><th rowspan="2" class="time-column">เวลา</th>`;
        results.forEach(res => hHtml += `<th colspan="2" class="date-row-header">${res.date}</th>`);
        hHtml += `</tr><tr>`;
        results.forEach(() => hHtml += `<th class="sub-h">ระดับน้ำ (ม.)</th><th class="sub-h">ปริมาณน้ำ</th>`);
        document.getElementById('water-table-head').innerHTML = hHtml;

        // สร้างแถวข้อมูล 24 ชั่วโมง พร้อมใส่สีเขียว-ส้ม
        let bHtml = '';
        for (let i = 1; i <= 24; i++) {
            let hourStr = i.toFixed(2);
            bHtml += `<tr><td class="time-column">${i}:00</td>`;
            results.forEach(day => {
                const row = day.rows.find(r => r.hourlytime === hourStr);
                if (row) {
                    bHtml += `<td class="val-wl">${row.wlvalues1.toFixed(2)}</td>`; // สีเขียว
                    bHtml += `<td class="val-q">${row.qvalues1.toFixed(2)}</td>`;   // สีส้ม
                } else {
                    bHtml += `<td>-</td><td>-</td>`;
                }
            });
            bHtml += `</tr>`;
        }
        document.getElementById('water-table-body').innerHTML = bHtml;
        
        loadingEl.style.display = 'none';
        displayArea.style.display = 'block';

    } catch (error) {
        console.error("Water Data Error:", error);
        loadingEl.innerHTML = `❌ ไม่สามารถโหลดข้อมูลได้ <br><small>กรุณาเปิดการใช้งานผ่าน Hosting หรือใช้ Extension Allow CORS</small>`;
    }
}

// --- 4. การจัดการเหตุการณ์ (Event Handling) ---
document.querySelectorAll('.hex-group').forEach(group => {
    group.addEventListener('click', () => {
        const key = group.dataset.page;
        const data = pages[key];
        if (!data) return;

        panelTitle.innerText = data.title;
        panelContent.innerHTML = data.content;
        panel.classList.add('open');
        app.classList.add('panel-open');

        // หากคลิกที่หมวด WATER ให้เริ่มดึงข้อมูล
        if (key === 'waterLevel') {
            setTimeout(initWaterData, 400); 
        }
    });
});

closeBtn.addEventListener('click', () => {
    panel.classList.remove('open');
    app.classList.remove('panel-open');
    panelContent.innerHTML = ''; 
});

window.updateTideImage = (url) => {
    const img = document.getElementById('current-tide-img');
    if(img) {
        img.style.opacity = '0';
        setTimeout(() => { img.src = url; img.style.opacity = '1'; }, 200);
    }
};