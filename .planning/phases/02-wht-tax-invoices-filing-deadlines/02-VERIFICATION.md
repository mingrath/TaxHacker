---
phase: 02-wht-tax-invoices-filing-deadlines
verified: 2026-03-23T15:44:33Z
status: passed
score: 5/5 must-haves verified
re_verification: null
gaps: []
human_verification:
  - test: "Scan a service receipt and verify AI suggests correct WHT rate in review form"
    expected: "AI populates wht_rate field in analyze-form before user saves"
    why_human: "Requires live LLM call with an actual receipt image — cannot verify programmatically"
  - test: "Generate 50 Tawi PDF for a WHT transaction"
    expected: "3-page PDF with all Section 50 Bis fields, Thai text readable, correct payer/payee info"
    why_human: "PDF visual layout and Thai font rendering cannot be verified via grep"
  - test: "Create a tax invoice and verify income transaction auto-created"
    expected: "New income transaction appears in transaction list with output VAT and correct document number"
    why_human: "End-to-end form submission flow requires live database"
  - test: "Dashboard filing deadline cards color coding and toggle"
    expected: "Cards show green/amber/red based on days remaining, toggle 'mark as filed' persists on refresh"
    why_human: "Visual color coding and stateful toggle require browser interaction"
---

# Phase 2: WHT + Tax Invoices + Filing Deadlines Verification Report

