# Technology Stack

**Analysis Date:** 2026-03-23

## Languages

**Primary:**
- TypeScript ^5 - All application code (frontend, backend, AI, models)

**Secondary:**
- SQL (PostgreSQL) - Database migrations in `prisma/migrations/`
- Shell (Bash) - `docker-entrypoint.sh` for container startup

## Runtime

**Environment:**
- Node.js 23 (Docker base image: `node:23-slim`)
- No `.nvmrc` or `.node-version` file pinning local Node version

**Package Manager:**
- npm (lockfileVersion 3)
- Lockfile: `package-lock.json` present

**Module System:**
- ESM (`"type": "module"` in `package.json`)

## Frameworks

**Core:**
- Next.js ^15.2.4 - Full-stack React framework (App Router)
- React ^19.0.0 - UI library
- React DOM ^19.0.0 - DOM rendering

**Dev Server:**
- Turbopack enabled (`next dev -p 7331 --turbopack`)
- Default dev port: 7331

**Testing:**
- No test framework detected (no jest, vitest, or testing-library in dependencies)
- No test scripts in `package.json`

**Build/Dev:**
- TypeScript ^5 - Type checking
- ESLint ^9 with `eslint-config-next` 15.1.7 - Linting (currently disabled during builds via `ignoreDuringBuilds: true`)
- PostCSS ^8 - CSS processing
- Tailwind CSS ^3.4.1 - Utility-first CSS

## Database

**Engine:**
- PostgreSQL 17 (Docker image: `postgres:17-alpine`)
- Connection: `DATABASE_URL` environment variable

**ORM:**
- Prisma ^6.6.0 (`@prisma/client` ^6.6.0)
- Schema: `prisma/schema.prisma`
- Generated client output: `prisma/client/` (custom output directory)
- Migrations: `prisma/migrations/` (10 migrations, first: 2025-04-03, latest: 2025-05-23)
- DB client singleton: `lib/db.ts` (global instance pattern for dev hot-reload)
- UUID primary keys on all models (`@db.Uuid`)
- Column name mapping: camelCase in code, snake_case in DB (`@map()`)

**Models (12 total):**
- `User` - Core user with membership, storage, AI balance, business info
- `Session` - Auth sessions (Better Auth managed)
- `Account` - OAuth/credential accounts (Better Auth managed)
- `Verification` - Email/OTP verification tokens (Better Auth managed)
- `Setting` - User key-value settings (unique per user+code)
- `Category` - Transaction categories with LLM prompts
- `Project` - Transaction projects with LLM prompts
- `Field` - Custom user-defined fields with LLM prompts, types, visibility flags
- `File` - Uploaded file metadata with cached parse results
- `Transaction` - Financial transactions with items (JSON), files (JSON), categories, projects
- `Currency` - User currencies
- `AppData` - Per-user app-specific JSON data (unique per user+app)
- `Progress` - Background task progress tracking

**Startup behavior:**
- `docker-entrypoint.sh` runs `prisma generate` + `prisma migrate deploy` before app start
- `npm start` script: `prisma migrate deploy && next start`

## Authentication

**Provider:**
- Better Auth ^1.2.10 (`better-auth` package)
- Adapter: `prismaAdapter` with PostgreSQL
- Config: `lib/auth.ts`

**Strategy:**
- JWT sessions (180-day expiry, 24h update age, 365-day cookie cache)
- Cookie prefix: `taxhacker`
- ID generation: UUID

**Login Method:**
- Email OTP (6-digit code, 10-minute expiry)
- OTP emails sent via Resend
- Signup can be disabled via `DISABLE_SIGNUP` env var
- Automatically disabled in self-hosted mode

**Self-Hosted Mode:**
- `SELF_HOSTED_MODE=true` bypasses auth entirely
- Uses a hardcoded self-hosted user (from `models/users.ts`)
- Redirects to `/self-hosted/redirect` if no user

**Key Functions:**
- `getSession()` - Get current session (self-hosted aware)
- `getCurrentUser()` - Get current User model or redirect to login
- `isSubscriptionExpired(user)` - Check membership expiry
- `isAiBalanceExhausted(user)` - Check AI credit balance

## AI / LLM Integration

**Framework:**
- LangChain ^0.3.30 - LLM orchestration
- NOT using Vercel AI SDK

