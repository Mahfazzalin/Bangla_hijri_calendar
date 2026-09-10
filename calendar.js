// ==========================================
// BANGLA & HIJRI CALENDAR v2.0
// Core Engine & UI Controller
// ==========================================
// Safe Polyfill for Chrome Extension APIs when previewing in browser
if (typeof chrome === 'undefined' || !chrome.storage) {
    const mockStorage = {};
    window.chrome = {
        storage: {
            local: {
                get: (keys, cb) => {
                    const res = {};
                    if (Array.isArray(keys)) {
                        keys.forEach(k => { res[k] = mockStorage[k]; });
                    } else if (typeof keys === 'string') {
                        res[keys] = mockStorage[keys];
                    }
                    if (cb) cb(res);
                },
                set: (obj, cb) => {
                    Object.assign(mockStorage, obj);
                    if (cb) cb();
                },
                remove: (keys, cb) => {
                    if (Array.isArray(keys)) keys.forEach(k => delete mockStorage[k]);
                    else delete mockStorage[keys];
                    if (cb) cb();
                }
            }
        },
        alarms: {
            create: () => {},
            clear: () => {}
        },
        action: {
            setBadgeText: () => {},
            setBadgeBackgroundColor: () => {}
        }
    };
}

// Global Constants
const banglaNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const banglaMonths = [
    'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
    'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
];

const banglaSeasons = [
    'গ্রীষ্মকাল', 'গ্রীষ্মকাল', 'বর্ষাকাল', 'বর্ষাকাল', 'শরৎকাল', 'শরৎকাল',
    'হেমন্তকাল', 'হেমন্তকাল', 'শীতকাল', 'শীতকাল', 'বসন্তকাল', 'বসন্তকাল'
];

const seasonIcons = [
    '🌸', '🌸', '🌧️', '🌧️', '🌾', '🌾',
    '🌫️', '🌫️', '❄️', '❄️', '🌺', '🌺'
];

const hijriMonths = [
    'মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল', 'জমাদিউস সানি',
    'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জ্বিলকদ', 'জ্বিলহজ্জ'
];

const dayHeaders = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

const CHROME_WEB_STORE_REVIEW_URL = 'https://chromewebstore.google.com/detail/ldfglpfjckkfmlmpoannflphoienphlm/reviews';

// Convert English numbers to Bangla numerals
function toBanglaNumber(num) {
    if (num === undefined || num === null) return '';
    return num.toString().split('').map(d => banglaNumbers[parseInt(d)] || d).join('');
}

// Check Gregorian leap year
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// ==========================================
// DATE CALCULATION ENGINE (Bangladesh Standard)
// ==========================================

// Calculate Bangla date using Bangla Academy 2019 Revision for Bangladesh
function getBanglaDate(date) {
    const d = new Date(date);
    const gYear = d.getFullYear();
    const gMonth = d.getMonth();
    const gDay = d.getDate();

    const bYear = (gMonth > 3 || (gMonth === 3 && gDay >= 14)) ? gYear - 593 : gYear - 594;
    const falgunGYear = bYear + 594;
    const falgunDays = isLeapYear(falgunGYear) ? 30 : 29;
    const monthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, falgunDays, 30];

    const dTime = new Date(gYear, gMonth, gDay, 12, 0, 0).getTime();
    const sTime = new Date(bYear + 593, 3, 14, 12, 0, 0).getTime();
    let diffDays = Math.round((dTime - sTime) / (1000 * 60 * 60 * 24));

    let bMonth = 0;
    while (bMonth < 12 && diffDays >= monthDays[bMonth]) {
        diffDays -= monthDays[bMonth];
        bMonth++;
    }

    return {
        day: diffDays + 1,
        month: bMonth,
        monthName: banglaMonths[bMonth],
        year: bYear,
        season: banglaSeasons[bMonth],
        seasonIcon: seasonIcons[bMonth],
        totalDaysInMonth: monthDays[bMonth]
    };
}

// Convert Bangla Date back to Gregorian Date object
function banglaToGregorian(bYear, bMonth, bDay) {
    const falgunGYear = bYear + 594;
    const falgunDays = isLeapYear(falgunGYear) ? 30 : 29;
    const monthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, falgunDays, 30];

    let totalDays = bDay - 1;
    for (let m = 0; m < bMonth; m++) {
        totalDays += monthDays[m];
    }

    const gDate = new Date(bYear + 593, 3, 14, 12, 0, 0);
    gDate.setDate(gDate.getDate() + totalDays);
    return gDate;
}

// Calculate Hijri date (calibrated for Bangladesh + 1 day adjustment + user offset)
function getHijriDate(date, offsetDays = 0) {
    const d = new Date(date);
    if (d.getHours() >= 18) {
        d.setDate(d.getDate() + 1);
    }
    d.setDate(d.getDate() + 1 + (parseInt(offsetDays) || 0));

    const gYear = d.getFullYear();
    const gMonth = d.getMonth() + 1;
    const gDay = d.getDate();

    const a = Math.floor((14 - gMonth) / 12);
    const y = gYear + 4800 - a;
    const m = gMonth + 12 * a - 3;

    const jdn = gDay + Math.floor((153 * m + 2) / 5) + 365 * y +
                Math.floor(y / 4) - Math.floor(y / 100) +
                Math.floor(y / 400) - 32045;

    let l = jdn - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    const j = (Math.floor((10985 - l) / 5316)) *
              (Math.floor((50 * l) / 17719)) +
              (Math.floor(l / 5670)) *
              (Math.floor((43 * l) / 15238));
    l = l - (Math.floor((30 - j) / 15)) *
        (Math.floor((17719 * j) / 50)) -
        (Math.floor(j / 16)) *
        (Math.floor((15238 * j) / 43)) + 29;

    const hMonth = Math.floor((24 * l) / 709);
    const hDay = l - Math.floor((709 * hMonth) / 24);
    const hYear = 30 * n + j - 30;

    return {
        day: hDay,
        month: hMonth - 1,
        year: hYear,
        monthName: hijriMonths[hMonth - 1]
    };
}

