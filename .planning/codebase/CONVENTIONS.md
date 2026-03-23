# Coding Conventions

**Analysis Date:** 2026-03-23

## Naming Patterns

**Files:**
- Components: `kebab-case.tsx` (e.g., `components/transactions/edit.tsx`, `components/dashboard/stats-widget.tsx`)
- Lib/utilities: `kebab-case.ts` (e.g., `lib/auth-client.ts`, `lib/llm-providers.ts`)
- Models: `kebab-case.ts` singular or compound (e.g., `models/transactions.ts`, `models/export_and_import.ts`)
- Forms (Zod schemas): `kebab-case.ts` plural (e.g., `forms/transactions.ts`, `forms/settings.ts`)
- Server actions: `actions.ts` co-located with the route that uses them
- API routes: `route.ts` in the standard Next.js App Router convention

**Functions:**
- Use `camelCase` for all functions: `getCurrentUser()`, `getTransactionById()`, `safePathJoin()`
- Server actions: `verbNounAction` pattern (e.g., `createTransactionAction`, `deleteUnsortedFileAction`, `uploadFilesAction`)
- Model functions: `verbNoun` without "Action" suffix (e.g., `createTransaction`, `updateUser`, `getFields`)
- React components: `PascalCase` default exports (e.g., `TransactionEditForm`, `DashboardDropZoneWidget`)

**Variables:**
- `camelCase` throughout: `formData`, `userUploadsDirectory`, `totalFileSize`
- Constants: `UPPER_SNAKE_CASE` (e.g., `FILE_UPLOAD_PATH`, `SELF_HOSTED_USER`, `MAX_BACKUP_SIZE`, `TRANSACTIONS_CHUNK_SIZE`)
- Boolean variables: `is` prefix (e.g., `isSubscriptionExpired`, `isEnoughStorageToUploadFile`, `isFileExists`)

**Types:**
- `PascalCase` for all types and interfaces: `ActionState<T>`, `TransactionData`, `UserProfile`, `LLMProvider`
- Prisma types imported directly from `@/prisma/client`: `User`, `Transaction`, `Category`, `Field`, `File`
- Zod schemas: `camelCase` with `Schema` suffix (e.g., `transactionFormSchema`, `settingsFormSchema`, `userFormSchema`)

**Database columns:**
- Prisma schema uses `camelCase` in the model with `@map("snake_case")` for the database column name
- Example: `issuedAt DateTime? @map("issued_at")`

## Code Style

**Formatting:**
- Prettier with config at `.prettierrc`
- Key settings:
  - `printWidth: 120` (wider than default 80)
  - `semi: false` (no semicolons)
  - `singleQuote: false` (double quotes)
  - `trailingComma: "es5"`
  - `tabWidth: 2`
  - `arrowParens: "always"`

**Linting:**
- ESLint 9 flat config at `eslint.config.mjs`
- Extends `next/core-web-vitals` and `next/typescript`
- **CRITICAL:** ESLint is DISABLED during builds via `ignoreDuringBuilds: true` in `next.config.ts`
- No custom rules added beyond Next.js defaults
- No Prettier ESLint integration

**TypeScript:**
- `strict: true` enabled in `tsconfig.json`
- Target: ES2017
- Module resolution: `bundler`
- Path alias: `@/*` maps to project root
- `skipLibCheck: true`

## Import Organization

**Order (observed pattern):**
1. External packages (`react`, `next/*`, `date-fns`, `stripe`, etc.)
2. Internal `@/` aliases (`@/lib/*`, `@/models/*`, `@/components/*`, `@/prisma/client`)
3. Relative imports (rare, mostly within the same module)

**Path Aliases:**
- `@/*` -- the only alias, maps to project root
- All internal imports use `@/` prefix: `@/lib/auth`, `@/models/transactions`, `@/components/ui/button`

**No barrel files.** Each module is imported directly by path.

## Error Handling

