# Testing Patterns

**Analysis Date:** 2026-03-23

## Test Framework

**Runner:** None configured.

**CRITICAL: This project has ZERO test coverage.**

- No test files exist (searched for `*.test.*`, `*.spec.*`, `__tests__/`)
- No test runner configured (no `jest.config.*`, `vitest.config.*`, `playwright.config.*`)
- No test dependencies in `package.json` (no jest, vitest, testing-library, playwright, cypress)
- No test scripts in `package.json`
- No CI pipeline (no `.github/workflows/` YAML files)

## Current Quality Assurance

The only automated quality check is:
```bash
npm run lint   # runs "next lint" -- but this is DISABLED during builds
```

ESLint is disabled in production builds:
```typescript
// next.config.ts
eslint: {
  ignoreDuringBuilds: true, // TODO: make me linting again
}
```

This means there are effectively **no automated quality gates** anywhere in the pipeline.

## Validation Strategy

In lieu of tests, the codebase relies on:

1. **Zod schema validation** at the server action boundary (`forms/*.ts`)
2. **TypeScript strict mode** for compile-time type checking
3. **Prisma generated types** for database type safety
4. **`getCurrentUser()`** auth check at the start of every action

These provide some runtime safety but cannot replace proper test coverage.

## Recommended Test Setup

Based on the codebase patterns, the recommended testing stack would be:

**Unit/Integration Tests:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Config file: `vitest.config.ts`
```typescript
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
})
```

**Test File Organization:**
Use co-located tests alongside source files:
```
models/
  transactions.ts
  transactions.test.ts
lib/
  cache.ts
  cache.test.ts
  files.ts
  files.test.ts
```

**Naming Convention:**
- `{filename}.test.ts` for unit tests
- `{filename}.integration.test.ts` for integration tests

## Priority Test Targets

Based on codebase risk analysis, these areas need tests first:

### P0 -- Critical Business Logic

1. **`lib/cache.ts` (PoorManCache)** -- Pure logic, easy to test, used in production
2. **`forms/transactions.ts`** -- Zod schema with transform logic (cents conversion, JSON parsing)
3. **`forms/settings.ts`** -- Zod schemas for settings validation
4. **`lib/files.ts` (safePathJoin)** -- Security-critical path traversal prevention
5. **`lib/utils.ts`** -- Pure utility functions (formatCurrency, formatBytes, codeFromName, generateUUID)

### P1 -- Data Layer

6. **`models/transactions.ts`** -- CRUD operations, filter building, extra field splitting
7. **`models/backups.ts`** -- Backup/restore with data transformation (preprocessRowData)
8. **`models/export_and_import.ts`** -- Export/import field mapping with async transforms

### P2 -- Server Actions

9. **`app/(app)/transactions/actions.ts`** -- Transaction CRUD actions
10. **`app/(app)/unsorted/actions.ts`** -- File analysis + AI integration
11. **`app/(app)/settings/actions.ts`** -- Settings CRUD with file uploads

### P3 -- API Routes

12. **`app/api/stripe/webhook/route.ts`** -- Payment webhook handling
13. **`app/api/stripe/checkout/route.ts`** -- Checkout session creation
14. **`app/(app)/export/transactions/route.ts`** -- CSV/ZIP export

## Example Test Patterns

**Testing Zod schemas:**
```typescript
import { describe, it, expect } from "vitest"
import { transactionFormSchema } from "@/forms/transactions"

describe("transactionFormSchema", () => {
  it("should convert total string to cents", () => {
    const result = transactionFormSchema.safeParse({ total: "42.50" })
    expect(result.success).toBe(true)
    expect(result.data?.total).toBe(4250)
  })

  it("should handle empty total", () => {
    const result = transactionFormSchema.safeParse({ total: "" })
    expect(result.success).toBe(true)
    expect(result.data?.total).toBeNull()
  })

  it("should reject invalid total", () => {
    const result = transactionFormSchema.safeParse({ total: "abc" })
    expect(result.success).toBe(false)
  })
})
```

**Testing safePathJoin:**
```typescript
import { describe, it, expect } from "vitest"
import { safePathJoin } from "@/lib/files"

describe("safePathJoin", () => {
  it("should join paths safely", () => {
    const result = safePathJoin("/uploads", "user@email.com", "file.pdf")
    expect(result).toBe("/uploads/user@email.com/file.pdf")
  })

  it("should throw on path traversal", () => {
    expect(() => safePathJoin("/uploads", "../../../etc/passwd")).toThrow("Path traversal detected")
  })
})
```

**Testing PoorManCache:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PoorManCache } from "@/lib/cache"

describe("PoorManCache", () => {
  let cache: PoorManCache<string>

  beforeEach(() => {
    cache = new PoorManCache<string>(1000)
  })

  it("should store and retrieve values", () => {
    cache.set("key", "value")
    expect(cache.get("key")).toBe("value")
  })

  it("should return undefined for expired entries", () => {
    vi.useFakeTimers()
    cache.set("key", "value")
    vi.advanceTimersByTime(1001)
    expect(cache.get("key")).toBeUndefined()
    vi.useRealTimers()
  })
})
```

**Mocking Prisma for model tests:**
```typescript
import { vi } from "vitest"

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))
```

## E2E Tests

**Not configured.** If added, use Playwright:
```bash
npm install -D @playwright/test
```

Priority E2E flows:
1. Upload file -> AI analysis -> save as transaction
2. Create transaction manually -> edit -> delete
3. Export transactions as CSV
4. Backup -> restore cycle
5. Stripe checkout flow (with mock)

## Coverage

**Requirements:** None enforced. Target should be 80%+ for `lib/`, `models/`, and `forms/` directories.

---

*Testing analysis: 2026-03-23*