// Convert Hijri date to Gregorian Date (precise inverse of getHijriDate)
function hijriToGregorian(hYear, hMonth, hDay, offsetDays = 0) {
    offsetDays = parseInt(offsetDays) || 0;
    const approxGYear = Math.round(hYear * 0.970229 + 621.57);
    let testDate = new Date(approxGYear, hMonth, 15, 12, 0, 0);
    
    for (let iter = 0; iter < 5; iter++) {
        let h = getHijriDate(testDate, offsetDays);
        let diff = (hYear - h.year) * 354.367 + (hMonth - h.month) * 29.53 + (hDay - h.day);
        let shift = Math.round(diff);
        if (shift === 0) break;
        testDate.setTime(testDate.getTime() + shift * 86400000);
    }

    let bestDate = new Date(testDate);
    let minDiff = 999;
    for (let delta = -4; delta <= 4; delta++) {
        let cand = new Date(testDate.getTime() + delta * 86400000);
        let h = getHijriDate(cand, offsetDays);
        if (h.year === hYear && h.month === hMonth && h.day === hDay) {
            return cand;
        }
        let d = Math.abs((hYear - h.year) * 355 + (hMonth - h.month) * 30 + (hDay - h.day));
        if (d < minDiff) {
            minDiff = d;
            bestDate = cand;
        }
    }
    return bestDate;
}

// ==========================================
// PRAYER TIMES CALCULATION ENGINE
// ==========================================

const districtCoordinates = {
    dhaka: { name: 'ঢাকা', lat: 23.8103, lon: 90.4125 },
    chattogram: { name: 'চট্টগ্রাম', lat: 22.3569, lon: 91.7832 },
    sylhet: { name: 'সিলেট', lat: 24.8949, lon: 91.8687 },
    rajshahi: { name: 'রাজশাহী', lat: 24.3636, lon: 88.6241 },
    khulna: { name: 'খুলনা', lat: 22.8456, lon: 89.5403 },
    barishal: { name: 'বরিশাল', lat: 22.7010, lon: 90.3535 },
    rangpur: { name: 'রংপুর', lat: 25.7439, lon: 89.2752 },
    mymensingh: { name: 'ময়মনসিংহ', lat: 24.7471, lon: 90.4203 }
};

function calculatePrayerTimes(date, districtKey = 'dhaka') {
    const coords = districtCoordinates[districtKey] || districtCoordinates.dhaka;
    const lat = coords.lat;
    const lon = coords.lon;
    const tz = 6; // Bangladesh UTC+6

    const rad = Math.PI / 180;
    const deg = 180 / Math.PI;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;
    let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y +
             Math.floor(y / 4) - Math.floor(y / 100) +
             Math.floor(y / 400) - 32045 - 0.5;

    let d = jd - 2451545.0;

    let g = (357.529 + 0.98560028 * d) % 360;
    let q = (280.459 + 0.98564736 * d) % 360;
    let L0 = (q + 1.915 * Math.sin(g * rad) + 0.020 * Math.sin(2 * g * rad)) % 360;

    let e = 23.439 - 0.00000036 * d;
    let delta = Math.asin(Math.sin(e * rad) * Math.sin(L0 * rad));
    let RA = Math.atan2(Math.cos(e * rad) * Math.sin(L0 * rad), Math.cos(L0 * rad)) * deg;
    RA = (RA / 15 + 24) % 24;

    let eqt = (q / 15 - RA) * 60;
    while (eqt > 20) eqt -= 1440;
    while (eqt < -20) eqt += 1440;

    let solarNoon = 12 + tz - (lon / 15) - (eqt / 60);

    function hourAngle(alpha) {
        let cosH = (Math.sin(alpha * rad) - Math.sin(lat * rad) * Math.sin(delta)) /
                   (Math.cos(lat * rad) * Math.cos(delta));
        if (cosH > 1 || cosH < -1) return null;
        return Math.acos(cosH) * deg / 15;
    }

    let hFajr = hourAngle(-18);
    let hSun = hourAngle(-0.833);
    let hIsha = hourAngle(-18);

    // Asr (Hanafi: shadow length = 2)
    let asrAlt = Math.atan(1 / (2 + Math.tan(Math.abs(lat * rad - delta)))) * deg;
    let hAsr = hourAngle(asrAlt);

    function toTimeString(hoursDecimal) {
        if (!hoursDecimal) return '--:--';
        let totalMins = Math.round(hoursDecimal * 60);
        let h = Math.floor(totalMins / 60) % 24;
        let mins = totalMins % 60;
        let period = h >= 12 ? 'PM' : 'AM';
        let displayH = h % 12 || 12;
        return `${toBanglaNumber(displayH)}:${mins < 10 ? '০' : ''}${toBanglaNumber(mins)} ${period}`;
    }

    function toMinutes(hoursDecimal) {
        return Math.round(hoursDecimal * 60);
    }

    const fajrH = solarNoon - hFajr;
    const sunriseH = solarNoon - hSun;
    const dhuhrH = solarNoon + 2 / 60;
    const asrH = solarNoon + hAsr;
    const sunsetH = solarNoon + hSun;
    const maghribH = solarNoon + hSun + 3 / 60;
    const ishaH = solarNoon + hIsha;
    const sehriEndH = fajrH - 3 / 60;

    return {
        fajr: toTimeString(fajrH),
        sunrise: toTimeString(sunriseH),
        dhuhr: toTimeString(dhuhrH),
        asr: toTimeString(asrH),
        sunset: toTimeString(sunsetH),
        maghrib: toTimeString(maghribH),
        isha: toTimeString(ishaH),
        sehriEnd: toTimeString(sehriEndH),
        rawMinutes: {
            fajr: toMinutes(fajrH),
            sunrise: toMinutes(sunriseH),
            dhuhr: toMinutes(dhuhrH),
            asr: toMinutes(asrH),
            sunset: toMinutes(sunsetH),
            maghrib: toMinutes(maghribH),
            isha: toMinutes(ishaH),
            sehriEnd: toMinutes(sehriEndH)
        }
    };
}

