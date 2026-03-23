# Research Summary: BanChee Thai SME Tax Features

**Domain:** Thai SME accounting/tax compliance tool features
**Researched:** 2026-03-23 (updated with stack-specific research)
**Overall confidence:** HIGH

## Executive Summary

The Thai SME accounting software market is dominated by FlowAccount (130K+ users, Sequoia-backed) and PEAK (500-3,500 THB/mo, strong bank reconciliation), with AccRevo and Leceipt serving niche segments. All competitors are cloud SaaS with monthly fees. No open-source, self-hosted, AI-powered Thai tax tool exists -- this is BanChee's clear market gap.

Thai SME owners face three recurring monthly obligations: VAT filing (PP30 by 15th), WHT filing (PND3/PND53 by 7th), and document management (tax invoices, WHT certificates). These are table stakes that must work correctly on day one. The annual obligations (CIT via PND50/PND51) are important but less frequent and can ship in phase 2.

BanChee's primary differentiation is the AI pipeline: auto-extract Thai receipts, auto-validate tax invoice fields, auto-categorize expenses, auto-flag non-deductible items (Section 65 Tri), and auto-suggest WHT rates. No competitor offers this level of automation. FlowAccount's AutoKey does basic OCR scanning but requires manual categorization and offers no tax validation.

The technology stack extends TaxHacker with minimal new dependencies: next-intl for i18n, exceljs for styled Excel reports, thai-baht-text for number-to-text conversion, and an upgrade of react-day-picker to v9 for Buddhist calendar support. All Thai-specific features (tax calculation, currency formatting, Buddhist dates) use native TypeScript/JavaScript APIs rather than third-party libraries. The existing LLM vision pipeline outperforms Tesseract OCR for Thai receipt extraction, so no OCR library is needed.

## Key Findings

**Stack:** 3 new npm packages (next-intl, exceljs, thai-baht-text) + 1 font package + 1 upgrade (react-day-picker v8->v9). No new infrastructure. Thai tax calculation in pure TypeScript.
**Features:** 30+ table stakes features identified across 7 categories. 12 differentiators centered on AI intelligence and self-hosted model.
**Architecture:** Extend existing TaxHacker layers with tax service layer, new models, and Thai-specific AI prompts. No architectural rewrites.
**Critical pitfall:** VAT-on-VAT calculation error (applying 7% to VAT-inclusive amounts instead of using /107 formula) -- must be addressed in the earliest phase.

## Technical Stack Summary

| Area | Decision | Rationale |
|------|----------|-----------|
| i18n | next-intl ^4.8.3 | Only i18n lib with native Next.js 15 App Router + Server Component support |
| Excel | exceljs ^4.4.0 | Cell styling (borders, merged cells, number formats) required for Thai accountant reports |
| PDF | @react-pdf/renderer ^4.3.0 (existing) + TH Sarabun font | Already installed. Register Thai font via Font.register(). |
| Currency | Intl.NumberFormat (built-in) + thai-baht-text ^2.0.5 | Native API handles formatting. thai-baht-text converts to text for official documents. |
| Buddhist dates | react-day-picker v9 + Intl.DateTimeFormat | v9.11.0+ has native Buddhist calendar. Intl handles formatting. No date library needed. |
| RD e-Filing | @fast-csv (existing) with pipe delimiter | RD Prep accepts pipe-delimited TXT files. No XML needed for most forms. |
| Thai OCR | Existing LLM vision pipeline | GPT-4o/Gemini outperform Tesseract (94% vs 87%). No new OCR library. |
| Tax calc | Pure TypeScript functions | No Thai tax API exists. Rules are simple enough for pure functions. |

## Implications for Roadmap

Based on research, the feature implementation should follow tax obligation frequency (monthly first, then annual):

1. **Phase 1: Foundation + VAT** - Thai UI + AI receipt scanning + VAT tracking + PP30 generation
   - Addresses: Most frequent filing obligation (monthly VAT)
   - Avoids: Overbuilding accounting features (anti-feature: full GL)
   - Stack: Install next-intl, @fontsource/noto-sans-thai. Add Thai font files. Upgrade react-day-picker.

