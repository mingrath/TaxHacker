# Codebase Concerns

**Analysis Date:** 2026-03-23

---

## 1. Extension Points

### 1.1 Custom Fields System

**Files:** `models/fields.ts`, `models/defaults.ts` (lines 286-447), `prisma/schema.prisma` (Field model, lines 135-152)

The custom fields system is the primary extension mechanism and is well-designed for adding new data points. Each field has:
- `code` (unique per user), `name`, `type` (string/number), `llm_prompt`
- `isExtra` flag that controls whether the value lives on the Transaction row directly or in the `extra` JSON column
- `isVisibleInList`, `isVisibleInAnalysis`, `isRequired` flags

**Extensibility rating: Good.** New fields can be added via the settings UI or by modifying `DEFAULT_FIELDS` in `models/defaults.ts`. The `extra` JSON column on Transaction (`prisma/schema.prisma` line 185) absorbs any custom field values, so no schema migration is needed for user-defined fields.

**Limitation:** Field `type` only supports `"string"` and `"number"`. There is no `"date"`, `"enum"`, `"boolean"`, or `"currency"` type. The `options` JSON column on Field exists but is unused in any code path -- it appears to be a planned but unimplemented feature.

**Limitation:** The `splitTransactionDataExtraFields` function in `models/transactions.ts` (lines 192-220) determines extra vs. standard fields dynamically, but it uses a loose `TransactionData` type with `[key: string]: unknown` -- no runtime validation of extra field values against their declared types.

### 1.2 AI Prompt System

**Files:** `ai/prompt.ts`, `ai/schema.ts`, `ai/analyze.ts`, `ai/providers/llmProvider.ts`, `models/defaults.ts` (lines 3-20)

**How to add new extraction prompts:**
1. The prompt template lives in user settings as `prompt_analyse_new_file` (stored in DB, editable in UI)
2. Template variables: `{fields}`, `{categories}`, `{projects}`, `{categories.code}`, `{projects.code}`
3. `ai/prompt.ts` builds the final prompt by replacing these variables with user-specific data
4. `ai/schema.ts` generates a JSON schema from the user's fields, which constrains the LLM's structured output

**Extensibility rating: Moderate.** Adding new extraction prompts for different document types (e.g., a Thai tax receipt prompt vs. a generic invoice prompt) requires either:
- Overwriting the single `prompt_analyse_new_file` setting (loses the original)
- Adding new setting codes manually (no UI support for multiple prompt templates)

There is no concept of "prompt per document type" or "prompt per category." The system assumes one global prompt for all AI analysis.

**How to add a new LLM provider:**
1. Add provider config to `lib/llm-providers.ts` (PROVIDERS array)
2. Add a new `else if` branch in `ai/providers/llmProvider.ts` `requestLLMUnified` function (line 31-59)
3. Add corresponding setting codes for API key and model name

The provider system uses LangChain abstractions (`@langchain/openai`, `@langchain/google-genai`, `@langchain/mistralai`), so adding providers that LangChain supports is straightforward. The fallback chain in `requestLLM` (line 90-112) tries providers in priority order, which is a good pattern.

### 1.3 Category/Project System

**Files:** `models/categories.ts`, `models/projects.ts`, `models/defaults.ts` (lines 61-104)

**Extensibility rating: Good.** Categories and projects are fully user-configurable with CRUD operations. Each has:
- `code` (unique per user), `name`, `color`, `llm_prompt`
- The `llm_prompt` field guides the AI to assign transactions to the correct category/project

**Limitation:** Categories and projects are structurally identical (same fields, same patterns). There is no hierarchy -- categories cannot have sub-categories. For Thai tax purposes, you cannot model the distinction between deductible vs. non-deductible expense categories at the schema level.

**Limitation:** The `llm_prompt` field on categories is just a free-text hint. There is no structured metadata for tax treatment (e.g., VAT-applicable, WHT rate, deductibility rules).

