# Code Quality Analysis

**Analysis Date:** 2026-03-23

## 1. TypeScript Strictness

**Config:** `tsconfig.json`
**Rating:** Good

- `strict: true` is enabled -- this activates `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and all other strict checks
- `target: "ES2017"`, `module: "esnext"`, `moduleResolution: "bundler"`
- `isolatedModules: true` for compatibility with bundlers
- `skipLibCheck: true` -- acceptable for build speed, skips checking `node_modules` declarations
- Path alias `@/*` configured and used consistently throughout

**Missing strict settings that could be added:**
- `noUncheckedIndexedAccess` -- would catch unsafe array/object indexing (e.g., `fieldMap[key]` without null check)
- `exactOptionalPropertyTypes` -- would enforce stricter optional property handling

## 2. Linting Setup

**Config:** `eslint.config.mjs`
**Rating:** Minimal / Disabled

- ESLint 9 with flat config format
- Extends only `next/core-web-vitals` and `next/typescript` -- no custom rules
- **CRITICAL:** Linting is completely disabled during builds:
  ```typescript
  // next.config.ts line 6
  eslint: { ignoreDuringBuilds: true }  // TODO: make me linting again
  ```
- The only lint command is `npm run lint` which runs `next lint`, but nothing enforces this
- No pre-commit hooks (no husky, lint-staged)
- No CI pipeline to run lint checks

**Impact:** Code quality rules are not enforced at any point in the development or deployment process.

## 3. Code Formatting

**Config:** `.prettierrc`
**Rating:** Configured but unenforced

Settings:
- `printWidth: 120` (wider than typical 80)
- `semi: false` (no semicolons)
- `singleQuote: false` (double quotes)
- `trailingComma: "es5"`
- `tabWidth: 2`, `useTabs: false`

**Issues:**
- No `format` or `format:check` script in `package.json`
- No Prettier ESLint integration
- No pre-commit hook to format files
- Formatting is only applied if developers manually run Prettier

## 4. Test Coverage

**Rating:** None (0%)

- Zero test files in the entire codebase
- No test runner or test dependencies installed
- No test scripts defined
- No CI/CD pipeline

**See `TESTING.md` for full analysis and recommended test setup.**

## 5. Error Handling Patterns

**Rating:** Inconsistent

**Good patterns observed:**
- All server actions use try/catch and return `ActionState<T>` consistently
- Zod `.safeParse()` used instead of `.parse()` (graceful validation)
- `getCurrentUser()` provides auth redirect at the action boundary
- Stripe webhook verifies signature before processing

**Problems identified:**

### 5a. Error message leakage
Some actions concatenate raw error objects into user-facing messages:
- `app/(app)/unsorted/actions.ts:59` -- `"Failed to retrieve files: " + error`
- `app/(app)/unsorted/actions.ts:127` -- `"Failed to save transaction: ${error}"`
- `app/(app)/settings/actions.ts:140` -- `"Failed to delete project" + error` (also missing space)
- `app/(app)/transactions/actions.ts:201` -- `"File upload failed: ${error}"`
- `app/api/stripe/checkout/route.ts:48` -- `"Failed to create checkout session: ${error}"`

These can expose stack traces, database errors, or internal paths to users.

### 5b. Missing try/catch in some actions
- `app/(app)/settings/actions.ts:25` (`saveSettingsAction`) -- no try/catch wrapper
- `app/(app)/settings/actions.ts:47` (`saveProfileAction`) -- partial try/catch (only around file uploads)
- `app/(app)/settings/actions.ts:101` (`addProjectAction`) -- no try/catch
- `app/(app)/settings/actions.ts:119` (`editProjectAction`) -- no try/catch
- Multiple settings CRUD actions (`addCurrencyAction`, `editCurrencyAction`, `addFieldAction`, `editFieldAction`) lack try/catch

### 5c. Swallowed errors in backups
`models/backups.ts:277-279` -- errors during individual record import are logged but `insertedCount` is still incremented, giving incorrect restoration counts.

## 6. Type Safety

**Rating:** Mixed -- good in core, weak in periphery

**Good type usage:**
- Prisma generated types are imported from `@/prisma/client` and used for model return types
- `ActionState<T>` generic ensures consistent action return types
- Zod schemas provide runtime type validation at boundaries
- `TransactionData` type is well-defined in `models/transactions.ts`

**`any` type usage (problematic areas):**

| File | Count | Severity |
|------|-------|----------|
| `models/backups.ts` | 22 | High -- `BackupSetting` type uses `any` for `model`, `backup`, `restore` |
| `ai/providers/llmProvider.ts` | 4 | Medium -- `model: any`, `message_content: any`, `attachments?: any[]`, `catch (error: any)` |
| `models/files.ts` | 2 | Medium -- `createFile(userId, data: any)` and `updateFile(id, userId, data: any)` |
| `models/export_and_import.ts` | 4 | Medium -- export/import functions typed as `(userId, value: any) => Promise<any>` |
| `hooks/use-progress.tsx` | 1 | Low -- `data: any` in Progress interface |
| `models/apps.ts` | 1 | Low -- `setAppData(user, app, data: any)` |
| `components/transactions/edit.tsx` | 1 | Low -- `Record<string, any>` in reduce |

**Total: ~35 `any` usages across the codebase.**

Most impactful fix: Type `BackupSetting` properly using Prisma model types, and type the `createFile`/`updateFile` data parameters using `Prisma.FileCreateInput`/`Prisma.FileUpdateInput`.

**Index signature on TransactionData:**
```typescript
// models/transactions.ts line 24
[key: string]: unknown
```
This allows arbitrary keys on `TransactionData`, which weakens type checking for the entire transaction flow.

## 7. Code Organization Quality

**Rating:** Good -- well-structured with clear separation

**File sizes (all within acceptable range):**
- Largest source file: `components/ui/sidebar.tsx` at 640 lines (UI component library code)
- Largest app file: `app/landing/landing.tsx` at 594 lines (landing page, acceptable)
- Largest component: `app/(app)/apps/invoices/components/invoice-page.tsx` at 564 lines
- Most files are under 300 lines
- Total codebase: ~17,920 lines of TypeScript

**Separation of concerns:**
- Clear layering: `app/` (routes/pages) -> `components/` (UI) -> `models/` (data) -> `lib/` (utilities)
- Server actions are co-located with their routes in `actions.ts` files
- Form schemas separated into `forms/` directory
- AI logic isolated in `ai/` directory
- Prisma schema and migrations in `prisma/`

**Issues:**
- `models/defaults.ts` at 507 lines contains all default data (categories, currencies, fields, settings) -- could be split
- `models/backups.ts` at 327 lines mixes type definitions, backup config, and import/export logic
- Some duplication in file upload logic across `app/(app)/transactions/actions.ts`, `app/(app)/files/actions.ts`, and `app/(app)/apps/invoices/actions.ts`

## 8. Security Patterns

**Rating:** Mixed -- some good patterns, some gaps

**Good security patterns:**
- `safePathJoin()` in `lib/files.ts` prevents path traversal attacks
- Auth check via `getCurrentUser()` at the start of every server action
- Middleware protects all app routes (checks session cookie)
- Stripe webhook signature verification in `app/api/stripe/webhook/route.ts`
- Zod validation at all form boundaries
- `onDelete: Cascade` on all user relations in Prisma schema
- User scoping: all queries include `userId` in `where` clause
- OTP authentication with 6-digit codes and 10-minute expiry

**Security gaps:**

### 8a. IDOR risk in settings actions
Several settings actions accept `userId` as a parameter instead of deriving it from the session:
- `app/(app)/settings/actions.ts:101` -- `addProjectAction(userId: string, data)`
- `app/(app)/settings/actions.ts:119` -- `editProjectAction(userId: string, code, data)`
- `app/(app)/settings/actions.ts:136` -- `deleteProjectAction(userId: string, code)`
- Same pattern for `addCurrencyAction`, `editCurrencyAction`, `deleteCurrencyAction`
- Same pattern for `addCategoryAction`, `editCategoryAction`, `deleteCategoryAction`
- Same pattern for `addFieldAction`, `editFieldAction`, `deleteFieldAction`

**Impact:** If any of these are called from client-side code with a manipulated `userId`, it could modify another user's data.

### 8b. IDOR risk in danger actions
- `app/(app)/settings/danger/actions.ts:8` -- `resetLLMSettings(user: User)` accepts a full User object
- `app/(app)/settings/danger/actions.ts:22` -- `resetFieldsAndCategories(user: User)` accepts a full User object
- `app/(app)/apps/invoices/actions.ts:31` -- `addNewTemplateAction(user: User, template)` accepts a User object

These should call `getCurrentUser()` internally instead of trusting the caller.

### 8c. No CSRF protection
The checkout API at `app/api/stripe/checkout/route.ts` creates Stripe checkout sessions based on query parameters without verifying the request origin or requiring authentication. The `POST` handler does not check `getCurrentUser()`.

### 8d. Server action body size limit
```typescript
// next.config.ts
experimental: {
  serverActions: { bodySizeLimit: "256mb" }
}
```
This 256MB limit is extremely large and could be used for denial-of-service attacks.

### 8e. Missing rate limiting
No rate limiting on any endpoint -- API routes, server actions, or auth flows.

### 8f. Debug logging in production
Multiple `console.log` statements output sensitive data:
- `app/api/stripe/webhook/route.ts:29` -- `console.log("Webhook event:", event)` logs full Stripe events
- `ai/analyze.ts:38` -- `console.log("LLM response:", result)` logs AI analysis results
- `app/(app)/files/actions.ts:76` -- `console.log("uploadedFiles", uploadedFiles)` logs uploaded file records

## 9. Performance Patterns

**Rating:** Adequate for current scale

**Caching:**
- `lib/cache.ts` implements `PoorManCache<T>` -- an in-memory TTL cache using `Map`
- React `cache()` wraps all model query functions for request-level deduplication
- No external caching layer (no Redis, no Vercel KV)
- Sentry trace sample rate set to `1` (100%) -- should be reduced in production

**Lazy loading / Code splitting:**
- Next.js App Router provides automatic route-based code splitting
- `"use client"` directive used appropriately on interactive components
- No explicit `React.lazy()` or `next/dynamic` usage found

**Database:**
- Prisma client uses singleton pattern with global cache in development
- Query logging enabled in all environments: `log: ["query", "info", "warn", "error"]` -- should be conditional
- Good indexing on `transactions` table: `userId`, `projectCode`, `categoryCode`, `issuedAt`, `name`, `merchant`, `total`
- Transaction queries use `include: { category: true, project: true }` -- always eager loads relations

**Image handling:**
- `images.unoptimized: true` in `next.config.ts` disables Next.js image optimization (marked as FIXME)
- Sharp is used for server-side image processing (avatars, business logos)

**Export performance:**
- CSV/ZIP export processes transactions in chunks (`TRANSACTIONS_CHUNK_SIZE = 300`, `FILES_CHUNK_SIZE = 50`)
- Progress tracking via SSE for long-running exports
- ZIP compression level 6 (balanced)

**Potential bottleneck:**
- `getDirectorySize()` in `lib/files.ts` recursively reads the filesystem on every file upload to calculate storage usage -- this will become slow as storage grows

## 10. Documentation Quality

**Rating:** Minimal

- No README.md in project root (only in repo root, which is user home)
- No API documentation
- No architecture documentation
- No inline documentation beyond `lib/cache.ts` JSDoc
- 3 TODO/FIXME comments marking known issues:
  - `next.config.ts:6` -- `// TODO: make me linting again`
  - `next.config.ts:9` -- `// FIXME: bug on prod, images always empty, investigate later`
  - `lib/previews/pdf.ts:44` -- `// TODO: respect MAX_PAGES here too`
- Prisma schema has standard Prisma comment at top but no model documentation
- Sentry config files have doc links in comments

## Summary Scorecard

| Category | Rating | Notes |
|----------|--------|-------|
| TypeScript strictness | B+ | strict:true, but missing `noUncheckedIndexedAccess` |
| Linting | F | Configured but disabled in builds, no enforcement |
| Formatting | C | Prettier configured but no automation |
| Test coverage | F | Zero tests, zero test infrastructure |
| Error handling | C+ | Consistent pattern but leaks errors, missing try/catch in places |
| Type safety | C+ | Good core types, ~35 `any` usages especially in backups/AI |
| Code organization | A- | Clean separation, reasonable file sizes |
| Security | C | Auth present but IDOR risks, no CSRF, no rate limiting |
| Performance | B | Good caching patterns, some bottlenecks |
| Documentation | D | Near-zero documentation |

**Overall: C+** -- The codebase has solid architectural foundations but lacks the quality infrastructure (tests, linting enforcement, CI) needed for a production application handling financial data.

---

*Quality analysis: 2026-03-23*
