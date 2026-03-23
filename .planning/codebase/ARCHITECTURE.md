# Architecture

**Analysis Date:** 2026-03-23

## Pattern Overview

**Overall:** Next.js 15 App Router with Server-First Architecture

**Key Characteristics:**
- Server Components as the default rendering strategy; pages fetch data directly via model functions
- Server Actions (`"use server"`) handle all mutations (form submissions, file uploads, CRUD)
- Prisma ORM as the sole data access layer, wrapped in a `models/` directory
- Dual deployment mode: cloud (multi-tenant with better-auth + Stripe billing) and self-hosted (single-user, no auth)
- Local filesystem storage for uploaded files (not cloud object storage)
- AI document analysis pipeline using LangChain with multi-provider fallback (OpenAI, Google, Mistral)

## Layers

**Presentation (app/ + components/):**
- Purpose: Route definitions, page rendering, client interactivity
- Location: `app/` for routes and server actions, `components/` for reusable UI
- Contains: Server Components (pages), Client Components (forms, interactive elements), route handlers
- Depends on: `models/`, `lib/`, `forms/`, `hooks/`
- Used by: End users via browser

**Actions (app/**/actions.ts):**
- Purpose: Server-side mutation handlers invoked by client forms and components
- Location: `app/(app)/unsorted/actions.ts`, `app/(app)/transactions/actions.ts`, `app/(app)/files/actions.ts`, `app/(app)/settings/actions.ts`, `app/(app)/settings/backups/actions.ts`, `app/(app)/settings/danger/actions.ts`, `app/(app)/apps/invoices/actions.ts`, `app/(auth)/actions.ts`, `app/landing/actions.ts`
- Contains: `"use server"` functions that validate input via Zod schemas, call model functions, handle file I/O, and call `revalidatePath()` to refresh data
- Depends on: `models/`, `forms/`, `lib/auth`, `lib/files`, `ai/`
- Used by: Client components via `useActionState` or direct invocation

**Models (models/):**
- Purpose: Data access layer wrapping Prisma queries
- Location: `models/`
- Contains: CRUD functions, query builders, and business logic per entity
- Depends on: `lib/db` (Prisma client), `lib/utils`
- Used by: Server actions and Server Component pages
- Key files: `models/transactions.ts`, `models/files.ts`, `models/users.ts`, `models/settings.ts`, `models/categories.ts`, `models/projects.ts`, `models/fields.ts`, `models/currencies.ts`, `models/stats.ts`, `models/defaults.ts`, `models/backups.ts`, `models/export_and_import.ts`, `models/progress.ts`, `models/apps.ts`

**AI Pipeline (ai/):**
- Purpose: Document analysis via LLM providers
- Location: `ai/`
- Contains: LLM request orchestration, prompt building, schema generation, file-to-attachment conversion
- Depends on: `models/settings`, `models/files`, `lib/files`, LangChain SDKs
- Used by: `app/(app)/unsorted/actions.ts` (analyzeFileAction)

**Forms / Validation (forms/):**
- Purpose: Zod schemas for input validation
- Location: `forms/`
- Contains: Schema definitions shared between client-side form validation and server-side action validation
- Depends on: `zod`, `lib/utils`
- Used by: Server actions, some client components
- Key files: `forms/transactions.ts`, `forms/settings.ts`, `forms/users.ts`

**Lib (lib/):**
- Purpose: Infrastructure, configuration, and shared utilities
- Location: `lib/`
- Contains: Auth setup, DB client, file path helpers, config, Stripe client, uploads, cache, email
- Depends on: External SDKs (better-auth, Prisma, Stripe, sharp, Resend)
- Used by: All other layers

**Hooks (hooks/):**
- Purpose: Client-side React hooks for shared stateful logic
- Location: `hooks/`
- Contains: Progress tracking (SSE), transaction filter URL sync, download helper, mobile detection, persistent form state
- Depends on: React, Next.js router
- Used by: Client components

## Data Flow

**Upload and Analyze Invoice (Primary Flow):**

1. User drops/selects file(s) in the browser
2. `components/files/screen-drop-area.tsx` or `components/files/upload-button.tsx` captures the file
3. Client calls `uploadFilesAction()` in `app/(app)/files/actions.ts`
4. Action writes file to `uploads/{userEmail}/unsorted/{uuid}.{ext}` via `lib/files.ts` helpers
5. Action creates `File` record in database via `models/files.ts` -> `createFile()`
6. User is redirected to `/unsorted` page
7. `app/(app)/unsorted/page.tsx` (Server Component) loads unsorted files and renders `AnalyzeForm` per file
8. User clicks "Analyze" which calls `analyzeFileAction()` in `app/(app)/unsorted/actions.ts`
9. Action loads file from disk, generates preview images via `lib/previews/generate.ts` (PDF -> images via `pdf2pic`, images -> resized via `sharp`)
10. Action builds LLM prompt from user's custom prompt template + fields + categories + projects via `ai/prompt.ts`
11. Action builds JSON schema from user's fields via `ai/schema.ts`
12. Action calls `analyzeTransaction()` in `ai/analyze.ts` which delegates to `ai/providers/llmProvider.ts`
13. LLM provider iterates through configured providers (OpenAI/Google/Mistral) via LangChain's `withStructuredOutput()`, uses first successful response
14. Parsed result is cached on the `File` record (`cachedParseResult` column)
15. User reviews/edits the AI-extracted data in the form
16. User clicks "Save" which calls `saveFileAsTransactionAction()` in `app/(app)/unsorted/actions.ts`
17. Action validates form via `transactionFormSchema`, creates `Transaction` record, moves file from `unsorted/` to `{YYYY}/{MM}/` directory, updates `File` record as reviewed

