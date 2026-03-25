# Milestones

## v1.0 Thai Tax MVP (Shipped: 2026-03-25)

**Phases completed:** 4 phases, 15 plans, 32 tasks

**Key accomplishments:**

- Prisma VAT schema migration, satang integer tax calculator with 23 passing tests, Thai locale/font/date utilities, business profile model with Zod validation, and Thai-localized defaults (categories, fields, AI prompt, THB currency)
- 7-step setup wizard at /setup with Thai business profile fields, THSarabunNew font registration for PDF generation, and shared Thai PDF styles for Revenue Department documents
- AI extraction pipeline extended with Section 86/4 post-extraction validator (11 fields), B.E. date correction, and analyze form with Thai labels, VAT fields, and per-field inline validation badges
- VAT dashboard with DB-aggregate summary cards, 6-month expiry warnings, 1.8M threshold alert, Thai labels, middleware setup gate, and VAT report manifest stub
- PP30, Purchase Tax Report, and Sales Tax Report PDFs with one-click download plus settings business profile form and transaction edit VAT fields
- WHT calculator with basis-point arithmetic, Contact/FilingStatus Prisma models, filing deadline computation with Thai 2026 holiday awareness
- AI receipt scanning now suggests WHT rate (1-10%) per service type, shown in analyze form with user-editable dropdown and auto-computed amount
- 50 Tawi certificate, PND3/PND53 monthly filing PDFs, and batch ZIP download via react-pdf and JSZip
- Tax invoice form with Section 86/4 enforcement, contact autocomplete/inline-create, sequential numbering (INV-YYYY-NNNN), auto-income-transaction, and PDF generation with THSarabunNew
- Filing deadline cards with green/amber/red urgency color-coding, mark-as-filed toggle, and WHT monthly summary widget wired into the BanChee dashboard
- CIT engine with SME tiered rates, non-deductible expense validator with heuristic overrides, and AI prompt extended for Section 65 tri flagging across 8 categories
- Status:
- 4-card tax summary grid (VAT, WHT, CIT, flagged expenses) with non-deductible cap tracking and parallel data fetching on dashboard
- RD pipe-delimited TXT (PP30/PND3/PND53), FlowAccount CSV, and Thai accountant Excel workbook generators with ExcelJS
- e-Filing export buttons on VAT/WHT report pages plus dedicated export data page with FlowAccount CSV and accountant Excel downloads

---