// Find ongoing Waqt and time to next
function getWaqtStatus(prayerTimes) {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const raw = prayerTimes.rawMinutes;

    let current = 'ইশা';
    let nextName = 'ফজর';
    let nextTime = prayerTimes.fajr;
    let nextMins = raw.fajr;

    if (currentMins >= raw.fajr && currentMins < raw.sunrise) {
        current = 'ফজর';
        nextName = 'সূর্যোদয়';
        nextTime = prayerTimes.sunrise;
        nextMins = raw.sunrise;
    } else if (currentMins >= raw.sunrise && currentMins < raw.dhuhr) {
        current = 'ইশরাক/চাশত';
        nextName = 'যোহর';
        nextTime = prayerTimes.dhuhr;
        nextMins = raw.dhuhr;
    } else if (currentMins >= raw.dhuhr && currentMins < raw.asr) {
        current = 'যোহর';
        nextName = 'আসর';
        nextTime = prayerTimes.asr;
        nextMins = raw.asr;
    } else if (currentMins >= raw.asr && currentMins < raw.maghrib) {
        current = 'আসর';
        nextName = 'মাগরিব';
        nextTime = prayerTimes.maghrib;
        nextMins = raw.maghrib;
    } else if (currentMins >= raw.maghrib && currentMins < raw.isha) {
        current = 'মাগরিব';
        nextName = 'ইশা';
        nextTime = prayerTimes.isha;
        nextMins = raw.isha;
    } else if (currentMins >= raw.isha) {
        current = 'ইশা';
        nextName = 'ফজর';
        nextTime = prayerTimes.fajr;
        nextMins = raw.fajr + 1440;
    } else {
        current = 'ইশা (তাহাজ্জুদ)';
        nextName = 'ফজর';
        nextTime = prayerTimes.fajr;
        nextMins = raw.fajr;
    }

    let diff = nextMins - currentMins;
    if (diff < 0) diff += 1440;
    const diffH = Math.floor(diff / 60);
    const diffM = diff % 60;

    let countdownText = 'পরবর্তী ওয়াক্ত: ';
    if (diffH > 0) countdownText += `${toBanglaNumber(diffH)} ঘণ্টা `;
    countdownText += `${toBanglaNumber(diffM)} মিনিট বাকি`;

    return {
        currentWaqt: current,
        nextWaqtName: nextName,
        nextWaqtTime: nextTime,
        countdownText: countdownText
    };
}

// ==========================================
// STATE & APPLICATION CONTROLLER
// ==========================================

const state = {
    today: new Date(),
    hijriOffset: 0,
    badgeType: 'bangla',
    district: 'dhaka',
    calendarViewType: 'bangla',
    calYear: 1433,
    calMonth: 4,
    historyIndex: 0,
    historyItems: [],
    historyInterval: null,
    events: [],
    editingEventId: null,
    selectedDateCell: null
};

// ==========================================
// INITIALIZATION & TAB SWITCHING
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initSettings(() => {
        initTabs();
        initDateDisplay();
        initHistoryTicker();
        initCalendarView();
        initPrayerTimes();
        initEvents();
        initReviewSystem();
        initDonationAndReportSystem();
        initQuickActions();
    });
});

function initSettings(callback) {
    chrome.storage.local.get(['hijriOffset', 'badgeType', 'prayerDistrict', 'hasReviewed'], (result) => {
        state.hijriOffset = parseInt(result.hijriOffset !== undefined ? result.hijriOffset : 0);
        state.badgeType = result.badgeType || 'bangla';
        state.district = result.prayerDistrict || 'dhaka';
        
        // Populate inputs in settings
        const offsetSelect = document.getElementById('settingHijriOffset');
        if (offsetSelect) offsetSelect.value = state.hijriOffset.toString();
        
        const badgeSelect = document.getElementById('settingBadgeType');
        if (badgeSelect) badgeSelect.value = state.badgeType;

        const districtSelect = document.getElementById('prayerDistrictSelect');
        if (districtSelect) districtSelect.value = state.district;

        if (result.hasReviewed) {
            const prompt = document.getElementById('homeReviewPrompt');
            if (prompt) prompt.style.display = 'none';
        } else {
            const prompt = document.getElementById('homeReviewPrompt');
            if (prompt) prompt.style.display = 'block';
        }

        if (callback) callback();
    });

    // Listeners for settings changes
    const offsetSelect = document.getElementById('settingHijriOffset');
    if (offsetSelect) {
        offsetSelect.addEventListener('change', (e) => {
            state.hijriOffset = parseInt(e.target.value);
            chrome.storage.local.set({ hijriOffset: state.hijriOffset });
            initDateDisplay();
            updateCalendarGrid();
            showToast('হিজরি তারিখ সমন্বয় সম্পন্ন হয়েছে');
        });
    }

    const badgeSelect = document.getElementById('settingBadgeType');
    if (badgeSelect) {
        badgeSelect.addEventListener('change', (e) => {
            state.badgeType = e.target.value;
            chrome.storage.local.set({ badgeType: state.badgeType });
            showToast('আইকন ব্যাজ সেটিংস সংরক্ষিত');
        });
    }

    const districtSelect = document.getElementById('prayerDistrictSelect');
    if (districtSelect) {
        districtSelect.addEventListener('change', (e) => {
            state.district = e.target.value;
            chrome.storage.local.set({ prayerDistrict: state.district });
            renderPrayerTimes();
            showToast('জেলার সময়সূচি হালনাগাদ করা হয়েছে');
        });
    }
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTabId = btn.getAttribute('data-tab');
            switchTab(targetTabId);
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(tabId);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.add('active');

    if (tabId === 'tabCalendar') {
        updateCalendarGrid();
    } else if (tabId === 'tabPrayer') {
        renderPrayerTimes();
    }
}

// ==========================================
// HOME VIEW: TODAY'S DATES & HOLIDAY BANNER
// ==========================================

