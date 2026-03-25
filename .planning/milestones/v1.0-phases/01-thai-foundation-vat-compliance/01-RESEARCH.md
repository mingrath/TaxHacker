# Phase 1: Thai Foundation + VAT Compliance - Research

**Researched:** 2026-03-23
**Domain:** Thai SME tax compliance (localization, AI receipt extraction, VAT tracking, PP30 reporting)
**Confidence:** HIGH

## Summary

Phase 1 transforms TaxHacker into BanChee -- a Thai-only fork with full Thai UI, Buddhist Era dates, AI receipt scanning tuned for Thai tax invoices, and complete VAT input/output tracking with PP30 report generation. The existing codebase provides a strong foundation: Server Actions, Prisma models, LangChain AI pipeline, `@react-pdf/renderer` for PDFs, and a custom fields system. The core work is (1) replacing English strings with Thai, (2) adding first-class VAT columns to the Transaction model, (3) extending the AI prompt for Thai tax invoice field extraction with post-extraction validation, (4) building a business profile setup wizard, and (5) generating PP30 + purchase/sales tax reports as PDFs with THSarabunNew font.

The biggest technical risks are: VAT `/107` calculation correctness (extracting VAT from inclusive prices), Thai font rendering in `@react-pdf/renderer` (requires static weight TTF registration), and Buddhist Era date handling (store Gregorian, display B.E. via `Intl.DateTimeFormat` with `th-TH-u-ca-buddhist` calendar -- verified working on Node.js 23). The decision to do a Thai-only fork (no i18n framework) simplifies this phase significantly -- direct string replacement instead of translation infrastructure.

**Primary recommendation:** Add first-class VAT columns to Transaction (not extra JSON), build pure-function tax calculators in `services/`, extend the AI prompt with Thai tax invoice fields and post-extraction validation, and use `@react-pdf/renderer` with THSarabunNew static font files for PP30 PDF generation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Thai-only fork -- replace all English strings with Thai directly. No i18n framework (no next-intl). Target user is Thai only.
- **D-02:** Use Noto Sans Thai for UI font. THSarabunNew for generated PDF documents (required for Thai government compatibility).
- **D-03:** Date format: Thai standard -- "25 มี.ค. 2569" (day Thai-month-abbrev Buddhist-Era-year). Use พ.ศ. consistently throughout app.
- **D-04:** Use official Revenue Department terminology for all tax terms. Reference: `.planning/research/THAI_TAX_REFERENCE.md`
- **D-05:** AI auto-detects language -- handles Thai, English, and mixed receipts seamlessly. No user language toggle.
- **D-06:** Inline field validation -- each extracted field shows checkmark/cross status. Missing tax invoice fields highlighted red. User can fix before saving.
- **D-07:** Review required -- AI fills the form, user reviews/corrects all fields, then explicitly saves. No auto-save of AI results.
- **D-08:** Auto-categorize with user confirm -- AI suggests expense category (pre-filled), user sees it and can change before saving.
- **D-09:** Thai-specific AI extraction targets: vendor name (Thai), Tax ID (13 digits), branch number, VAT amount (separated), date (Thai or Gregorian), items with quantities.
- **D-10:** AI auto-detects VAT from receipt -- extracts VAT amount, pre-fills base + VAT split. Handles /107 extraction from VAT-inclusive prices automatically.
- **D-11:** Dashboard shows both views: summary card (Output VAT, Input VAT, Net payable/credit, color-coded) AND detailed ledger accessible via 'View details' link.
- **D-12:** PP30 generation is one-click: dashboard button per month -> calculates -> shows preview -> download. All 3 documents (Purchase Tax Report, Sales Tax Report, PP30) generated together in one action.
- **D-13:** 6-month input tax invoice expiry warning -- system flags invoices approaching expiry so users don't lose VAT credit.
- **D-14:** Guided setup wizard on first run -- step-by-step: Company name -> Tax ID -> Address -> VAT registration status -> Accounting period -> LLM API key. Must complete before accessing main app.
- **D-15:** VAT registration: manual toggle + auto-detection. System tracks cumulative revenue and alerts when approaching 1.8M THB threshold. Suggests user register for VAT.
- **D-16:** Base currency hardcoded to THB. Multi-currency for foreign transactions supported (existing TaxHacker feature).

### Claude's Discretion
- Loading states and skeleton UI for AI scanning
- Exact form layout and field ordering in transaction edit form
- VAT summary card color scheme and visual design
- Setup wizard step animations/transitions
- Error message wording and toast notification styling

