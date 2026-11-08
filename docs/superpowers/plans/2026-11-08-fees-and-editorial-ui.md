# Student fees and editorial UI implementation plan

Goal: isolate fees by student and apply the supplied editorial design while preserving homework workflows.
Architecture: retain the static HTML/CSS/JS app and Supabase integration. A pure FeeLedger module owns validation, migration and totals. app.js owns role checks, selection, rendering and persistence.
Spec: user request in this session; exact colors white, #1B1B1B, #111111 and #F4561D, square borders, monospace body and uppercase sans headings.

## Part A
- [x] Write and run failing Node tests for two students, payments, due dates, empty accounts, invalid values, cross-student mutations, deletion, and ambiguous/idempotent migration.
- [x] Implement fee-ledger.js; no new dependencies. Preserve full legacy backup and require explicit ownership if multiple accounts exist. Zero fees means zero balance; legacy baseline is preserved as an opening charge.
- [x] Integrate teacher selector, scoped mutations and automatic adjustments; scoped dashboard totals; retain all logs on cloud reads; add due date/status/note edit and delete controls.
- [x] Add transactional SQL migration with backup, explicit owner for ambiguous legacy records, mandatory student FK and cascade deletion. Document public-RLS authentication limitation.
- [x] Run tests and JS syntax checks, document manual multi-role/cloud checks, commit Part A independently.

## Part B
- [x] Apply shared theme across all views/dialogs and add original currentColor engraving SVGs; alternate light/dark and zigzag hero sections while retaining data workflows.
- [x] Add accessible menu and settings view, focus treatment, orange scroll-top and reduced motion.
- [x] Verify responsive views and interactions where browser tooling is available, run regression checks, commit Part B independently.

Review focus: cloud pagination, stale selected student after deletion, legacy shared snapshots, cross-role fee access, and offline writes during sync. Never apply migrations to the live service during this task.
