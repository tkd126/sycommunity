(function (root) {
  'use strict';

  function create(durationMs, saved, options) {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error('Activity clock duration must be a positive number');
    }
    const settings = options && typeof options === 'object' ? options : {};
    const now = typeof settings.now === 'function' ? settings.now : Date.now;
    const onExpire = typeof settings.onExpire === 'function' ? settings.onExpire : function () {};
    const restored = saved && typeof saved === 'object' ? saved : {};
    const validRemaining = typeof restored.remaining === 'number' && Number.isFinite(restored.remaining);
    let remaining = validRemaining
      ? Math.max(0, Math.min(durationMs, restored.remaining))
      : durationMs;
    let unlimitedMode = restored.unlimited === true;
    let expired = !unlimitedMode && remaining === 0;
    let running = false;
    let lastNow = null;
    let expirationSent = expired;
    let disposed = false;

    function snapshot() {
      return { remaining, running, unlimited: unlimitedMode, expired };
    }

    function expire() {
      if (expired || unlimitedMode || disposed) return;
      remaining = 0;
      running = false;
      expired = true;
      lastNow = null;
      if (!expirationSent) {
        expirationSent = true;
        onExpire();
      }
    }

    function tick() {
      if (!running || unlimitedMode || expired || disposed) return snapshot();
      const current = now();
      if (!Number.isFinite(current)) return snapshot();
      const elapsed = Math.max(0, current - lastNow);
      if (current > lastNow) lastNow = current;
      if (elapsed >= remaining) expire();
      else remaining -= elapsed;
      return snapshot();
    }

    function start() {
      if (disposed || expired || unlimitedMode || running) return snapshot();
      const current = now();
      if (!Number.isFinite(current)) return snapshot();
      lastNow = current;
      running = true;
      return snapshot();
    }

    function pause() {
      if (disposed) return snapshot();
      tick();
      running = false;
      lastNow = null;
      return snapshot();
    }

    function reset() {
      if (disposed) return snapshot();
      remaining = durationMs;
      running = false;
      unlimitedMode = false;
      expired = false;
      expirationSent = false;
      lastNow = null;
      return snapshot();
    }

    function unlimited() {
      if (disposed) return snapshot();
      tick();
      running = false;
      unlimitedMode = true;
      expired = false;
      expirationSent = false;
      lastNow = null;
      return snapshot();
    }

    function dispose() {
      disposed = true;
      running = false;
      lastNow = null;
      return snapshot();
    }

    return { start, pause, reset, unlimited, tick, snapshot, dispose };
  }

  const api = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ActivityClock = api;
})(typeof window === 'undefined' ? globalThis : window);