### Deferred Ideas (OUT OF SCOPE)
- WHT rate suggestion on receipts -- Phase 2 (SCAN-04)
- Section 65 tri expense flagging -- Phase 3 (SCAN-05)
- e-Tax Invoice PDF/A-3 generation -- v2
- Filing deadline calendar -- Phase 2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| I18N-01 | UI displays in Thai with official Revenue Department tax terminology | Direct string replacement in components + defaults.ts. Thai terminology glossary in THAI_TAX_REFERENCE.md. Noto Sans Thai via next/font/google. |
| I18N-02 | Buddhist Era date display alongside Gregorian dates | `Intl.DateTimeFormat('th-TH-u-ca-buddhist', { year: 'numeric', month: 'short', day: 'numeric' })` verified on Node.js 23 producing exact "25 มี.ค. 2569" format. |
| I18N-03 | Thai number/currency formatting | `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })` verified producing "฿10,700.00". Change `LOCALE` in `lib/utils.ts` from "en-US" to "th-TH". |
| I18N-04 | Thai font support in generated PDFs | THSarabunNew static TTF registered via `Font.register()` in `@react-pdf/renderer`. Must use static weight files (Regular + Bold), not variable fonts. |
| SCAN-01 | AI extracts Thai tax invoice fields | Extend `buildLLMPrompt()` with Thai-specific field extraction. Add new Field defaults for merchantTaxId, merchantBranch, documentNumber, vatAmount, vatType. |
| SCAN-02 | AI validates uploaded receipt qualifies as valid tax invoice | Post-extraction validator checks 8 required fields per Section 86/4. Returns per-field checkmark/cross for inline display (D-06). |
| SCAN-03 | AI auto-categorizes expenses into Thai categories | Replace English DEFAULT_CATEGORIES with Thai equivalents. Add Thai `llm_prompt` hints per category. |
| VAT-01 | Track input VAT and output VAT per transaction | New first-class columns: `vatType` ("input"/"output"/"none"), `vatAmount`, `vatRate`, `subtotal` on Transaction model. |
| VAT-02 | Auto-calculate 7% VAT with /107 formula | Pure function `extractVATFromTotal(totalInclVAT)` in `services/tax-calculator.ts`. Integer arithmetic in satang. |
| VAT-03 | Auto-detect VAT registration requirement at 1.8M threshold | Query cumulative income transactions YTD. Alert at 80% (1.44M). Store VAT registration status in business profile settings. |
| VAT-04 | Generate Purchase Tax Report | `@react-pdf/renderer` component with THSarabunNew. 9 columns per Revenue Department format. Query input VAT transactions for period. |
| VAT-05 | Generate Sales Tax Report | Same structure as Purchase Tax Report but for output VAT transactions. |
| VAT-06 | Generate PP30 monthly VAT return data | Compute: output tax - input tax = net payable/credit. 16-field PP30 structure per THAI_TAX_REFERENCE.md Section 5. Bundle with VAT-04 + VAT-05 in one-click download. |
| VAT-07 | Flag input tax invoices approaching 6-month expiry | Query input VAT transactions where `issuedAt` is within 30 days of 6-month mark. Display warning badge on dashboard and transaction list. |
| BIZ-01 | Business profile with company name, Tax ID, branch, address | New settings codes in Setting model or dedicated business profile fields on User model. Validated via Zod schema (13-digit Tax ID pattern). |
| BIZ-02 | VAT registration status toggle | Boolean setting controlling which features are active. Non-registered hides VAT fields, disables tax invoice validation, disables PP30 generation. |
| BIZ-03 | Accounting period configuration | Setting for fiscal year start month (default: January = calendar year). Affects period selectors in reports. |
| BIZ-04 | Base currency set to THB | Change `DEFAULT_SETTINGS` default_currency from "EUR" to "THB". Existing multi-currency support for foreign transactions remains. |
</phase_requirements>

## Standard Stack

### Core (already in project)

| Library | Current Version | Purpose | Notes |
|---------|----------------|---------|-------|
| Next.js | ^15.2.4 | Full-stack framework | App Router, Server Components, Server Actions -- no changes needed |
| React | ^19.0.0 | UI library | No changes needed |
| Prisma | ^6.6.0 | ORM + migrations | Add new columns + models via `prisma migrate dev` |
| @react-pdf/renderer | ^4.3.0 (latest: 4.3.2) | PDF generation | Extend for Thai tax reports. Register THSarabunNew font. |
| LangChain | ^0.3.30 | AI orchestration | Extend prompts for Thai tax extraction. Keep existing provider fallback. |
| Zod | ^3.24.2 | Schema validation | Add Thai tax form schemas (business profile, VAT fields) |
| date-fns | ^3.6.0 (latest: 4.1.0) | Date utilities | Use for date arithmetic (6-month expiry calc). Display formatting via Intl API instead. |
| shadcn/ui | N/A (component library) | UI components | Use existing components. Add wizard step component. |

### New Dependencies for Phase 1

| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| next/font (built-in) | N/A | Noto Sans Thai web font | `next/font/google` loads Noto Sans Thai with no extra dependency. Self-hosted, no external requests. |

