# TASK DECOMPOSITION — HW3: Resilient Landing Page

## Project Info
- Student: Nguyễn Tất Tấn Tài
- Deliverable: HW3 Resilient Landing Page (3 Slices)
- Minimum commits: 5

## Contracts

### HTML Contract
- Exactly one h1.
- Landmarks: header, main, footer.
- Zero div for structure.
- Countdown: time#countdown-target[datetime][data-target] with UTC ISO 8601.
- Form: #register-form with fields name, email, message.
- Status: p#form-status[role="status"][aria-live="polite"][data-state="idle"].
- Script load order: sanitize.js → form-state.js → countdown.js.

### Slice 1 — Countdown Contract
- Read data-target from #countdown-target.
- Each tick: remaining = Date.parse(target) - Date.now(). Recompute, never decrement.
- Recursive setTimeout aligned to next second: delay = 1000 - (Date.now() % 1000).
- pagehide → clearTimeout.
- Invalid target → safe fallback, no uncaught exception.
- Render: textContent only.

### Slice 2 — Form FSM Contract
- 5 states: idle, submitting, success, error.
- Frozen transition table:
    idle -> submitting
    submitting -> success | error | idle
    success -> idle
    error -> idle | submitting
- Illegal transitions rejected safely (no throw).
- Native Constraint Validation for validation.
- Status rendered via textContent.
- Double-click prevention: button disabled when submitting.

### Slice 3 — Sanitizer + Guard Contract
- Public: window.__sanitizeFormData(formData) -> plain object.
- Public: window.__withSubmitGuard(action) -> runs action at most once concurrently.
- 3-layer sanitize:
    1. stripControlChars: remove C0/C1 except \t\n\r
    2. collapseWhitespace: \s+ -> ' ', trim
    3. clipByCodePoint: Array.from(str).slice(0, max).join('')
- Limits: name=80, email=254, message=2000 code points.
- Guard allows one active submission; concurrent duplicates return { skipped: true }.
- Contract frozen with Object.freeze.

### Security Contract
- Zero inline handlers.
- Zero innerHTML with user input.
- Meta CSP in head.

### AI Failure Audit Contract (mandatory 15%)
- Document exactly 3 AI-induced defects:
  (a) setInterval countdown drift
  (b) innerHTML XSS
  (c) missing timer cleanup (memory leak)
- Each defect: Description + Diagnostic Method + Refactored Solution.

## WBS Table

| ID | Sub-task | Output file | Acceptance | Commit |
|----|----------|-------------|------------|--------|
| HW3-00 | Define WBS + rules | TASK_DECOMPOSITION.md, project-rules.md | Docs before code | docs(spec): define WBS and slice contracts |
| HW3-01 | Semantic landing tree | index.html | 1 h1, 0 div, time[data-target] UTC, form | feat(html): build semantic landing tree |
| HW3-02 | Reset | css/reset.css | No color, no hex | feat(css): box-sizing reset and base normalization |
| HW3-03 | Tokens | css/tokens.css | Contrast >= 4.5:1 both modes | feat(css): define resilient design tokens |
| HW3-04 | Layout | css/layout.css | Grid auto-fit, 375px no h-scroll | feat(css): implement responsive grid and flex layout |
| HW3-05 | Components | css/components.css | Form states, focus ring, status colors | feat(css): style accessible cards buttons and forms |
| HW3-06 | Countdown (Slice 1) | js/countdown.js | Drift-free, pagehide cleanup, textContent | feat(js): add drift-free countdown slice |
| HW3-07 | Form FSM (Slice 2) | js/form-state.js | 5 states, frozen table, safe reject | feat(js): add explicit form state machine |
| HW3-08 | Sanitizer + Guard (Slice 3) | js/sanitize.js | 3 layers, Array.from clip, frozen contract | feat(js): add form sanitization and submit guard |
| HW3-09 | Fix load order | index.html | sanitize.js before form-state.js | fix(html): load sanitize before form state |
| HW3-10 | AI Failure Audit | AI_FAILURE_AUDIT.md | 3 defects, each 3 sections | docs(audit): document AI failure modes and fixes |
| HW3-11 | README | README.md | Setup + verification reproducible | docs(readme): document setup architecture and verification |

## Verification Gates
- After HW3-06: background 2 min → countdown accurate within 1 tick.
- After HW3-07: illegal transition rejected safely.
- After HW3-08: XSS payload `<img src=x onerror=alert(1)>` treated as text.
- After HW3-09: window.__sanitizeFormData exists before form-state.js runs.
- After HW3-11: Lighthouse A11y >= 95.
