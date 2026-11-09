# Bright glass verification — 2026-11-09

Firefox 150 / Marionette. All seven screens were captured and visually reviewed at **1366×768, 1440×900, 1920×1080 and 390×844**. Dimensions below are the content viewport (`innerWidth`/`innerHeight`), not the outer browser window. Mobile uses a genuine 390×844 same-origin iframe because desktop Firefox enforces a minimum outer window width.

The isolated QA server omits the Supabase CDN script before loading app code and disables caching. Fixtures contain six students, 24 assignments (regular/recurring, pending/submitted/approved/late) and student-owned charges/payments, including an empty account. No production data appears in these screenshots. Motion is disabled for stable screenshot capture; OS media preference behavior is tested separately.

## Scroll-height proof

Each cell is **document scrollHeight / innerHeight**, in pixels. Only Bài tập exceeds the viewport on desktop. Internal cards are allowed to scroll. Geometry assertions also verify that cards themselves remain inside the viewport; merely hiding document overflow cannot pass.

| Page | 1366×768 | 1440×900 | 1920×1080 | 390×844 |
| --- | --- | --- | --- | --- |
| Dashboard | 768 / 768 | 900 / 900 | 1080 / 1080 | 2426 / 844 |
| Học sinh | 768 / 768 | 900 / 900 | 1080 / 1080 | 2093 / 844 |
| Bài tập | 2888 / 768 | 2891 / 900 | 2898 / 1080 | 5094 / 844 |
| Streak Tracker | 768 / 768 | 900 / 900 | 1080 / 1080 | 2645 / 844 |
| Học phí | 768 / 768 | 900 / 900 | 1080 / 1080 | 2121 / 844 |
| Cài đặt | 768 / 768 | 900 / 900 | 1080 / 1080 | 844 / 844 |
| Login | 768 / 768 | 900 / 900 | 1080 / 1080 | 844 / 844 |

## Screenshots

| Page | 1366×768 | 1440×900 | 1920×1080 | 390×844 |
| --- | --- | --- | --- | --- |
| Dashboard | [Open](dashboard-1366x768.png) | [Open](dashboard-1440x900.png) | [Open](dashboard-1920x1080.png) | [Open](dashboard-390x844.png) |
| Học sinh | [Open](students-1366x768.png) | [Open](students-1440x900.png) | [Open](students-1920x1080.png) | [Open](students-390x844.png) |
| Bài tập | [Open](tasks-1366x768.png) | [Open](tasks-1440x900.png) | [Open](tasks-1920x1080.png) | [Open](tasks-390x844.png) |
| Streak Tracker | [Open](streaks-1366x768.png) | [Open](streaks-1440x900.png) | [Open](streaks-1920x1080.png) | [Open](streaks-390x844.png) |
| Học phí | [Open](tuition-1366x768.png) | [Open](tuition-1440x900.png) | [Open](tuition-1920x1080.png) | [Open](tuition-390x844.png) |
| Cài đặt | [Open](settings-1366x768.png) | [Open](settings-1440x900.png) | [Open](settings-1920x1080.png) | [Open](settings-390x844.png) |
| Login | [Open](login-1366x768.png) | [Open](login-1440x900.png) | [Open](login-1920x1080.png) | [Open](login-390x844.png) |

## Audit results

Across all 28 page/size combinations, **zero findings** for:

- Text below 12px; dark filled backgrounds; remaining lime colors.
- Navigation overlap or wrapped/clipped status badges and navigation labels.
- Headings clipped by containers, or Vietnamese glyph ink exceeding the padded line box.
- Desktop work cards extending below the viewport; horizontal document overflow; content touching viewport edges. Intentional internal scrolling regions are excluded from edge warnings.
- Text contrast below AA thresholds (4.5:1 for normal text; 3:1 for large text).

The lowest calculated text contrast was **4.70:1**. Dark text `#1A1008` on orange `#FF7A1A` is **7.18:1**, and on hover `#F26A0A` is **6.10:1**. The audit composites text/background alpha and solid tint gradients through the ancestor surfaces against extreme mesh palette stops. This is a conservative color calculation, combined with screenshot review; it is not a claim of certification across browsers, images or arbitrary user styles.

Local fonts loaded for “BÀI TẬP CẦN CHẤM ĐIỂM”, “Hạn nộp”, “Chưa duyệt” and “Nguyễn Thị Lượng”. At 32px the uppercase test phrase has 41px ink height, within the 43.2px padded heading line box; body test phrases fit 24px line boxes. Actual rendered headings are measured separately, including uppercase conversion.

[Raw per-screen metrics](metrics.json).

## Functional proof

**45 browser interaction/visual checks passed** ([record](interactions.json)). They cover:

- All 18 pending/urgent rows present; queue/table scroll access; detail heading stays pinned while its last action remains reachable.
- Teacher student-tile switching; payment, dated charge, fee edit/delete; exact owner isolation; zero-balance account; summary updates.
- Real student PIN login with stale teacher selection; own tile/history only; no fee write controls; rejected cross-account write.
- Combined assignment student/status/date/text filters and meaningful no-results state.
- Student and assignment creation, student edit/delete, image and document upload, student submission, teacher approval and correctly owned reward.
- Menu opening/navigation/closing, command search, persisted large text and motion preferences.
- Upload removal-button contrast, student/task forms, image viewer and deletion dialog visual audits.
- Empty cards shrink and clear stale detail; populated dashboards remain usable at 900, 1000, 1100 and 1280px; large positive balances and credits remain within stat tiles.

