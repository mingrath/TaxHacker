# Phase 2: WHT + Tax Invoices + Filing Deadlines - Research

**Researched:** 2026-03-23
**Domain:** Withholding tax, tax invoice creation, contact management, filing deadline tracking
**Confidence:** HIGH

## Summary

Phase 2 adds three major capabilities to BanChee: withholding tax (WHT) management, outgoing tax invoice creation, and filing deadline tracking. The existing codebase from Phase 1 provides strong reusable foundations -- the `services/tax-calculator.ts` pure-function pattern extends naturally to WHT math, `exports/pdf/fonts.ts` + `thai-pdf-styles.ts` handle THSarabunNew for all new PDF documents (50 Tawi, PND3, PND53, tax invoices), and the `app/(app)/apps/vat-report/` app structure serves as the exact template for WHT report apps. The VAT report's `actions.ts` -> `report-preview.tsx` -> PDF component pipeline replicates directly for PND3/PND53 generation.

The core technical challenges are: (1) WHT calculation correctness -- WHT base is the pre-VAT amount, NOT the total, requiring careful integration with the existing VAT extraction; (2) 50 Tawi PDF layout which is a structured government form with specific field positions, copy numbering, and income category checkboxes; (3) Contact model design that supports inline creation during transaction/invoice entry with autocomplete search; and (4) Filing deadline date arithmetic that correctly handles Thai public holidays and weekend adjustments. None of these require new npm dependencies -- the existing stack (Prisma, @react-pdf/renderer, date-fns, Zod, shadcn/ui) covers everything.

The AI integration point is SCAN-04 (WHT rate suggestion). The existing `ai/prompt.ts` template variable system and `ai/validators/tax-invoice-validator.ts` pattern extend naturally -- add WHT service type detection to the prompt, and return a suggested WHT rate alongside the extracted fields. The user confirms/changes the suggested rate during the review-before-save flow established in Phase 1.

**Primary recommendation:** Extend `services/tax-calculator.ts` with WHT functions, create a `Contact` Prisma model for vendor/customer data, add WHT columns to Transaction, build 50 Tawi + PND3/PND53 as new PDF components reusing the VAT report app pattern, create a tax invoice form with Section 86/4 enforcement, and add filing deadline widgets to the dashboard using the same card component pattern as VAT summary.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** AI auto-suggests WHT rate when scanning receipts based on service type (SCAN-04). User confirms/changes during review-before-save flow (carries forward Phase 1 D-07).
- **D-02:** WHT is recorded as part of the transaction flow -- when saving an expense, user sees WHT rate field pre-filled by AI. System auto-calculates WHT on pre-VAT amount (critical: WHT base = amount BEFORE VAT).
- **D-03:** 50 Tawi certificate generation: both individual (one-click from transaction) AND batch monthly (generate all certificates for a month as ZIP). Both produce THSarabunNew PDFs with all required fields per Section 50 Bis.
- **D-04:** PND3/PND53 reports follow same one-click pattern as PP30 from Phase 1. Preview -> download PDF. Follows existing report generation UX.
- **D-05:** Form-based creation with Section 86/4 field enforcement. All 8+ required fields are mandatory. Sequential numbering auto-managed per document type. Preview -> generate THSarabunNew PDF.
- **D-06:** Tax invoices link to transactions -- creating an invoice auto-creates the corresponding income transaction with VAT data. Bidirectional reference.
- **D-07:** Dashboard alert cards showing upcoming deadlines. Color-coded: green (>7 days), amber (3-7 days), red (<3 days or overdue). No separate calendar page -- keep it on the dashboard.
- **D-08:** Filing status: manual toggle. User clicks "mark as filed" after submitting to Revenue Dept. Simple user-controlled status.
- **D-09:** Thai public holiday awareness -- deadlines that fall on weekends/holidays auto-adjust to next business day. 2026 holiday list from THAI_TAX_REFERENCE.md.
- **D-10:** Inline contact creation during transaction/invoice entry. Auto-saved for reuse in future documents. No separate contact management page -- keep it simple.
- **D-11:** Contact fields (tax essentials only): Name, Tax ID (13 digits), Branch, Address. Minimum needed for 50 Tawi and tax invoices.

### Claude's Discretion
- WHT rate dropdown ordering and grouping
- 50 Tawi PDF layout and field positioning
- Filing deadline alert card visual design
- Contact autocomplete/search UX in transaction forms
- PND3 vs PND53 form differentiation logic (individual vs company payee)

