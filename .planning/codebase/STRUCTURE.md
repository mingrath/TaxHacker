# Codebase Structure

**Analysis Date:** 2026-03-23

## Directory Layout

```
banchee/
├── ai/                        # AI/LLM document analysis pipeline
│   ├── providers/             # LLM provider implementations (LangChain)
│   │   └── llmProvider.ts     # Unified multi-provider request handler
│   ├── analyze.ts             # Main analysis entry point (Server Action)
│   ├── attachments.ts         # File-to-base64 attachment loader
│   ├── prompt.ts              # Prompt template builder
│   └── schema.ts              # JSON schema generator from Field definitions
├── app/                       # Next.js App Router
│   ├── (app)/                 # Authenticated app routes (with sidebar layout)
│   │   ├── apps/              # "Apps" feature area (e.g., invoice generation)
│   │   │   └── invoices/      # Invoice generation app
│   │   ├── dashboard/         # Main dashboard page
│   │   ├── export/            # Export routes (CSV/ZIP download)
│   │   │   └── transactions/  # Transaction export route handler
│   │   ├── files/             # File serving routes
│   │   │   ├── download/[fileId]/  # Original file download
│   │   │   ├── preview/[fileId]/   # Preview image serving
│   │   │   └── static/[filename]/  # Static assets (avatars, logos)
│   │   ├── import/            # Data import
│   │   │   └── csv/           # CSV import page
│   │   ├── settings/          # Settings pages
│   │   │   ├── backups/       # Backup/restore (+ data/ route for download)
│   │   │   ├── business/      # Business details
│   │   │   ├── categories/    # Category management
│   │   │   ├── currencies/    # Currency management
│   │   │   ├── danger/        # Danger zone (account deletion)
│   │   │   ├── fields/        # Custom field management
│   │   │   ├── llm/           # LLM provider API key settings
│   │   │   ├── profile/       # User profile settings
│   │   │   └── projects/      # Project management
│   │   ├── transactions/      # Transaction list + detail pages
│   │   │   └── [transactionId]/ # Single transaction edit page
│   │   ├── unsorted/          # Unsorted files (AI analysis queue)
│   │   ├── context.tsx        # NotificationProvider (client context)
│   │   ├── layout.tsx         # App layout (sidebar, auth, drop area)
│   │   └── actions.ts files   # Server Actions per feature area
│   ├── (auth)/                # Auth routes (no sidebar, dark layout)
│   │   ├── cloud/             # Cloud pricing + payment pages
│   │   │   └── payment/success/ # Post-payment success page
│   │   ├── enter/             # Email OTP login page
│   │   ├── self-hosted/       # Self-hosted setup + redirect
│   │   ├── actions.ts         # Self-hosted setup action
│   │   └── layout.tsx         # Auth layout (minimal, dark theme)
│   ├── api/                   # API route handlers
│   │   ├── auth/[...all]/     # better-auth catch-all handler
│   │   ├── currency/          # Currency rate proxy (xe.com scraper)
│   │   ├── progress/[progressId]/ # SSE progress streaming
│   │   └── stripe/            # Stripe checkout, portal, webhook
│   ├── docs/                  # Static doc pages (AI policy, privacy, terms, cookie)
│   ├── landing/               # Landing page + actions
│   ├── globals.css            # Global Tailwind styles
│   ├── layout.tsx             # Root HTML layout
│   └── page.tsx               # Landing/home page
├── components/                # Reusable React components
│   ├── agents/                # "Agent" UI components (currency converter, item detection)
│   ├── auth/                  # Login form, pricing card, subscription expired banner
│   ├── dashboard/             # Dashboard widgets (stats, drop zone, unsorted, welcome)
│   ├── emails/                # Email templates (OTP, newsletter welcome)
│   ├── export/                # Export dialog
│   ├── files/                 # File preview, upload button, screen drop area
│   ├── forms/                 # Shared form components (date picker, selects, text inputs)
│   ├── import/                # CSV import component
│   ├── settings/              # Settings page forms and CRUD components
│   ├── sidebar/               # App sidebar, mobile menu, user widget
│   ├── transactions/          # Transaction list, edit, create, filters, pagination
│   ├── ui/                    # Primitive UI components (shadcn/ui based)
│   └── unsorted/              # Analyze form, analyze-all button
├── forms/                     # Zod validation schemas
│   ├── settings.ts            # Settings, currency, project, category, field schemas
│   ├── transactions.ts        # Transaction form schema
│   └── users.ts               # User profile form schema
├── hooks/                     # Client-side React hooks
│   ├── use-download.tsx       # File download helper
│   ├── use-mobile.tsx         # Mobile detection
│   ├── use-persistent-form-state.tsx # Form state persistence
│   ├── use-progress.tsx       # SSE progress tracking
│   └── use-transaction-filters.tsx   # URL-synced transaction filters
├── lib/                       # Infrastructure and utilities
│   ├── previews/              # File preview generators
│   │   └── generate.ts        # Routes PDF/image to appropriate generator
│   ├── actions.ts             # ActionState<T> type definition
│   ├── auth.ts                # better-auth setup + getCurrentUser()
│   ├── auth-client.ts         # Client-side auth client (email OTP)
│   ├── cache.ts               # PoorManCache (in-memory TTL cache)
│   ├── config.ts              # Centralized config from env vars (Zod validated)
│   ├── db.ts                  # Prisma client singleton
│   ├── email.ts               # Resend email client + OTP email sender
│   ├── files.ts               # File path helpers, storage checks, path traversal protection
│   ├── llm-providers.ts       # LLM provider metadata (names, logos, defaults)
│   ├── stats.ts               # Statistics calculation helpers
│   ├── stripe.ts              # Stripe client + plan definitions
│   ├── uploads.ts             # Image upload + processing (sharp resize)
│   └── utils.ts               # General utilities (slug, color, formatting)
├── models/                    # Data access layer (Prisma wrappers)
│   ├── apps.ts                # AppData CRUD
│   ├── backups.ts             # Backup/restore logic per model
│   ├── categories.ts          # Category CRUD
│   ├── currencies.ts          # Currency CRUD
│   ├── defaults.ts            # Default data seeding (fields, categories, currencies, settings)
│   ├── export_and_import.ts   # Export/import field mapping and transformers
│   ├── fields.ts              # Field CRUD
│   ├── files.ts               # File CRUD + filesystem deletion
│   ├── progress.ts            # Progress record CRUD (for SSE tracking)
│   ├── projects.ts            # Project CRUD
│   ├── settings.ts            # Settings key-value store + LLM settings extraction
│   ├── stats.ts               # Dashboard statistics queries
│   ├── transactions.ts        # Transaction CRUD with filtering/pagination
│   └── users.ts               # User CRUD, self-hosted user management
├── prisma/                    # Database schema and migrations
│   ├── migrations/            # PostgreSQL migration history
│   └── schema.prisma          # Prisma schema (11 models)
├── public/                    # Static assets
│   ├── fonts/Inter/           # Inter font files
│   ├── landing/               # Landing page images
│   └── logo/                  # App logos and provider logos
├── etc/                       # Deployment configs
│   └── nginx/                 # Nginx config for self-hosted
├── docs/                      # Documentation and screenshots
├── .github/workflows/         # CI/CD workflows
├── middleware.ts               # Auth middleware (cookie check for cloud mode)
├── instrumentation.ts          # Sentry initialization
├── next.config.ts              # Next.js config (Sentry, server actions body size)
├── tailwind.config.ts          # Tailwind CSS config
├── Dockerfile                  # Docker build
├── docker-compose.yml          # Docker Compose for development
├── docker-compose.build.yml    # Docker Compose for building
└── docker-compose.production.yml # Docker Compose for production
```