**No new npm packages required for Phase 1.** All needs are met by the existing stack plus built-in Node.js `Intl` APIs and `next/font/google`.

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| next-intl for i18n | Direct string replacement | D-01 locks Thai-only fork. No i18n framework needed. Saves ~50KB bundle + route restructuring complexity. |
| Vercel AI SDK | Keep LangChain | Existing codebase uses LangChain with working multi-provider fallback. Switching adds risk for no Phase 1 benefit. |
| ExcelJS for reports | @react-pdf/renderer | PP30 reports are PDF format (government standard). Excel export is Phase 4 (RPT-03). |
| Separate TaxConfig model | Extend Setting model | For Phase 1, business profile fits naturally as Setting key-value pairs. Dedicated model adds migration complexity with no Phase 1 benefit. |

### Font Files (must be bundled)

| Font | Purpose | Source | Format |
|------|---------|--------|--------|
| THSarabunNew Regular | PDF body text | f0nt.com or GitHub (open source, free for commercial use) | Static TTF |
| THSarabunNew Bold | PDF headings | Same source | Static TTF |
| Noto Sans Thai | UI web font | Google Fonts via `next/font/google` | Auto-managed by Next.js |

**Installation:**
```bash
# No new npm packages needed for Phase 1
# Font files: download THSarabunNew.ttf and THSarabunNew-Bold.ttf
# Place in: public/fonts/THSarabunNew.ttf, public/fonts/THSarabunNew-Bold.ttf
```

## Architecture Patterns

### Recommended Project Structure (new/modified files only)

```
app/
  layout.tsx                          # MODIFY: Add Noto Sans Thai font, change lang="th"
  (app)/
    layout.tsx                        # MODIFY: Add setup wizard redirect check
    setup/                            # NEW: Guided setup wizard
      page.tsx
      actions.ts
      components/
        setup-wizard.tsx
    dashboard/
      page.tsx                        # MODIFY: Add VAT summary card
      components/
        vat-summary-card.tsx          # NEW: Output/Input/Net VAT display
        vat-expiry-warnings.tsx       # NEW: 6-month expiry alerts
    unsorted/
      actions.ts                      # MODIFY: Extend with Thai tax validation
    transactions/
      actions.ts                      # MODIFY: Handle new VAT fields
    apps/
      vat-report/                     # NEW: PP30 + tax reports
        manifest.ts
        page.tsx
        actions.ts
        components/
          pp30-pdf.tsx                # NEW: PP30 PDF template
          purchase-tax-report-pdf.tsx # NEW: Purchase tax report
          sales-tax-report-pdf.tsx    # NEW: Sales tax report
          report-preview.tsx          # NEW: Preview before download
    settings/
      page.tsx                        # MODIFY: Add business profile section

services/                             # NEW: Business logic layer
  tax-calculator.ts                   # VAT computation (pure functions)
  tax-validator.ts                    # Section 86/4 field validation
  thai-date.ts                        # B.E. formatting utilities

models/
  defaults.ts                         # MODIFY: Thai categories, Thai fields, THB default
  stats.ts                            # MODIFY: Add VAT summary aggregation
  business-profile.ts                 # NEW: Business profile CRUD (Settings wrapper)

ai/
  prompt.ts                           # MODIFY: Support Thai tax invoice prompt
  schema.ts                           # MODIFY: Support taxid/enum field types
  validators/                         # NEW: Post-extraction validation
    tax-invoice-validator.ts

forms/
  business-profile.ts                 # NEW: Zod schema for setup wizard
  vat-report.ts                       # NEW: Zod schema for report period selection

lib/
  utils.ts                            # MODIFY: Change LOCALE to "th-TH"
  config.ts                           # MODIFY: Change app title, cookie prefix

exports/
  pdf/
    fonts.ts                          # NEW: THSarabunNew font registration
    thai-pdf-styles.ts                # NEW: Shared Thai PDF styles

public/
  fonts/
    THSarabunNew.ttf                  # NEW: Thai font for PDFs
    THSarabunNew-Bold.ttf             # NEW: Thai font bold weight

prisma/
  schema.prisma                       # MODIFY: Add VAT columns to Transaction
```

### Pattern 1: Pure Function Tax Calculator

**What:** All tax math lives in `services/tax-calculator.ts` as pure functions (no DB access, no side effects).
**When to use:** Every VAT calculation -- extraction from receipt, manual entry, report aggregation.
**Why:** Testable without database, auditable, single source of truth for tax math.

