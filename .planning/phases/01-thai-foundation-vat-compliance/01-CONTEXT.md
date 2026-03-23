# Phase 1: Thai Foundation + VAT Compliance - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Business profile setup for Thai SME, full Thai language UI (Thai-only fork), AI receipt scanning with Thai-specific extraction and validation, and complete VAT input/output tracking with monthly PP30 report generation. This builds on TaxHacker's existing AI scanning pipeline, file management, auth, and dashboard.

</domain>

<decisions>
## Implementation Decisions

### Thai UI Approach
- **D-01:** Thai-only fork — replace all English strings with Thai directly. No i18n framework (no next-intl). Target user is Thai only.
- **D-02:** Use Noto Sans Thai for UI font. THSarabunNew for generated PDF documents (required for Thai government compatibility).
- **D-03:** Date format: Thai standard — "25 มี.ค. 2569" (day Thai-month-abbrev Buddhist-Era-year). Use พ.ศ. consistently throughout app.
- **D-04:** Use official Revenue Department terminology for all tax terms. Reference: `.planning/research/THAI_TAX_REFERENCE.md`

### AI Thai Extraction
- **D-05:** AI auto-detects language — handles Thai, English, and mixed receipts seamlessly. No user language toggle.
- **D-06:** Inline field validation — each extracted field shows ✓/✗ status. Missing tax invoice fields highlighted red. User can fix before saving.
- **D-07:** Review required — AI fills the form, user reviews/corrects all fields, then explicitly saves. No auto-save of AI results.
- **D-08:** Auto-categorize with user confirm — AI suggests expense category (pre-filled), user sees it and can change before saving.
- **D-09:** Thai-specific AI extraction targets: vendor name (Thai), Tax ID (13 digits), branch number (สำนักงานใหญ่/สาขาที่), VAT amount (separated), date (Thai or Gregorian), items with quantities.

### VAT Tracking UX
- **D-10:** AI auto-detects VAT from receipt — extracts VAT amount, pre-fills base + VAT split. Handles /107 extraction from VAT-inclusive prices automatically.
- **D-11:** Dashboard shows both views: summary card (Output VAT, Input VAT, Net payable/credit, color-coded) AND detailed ledger accessible via 'View details' link.
- **D-12:** PP30 generation is one-click: dashboard button per month → calculates → shows preview → download. All 3 documents (Purchase Tax Report, Sales Tax Report, PP30) generated together in one action.
- **D-13:** 6-month input tax invoice expiry warning — system flags invoices approaching expiry so users don't lose VAT credit.

### Business Profile & Onboarding
- **D-14:** Guided setup wizard on first run — step-by-step: Company name → Tax ID → Address → VAT registration status → Accounting period → LLM API key. Must complete before accessing main app.
- **D-15:** VAT registration: manual toggle + auto-detection. System tracks cumulative revenue and alerts when approaching 1.8M THB threshold. Suggests user register for VAT.
- **D-16:** Base currency hardcoded to THB. Multi-currency for foreign transactions supported (existing TaxHacker feature).

### Claude's Discretion
- Loading states and skeleton UI for AI scanning
- Exact form layout and field ordering in transaction edit form
- VAT summary card color scheme and visual design
- Setup wizard step animations/transitions
- Error message wording and toast notification styling

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Thai Tax Compliance
- `.planning/research/THAI_TAX_REFERENCE.md` — Complete Thai tax implementation bible: tax invoice fields (Section 86/4), WHT rates, VAT formulas, PP30 structure, 50 Tawi fields, Section 65 tri, SME rates, filing calendar, 2026 holidays
- `.planning/research/FEATURES.md` — Competitor feature landscape, table stakes, differentiators
- `.planning/research/PITFALLS.md` — Common Thai tax software mistakes (VAT /107 formula, WHT-before-VAT, Thai font issues)

### Architecture & Extension
- `.planning/research/ARCHITECTURE.md` — How to extend TaxHacker schema, add i18n, AI prompt strategy
- `.planning/codebase/ARCHITECTURE.md` — Existing TaxHacker architecture, data flow, layers
- `.planning/codebase/CONCERNS.md` — Extension points, hardcoded assumptions, schema gaps
- `.planning/codebase/STACK.md` — Current tech stack with versions

### Codebase Patterns
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, code style, import organization
- `.planning/codebase/STRUCTURE.md` — File organization, route structure

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ai/prompt.ts` — Dynamic prompt builder with field/category/project templating. Extend for Thai tax extraction prompts.
- `ai/schema.ts` — Converts user-defined Fields to JSON Schema for LLM structured output. Add Thai tax fields (Tax ID, branch, VAT).
- `ai/providers/llmProvider.ts` — Multi-provider fallback chain. Works with OpenAI, Gemini, Mistral. No changes needed.
- `components/unsorted/analyze-form.tsx` — Existing AI analysis UI. Extend with inline validation flags.
- `components/transactions/edit.tsx` — Transaction edit form. Add VAT input/output fields.
- `components/dashboard/stats-widget.tsx` — Dashboard stats. Add VAT summary card.
- `models/defaults.ts` — Default field seeding via `createUserDefaults()`. Add Thai-specific default fields.
- `lib/config.ts` — Zod-validated config. Add Thai-specific config options.

### Established Patterns
- **Server Actions:** `"use server"` with `ActionState<T>` return type. All mutations go through `actions.ts` files.
- **Data Access:** Model functions in `models/` accept `userId` as first param. Return Prisma types.
- **Form Validation:** Zod schemas in `forms/`. `.safeParse()` in server actions.
- **State Management:** React `useState` local state only. No global store. URL-driven filters.
- **Custom Fields:** `Field` model with `isExtra: true` stored in Transaction's `extra` JSON column. AI prompts per field via `llm_prompt`.

### Integration Points
- **Schema extension:** New Prisma columns on Transaction (vatInput, vatOutput, vatBase, vatAmount) — promote from `extra` JSON to first-class columns for efficient aggregation queries.
- **AI prompt extension:** Add Thai tax fields to `buildLLMPrompt()` in `ai/prompt.ts`. Add validation logic for Section 86/4 fields.
- **Dashboard extension:** New VAT summary widget in `components/dashboard/`. Connect to new `models/stats.ts` VAT aggregation functions.
- **Report generation:** New route at `app/(app)/reports/` for PP30 and tax reports. Use `@react-pdf/renderer` with THSarabunNew font for PDF output.
- **Settings extension:** New business profile fields in settings. Extend `forms/settings.ts` Zod schema.
- **Onboarding:** New setup wizard route at `app/(app)/setup/` or intercept at `app/(app)/layout.tsx` when business profile incomplete.

</code_context>

<specifics>
## Specific Ideas

- Target user is a Thai SME owner who is NOT an accountant — UI must be dead simple
- Tax terminology must use Revenue Department official Thai terms (ภาษีซื้อ, ภาษีขาย, ใบกำกับภาษี, etc.)
- PP30 should feel like "one button and done" — not a multi-step accounting process
- VAT auto-detection from receipts is the core wow moment — snap a photo, AI figures out the tax
- The setup wizard is important because wrong Tax ID or VAT status causes all downstream reports to be wrong

</specifics>

<deferred>
## Deferred Ideas

- WHT rate suggestion on receipts — Phase 2 (SCAN-04)
- Section 65 tri expense flagging — Phase 3 (SCAN-05)
- e-Tax Invoice PDF/A-3 generation — v2
- Filing deadline calendar — Phase 2

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-thai-foundation-vat-compliance*
*Context gathered: 2026-03-23*