## Directory Purposes

**`ai/`:**
- Purpose: AI-powered document analysis pipeline
- Contains: LLM provider abstraction, prompt templating, JSON schema generation, file attachment loading
- Key files: `ai/providers/llmProvider.ts` (multi-provider fallback), `ai/analyze.ts` (entry point), `ai/prompt.ts` (template builder), `ai/schema.ts` (field-to-JSON-schema), `ai/attachments.ts` (file-to-base64)

**`app/(app)/`:**
- Purpose: All authenticated application pages behind the sidebar layout
- Contains: Page components (Server Components), Server Actions (`actions.ts` files), route handlers for file serving and export
- Key files: `app/(app)/layout.tsx` (sidebar + auth layout), `app/(app)/unsorted/actions.ts` (AI analysis flow), `app/(app)/transactions/actions.ts` (transaction CRUD)

**`app/(auth)/`:**
- Purpose: Authentication and onboarding pages
- Contains: Login, self-hosted setup, cloud pricing/payment
- Key files: `app/(auth)/enter/page.tsx` (login), `app/(auth)/self-hosted/page.tsx` (setup), `app/(auth)/actions.ts` (self-hosted init)

**`app/api/`:**
- Purpose: REST API endpoints for auth, payments, data
- Contains: better-auth handler, Stripe webhooks, currency proxy, progress SSE
- Key files: `app/api/stripe/webhook/route.ts` (subscription management), `app/api/progress/[progressId]/route.ts` (SSE streaming)

