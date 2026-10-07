# Web Application Development — Lab 1 Homework 3

**Student:** Nguyễn Tất Tấn Tài
**Course:** Web Application Development (2025–2026)
**Deliverable:** HW3 — Resilient Landing Page (3 Slices)

---

## 📋 Project Overview

A resilient landing page built with **Vanilla HTML5 + Modern CSS + ES6+ JavaScript** — no frameworks, no libraries, no CDN.

Demonstrates three resilience contracts:
1. **Drift-free countdown** anchored to UTC ISO 8601 (never decrements a cached counter).
2. **Explicit form state machine** with a frozen 5-state transition table.
3. **3-layer sanitization + submit guard** to eliminate XSS and duplicate submissions.

Includes a mandatory **AI Failure Mode Audit** documenting three real defects caught during review.

---

## 🎯 Deliverables

- Semantic landing tree (1 `<h1>`, zero `<div>` for structure)
- Drift-free UTC countdown (Slice 1)
- Explicit FSM form state machine (Slice 2)
- Sanitizer + submit guard (Slice 3)
- Full keyboard Tab/Enter flow
- Mobile-first 375px responsive

---

## 🏗️ Architecture

### Tech Stack
- Vanilla HTML5
- Modern CSS (custom properties, Grid auto-fit, `clamp()`)
- ES6+ JavaScript (const, arrow functions, IIFE, `Object.freeze`, `Array.from`, `CustomEvent`-free)
- No build step, no bundler

### File Structure

web-lab1-homework3/
├── index.html                  # Landing page (countdown + form)
├── css/
│   ├── reset.css               # Box-sizing + base normalization
│   ├── tokens.css              # Design tokens (light + dark-theme)
│   ├── layout.css              # Page shell + grid auto-fit
│   └── components.css          # Skip-link, card, form, status
├── js/
│   ├── sanitize.js             # 3-layer sanitizer + submit guard (LOADS FIRST)
│   ├── form-state.js           # Explicit FSM (LOADS SECOND)
│   └── countdown.js            # Drift-free countdown (INDEPENDENT)
├── project-rules.md            # Architectural constraints
├── TASK_DECOMPOSITION.md       # WBS + slice contracts
├── AI_FAILURE_AUDIT.md         # 3 AI-induced defects + fixes (15% deliverable)
└── README.md                   # This file

---

## 🚀 Local Development

