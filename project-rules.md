# Project Architectural Constraints — HW3 Resilient Landing

## Tech Stack
- Vanilla HTML5 + modern CSS + ES6+ JS only.
- No CDN, no library, no jQuery.
- Live Server at http://localhost:5500 ONLY. file:/// banned.

## Code Standards
- const by default; let only if reassigned. var banned.
- Zero innerHTML with user input. Use textContent only.
- Zero inline event handlers.
- Semantic HTML over generic div.
- Mobile-first 375px.

## Accessibility (WCAG 2.2 AA)
- Exactly one h1.
- Full keyboard Tab + Enter flow.
- Visible :focus-visible outline 3px.
- Contrast >= 4.5:1.
- role="status" + aria-live="polite" for feedback.

## Resilience Contracts
- Countdown: recompute from Date.parse(target) - Date.now() EVERY tick. Never decrement cached.
- Countdown: recursive setTimeout, second-boundary aligned. Never setInterval.
- Countdown: pagehide → clearTimeout.
- Countdown: invalid target → safe fallback, no throw.
- Form FSM: 5 states (idle, submitting, success, error). Frozen transition table.
- Form FSM: illegal transitions rejected safely.
- Sanitizer: 3 layers (strip control chars, collapse whitespace, clip by code point with Array.from).
- Sanitizer limits: name=80, email=254, message=2000 code points.
- Submit guard: one active submission, concurrent duplicates rejected.
- Render: textContent only.

## Security
- CSP meta tag in head.
- Zero XSS hazard: all user input goes through sanitizer.

## Workflow
- Atomic commits only. One task = one commit.
- Docs committed BEFORE any code.
- Minimum 5 commits.