### Deferred Ideas (OUT OF SCOPE)
- Credit note / debit note workflow -- Phase 3 (INV-03)
- Section 65 tri expense flagging -- Phase 3 (SCAN-05)
- Revenue Dept XML export for PND3/PND53 -- Phase 4 (RPT-04)
- Bank reconciliation -- v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCAN-04 | AI auto-suggests WHT rate based on payment/service type | Extend `ai/prompt.ts` with WHT service type detection. AI returns `wht_rate` and `wht_type` fields. WHT rate table in THAI_TAX_REFERENCE.md Section 2. |
| WHT-01 | WHT rate selection per payment type (1%-5%) | WHT rate constants in `services/tax-calculator.ts`. Dropdown with grouped rates per THAI_TAX_REFERENCE.md Section 2 (transport 1%, advertising 2%, services 3%, rent 5%). |
| WHT-02 | Auto-calculate WHT on pre-VAT amount | `calculateWHT(subtotal, whtRateBasisPoints)` pure function in tax-calculator.ts. Uses `extractVATFromTotal()` result as WHT base -- never the VAT-inclusive total. |
| WHT-03 | Generate 50 Tawi WHT certificate PDF | `@react-pdf/renderer` component with THSarabunNew. 11+ fields per Section 50 Bis (THAI_TAX_REFERENCE.md Section 6). Three-copy layout. Income category checkboxes. |
| WHT-04 | Generate PND3 monthly WHT report for individuals | Clone VAT report app pattern (`app/(app)/apps/wht-report/`). Query transactions with `whtType = "pnd3"`. Attachment columns per THAI_TAX_REFERENCE.md Section 7. |
| WHT-05 | Generate PND53 monthly WHT report for companies | Same app, different filter (`whtType = "pnd53"`). Both reports share summary structure but different attachment data. |
| INV-01 | Create tax invoices with Section 86/4 fields | Form-based creation page. 8+ mandatory fields enforced via Zod schema. Auto-sequential numbering. Reuse `ai/validators/tax-invoice-validator.ts` field definitions for output validation. |
| INV-02 | Sequential document numbering per type | `DocumentSequence` tracking via Setting model or AppData. Per document type (tax_invoice, 50_tawi). Auto-increment on creation. |
| INV-04 | Contact/vendor management with Tax ID | New `Contact` Prisma model. Inline creation modal in transaction/invoice forms. Autocomplete search by name or Tax ID. |
| FILE-01 | Thai tax calendar showing filing deadlines | `services/filing-deadlines.ts` pure functions. Compute deadlines for PP30, PND3, PND53 per month. Holiday-aware date shifting. |
| FILE-02 | Filing deadline reminders on dashboard | Dashboard widget cards with green/amber/red color coding. Parallel data fetch alongside existing VAT widgets. |
| FILE-03 | Filing status tracker per form per month | `FilingStatus` Prisma model (formType, month, year, status, filedAt). Manual "mark as filed" toggle per card. |
| FILE-04 | Thai public holiday awareness for deadline adjustment | 2026 holiday data in `services/thai-holidays.ts`. `getNextBusinessDay()` function. Holidays from THAI_TAX_REFERENCE.md Section 11. |
</phase_requirements>

## Standard Stack

### Core (already in project -- no changes)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| Next.js | ^15.2.4 | Full-stack framework | App Router, Server Actions -- same patterns as Phase 1 |
| Prisma | ^6.6.0 | ORM + migrations | Add Contact model, FilingStatus model, WHT columns on Transaction |
| @react-pdf/renderer | ^4.3.0 | PDF generation | 50 Tawi, PND3, PND53, tax invoice PDFs. Reuse THSarabunNew registration. |
| Zod | ^3.24.2 | Schema validation | Contact form, tax invoice form, WHT fields validation |
| date-fns | ^3.6.0 | Date arithmetic | Filing deadline computation, holiday shifting, month boundaries |
| shadcn/ui | N/A | UI components | Dialog for contact creation, Select for WHT rates, Cards for deadlines |
| JSZip | ^3.10.1 | ZIP creation | Batch 50 Tawi download (all certificates for a month as ZIP) |

### New Dependencies

**None required.** Phase 2 needs zero new npm packages. All requirements are met by the existing stack.

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| Dedicated calendar library for deadlines | date-fns + custom holiday logic | D-07 explicitly says "no separate calendar page" -- just dashboard cards. date-fns date arithmetic is sufficient. |
| Separate Contact management page | Inline creation modal | D-10 locks this decision: no separate page. Contact creation is part of transaction/invoice entry flow. |
| react-select for contact autocomplete | shadcn/ui Combobox pattern | Already using shadcn/ui throughout. The Popover + Command pattern from shadcn docs provides autocomplete without new dependencies. |

**Installation:**
```bash
# No new npm packages needed for Phase 2
# All infrastructure (fonts, PDF, Thai date utils) already exists from Phase 1
```

## Architecture Patterns

### Recommended Project Structure (new/modified files only)