### Requirements
- Any modern browser (Chrome, Firefox, Edge, Safari)
- [VS Code](https://code.visualstudio.com/) + [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

### Run Locally

```bash
git clone https://github.com/Tantai152/web-lab1-homework3.git
cd web-lab1-homework3
Open in VS Code → right-click index.html → Open with Live Server.
Browser opens at http://localhost:5500.
```

⚠️ **Strict ban:** Never open via `file:///....` This breaks ES modules, CSP, and timers.

---

### 🔗 Script Load Order (Critical)

```html
<script src="js/sanitize.js" defer></script>    <!-- MUST be first -->
<script src="js/form-state.js" defer></script>  <!-- depends on sanitize -->
<script src="js/countdown.js" defer></script>   <!-- independent -->
```

- `sanitize.js` defines `window.__sanitizeFormData` and `window.__withSubmitGuard`.
- `form-state.js` calls both of those — it will warn and skip init if they are missing.
- `countdown.js` has no dependencies.
- `defer` guarantees execution order = DOM order.

---

## 🔒 Contracts

### Slice 1 — Countdown Contract
- Read `data-target` from `#countdown-target` (UTC ISO 8601).
- Every tick recomputes `remaining = Date.parse(target) - Date.now()`.
- **Never decrements a cached counter.**
- Schedules via recursive `setTimeout` aligned to the next second boundary:
  `delay = 1000 - (Date.now() % 1000)`.
- Cleans up on `pagehide` via `clearTimeout`.
- Invalid target → safe fallback (`--:--:--`), no uncaught exception.
- Renders via `textContent` only.

### Slice 2 — Form FSM Contract
- **5 states:** `idle`, `submitting`, `success`, `error`.
- **Frozen transition table:**

| From        | Allowed to                |
|-------------|---------------------------|
| `idle`      | `submitting`              |
| `submitting`| `success`, `error`, `idle`|
| `success`   | `idle`                    |
| `error`     | `idle`, `submitting`      |

- Illegal transitions → `console.warn` + `return false` — no throw.
- Validation via native Constraint Validation API.
- Status rendered via `textContent`.

### Slice 3 — Sanitizer Contract
- **Public API (frozen):**
  - `window.__sanitizeFormData(formData)` → `{ name, email, message }`
  - `window.__withSubmitGuard(action)` → `result | { skipped: true }`
- **3-layer sanitize (in order):**
  1. Strip control chars — removes C0/C1 except `\t\n\r`.
  2. Collapse whitespace — `\s+` → `' '`, then `trim()`.
  3. Clip by code point — `Array.from(str).slice(0, max).join('')`.
- **Limits (code points):** `name=80`, `email=254`, `message=2000`.
- Guard allows one active submission; concurrent calls return `{ skipped: true }`.

### Security Contract
- Strict CSP meta in `<head>`.
- Zero inline event handlers.
- Zero `innerHTML` with user input — `textContent` only.
- Zero `var`.

---

## ✅ Verification Checklist

| Check                              | Command                                                                 | Expected        |
|------------------------------------|-------------------------------------------------------------------------|-----------------|
| No `<div>` for structure           | `grep -c "<div" index.html`                                             | `0`             |
| Exactly one `<h1>`                 | `grep -c "<h1" index.html`                                              | `1`             |
| `<time>` has UTC ISO               | `grep -c 'datetime="2026-12-31T23:59:59Z"' index.html`                 | `1`             |
| Script load order                  | `grep -n 'sanitize\|form-state\|countdown' index.html`                 | sanitize < form-state |
| No `setInterval`                   | `grep -n "setInterval" js/countdown.js`                                 | empty           |
| `pagehide` cleanup                 | `grep -n "pagehide" js/countdown.js`                                    | present         |
| `Array.from` clip                  | `grep -n "Array.from" js/sanitize.js`                                   | present         |
| Frozen transitions                 | `grep -c "Object.freeze" js/form-state.js`                              | `≥ 2`           |
| No `innerHTML`                     | `grep -rn "innerHTML" js/`                                              | empty           |
| No `var`                           | `grep -rnE "\bvar\b" js/`                                               | empty           |

### Manual Tests
- ✅ Countdown ticks every second
- ✅ Background tab 2 min → countdown stays within 1 second of `Date.parse(target) - Date.now()`
- ✅ Invalid `data-target` → `--:--:--`, no console error
- ✅ Form: empty submit blocked by native validation
- ✅ Form: valid submit → `submitting` → `success` → `idle`
- ✅ Form: double-click Register → only one request (submit guard)
- ✅ XSS payload `<img src=x onerror=alert(1)>` → rendered as literal text, no alert
- ✅ Full keyboard Tab + Enter flow
- ✅ 375px viewport: no horizontal scrollbar
- ✅ Console errors: 0

---

## 🎤 Live Defense Notes

| Instructor change                                | Expected fix location                          |
|--------------------------------------------------|------------------------------------------------|
| Change `data-target` to a new UTC datetime       | HTML only — countdown recomputes               |
| Break `data-target="invalid"`                    | Safe fallback shows `--:--:--` — no JS change  |
| Swap script order (form-state before sanitize)   | `form-state` logs warning and skips — proves dependency |
| Change name limit from 80 to 20                  | `LIMITS` in `js/sanitize.js` — one line        |
| Remove `pagehide` listener                       | Observe timer leak in Performance timeline     |
| Replace `shift()` with `pop()` in recorder (HW2) | N/A here — HW3 has no recorder                 |

---

## 🧠 Engineering Principles
- **Decompose before prompting.** WBS written before any code.
- **Contract-first.** Define `data-target`, FSM states, sanitizer layers before implementation.
- **One prompt = one task = one file = one commit.**
- **Verify with DevTools, never assume.** Every defect in `AI_FAILURE_AUDIT.md` was reproduced before fixing.
- **AI writes boilerplate; the engineer proves correctness.**
- > "AI can generate code. Developers are responsible for proving that it is correct."

---

## 📚 References
- MDN — [Date.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)
- MDN — [window.setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout)
- MDN — [pagehide event](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)
- MDN — [Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation)
- OWASP — [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

---

## 📄 License
Academic coursework — not licensed for reuse.