function initDateDisplay() {
    const now = state.today;
    const bangla = getBanglaDate(now);
    const hijri = getHijriDate(now, state.hijriOffset);

    // Initialize calendar start month/year to today's
    state.calYear = bangla.year;
    state.calMonth = bangla.month;

    // Home view values
    document.getElementById('homeBanglaDate').textContent = 
        `${toBanglaNumber(bangla.day)}ই ${bangla.monthName}, ${toBanglaNumber(bangla.year)} বঙ্গাব্দ`;
    
    document.getElementById('homeSeasonBadge').textContent = `${bangla.seasonIcon} ${bangla.season}`;

    document.getElementById('homeHijriDate').textContent = 
        `${toBanglaNumber(hijri.day)}ই ${hijri.monthName}, ${toBanglaNumber(hijri.year)} হিজরি`;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('homeGregorianDate').textContent = 
        `📅 ${now.toLocaleDateString('bn-BD', options)}`;

    // Check today's holiday
    const gKey = `${now.getMonth() + 1}-${now.getDate()}`;
    const hKey = `${hijri.month + 1}-${hijri.day}`;

    const holidayBanner = document.getElementById('todayHolidayBanner');
    const holidayText = document.getElementById('todayHolidayText');

    let holidayFound = null;
    if (typeof bangladeshNationalHolidays !== 'undefined' && bangladeshNationalHolidays[gKey]) {
        holidayFound = bangladeshNationalHolidays[gKey].title;
    } else if (typeof islamicHolidays !== 'undefined' && islamicHolidays[hKey]) {
        holidayFound = islamicHolidays[hKey].title;
    }

    if (holidayFound) {
        holidayText.textContent = `আজকে: ${holidayFound}`;
        holidayBanner.classList.add('show');
    } else {
        holidayBanner.classList.remove('show');
    }

    // Mini prayer bar on home
    const prayer = calculatePrayerTimes(now, state.district);
    const waqtStatus = getWaqtStatus(prayer);
    document.getElementById('homeCurrentWaqt').textContent = waqtStatus.currentWaqt;
    document.getElementById('homeNextWaqtTime').textContent = waqtStatus.nextWaqtTime;
    document.getElementById('homeNextWaqtCountdown').textContent = waqtStatus.countdownText;
}

// ==========================================
// HISTORY ROTATION TICKER
// ==========================================

function initHistoryTicker() {
    const now = state.today;
    const gKey = `${now.getMonth() + 1}-${now.getDate()}`;
    const hijri = getHijriDate(now, state.hijriOffset);
    const hKey = `${hijri.month + 1}-${hijri.day}`;

    const items = [];

    if (typeof bangladeshHistory !== 'undefined' && bangladeshHistory[gKey]) {
        bangladeshHistory[gKey].forEach(text => {
            items.push({ type: 'bangladesh', title: 'বাংলাদেশের ইতিহাস', icon: '🇧🇩', text });
        });
    }

    if (typeof islamicHistory !== 'undefined' && islamicHistory[hKey]) {
        islamicHistory[hKey].forEach(text => {
            items.push({ type: 'islamic', title: 'ইসলামিক ইতিহাস', icon: '☪️', text });
        });
    }

    state.historyItems = items;
    state.historyIndex = 0;

    renderHistory();

    // Start rotation
    if (state.historyInterval) clearInterval(state.historyInterval);
    if (items.length > 1) {
        state.historyInterval = setInterval(() => {
            nextHistory();
        }, 5000);
    }

    // Pause on hover
    const card = document.getElementById('historyCardSection');
    if (card) {
        card.addEventListener('mouseenter', () => {
            if (state.historyInterval) clearInterval(state.historyInterval);
        });
        card.addEventListener('mouseleave', () => {
            if (state.historyItems.length > 1) {
                state.historyInterval = setInterval(() => nextHistory(), 5000);
            }
        });
    }

    document.getElementById('prevHistoryBtn').addEventListener('click', prevHistory);
    document.getElementById('nextHistoryBtn').addEventListener('click', nextHistory);
    document.getElementById('reportHistoryBtn').addEventListener('click', () => {
        const subject = encodeURIComponent('তথ্য সংশোধন প্রস্তাবনা - বাংলা ও হিজরি ক্যালেন্ডার');
        const body = encodeURIComponent('আজকের তারিখ ও তথ্যের বিবরণ:\n\nভুল তথ্যের বিবরণ:\n\nসঠিক তথ্য:\n');
        window.open(`mailto:mahfazzalin1@gmail.com?subject=${subject}&body=${body}`);
        showToast('ইমেইল অ্যাপ ওপেন করা হচ্ছে... ✉️');
    });
}

function renderHistory() {
    if (state.historyItems.length === 0) {
        document.getElementById('historyText').textContent = 'আজকের তারিখের জন্য কোনো বিশেষ ঐতিহাসিক তথ্য লিপিবদ্ধ নেই।';
        document.getElementById('historyIndexIndicator').textContent = '০/০';
        return;
    }

    const item = state.historyItems[state.historyIndex];
    document.getElementById('historyIcon').textContent = item.icon;
    document.getElementById('historyTypeTitle').textContent = item.title;
    document.getElementById('historyText').textContent = item.text;
    document.getElementById('historyIndexIndicator').textContent = 
        `${toBanglaNumber(state.historyIndex + 1)}/${toBanglaNumber(state.historyItems.length)}`;
}

function nextHistory() {
    if (state.historyItems.length <= 1) return;
    state.historyIndex = (state.historyIndex + 1) % state.historyItems.length;
    renderHistory();
}

function prevHistory() {
    if (state.historyItems.length <= 1) return;
    state.historyIndex = (state.historyIndex - 1 + state.historyItems.length) % state.historyItems.length;
    renderHistory();
}

// ==========================================
// CALENDAR VIEW (Bangla & Hijri Grids)
// ==========================================

function initCalendarView() {
    document.getElementById('btnSwitchBangla').addEventListener('click', () => {
        state.calendarViewType = 'bangla';
        document.getElementById('btnSwitchBangla').classList.add('active');
        document.getElementById('btnSwitchHijri').classList.remove('active');
        
        const nowB = getBanglaDate(state.today);
        state.calYear = nowB.year;
        state.calMonth = nowB.month;
        updateCalendarGrid();
    });

    document.getElementById('btnSwitchHijri').addEventListener('click', () => {
        state.calendarViewType = 'hijri';
        document.getElementById('btnSwitchHijri').classList.add('active');
        document.getElementById('btnSwitchBangla').classList.remove('active');
        
        const nowH = getHijriDate(state.today, state.hijriOffset);
        state.calYear = nowH.year;
        state.calMonth = nowH.month;
        updateCalendarGrid();
    });

    document.getElementById('calPrevMonth').addEventListener('click', () => {
        state.calMonth--;
        if (state.calMonth < 0) {
            state.calMonth = 11;
            state.calYear--;
        }
        updateCalendarGrid();
    });

    document.getElementById('calNextMonth').addEventListener('click', () => {
        state.calMonth++;
        if (state.calMonth > 11) {
            state.calMonth = 0;
            state.calYear++;
        }
        updateCalendarGrid();
    });

    document.getElementById('calJumpTodayBtn').addEventListener('click', () => {
        if (state.calendarViewType === 'bangla') {
            const b = getBanglaDate(state.today);
            state.calYear = b.year;
            state.calMonth = b.month;
        } else {
            const h = getHijriDate(state.today, state.hijriOffset);
            state.calYear = h.year;
            state.calMonth = h.month;
        }
        updateCalendarGrid();
    });
}

