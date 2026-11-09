# Bright glass interface

The current visual layer is `editorial.css`: warm fixed mesh, orange primary actions with dark text, frosted 20px surfaces, 14px nested controls, pill buttons, Montserrat 800 headings and Be Vietnam Pro body text. Fonts and redistribution licenses are local under `assets/fonts/`.

`style.css` retains component behavior/layout foundations; obsolete monospace, tiny type and dark image-viewer fills were removed there. `index.html` provides the wider shell, dashboard table scroller, assignment date/search inputs and menu utilities. `editorial.js` handles menu utilities, focus restoration and persisted display preferences. `app.js` retains existing homework/cloud/financial handlers and adds student fee overview tiles, bounded fee columns, complete action queues, date/search filtering and safe empty-detail clearing.

Desktop views have a complete flex sizing chain into their internal scrollers. Only assignments scroll the document. Mobile stacks cards and permits document scrolling. Dashboard student/date/status columns remain 160/130/140px; the table scrolls horizontally when these widths exceed the middle card. Student fee tiles form a horizontal overview. Long money values have compact dashboard representations with full accessible values; account totals retain exact amounts.

Nested text surfaces use 0.55 opacity to satisfy the brief's 0.5 minimum. Selected student tiles layer orange tint over glass. Status tints have a white underlay to keep their specified dark colors readable even inside selected orange rows. Missing blur support uses 0.9 white; reduced transparency or increased contrast uses solid white. Reduced motion disables transitions/animations.

## Verification

[Full proof, scroll-height matrix and all 28 screenshots](verification/bright-glass/README.md).

The browser suite uses Firefox Marionette, including exact inner viewport dimensions and a real 390×844 iframe for mobile. `tests/preview_server.py` omits the Supabase SDK and disables HTTP caching: screenshots and interaction tests never contact production data. Fixture motion is disabled for stable screenshots; separate browser preference tests check reduced motion itself.

```bash
python3 tests/preview_server.py
# In a second terminal, using a disposable profile:
firefox --headless --no-remote --profile /tmp/homework-glass-firefox --marionette
# In a third terminal:
python3 tests/glass-browser.py
python3 tests/glass-interactions.py
node --test tests/*.test.cjs
```

Accessibility preference checks use a second disposable profile with a different Marionette port and `--remote-allow-system-access`; see the proof document for exact commands. They change preferences only in that disposable browser.

Live cloud writes, SQL migration, deployment and other browser engines were not exercised. Existing cloud access limitations remain documented in [fee tracking](fee-tracking.md).