```typescript
// services/tax-calculator.ts
// All amounts in satang (integer). Rates in basis points (700 = 7.00%).

const VAT_RATE = 700 // 7.00%

type VATResult = {
  subtotal: number   // pre-VAT base (satang)
  vatAmount: number  // VAT portion (satang)
  total: number      // subtotal + vatAmount (satang)
}

/** Extract VAT from a VAT-inclusive total using the /107 method */
export function extractVATFromTotal(totalInclVAT: number, vatRate: number = VAT_RATE): VATResult {
  // CRITICAL: Use integer arithmetic. The /107 formula:
  // subtotal = total * 10000 / (10000 + vatRate)
  // This avoids floating point: 107000 * 10000 / 10700 = 100000 exactly
  const subtotal = Math.round(totalInclVAT * 10000 / (10000 + vatRate))
  const vatAmount = totalInclVAT - subtotal
  return { subtotal, vatAmount, total: totalInclVAT }
}

/** Compute VAT on a pre-VAT subtotal */
export function computeVATOnSubtotal(subtotal: number, vatRate: number = VAT_RATE): VATResult {
  const vatAmount = Math.round(subtotal * vatRate / 10000)
  return { subtotal, vatAmount, total: subtotal + vatAmount }
}
```

### Pattern 2: Post-Extraction Validation

**What:** After AI extracts fields from a receipt, validate against Section 86/4 requirements before showing to user.
**When to use:** Every `analyzeFileAction()` call when Thai tax features are active.

```typescript
// ai/validators/tax-invoice-validator.ts
type ValidationResult = {
  isValidTaxInvoice: boolean
  fields: Record<string, { present: boolean; valid: boolean; value: string | null }>
  warnings: string[]
}

export function validateTaxInvoiceFields(extracted: Record<string, unknown>): ValidationResult {
  // Check all 8 Section 86/4 required fields
  // Return per-field status for inline display (D-06)
}
```

### Pattern 3: Business Profile via Settings

**What:** Store business profile data (company name, Tax ID, VAT status) as Setting key-value pairs.
**When to use:** Phase 1 business profile. Reuses existing Setting model infrastructure.

```typescript
// models/business-profile.ts
const BUSINESS_PROFILE_CODES = [
  "biz_company_name",
  "biz_tax_id",
  "biz_branch",          // "00000" = HQ
  "biz_address",
  "biz_vat_registered",  // "true" / "false"
  "biz_vat_reg_date",    // ISO date string
  "biz_fiscal_year_start", // "1" = January (default)
] as const

export async function getBusinessProfile(userId: string): Promise<BusinessProfile>
export async function updateBusinessProfile(userId: string, data: BusinessProfileInput): Promise<void>
export async function isBusinessProfileComplete(userId: string): Promise<boolean>
```

### Pattern 4: Thai Date Formatting Utility

**What:** Single utility for all B.E. date display. Store Gregorian, display Buddhist Era.
**When to use:** Every date display in UI and PDF reports.

```typescript
// services/thai-date.ts
// Verified working on Node.js 23:
// Intl.DateTimeFormat('th-TH-u-ca-buddhist', { year: 'numeric', month: 'short', day: 'numeric' })
// produces: "25 มี.ค. 2569"

export function formatThaiDate(date: Date): string {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function formatThaiDateLong(date: Date): string {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export function formatThaiMonth(date: Date): string {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    year: "numeric",
    month: "long",
  }).format(date)
}

export function toBuddhistYear(gregorianYear: number): number {
  return gregorianYear + 543
}
```

### Pattern 5: Setup Wizard Gate

**What:** Intercept in `app/(app)/layout.tsx` to redirect to `/setup` when business profile is incomplete.
**When to use:** Every authenticated page load until setup is done.

```typescript
// In app/(app)/layout.tsx -- add after getCurrentUser()
const profileComplete = await isBusinessProfileComplete(user.id)
if (!profileComplete && !pathname.startsWith("/setup")) {
  redirect("/setup")
}
```

### Anti-Patterns to Avoid