**`components/`:**
- Purpose: Reusable React components organized by feature domain
- Contains: Both Server and Client components. Feature-specific components (transactions, settings, dashboard) and primitive UI components (shadcn/ui)
- Key files: `components/unsorted/analyze-form.tsx` (AI analysis UI), `components/transactions/edit.tsx` (transaction editor), `components/files/screen-drop-area.tsx` (drag-and-drop)

**`components/ui/`:**
- Purpose: Primitive UI components based on shadcn/ui (Radix UI primitives + Tailwind)
- Contains: Button, Card, Dialog, Select, Input, Table, etc.
- Note: These are generated/copied from shadcn/ui. Modify sparingly.

**`forms/`:**
- Purpose: Zod validation schemas shared between client validation and server actions
- Contains: Schema definitions for transactions, settings (including categories, projects, fields, currencies), and user profile

**`hooks/`:**
- Purpose: Client-side React hooks for shared stateful patterns
- Contains: Progress tracking, filter URL sync, download helpers, mobile detection

**`lib/`:**
- Purpose: Core infrastructure, configuration, and utility code
- Contains: Auth setup, DB client, file system helpers, config, Stripe client, email, caching
- Key files: `lib/auth.ts` (auth config + getCurrentUser), `lib/config.ts` (env validation), `lib/files.ts` (file path system), `lib/db.ts` (Prisma singleton)

**`models/`:**
- Purpose: Data access layer wrapping all Prisma database queries
- Contains: One file per entity (or concern) with cached query functions and mutation functions
- Pattern: Functions take `userId` as first parameter for tenant isolation. Read functions wrapped in React `cache()` for per-request deduplication.

**`prisma/`:**
- Purpose: Database schema definition and migration history
- Contains: `schema.prisma` with 11 models, migration SQL files
- Models: User, Session, Account, Verification, Setting, Category, Project, Field, File, Transaction, Currency, AppData, Progress

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root HTML layout
- `app/(app)/layout.tsx`: Authenticated app shell (sidebar, notifications)
- `app/(auth)/layout.tsx`: Auth pages layout
- `middleware.ts`: Route protection

**Configuration:**
- `lib/config.ts`: All environment variable parsing and app config
- `next.config.ts`: Next.js configuration
- `tailwind.config.ts`: Tailwind CSS configuration
- `prisma/schema.prisma`: Database schema
- `.env.example`: Environment variable template

**Core Logic:**
- `ai/providers/llmProvider.ts`: LLM multi-provider request handler
- `ai/analyze.ts`: Document analysis orchestrator
- `lib/auth.ts`: Authentication setup and user resolution
- `lib/files.ts`: File path management and storage helpers
- `models/transactions.ts`: Transaction data access with filtering
- `models/defaults.ts`: Default data seeding (fields, categories, currencies, settings, projects)