**Transaction CRUD:**

1. Pages fetch data directly: `app/(app)/transactions/page.tsx` calls `getTransactions()` from `models/transactions.ts`
2. Mutations go through Server Actions in `app/(app)/transactions/actions.ts`
3. Actions validate via `transactionFormSchema` from `forms/transactions.ts`
4. Actions call model functions (`createTransaction`, `updateTransaction`, `deleteTransaction`)
5. Model functions split data into standard fields and extra fields via `splitTransactionDataExtraFields()`
6. Extra fields (user-defined via `Field` model with `isExtra: true`) are stored in the `extra` JSON column
7. Actions call `revalidatePath()` to trigger page re-render

**Settings Updates:**

1. Settings pages in `app/(app)/settings/` are Server Components that load data via model functions
2. Client form components in `components/settings/` handle form state and submission
3. Settings mutations go through `app/(app)/settings/actions.ts`
4. Settings are stored as key-value pairs in the `Setting` model (per-user)
5. LLM API keys, model names, prompt templates, default values are all stored as settings

**State Management:**
- No client-side global state store (no Redux, Zustand, etc.)
- Server Components re-fetch data on every request (all pages use `export const dynamic = "force-dynamic"`)
- React `cache()` deduplicates identical model queries within a single request
- Client-side state is local: React `useState` in form components
- URL-driven state for transaction filters via `hooks/use-transaction-filters.tsx` (syncs filter state to URL search params)
- `NotificationContext` in `app/(app)/context.tsx` provides a simple toast/banner notification system
- SSE-based progress tracking for long operations (export) via `hooks/use-progress.tsx` + `app/api/progress/[progressId]/route.ts`

## Key Abstractions

**ActionState<T>:**
- Purpose: Standard return type for all Server Actions
- Defined in: `lib/actions.ts`
- Pattern: `{ success: boolean; error?: string | null; data?: T | null }`
- Used by: Every action file; client components check `success` to show notifications or errors

**TransactionData:**
- Purpose: Represents transaction input data (from forms, AI analysis, CSV import)
- Defined in: `models/transactions.ts`
- Pattern: Flexible record with known fields + `[key: string]: unknown` for extra fields
- The model layer splits this into standard DB columns and the `extra` JSON column via `splitTransactionDataExtraFields()`

**Field System (Dynamic Schema):**
- Purpose: User-configurable transaction fields that drive both the AI prompt and the UI
- Defined in: `prisma/schema.prisma` (Field model), `models/fields.ts`, `models/defaults.ts`
- Pattern: Each Field has `code`, `name`, `type`, `llm_prompt`, visibility flags, and `isExtra` flag
- Fields with `isExtra: true` are stored in the Transaction's `extra` JSON column
- Fields with `llm_prompt` set are included in the AI analysis prompt and JSON schema
- Fields with `isVisibleInList: true` appear in the transaction list table
- Default fields are seeded via `models/defaults.ts` -> `createUserDefaults()`

**LLM Provider Fallback Chain:**
- Purpose: Try multiple AI providers in priority order until one succeeds
- Defined in: `ai/providers/llmProvider.ts`
- Pattern: User configures priority order in settings (`llm_providers` setting). `requestLLM()` iterates through providers, skipping those without API keys, returning first successful response

**File Path System:**
- Purpose: Organize uploaded files on disk per user
- Defined in: `lib/files.ts`
- Pattern: `uploads/{userEmail}/unsorted/{uuid}.{ext}` for new uploads; `uploads/{userEmail}/{YYYY}/{MM}/{uuid}.{ext}` for reviewed files; `uploads/{userEmail}/previews/{uuid}.{page}.webp` for preview images; `uploads/{userEmail}/static/` for avatar and business logo
- Security: `safePathJoin()` prevents path traversal attacks

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Every page request
- Responsibilities: HTML shell, global CSS, metadata, Open Graph tags

**App Layout (`(app)` route group):**
- Location: `app/(app)/layout.tsx`
- Triggers: All authenticated app pages
- Responsibilities: Load current user via `getCurrentUser()`, render sidebar, notifications, subscription check, file drop area

**Auth Layout (`(auth)` route group):**
- Location: `app/(auth)/layout.tsx`
- Triggers: Login, self-hosted setup, cloud payment pages
- Responsibilities: Minimal dark-themed layout without sidebar