```
prisma/
  schema.prisma                          # MODIFY: Add Contact, FilingStatus models + WHT columns on Transaction

services/
  tax-calculator.ts                      # MODIFY: Add WHT calculation functions
  filing-deadlines.ts                    # NEW: Deadline computation, holiday-aware date shifting
  thai-holidays.ts                       # NEW: 2026 holiday list, getNextBusinessDay()

models/
  contacts.ts                            # NEW: Contact CRUD, search/autocomplete
  filing-status.ts                       # NEW: FilingStatus CRUD, per-form-per-month tracking
  stats.ts                               # MODIFY: Add getWHTSummary(), getFilingDeadlines()

forms/
  contacts.ts                            # NEW: Zod schema for contact creation
  tax-invoice.ts                         # NEW: Zod schema for tax invoice creation with Section 86/4 enforcement
  wht-report.ts                          # NEW: Zod schema for WHT report period selection

app/(app)/
  dashboard/
    page.tsx                             # MODIFY: Add filing deadline widget, WHT summary
  apps/
    wht-report/                          # NEW: PND3 + PND53 WHT reports
      manifest.ts
      page.tsx
      actions.ts
      components/
        wht-report-client.tsx
        report-preview.tsx
        pnd3-pdf.tsx
        pnd53-pdf.tsx
        fifty-tawi-pdf.tsx               # 50 Tawi certificate PDF
    tax-invoice/                         # NEW: Tax invoice creation and management
      manifest.ts
      page.tsx
      actions.ts
      components/
        tax-invoice-form.tsx
        tax-invoice-pdf.tsx
        invoice-preview.tsx
  transactions/
    actions.ts                           # MODIFY: Handle WHT fields on create/save

ai/
  prompt.ts                              # NO CHANGE (template variables already flexible)

components/
  dashboard/
    filing-deadline-card.tsx              # NEW: Color-coded deadline alert cards
    wht-summary-card.tsx                 # NEW: WHT withheld this month summary
  contacts/
    contact-inline-create.tsx            # NEW: Inline creation modal/popover
    contact-autocomplete.tsx             # NEW: Search-as-you-type contact picker

exports/
  pdf/
    fonts.ts                             # NO CHANGE (THSarabunNew already registered)
    thai-pdf-styles.ts                   # MODIFY: Add 50 Tawi-specific styles
```

### Pattern 1: WHT Calculation (extends tax-calculator.ts)

**What:** Pure functions for WHT math. WHT is always calculated on the pre-VAT base, never the total.
**When to use:** Every expense transaction where WHT applies.
**Why:** Tax compliance correctness. The most common error is calculating WHT on the VAT-inclusive amount.

```typescript
// services/tax-calculator.ts -- additions

// WHT rate constants (basis points, same convention as VAT_RATE)
export const WHT_RATES = {
  TRANSPORT: 100,      // 1%
  INSURANCE: 100,      // 1%
  ADVERTISING: 200,    // 2%
  SERVICE: 300,        // 3% (most common)
  ROYALTY: 300,        // 3%
  RENT: 500,           // 5%
  DIVIDEND: 1000,      // 10%
} as const

export const WHT_RATE_OPTIONS = [
  { rate: 100,  label: "1% - ค่าขนส่ง / เบี้ยประกันวินาศภัย", types: ["transport", "insurance"] },
  { rate: 200,  label: "2% - ค่าโฆษณา", types: ["advertising"] },
  { rate: 300,  label: "3% - ค่าบริการ / ค่าจ้างทำของ / ค่าลิขสิทธิ์", types: ["service", "royalty"] },
  { rate: 500,  label: "5% - ค่าเช่า / รางวัล", types: ["rent", "prize"] },
  { rate: 1000, label: "10% - เงินปันผล", types: ["dividend"] },
] as const

export type WHTResult = {
  subtotal: number     // pre-VAT base (satang) -- this is the WHT base
  whtAmount: number    // WHT withheld (satang)
  whtRate: number      // rate in basis points
  netPayable: number   // total - whtAmount = what you actually pay the vendor
}

/**
 * Calculate WHT on a pre-VAT subtotal.
 * CRITICAL: whtBase MUST be the pre-VAT amount. Never pass the VAT-inclusive total.
 *
 * Example: calculateWHT(100000, 300) => { subtotal: 100000, whtAmount: 3000, ... }
 */
export function calculateWHT(
  subtotal: number,     // pre-VAT amount in satang
  whtRate: number,      // basis points (300 = 3%)
  vatInclusiveTotal: number // full total for computing net payable
): WHTResult {
  if (subtotal === 0 || whtRate === 0) {
    return { subtotal, whtAmount: 0, whtRate, netPayable: vatInclusiveTotal }
  }

  const whtAmount = Math.round(subtotal * whtRate / 10000)
  return {
    subtotal,
    whtAmount,
    whtRate,
    netPayable: vatInclusiveTotal - whtAmount,
  }
}

/**
 * Full WHT + VAT computation from a VAT-inclusive total.
 * This is the standard flow: extract VAT first, then calculate WHT on the base.
 */
export function computeWHTFromTotal(
  totalInclVAT: number,
  whtRate: number,
  vatRate: number = VAT_RATE
): WHTResult & VATResult {
  const vat = extractVATFromTotal(totalInclVAT, vatRate)
  const wht = calculateWHT(vat.subtotal, whtRate, totalInclVAT)
  return { ...vat, ...wht }
}
```