**Phase Goal:** A Thai SME owner can manage withholding tax on payments, create and issue tax invoices, and never miss a filing deadline
**Verified:** 2026-03-23T15:44:33Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can select WHT rate per payment type and system auto-calculates WHT on pre-VAT amount, generating a 50 Tawi certificate PDF | VERIFIED | `services/tax-calculator.ts` exports `calculateWHT`, `computeWHTFromTotal`, `WHT_RATES`, `WHT_RATE_OPTIONS`, `WHT_THRESHOLD`; `app/(app)/apps/wht-report/components/fifty-tawi-pdf.tsx` (413 lines) renders 3-copy PDF with `registerThaiFonts()` |
| 2 | User can generate PND3 and PND53 monthly WHT filing reports | VERIFIED | `pnd3-pdf.tsx` (306 lines) and `pnd53-pdf.tsx` (306 lines) both contain correct form structure; `actions.ts` queries `prisma.transaction.findMany` filtered by `whtType`; report-preview uses JSZip for batch download |
| 3 | User can create Thai tax invoices with all 8 required Section 86/4 fields, with sequential document numbering, and manage contacts with Tax ID and branch storage | VERIFIED | `forms/tax-invoice.ts` enforces `contactId`, `items`, `issuedAt`; `tax-invoice-pdf.tsx` renders all 8 fields including header, seller/buyer Tax IDs, branch designation, VAT separated; `seq_tax_invoice` atomic counter with `parseInt` pattern; `Contact` model has `taxId`, `branch` fields |
| 4 | User can view a Thai tax calendar showing all filing deadlines (adjusted for public holidays) with visual dashboard alerts and per-form filing status tracking | VERIFIED | `services/filing-deadlines.ts` exports `getDeadlinesForMonth`, `getNextBusinessDay`; `services/thai-holidays.ts` has exactly 22 entries for 2026; `filing-deadline-card.tsx` (196 lines) has green/amber/red color coding; dashboard page imports `FilingDeadlineCard`, `WHTSummaryCard`, `getWHTSummary`, `getUpcomingDeadlines` |
| 5 | AI auto-suggests WHT rate based on payment/service type when scanning receipts | VERIFIED | `models/defaults.ts` has WHT prompt with all 5 rate tiers and Thai service type descriptions; `wht_rate`, `wht_service_type`, `wht_type` all have `llm_prompt` values; `ai/schema.ts` `fieldsToJsonSchema` filters on `llm_prompt` so all 3 fields are included in LLM output schema; `components/unsorted/analyze-form.tsx` (16 WHT-related grep matches) displays and persists WHT fields |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `services/tax-calculator.ts` | WHT calculation functions | VERIFIED | `calculateWHT`, `computeWHTFromTotal`, `WHT_RATES`, `WHT_RATE_OPTIONS`, `WHT_THRESHOLD` all present (9 matches) |
| `services/filing-deadlines.ts` | Filing deadline computation with holiday awareness | VERIFIED | `getDeadlinesForMonth`, `getNextBusinessDay`, `FilingDeadline` exported (11 matches) |
| `services/thai-holidays.ts` | 2026 Thai public holiday list | VERIFIED | `THAI_HOLIDAYS_2026` with exactly 22 `new Date` entries; `getHolidaysForYear` exported |
| `models/contacts.ts` | Contact CRUD and search | VERIFIED | `createContact`, `searchContacts`, `getContactById`, `getContactsByUserId` with `prisma.contact.` queries (8 matches) |
| `models/filing-status.ts` | FilingStatus CRUD | VERIFIED | `getFilingStatuses`, `upsertFilingStatus`, `prisma.filingStatus` (6 matches) |
| `forms/contacts.ts` | Contact Zod validation schema | VERIFIED | `contactFormSchema` with 13-digit Tax ID validation (2 matches) |
| `prisma/schema.prisma` | Contact model, FilingStatus model, WHT columns | VERIFIED | `model Contact`, `model FilingStatus`, `wht_rate`, `wht_amount`, `wht_type`, `contact_id` all present (6 matches) |
| `models/defaults.ts` | Updated DEFAULT_PROMPT + DEFAULT_FIELDS with WHT | VERIFIED | `wht_rate`, `wht_service_type`, `wht_type` in both prompt and fields array; Thai service type descriptions present (13 matches) |
| `components/unsorted/analyze-form.tsx` | WHT rate display in review-before-save | VERIFIED | `WHT_RATE_OPTIONS`, `whtRate`, `ภาษีหัก ณ ที่จ่าย` all present (16 matches) |
| `forms/transactions.ts` | WHT fields in Zod schema | VERIFIED | `whtRate`, `whtAmount`, `whtType`, `contactId` all present (4 matches) |
| `models/transactions.ts` | FIRST_CLASS_COLUMNS includes WHT fields | VERIFIED | `whtRate`, `whtAmount`, `whtType`, `contactId` in FIRST_CLASS_COLUMNS (8 matches) |
| `app/(app)/apps/wht-report/manifest.ts` | WHT report app registration | VERIFIED | `code: "wht-report"`, `name: "ภาษีหัก ณ ที่จ่าย"` |
| `app/(app)/apps/wht-report/page.tsx` | WHT report page with month selector | VERIFIED | `force-dynamic` present |
| `app/(app)/apps/wht-report/actions.ts` | Server actions for WHT report | VERIFIED | `generateWHTReportAction`, `generate50TawiAction`, `prisma.transaction.findMany`, `seq_50_tawi`, `parseInt` (11 matches) |
| `app/(app)/apps/wht-report/components/fifty-tawi-pdf.tsx` | 50 Tawi PDF with 3 copies | VERIFIED | 413 lines; `registerThaiFonts`; `สำหรับผู้ถูกหักภาษี` (2 copies) + `สำหรับผู้หักภาษี` (1 copy) = 3-copy structure confirmed (5 matches) |
| `app/(app)/apps/wht-report/components/pnd3-pdf.tsx` | PND3 monthly WHT report PDF | VERIFIED | 306 lines; `ภ.ง.ด.3` and `registerThaiFonts` (4 matches) |
| `app/(app)/apps/wht-report/components/pnd53-pdf.tsx` | PND53 monthly WHT report PDF | VERIFIED | 306 lines; `ภ.ง.ด.53` and `registerThaiFonts` (4 matches) |
| `app/(app)/apps/wht-report/components/report-preview.tsx` | Preview with batch download | VERIFIED | `JSZip`, `pdf(` both present (5 matches) |
| `app/(app)/apps/wht-report/components/wht-report-client.tsx` | Month selector client component | VERIFIED | `use client` + `สร้างรายงาน` both present (4 matches) |
| `forms/tax-invoice.ts` | Zod schema enforcing Section 86/4 | VERIFIED | `taxInvoiceFormSchema`, `contactId`, `items`, `issuedAt` required (6 matches) |
| `app/(app)/apps/tax-invoice/actions.ts` | Create tax invoice + auto-create transaction | VERIFIED | `createTaxInvoiceAction`, `seq_tax_invoice`, `parseInt`, `prisma.transaction.create`, `type: "income"`, `vatType.*output` (7 matches) |
| `app/(app)/apps/tax-invoice/components/tax-invoice-form.tsx` | Form with Section 86/4 | VERIFIED | 329 lines; `ContactAutocomplete` + `useActionState` (4 matches) |
| `app/(app)/apps/tax-invoice/components/tax-invoice-pdf.tsx` | Tax invoice PDF | VERIFIED | `registerThaiFonts`, `ใบกำกับภาษี` header, all Section 86/4 fields: seller/buyer Tax IDs, branch, `documentNumber`, `vatAmount`, `issuedAt` |
| `components/contacts/contact-autocomplete.tsx` | Contact search-as-you-type | VERIFIED | 141 lines; `searchContacts` called via `contact-actions.ts` server action (2 matches) |
| `components/contacts/contact-inline-create.tsx` | Inline contact creation dialog | VERIFIED | 143 lines; Dialog component with `contactFormSchema` and `createContactAction` |
| `components/dashboard/filing-deadline-card.tsx` | Color-coded filing deadline cards | VERIFIED | 196 lines; `เลยกำหนด`, `ยื่นแล้ว`, `green`, `amber`, `red` all present (14 matches) |
| `components/dashboard/filing-deadline-actions.ts` | Toggle filing status server action | VERIFIED | `toggleFilingStatusAction`, `upsertFilingStatus`, `revalidatePath` (5 matches) |
| `components/dashboard/wht-summary-card.tsx` | WHT monthly summary widget | VERIFIED | 76 lines; WHT summary display component |
| `models/stats.ts` | `getWHTSummary` and `getUpcomingDeadlines` | VERIFIED | Both functions present (2 matches) |
| `app/(app)/dashboard/page.tsx` | Dashboard with filing deadline + WHT widgets | VERIFIED | `FilingDeadlineCard`, `WHTSummaryCard`, `getWHTSummary`, `getUpcomingDeadlines` all imported and rendered (7 matches) |
| `prisma/migrations/20260323212513_add_wht_contacts_filing/` | WHT migration SQL | VERIFIED | Migration directory exists with timestamp `20260323212513` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `services/tax-calculator.ts` | `extractVATFromTotal` (existing) | `computeWHTFromTotal` calls `extractVATFromTotal` before WHT | WIRED | Line 137: `const vat = extractVATFromTotal(totalInclVAT, vatRate)` then `calculateWHT(vat.subtotal, ...)` |
| `services/filing-deadlines.ts` | `services/thai-holidays.ts` | `getDeadlinesForMonth` imports `getHolidaysForYear` | WIRED | `getHolidaysForYear` pattern found 3 matches in filing-deadlines.ts |
| `models/contacts.ts` | `prisma/schema.prisma Contact model` | `prisma.contact.` queries | WIRED | `prisma.contact.` pattern found 8 matches |
| `models/defaults.ts` | `ai/prompt.ts` | `DEFAULT_PROMPT_ANALYSE_NEW_FILE` template used by `buildLLMPrompt` | WIRED | WHT instructions in prompt template before `{fields}` variable |
| `ai/schema.ts` | `models/defaults.ts (DEFAULT_FIELDS)` | `fieldsToJsonSchema` reads fields with `llm_prompt` | WIRED | `fieldsToJsonSchema` filters `field.llm_prompt` — all 3 WHT fields have `llm_prompt` set |
| `app/(app)/apps/wht-report/actions.ts` | `prisma.transaction` | Query transactions filtered by `whtType` | WIRED | `prisma.transaction.findMany` present (3 matches in actions.ts) |
| `app/(app)/apps/wht-report/components/report-preview.tsx` | `fifty-tawi-pdf.tsx`, `pnd3-pdf.tsx`, `pnd53-pdf.tsx` | Client-side `pdf()` generation | WIRED | `pdf(` pattern confirmed in report-preview.tsx |
| `app/(app)/apps/wht-report/components/fifty-tawi-pdf.tsx` | `exports/pdf/fonts.ts` | `registerThaiFonts()` for THSarabunNew | WIRED | `registerThaiFonts` called at top of file |
| `app/(app)/apps/tax-invoice/actions.ts` | `models/contacts.ts` | `getContactById` called during invoice save | WIRED | Line 8: `import { getContactById } from "@/models/contacts"` — used at line 79 |
| `app/(app)/apps/tax-invoice/actions.ts` | `prisma.transaction.create` | Auto-creates income transaction on invoice creation | WIRED | `prisma.transaction.create` found with `type: "income"` and `vatType: "output"` |
| `components/contacts/contact-autocomplete.tsx` | `models/contacts.ts` | `searchContacts` via server action in `contact-actions.ts` | WIRED | `contact-actions.ts` imports `searchContacts` from `@/models/contacts` and wraps in server action |
| `components/dashboard/filing-deadline-card.tsx` | `services/filing-deadlines.ts` | Dashboard page calls `getDeadlinesForMonth` via `getUpcomingDeadlines` | WIRED | `getDeadlinesForMonth` called in `getUpcomingDeadlines` in `models/stats.ts`, which is called from dashboard page |
| `components/dashboard/filing-deadline-card.tsx` | `models/filing-status.ts` | Toggle calls `upsertFilingStatus` via `toggleFilingStatusAction` | WIRED | `filing-deadline-actions.ts` line 4: `import { upsertFilingStatus } from "@/models/filing-status"` |
| `app/(app)/dashboard/page.tsx` | `models/stats.ts` | Parallel fetch of `getWHTSummary` and `getUpcomingDeadlines` | WIRED | 7 matches confirm both imports and usage in dashboard page |

