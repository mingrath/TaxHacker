# BanChee Retrospective

## Milestone: v1.0 — Thai Tax MVP

**Shipped:** 2026-03-25
**Phases:** 4 | **Plans:** 15 | **Commits:** 229 | **LOC:** 31,600+ TypeScript

### What Was Built
- Thai-localized UI with B.E. dates, Revenue Department terminology, Noto Sans Thai + THSarabunNew
- AI receipt scanning with Section 86/4 validation, WHT rate suggestion, Section 65 tri flagging
- Complete VAT workflow: input/output tracking, /107 formula, PP30 PDF generation
- WHT workflow: 5-tier calculator, 50 Tawi certificates, PND3/PND53 reports, batch ZIP
- CIT estimation: SME tiered rates, non-deductible cap tracking, PND50/PND51 reports
- Tax invoice + credit/debit note creation with sequential numbering
- Filing deadline dashboard with Thai holiday awareness and status tracking
- Multi-format export: RD pipe-delimited TXT, FlowAccount CSV, accountant Excel workbook

### What Worked
- **GSD workflow**: discuss-plan-execute per phase produced consistent, verified output
- **Brownfield approach**: Forking TaxHacker saved massive effort — auth, AI pipeline, file management all free
- **Satang integer arithmetic**: Zero precision issues across all tax calculations
- **Phase ordering by tax frequency**: Monthly (VAT) → monthly (WHT) → annual (CIT) → export was the right sequence
- **Parallel execution**: Independent plans executed in parallel waves, cutting phase time
- **Pure transformation exports**: Export services take data in, return buffers out — clean, testable (35/35 tests)

### What Was Inefficient
- **REQUIREMENTS.md checkboxes not synced**: 3 requirements (CIT-02, CIT-03, INV-03) were built but never checked off — caused confusion at milestone completion
- **Migration timestamp ordering**: Had to rename a migration after the fact due to timestamp collision
- **Resend crash on self-hosted**: Module-level Resend instantiation crashed without API key — should have been guarded from the start

### Patterns Established
- Satang integers everywhere (formatCurrency handles /100 internally)
- FIRST_CLASS_COLUMNS array in models/transactions.ts — must add new fields here
- AppData model for document storage (key pattern: `{type}-{docNumber}`)
- Cookie-based middleware gate (Edge runtime can't run Prisma)
- Client-side PDF generation via pdf() to avoid server memory pressure
- Settings model for sequential numbering with parseInt in $transaction

### Key Lessons
- Always guard optional service clients (Resend, Stripe) with null checks at module level
- Migration timestamps must be manually verified for ordering when dependencies exist
- The /107 VAT formula is non-negotiable — never multiply by 0.07 for inclusive prices
- WHT always on pre-VAT amount — chain extractVATFromTotal() before calculateWHT()

### Cost Observations
- Model mix: 100% Opus (quality profile)
- Sessions: ~2 (one marathon session built phases 1-4, one cleanup session)
- Notable: Entire v1 built in a single extended session — GSD parallel execution was key

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 4 |
| Plans | 15 |
| Commits | 229 |
| LOC | 31,600+ |
| Duration | ~1 day |
| Model | Opus |

---
*Updated: 2026-03-25*