### Pattern 2: Contact Model with Inline Creation

**What:** A Prisma `Contact` model for vendor/customer data. Used for 50 Tawi, PND3/PND53, and tax invoices.
**When to use:** Any document that requires payee/buyer tax details (Tax ID, branch, address).

```typescript
// models/contacts.ts

export type ContactData = {
  name: string
  taxId: string       // 13-digit Thai Tax ID
  branch: string      // "00000" for HQ, or branch number
  address: string
  type: "vendor" | "customer" | "both"
}

export async function searchContacts(
  userId: string,
  query: string
): Promise<Contact[]> {
  return prisma.contact.findMany({
    where: {
      userId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { taxId: { contains: query } },
      ],
    },
    orderBy: { name: "asc" },
    take: 10,
  })
}
```

### Pattern 3: Filing Deadline Computation

**What:** Pure functions for computing Thai tax filing deadlines with holiday awareness.
**When to use:** Dashboard filing deadline widgets, filing status tracking.

```typescript
// services/filing-deadlines.ts
import { isWeekend, addDays } from "date-fns"
import { THAI_HOLIDAYS_2026 } from "./thai-holidays"

type FilingDeadline = {
  formType: "PP30" | "PND3" | "PND53"
  formLabel: string
  taxMonth: number     // 1-12
  taxYear: number
  paperDeadline: Date
  eFilingDeadline: Date  // the one we show (assumes e-filing)
  adjustedDeadline: Date // after holiday/weekend shift
}

/**
 * Get the next business day, skipping weekends and Thai public holidays.
 */
function getNextBusinessDay(date: Date, holidays: Date[]): Date {
  let current = date
  while (isWeekend(current) || holidays.some(h => isSameDay(h, current))) {
    current = addDays(current, 1)
  }
  return current
}

/**
 * Compute all filing deadlines for a given tax month.
 * PP30: 23rd of next month (e-filing)
 * PND3: 15th of next month (e-filing)
 * PND53: 15th of next month (e-filing)
 */
export function getDeadlinesForMonth(taxMonth: number, taxYear: number): FilingDeadline[] {
  const nextMonth = taxMonth === 12 ? 1 : taxMonth + 1
  const nextYear = taxMonth === 12 ? taxYear + 1 : taxYear
  const holidays = getHolidaysForYear(nextYear)

  return [
    {
      formType: "PND3",
      formLabel: "ภ.ง.ด.3",
      taxMonth, taxYear,
      paperDeadline: new Date(nextYear, nextMonth - 1, 7),
      eFilingDeadline: new Date(nextYear, nextMonth - 1, 15),
      adjustedDeadline: getNextBusinessDay(new Date(nextYear, nextMonth - 1, 15), holidays),
    },
    {
      formType: "PND53",
      formLabel: "ภ.ง.ด.53",
      taxMonth, taxYear,
      paperDeadline: new Date(nextYear, nextMonth - 1, 7),
      eFilingDeadline: new Date(nextYear, nextMonth - 1, 15),
      adjustedDeadline: getNextBusinessDay(new Date(nextYear, nextMonth - 1, 15), holidays),
    },
    {
      formType: "PP30",
      formLabel: "ภ.พ.30",
      taxMonth, taxYear,
      paperDeadline: new Date(nextYear, nextMonth - 1, 15),
      eFilingDeadline: new Date(nextYear, nextMonth - 1, 23),
      adjustedDeadline: getNextBusinessDay(new Date(nextYear, nextMonth - 1, 23), holidays),
    },
  ]
}
```

### Pattern 4: WHT Report App (clones VAT report pattern)

**What:** Exact clone of `app/(app)/apps/vat-report/` structure for PND3/PND53.
**When to use:** WHT monthly report generation.

The pipeline is identical:
1. `manifest.ts` -- app registration
2. `page.tsx` -- Server Component loads business profile + initial data
3. `actions.ts` -- Server Action queries transactions for period, computes summary
4. `components/wht-report-client.tsx` -- Client Component with month/year selector
5. `components/report-preview.tsx` -- Dialog with summary + download buttons
6. `components/pnd3-pdf.tsx` / `pnd53-pdf.tsx` -- PDF components

The key difference from VAT reports: WHT reports query on `whtType` (pnd3/pnd53) instead of `vatType` (input/output), and the attachment columns match THAI_TAX_REFERENCE.md Section 7.