### 1.4 Export System

**Files:** `app/(app)/export/transactions/route.ts`, `models/export_and_import.ts`

**How to add new report formats:**
The export system currently supports only CSV (and CSV-in-ZIP with attachments). The field mapping in `EXPORT_AND_IMPORT_FIELD_MAP` (`models/export_and_import.ts` lines 19-131) handles per-field export/import transformations.

**Extensibility rating: Low.** Adding a new format (e.g., PDF report, Thai RD filing format) requires:
1. Writing a new route handler (the current one is CSV-only, 188 lines)
2. The field map is reusable but the CSV stream logic is tightly coupled to `@fast-csv/format`
3. There is no report template system -- the invoice generator (`app/(app)/apps/invoices/`) is a separate "app" with its own PDF rendering via `@react-pdf/renderer`

**The Apps system** (`app/(app)/apps/common.ts`) provides a plugin-like architecture for new features. Each app is a directory under `app/(app)/apps/` with a `manifest.ts`. Currently only "invoices" exists. This is the cleanest extension point for adding new report types or tax tools.

### 1.5 Invoice Templates

**Files:** `app/(app)/apps/invoices/default-templates.ts`, `app/(app)/apps/invoices/components/invoice-page.tsx` (564 lines), `app/(app)/apps/invoices/components/invoice-pdf.tsx` (414 lines)

The invoice template system supports localized labels (demonstrated by the German template) and custom tax lines (`additionalTaxes` array). This is a good starting point for Thai invoice templates with VAT.

**Limitation:** Templates are hardcoded in `default-templates.ts`. There is no user-created template persistence beyond the AppData JSON blob.

---

## 2. Hardcoded Assumptions Requiring Changes for Thai Tax

### 2.1 Currency Handling

**Files:** `models/defaults.ts` (lines 106-284), `lib/utils.ts` (lines 6, 12-25)

- **Default currency is EUR:** `DEFAULT_SETTINGS` at line 28 sets `default_currency: "EUR"`
- **THB is already in the currency list:** Line 119 includes `{ code: "THB", name: "฿" }` -- no change needed to add THB support
- **Locale is hardcoded to `en-US`:** `lib/utils.ts` line 6 declares `const LOCALE = "en-US"`. The `formatCurrency` function (line 12) uses `Intl.NumberFormat` with this locale. Thai formatting (e.g., `1,234.56 ฿` vs. `฿1,234.56`) requires changing to `th-TH` or making it configurable
- **Amounts stored as integers (cents):** `models/export_and_import.ts` lines 35-42 show `value / 100` for export and `value * 100` for import. This assumes 2 decimal places, which works for THB (satang). However, there is no explicit decimal places config per currency

**Fix approach:** Make `LOCALE` a user setting or derive from the default currency. Change default currency setting to `"THB"` in the fork's `models/defaults.ts`.

### 2.2 Tax Calculations

**Files:** `models/defaults.ts` (lines 418-436), `models/stats.ts`, `lib/stats.ts`

- **VAT fields exist but are "extra" fields:** `vat_rate` and `vat` (VAT Amount) are defined in `DEFAULT_FIELDS` (lines 418-436) as `isExtra: true`. They get stored in the Transaction `extra` JSON column, not as first-class columns
- **No tax calculation logic:** There is zero tax computation anywhere in the codebase. The stats system (`models/stats.ts`, `lib/stats.ts`) only calculates income/expense totals per currency. No VAT summaries, no WHT calculations, no tax period reports
- **Transaction types are only "income" and "expense":** `models/defaults.ts` line 45 sets `default_type: "expense"`. The stats functions filter on `t.type === "income"` or `t.type === "expense"`. There is no "tax payment", "VAT refund", or "withholding" transaction type

