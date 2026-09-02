let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

// Call this from a real user-gesture event handler (click/keydown/touchstart).
// Safe to call repeatedly - a no-op once the context is already running.
export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  } catch (err) {
    console.log('audio unlock failed:', err);
  }
}

export default async function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      // Try to resume (works once the page has had any gesture at all).
      // If this fails/never resolves - e.g. no gesture has happened yet -
      // bail out instead of scheduling notes on a frozen clock.
      await ctx.resume().catch(() => {});
      if (ctx.state === 'suspended') return;
    }

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