### Pattern 5: Tax Invoice with Auto-Transaction Creation (D-06)

**What:** Creating a tax invoice also creates the corresponding income transaction.
**When to use:** Every tax invoice creation.

```typescript
// app/(app)/apps/tax-invoice/actions.ts
export async function createTaxInvoiceAction(
  prevState: ActionState<TaxInvoice> | null,
  formData: FormData
): Promise<ActionState<TaxInvoice>> {
  // 1. Validate all Section 86/4 required fields
  // 2. Generate sequential document number
  // 3. Create or link Contact (buyer)
  // 4. Save tax invoice record (AppData or dedicated model)
  // 5. Auto-create income Transaction with VAT data (D-06):
  //    - type: "income"
  //    - vatType: "output"
  //    - vatAmount, subtotal, total from invoice
  //    - contactId linking to buyer
  //    - documentNumber from sequential numbering
  // 6. Return invoice data for PDF preview
}
```

### Anti-Patterns to Avoid

- **WHT on VAT-inclusive total:** NEVER calculate WHT on the total that includes VAT. Always use `extractVATFromTotal()` first, then apply WHT rate to the `subtotal`. This is the most critical correctness requirement.
- **Hardcoding 50 Tawi as a single-page form:** 50 Tawi must produce 3 copies (payee copy 1, payee copy 2, payer copy). A single PDF page is incorrect -- generate 3 pages or use a copy indicator.
- **Separate WHT and VAT flows:** WHT is recorded AS PART of the expense transaction, not as a separate transaction. A single expense has: total, subtotal (pre-VAT), vatAmount, whtRate, whtAmount, netPayable.
- **Filing deadlines without holiday adjustment:** Raw dates like "the 15th" are wrong if that date falls on a weekend or holiday. Always run through `getNextBusinessDay()`.
- **Contact creation as a separate page flow:** D-10 explicitly forbids this. Contact creation must be inline (modal/popover) during transaction or invoice entry.
- **Sequential numbering with gaps:** When a tax invoice is voided/cancelled, the number is NOT reused. The sequence must be strictly monotonic. Use a database counter, not max(existing) + 1 (race condition risk).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 50 Tawi PDF layout | Custom PDF binary | `@react-pdf/renderer` + THSarabunNew (already registered) | Existing pattern from Phase 1 reports. Handles Thai text, tables, page breaks. |
| Holiday-aware date shifting | Manual date arithmetic with edge cases | `date-fns` `addDays()`, `isWeekend()` + holiday lookup array | date-fns handles month boundaries, leap years. Holiday list is a simple data array. |
| Contact autocomplete | Custom search component from scratch | shadcn/ui Combobox pattern (Popover + Command) | Already using shadcn/ui. Combobox provides keyboard navigation, filtering, empty state for free. |
| Sequential numbering | Constructing numbers from timestamp | Prisma `@default(autoincrement())` or atomic counter update | Must be gap-free and race-condition-proof. Database sequence is the only correct approach. |
| ZIP bundling for batch 50 Tawi | Streaming file concatenation | JSZip (already in project, v3.10.1) | Used in Phase 1 for VAT report download-all. Same pattern: generate PDFs -> zip -> download. |
| WHT rate suggestion from AI | Rules engine with keyword matching | LLM prompt extension in `ai/prompt.ts` | The LLM already understands Thai receipts. Adding "also suggest WHT rate based on service type" to the prompt leverages existing capability. |

**Key insight:** Phase 2 adds no new npm dependencies because every capability maps to an existing library or pattern established in Phase 1. The work is architectural (new models, new app pages, new PDF templates) not infrastructure.

## Common Pitfalls

### Pitfall 1: WHT Calculated on VAT-Inclusive Amount (the WHT-before-VAT trap)

**What goes wrong:** WHT of 3% on a 107,000 THB total gives 3,210 THB. Correct answer is 3,000 THB (3% of 100,000 pre-VAT base). Overpaying WHT by 210 THB per transaction.
**Why it happens:** The form displays the total (VAT-inclusive). Developer applies WHT rate directly to the displayed total.
**How to avoid:** `computeWHTFromTotal()` ALWAYS calls `extractVATFromTotal()` first, then applies WHT to the `subtotal`. The UI should display the calculation chain: Total -> Base (pre-VAT) -> WHT amount.
**Warning signs:** WHT amounts that are not exact multiples of the rate applied to round base numbers. A 107,000 total with 3% WHT should give exactly 3,000 (not 3,210).

### Pitfall 2: 50 Tawi Missing the 3-Copy Requirement

