# Student-owned fee tracking

Run `node tests/fee-ledger.test.cjs` (Node 22+). No packages required.

## Migration

Offline: v1 localStorage remains untouched; v2 has a full `legacyBackup`. With exactly one existing student, migrate to that account. Otherwise the teacher selects the confirmed student in Fees and clicks the assignment action. Explicitly tagged records keep their owners; unknown/deleted owners are preserved in `orphans`, outside active student ledgers. The opening adjustment preserves the old total; no history is truncated. Never infer ownership from a name such as Khải.

Cloud: back up your database, then run `fee-migration.sql` in Supabase SQL editor. If multiple accounts exist, set the confirmed owner's UUID on the indicated line first. The script runs transactionally, creates an RLS-protected full v1 backup, aborts on ambiguity, preserves the previous shared balance as an opening adjustment, requires student ownership, and cascades student deletion. Repeat runs do not duplicate opening charges. Reload the app afterward. The migration also adds a unique per-student automatic event key. The app does not execute this SQL or upload a local legacy migration automatically. Cloud is authoritative, so local-only data must be exported and reconciled before enabling cloud. Do not merge two independently migrated histories.

New students have zero fees. Renewal pays the outstanding amount and adds a new 1,000,000đ charge. Totals show all positive charges and all payments/credits (including homework rewards/refunds); overdue applies credits against past-due charges first. Per-row status describes the account settlement context, not invoice-specific payment allocation. `balance_after` is retained for old clients/audit, but totals are computed from amounts, never global snapshots.

## Access boundary

This app uses a browser password/PIN gate, not Supabase Auth. Existing public RLS policies allow anonymous reads and writes, including other student data. Student fee queries and rendering are scoped in the app, but **database-level confidentiality requires Supabase Auth identities, a trusted role/student mapping, and replacing the public policies**. Do not represent this client-only gate as secure account isolation. The backup has no public policies. No live database changes were made during implementation.

## Manual regression checklist

- [ ] Create students A, B and C. Add different charges to A and B; C must show zero totals and an empty history.
- [ ] Switch A → B → C → A; verify history, totals and fee navigation badge. Reload and repeat.
- [ ] Add payment, reward, refund, dated charge, edit amount/note/due date, then delete. Only the selected account changes.
- [ ] Login as A and B separately; each sees only their own history/totals and no write controls. Try malformed/negative input and an invalid date.
- [ ] Approve A's homework, trigger overdue/streak penalties for B, rerun checks and reload: correct owner, no duplicate automatic charge/reward.
- [ ] Delete A: A's tasks and active fees disappear; B and C stay unchanged; old backup remains. Check another device after refresh.
- [ ] Migrate one-student legacy data and ambiguous multi-student data, cancel assignment, confirm assignment, reload, and verify no loss/duplicate opening balance.
- [ ] Run SQL twice against a staging database; verify backup, FK, no unowned rows and ambiguous migration rollback. Test >1,000 cloud fee records and failed network writes.
- [ ] Test login/switching roles, assignments/filtering, recurring submissions, photo/file upload, review, streaks, command palette and student CRUD after restyling.
- [ ] Check all views/dialogs at 375px and 1440px, keyboard focus/menu/Escape, reduced motion and scroll-to-top.


Automatic fee records carry stable event keys, so separate teacher browsers cannot insert the same reward or late penalty twice. Cloud hydration reconstructs retry/refund markers. Failed writes remove their optimistic record and roll back the matching marker. Automatic events remain in a persisted retry queue and retry after cloud hydration and every 60 seconds while a teacher is logged in. Legacy automatic notes are matched only when exactly one owned task has the exact original description. Renamed/deleted tasks or colliding truncated titles are flagged for manual reconciliation, and automatic fees pause rather than guess. Manual student fee controls remain available. Reconcile these rows to their task/event keys in staging before resuming automation.
