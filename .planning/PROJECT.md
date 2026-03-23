# BanChee (บัญชี)

## What This Is

BanChee is an AI-powered, self-hosted accounting app built for Thai SME owners who want to handle their own tax compliance without hiring an accountant. Upload a receipt or invoice photo, and BanChee extracts all data, calculates VAT and withholding tax, categorizes expenses, and generates Revenue Department-ready reports — all in Thai, with a simple interface designed for non-accountants.

Built as a fork of [TaxHacker](https://github.com/vas3k/TaxHacker), extending its AI receipt scanning foundation with a complete Thai tax compliance layer.

## Core Value

A Thai SME owner can snap a receipt, have AI handle the rest, and generate monthly tax filings in 5 minutes — zero accountant needed, zero tax penalties.

## Requirements

### Validated

- ✓ AI receipt/invoice scanning with data extraction — existing (TaxHacker)
- ✓ Multi-currency support with historical exchange rates — existing (TaxHacker)
- ✓ Custom fields with AI extraction prompts — existing (TaxHacker)
- ✓ Custom categories and projects — existing (TaxHacker)
- ✓ File upload, storage, and preview (PDF + images) — existing (TaxHacker)
- ✓ User authentication and session management — existing (TaxHacker)
- ✓ CSV import/export — existing (TaxHacker)
- ✓ Dashboard with filtering and search — existing (TaxHacker)
- ✓ Docker self-hosted deployment — existing (TaxHacker)
- ✓ Multi-LLM provider support (OpenAI, Gemini, Mistral) — existing (TaxHacker)

### Active

- [ ] Thai language UI (full i18n with Thai as primary language)
- [ ] VAT input/output tracking (ภาษีซื้อ/ภาษีขาย) with 7% auto-calculation
- [ ] Withholding tax management (หัก ณ ที่จ่าย) with rate selection per service type (1-5%)
- [ ] Thai tax invoice validation (ใบกำกับภาษี) — AI checks 10 required fields per Revenue Dept rules
- [ ] Auto-detect VAT registration status based on revenue threshold (1.8M baht)
- [ ] SME tax rate calculation (0% on first 300K, 15% on 300K-3M, 20% above)
- [ ] Monthly VAT report generation (ภ.พ.30 format)
- [ ] WHT certificate generation (หนังสือรับรองหัก ณ ที่จ่าย)
- [ ] WHT filing reports (ภ.ง.ด.3 for individuals, ภ.ง.ด.53 for companies)
- [ ] Annual/half-year CIT reports (ภ.ง.ด.50 / ภ.ง.ด.51 calculation helpers)
- [ ] Section 65 tri expense flagging (รายจ่ายต้องห้าม — non-deductible expenses)
- [ ] Filing deadline tracker with reminders (VAT by 15th, WHT by 7th, CIT by May 30)
- [ ] Thai AI extraction prompts (Tax ID, branch number, VAT amount, WHT rate)
- [ ] FlowAccount-compatible export format
- [ ] Revenue Department e-Filing XML export
- [ ] Excel export in standard Thai accountant format
- [ ] Purchase/Sales tax ledger (รายงานภาษีซื้อ/ภาษีขาย)

### Out of Scope

- e-Tax Invoice digital signature (PDF/A-3 + CA certificate) — requires Revenue Dept registration, complex cert infrastructure, defer to v2
- Direct Revenue Dept e-Filing API submission — rd.go.th has no public API, manual upload of generated files is sufficient for v1
- Social Security Fund tracking — separate system, not directly tax-related
- Payroll management — different domain, too complex for v1
- Mobile native app — web-first, responsive design is sufficient
- Cloud SaaS multi-tenant mode — self-hosted first, SaaS deployment deferred to v2
- Real-time collaboration — single-user or family business, not multi-seat
- Integration with DRX/DoctorDog or other vertical PMS — generic SME tool first

## Context

**Thai Tax Landscape:**
- Corporate Income Tax: 20% on net profit (SME reduced rates apply)
- VAT: 7% — mandatory registration above 1.8M baht annual revenue
- Withholding Tax: 1-5% depending on service type, filed within 7 days of month end
- Tax invoices (ใบกำกับภาษี) must be in Thai, Thai currency, with 10+ required fields
- Revenue Department e-Filing system at rd.go.th for electronic submissions
- Document retention: 5 years minimum for tax invoices

**TaxHacker Foundation:**
- Next.js 15+ App Router with Server Actions
- Prisma ORM + PostgreSQL 17
- AI pipeline: configurable LLM providers (OpenAI, Gemini, Mistral)
- Custom fields with AI extraction prompts — extensible by design
- shadcn/ui component library with Tailwind CSS
- Better Auth for authentication
- Stripe for payments (can be repurposed or removed for self-hosted)
- Docker deployment with docker-compose

**Market Gap:**
- No open-source AI-powered Thai tax tool exists
- FlowAccount and PEAK are closed-source SaaS with monthly fees
- Thai SME owners (3.1M+ registered businesses) need affordable alternatives
- Self-hosted option appeals to privacy-conscious businesses

**Target Users:**
- Thai SME owners (non-accountants) running businesses with <30M annual revenue
- Both micro businesses (below 1.8M VAT threshold) and small businesses (VAT registered)
- Users who currently either: hire an accountant (5-15K/month), or struggle with manual tracking

## Constraints

- **Tech Stack**: Must stay on Next.js + Prisma + PostgreSQL (TaxHacker foundation)
- **Language**: Thai UI primary, English secondary — all tax terms must use official Thai Revenue Department terminology
- **LLM Provider**: Must remain provider-agnostic (OpenAI, Gemini, Mistral) — no vendor lock-in
- **Deployment**: Docker self-hosted first — must work on a single VPS
- **License**: MIT (inherited from TaxHacker) — must remain open source
- **Tax Compliance**: All tax calculations must follow current Thai Revenue Code — accuracy is critical, incorrect calculations could result in fines
- **Data Privacy**: Financial data never leaves the self-hosted instance — no external analytics or tracking

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fork TaxHacker as foundation | 60% of work done (AI scanning, file management, auth, UI), MIT license | — Pending |
| Thai UI first, not bilingual | Target user is Thai SME owner, Thai tax terms don't translate well | — Pending |
| Self-hosted Docker first | Data privacy for financial data, no infrastructure cost for users | — Pending |
| Full accountant replacement scope | Biggest pain point, highest value — not just a receipt scanner | — Pending |
| Support both micro + small SME | Same app, auto-detect VAT status — wider market | — Pending |
| Export to FlowAccount/RD/Excel | Users may still use accountant for annual filing — clean data handoff | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-23 after initialization*