**What goes wrong:** Generating a single-page 50 Tawi certificate. Revenue Department requires 3 copies.
**Why it happens:** Developer generates one page and expects the user to print 3 copies.
**How to avoid:** Generate a 3-page PDF where each page is labeled: "สำหรับผู้ถูกหักภาษี (แนบพร้อมแบบแสดงรายการภาษี)" (copy 1), "สำหรับผู้ถูกหักภาษี (เก็บไว้เป็นหลักฐาน)" (copy 2), "สำหรับผู้หักภาษี (เก็บไว้เป็นหลักฐาน)" (copy 3).
**Warning signs:** 50 Tawi PDF that is only 1 page.

### Pitfall 3: PND3 vs PND53 Misclassification

**What goes wrong:** Payments to companies filed on PND3 (for individuals) or payments to individuals filed on PND53 (for companies). Results in Revenue Department rejection.
**Why it happens:** No validation of payee type against form type.
**How to avoid:** The Contact model includes a `type` field. When generating PND3, filter for contacts where type includes "individual" (or Tax ID pattern suggests individual). For PND53, filter for company contacts. Also: 13-digit Tax IDs starting with 0 are typically individuals (national ID); those starting with other digits are often companies (registration number). This heuristic is not 100% reliable -- the user must confirm.
**Warning signs:** A PND3 report containing a payee with "Co., Ltd." or "บริษัท" in the name.

### Pitfall 4: Filing Deadline Off-by-One on Holiday Adjustment

**What goes wrong:** Deadline of January 15 (Thursday) -- it is a holiday, so the system adjusts to January 16 (Friday). But January 16 is ALSO a holiday. The system shows January 16 as the deadline.
**Why it happens:** Checking only one day ahead instead of looping until a business day is found.
**How to avoid:** `getNextBusinessDay()` must use a `while` loop that keeps advancing until the date is NOT a weekend AND NOT a holiday. Test with consecutive holiday scenarios (e.g., Songkran April 13-15).
**Warning signs:** Adjusted deadlines that still fall on weekends or holidays.

### Pitfall 5: WHT Threshold Ignored (payments < 1,000 THB)

**What goes wrong:** WHT deducted on a 500 THB service payment. WHT only applies when the payment is >= 1,000 THB.
**Why it happens:** System applies WHT rate to every expense regardless of amount.
**How to avoid:** In `calculateWHT()`, add threshold check: if subtotal < 100000 satang (1,000 THB), return whtAmount = 0. Display a notice: "ไม่ต้องหัก ณ ที่จ่าย (ต่ำกว่า 1,000 บาท)".
**Warning signs:** WHT certificates generated for small transactions below 1,000 THB.

### Pitfall 6: Sequential Numbering Race Condition

**What goes wrong:** Two tax invoices created simultaneously get the same number.
**Why it happens:** Reading max(documentNumber) + 1 without a lock. Two concurrent requests read the same max.
**How to avoid:** Use a Prisma `$transaction` with `serializable` isolation, or use a dedicated sequence counter table with `UPDATE ... SET counter = counter + 1 RETURNING counter`. The database guarantees atomicity.
**Warning signs:** Duplicate document numbers in the tax invoice list. Revenue Department rejects duplicate-numbered invoices.

## Code Examples

### Prisma Schema Additions

```prisma
// prisma/schema.prisma -- additions for Phase 2

model Contact {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  taxId     String   @map("tax_id")
  branch    String   @default("00000")
  address   String   @default("")
  type      String   @default("vendor") // "vendor" | "customer" | "both"
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([userId, taxId, branch])
  @@index([userId])
  @@index([name])
  @@map("contacts")
}

model FilingStatus {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  formType  String    @map("form_type") // "PP30" | "PND3" | "PND53"
  taxMonth  Int       @map("tax_month") // 1-12
  taxYear   Int       @map("tax_year")
  status    String    @default("pending") // "pending" | "filed" | "overdue"
  filedAt   DateTime? @map("filed_at")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  @@unique([userId, formType, taxMonth, taxYear])
  @@index([userId])
  @@map("filing_statuses")
}

// Add to Transaction model:
// whtRate     Int?      @map("wht_rate")       // basis points (300 = 3%)
// whtAmount   Int?      @map("wht_amount")     // satang
// whtType     String?   @map("wht_type")       // "pnd3" | "pnd53" | null
// contactId   String?   @map("contact_id") @db.Uuid
```

### Transaction Model FIRST_CLASS_COLUMNS Update

```typescript
// models/transactions.ts -- extend FIRST_CLASS_COLUMNS
const FIRST_CLASS_COLUMNS = new Set([
  "vatType",
  "vatAmount",
  "vatRate",
  "subtotal",
  "merchantTaxId",
  "merchantBranch",
  "documentNumber",
  // Phase 2 additions:
  "whtRate",
  "whtAmount",
  "whtType",
  "contactId",
])
```

### Filing Deadline Dashboard Widget Pattern