function updateCalendarGrid() {
    const grid = document.getElementById('mainCalendarGrid');
    grid.innerHTML = '';

    // Weekday Headers
    dayHeaders.forEach((dayName, idx) => {
        const headerDiv = document.createElement('div');
        headerDiv.className = `cal-cell header ${idx === 5 ? 'friday' : ''}`;
        headerDiv.textContent = dayName;
        grid.appendChild(headerDiv);
    });

    if (state.calendarViewType === 'bangla') {
        renderBanglaGrid(grid);
    } else {
        renderHijriGrid(grid);
    }
}

function renderBanglaGrid(grid) {
    document.getElementById('calMonthYearTitle').textContent = 
        `${banglaMonths[state.calMonth]} ${toBanglaNumber(state.calYear)}`;

    const gStartDate = banglaToGregorian(state.calYear, state.calMonth, 1);
    const startDayOfWeek = gStartDate.getDay(); // 0 = Sunday, 5 = Friday

    // Days in this month
    const falgunGYear = state.calYear + 594;
    const falgunDays = isLeapYear(falgunGYear) ? 30 : 29;
    const monthLengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, falgunDays, 30];
    const totalDays = monthLengths[state.calMonth];

    // Today in Bangla
    const todayBangla = getBanglaDate(state.today);

    // Empty cells before 1st
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cal-cell empty';
        grid.appendChild(emptyCell);
    }

    // Days 1 to totalDays
    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        const dayOfWeek = (startDayOfWeek + day - 1) % 7;
        cell.className = `cal-cell date ${dayOfWeek === 5 ? 'friday' : ''} ${day < 10 ? 'single-digit' : ''}`;

        const isToday = (todayBangla.year === state.calYear &&
                         todayBangla.month === state.calMonth &&
                         todayBangla.day === day);
        if (isToday) cell.classList.add('today');

        // Gregorian date for this Bangla day
        const gDate = banglaToGregorian(state.calYear, state.calMonth, day);
        const gKey = `${gDate.getMonth() + 1}-${gDate.getDate()}`;

        // Hijri date for this Bangla day
        const hDate = getHijriDate(gDate, state.hijriOffset);
        const hKey = `${hDate.month + 1}-${hDate.day}`;

        // Check holiday
        let holiday = null;
        if (typeof bangladeshNationalHolidays !== 'undefined' && bangladeshNationalHolidays[gKey]) {
            holiday = bangladeshNationalHolidays[gKey];
        } else if (typeof islamicHolidays !== 'undefined' && islamicHolidays[hKey]) {
            holiday = islamicHolidays[hKey];
        }

        if (holiday) {
            cell.classList.add('has-holiday');
            cell.title = holiday.title;
        }

        // Check custom events
        const gDateStr = gDate.toISOString().split('T')[0];
        const dayEvents = state.events.filter(e => e.gregorianDate === gDateStr);
        if (dayEvents.length > 0) {
            cell.classList.add('has-event');
        }

        cell.textContent = toBanglaNumber(day);

        // Click handler to open date details modal
        cell.addEventListener('click', () => {
            openDateDetailsModal({
                banglaDateStr: `${toBanglaNumber(day)}ই ${banglaMonths[state.calMonth]}, ${toBanglaNumber(state.calYear)} বঙ্গাব্দ`,
                hijriDateStr: `${toBanglaNumber(hDate.day)}ই ${hDate.monthName}, ${toBanglaNumber(hDate.year)} হিজরি`,
                gregorianDateStr: gDate.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                rawGregorianStr: gDateStr,
                holiday: holiday,
                events: dayEvents
            });
        });

        grid.appendChild(cell);
    }
}

function renderHijriGrid(grid) {
    document.getElementById('calMonthYearTitle').textContent = 
        `${hijriMonths[state.calMonth]} ${toBanglaNumber(state.calYear)}`;

    const gStartDate = hijriToGregorian(state.calYear, state.calMonth, 1, state.hijriOffset);
    const startDayOfWeek = gStartDate.getDay();
    
    // Check if 30th day exists in this Hijri month
    let totalDays = 29;
    const gDate30 = hijriToGregorian(state.calYear, state.calMonth, 30, state.hijriOffset);
    const hDate30 = getHijriDate(gDate30, state.hijriOffset);
    if (hDate30.month === state.calMonth && hDate30.day === 30) {
        totalDays = 30;
    } else if (state.calMonth % 2 === 0) {
        totalDays = 30;
    }

    const todayHijri = getHijriDate(state.today, state.hijriOffset);

    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cal-cell empty';
        grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        const dayOfWeek = (startDayOfWeek + day - 1) % 7;
        cell.className = `cal-cell date ${dayOfWeek === 5 ? 'friday' : ''} ${day < 10 ? 'single-digit' : ''}`;

        const isToday = (todayHijri.year === state.calYear &&
                         todayHijri.month === state.calMonth &&
                         todayHijri.day === day);
        if (isToday) cell.classList.add('today');

        const gDate = hijriToGregorian(state.calYear, state.calMonth, day, state.hijriOffset);
        const gKey = `${gDate.getMonth() + 1}-${gDate.getDate()}`;
        const hKey = `${state.calMonth + 1}-${day}`;

        let holiday = null;
        if (typeof islamicHolidays !== 'undefined' && islamicHolidays[hKey]) {
            holiday = islamicHolidays[hKey];
        } else if (typeof bangladeshNationalHolidays !== 'undefined' && bangladeshNationalHolidays[gKey]) {
            holiday = bangladeshNationalHolidays[gKey];
        }

        if (holiday) {
            cell.classList.add('has-holiday');
            cell.title = holiday.title;
        }

        const gDateStr = gDate.toISOString().split('T')[0];
        const dayEvents = state.events.filter(e => e.gregorianDate === gDateStr);
        if (dayEvents.length > 0) {
            cell.classList.add('has-event');
        }

        cell.textContent = toBanglaNumber(day);

        const bDate = getBanglaDate(gDate);

        cell.addEventListener('click', () => {
            openDateDetailsModal({
                banglaDateStr: `${toBanglaNumber(bDate.day)}ই ${bDate.monthName}, ${toBanglaNumber(bDate.year)} বঙ্গাব্দ`,
                hijriDateStr: `${toBanglaNumber(day)}ই ${hijriMonths[state.calMonth]}, ${toBanglaNumber(state.calYear)} হিজরি`,
                gregorianDateStr: gDate.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                rawGregorianStr: gDateStr,
                holiday: holiday,
                events: dayEvents
            });
        });

        grid.appendChild(cell);
    }
}