**Provider SDKs:**
- `@langchain/openai` ^0.6.1 - OpenAI (default model: `gpt-4o-mini`)
- `@langchain/google-genai` ^0.2.14 - Google Gemini (default model: `gemini-2.5-flash`)
- `@langchain/mistralai` ^0.2.1 - Mistral (default model: `mistral-medium-latest`)

**Architecture:**
- Provider abstraction: `ai/providers/llmProvider.ts`
- Supports 3 providers: `openai`, `google`, `mistral` (type: `LLMProvider`)
- Fallback chain: tries providers in priority order; if one fails, falls next
- Provider priority configured per user via settings (`llm_providers` setting)
- All providers use `temperature: 0` for deterministic output
- Structured output via LangChain `.withStructuredOutput()` (JSON schema)
- Vision support: images sent as base64 `image_url` in HumanMessage content

**Key Files:**
- `ai/analyze.ts` - Server action for transaction analysis
- `ai/providers/llmProvider.ts` - Multi-provider LLM client with fallback
- `ai/prompt.ts` - Dynamic prompt builder (fields, categories, projects templating)
- `ai/schema.ts` - Converts user-defined `Field` models to JSON Schema for structured output
- `ai/attachments.ts` - Loads file attachments as base64 for vision analysis
- `lib/llm-providers.ts` - Provider metadata (labels, defaults, API doc links, logos)
- `models/settings.ts` - Extracts LLM config from user settings

**Flow:**
1. User uploads receipt/invoice file
2. File previews generated (PDF-to-image or image resize)
3. Attachments loaded as base64 (`ai/attachments.ts`, max 4 pages)
4. Dynamic prompt built from user fields/categories/projects
5. JSON schema built from user Field definitions
6. LLM called with structured output (tries providers in priority order)
7. Result cached on File record (`cachedParseResult`)

## UI Components

**Component Library:**
- shadcn/ui (New York style variant)
- Config: `components.json`
- RSC support: enabled (`rsc: true`)
- Base color: zinc
- CSS variables: enabled
- Icon library: Lucide React ^0.475.0

**Installed shadcn/ui Components (26):**
- alert, avatar, badge, breadcrumb, button, calendar, card, checkbox
- collapsible, colored-text, dialog, dropdown-menu, input, label
- pagination, popover, resizable, select, separator, sheet, sidebar
- skeleton, sonner, table, textarea, tooltip

**Radix UI Primitives (direct dependencies):**
- `@radix-ui/react-avatar` ^1.1.3
- `@radix-ui/react-checkbox` ^1.1.4
- `@radix-ui/react-collapsible` ^1.1.3
- `@radix-ui/react-dialog` ^1.1.6
- `@radix-ui/react-dropdown-menu` ^2.1.6
- `@radix-ui/react-label` ^2.1.2
- `@radix-ui/react-popover` ^1.1.6
- `@radix-ui/react-select` ^2.1.6
- `@radix-ui/react-separator` ^1.1.2
- `@radix-ui/react-slot` ^1.2.0
- `@radix-ui/react-tooltip` ^1.1.8
- `@radix-ui/colors` ^3.0.0

**Utility Libraries:**
- `class-variance-authority` ^0.7.1 - Component variant management
- `clsx` ^2.1.1 - Conditional class names
- `tailwind-merge` ^3.0.1 - Tailwind class deduplication

**Path Aliases:**
- `@/components` -> `components/`
- `@/components/ui` -> `components/ui/`
- `@/lib` -> `lib/`
- `@/hooks` -> `hooks/`

## CSS

**Framework:**
- Tailwind CSS ^3.4.1
- Config: `tailwind.config.ts`
- Dark mode: class-based (`darkMode: ["class"]`)
- Theme switching: `next-themes` ^0.4.4

**Plugins:**
- `tailwindcss-animate` ^1.0.7 - Animation utilities

**Design Tokens:**
- HSL CSS variable based color system (shadcn/ui standard)
- Custom semantic colors: background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring
- Chart colors: `chart-1` through `chart-5`
- Sidebar-specific colors: background, foreground, primary, accent, border, ring
- Border radius: CSS variable based (`--radius`)