```typescript
// components/dashboard/filing-deadline-card.tsx
import { differenceInDays } from "date-fns"

type DeadlineStatus = "green" | "amber" | "red"

function getDeadlineStatus(adjustedDeadline: Date): DeadlineStatus {
  const daysUntil = differenceInDays(adjustedDeadline, new Date())
  if (daysUntil < 0) return "red"    // overdue
  if (daysUntil <= 3) return "red"   // urgent
  if (daysUntil <= 7) return "amber" // approaching
  return "green"                      // safe
}

// Color scheme follows D-07:
const STATUS_STYLES = {
  green: "bg-gradient-to-br from-white via-green-50/30 to-emerald-50/40 border-green-200/50",
  amber: "bg-gradient-to-br from-white via-amber-50/30 to-orange-50/40 border-amber-200/50",
  red:   "bg-gradient-to-br from-white via-red-50/30 to-rose-50/40 border-red-200/50",
}
// Reuses the exact gradient pattern from vat-summary-card.tsx
```

### AI Prompt Extension for WHT Rate Suggestion (SCAN-04)

The existing AI prompt system uses template variables in `ai/prompt.ts`. WHT rate suggestion does NOT require modifying `buildLLMPrompt()` -- it requires extending the prompt template stored in user settings (`prompt_analyse_new_file`). Add WHT-related instructions to the default prompt template:

```
// Addition to DEFAULT_PROMPT_ANALYSE_NEW_FILE in models/defaults.ts:
//
// "For expense transactions involving services, also suggest the appropriate
//  withholding tax (WHT) rate:
//  - ค่าขนส่ง (transportation): 1%
//  - ค่าโฆษณา (advertising): 2%
//  - ค่าบริการ/ค่าจ้างทำของ (services/contract work): 3%
//  - ค่าลิขสิทธิ์ (royalties): 3%
//  - ค่าเช่า (rent): 5%
//  - เงินปันผล (dividends): 10%
//  - If not a service (e.g., purchasing goods): no WHT (wht_rate: 0)
//  Return as wht_rate (integer: 100, 200, 300, 500, or 1000) and
//  wht_service_type (string: transport, advertising, service, royalty, rent, etc.)
//  If unsure, return wht_rate: 0."
```

The corresponding fields need to be added to the `ai/schema.ts` JSON schema generation (add `wht_rate` and `wht_service_type` as LLM output fields via the Field model).

### Thai Holidays Data Module

```typescript
// services/thai-holidays.ts

/**
 * Thai public holidays for 2026.
 * Source: THAI_TAX_REFERENCE.md Section 11
 * Note: Buddhist holidays change annually. This list must be updated each year.
 */
export const THAI_HOLIDAYS_2026: Date[] = [
  new Date(2026, 0, 1),   // New Year's Day
  new Date(2026, 0, 2),   // Extra Holiday
  new Date(2026, 2, 3),   // Makha Bucha Day
  new Date(2026, 3, 6),   // Chakri Day
  new Date(2026, 3, 13),  // Songkran
  new Date(2026, 3, 14),  // Songkran
  new Date(2026, 3, 15),  // Songkran
  new Date(2026, 4, 1),   // Labour Day
  new Date(2026, 4, 4),   // Coronation Day
  new Date(2026, 4, 31),  // Visakha Bucha Day
  new Date(2026, 5, 1),   // Visakha Bucha (substitution)
  new Date(2026, 5, 3),   // Queen Suthida's Birthday
  new Date(2026, 6, 28),  // King's Birthday
  new Date(2026, 6, 29),  // Asanha Bucha Day
  new Date(2026, 6, 30),  // Buddhist Lent Day
  new Date(2026, 7, 12),  // Queen Mother's Birthday
  new Date(2026, 9, 13),  // King Bhumibol Memorial Day
  new Date(2026, 9, 23),  // Chulalongkorn Memorial Day
  new Date(2026, 11, 5),  // Father's Day (Sat)
  new Date(2026, 11, 7),  // Father's Day (substitution)
  new Date(2026, 11, 10), // Constitution Day
  new Date(2026, 11, 31), // New Year's Eve
]
```

### Contact Zod Schema