// ==========================================
// DATE DETAILS MODAL
// ==========================================

function openDateDetailsModal(info) {
    state.selectedDateCell = info;

    document.getElementById('detailBanglaDate').textContent = `🇧🇩 ${info.banglaDateStr}`;
    document.getElementById('detailHijriDate').textContent = `☪️ ${info.hijriDateStr}`;
    document.getElementById('detailGregorianDate').textContent = `📅 ${info.gregorianDateStr}`;

    const holidaySec = document.getElementById('detailHolidaysSection');
    const holidayList = document.getElementById('detailHolidaysList');
    if (info.holiday) {
        holidaySec.style.display = 'block';
        holidayList.textContent = `🎉 ${info.holiday.title}`;
    } else {
        holidaySec.style.display = 'none';
    }

    const eventsList = document.getElementById('detailEventsList');
    eventsList.innerHTML = '';
    if (info.events.length === 0) {
        eventsList.innerHTML = '<div style="font-size: 11px; color: var(--text-muted);">এই তারিখে কোনো ইভেন্ট নেই।</div>';
    } else {
        info.events.forEach(ev => {
            const evDiv = document.createElement('div');
            evDiv.style.cssText = 'background: rgba(255,255,255,0.06); padding: 6px 8px; border-radius: 6px; margin-bottom: 4px; font-size: 12px;';
            evDiv.innerHTML = `<strong>${ev.title}</strong> (${ev.time || 'সারাদিন'})`;
            eventsList.appendChild(evDiv);
        });
    }

    document.getElementById('dateDetailsModal').classList.add('show');
}

document.getElementById('btnCloseDateDetails').addEventListener('click', () => {
    document.getElementById('dateDetailsModal').classList.remove('show');
});

document.getElementById('btnQuickAddEventFromDate').addEventListener('click', () => {
    document.getElementById('dateDetailsModal').classList.remove('show');
    if (state.selectedDateCell) {
        openEventModal(null, state.selectedDateCell.rawGregorianStr);
    } else {
        openEventModal();
    }
});

// ==========================================
// PRAYER TIMES VIEW
// ==========================================

function initPrayerTimes() {
    renderPrayerTimes();
}

function renderPrayerTimes() {
    const prayer = calculatePrayerTimes(state.today, state.district);
    const waqtStatus = getWaqtStatus(prayer);

    const setElem = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setElem('timeSehriEnd', prayer.sehriEnd);
    setElem('timeSunrise', prayer.sunrise);
    setElem('timeIftar', prayer.maghrib);

    // Waqt Start Times (Larger font)
    setElem('timeFajr', prayer.fajr);
    setElem('timeDhuhr', prayer.dhuhr);
    setElem('timeAsr', prayer.asr);
    setElem('timeMaghrib', prayer.maghrib);
    setElem('timeIsha', prayer.isha);

    // Waqt End Times (Smaller font below start time)
    setElem('timeFajrEnd', `শেষ: ${prayer.sunrise}`);
    setElem('timeDhuhrEnd', `শেষ: ${prayer.asr}`);
    setElem('timeAsrEnd', `শেষ: ${prayer.maghrib}`);
    setElem('timeMaghribEnd', `শেষ: ${prayer.isha}`);
    setElem('timeIshaEnd', `শেষ: ${prayer.fajr}`);

    // Highlight active Waqt card
    document.querySelectorAll('.prayer-card').forEach(c => c.classList.remove('active-waqt'));

    const activeMap = {
        'ফজর': 'cardFajr',
        'যোহর': 'cardDhuhr',
        'আসর': 'cardAsr',
        'মাগরিব': 'cardMaghrib',
        'ইশা': 'cardIsha',
        'ইশা (তাহাজ্জুদ)': 'cardIsha'
    };

    const activeCardId = activeMap[waqtStatus.currentWaqt];
    if (activeCardId) {
        const card = document.getElementById(activeCardId);
        if (card) card.classList.add('active-waqt');
    }
}

// ==========================================
// EVENT MANAGEMENT
// ==========================================

function initEvents() {
    loadEvents();

    document.getElementById('btnOpenAddEvent').addEventListener('click', () => openEventModal());
    document.getElementById('btnCloseEventModal').addEventListener('click', closeEventModal);

    document.getElementById('eventForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent();
    });
}

function loadEvents() {
    chrome.storage.local.get(['calendarEvents'], (result) => {
        state.events = result.calendarEvents || [];
        renderEventsList();
    });
}

function saveEvent() {
    const title = document.getElementById('formEventTitle').value.trim();
    const desc = document.getElementById('formEventDesc').value.trim();
    const dateStr = document.getElementById('formEventDate').value;
    const timeStr = document.getElementById('formEventTime').value || '09:00';
    const reminder = parseInt(document.getElementById('formEventReminder').value);

    if (!title || !dateStr) return;

    const eventDate = new Date(dateStr + 'T' + timeStr);
    const eventTimeMs = eventDate.getTime();

    const eventItem = {
        id: state.editingEventId || Date.now(),
        title,
        description: desc,
        gregorianDate: dateStr,
        time: timeStr,
        reminderMinutes: reminder,
        dateTimeMs: eventTimeMs
    };

    if (state.editingEventId) {
        const idx = state.events.findIndex(e => e.id === state.editingEventId);
        if (idx !== -1) {
            chrome.alarms.clear(`event_${state.events[idx].id}`);
            state.events[idx] = eventItem;
        }
        state.editingEventId = null;
    } else {
        state.events.push(eventItem);
    }

    // Schedule notification alarm
    if (reminder > 0 && eventTimeMs > Date.now()) {
        const alarmTime = eventTimeMs - (reminder * 60 * 1000);
        if (alarmTime > Date.now()) {
            chrome.alarms.create(`event_${eventItem.id}`, { when: alarmTime });
            chrome.storage.local.set({
                [`alarm_event_${eventItem.id}`]: {
                    id: eventItem.id,
                    title: eventItem.title,
                    description: eventItem.description,
                    time: eventItem.time
                }
            });
        }
    }

    chrome.storage.local.set({ calendarEvents: state.events }, () => {
        renderEventsList();
        updateCalendarGrid();
        closeEventModal();
        showToast('ইভেন্ট সফলভাবে সংরক্ষিত হয়েছে');
    });
}

