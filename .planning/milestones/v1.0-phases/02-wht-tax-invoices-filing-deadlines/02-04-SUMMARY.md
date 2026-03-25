---
phase: 02-wht-tax-invoices-filing-deadlines
plan: 04
subsystem: ui, api
tags: [tax-invoice, section-86-4, react-pdf, thai-fonts, contact-management, zod, server-actions]

# Dependency graph
requires:
  - phase: 02-01
    provides: Contact model/CRUD, contactFormSchema, tax-calculator, THSarabunNew fonts, thai-pdf-styles
provides:
  - Tax invoice creation page at /apps/tax-invoice
  - ContactAutocomplete reusable component (search by name/Tax ID)
  - ContactInlineCreate reusable dialog component
  - Tax invoice Zod schema enforcing Section 86/4
  - Sequential document numbering (INV-YYYY-NNNN, String-safe atomic increment)
  - Tax invoice PDF with all 8 Section 86/4 required fields in THSarabunNew
  - Auto-creation of income Transaction with output VAT on invoice creation
affects: [02-05, wht-certificate, filing-deadlines, vat-report]

# Tech tracking
tech-stack:
  added: []
  patterns: [dynamic-line-items-form, contact-autocomplete-popover, client-side-pdf-generation, sequential-numbering-via-settings]

key-files:
  created:
    - components/contacts/contact-autocomplete.tsx
    - components/contacts/contact-inline-create.tsx
    - components/contacts/contact-actions.ts
    - forms/tax-invoice.ts
    - app/(app)/apps/tax-invoice/actions.ts
    - app/(app)/apps/tax-invoice/manifest.ts
    - app/(app)/apps/tax-invoice/page.tsx
    - app/(app)/apps/tax-invoice/components/tax-invoice-form.tsx
    - app/(app)/apps/tax-invoice/components/tax-invoice-pdf.tsx
    - app/(app)/apps/tax-invoice/components/invoice-preview.tsx
  modified: []

key-decisions:
  - "Sequential numbering uses Setting model with read-parse-increment-save in prisma.$transaction (String-safe)"
  - "Invoice data stored in AppData model with unique key per document number for PDF regeneration"
  - "Unit prices entered in baht by user, converted to satang in server action (x100)"
  - "PDF generation is client-side via pdf() from @react-pdf/renderer (same pattern as VAT report)"
  - "Contact inline-create defaults to 'customer' type when creating from invoice form"

patterns-established:
  - "ContactAutocomplete: Popover + debounced search pattern for reusable contact picker"
  - "Dynamic line items: Array of items with add/remove, computed totals in real-time"
  - "Sequential numbering: Setting model with seq_ prefix code, parseInt pattern in $transaction"

requirements-completed: [INV-01, INV-02, INV-04]

# Metrics
duration: 6min
completed: 2026-03-23
---

# Phase 02 Plan 04: Tax Invoice Creation Summary

**Tax invoice form with Section 86/4 enforcement, contact autocomplete/inline-create, sequential numbering (INV-YYYY-NNNN), auto-income-transaction, and PDF generation with THSarabunNew**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-23T14:32:57Z
- **Completed:** 2026-03-23T14:38:58Z
- **Tasks:** 2
- **Files created:** 10

## Accomplishments
- Tax invoice creation form at /apps/tax-invoice with all Section 86/4 mandatory fields
- Reusable ContactAutocomplete (debounced search, popover dropdown) and ContactInlineCreate (dialog) components
- Sequential document numbering (INV-YYYY-NNNN) with String-safe atomic increment via prisma.$transaction
- Auto-creates income Transaction with output VAT when invoice is created (per D-06)
- Tax invoice PDF contains all 8 Section 86/4 fields (header, seller, buyer, doc number, items, VAT, date, branch)
- Invoice preview dialog with client-side PDF download

## Task Commits

Each task was committed atomically:

1. **Task 1: Contact components + tax invoice Zod schema + server action** - `857e3a4` (feat)
2. **Task 2: Tax invoice form page + PDF component + preview** - `4cd13d5` (feat)

## Files Created
- `components/contacts/contact-autocomplete.tsx` - Reusable contact search-as-you-type picker with Popover/Input pattern
- `components/contacts/contact-inline-create.tsx` - Dialog for creating new contacts without navigating away
- `components/contacts/contact-actions.ts` - Server actions for searchContactsAction and createContactAction
- `forms/tax-invoice.ts` - Zod schema enforcing Section 86/4 required fields (contactId, items, issuedAt)
- `app/(app)/apps/tax-invoice/actions.ts` - createTaxInvoiceAction with sequential numbering and auto-transaction creation
- `app/(app)/apps/tax-invoice/manifest.ts` - App manifest with Receipt icon
- `app/(app)/apps/tax-invoice/page.tsx` - Server component checking business profile completeness
- `app/(app)/apps/tax-invoice/components/tax-invoice-form.tsx` - Full form with dynamic line items, contact picker, computed totals
- `app/(app)/apps/tax-invoice/components/tax-invoice-pdf.tsx` - PDF with all 8 Section 86/4 fields in THSarabunNew
- `app/(app)/apps/tax-invoice/components/invoice-preview.tsx` - Preview dialog with PDF download button

## Decisions Made
- Sequential numbering uses Setting model (code: seq_tax_invoice) with parseInt-based read-parse-increment-save inside prisma.$transaction for atomicity. Setting.value is String, so numeric increment is not possible.
- Invoice data stored in AppData model (key: tax-invoice-{documentNumber}) for future PDF regeneration.
- User enters prices in baht; server action converts to satang (x100) before computation.
- PDF generation follows existing client-side pattern from VAT report (pdf() from @react-pdf/renderer).
- Contact inline-create defaults to "customer" type since it is invoked from the buyer selection context.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data flows are wired. Invoice creation produces real transactions with VAT data, contacts are persisted, PDF renders from actual invoice data.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Tax invoice creation is fully functional, ready for use
- ContactAutocomplete and ContactInlineCreate are reusable for WHT certificate creation (Plan 05)
- Sequential numbering pattern established for any future document types

## Self-Check: PASSED

All 10 created files verified present. Both task commits (857e3a4, 4cd13d5) verified in git log.

---
*Phase: 02-wht-tax-invoices-filing-deadlines*
*Completed: 2026-03-23*