**Missing for Thai tax:**
- WHT (withholding tax) tracking: no fields for WHT rate, WHT amount, payer TIN
- VAT input/output distinction: no way to track whether VAT is input (claimable) or output (collected)
- Tax ID (TIN) for merchant/payer: the `merchant` field is free text
- PP.30/PP.36 filing period support
- Tax calendar awareness (monthly VAT filing, half-year PND)

### 2.3 Locale/Language Assumptions

**Files:** `lib/utils.ts` (lines 6, 142-158), `models/defaults.ts` (lines 61-102)

- **All default category names are in English:** "Advertisement", "Food and Drinks", "Salary", etc.
- **All LLM prompts are in English:** The default analysis prompt (line 3-20) and all field/category `llm_prompt` values are English
- **Date formatting uses `en-US` locale:** `formatPeriodLabel` in `lib/utils.ts` (lines 142-158) hardcodes `"en-US"` for `toLocaleDateString`
- **Invoice template labels default to English:** `default-templates.ts` shows English and German templates but no Thai

**Fix approach:** The system is data-driven enough that changing defaults in `models/defaults.ts` is sufficient for Thai localization. No structural changes needed for category names or prompts -- just change the default values.

### 2.4 Date Format Assumptions

**Files:** `models/defaults.ts` (line 321), `models/export_and_import.ts` (line 118), `models/stats.ts` (lines 157-158)

- **Date format hardcoded to `YYYY-MM-DD`:** The LLM prompt for `issuedAt` requests "YYYY-MM-DD format" (Gregorian)
- **No Buddhist Era (B.E.) support:** Thai official documents use B.E. years (add 543). The system stores dates as JavaScript `Date` objects (Gregorian) which is correct for storage, but display formatting would need B.E. conversion
- **Time series grouping assumes Gregorian calendar:** `models/stats.ts` uses `getFullYear()` and `getMonth()` -- this is fine for computation but display labels should show B.E. years for Thai users

**Fix approach:** Keep Gregorian dates in storage. Add a display formatter that converts to B.E. when the locale is `th-TH`. This is a UI-only change.

---

## 3. Database Schema Concerns

### 3.1 Existing Models

**File:** `prisma/schema.prisma` (240 lines)

| Model | Purpose | Lines |
|-------|---------|-------|
| User | User account + subscription + business info | 14-45 |
| Session | Auth sessions | 47-60 |
| Account | OAuth provider accounts | 62-79 |
| Verification | Email verification codes | 81-90 |
| Setting | Key-value settings per user | 92-103 |
| Category | Expense categories with LLM hints | 105-118 |
| Project | Project groupings with LLM hints | 120-133 |
| Field | Custom field definitions | 135-152 |
| File | Uploaded file metadata | 154-168 |
| Transaction | Core financial record | 170-203 |
| Currency | User's currency list | 205-214 |
| AppData | Generic JSON storage for apps | 216-225 |
| Progress | Long-running operation tracking | 227-239 |

### 3.2 Missing for VAT/WHT Tracking

**Transaction model limitations:**
- `total` is a single `Int?` (nullable!) -- no separate fields for `subtotal`, `vatAmount`, `whtAmount`, `netAmount`
- `type` is a `String?` with no enum constraint -- any string is accepted
- No `taxId` or `merchantTIN` field for the counterparty
- No `documentNumber` field for official receipt/tax invoice numbers
- `items` is a `Json` column (`@default("[]")`) -- line items have no schema enforcement
- `files` is also a `Json` column -- file references are stored as a JSON array of UUIDs rather than a proper relation table

**What needs adding for Thai tax:**
1. First-class VAT columns: `vatRate Int?`, `vatAmount Int?`, `vatType String?` (input/output)
2. WHT columns: `whtRate Int?`, `whtAmount Int?`, `whtFormType String?` (PND 3/53)
3. Merchant TIN: `merchantTaxId String?`
4. Document tracking: `documentNumber String?`, `documentType String?` (tax invoice/receipt/credit note)
5. A proper `TransactionItem` model instead of the untyped `items` JSON
6. A proper `TransactionFile` join table instead of the `files` JSON array

