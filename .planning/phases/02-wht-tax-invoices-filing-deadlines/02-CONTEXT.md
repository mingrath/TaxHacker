# Phase 2: WHT + Tax Invoices + Filing Deadlines - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Withholding tax management on vendor payments with AI-suggested rates, 50 Tawi certificate generation (individual + batch), PND3/PND53 monthly WHT reports, tax invoice creation with Section 86/4 enforcement, contact management for vendors/customers with Tax IDs, and filing deadline dashboard alerts with status tracking. Builds on Phase 1's Thai UI, tax calculator, PDF infrastructure, and dashboard.

</domain>

<decisions>
## Implementation Decisions

### WHT Payment Flow
- **D-01:** AI auto-suggests WHT rate when scanning receipts based on service type (SCAN-04). User confirms/changes during review-before-save flow (carries forward Phase 1 D-07).
- **D-02:** WHT is recorded as part of the transaction flow — when saving an expense, user sees WHT rate field pre-filled by AI. System auto-calculates WHT on pre-VAT amount (critical: WHT base = amount BEFORE VAT).
- **D-03:** 50 Tawi certificate generation: both individual (one-click from transaction) AND batch monthly (generate all certificates for a month as ZIP). Both produce THSarabunNew PDFs with all required fields per Section 50 Bis.
- **D-04:** PND3/PND53 reports follow same one-click pattern as PP30 from Phase 1. Preview → download PDF. Follows existing report generation UX.

### Tax Invoice Creation
- **D-05:** Form-based creation with Section 86/4 field enforcement. All 8+ required fields are mandatory. Sequential numbering auto-managed per document type. Preview → generate THSarabunNew PDF.
- **D-06:** Tax invoices link to transactions — creating an invoice auto-creates the corresponding income transaction with VAT data. Bidirectional reference.

### Filing Deadline Calendar
- **D-07:** Dashboard alert cards showing upcoming deadlines. Color-coded: green (>7 days), amber (3-7 days), red (<3 days or overdue). No separate calendar page — keep it on the dashboard.
- **D-08:** Filing status: manual toggle. User clicks "mark as filed" after submitting to Revenue Dept. Simple user-controlled status.
- **D-09:** Thai public holiday awareness — deadlines that fall on weekends/holidays auto-adjust to next business day. 2026 holiday list from THAI_TAX_REFERENCE.md.

### Contact Management
- **D-10:** Inline contact creation during transaction/invoice entry. Auto-saved for reuse in future documents. No separate contact management page — keep it simple.
- **D-11:** Contact fields (tax essentials only): Name, Tax ID (13 digits), Branch (สำนักงานใหญ่/สาขาที่), Address. Minimum needed for 50 Tawi and tax invoices.

### Claude's Discretion
- WHT rate dropdown ordering and grouping
- 50 Tawi PDF layout and field positioning
- Filing deadline alert card visual design
- Contact autocomplete/search UX in transaction forms
- PND3 vs PND53 form differentiation logic (individual vs company payee)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Thai Tax Compliance
- `.planning/research/THAI_TAX_REFERENCE.md` — WHT rate table (Section 2), 50 Tawi fields (Section 6), PND3/PND53 structure (Section 7), filing calendar (Section 10), 2026 holidays (Section 11)
- `.planning/research/FEATURES.md` — WHT competitor features, filing deadline management table stakes
- `.planning/research/PITFALLS.md` — WHT-before-VAT calculation pitfall, filing deadline holiday adjustment

### Phase 1 Foundation (carries forward)
- `.planning/phases/01-thai-foundation-vat-compliance/01-CONTEXT.md` — Thai UI decisions, PDF font setup, review-before-save pattern, one-click report generation pattern
- `.planning/phases/01-thai-foundation-vat-compliance/01-RESEARCH.md` — Architecture decisions, service layer patterns, satang arithmetic

### Codebase (from Phase 1 execution)
- `services/tax-calculator.ts` — VAT math, formatCurrency (satang→baht), extractVATFromTotal
- `exports/pdf/fonts.ts` — THSarabunNew registration
- `exports/pdf/thai-pdf-styles.ts` — Shared Thai PDF styles
- `services/thai-date.ts` — Buddhist Era formatting
- `models/business-profile.ts` — Business profile CRUD
- `app/(app)/apps/vat-report/` — Report generation pattern to replicate for PND3/PND53

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `services/tax-calculator.ts` — Extend with WHT calculation functions (calculateWHT, getWHTRate)
- `exports/pdf/fonts.ts` + `thai-pdf-styles.ts` — Reuse for 50 Tawi and PND3/PND53 PDFs
- `app/(app)/apps/vat-report/` — Clone pattern for WHT report app (manifest, page, actions, components)
- `components/dashboard/vat-summary-card.tsx` — Reuse card gradient pattern for filing deadline alerts
- `ai/prompt.ts` — Extend for WHT rate suggestion based on service type
- `ai/validators/tax-invoice-validator.ts` — Reuse validation pattern for outgoing tax invoice creation

### Established Patterns
- **Report generation:** manifest.ts → page.tsx → actions.ts → pdf-component.tsx → report-preview.tsx (from PP30)
- **Server Actions:** `ActionState<T>` return type, Zod validation in actions
- **Dashboard widgets:** Parallel data fetch in dashboard/page.tsx, conditional rendering based on business profile
- **PDF generation:** @react-pdf/renderer with Font.register(THSarabunNew), thaiPdfStyles shared styles

### Integration Points
- **New Prisma models needed:** Contact (name, taxId, branch, address, type), FilingStatus (form, month, year, status, filedAt)
- **Extend Transaction model:** Add whtRate, whtAmount, whtType, contactId fields
- **New app routes:** `app/(app)/apps/wht-report/` for PND3/PND53, tax invoice creation page
- **Dashboard extension:** Add filing deadline alert widget alongside existing VAT widgets
- **Middleware:** No changes needed (setup gate already handles all routes)

</code_context>

<specifics>
## Specific Ideas

- WHT should feel as seamless as VAT from Phase 1 — AI does the heavy lifting, user just confirms
- 50 Tawi is the most frequently generated document — must be fast (one click from transaction)
- Filing deadlines are the "insurance policy" — prevent fines, which is part of the core value "zero tax penalties"
- Contact inline creation should feel like tagging — type a name, if it exists autocomplete, if not create new

</specifics>

<deferred>
## Deferred Ideas

- Credit note / debit note workflow — Phase 3 (INV-03)
- Section 65 tri expense flagging — Phase 3 (SCAN-05)
- Revenue Dept XML export for PND3/PND53 — Phase 4 (RPT-04)
- Bank reconciliation — v2

</deferred>

---

*Phase: 02-wht-tax-invoices-filing-deadlines*
*Context gathered: 2026-03-23*
