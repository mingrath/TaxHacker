---
phase: 04-export-interoperability
plan: 01
subsystem: export
tags: [exceljs, fast-csv, pipe-delimited, xlsx, csv, thai-tax, pp30, pnd3, pnd53, flowaccount]

requires:
  - phase: 01-vat-core
    provides: "VATReportData, PP30Fields, TransactionForReport types from vat-report/actions.ts"
  - phase: 02-wht-invoicing
    provides: "WHTReportData, WHTTransactionForReport types from wht-report/actions.ts"
  - phase: 01-vat-core
    provides: "BusinessProfile type and getBusinessProfile from models/business-profile.ts"
  - phase: 01-vat-core
    provides: "toBuddhistYear from services/thai-date.ts"
provides:
  - "generatePP30Txt, generatePND3Txt, generatePND53Txt — RD pipe-delimited TXT export"
  - "generateFlowAccountCSV, FlowAccountTransaction type — FlowAccount CSV export"
  - "generateAccountantExcel, ExportDataForExcel, IncomeExpenseRow types — Thai accountant .xlsx export"
affects: [04-02-PLAN, ui-export-routes]

tech-stack:
  added: [exceljs]
  patterns: [pure-function-export-services, satang-to-baht-conversion, pipe-delimited-format]

key-files:
  created:
    - services/export-rd.ts
    - services/export-rd.test.ts
    - services/export-flowaccount.ts
    - services/export-flowaccount.test.ts
    - services/export-excel.ts
    - services/export-excel.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "ExcelJS writeBuffer returns ArrayBuffer, wrapped in Buffer.from() for Node.js compatibility"
  - "fast-csv does not emit headers for empty input; manual header fallback for empty FlowAccount CSV"
  - "PP30 TXT uses single data row (one tax return per file); PND TXT uses multiple rows (one per payee)"
  - "WHT rate stored in basis points (300=3%), converted to percentage only at export layer"

patterns-established:
  - "Export services are pure transformation functions: data-in, file-buffer/string-out, no side effects"
  - "satangToBaht helper in each module (string for TXT/CSV, numeric for Excel)"
  - "Cover rows pattern for Excel: company name, Tax ID, period label, then data"

requirements-completed: [RPT-03, RPT-04, RPT-05]

duration: 7min
completed: 2026-03-24
---

# Phase 4 Plan 1: Export Services Summary

**RD pipe-delimited TXT (PP30/PND3/PND53), FlowAccount CSV, and Thai accountant Excel workbook generators with ExcelJS**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T02:02:45Z
- **Completed:** 2026-03-24T02:09:59Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Three export service modules producing Revenue Department TXT, FlowAccount CSV, and .xlsx files
- All amounts correctly convert from satang (integer storage) to baht (2 decimal display)
- RD exports use Buddhist Era dates and pipe delimiters; FlowAccount uses Gregorian dates and comma delimiters
- Excel workbook has 5 Thai-named worksheets with business profile cover rows, formatted number columns, and section headers
- 35 unit tests covering all export functions, edge cases (empty input, null dates), and format verification

## Task Commits

Each task was committed atomically:

1. **Task 1: Install ExcelJS + create RD TXT and FlowAccount CSV exports** - `8a9683d` (feat)
2. **Task 2: Create Thai accountant Excel workbook generator** - `4dc5e5d` (feat)

## Files Created/Modified
- `services/export-rd.ts` — RD pipe-delimited TXT generators (PP30, PND3, PND53)
- `services/export-rd.test.ts` — 17 unit tests for RD exports
- `services/export-flowaccount.ts` — FlowAccount-compatible CSV generator
- `services/export-flowaccount.test.ts` — 8 unit tests for FlowAccount export
- `services/export-excel.ts` — Thai accountant Excel workbook with 5 worksheets
- `services/export-excel.test.ts` — 10 unit tests for Excel export
- `package.json` — Added exceljs dependency
- `package-lock.json` — Lock file updated

## Decisions Made
- ExcelJS writeBuffer returns ArrayBuffer; wrapped in Buffer.from() for Node.js compatibility
- fast-csv does not emit headers when no rows are written; added manual header fallback for empty FlowAccount CSV
- PP30 TXT uses single data row (one tax return per file); PND TXT uses multiple rows (one per payee) plus TOTAL summary row
- WHT rate stored in basis points (300=3%); converted to percentage (3.00) only at the export layer
- Export services are pure functions with no database access or side effects — callers provide all data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] fast-csv empty input produces no output**
- **Found during:** Task 1 (FlowAccount CSV export)
- **Issue:** `@fast-csv/format` with `writeHeaders: true` does not emit header row when no data rows are written
- **Fix:** Added early-return for empty input that manually builds CSV header string
- **Files modified:** services/export-flowaccount.ts
- **Verification:** Empty input test passes, returns header-only CSV
- **Committed in:** 8a9683d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for correctness of empty-input handling. No scope creep.

## Issues Encountered
- Pre-existing build error in `app/(app)/apps/notes/actions.ts:171` (Prisma JsonValue type mismatch) causes `next build` to fail. Verified this exists before Phase 04 changes. Logged to `deferred-items.md`. Does not affect export services (which are pure functions with no build-time imports from the failing module).

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all export functions are fully wired to their input types and produce complete output.

## Next Phase Readiness
- Export services ready for Plan 04-02 (UI download routes and export page)
- All functions accept typed data and return string/Buffer, ready to wire into Next.js route handlers
- ExcelJS installed and working for .xlsx generation

## Self-Check: PASSED

- All 7 created files exist on disk
- Commit 8a9683d found in git log
- Commit 4dc5e5d found in git log

---
*Phase: 04-export-interoperability*
*Completed: 2026-03-24*
