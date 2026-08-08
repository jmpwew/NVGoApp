// Plays a short two-tone "bell" chime using the Web Audio API.
// No external audio file needed, so there's nothing extra to host or load.
//
// Note: browsers block audio until the user has interacted with the page at
// least once (click, keypress, etc.). On an admin dashboard that's almost
// always true well before the first new-item poll fires, but if it's ever
// called before any interaction, it fails silently rather than throwing.

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export default function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    // two quick notes, like a soft "ding-dong"
    [
      { freq: 880, start: 0,    dur: 0.14 },
      { freq: 660, start: 0.13, dur: 0.22 },
    ].forEach(({ freq, start, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.25, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    });
  } catch (err) {
    // Never let a sound failure break the app.
    console.log('notification sound failed:', err);
  }
}
