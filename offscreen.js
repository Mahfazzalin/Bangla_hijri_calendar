// Offscreen Document Audio Chime Player
// Plays a pleasant 2-tone chime when an event reminder notification triggers

function playChime() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;

        // Elegant 2-tone calendar chime (E5 -> A5)
        const notes = [
            { freq: 659.25, start: 0, dur: 0.28 },
            { freq: 880.00, start: 0.18, dur: 0.65 }
        ];

        notes.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, now + note.start);

            gain.gain.setValueAtTime(0.001, now + note.start);
            gain.gain.exponentialRampToValueAtTime(0.35, now + note.start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.dur);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + note.start);
            osc.stop(now + note.start + note.dur);
        });
    } catch (e) {
        console.error('Audio chime error:', e);
    }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === 'play_reminder_chime') {
        playChime();
        sendResponse({ success: true });
    }
    return true;
});