**Content paths scanned:**
- `./pages/**/*.{js,ts,jsx,tsx,mdx}`
- `./components/**/*.{js,ts,jsx,tsx,mdx}`
- `./app/**/*.{js,ts,jsx,tsx,mdx}`

## Payment

**Provider:**
- Stripe ^18.0.0 (`stripe` package)
- Config: `lib/stripe.ts`
- API version: `2025-03-31.basil`
- Conditionally initialized (null if no `STRIPE_SECRET_KEY`)

**Plans:**
- `unlimited` - Internal/special plan (not purchasable): unlimited storage + AI
- `early` - Early Adopter plan: 512 MB storage, 1000 AI analyses, EUR 35/year
- Price ID: `price_1RHTj1As8DS4NhOzhejpTN3I`

**Stripe Integration:**
- Webhook endpoint: `app/api/stripe/` route
- Customer ID stored on User model (`stripeCustomerId`)
- Membership plan + expiry tracked on User model
- Payment success/cancel redirect URLs configured in `lib/config.ts`

**Env vars:**
- `STRIPE_SECRET_KEY` - API key
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification

## Email

**Provider:**
- Resend ^4.2.0 (`resend` package)
- Config: `lib/email.ts`

**Email Templates (React-rendered):**
- `components/emails/otp-email.tsx` - OTP verification code
- `components/emails/newsletter-welcome-email.tsx` - Newsletter welcome
- `components/emails/email-layout.tsx` - Shared layout

**Functions:**
- `sendOTPCodeEmail({ email, otp })` - Send 6-digit OTP
- `sendNewsletterWelcomeEmail(email)` - Newsletter subscription welcome

**Env vars:**
- `RESEND_API_KEY` - API key
- `RESEND_FROM_EMAIL` - Sender address
- `RESEND_AUDIENCE_ID` - Newsletter audience

## File Handling

**Upload Storage:**
- Local filesystem (no cloud storage)
- Upload path: `UPLOAD_PATH` env var (default: `./uploads`)
- Per-user directories: `{UPLOAD_PATH}/{user.email}/`
- Sub-directories: `unsorted/`, `previews/`, `static/`, `csv/`
- Transaction files organized by date: `{YYYY}/{MM}/{uuid}{ext}`

**Image Processing:**
- `sharp` ^0.33.5 - Image resize, format conversion (webp, png, jpeg, avif)
- `lib/uploads.ts` - Static image upload with resize
- `lib/previews/images.ts` - Image preview generation (resize to webp)
- Max dimensions: 1800x1800 (images), 1500x1500 (PDF pages)
- Quality: 90 (configurable)

**PDF Processing:**
- `pdf2pic` ^3.1.4 - PDF page to image conversion
- `lib/previews/pdf.ts` - Convert PDF pages to webp previews
- System dependencies: Ghostscript + GraphicsMagick (installed in Docker)
- Max pages: 10, DPI: 150
- Caches converted pages in previews directory

**Preview Pipeline (`lib/previews/generate.ts`):**
- PDF -> webp page images (via pdf2pic/Ghostscript)
- Images -> resized webp (via sharp)
- Other files -> passed through as-is

**PDF Generation:**
- `@react-pdf/renderer` ^4.3.0 - Generate PDF documents from React components

**CSV Processing:**
- `@fast-csv/format` ^5.0.2 - CSV writing
- `@fast-csv/parse` ^5.0.2 - CSV parsing

**Archive:**
- `jszip` ^3.10.1 - ZIP file creation

**Storage Tracking:**
- `storageUsed` + `storageLimit` on User model
- `isEnoughStorageToUploadFile()` checks capacity before upload
- Unlimited storage in self-hosted mode or when `storageLimit < 0`

## Observability

**Error Tracking:**
- Sentry ^9.11.0 (`@sentry/nextjs`)
- Server config: `sentry.server.config.ts`
- Edge config: `sentry.edge.config.ts`
- Conditionally enabled (requires `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`)
- Trace sample rate: 100% (1.0)
- Monitoring tunnel route: `/monitoring`

**Logging:**
- `console.log` / `console.error` / `console.info` (no structured logging library)
- Prisma client logging: query, info, warn, error (in `lib/db.ts`)

## Build / Deploy