**Testing:**
- No test files detected in the codebase

## Naming Conventions

**Files:**
- `kebab-case.ts` / `kebab-case.tsx`: All source files use kebab-case
- `page.tsx`: Next.js page components (convention)
- `layout.tsx`: Next.js layout components (convention)
- `route.ts`: Next.js route handlers (convention)
- `actions.ts`: Server Action files (project convention)

**Directories:**
- `kebab-case`: All directories
- `(group-name)`: Next.js route groups with parentheses
- `[paramName]`: Next.js dynamic route segments
- `[...all]`: Next.js catch-all routes

**Components:**
- `PascalCase` for component names (e.g., `TransactionList`, `AnalyzeForm`)
- File names use kebab-case (e.g., `analyze-form.tsx` exports `AnalyzeForm`)

## Where to Add New Code

**New Feature Page:**
- Page: `app/(app)/{feature-name}/page.tsx` (Server Component)
- Actions: `app/(app)/{feature-name}/actions.ts` (Server Actions with `"use server"`)
- Components: `components/{feature-name}/` (one file per component)
- Model: `models/{entity-name}.ts` (data access functions)
- Form schema: `forms/{entity-name}.ts` (Zod schema)

**New API Route:**
- Route handler: `app/api/{endpoint-name}/route.ts`
- Always check auth via `getSession()` from `lib/auth.ts`
- Return `NextResponse.json()` for JSON or `new NextResponse()` for binary

**New Server Action:**
- Add to existing `actions.ts` in the relevant `app/(app)/` directory
- Always start with `"use server"` directive
- Always call `getCurrentUser()` for auth
- Validate input with Zod schema from `forms/`
- Return `ActionState<T>` type
- Call `revalidatePath()` after mutations

**New Model / Entity:**
- Prisma schema: Add model to `prisma/schema.prisma`
- Run `npx prisma migrate dev --name {description}`
- Model file: `models/{entity-name}.ts` with CRUD functions wrapped in `cache()`
- Always include `userId` in WHERE clauses for tenant isolation

**New Client Hook:**
- File: `hooks/use-{hook-name}.tsx`
- Follow existing pattern: export a single function with `use` prefix

**New UI Primitive:**
- File: `components/ui/{component-name}.tsx`
- Follow shadcn/ui conventions (Radix + CVA + Tailwind)
- Use `@/lib/utils` for `cn()` class merging

**New Setting:**
- Add to `DEFAULT_SETTINGS` in `models/defaults.ts`
- Add to `settingsFormSchema` in `forms/settings.ts`
- Settings are stored as key-value pairs; add UI in appropriate `app/(app)/settings/` page

**New LLM Provider:**
- Add provider config to `PROVIDERS` array in `lib/llm-providers.ts`
- Add LangChain integration in `ai/providers/llmProvider.ts`
- Add env vars to `lib/config.ts` schema
- Add API key setting to `forms/settings.ts`

## Special Directories

**`prisma/client/`:**
- Purpose: Auto-generated Prisma client code
- Generated: Yes (by `prisma generate`)
- Committed: Unclear, likely gitignored

**`prisma/migrations/`:**
- Purpose: Database migration SQL files
- Generated: Yes (by `prisma migrate dev`)
- Committed: Yes (tracked in git for deployment)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No

**`uploads/`:**
- Purpose: User-uploaded files (organized by email, then by date)
- Generated: Yes (at runtime)
- Committed: No
- Structure: `uploads/{userEmail}/unsorted/`, `uploads/{userEmail}/{YYYY}/{MM}/`, `uploads/{userEmail}/previews/`, `uploads/{userEmail}/static/`

**`public/`:**
- Purpose: Static assets served at root URL
- Generated: No
- Committed: Yes
- Contains: Fonts, logos, landing page images, favicon, webmanifest

**`etc/nginx/`:**
- Purpose: Nginx reverse proxy configuration for self-hosted deployment
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-23*
