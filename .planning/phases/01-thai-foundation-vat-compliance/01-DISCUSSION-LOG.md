# Phase 1: Thai Foundation + VAT Compliance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 01-thai-foundation-vat-compliance
**Areas discussed:** Thai UI approach, AI Thai extraction, VAT tracking UX, Business profile setup

---

## Thai UI Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Thai-only fork | Replace all English strings with Thai directly. Simpler, no i18n overhead. | ✓ |
| next-intl bilingual | Full i18n with next-intl. Thai primary, English secondary. | |
| Thai UI + English terms | Thai interface but keep accounting terms bilingual. | |

**User's choice:** Thai-only fork
**Notes:** Target user is Thai SME owner only. No need for English support.

### Font

| Option | Description | Selected |
|--------|-------------|----------|
| Noto Sans Thai | Google's clean Thai font. Modern, readable. | ✓ |
| IBM Plex Sans Thai | More corporate/professional feel. | |
| Sarabun | Traditional Thai feel, used in government docs. | |

**User's choice:** Noto Sans Thai

### Date Format

| Option | Description | Selected |
|--------|-------------|----------|
| Thai format | 25 มี.ค. 2569 (Buddhist Era) | ✓ |
| Dual display | Show both Buddhist and Gregorian | |
| Gregorian primary | Standard western dates with Thai months | |

**User's choice:** Thai format (Buddhist Era standard)

---

## AI Thai Extraction

### Validation UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline field flags | Each field shows ✓/✗. Missing fields red. User fixes before saving. | ✓ |
| Summary card | One validation card at top. | |
| Silent with warnings | Auto-save, warn only if critical missing. | |

**User's choice:** Inline field flags

### Language Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-detect | AI handles both Thai and English seamlessly. | ✓ |
| User selects language | Manual language picker before scanning. | |

**User's choice:** Auto-detect

### Review Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Review required | AI fills form, user reviews, then saves. | ✓ |
| Auto-save + edit | Save immediately, edit later. | |
| Confidence-based | Auto-save if high confidence, review if low. | |

**User's choice:** Review required

### Categories

| Option | Description | Selected |
|--------|-------------|----------|
| Auto + user confirm | AI suggests, user confirms/changes before saving. | ✓ |
| Auto only | AI assigns, user edits later. | |
| Manual selection | AI leaves blank, user picks. | |

**User's choice:** Auto + user confirm

---

## VAT Tracking UX

### VAT Capture

| Option | Description | Selected |
|--------|-------------|----------|
| AI auto-detect | AI extracts VAT from receipt. Handles /107 automatically. | ✓ |
| Manual toggle | User toggles VAT per transaction. | |
| Smart default | Default 7% VAT for VAT-registered businesses. | |

**User's choice:** AI auto-detect

### PP30 Flow

| Option | Description | Selected |
|--------|-------------|----------|
| One-click generate | Button per month → calculate → preview → download. | ✓ |
| Auto-generate monthly | System generates at month end. | |
| Step-by-step wizard | Guided review process. | |

**User's choice:** One-click generate

### Dashboard View

| Option | Description | Selected |
|--------|-------------|----------|
| Monthly summary card | Card with Output/Input/Net VAT. Color-coded. | |
| Ledger-style table | Running table with cumulative totals. | |
| Both views | Summary card + detailed ledger via 'View details'. | ✓ |

**User's choice:** Both views

### Tax Reports

| Option | Description | Selected |
|--------|-------------|----------|
| Embedded in PP30 flow | All 3 docs generated together in one action. | ✓ |
| Standalone reports | Separate menu items for each report. | |

**User's choice:** Embedded in PP30 flow

---

## Business Profile Setup

### Onboarding

| Option | Description | Selected |
|--------|-------------|----------|
| Guided setup wizard | Step-by-step: Company → Tax ID → VAT → Period → LLM key. Must complete. | ✓ |
| Quick start + nag | Skip to dashboard, persistent banner until profile filled. | |
| Minimal required only | Only Tax ID and VAT status required. | |

**User's choice:** Guided setup wizard

### VAT Status

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle + auto-detect | Manual toggle + revenue tracking + 1.8M threshold alert. | ✓ |
| Manual toggle only | Simple on/off. No detection. | |
| Revenue-based auto | System auto-enables when revenue > 1.8M. | |

**User's choice:** Toggle + auto-detect

---

## Claude's Discretion

- Loading states and skeleton UI
- Form layout and field ordering
- VAT summary card colors
- Setup wizard transitions
- Error message wording

## Deferred Ideas

- WHT rate suggestion — Phase 2
- Section 65 tri flagging — Phase 3
- e-Tax Invoice — v2
- Filing deadline calendar — Phase 2