```typescript
// forms/contacts.ts
import { z } from "zod"

export const contactFormSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ").max(256),
  taxId: z
    .string()
    .length(13, "เลขประจำตัวผู้เสียภาษีต้องเป็น 13 หลัก")
    .regex(/^\d{13}$/, "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลขเท่านั้น"),
  branch: z.string().default("00000"),
  address: z.string().min(1, "กรุณากรอกที่อยู่").max(512),
  type: z.enum(["vendor", "customer", "both"]).default("vendor"),
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Paper PND3/PND53 filing (7th deadline) | Mandatory e-filing (15th deadline) | 2025 | BanChee defaults to e-filing deadlines. Paper deadlines shown as secondary reference. |
| Manual WHT certificate numbering | Auto-sequential per Revenue Dept requirements | Ongoing | System must enforce sequential numbering with no gaps. |
| Separate WHT recording system | Integrated into expense flow | BanChee design decision | WHT fields on Transaction, not a separate WHT table. |

**Deprecated/outdated:**
- Paper-only PND3/PND53 filing: Thailand mandated e-filing for WHT starting 2025. BanChee shows e-filing deadlines (15th) as primary.
- Manual 50 Tawi creation: AI-powered WHT rate suggestion + one-click generation is the modern approach.

## Open Questions

1. **50 Tawi Layout Precision**
   - What we know: All 11+ required fields are documented in THAI_TAX_REFERENCE.md Section 6. Three copies needed.
   - What's unclear: The exact visual layout of the official Revenue Department form (checkbox positions, border styles, header layout). The RD provides a physical form template.
   - Recommendation: Build a clean, readable PDF that includes all required fields. Match the general structure but do not attempt pixel-perfect replication of the RD paper form. Revenue Department accepts any format that contains all required information.

2. **PND3/PND53 Differentiation Logic**
   - What we know: PND3 is for payments to individuals, PND53 is for payments to companies.
   - What's unclear: How to auto-determine payee type. Tax ID starting with 0 suggests individual (national ID), but this is not 100% reliable.
   - Recommendation: Let the user explicitly select the contact type ("บุคคลธรรมดา" vs "นิติบุคคล") when creating a contact. Use this to auto-assign whtType. User can override per transaction. Mark as Claude's Discretion per CONTEXT.md.

3. **Document Sequence Numbering Storage**
   - What we know: Sequential numbering is mandatory (INV-02). Numbers must be per document type, per user.
   - What's unclear: Best storage mechanism -- Setting model (simple), AppData (flexible), or dedicated counter table (robust).
   - Recommendation: Use the Setting model with codes like `seq_tax_invoice` and `seq_50_tawi`. Atomic increment via Prisma `$transaction`. This reuses existing infrastructure without new models. The Setting model's `@@unique([userId, code])` constraint provides the uniqueness guarantee.

4. **Tax Invoice Storage Model**
   - What we know: Tax invoices need to be stored for reference and PDF regeneration. They link to income transactions (D-06).
   - What's unclear: Whether to use a dedicated `TaxInvoice` Prisma model or the existing `AppData` JSON store.
   - Recommendation: Use `AppData` with `app: "tax-invoice"`. The JSON `data` field stores the full invoice record. This avoids a new migration for a model that is essentially a document with flexible fields. The linked Transaction provides the financial data. The `AppData` model already has `@@unique([userId, app])` -- but we need per-invoice records, so use individual AppData rows keyed by invoice ID, or store an array in the single AppData row. A dedicated model is cleaner if the number of invoices will be large. Recommend: dedicated `TaxInvoice` model for queryability and proper relations.

## Sources

### Primary (HIGH confidence)
- `.planning/research/THAI_TAX_REFERENCE.md` -- WHT rates (Section 2), 50 Tawi fields (Section 6), PND3/PND53 structure (Section 7), filing calendar (Section 10), 2026 holidays (Section 11)
- Existing codebase analysis -- `services/tax-calculator.ts`, `app/(app)/apps/vat-report/actions.ts`, `exports/pdf/fonts.ts`, `models/stats.ts`, `models/transactions.ts`, `prisma/schema.prisma`

### Secondary (MEDIUM confidence)
- `.planning/phases/01-thai-foundation-vat-compliance/01-RESEARCH.md` -- Architecture patterns, satang arithmetic, PDF generation patterns, font setup
- `.planning/codebase/CONCERNS.md` -- Extension points, tech debt items, security considerations
- `.planning/REQUIREMENTS.md` -- Requirement definitions and traceability

### Tertiary (LOW confidence)
- 50 Tawi exact visual layout -- based on training data knowledge of Thai RD forms. Needs validation against physical form if pixel-perfect layout is required.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all patterns verified against existing Phase 1 code
- Architecture: HIGH -- direct extension of established Phase 1 patterns (report app, PDF generation, dashboard widgets, tax calculator)
- WHT calculation logic: HIGH -- formulas verified against THAI_TAX_REFERENCE.md, cross-referenced with Phase 1's VAT calculator pattern
- Filing deadline logic: HIGH -- holiday list and deadline dates from THAI_TAX_REFERENCE.md, date-fns handles arithmetic
- 50 Tawi PDF layout: MEDIUM -- all required fields documented, but exact visual positioning is approximate
- PND3/PND53 differentiation: MEDIUM -- relies on user-provided contact type, auto-detection heuristic is supplementary

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (30 days -- stable domain, Thai tax rules do not change mid-year)