---

### Requirements Coverage

| Requirement | Phase 2 Plan | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| SCAN-04 | 02-02 | AI auto-suggests WHT rate based on payment/service type | SATISFIED | `models/defaults.ts` has WHT prompt with 5 rate tiers; WHT fields in `DEFAULT_FIELDS` with `llm_prompt`; `analyze-form.tsx` renders WHT dropdown pre-filled by AI result |
| WHT-01 | 02-01 | WHT rate selection per payment type (1-5%) | SATISFIED | `WHT_RATE_OPTIONS` with 5 rate tiers (1%, 2%, 3%, 5%, 10%); rate selection in `analyze-form.tsx` and WHT report |
| WHT-02 | 02-01 | Auto-calculate WHT on pre-VAT amount (not total) | SATISFIED | `computeWHTFromTotal` chains `extractVATFromTotal` first — `calculateWHT` only receives pre-VAT `subtotal`; `WHT_THRESHOLD` enforced at 100,000 satang |
| WHT-03 | 02-03 | Generate WHT certificate (50 Tawi) as PDF with all 11 required fields | SATISFIED | `fifty-tawi-pdf.tsx` (413 lines) renders 3-copy PDF with payer/payee Tax IDs, addresses, amounts, payment date, certificate number, PND form reference |
| WHT-04 | 02-03 | Generate PND3 monthly WHT report for payments to individuals | SATISFIED | `pnd3-pdf.tsx` (306 lines) with attachment table; server action queries `whtType === "pnd3"` |
| WHT-05 | 02-03 | Generate PND53 monthly WHT report for payments to companies | SATISFIED | `pnd53-pdf.tsx` (306 lines) with attachment table; server action queries `whtType === "pnd53"` |
| INV-01 | 02-04 | Create Thai tax invoices with all 8 required Section 86/4 fields | SATISFIED | `taxInvoiceFormSchema` enforces required fields; `tax-invoice-pdf.tsx` renders all 8 fields including "ใบกำกับภาษี" header, seller Tax ID, buyer info, document number, items, VAT separated, date, branch designation |
| INV-02 | 02-03, 02-04 | Sequential document numbering per document type | SATISFIED | `seq_50_tawi` and `seq_tax_invoice` atomic counters using `prisma.$transaction` with `parseInt` pattern for String-safe increment |
| INV-04 | 02-01, 02-04 | Contact/vendor management with Tax ID and branch number storage | SATISFIED | `Contact` model has `taxId` (13 digits), `branch` fields; `contactFormSchema` validates 13-digit Tax ID; `contact-autocomplete.tsx` and `contact-inline-create.tsx` provide inline UX |
| FILE-01 | 02-01, 02-05 | Thai tax calendar showing all filing deadlines | SATISFIED | `getDeadlinesForMonth` returns PP30 (15th/23rd), PND3/PND53 (7th/15th) with holiday-adjusted dates; dashboard displays via `getUpcomingDeadlines` |
| FILE-02 | 02-05 | Filing deadline reminders (visual alerts on dashboard) | SATISFIED | `filing-deadline-card.tsx` (196 lines) renders color-coded cards on dashboard; `กำหนดยื่นภาษี` section header in dashboard page |
| FILE-03 | 02-05 | Filing status tracker per form per month (pending/filed/overdue) | SATISFIED | `FilingStatus` model with `formType`, `taxMonth`, `taxYear`, `status`; `toggleFilingStatusAction` allows manual "mark as filed" toggle; overdue detection in `getUpcomingDeadlines` |
| FILE-04 | 02-01 | Thai public holiday awareness for deadline adjustment | SATISFIED | `THAI_HOLIDAYS_2026` has exactly 22 entries; `getNextBusinessDay` skips consecutive holidays; Songkran (Apr 13-15) shifts to Apr 16 as expected |

