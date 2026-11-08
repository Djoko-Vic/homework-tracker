# Editorial interface

The app keeps its existing in-page navigation and homework workflows. `editorial.css` is the visual layer over the existing component layout. Tokens are at its top; `style.css` now uses Inter and IBM Plex Mono, with system fallbacks. No UI framework or package dependency was introduced.

`editorial.js` creates five original inline currentColor SVG drawings (book, pencil/ruler, hourglass, backpack, owl), alternating section introductions, an accessible native dialog menu, and device-local text/motion preferences. Study subjects were assumed because no theme preference had arrived. Login, dashboard, assignments, fees, students, streaks, settings and existing dialogs share the theme. `favicon.svg` is original.

## Verification

- Eleven Node regression tests: ledger ownership, totals, empty state, dates/amounts, scoped edit/delete, migration backup/ambiguity/idempotence, deleted student and app role/selection guards.
- Headless Firefox 150: all six views at desktop 1440px and a true mobile 375px iframe, with no horizontal page overflow. Local table scrolling is intentional.
- Browser exercise: separate A/B fee charges and visible histories, menu navigation/open/close, persisted display preferences, and login rendering. The test disables cloud writes before setting a teacher identity.
- JS syntax checks and `git diff --check`.
- Live database SQL and production upload/review workflows were not executed. Follow `docs/fee-tracking.md` for the remaining staging/manual checks.

To repeat browser checks, start a localhost server on port 8765 and headless Firefox with Marionette on port 2828 using a disposable profile, then run `python3 tests/browser-smoke.py`. It uses only Python's standard library and writes screenshots to `/tmp/homework-*.png`. Firefox's desktop minimum window width is 500px, so the script additionally creates a 375px iframe and asserts all views fit that actual viewport.