- **VAT in extra JSON:** Do NOT store VAT fields in the `extra` JSON column. They need `SUM()` and `WHERE` queries for reports. Use first-class Prisma columns.
- **Floating-point tax math:** Do NOT use `amount * 0.07`. Use integer satang arithmetic: `amount * 700 / 10000`. JavaScript floating point causes rounding drift across thousands of transactions.
- **B.E. dates in database:** Do NOT store Buddhist Era years. Always store Gregorian. Convert to B.E. only at display/PDF layer.
- **Variable fonts in PDFs:** Do NOT use Noto Sans Thai variable font for `@react-pdf/renderer`. It does not support variable fonts. Use THSarabunNew static TTF files.
- **i18n framework:** Do NOT install next-intl or react-i18next. D-01 locks this as a Thai-only fork. Direct string replacement is simpler and correct for this use case.
- **Translating tax terms to English:** Do NOT provide English translations of Thai tax terms in the primary UI. "ภาษีซื้อ" is the correct label, not "Input Tax (ภาษีซื้อ)". Thai SME owners use Thai terms.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Buddhist Era dates | Manual year+543 arithmetic for display | `Intl.DateTimeFormat('th-TH-u-ca-buddhist')` | Built into Node.js 23. Handles month names, formatting. Verified working. |
| Thai currency formatting | String concatenation with "฿" | `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })` | Handles grouping, decimal places, symbol placement. Verified: "฿10,700.00". |
| PDF generation | Custom PDF binary construction | `@react-pdf/renderer` (already in project) | Already used for invoices. Just register Thai fonts and create new templates. |
| UUID generation | Math.random UUID | `crypto.randomUUID()` (already used in codebase) | Already the pattern in the codebase. |
| Date arithmetic | Manual month/year math for 6-month expiry | `date-fns` `addMonths()`, `isBefore()` | Already in project (v3.6.0). Handles edge cases (month boundaries, Feb). |
| Form validation | Manual field checking | Zod schemas (already the pattern) | Existing pattern. Add `businessProfileSchema` with Thai Tax ID regex. |

**Key insight:** This phase needs zero new npm dependencies. The existing stack (Next.js built-in font loading, Intl API, @react-pdf/renderer, date-fns, Zod) covers every requirement. The only new assets are two TTF font files.

## Common Pitfalls

### Pitfall 1: VAT-on-VAT Calculation Error (the /107 trap)

**What goes wrong:** Calculating 7% VAT on a total that already includes VAT. A 10,700 THB total should extract 700 THB VAT, but `10700 * 0.07 = 749` -- a 7% overstatement.
**Why it happens:** AI extraction returns the grand total from receipts. Developers apply `* 0.07` instead of the `/107` reverse formula.
**How to avoid:** Always use `extractVATFromTotal()` for inclusive prices. Formula: `vatAmount = total * 7 / 107` (or in satang: `total * 700 / 10700`). Unit test against known Revenue Department examples.
**Warning signs:** VAT summary where output/input tax is not exactly 7% of the base amounts. PP30 totals that don't reconcile.

### Pitfall 2: Thai Font Rendering in PDFs

**What goes wrong:** Generated PDFs show empty squares or garbled tone marks for Thai text.
**Why it happens:** `@react-pdf/renderer` requires explicit font registration. Default fonts lack Thai glyphs. Variable fonts are not supported.
**How to avoid:** Register THSarabunNew static TTF files via `Font.register()`. Test with all Thai tone marks: ก่ ก้ ก๊ ก๋ and complex clusters: กรุ๊ป, สร้าง. Do this as an early technical spike before building report templates.
**Warning signs:** Any square character in generated PDF output.

### Pitfall 3: Buddhist Era Date Double-Conversion

**What goes wrong:** AI extracts "23/03/2569" (B.E.) from a Thai receipt and stores it as-is, creating a date 543 years in the future. Or: UI adds 543 to a year that's already B.E.
**Why it happens:** No consistent conversion boundary. B.E. and C.E. dates mixed in the pipeline.
**How to avoid:** (1) AI prompt explicitly instructs: "If year > 2500, subtract 543 before returning". (2) All dates stored as Gregorian in PostgreSQL. (3) `formatThaiDate()` utility is the only B.E. conversion point. (4) Validate: reject any extracted date > 1 year in the future.
**Warning signs:** Dates showing year > 2500 in database. Dates showing year < 2024 in current-year reports.

### Pitfall 4: VAT Fields in Extra JSON Column

**What goes wrong:** Storing VAT amounts in the existing `extra` JSON column makes it impossible to efficiently aggregate for monthly reports.
**Why it happens:** The existing `vat_rate` and `vat` fields in DEFAULT_FIELDS are `isExtra: true`. Tempting to keep using them.
**How to avoid:** Add first-class Prisma columns: `vatAmount Int?`, `vatType String?`, `vatRate Int?`, `subtotal Int?`. Migrate existing extra field data to new columns. This enables `SELECT SUM(vatAmount) WHERE vatType = 'input'` for reports.
**Warning signs:** Report generation loading all transactions into memory for JavaScript aggregation (the existing stats.ts pattern).

### Pitfall 5: Non-VAT-Registered Business Generating Tax Invoices

**What goes wrong:** A business that is not VAT-registered generates documents labeled "ใบกำกับภาษี" (Tax Invoice). This is illegal -- non-registered businesses cannot issue tax invoices.
**Why it happens:** No UI gating based on VAT registration status.
**How to avoid:** `BIZ-02` VAT registration toggle. When `biz_vat_registered = false`: hide VAT input/output fields, disable PP30 generation, disable tax invoice validation, show simplified receipt-only UI. Hard-block any tax invoice generation path.
**Warning signs:** PP30 report accessible when VAT registration is toggled off.

### Pitfall 6: Amounts Stored as Floats