function deleteEvent(id) {
    if (confirm('আপনি কি এই ইভেন্টটি মুছে ফেলতে চান?')) {
        chrome.alarms.clear(`event_${id}`);
        chrome.storage.local.remove([`alarm_event_${id}`]);
        state.events = state.events.filter(e => e.id !== id);
        chrome.storage.local.set({ calendarEvents: state.events }, () => {
            renderEventsList();
            updateCalendarGrid();
            showToast('ইভেন্ট মুছে ফেলা হয়েছে');
        });
    }
}

function openEventModal(eventId = null, defaultDateStr = null) {
    state.editingEventId = eventId;
    const modal = document.getElementById('eventModal');
    const titleHeader = document.getElementById('eventModalTitle');

    if (eventId) {
        const ev = state.events.find(e => e.id === eventId);
        if (ev) {
            titleHeader.textContent = 'ইভেন্ট সম্পাদনা করুন';
            document.getElementById('formEventTitle').value = ev.title;
            document.getElementById('formEventDesc').value = ev.description || '';
            document.getElementById('formEventDate').value = ev.gregorianDate;
            document.getElementById('formEventTime').value = ev.time;
            document.getElementById('formEventReminder').value = ev.reminderMinutes;
        }
    } else {
        titleHeader.textContent = 'নতুন ইভেন্ট যোগ করুন';
        document.getElementById('formEventTitle').value = '';
        document.getElementById('formEventDesc').value = '';
        document.getElementById('formEventDate').value = defaultDateStr || state.today.toISOString().split('T')[0];
        document.getElementById('formEventTime').value = '09:00';
        document.getElementById('formEventReminder').value = '30';
    }

    modal.classList.add('show');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('show');
    state.editingEventId = null;
}