**All 13 Phase 2 requirements satisfied.**

---

### Anti-Patterns Found

No blockers or significant anti-patterns detected in Phase 2 files.

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| `app/(app)/apps/tax-invoice/actions.ts` | `return null` (line ~7) | Info | This is a React type pattern for `useActionState` initial state, not a stub |
| `models/stats.ts` | No potential stubs found | — | Both `getWHTSummary` and `getUpcomingDeadlines` have actual logic |

---

### Human Verification Required

### 1. AI WHT Rate Suggestion

**Test:** Upload a Thai service receipt (e.g., consulting invoice) to `/unsorted` and proceed through analysis
**Expected:** The review-before-save form shows the WHT rate dropdown pre-filled with a suggested rate (e.g., 3% for a service invoice), pnd3/pnd53 type pre-selected based on payee type
**Why human:** Requires a live LLM call with an actual receipt image to verify the AI prompt produces correct structured output

### 2. 50 Tawi Certificate Visual Quality

**Test:** Create a transaction with WHT data, navigate to `/apps/wht-report`, generate report, download a 50 Tawi PDF
**Expected:** PDF renders 3 pages with clear Thai text (THSarabunNew font), all Section 50 Bis fields legible, correct payer (from business profile) and payee (from contact) information, Buddhist Era dates
**Why human:** PDF visual layout and font rendering quality cannot be verified programmatically

