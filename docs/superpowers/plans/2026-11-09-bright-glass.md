# Bright glass implementation plan

**Goal:** Apply the user's complete bright orange glass brief to all seven screens without changing homework or fee persistence.
**Architecture:** Retain static HTML, existing app handlers, FeeLedger and Supabase. Replace editorial.css, adapt markup and narrowly extend app.js. Self-host Google Fonts for local use.
**Spec:** User's pasted request, 2026-11-09. Exact colors, typefaces, radii, contrast and four viewport sizes are acceptance criteria.

- [x] Inspect all screens and record root causes. Existing CSS enforces square edges/monospace, header overflows, fee grid assumes nonexistent wrappers, action queue truncates pending items.
- [x] Create behavioral regressions for fee tiles, scoped history and assignment search/date filters; run before changes.
- [x] Replace theme with shared glass/nested/status tokens; add readable font scale, mesh, bright overlays, solid-surface and motion fallbacks.
- [x] Widen main/header to 1800px, establish 6 metrics and 1:2:1.25 dashboard grid, fixed table columns with internal scrolling, pinned detail heading and internal desktop scrolling.
- [x] Structure fee page into student overview, selected account controls and full internally scrolling history. Preserve ownership checks and all financial handlers.
- [x] Add compact assignment filters; responsive menu utilities; retain all other workflows and login.
- [x] Automate every screen at actual 1366×768, 1440×900, 1920×1080 and 390×844 content viewports. Capture/review every screenshot. Audit typography, contrast, colors, headings, edges, overflow; exercise fees, menus, filtering and accessibility preferences.
- [x] Run existing Node regressions, syntax checks and git diff checks; write proof and known limits to docs/verification.

## Implementation decisions
- Work in the provided local checkout as requested. No publishing, live SQL or live data writes.
- Text-bearing nested surfaces use at least 0.5 opacity; 0.45 is reserved for decorative empty surfaces, resolving the brief's readability requirement.
- At laptop widths the table retains exact student/date/status widths and scrolls internally; compact type would violate the brief.
- Browser QA uses Firefox Marionette (equivalent browser automation) because Playwright is not installed. Mobile uses an actual 390px iframe viewport if Firefox's outer-window minimum prevents resizing.
- Desktop sizing targets innerWidth/innerHeight, compensating browser chrome; outer window dimensions are insufficient.


## Completion record

All planned tasks completed. Independent review found white upload removal text on glass; the browser regression reproduced 1.01:1 contrast, then passed with dark text. Added upstream font notices. Populated 900/1000/1100/1280px dashboard checks caught an unusable two-row layout, replaced with three usable columns. Additional failing regressions caught stale empty details and million-dong metrics overflowing tiles; both were corrected. Notification stacks no longer intercept dialog controls.

Browser/source/test evidence lives in `docs/verification/bright-glass/`. No live cloud writes, SQL migration or publishing occurred.
