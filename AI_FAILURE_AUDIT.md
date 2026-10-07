# AI FAILURE MODE AUDIT

**Student:** Nguyễn Tất Tấn Tài
**Course:** Web Application Development — Lab 1 HW3
**Deliverable:** Resilient Landing Page

> Three AI-induced defects caught during review, each with a diagnostic method and a verified refactored solution.

---

## Defect 1 — `setInterval` countdown drift

### Defect Description
Initial AI output for the countdown used `setInterval(() => remaining--, 1000)` where `remaining` was a cached counter decremented once per second. Browsers throttle `setInterval` to >= 1000ms when a tab is backgrounded (and often throttle much more aggressively). Because the counter was decremented rather than recomputed, the displayed time fell behind wall-clock time. After 2 minutes backgrounded, the countdown was ~45 seconds slow.

This is a **time-correctness** bug: the UI claims the target is further away than it actually is.

### Diagnostic Method
1. Opened DevTools with the page running.
2. Noted the displayed countdown value (e.g. `1234:56:23`).
3. Switched to another tab for 2 minutes.
4. Returned to the original tab and compared displayed value against the true remaining time computed in Console:
   ```js
   Date.parse('2026-12-31T23:59:59Z') - Date.now()
   ```
   Display was ~45s behind. Confirmed via git diff that the timer used a `remaining--` decrement pattern, not a recompute.

### Refactored Solution
Removed the cached `remaining` variable entirely. Each tick now recomputes from scratch:

```js
const remainingMs = targetMs - Date.now();
```

Switched from `setInterval` to recursive `setTimeout` aligned to the next second boundary:

```js
const delay = 1000 - (Date.now() % 1000);
timerId = window.setTimeout(tick, delay);
```

This guarantees the display never drifts, regardless of tab throttling — because the truth is always `Date.now()`, never a stored counter.

**File:** `js/countdown.js`

---

## Defect 2 — `innerHTML` XSS vulnerability

### Defect Description
AI generated the form status renderer as:

```js
statusEl.innerHTML = 'Thanks, ' + formData.get('name') + '! Message received.';
```

Submitting the payload `<img src=x onerror=alert(1)>` in the name field caused the injected `<img>` to be parsed into the DOM. The `onerror` handler fired immediately, executing `alert(1)` in the page's origin. This is a stored/reflected XSS vector.

Because the site runs with a strict CSP that allows `'self'` scripts only, the payload's inline handler was still able to execute in many browsers that treat `onerror` on injected elements as first-party. The bug is unconditional: any user string written via `innerHTML` is a potential sink.

### Diagnostic Method
1. Manually submitted the payload in the name field:
   `<img src=x onerror=alert(1)>`
2. Observed `alert(1)` fire in the browser — proof of XSS.
3. Inspected the rendered DOM: the `<img>` element was present inside `#form-status`.
4. Confirmed via `grep -rn "innerHTML" js/` that the sink was in `form-state.js`.

### Refactored Solution
Two-layer defense:

1. **Eliminated the sink.** Replaced every `innerHTML` write with `textContent`. Since `textContent` never parses HTML, the payload is rendered as a literal string instead of a DOM element.

   ```js
   statusEl.textContent = `Thanks, ${clean.name}! Registration received.`;
   ```

2. **Added input sanitization** as defense-in-depth. A 3-layer sanitizer (`stripControlChars` → `collapseWhitespace` → `clipByCodePoint` using `Array.from`) normalizes user input before it ever reaches the status renderer. Exposed as a frozen contract at `window.__sanitizeFormData`.

**Verified:** re-submitting the payload now displays the literal text, no alert fires, no DOM injection.

**Files:** `js/sanitize.js`, `js/form-state.js`

---

## Defect 3 — Missing timer cleanup (memory leak)

### Defect Description
The AI's initial countdown scheduled recursive `setTimeout` calls but never cleared the pending timer when the page was navigated away or restored from bfcache. On back/forward navigation, two timer chains ran in parallel:

- one from the original page instance (not yet garbage-collected because a `setTimeout` was still pending),
- one from the restored instance.

The result was a double-rate countdown and a stale `targetMs` captured from a previous navigation. Memory Profiler retained closures from the old instance. This is a lifecycle leak.

### Diagnostic Method
1. Opened DevTools → Performance tab.
2. Started recording.
3. Navigated to `about:blank`, then pressed the Back button to return to the page.
4. Observed two concurrent `tick()` executions per wall-clock second in the Performance timeline.
5. Opened Memory Profiler → captured snapshot → saw retained closures referencing the old `timerId` and `targetMs`.
6. Cross-checked source: the `pagehide` listener was absent from the AI-generated code.

### Refactored Solution
Stored the pending timer id in a closure variable and cleared it on `pagehide`:

```js
let timerId = null;

function tick() {
  const remaining = targetMs - Date.now();
  render(remaining);
  if (remaining <= 0) return;
  const delay = 1000 - (Date.now() % 1000);
  timerId = window.setTimeout(tick, delay);
}

window.addEventListener('pagehide', () => {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
});

**Verified** in the Performance timeline: after back/forward navigation, only one timer chain runs. Memory snapshot no longer retains the old closure.

**File:** `js/countdown.js`

---

## Summary Table

| # | Defect | Root Cause | Diagnostic | Fix Location |
|---|--------|------------|------------|--------------|
| 1 | Countdown drift | `setInterval` + cached decrement | Tab background 2 min | `js/countdown.js` |
| 2 | XSS via `innerHTML` | User string rendered as HTML | Manual payload test | `js/sanitize.js` + `js/form-state.js` |
| 3 | Timer leak | No `pagehide` cleanup | Performance timeline + Memory Profiler | `js/countdown.js` |

---

## Verification Statement

All three defects were reproduced in isolation before fixing, and all three fixes were verified with the same diagnostic method after the fix. No defect was "assumed fixed" — each was proven fixed with a concrete DevTools observation.

> "AI can generate code. Developers are responsible for proving that it is correct."
