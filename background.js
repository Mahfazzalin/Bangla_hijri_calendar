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

// ==========================================
// OFFSCREEN AUDIO CHIME MANAGEMENT (MV3)
// ==========================================

let creatingOffscreenPromise = null;

async function hasOffscreenDocument() {
    if ('getContexts' in chrome.runtime) {
        const contexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });
        return contexts.length > 0;
    }
    return false;
}

async function playChimeSound() {
    try {
        const hasDoc = await hasOffscreenDocument();
        if (!hasDoc) {
            if (creatingOffscreenPromise) {
                await creatingOffscreenPromise;
            } else {
                creatingOffscreenPromise = chrome.offscreen.createDocument({
                    url: 'offscreen.html',
                    reasons: ['AUDIO_PLAYBACK'],
                    justification: 'Playing notification chime for calendar event reminder'
                });
                await creatingOffscreenPromise;
                creatingOffscreenPromise = null;
            }
        }
        chrome.runtime.sendMessage({ action: 'play_reminder_chime' }).catch(() => {});
    } catch (err) {
        console.warn('Audio chime notice:', err);
    }
}

// ==========================================
// EVENT NOTIFICATION TRIGGER
// ==========================================

function triggerEventNotification(eventData) {
    if (!eventData || !eventData.title) return;

    // 1. Play audio chime via offscreen Web Audio
    playChimeSound();

    // 2. Display desktop notification
    const notifId = `event_notif_${eventData.id || Date.now()}_${Date.now()}`;
    const iconPath = chrome.runtime.getURL('icon128.png');

    const notifOptions = {
        type: 'basic',
        iconUrl: iconPath,
        title: `🔔 ${eventData.title}`,
        message: eventData.description ? `${eventData.description} (সময়: ${eventData.time})` : `ইভেন্টের সময়: ${eventData.time || 'নির্ধারিত সময়'}`,
        priority: 2,
        requireInteraction: true,
        silent: false
    };

    chrome.notifications.create(notifId, notifOptions, (createdId) => {
        if (chrome.runtime.lastError) {
            console.warn('Notification creation error:', chrome.runtime.lastError.message);
        }
    });
}

// Auto-reschedule missing alarms for upcoming events on startup
function checkPendingEventReminders() {
    chrome.storage.local.get(['calendarEvents'], (result) => {
        const events = result.calendarEvents || [];
        const now = Date.now();
        events.forEach(ev => {
            if (!ev.dateTimeMs || ev.reminderMinutes === -1) return;
            if (ev.dateTimeMs > now) {
                const alarmName = `event_${ev.id}`;
                chrome.alarms.get(alarmName, (existingAlarm) => {
                    if (!existingAlarm) {
                        const reminderMin = ev.reminderMinutes !== undefined ? ev.reminderMinutes : 0;
                        const alarmTime = ev.dateTimeMs - (reminderMin * 60 * 1000);
                        const finalWhen = Math.max(now + 1500, alarmTime);
                        chrome.alarms.create(alarmName, { when: finalWhen });
                    }
                });
            }
        });
    });
}

// ==========================================
// LIFECYCLE & ALARM LISTENERS
// ==========================================

chrome.runtime.onInstalled.addListener(() => {
    updateIcon();
    setupBadgeAlarm();
    checkPendingEventReminders();
});

chrome.runtime.onStartup.addListener(() => {
    updateIcon();
    setupBadgeAlarm();
    checkPendingEventReminders();
});

// Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'badge_update_alarm') {
        updateIcon();
        checkPendingEventReminders();
    } else if (alarm.name.startsWith('event_')) {
        const storageKey = `alarm_${alarm.name}`;
        chrome.storage.local.get([storageKey, 'calendarEvents'], (result) => {
            let eventData = result[storageKey];
            
            // Fallback: look up in calendarEvents array by ID
            if (!eventData && result.calendarEvents) {
                const eventId = alarm.name.replace('event_', '');
                eventData = result.calendarEvents.find(e => String(e.id) === eventId);
            }

            if (eventData) {
                triggerEventNotification(eventData);
                chrome.storage.local.remove([storageKey]);
            }
        });
    }
});

// Listen for test notification request from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === 'test_notification') {
        triggerEventNotification({
            id: 'test',
            title: 'টেস্ট নোটিফিকেশন ও রিমাইন্ডার 🔔',
            description: 'আপনার ক্যালেন্ডার নোটিফিকেশন ও রিমাইন্ডার সাউন্ড সফলভাবে কাজ করছে!',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        sendResponse({ success: true });
        return true;
    }
});

// Dismiss notification on click
chrome.notifications.onClicked.addListener((notifId) => {
    chrome.notifications.clear(notifId);
});

// Update immediately on service worker start
updateIcon();
checkPendingEventReminders();