Supplemental screenshots: [empty dashboard](dashboard-empty.png), [student upload](student-upload.png), [menu](menu.png), [command palette](command-palette.png), [student form](student-form.png), [assignment form](assignment-form.png), [image viewer](submission-viewer.png), [confirmation](delete-confirmation.png).

**15 Node regression cases passed**: [ledger](ledger-tests.tap), [app fees](app-fee-tests.tap), [new UI behaviors](glass-tests.tap). JavaScript syntax checks and `git diff --check` passed.

## Accessibility preferences

Actual Firefox preference emulation verified:

| Mode | Result |
| --- | --- |
| Reduced transparency | White surfaces; no backdrop blur |
| Increased contrast | White surfaces; no backdrop blur |
| No backdrop-filter support | rgba(255,255,255,0.9) fallback |
| Reduced motion | Transition duration 0s; animations disabled |
| Dashboard and command search focus | 2px solid #FF7A1A outline |

[Raw preference results](accessibility.json). Screenshot links: [reduced transparency](reduced-transparency.png), [high contrast](high-contrast.png), [no blur](no-blur-support.png), [reduced motion](reduced-motion.png).

Reduced transparency media emulation enables Firefox's corresponding media-query flag in the disposable test profile. High contrast uses its forced-colors preference; missing blur support disables the CSS property. The tests assert the media queries or CSS.supports results before inspecting the surfaces. Reduced motion is tested without the screenshot fixture's reduced-motion class.

## Root causes and fixes

1. The previous visual layer explicitly forced square edges, black borders and monospace type, opposing this brief. Replaced it with shared glass/typography/status tokens; removed leftover dark fills/tiny type and bundled Vietnamese fonts.
2. Header content exceeded laptop width, while an older inner container consumed extra horizontal space. Removed duplicate container padding, widened the shell and supplied menu utilities below 1280px.
3. A missing flex container let whole views expand far below the viewport. Overflow hiding concealed that content. Completed the sizing chain and tested real card geometry and internal scroll reachability.
4. The fee grid assumed wrappers absent from the rendered HTML. Rebuilt explicit overview/account/history sections while retaining the existing ownership and payment handlers.
5. The action queue stopped at six items; assignment filters lacked date/search; empty filtered results retained stale detail. Completed the queue and filters and reset empty detail state.
6. Strong legacy selectors retained white text on upload controls, and stacked notifications intercepted dialog buttons. Added dark upload removal text and non-intercepting, bounded, readable notifications. Independent review identified the upload contrast defect; its regression failed at 1.01:1 before the fix.
7. Intermediate desktop layout collapsed work areas and common million-dong metrics overflowed. Kept three usable columns and compacted long dashboard money values with full accessible labels/tooltips.

8. Legacy search-field ID selectors suppressed keyboard focus rings. Explicit focused-field rules restore the required 2px orange outlines; both are checked in browser automation.

## Changed files

- [editorial.css](../../../editorial.css): theme, all screen/dialog layouts, responsive rules and accessibility fallbacks.
- [style.css](../../../style.css): base fonts, minimum sizes and legacy dark fills.
- [index.html](../../../index.html): local font loading, table scroller, date/search filters, menu utilities and login copy.
- [app.js](../../../app.js): fee overview/layout, date/search behavior, complete queue, empty detail reset and metric formatting.
- [editorial.js](../../../editorial.js): collapsed menu utilities; existing focus/preferences retained.
- [favicon.svg](../../../favicon.svg), [font assets/licenses](../../../assets/fonts/README.md), [README](../../../README.md), [UI documentation](../../ui-redesign.md), implementation plan, test scripts and this proof bundle.

## Repeat and limits

From repository root, run `python3 tests/preview_server.py`, launch a disposable headless Firefox profile with `--marionette`, then run `python3 tests/glass-browser.py` and `python3 tests/glass-interactions.py`. Run `node --test tests/*.test.cjs` for Node regressions.

For preference checks, create `/tmp/homework-glass-accessibility/user.js` containing `user_pref("marionette.port", 2830);`, launch Firefox with that profile plus `--marionette --remote-allow-system-access`, then run `HOMEWORK_MARIONETTE_PORT=2830 python3 tests/glass-accessibility.py`. The runner restores its preference overrides afterward.

The dashboard keeps exact 160/130/140px student/date/status columns, so laptop screens use internal horizontal table scrolling. The student fee overview also scrolls horizontally. Mobile has ordinary document scrolling.

Live Supabase writes/storage, SQL migration, deployment and non-Firefox engines were not tested. Existing anonymous Supabase RLS does not provide server-enforced fee confidentiality; the app's student view/query scoping is verified here, and the existing database access boundary remains documented in [fee tracking](../../fee-tracking.md). No live service or schema was changed.
