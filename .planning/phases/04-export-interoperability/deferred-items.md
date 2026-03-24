# Deferred Items — Phase 04

## Pre-existing Build Error

**File:** `app/(app)/apps/notes/actions.ts:171`
**Error:** Type 'Record<string, unknown>' incompatible with Prisma's InputJsonValue for AppData.data field
**Impact:** `next build` fails with type error (ESLint disabled during builds, so this is a TS error)
**Status:** Pre-existing, not introduced by Phase 04 changes
**Fix:** Cast `noteData` properly or use `Prisma.JsonValue` type
