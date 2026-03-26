<div align="center"><a name="readme-top"></a>

<img src="public/logo/512.png" alt="BanChee Logo" width="320">

<br>

# BanChee (บัญชี) — AI-powered Thai SME tax accounting

[![GitHub Stars](https://img.shields.io/github/stars/mingrath/banchee?color=ffcb47&labelColor=black&style=flat-square)](https://github.com/mingrath/banchee/stargazers)
[![License](https://img.shields.io/badge/license-MIT-ffcb47?labelColor=black&style=flat-square)](https://github.com/mingrath/banchee/blob/main/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/mingrath/banchee?color=ff80eb&labelColor=black&style=flat-square)](https://github.com/mingrath/banchee/issues)

</div>

---

## ภาษาไทย

BanChee (บัญชี) คือแอปบัญชีอัจฉริยะแบบ Self-hosted สำหรับเจ้าของธุรกิจ SME ไทยที่ต้องการจัดการภาษีด้วยตัวเองโดยไม่ต้องจ้างสำนักงานบัญชี ถ่ายรูปใบเสร็จหรือใบแจ้งหนี้ แล้ว AI จะดึงข้อมูลทั้งหมดให้อัตโนมัติ -- คำนวณภาษีมูลค่าเพิ่ม ภาษีหัก ณ ที่จ่าย จัดหมวดหมู่ค่าใช้จ่าย ตรวจสอบรายจ่ายที่ไม่สามารถหักเป็นค่าใช้จ่ายได้ และสร้างรายงานพร้อมยื่นกรมสรรพากร ทั้งหมดเป็นภาษาไทย ใช้ศัพท์กรมสรรพากร ออกแบบมาให้ใช้ง่ายสำหรับคนที่ไม่ใช่นักบัญชี

BanChee ยังรองรับการสร้างเอกสารธุรกิจครบวงจร ตั้งแต่ใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จรับเงิน ไปจนถึงใบกำกับภาษี พร้อมระบบนำเข้า Statement ธนาคารเพื่อตรวจสอบยอดบัญชี (Bank Reconciliation) ทำให้คุณจัดการบัญชีได้ครบจบในที่เดียว

ข้อมูลการเงินทั้งหมดเก็บอยู่ในเซิร์ฟเวอร์ของคุณเอง ไม่มีข้อมูลส่งออกไปภายนอก ปลอดภัยและเป็นส่วนตัว

---

## English

BanChee is an AI-powered, self-hosted accounting app built for Thai SME owners who want to handle their own tax compliance without hiring an accountant. Upload a receipt or invoice photo, and BanChee extracts all data, calculates VAT and withholding tax, categorizes expenses, flags non-deductible items, and generates Revenue Department-ready reports and exports -- all in Thai, with a simple interface designed for non-accountants.

BanChee also supports a complete business document workflow -- from quotation to invoice to receipt to tax invoice -- plus bank statement import and auto-reconciliation, so you can manage your entire accounting cycle in one place.

All financial data stays on your own server. No external analytics, no tracking, complete privacy.

---

## Features

### v1.0 -- AI Tax Accounting

- **AI receipt/invoice scanning** -- Snap a photo or upload a PDF, AI extracts dates, amounts, vendors, items, and tax details automatically
- **VAT calculation** -- Input/output VAT tracking with /107 formula, 1.8M registration threshold detection, PP30 monthly return
- **Withholding tax (WHT)** -- 5-tier rate table, AI rate suggestion per service type, 50 Tawi certificate PDF, PND3/PND53 reports
- **Corporate income tax (CIT)** -- SME tiered rates, PND50/PND51 estimation, entertainment 0.3% and charitable 2% cap tracking
- **Tax invoice validation** -- Section 86/4 compliance (11 required fields), sequential numbering, credit/debit notes
- **Non-deductible flagging** -- AI flags Section 65 tri items that cannot be deducted as expenses
- **Filing deadlines** -- Dashboard with Thai holiday awareness, filing status tracker (pending/filed/overdue)
- **Multi-format export** -- Revenue Department pipe-delimited TXT, FlowAccount CSV, Thai accountant Excel workbook
- **Contact management** -- Tax ID, branch number, address for vendors and customers
- **Multi-LLM support** -- OpenAI, Google Gemini, Mistral -- provider-agnostic, no vendor lock-in
- **Thai UI** -- Revenue Department terminology, Buddhist Era dates, Thai number/currency formatting
- **7-step setup wizard** -- Business profile configuration for new users

### v1.1 -- Document Workflow & Bank Reconciliation

- **Quotation (ใบเสนอราคา)** -- Create, manage, and convert quotations to invoices with one click
- **Invoice (ใบแจ้งหนี้)** -- Standalone or converted from quotation, with due date tracking and overdue detection
- **Receipt (ใบเสร็จรับเงิน)** -- Linked to invoice, records payment date, method, and partial payments
- **Delivery note (ใบส่งของ)** -- Linked to quotation or invoice, items-only (no financial columns)
- **Document chain** -- Quotation -> Invoice -> Receipt with full traceability (ChainBadges in UI)
- **PDF generation** -- THSarabunNew font for all document types, Section 86/4 compliance
- **Bank statement import** -- CSV/Excel with flexible column mapping, Thai bank preset support (KBank TIS-620)
- **Auto-reconciliation** -- Multi-factor matching (amount + date proximity + description similarity)
- **Match review UI** -- Side-by-side confirm/reject/manual match with per-entry loading states
- **Unified document list** -- View all documents with type and status filters

<!-- TODO: Add screenshots -->

---

## Quick Start

For the impatient -- get BanChee running in 2 commands:

```bash
curl -O https://raw.githubusercontent.com/mingrath/banchee/main/docker-compose.yml

docker compose up
```

Then visit [http://localhost:7331](http://localhost:7331).

---

## Installation Guide

### Option 1: Docker Self-hosted (Recommended)

Uses the pre-built image from GitHub Container Registry:

```bash
# Download the compose file
curl -O https://raw.githubusercontent.com/mingrath/banchee/main/docker-compose.yml

# Start BanChee + PostgreSQL
docker compose up -d

# Visit http://localhost:7331
```

The `docker-compose.yml` includes:
- BanChee application container (pre-built image)
- PostgreSQL 17 database
- Automatic database migrations on startup
- Persistent volumes for uploads and database

### Option 2: Docker Local Build

Build from source using the provided Dockerfile:

```bash
# Clone the repository
git clone https://github.com/mingrath/banchee.git
cd banchee

# Build and start
docker compose -f docker-compose.build.yml up -d

# Visit http://localhost:7331
```

### Option 3: Local Development

Requirements:
- Node.js 23+
- PostgreSQL 17+
- Ghostscript + GraphicsMagick (macOS: `brew install gs graphicsmagick`)

```bash
# Clone the repository
git clone https://github.com/mingrath/banchee.git
cd banchee

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env -- set DATABASE_URL to your PostgreSQL connection string

# Initialize the database
npx prisma generate && npx prisma migrate dev

# Start the development server
npm run dev
```

Visit [http://localhost:7331](http://localhost:7331).

---

## Environment Variables

Configure BanChee with these environment variables (see `.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | -- | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | -- | Auth secret key (min 16 characters) |
| `PORT` | No | `7331` | Application port |
| `BASE_URL` | No | `http://localhost:7331` | Public URL |
| `SELF_HOSTED_MODE` | No | `true` | Self-hosted single-user mode |
| `DISABLE_SIGNUP` | No | `true` | Disable new user registration |
| `UPLOAD_PATH` | No | `./data/uploads` | File upload directory |

### AI Provider Configuration

At least one AI provider API key is required for receipt scanning:

| Variable | Provider | Default Model |
|----------|----------|---------------|
| `OPENAI_API_KEY` / `OPENAI_MODEL_NAME` | OpenAI | `gpt-4o-mini` |
| `GOOGLE_API_KEY` / `GOOGLE_MODEL_NAME` | Google Gemini | `gemini-2.5-flash` |
| `MISTRAL_API_KEY` / `MISTRAL_MODEL_NAME` | Mistral | `mistral-medium-latest` |

### Optional Services

| Variable | Service | Description |
|----------|---------|-------------|
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe | Payment processing (cloud mode) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Resend | Email delivery for OTP |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Sentry | Error tracking |

---

## Thai Tax Terminology Reference

| English | Thai | Code |
|---------|------|------|
| Value Added Tax (VAT) | ภาษีมูลค่าเพิ่ม | ภ.พ.30 |
| Withholding Tax (WHT) | ภาษีหัก ณ ที่จ่าย | ภ.ง.ด.3 / ภ.ง.ด.53 |
| Corporate Income Tax (CIT) | ภาษีเงินได้นิติบุคคล | ภ.ง.ด.50 / ภ.ง.ด.51 |
| Tax Invoice | ใบกำกับภาษี | Section 86/4 |
| Withholding Tax Certificate | หนังสือรับรองหัก ณ ที่จ่าย | 50 ทวิ |
| Purchase Tax Report | รายงานภาษีซื้อ | -- |
| Sales Tax Report | รายงานภาษีขาย | -- |
| Non-deductible Expense | รายจ่ายต้องห้าม | Section 65 tri |
| Quotation | ใบเสนอราคา | -- |
| Invoice / Billing Note | ใบแจ้งหนี้ | -- |
| Receipt | ใบเสร็จรับเงิน | -- |
| Delivery Note | ใบส่งของ | -- |

---

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Database:** PostgreSQL 17 + Prisma ORM
- **AI:** LangChain (OpenAI / Google Gemini / Mistral)
- **UI:** shadcn/ui + Tailwind CSS + Lucide icons
- **PDF:** @react-pdf/renderer + THSarabunNew font
- **Auth:** Better Auth (email OTP, self-hosted bypass)
- **Deployment:** Docker (node:23-slim + postgres:17-alpine)

---

## License

BanChee is licensed under the [MIT License](LICENSE).

## Credits

Built on [TaxHacker](https://github.com/vas3k/TaxHacker) by [vas3k](https://vas3k.com/) -- extending its AI receipt scanning foundation with a complete Thai tax compliance layer.

---

*BanChee (บัญชี) -- AI-powered Thai SME tax accounting*
