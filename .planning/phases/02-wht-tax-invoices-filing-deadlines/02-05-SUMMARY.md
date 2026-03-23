---
phase: 02-wht-tax-invoices-filing-deadlines
plan: 05
subsystem: ui
tags: [dashboard, filing-deadlines, wht, thai-tax, server-actions, nextjs]

# Dependency graph
requires:
  - phase: 02-01
    provides: Filing deadline service (getDeadlinesForMonth), FilingStatus model (upsertFilingStatus, getFilingStatusesForMonth), Thai holiday calendar
  - phase: 02-03
    provides: WHT transaction data with whtAmount and whtType columns available for aggregation
  - phase: 02-04
    provides: Income transactions with WHT amounts auto-created from tax invoice flow
provides:
  - Color-coded filing deadline alert cards on dashboard (green/amber/red urgency coding per D-07)
  - Filing status toggle: mark-as-filed / undo from dashboard card (per D-08)
  - WHT monthly summary card showing PND3, PND53, and total withheld amounts
  - getWHTSummary and getUpcomingDeadlines data functions in models/stats.ts
  - toggleFilingStatusAction server action in components/dashboard/filing-deadline-actions.ts
affects: [phase-03, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server action co-located in components/dashboard/ (not app/ actions.ts) for widget-specific mutations"
    - "DeadlineWithStatus composite type joins FilingDeadline + status in stats model layer"
    - "Parallel data fetch in dashboard page extends existing Promise.all pattern"
    - "Color selection logic: filed=gray, overdue/<3days=red, <=7days=amber, >7days=green"

key-files:
  created:
    - components/dashboard/filing-deadline-card.tsx
    - components/dashboard/filing-deadline-actions.ts
    - components/dashboard/wht-summary-card.tsx
  modified:
    - models/stats.ts
    - app/(app)/dashboard/page.tsx

key-decisions:
  - "Filing deadline status toggle server action placed in components/dashboard/ (not app/ actions.ts) to keep widget mutation co-located"
  - "getUpcomingDeadlines fetches previous month deadlines since filing happens in current month for prior month's taxes"
  - "DeadlineWithStatus computed in stats model layer to keep dashboard page lean"

patterns-established:
  - "Widget server actions: co-locate in components/dashboard/{widget}-actions.ts"
  - "Dashboard data: parallel fetch all stats in single Promise.all in page.tsx"

requirements-completed: [FILE-02, FILE-03]

# Metrics
duration: 25min
completed: 2026-03-23
---

# Phase 2 Plan 05: Filing Deadline Dashboard Alerts Summary

**Filing deadline cards with green/amber/red urgency color-coding, mark-as-filed toggle, and WHT monthly summary widget wired into the BanChee dashboard**

## Performance

- **Duration:** ~25 min (Tasks 1-2 automated, Task 3 human verified)
- **Started:** 2026-03-23T15:12:00Z (estimated from prior tasks)
- **Completed:** 2026-03-23T15:38:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 5

## Accomplishments
- Stats model extended with `getWHTSummary` (aggregates pnd3/pnd53 withheld amounts by month) and `getUpcomingDeadlines` (joins FilingDeadline with FilingStatus to compute urgency)
- Filing deadline alert cards render color-coded urgency per D-07 (green >7 days, amber 3-7 days, red <3 days / overdue) with "ยื่นแล้ว" / "ยกเลิก" toggle button per D-08
- WHT summary card shows three-metric grid (PND3, PND53, total) matching VAT summary card visual pattern
- Dashboard page integrates all new widgets via extended `Promise.all` parallel fetch alongside existing VAT widgets
- User visually verified all Phase 2 features end-to-end: WHT flow, tax invoices, filing deadlines

## Task Commits

Each task was committed atomically:

1. **Task 1: Stats model extensions + filing deadline card + WHT summary card** - `e5b6393` (feat)
2. **Task 2: Dashboard page integration** - `3c97e0c` (feat)
3. **Task 3: Phase 2 end-to-end visual verification** - checkpoint approved by user (no code commit)

## Files Created/Modified
- `/Users/ohmmingrath/Projects/banchee/models/stats.ts` - Added `WHTSummary` type, `getWHTSummary()`, `DeadlineWithStatus` type, and `getUpcomingDeadlines()` functions
- `/Users/ohmmingrath/Projects/banchee/components/dashboard/filing-deadline-card.tsx` - Color-coded filing deadline card grid with status toggle, Thai labels, urgency logic
- `/Users/ohmmingrath/Projects/banchee/components/dashboard/filing-deadline-actions.ts` - `toggleFilingStatusAction` server action calling `upsertFilingStatus` + `revalidatePath`
- `/Users/ohmmingrath/Projects/banchee/components/dashboard/wht-summary-card.tsx` - WHT monthly summary widget (PND3, PND53, total) matching VAT card pattern
- `/Users/ohmmingrath/Projects/banchee/app/(app)/dashboard/page.tsx` - Imports and renders FilingDeadlineCard and WHTSummaryCard with parallel data fetching

## Decisions Made
- Filing deadline status toggle server action placed in `components/dashboard/filing-deadline-actions.ts` (not the app/ actions.ts pattern) to keep widget mutations co-located with the widget component
- `getUpcomingDeadlines` queries the previous month's deadlines because Thai tax filing is always for the prior period (e.g., March filings are for February transactions)
- `DeadlineWithStatus` join computed in the stats model layer to keep the dashboard page component lean

## Deviations from Plan

None - plan executed exactly as written. User checkpoint approved all Phase 2 features end-to-end.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 complete: WHT management, tax invoice creation, and filing deadline dashboard all working
- All 5 plans in Phase 2 delivered and verified by user
- Phase 3 (CIT / annual income tax) can proceed — it depends on WHT data (now available) and transaction categorization (Phase 1)
- Known concern: Section 65 Tri rules for Phase 3 have edge cases (entertainment expense 0.3% cap) requiring careful implementation

---
*Phase: 02-wht-tax-invoices-filing-deadlines*
*Completed: 2026-03-23*