**What goes wrong:** Rounding errors accumulate across transactions. 1-2 satang discrepancies cause PP30 totals to not reconcile, triggering e-filing validation failures.
**Why it happens:** JavaScript `0.1 + 0.2 !== 0.3`. Using `amount * 0.07` produces floating-point intermediate values.
**How to avoid:** TaxHacker already stores amounts as integers (satang/cents). Continue this pattern. All tax calculations use integer arithmetic with `Math.round()` applied once at the end. Never divide then multiply -- multiply first, then divide.
**Warning signs:** Any `parseFloat()` or decimal arithmetic in tax calculation functions.

## Code Examples

### Thai Font Registration for PDFs

```typescript
// exports/pdf/fonts.ts
import { Font } from "@react-pdf/renderer"

// Register THSarabunNew -- MUST use static weight files, not variable font
Font.register({
  family: "THSarabun",
  fonts: [
    { src: "/fonts/THSarabunNew.ttf", fontWeight: "normal" },
    { src: "/fonts/THSarabunNew-Bold.ttf", fontWeight: "bold" },
  ],
})

// For all Thai PDF components, set fontFamily: "THSarabun"
```

### Noto Sans Thai UI Font via next/font

```typescript
// app/layout.tsx
import { Noto_Sans_Thai } from "next/font/google"

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans-thai",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body className="min-h-screen bg-white antialiased font-sans">{children}</body>
    </html>
  )
}
```

Then in `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    fontFamily: {
      sans: ["var(--font-noto-sans-thai)", "Noto Sans Thai", "sans-serif"],
    },
  },
},
```

### Thai Default Categories (replacing English)

```typescript
// In models/defaults.ts -- replace DEFAULT_CATEGORIES
export const DEFAULT_CATEGORIES = [
  { code: "office_supplies", name: "วัสดุสำนักงาน", color: "#3B82F6", llm_prompt: "เครื่องเขียน อุปกรณ์สำนักงาน" },
  { code: "utilities", name: "สาธารณูปโภค", color: "#10B981", llm_prompt: "ค่าน้ำ ค่าไฟ ค่าโทรศัพท์ ค่าอินเทอร์เน็ต" },
  { code: "transportation", name: "ค่าขนส่ง", color: "#F59E0B", llm_prompt: "ค่าขนส่ง ค่าเดินทาง ค่าน้ำมัน ค่าทางด่วน" },
  { code: "rent", name: "ค่าเช่า", color: "#8B5CF6", llm_prompt: "ค่าเช่าสำนักงาน ค่าเช่าอุปกรณ์ ค่าเช่าพื้นที่" },
  { code: "advertising", name: "ค่าโฆษณา", color: "#EC4899", llm_prompt: "ค่าโฆษณา ค่าประชาสัมพันธ์ ค่า Facebook Ads ค่า Google Ads" },
  { code: "services", name: "ค่าบริการ", color: "#06B6D4", llm_prompt: "ค่าบริการ ค่าที่ปรึกษา ค่าจ้างทำของ" },
  { code: "food", name: "อาหารและเครื่องดื่ม", color: "#F97316", llm_prompt: "ค่าอาหาร ค่าเครื่องดื่ม ค่าเลี้ยงรับรอง" },
  { code: "sales", name: "รายได้จากการขาย", color: "#22C55E", llm_prompt: "รายได้จากการขายสินค้าหรือบริการ" },
  { code: "other_income", name: "รายได้อื่น", color: "#14B8A6", llm_prompt: "รายได้อื่นๆ ดอกเบี้ยรับ ค่าคอมมิชชัน" },
  { code: "other", name: "อื่นๆ", color: "#6B7280", llm_prompt: "รายจ่ายอื่นๆ ที่ไม่เข้าหมวดข้างต้น" },
]
```

### VAT Summary Query Pattern

```typescript
// models/stats.ts -- NEW function for VAT dashboard
export async function getVATSummary(userId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const result = await prisma.transaction.groupBy({
    by: ["vatType"],
    where: {
      userId,
      issuedAt: { gte: startDate, lte: endDate },
      vatType: { in: ["input", "output"] },
    },
    _sum: {
      vatAmount: true,
      subtotal: true,
    },
  })

  const inputVAT = result.find(r => r.vatType === "input")?._sum.vatAmount ?? 0
  const outputVAT = result.find(r => r.vatType === "output")?._sum.vatAmount ?? 0

  return {
    inputVAT,    // satang
    outputVAT,   // satang
    netVAT: outputVAT - inputVAT, // positive = pay, negative = credit
  }
}
```

### Thai Tax Invoice AI Prompt Extension

```typescript
// ai/prompts/thai-tax-invoice-prompt.ts
export const THAI_TAX_INVOICE_PROMPT = `You are a Thai accounting assistant analyzing a tax invoice or receipt.