**Middleware:**
- Location: `middleware.ts`
- Triggers: Requests to `/transactions/*`, `/settings/*`, `/export/*`, `/import/*`, `/unsorted/*`, `/files/*`, `/dashboard/*`
- Responsibilities: In cloud mode, check for `taxhacker` session cookie and redirect to login if missing. In self-hosted mode, pass through all requests.

**Auth API Catch-all:**
- Location: `app/api/auth/[...all]/route.ts`
- Triggers: All `/api/auth/*` requests
- Responsibilities: Delegates to better-auth handler for session management, email OTP flow

**Self-Hosted Redirect:**
- Location: `app/(auth)/self-hosted/redirect/route.ts`
- Triggers: GET to `/self-hosted/redirect`
- Responsibilities: Ensure self-hosted user exists and has defaults, redirect to dashboard

## Auth Flow

**Cloud Mode (SELF_HOSTED_MODE=false):**
1. User visits any protected route
2. `middleware.ts` checks for `taxhacker` session cookie via `better-auth/cookies` -> `getSessionCookie()`
3. If no cookie, redirect to `/enter` (login page)
4. Login page renders `LoginForm` component which uses `better-auth` email OTP plugin
5. User enters email, receives OTP via Resend email (`lib/email.ts`), enters code
6. `better-auth` creates session, sets cookie
7. On first login, `getOrCreateCloudUser()` in `models/users.ts` creates user + defaults via `createUserDefaults()`
8. Pages call `getCurrentUser()` from `lib/auth.ts` which calls `auth.api.getSession()` -> `getUserById()`

**Self-Hosted Mode (SELF_HOSTED_MODE=true):**
1. Middleware passes all requests through (no auth check)
2. User visits any page, `getCurrentUser()` calls `getSelfHostedUser()` which looks for `taxhacker@localhost` user
3. If no user exists, redirect to `/self-hosted` setup page
4. Setup page collects LLM API key and default currency, calls `selfHostedGetStartedAction()` which creates user + defaults
5. After setup, `/self-hosted/redirect` route ensures defaults exist and redirects to `/dashboard`

## API Routes

**Auth:** `app/api/auth/[...all]/route.ts` - better-auth catch-all handler (GET + POST)

**Stripe:**
- `app/api/stripe/checkout/route.ts` - Create Stripe checkout session
- `app/api/stripe/portal/route.ts` - Create Stripe billing portal session
- `app/api/stripe/webhook/route.ts` - Handle Stripe webhook events (checkout.session.completed, subscription CRUD)

**Currency:** `app/api/currency/route.ts` - Proxy currency conversion rates from xe.com with in-memory cache (`PoorManCache`)

**Progress:** `app/api/progress/[progressId]/route.ts` - SSE endpoint for long-running operation progress (used by export)

**File Serving (under `(app)` route group, requires auth):**
- `app/(app)/files/preview/[fileId]/route.ts` - Serve file preview images (generates previews on-the-fly)
- `app/(app)/files/download/[fileId]/route.ts` - Serve original file for download
- `app/(app)/files/static/[filename]/route.ts` - Serve static user assets (avatars, logos)

**Export:** `app/(app)/export/transactions/route.ts` - Export transactions as CSV or ZIP (with attachments), supports progress tracking via SSE

**Backup:** `app/(app)/settings/backups/data/route.ts` - Download/restore full database backup as JSON

## Error Handling

**Strategy:** Action-level try/catch with standardized `ActionState<T>` return type

**Patterns:**
- Server Actions wrap all logic in try/catch, return `{ success: false, error: "message" }` on failure
- Client components check `result.success` and display error via toast (`sonner`) or inline
- API routes return appropriate HTTP status codes (400, 401, 404, 500)
- Sentry integration for error tracking (conditional, only when `NEXT_PUBLIC_SENTRY_DSN` is set)
- `lib/config.ts` validates all environment variables at startup via Zod schema with defaults

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.error` throughout. Sentry for production error tracking via `@sentry/nextjs` (configured in `instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)

**Validation:** Zod schemas in `forms/` directory. Server actions validate all input via `.safeParse()` before processing. Environment variables validated at config load time in `lib/config.ts`.

**Authentication:** `getCurrentUser()` from `lib/auth.ts` is called at the top of every Server Component page and every Server Action. In cloud mode, backed by better-auth JWT sessions with cookie caching. In self-hosted mode, returns the single `taxhacker@localhost` user.

**Authorization:** All model queries include `userId` in WHERE clauses, ensuring users can only access their own data. File serving routes verify `file.userId === user.id`.

**Caching:**
- React `cache()` wraps model query functions for per-request deduplication
- `PoorManCache` class in `lib/cache.ts` provides in-memory TTL cache (used for currency rates, 24h TTL)
- All pages use `export const dynamic = "force-dynamic"` (no static generation)

**File Processing:**
- Images: resized via `sharp` to max 1800x1800, quality 90
- PDFs: converted to images via `pdf2pic` (max 10 pages, 150 DPI, max 1500x1500)
- Previews stored in `uploads/{userEmail}/previews/` as WebP
- For AI analysis, max 4 pages are sent as base64-encoded image attachments

---

*Architecture analysis: 2026-03-23*
