// Wraps fetch with a hard timeout so requests can never spin forever
// with no feedback to the user (e.g. if the backend/network stalls).
//
// The free-tier backend host can also "sleep" after inactivity, so the
// very first request after a while can legitimately take 20-40+ seconds
// to wake up. `onSlow` lets a screen show a "still connecting..." style
// message once that grace period has passed, instead of leaving the
// user staring at a spinner with zero explanation.

const DEFAULT_TIMEOUT_MS = 45000; // hard ceiling - always resolves/rejects by then
const SLOW_AFTER_MS = 7000;       // when to warn the user things are slow

export async function fetchWithTimeout(url, options = {}, { timeoutMs = DEFAULT_TIMEOUT_MS, onSlow } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const slowId = onSlow ? setTimeout(onSlow, SLOW_AFTER_MS) : null;

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(
        'The server is taking too long to respond. It may be waking up from sleep — please try again in a moment.'
      );
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    if (slowId) clearTimeout(slowId);
  }
}