**Docker:**
- Multi-stage Dockerfile (`node:23-slim` base)
- Build stage: `npm ci` + `next build`
- Production stage: slim image with system deps (Ghostscript, GraphicsMagick, libwebp, postgresql-client, openssl)
- Entrypoint: `docker-entrypoint.sh` (waits for PostgreSQL, runs migrations, starts app)
- Exposed port: 7331

**Docker Compose Files:**
- `docker-compose.yml` - Default self-hosted setup (app + postgres:17-alpine)
- `docker-compose.build.yml` - Local build variant (builds from Dockerfile)
- `docker-compose.production.yml` - Production config (external DB via `.env`, no postgres container, network bridge)

**Container Registry:**
- `ghcr.io/vas3k/taxhacker:latest`

**Volumes:**
- `./data:/app/data` - Upload storage
- `./pgdata:/var/lib/postgresql/data` - PostgreSQL data (self-hosted)

**Next.js Config (`next.config.ts`):**
- ESLint disabled during builds (`ignoreDuringBuilds: true`)
- Image optimization disabled (`unoptimized: true`)
- Server actions body size limit: 256 MB
- Sentry integration conditional on env vars

## Key Dependencies Summary

**Critical (core functionality):**
- `next` ^15.2.4 - Application framework
- `react` / `react-dom` ^19.0.0 - UI rendering
- `@prisma/client` ^6.6.0 - Database ORM
- `better-auth` ^1.2.10 - Authentication
- `langchain` ^0.3.30 - AI orchestration
- `stripe` ^18.0.0 - Payment processing
- `resend` ^4.2.0 - Email delivery

**Infrastructure:**
- `sharp` ^0.33.5 - Image processing
- `pdf2pic` ^3.1.4 - PDF to image conversion
- `@react-pdf/renderer` ^4.3.0 - PDF generation
- `@fast-csv/format` / `@fast-csv/parse` ^5.0.2 - CSV import/export
- `jszip` ^3.10.1 - ZIP archive creation
- `zod` ^3.24.2 - Schema validation (config, forms)

**UI:**
- `@radix-ui/*` - Headless UI primitives (12 packages)
- `lucide-react` ^0.475.0 - Icons
- `sonner` ^2.0.1 - Toast notifications
- `react-resizable-panels` ^2.1.7 - Resizable panel layouts
- `@dnd-kit/core` ^6.3.1 / `@dnd-kit/sortable` ^10.0.0 - Drag and drop
- `react-day-picker` ^8.10.1 - Date picker
- `next-themes` ^0.4.4 - Dark/light mode
- `date-fns` ^3.6.0 - Date formatting

**Utility:**
- `slugify` ^1.6.6 - String slug generation
- `mime-types` ^3.0.1 - MIME type detection
- `class-variance-authority` ^0.7.1 - Component variants
- `clsx` ^2.1.1 - Conditional classnames
- `tailwind-merge` ^3.0.1 - Tailwind class merging

## Configuration

**Environment:**
- Validated via Zod schema in `lib/config.ts`
- `.env.example` provided as template
- Self-hosted mode: `SELF_HOSTED_MODE=true` (default)
- All config accessed via `config` object from `lib/config.ts`

**Required env vars (minimum for self-hosted):**
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret (min 16 chars)

**Optional env vars:**
- `OPENAI_API_KEY` / `OPENAI_MODEL_NAME` - OpenAI provider
- `GOOGLE_API_KEY` / `GOOGLE_MODEL_NAME` - Google Gemini provider
- `MISTRAL_API_KEY` / `MISTRAL_MODEL_NAME` - Mistral provider
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Payment
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `RESEND_AUDIENCE_ID` - Email
- `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` - Error tracking
- `UPLOAD_PATH` - File upload directory (default: `./uploads`)
- `PORT` - Server port (default: 7331)
- `BASE_URL` - Public URL (default: `http://localhost:7331`)
- `DISABLE_SIGNUP` - Disable new user registration
- `SELF_HOSTED_MODE` - Enable self-hosted single-user mode

## Platform Requirements

**Development:**
- Node.js 23+ (to match Docker image)
- PostgreSQL 17+
- Ghostscript + GraphicsMagick (for PDF preview generation)

**Production:**
- Docker with Docker Compose
- Persistent volume for uploads (`./data`)
- Persistent volume for PostgreSQL data (`./pgdata`)
- Port 7331 exposed

---

*Stack analysis: 2026-03-23*