### 3.3 Schema Extensibility

**Good:** The `extra` JSON column on Transaction and `options` JSON column on Field provide escape hatches for arbitrary data without migrations. The `AppData` model is a generic JSON store per app per user.

**Bad:** The `items` and `files` JSON columns on Transaction are a tech debt trap. They bypass referential integrity, cannot be queried efficiently, and make it impossible to index or filter by line item properties. The `files` JSON approach means file-transaction relationships are not enforced by the database.

**Migration history:** 10 migrations from 2025-04-03 to 2025-05-23, showing active schema evolution. Adding new columns is straightforward with Prisma.

---

## 4. Third-Party Dependencies

### 4.1 Stripe Integration Coupling

**Files:** `lib/stripe.ts`, `app/api/stripe/checkout/route.ts`, `app/api/stripe/portal/route.ts`, `app/api/stripe/webhook/route.ts`

**Coupling level: Low (good).** Stripe is conditionally initialized:
```typescript
// lib/stripe.ts line 4
export const stripeClient: Stripe | null = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey, { apiVersion: "2025-03-31.basil" })
  : null
```

When `STRIPE_SECRET_KEY` is empty (default), `stripeClient` is `null` and all Stripe routes return errors gracefully. The webhook handler (`app/api/stripe/webhook/route.ts`) is self-contained.

**Plans are hardcoded:** `lib/stripe.ts` lines 24-57 define `PLANS` with a hardcoded `stripePriceId`. For a fork, either remove Stripe entirely or update the price IDs.

**For the fork:** Stripe can be safely ignored. Set `STRIPE_SECRET_KEY` to empty and the entire payment system is disabled. The `SELF_HOSTED_MODE=true` flag (default) bypasses all subscription checks.

### 4.2 Auth System Flexibility

**Files:** `lib/auth.ts`, `lib/auth-client.ts`, `middleware.ts`

**Auth provider:** `better-auth` with Prisma adapter, using email OTP (no password auth). Plugins: `emailOTP`, `nextCookies`.

**Self-hosted mode bypass:** When `SELF_HOSTED_MODE=true` (default), the auth system is entirely bypassed:
- `getCurrentUser()` returns a hardcoded `taxhacker@localhost` user
- `middleware.ts` returns `NextResponse.next()` without checking cookies
- Subscription checks (`isSubscriptionExpired`, `isAiBalanceExhausted`) return `false`

**Coupling level: Medium.** Auth is referenced via `getCurrentUser()` in every server action. The function signature is clean (`async (): Promise<User>`), so swapping auth providers only requires changing `lib/auth.ts`. However, the `better-auth` schema (Session, Account, Verification models) is wired into Prisma and would need migration to remove.

**Email dependency:** `resend` package is used for OTP emails. In self-hosted mode this is effectively unused.

### 4.3 LangChain Dependency

**Files:** `ai/providers/llmProvider.ts`, `package.json` (lines 17-19)

Three LangChain packages: `@langchain/openai`, `@langchain/google-genai`, `@langchain/mistralai`. These are heavyweight dependencies with deep dependency trees.

**Risk:** LangChain's API changes frequently. The current usage is minimal (structured output via `withStructuredOutput`). Consider replacing with direct API calls or the lighter Vercel AI SDK if LangChain causes bundle/compatibility issues.

### 4.4 Other Notable Dependencies

- **`@react-pdf/renderer` (v4.3.0):** Used only for invoice PDF generation. Large dependency for a single feature.
- **`pdf2pic` (v3.1.4):** Converts PDFs to images for AI analysis. Requires system-level `graphicsmagick` or `imagemagick`. This is a deployment concern for containerized environments (the Dockerfile must include these).
- **`sharp` (v0.33.5):** Image processing. Has native bindings -- platform-specific builds required.