Extract the following fields:

{fields}

THAI TAX INVOICE SPECIFIC FIELDS (always extract these if visible):
- merchant_tax_id: 13-digit Thai Tax ID (เลขประจำตัวผู้เสียภาษี) of the seller. Format: X-XXXX-XXXXX-XX-X
- merchant_branch: Branch designation. "สำนักงานใหญ่" = "00000", "สาขาที่ 1" = "00001", etc.
- document_number: Tax invoice number (เลขที่ใบกำกับภาษี)
- vat_amount: VAT amount shown separately on the document (จำนวนภาษีมูลค่าเพิ่ม) in THB
- subtotal: Pre-VAT base amount (มูลค่าสินค้า/บริการ ก่อนภาษี) in THB
- vat_type: "input" if this is a purchase/expense receipt, "output" if this is a sales invoice

DATE HANDLING:
- If the year shown is greater than 2500, it is Buddhist Era. Subtract 543 to get Common Era.
- Return dates in YYYY-MM-DD format (Common Era).
- Example: วันที่ 23 มี.ค. 2569 = 2026-03-23

IMPORTANT:
- Document may be in Thai, English, or mixed. Extract regardless of language.
- If VAT is not shown separately but total includes VAT, extract the total as "total" and leave vat_amount blank.
- Do not make up information. Leave blank if not found.

Categories: {categories}
Projects: {projects}`
```

### Prisma Schema Extension

```prisma
// prisma/schema.prisma -- additions to Transaction model
model Transaction {
  // ... existing fields unchanged ...

  // === Phase 1: Thai VAT Fields ===
  subtotal          Int?      @map("subtotal")         // Pre-VAT amount (satang)
  vatRate           Int?      @map("vat_rate")         // Basis points (700 = 7.00%)
  vatAmount         Int?      @map("vat_amount")       // VAT in satang
  vatType           String?   @map("vat_type")         // "input" | "output" | "none"
  merchantTaxId     String?   @map("merchant_tax_id")  // 13-digit Thai TIN
  merchantBranch    String?   @map("merchant_branch")  // "00000" = HQ
  documentNumber    String?   @map("document_number")  // Tax invoice number
  documentType      String?   @map("document_type")    // "tax_invoice" | "receipt" | "abbreviated_tax_invoice"

  // === Indexes for VAT report queries ===
  @@index([vatType])
  @@index([merchantTaxId])
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Intl` B.E. dates unsupported | `th-TH-u-ca-buddhist` locale fully supported in Node.js 23 | Node.js 18+ (ICU full) | No external date library needed for B.E. display |
| react-pdf Thai font workarounds | @react-pdf/renderer v4.x improved font registration | 2024 | Static TTF registration works. Variable fonts still unsupported. |
| Prisma `groupBy` limited | Prisma 6.x `groupBy` with `_sum` aggregation | 2025 | Enables database-level VAT aggregation instead of loading all transactions into memory |
| TaxHacker EUR-only defaults | Fully configurable via `models/defaults.ts` | Existing | Data-only change, no code restructuring needed |

**Deprecated/outdated:**
- The existing `vat_rate` and `vat` extra fields in DEFAULT_FIELDS (stored in `extra` JSON) must be migrated to first-class columns. The extra JSON pattern does not support efficient aggregation queries.
- The `LOCALE = "en-US"` constant in `lib/utils.ts` must change to `"th-TH"`.
- The `formatPeriodLabel()` function in `lib/utils.ts` hardcodes `"en-US"` locale for date display -- must switch to Thai formatting.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 (to be installed -- no test framework currently exists) |
| Config file | None -- Wave 0 must create `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VAT-02 | /107 VAT extraction produces correct satang amounts | unit | `npx vitest run tests/services/tax-calculator.test.ts -t "extractVAT"` | Wave 0 |
| VAT-02 | VAT on subtotal produces correct amounts | unit | `npx vitest run tests/services/tax-calculator.test.ts -t "computeVAT"` | Wave 0 |
| VAT-06 | PP30 summary computation from transactions | unit | `npx vitest run tests/services/tax-calculator.test.ts -t "PP30"` | Wave 0 |
| SCAN-02 | Section 86/4 field validation catches missing fields | unit | `npx vitest run tests/ai/tax-invoice-validator.test.ts` | Wave 0 |
| I18N-02 | formatThaiDate produces correct B.E. output | unit | `npx vitest run tests/services/thai-date.test.ts` | Wave 0 |
| I18N-03 | Thai currency formatting correct | unit | `npx vitest run tests/lib/utils.test.ts -t "formatCurrency"` | Wave 0 |
| BIZ-01 | Business profile Zod schema validates 13-digit Tax ID | unit | `npx vitest run tests/forms/business-profile.test.ts` | Wave 0 |
| VAT-03 | Revenue threshold detection at 1.8M | unit | `npx vitest run tests/services/tax-calculator.test.ts -t "threshold"` | Wave 0 |
| VAT-07 | 6-month expiry flag logic | unit | `npx vitest run tests/services/tax-calculator.test.ts -t "expiry"` | Wave 0 |
| I18N-04 | PDF renders Thai text without garbled characters | manual-only | Generate test PDF, visually verify Thai tone marks | N/A -- visual |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest` + `@vitest/coverage-v8` -- install as devDependencies
- [ ] `vitest.config.ts` -- configure with path aliases matching tsconfig
- [ ] `tests/services/tax-calculator.test.ts` -- VAT /107 extraction, VAT on subtotal, PP30 summary, threshold detection, expiry flag
- [ ] `tests/services/thai-date.test.ts` -- B.E. formatting, edge cases
- [ ] `tests/ai/tax-invoice-validator.test.ts` -- Section 86/4 field validation
- [ ] `tests/forms/business-profile.test.ts` -- Tax ID format validation
- [ ] `tests/lib/utils.test.ts` -- Thai currency/number formatting

