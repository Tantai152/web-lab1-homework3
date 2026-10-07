(() => {
  const targetEl = document.querySelector('#countdown-target');
  const display = document.querySelector('#cd-display');

  if (!targetEl || !display) {
    return;
  }

  const targetMs = Date.parse(targetEl.dataset.target);
  const valid = Number.isFinite(targetMs);
  let timerId = null;

  if (!valid) {
    display.textContent = '--:--:--';
    return;
  }

  const pad = (value) => String(value).padStart(2, '0');

  const tick = () => {
    const remaining = targetMs - Date.now();

    if (remaining <= 0) {
      display.textContent = '00:00:00';
      return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    display.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

    // Recursive setTimeout stays aligned to real-time second boundaries.
    const delay = 1000 - (Date.now() % 1000);
    timerId = window.setTimeout(tick, delay);
  };

  tick();

  window.addEventListener('pagehide', () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  });
})();