---

## 5. Tech Debt

### 5.1 Pervasive `any` Types

- **Issue:** `models/backups.ts` uses `any` 15+ times. `models/files.ts` uses `any` for `createFile` and `updateFile` parameters. `models/apps.ts`, `models/progress.ts`, `models/export_and_import.ts` all use `any`.
- **Files:** `models/backups.ts`, `models/files.ts`, `models/apps.ts`, `models/progress.ts`, `models/export_and_import.ts`
- **Impact:** No compile-time safety for data flowing through backup/restore, file operations, or export/import. Bugs from wrong field names or types will only surface at runtime.
- **Fix approach:** Replace `any` with Prisma-generated types (`Prisma.FileCreateInput`, etc.) or explicit interfaces. Priority: `models/files.ts` (used in file upload/delete flows).

### 5.2 ESLint Disabled for Builds

- **Issue:** `next.config.ts` line 6: `ignoreDuringBuilds: true` with a TODO comment
- **Files:** `next.config.ts`
- **Impact:** Lint errors in production code go unnoticed. Combined with pervasive `any` types, this means type and style issues accumulate silently.
- **Fix approach:** Re-enable ESLint. Fix existing lint errors first (likely many due to `any` usage).

### 5.3 Image Optimization Disabled

- **Issue:** `next.config.ts` line 9: `unoptimized: true` with a FIXME comment about "images always empty" on production
- **Files:** `next.config.ts`
- **Impact:** All images served at full size with no Next.js optimization. Performance degradation for image-heavy pages (file previews, invoice logos).
- **Fix approach:** Investigate the root cause (likely a misconfigured `domains` or `remotePatterns` setting, or a self-hosted deployment without the image optimization service).

### 5.4 PDF Conversion Ignores Page Limit

- **Issue:** `lib/previews/pdf.ts` line 44: `convert.bulk(-1, ...)` with a TODO to respect `MAX_PAGES`
- **Files:** `lib/previews/pdf.ts`
- **Impact:** Large PDFs (100+ pages) will cause excessive memory usage and disk consumption during preview generation. The `MAX_PAGES_TO_ANALYZE` constant in `ai/attachments.ts` (line 6) only limits what gets sent to the LLM, not what gets converted.
- **Fix approach:** Replace `bulk(-1, ...)` with `bulk(config.upload.pdfs.maxPages, ...)`.

### 5.5 File Deletion Path Bug

- **Issue:** `models/files.ts` line 77: `await unlink(path.resolve(path.normalize(file.path)))` uses `file.path` directly (a relative path like `unsorted/abc.pdf`), not the full path with user uploads directory
- **Files:** `models/files.ts` (line 70-85)
- **Impact:** File deletion silently fails (error is caught and logged) because `path.resolve` on a relative path resolves against the process CWD, not the user's upload directory. Orphaned files accumulate on disk.
- **Fix approach:** Change to use `fullPathForFile(user, file)` from `lib/files.ts`, which requires passing the `User` object to `deleteFile`. The function signature needs to change.

### 5.6 Server Action Body Size Limit

- **Issue:** `next.config.ts` line 13: `bodySizeLimit: "256mb"` for server actions
- **Files:** `next.config.ts`
- **Impact:** Allows extremely large payloads through server actions. Combined with the `splitFileIntoItemsAction` which reads file content into memory and copies it N times (one per item), this can cause memory exhaustion.
- **Fix approach:** Reduce to a reasonable limit (e.g., 50mb) and stream large file operations.

---

## 6. Security Considerations

### 6.1 Backup Import Missing User Scoping

- **Issue:** `models/export_and_import.ts` lines 136-143 (`importProject`) and 149-163 (`importCategory`) search for projects/categories using `prisma.project.findFirst` without filtering by `userId`
- **Files:** `models/export_and_import.ts`
- **Impact:** In multi-user (cloud) mode, importing a CSV could match another user's project or category by code/name, leaking cross-user data
- **Fix approach:** Add `userId` to the `where` clause in both `importProject` and `importCategory`