function renderEventsList() {
    const container = document.getElementById('eventsListContainer');
    container.innerHTML = '';

    if (state.events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">কোনো ইভেন্ট নেই</div>
                <div style="font-size: 12px;">গুরুত্বপূর্ণ দিন বা কাজের জন্য নতুন ইভেন্ট যুক্ত করুন।</div>
            </div>
        `;
        return;
    }

    // Sort by date
    state.events.sort((a, b) => (a.dateTimeMs || 0) - (b.dateTimeMs || 0));

    state.events.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'event-item-card';

        const infoDiv = document.createElement('div');
        const titleDiv = document.createElement('div');
        titleDiv.className = 'event-info-title';
        titleDiv.textContent = ev.title;
        infoDiv.appendChild(titleDiv);

        if (ev.description) {
            const descDiv = document.createElement('div');
            descDiv.className = 'event-info-desc';
            descDiv.textContent = ev.description;
            infoDiv.appendChild(descDiv);
        }

        const dateDiv = document.createElement('div');
        dateDiv.className = 'event-info-date';
        dateDiv.innerHTML = `<span>📅 ${ev.gregorianDate}</span> <span>⏰ ${ev.time}</span>`;
        infoDiv.appendChild(dateDiv);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'event-action-btns';

        const editBtn = document.createElement('button');
        editBtn.className = 'event-action-btn';
        editBtn.innerHTML = '✏️';
        editBtn.title = 'সম্পাদনা';
        editBtn.addEventListener('click', () => openEventModal(ev.id));

        const delBtn = document.createElement('button');
        delBtn.className = 'event-action-btn delete';
        delBtn.innerHTML = '🗑️';
        delBtn.title = 'মুছুন';
        delBtn.addEventListener('click', () => deleteEvent(ev.id));

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(delBtn);

        card.appendChild(infoDiv);
        card.appendChild(actionsDiv);
        container.appendChild(card);
    });
}

// ==========================================
// REVIEW & RATING SYSTEM
// ==========================================

function initReviewSystem() {
    const starButtons = document.querySelectorAll('.star-btn');
    const highBox = document.getElementById('reviewHighRatingBox');
    const lowBox = document.getElementById('reviewLowRatingBox');

    starButtons.forEach((starBtn, index) => {
        starBtn.addEventListener('mouseenter', () => {
            starButtons.forEach((s, idx) => {
                if (idx <= index) s.classList.add('hovered');
                else s.classList.remove('hovered');
            });
        });

        starBtn.addEventListener('mouseleave', () => {
            starButtons.forEach(s => s.classList.remove('hovered'));
        });

        starBtn.addEventListener('click', () => {
            const rating = index + 1;
            starButtons.forEach((s, idx) => {
                if (idx < rating) s.classList.add('active');
                else s.classList.remove('active');
            });

            if (rating >= 4) {
                if (highBox) highBox.style.display = 'block';
                if (lowBox) lowBox.style.display = 'none';
            } else {
                if (highBox) highBox.style.display = 'none';
                if (lowBox) lowBox.style.display = 'block';
            }
        });
    });

    const webStoreBtn = document.getElementById('btnOpenWebStoreReview');
    if (webStoreBtn) {
        webStoreBtn.addEventListener('click', () => {
            chrome.storage.local.set({ hasReviewed: true });
            const prompt = document.getElementById('homeReviewPrompt');
            if (prompt) prompt.style.display = 'none';
            window.open(CHROME_WEB_STORE_REVIEW_URL, '_blank');
            showToast('ধন্যবাদ! আপনার রিভিউ আমাদের এগিয়ে নিয়ে যাবে।');
        });
    }

    const submitFeedbackBtn = document.getElementById('btnSubmitFeedback');
    if (submitFeedbackBtn) {
        submitFeedbackBtn.addEventListener('click', () => {
            const msg = document.getElementById('feedbackMessageInput').value.trim();
            if (!msg) {
                alert('অনুগ্রহ করে আপনার সমস্যা বা মতামত লিখুন');
                return;
            }
            const mailto = `mailto:mahfazzalin1@gmail.com?subject=Bangla Hijri Calendar Extension Feedback&body=${encodeURIComponent(msg)}`;
            window.open(mailto);
            showToast('ধন্যবাদ! আমরা আপনার ফিডব্যাক পর্যালোচনা করব।');
            document.getElementById('feedbackMessageInput').value = '';
            if (lowBox) lowBox.style.display = 'none';
        });
    }

    const promptBtn = document.getElementById('promptReviewBtn');
    if (promptBtn) {
        promptBtn.addEventListener('click', () => {
            switchTab('tabSettings');
        });
    }

    const quickRateHeaderBtn = document.getElementById('quickRateBtn');
    if (quickRateHeaderBtn) {
        quickRateHeaderBtn.addEventListener('click', () => {
            switchTab('tabSettings');
        });
    }
}

// ==========================================
// DONATION & REPORTING SYSTEM
// ==========================================

function initDonationAndReportSystem() {
    const DONATION_PHONE = '01612925000';
    const REPORT_EMAIL = 'mahfazzalin1@gmail.com';

    // 1. Monthly Donation Reminder Banner Logic
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['lastDonationReminderMonth'], (result) => {
            const banner = document.getElementById('homeDonationPrompt');
            if (!banner) return;

            // Show once every calendar month
            if (result.lastDonationReminderMonth !== currentMonthKey) {
                banner.style.display = 'block';
            } else {
                banner.style.display = 'none';
            }
        });
    }

    // Dismiss reminder for the rest of this month
    const dismissBanner = () => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ lastDonationReminderMonth: currentMonthKey });
        }
        const banner = document.getElementById('homeDonationPrompt');
        if (banner) banner.style.display = 'none';
        showToast('পরের মাসে আবার মনে করিয়ে দেওয়া হবে। ধন্যবাদ! 🌸');
    };

    const closeBtn = document.getElementById('btnDismissDonationBanner');
    if (closeBtn) closeBtn.addEventListener('click', dismissBanner);

    const laterBtn = document.getElementById('btnBannerLaterDonate');
    if (laterBtn) laterBtn.addEventListener('click', dismissBanner);

    // Donate from banner
    const bannerDonateBtn = document.getElementById('btnBannerGoDonate');
    if (bannerDonateBtn) {
        bannerDonateBtn.addEventListener('click', () => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ lastDonationReminderMonth: currentMonthKey });
            }
            const banner = document.getElementById('homeDonationPrompt');
            if (banner) banner.style.display = 'none';

            switchTab('tabSettings');
            const donationCard = document.getElementById('donationCard');
            if (donationCard) {
                donationCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                donationCard.classList.remove('highlight-card');
                void donationCard.offsetWidth; // Trigger reflow for animation
                donationCard.classList.add('highlight-card');
            }
        });
    }

    // 2. Donation Number Copy Button (bKash, Nagad, Rocket)
    const copyDonationBtn = document.getElementById('btnCopyDonationNumber');
    if (copyDonationBtn) {
        copyDonationBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(DONATION_PHONE).then(() => {
                const btnText = document.getElementById('copyDonationBtnText');
                if (btnText) {
                    const original = btnText.textContent;
                    btnText.textContent = 'কপি হয়েছে! ✓';
                    setTimeout(() => {
                        btnText.textContent = original;
                    }, 2000);
                }
                showToast(`ডোনেশন নম্বর ${DONATION_PHONE} কপি করা হয়েছে! 📋`);
            }).catch(() => {
                showToast('নম্বর কপি করা সম্ভব হয়নি');
            });
        });
    }

    // 3. Error Report & Direct Email Actions
    const sendMailBtn = document.getElementById('btnSendReportEmail');
    if (sendMailBtn) {
        sendMailBtn.addEventListener('click', () => {
            const subject = encodeURIComponent('তথ্য সংশোধন প্রস্তাবনা - বাংলা ও হিজরি ক্যালেন্ডার');
            const body = encodeURIComponent(
                'তারিখ / নামাজের ওয়াক্ত / ইতিহাস:\n\n' +
                'ভুল তথ্যের বিবরণ:\n\n' +
                'সঠিক তথ্য (যদি জানা থাকে):\n\n' +
                'ধন্যবাদ।'
            );
            window.open(`mailto:${REPORT_EMAIL}?subject=${subject}&body=${body}`);
            showToast('ইমেইল পাঠানো হচ্ছে... ✉️');
        });
    }

    const copyMailBtn = document.getElementById('btnCopyReportEmail');
    if (copyMailBtn) {
        copyMailBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(REPORT_EMAIL).then(() => {
                showToast(`ইমেইল ${REPORT_EMAIL} কপি করা হয়েছে! 📋`);
            }).catch(() => {
                showToast('ইমেইল কপি করা সম্ভব হয়নি');
            });
        });
    }
}

// ==========================================
// QUICK ACTIONS & CLIPBOARD COPY
// ==========================================

function initQuickActions() {
    document.getElementById('copyDateBtn').addEventListener('click', () => {
        const bangla = document.getElementById('homeBanglaDate').textContent;
        const hijri = document.getElementById('homeHijriDate').textContent;
        const gregorian = document.getElementById('homeGregorianDate').textContent;

        const copyText = `🇧🇩 বাংলা: ${bangla}\n☪️ হিজরি: ${hijri}\n${gregorian}`;

        navigator.clipboard.writeText(copyText).then(() => {
            showToast('তারিখ সফলভাবে কপি করা হয়েছে! 📋');
        }).catch(() => {
            showToast('কপি করা সম্ভব হয়নি');
        });
    });

    document.getElementById('btnGoToCalendar').addEventListener('click', () => {
        switchTab('tabCalendar');
    });

    document.getElementById('btnGoToPrayer').addEventListener('click', () => {
        switchTab('tabPrayer');
    });

    document.getElementById('homePrayerCard').addEventListener('click', () => {
        switchTab('tabPrayer');
    });
}

// ==========================================
// TOAST NOTIFICATION UTILITY
// ==========================================

let toastTimeout = null;
function showToast(message) {
    const toast = document.getElementById('toastMsg');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}