## Open Questions

1. **THSarabunNew font licensing and source**
   - What we know: THSarabunNew is widely used in Thai government documents and is freely available. Multiple sources exist on GitHub and font sites.
   - What's unclear: The exact license terms for bundling in an MIT-licensed open source project. Some sources list it as "free for personal and commercial use" but no formal OSS license file found.
   - Recommendation: Download from the most reputable source (f0nt.com or SIPA Thailand). Include attribution. If licensing is unclear, fall back to Sarabun (Google Fonts, SIL Open Font License) which is visually similar.

2. **Existing extra field data migration**
   - What we know: DEFAULT_FIELDS includes `vat_rate` and `vat` as `isExtra: true`. Any existing transactions may have VAT data in the `extra` JSON column.
   - What's unclear: Whether any users of the fork already have data in these fields.
   - Recommendation: Write a Prisma data migration that moves `extra.vat_rate` and `extra.vat` to the new first-class columns. Run it as Migration 3 after adding columns. Safe because the columns are nullable.

3. **AI prompt for mixed language receipts**
   - What we know: D-05 says AI auto-detects language. Thai receipts often mix Thai and English (product names in English, headers in Thai).
   - What's unclear: How well current LLM providers (GPT-4o-mini, Gemini 2.5 Flash) handle Thai tax invoice extraction specifically. No benchmarks available.
   - Recommendation: Build the prompt with explicit Thai field patterns (Tax ID format, branch designation patterns). Test with 10-20 real Thai receipts during development. Accept that accuracy will improve with model updates.

## Sources

### Primary (HIGH confidence)
- `.planning/research/THAI_TAX_REFERENCE.md` -- Complete Thai tax implementation reference (compiled from Revenue Department, Tilleke & Gibbins, KPMG, PwC, Forvis Mazars, FlowAccount)
- `.planning/research/ARCHITECTURE.md` -- Schema design, AI prompt architecture, report generation patterns
- `.planning/research/PITFALLS.md` -- 15 documented pitfalls with prevention strategies
- `.planning/codebase/ARCHITECTURE.md` -- Full TaxHacker architecture analysis
- `.planning/codebase/CONCERNS.md` -- Extension points, hardcoded assumptions, schema gaps
- Node.js 23 `Intl.DateTimeFormat` -- Verified locally: `th-TH-u-ca-buddhist` produces correct B.E. dates
- Node.js 23 `Intl.NumberFormat` -- Verified locally: `th-TH` currency produces correct "฿10,700.00"
- `prisma/schema.prisma` -- Current 240-line schema reviewed, Transaction model limitations documented
- `package.json` -- Current dependency versions verified

### Secondary (MEDIUM confidence)
- @react-pdf/renderer GitHub issues (#633 and related) -- Thai font rendering problems documented by community
- THSarabunNew font compatibility -- confirmed working with react-pdf by multiple Thai developer blog posts

### Tertiary (LOW confidence)
- THSarabunNew font licensing -- no formal OSS license document found, described as "free" on distribution sites

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, versions verified via npm
- Architecture: HIGH -- patterns derived directly from codebase analysis with clear extension points
- Tax calculations: HIGH -- formulas verified against THAI_TAX_REFERENCE.md (compiled from authoritative Thai tax sources)
- Pitfalls: HIGH -- 15 pitfalls documented with prevention strategies from multiple sources
- Thai font PDF rendering: MEDIUM -- known issue, solution documented, but requires hands-on verification with specific font files
- AI Thai extraction accuracy: MEDIUM -- prompt patterns designed, but real-world accuracy depends on LLM provider performance with Thai text

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable domain -- Thai tax rules change annually but 2026 rates are set through September)