**Server Actions Pattern:**
All server actions return `ActionState<T>`:
```typescript
// lib/actions.ts
export type ActionState<T> = {
  success: boolean
  error?: string | null
  data?: T | null
}
```

Standard pattern in every action:
```typescript
export async function someAction(): Promise<ActionState<SomeType>> {
  try {
    const user = await getCurrentUser()
    // ... validate with zod
    // ... do work
    revalidatePath("/path")
    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to do thing:", error)
    return { success: false, error: "Failed to do thing" }
  }
}
```

**API Route Pattern:**
API routes use `NextResponse` with status codes:
```typescript
export async function POST(request: Request) {
  try {
    // ... work
    return NextResponse.json({ session })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "message" }, { status: 500 })
  }
}
```

**Model Layer:**
Models do NOT wrap errors -- they throw directly from Prisma. Actions catch and wrap them.

**Inconsistency:** Some error messages include the raw error object (e.g., `"Failed to save transaction: " + error`), which leaks implementation details. Others use generic messages (e.g., `"Failed to create transaction"`). Prefer generic messages in the return and `console.error` for the raw error.

## Logging

**Framework:** `console` (console.log, console.error, console.info, console.warn)

**Patterns:**
- `console.error("Failed to X:", error)` in catch blocks
- `console.log("X results:", data)` for debug output (multiple instances left in production code)
- `console.info("Use provider:", config.provider)` for informational messages in AI module
- **Sentry** is configured for error tracking (`@sentry/nextjs`) with conditional initialization

**Issue:** Many `console.log` debug statements remain in production code (e.g., `console.log("uploadedFiles", uploadedFiles)`, `console.log("Analysis results:", results)`). These should be removed or gated behind a debug flag.

## Comments

**When to Comment:**
- Comments are sparse -- code is mostly self-documenting
- JSDoc used only in `lib/cache.ts` (the `PoorManCache` class)
- `// TODO:` and `// FIXME:` used for known issues (3 instances found)
- Inline comments for non-obvious logic (e.g., `// convert to cents`, `// fix for CI, do not remove`)

**JSDoc/TSDoc:**
- Minimal usage. Only `lib/cache.ts` has proper JSDoc comments on methods.
- All other modules lack documentation.

## Function Design

**Size:** Most functions are under 50 lines. Largest functions are in backup restore (~80 lines) and CSV export (~100 lines).

**Parameters:**
- Server actions receive `FormData` or typed objects
- Model functions receive `userId: string` as first parameter consistently
- No parameter objects pattern -- positional parameters throughout

**Return Values:**
- Server actions return `ActionState<T>`
- Model functions return Prisma types directly or `null`
- No exception: `deleteTransaction` returns `Transaction | undefined` (inconsistent with other deletes)

## Module Design

**Exports:**
- Named exports used everywhere except React page components
- Page components use `export default async function`
- Client components use `export default function`
- No default exports in lib/models/forms

**Barrel Files:**
- Not used. Every import references the specific file path.

## Form Validation

**Framework:** Zod (`^3.24.2`)

**Pattern:**
- Schemas defined in `forms/` directory
- `.safeParse()` used in server actions, never `.parse()`
- Form data converted via `Object.fromEntries(formData.entries())`
- Transform functions used for cents conversion and JSON parsing

```typescript
// forms/transactions.ts
export const transactionFormSchema = z
  .object({
    name: z.string().max(128).optional(),
    total: z.string().optional().transform((val) => {
      // convert to cents
      return Math.round(num * 100)
    }),
  })
  .catchall(z.string()) // allows extra dynamic fields
```

## State Management

**Server-side:** React `cache()` wraps model query functions for request-level deduplication:
```typescript
export const getTransactions = cache(async (userId, filters, pagination) => { ... })
```

**Client-side:**
- React `useState` for local component state
- React `useActionState` for server action form submissions
- No global state management library (no Redux, Zustand, Jotai)
- Custom `useProgress` hook for SSE-based progress tracking

---

*Convention analysis: 2026-03-23*