### 6.2 Stripe Checkout Missing User Association

- **Issue:** `app/api/stripe/checkout/route.ts` creates a Stripe checkout session without associating it with the authenticated user. No `customer` param is passed, and no `getCurrentUser()` call validates the request
- **Files:** `app/api/stripe/checkout/route.ts`
- **Impact:** Anyone can create checkout sessions. The webhook handler (`webhook/route.ts` lines 86-95) creates a new user from the Stripe customer email if one doesn't exist, which could lead to orphaned accounts
- **Fix approach:** Add auth check and pass `customer` ID to `checkout.sessions.create`

### 6.3 Bulk Delete Missing Return Type

- **Issue:** `bulkDeleteTransactionsAction` in `app/(app)/transactions/actions.ts` (line 205) does not cascade delete associated files from disk
- **Files:** `app/(app)/transactions/actions.ts`, `models/transactions.ts` (line 186-190)
- **Impact:** Bulk delete uses `prisma.transaction.deleteMany` which bypasses the per-transaction file cleanup in `deleteTransaction`. Files remain on disk as orphans.
- **Fix approach:** Iterate and use `deleteTransaction` per item, or add a separate file cleanup step.

---

## 7. Performance Bottlenecks

### 7.1 Stats Load All Transactions Into Memory

- **Issue:** `models/stats.ts` functions (`getDashboardStats`, `getProjectStats`, `getTimeSeriesStats`, `getDetailedTimeSeriesStats`) fetch ALL transactions matching the filter into memory, then compute aggregations in JavaScript
- **Files:** `models/stats.ts` (all functions)
- **Impact:** For users with 10,000+ transactions, dashboard load becomes slow. No database-level aggregation (GROUP BY, SUM) is used.
- **Fix approach:** Use Prisma `groupBy` or raw SQL aggregation queries. This is the highest-priority performance fix.

### 7.2 Export Processes All Files Sequentially

- **Issue:** `app/(app)/export/transactions/route.ts` processes files one-by-one in nested loops (line 116-160), reading each file from disk individually
- **Files:** `app/(app)/export/transactions/route.ts`
- **Impact:** Large exports with attachments can take minutes and risk serverless function timeouts
- **Fix approach:** Parallelize file reads with `Promise.all` in batches. Consider streaming ZIP generation.

### 7.3 Default Creation Runs N Sequential Upserts

- **Issue:** `models/defaults.ts` `createUserDefaults` (lines 449-501) runs individual upserts in for-loops: ~20 categories + ~150 currencies + ~15 fields + ~6 settings = ~190 sequential database calls
- **Files:** `models/defaults.ts`
- **Impact:** New user creation is slow (~5-10 seconds). Each upsert is a separate round-trip.
- **Fix approach:** Use `prisma.$transaction` with `createMany` or batch upserts.

---

## 8. Fragile Areas

### 8.1 Transaction Extra Fields Handling

- **Files:** `models/transactions.ts` (lines 192-220), `models/fields.ts`, `lib/stats.ts` (lines 45-61)
- **Why fragile:** The `splitTransactionDataExtraFields` function dynamically partitions data between standard Transaction columns and the `extra` JSON based on the current field definitions. If a field's `isExtra` flag changes after data is already stored, existing transactions will have values in the wrong location (column vs. JSON).
- **Safe modification:** Never change `isExtra` on existing fields. Add new fields as extra, or create a migration that moves data between columns and JSON.
- **Test coverage:** Zero tests exist in the entire codebase.

### 8.2 File Path Resolution