### 3. Tax Invoice Auto-Transaction Creation

**Test:** Navigate to `/apps/tax-invoice`, select or create a buyer contact, add line items, submit the form
**Expected:** (a) Invoice PDF downloads with all 8 Section 86/4 fields; (b) A new income transaction appears in `/transactions` list with `type=income`, `vatType=output`, the auto-generated document number (e.g., `INV-2569-0001`)
**Why human:** Requires live database writes and UI flow verification

### 4. Dashboard Filing Deadline Color Coding and Toggle

**Test:** Visit `/dashboard` and observe filing deadline cards; click "ยื่นแล้ว" on one card, then reload the page
**Expected:** Cards show correct colors (green/amber/red based on days until deadline); clicking "ยื่นแล้ว" toggles the card to filed state (gray); the filed state persists after page reload
**Why human:** Visual color rendering and stateful toggle require browser interaction and database roundtrip verification

---

### Gaps Summary

No gaps found. All 5 success criteria are fully implemented and wired:

1. WHT calculator correctly operates on pre-VAT base with threshold enforcement — verified at the math function level
2. PND3/PND53 report generation — full PDF components with correct Thai form structure
3. Tax invoices with Section 86/4 enforcement — Zod schema + PDF component + sequential numbering all confirmed
4. Filing deadline calendar with holiday awareness — service functions + dashboard integration complete
5. AI WHT rate suggestion — prompt, field definitions, schema generation, and UI display all wired end-to-end

4 items flagged for human verification. These are quality and runtime validation checks (visual PDF rendering, AI model output accuracy, live database writes) that cannot be verified through static code analysis.

---

_Verified: 2026-03-23T15:44:33Z_
_Verifier: Claude (gsd-verifier)_
