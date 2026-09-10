// Bangla numerals
const banglaNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toBanglaNumber(num) {
    return num.toString().split('').map(d => banglaNumbers[parseInt(d)] || d).join('');
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Calculate Bangla Date (Bangla Academy 2019 Revision for Bangladesh)
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
        year: bYear
    };
}

// Calculate Hijri Date (Bangladesh standard with offset)
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
        year: hYear
    };
}

// Update icon badge text
function updateIcon() {
    chrome.storage.local.get(['badgeType', 'hijriOffset'], (result) => {
        const badgeType = result.badgeType || 'bangla';
        const hijriOffset = parseInt(result.hijriOffset || 0);

        if (badgeType === 'off') {
            chrome.action.setBadgeText({ text: '' });
            return;
        }

        const now = new Date();
        let badgeText = '';

        if (badgeType === 'hijri') {
            const hijri = getHijriDate(now, hijriOffset);
            badgeText = toBanglaNumber(hijri.day);
            chrome.action.setBadgeBackgroundColor({ color: '#047857' }); // Emerald green
        } else {
            const bangla = getBanglaDate(now);
            badgeText = toBanglaNumber(bangla.day);
            chrome.action.setBadgeBackgroundColor({ color: '#0f766e' }); // Deep teal/cyan
        }

        chrome.action.setBadgeText({ text: badgeText });
        chrome.storage.local.set({
            badgeText: badgeText,
            lastUpdate: now.toDateString()
        });
    });
}

// Setup background alarm for badge updates (MV3 compliant)
function setupBadgeAlarm() {
    chrome.alarms.create('badge_update_alarm', {
        periodInMinutes: 30
    });
}

chrome.runtime.onInstalled.addListener(() => {
    updateIcon();
    setupBadgeAlarm();
});

chrome.runtime.onStartup.addListener(() => {
    updateIcon();
    setupBadgeAlarm();
});

// Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'badge_update_alarm') {
        updateIcon();
    } else if (alarm.name.startsWith('event_')) {
        chrome.storage.local.get([`alarm_${alarm.name}`], (result) => {
            const eventData = result[`alarm_${alarm.name}`];
            if (eventData) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon128.png',
                    title: `🔔 ${eventData.title}`,
                    message: eventData.description || `ইভেন্টের সময়: ${eventData.time}`,
                    priority: 2
                });
                chrome.storage.local.remove([`alarm_${alarm.name}`]);
            }
        });
    }
});

// Update immediately on service worker start
updateIcon();