- **Files:** `lib/files.ts`, `models/files.ts` (line 77), `app/(app)/unsorted/actions.ts`
- **Why fragile:** File paths are stored as relative strings in the database. The resolution logic (`fullPathForFile`, `getUserUploadsDirectory`, `safePathJoin`) builds absolute paths at runtime. The `deleteFile` function in `models/files.ts` does NOT use this resolution (see bug in 5.5). Any change to the upload directory structure can break existing file references.
- **Safe modification:** Always use `fullPathForFile(user, file)` to resolve paths. Never construct paths manually.

---

## 9. Test Coverage Gaps

### 9.1 No Tests Exist

- **What's not tested:** The entire codebase. Zero test files, no test framework configured, no test runner in `package.json` scripts, no `jest.config.*` or `vitest.config.*` files.
- **Files:** All of them.
- **Risk:** Every code change is a potential regression. The complex export/import pipeline, backup/restore, and file management are especially risky to modify without tests.
- **Priority:** HIGH. Before any significant refactoring (especially for Thai tax features), add tests for:
  1. `models/transactions.ts` -- CRUD + extra field splitting
  2. `models/export_and_import.ts` -- field transformations
  3. `ai/prompt.ts` -- template variable substitution
  4. `lib/stats.ts` -- aggregation calculations
  5. `lib/files.ts` -- path resolution and safety

---

## 10. Forking Pain Points

### 10.1 Hardcoded App Identity

- **Files:** `lib/config.ts` (lines 28-34), `lib/auth.ts` (line 45), `middleware.ts` (line 10)
- **Issue:** App name "TaxHacker", cookie prefix "taxhacker", support email "me@vas3k.com" are spread across config. The `config.ts` centralizes most values but some are in auth config.
- **Fix approach:** All identity values flow from `lib/config.ts`. Change `config.app.title`, `config.app.supportEmail`, and the auth `cookiePrefix` in one place.

### 10.2 Stripe Price IDs

- **Files:** `lib/stripe.ts` (line 50)
- **Issue:** `stripePriceId: "price_1RHTj1As8DS4NhOzhejpTN3I"` is hardcoded for the original author's Stripe account
- **Fix approach:** Move to environment variables or remove the cloud subscription system entirely for the fork.

### 10.3 EUR-Centric Defaults

- **Files:** `models/defaults.ts` (line 28, 109)
- **Issue:** Default currency is EUR. Default categories are Western business-focused (no Thai categories like "withholding tax", "social security contribution", "provident fund").
- **Fix approach:** Replace `DEFAULT_SETTINGS`, `DEFAULT_CATEGORIES`, and potentially `DEFAULT_PROJECTS` with Thai equivalents. This is data-only, no code changes.

### 10.4 Self-Hosted vs Cloud Mode Split

- **Files:** `lib/auth.ts`, `lib/config.ts`, `models/users.ts`, `middleware.ts`
- **Issue:** The codebase maintains two operational modes -- self-hosted (single user, no auth, no payments) and cloud (multi-user, auth, Stripe). This split touches auth, middleware, user creation, and subscription checks. For a fork focused on self-hosted Thai tax use, the cloud code is dead weight.
- **Fix approach:** For a pure self-hosted fork, remove cloud-mode branches. For a multi-tenant Thai SaaS, keep the structure but update payment and auth flows.

### 10.5 Tightly Coupled Server Actions

- **Files:** `app/(app)/unsorted/actions.ts` (220 lines), `app/(app)/transactions/actions.ts` (228 lines), `app/(app)/settings/actions.ts` (290 lines)
- **Issue:** Server actions combine auth checking, validation, business logic, file I/O, and cache revalidation in single functions. There is no service layer between the action handlers and the database models.
- **Impact:** Adding Thai tax business logic (VAT calculation, WHT deduction, filing period validation) will bloat these already-large action files.
- **Fix approach:** Extract a service layer (e.g., `services/tax.ts`, `services/transaction.ts`) that encapsulates business logic. Keep server actions thin (validate input, call service, revalidate).

---

*Concerns audit: 2026-03-23*