2. **Phase 2: WHT Compliance** - WHT management + 50 Tawi certificates + PND3/PND53
   - Addresses: Second most frequent filing obligation
   - Depends on: Contact management from Phase 1
   - Stack: Install thai-baht-text (needed for WHT certificates). Use @react-pdf/renderer with Thai fonts.

3. **Phase 3: CIT + Intelligence** - SME CIT helpers + Section 65 Tri flagging + revenue threshold detection
   - Addresses: Annual obligations + tax optimization intelligence
   - Avoids: Rush-building before annual filing season
   - Stack: No new dependencies. Pure TypeScript tax calculation functions.

4. **Phase 4: Export + Interop** - Revenue Dept TXT export, FlowAccount export, Thai accountant Excel format
   - Addresses: How users actually file and hand off data
   - Depends on: All tax calculations from Phases 1-3
   - Stack: Install exceljs. Use @fast-csv with pipe delimiter for RD Prep format.

**Phase ordering rationale:**
- Monthly obligations (VAT, WHT) before annual (CIT) -- users need monthly tools immediately
- AI features layered incrementally (scan first, then validate, then flag, then suggest)
- Export formats last because they depend on correct tax calculation logic being built first
- Stack dependencies installed incrementally as needed, not all upfront

**Research flags for phases:**
- Phase 1: @react-pdf/renderer Thai font rendering needs early testing -- some users report character display issues. Have Noto Sans Thai as fallback font.
- Phase 2: WHT rate table by service type needs validation against current Revenue Department rate schedule
- Phase 3: Section 65 Tri rules have edge cases (entertainment expense 0.3% cap calculation) requiring careful implementation
- Phase 4: RD Prep pipe-delimited TXT format specification is not publicly documented in detail -- will need to reverse-engineer from sample files or RD Prep program output

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack - i18n (next-intl) | HIGH | Verified via npm, official docs, changelog. v4.8.3 confirmed. |
| Stack - Excel (exceljs) | HIGH | Verified via npm. v4.4.0 stable. Built-in TypeScript types. |
| Stack - PDF Thai fonts | MEDIUM | @react-pdf/renderer Font.register() documented. Some GitHub issues report Thai rendering problems. Test early with TH Sarabun + Noto Sans Thai fallback. |
| Stack - Buddhist dates | HIGH | react-day-picker v9.11.0+ Buddhist calendar confirmed via changelog. Intl.DateTimeFormat 'buddhist' calendar built-in. |
| Stack - Currency formatting | HIGH | Intl.NumberFormat with th-TH locale is a JavaScript standard. thai-baht-text v2.0.5 on npm. |
| Stack - RD e-Filing format | LOW | Pipe-delimited TXT confirmed, but exact column specifications not publicly documented. Needs phase-specific research when building export. |
| Stack - Thai OCR | HIGH | LLM vision pipeline superiority over Tesseract well-documented across multiple 2025 benchmarks. |
| Features | HIGH | Cross-referenced FlowAccount, PEAK, AccRevo, Leceipt, SME Move product pages |
| Tax compliance rules | HIGH | Verified against Revenue Code on rd.go.th, cross-referenced with KPMG, PwC, multiple law firm guides |
| Architecture | HIGH | Extends existing TaxHacker patterns, no novel architecture needed |
| Pitfalls | HIGH | VAT/WHT calculation patterns verified via Thai tax authority sources |

## Gaps to Address

- **RD Prep TXT format specification**: Exact columns for ภ.ง.ด.3, ภ.ง.ด.53, ภ.พ.30 attachment files. Need to download RD Prep program and examine sample output files or find specification document from Revenue Department.
- **@react-pdf/renderer Thai rendering**: Need hands-on testing with TH Sarabun New font registration. Some users report issues. If problematic, fallback to Puppeteer for Thai PDF generation (heavier but guaranteed font rendering).
- **FlowAccount export format**: No public specification. May need to export sample files from FlowAccount free tier and reverse-engineer the format.
- **ETDA XML schema (ขมธอ.3-2560)**: Official standard for e-Tax Invoices. Out of scope for v1 but documented for v2 planning. Schema available from ETDA but requires registration/download.
- **react-day-picker v8 to v9 migration**: Current codebase uses v8.10.1. v9 has breaking changes. Need to review upgrade guide and update existing date picker usages in TaxHacker.
