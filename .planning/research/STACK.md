# Technology Stack: Thai Tax Compliance Layer

**Project:** BanChee - Thai Tax Compliance Extension
**Researched:** 2026-03-23
**Overall confidence:** HIGH (verified via npm, official docs, GitHub repos)

## Recommended Stack

### Core Framework (Inherited from TaxHacker -- NO Changes)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | ^15.2.4 | App framework | Inherited, App Router + Server Actions |
| Prisma | ^6.6.0 | ORM + migrations | Inherited, schema-driven, type-safe |
| PostgreSQL | 17 | Database | Inherited, robust JSON support for tax metadata |
| shadcn/ui | Latest | UI components | Inherited, Tailwind-based |
| Better Auth | ^1.2.10 | Authentication | Inherited, self-hosted mode bypass |
| LangChain | ^0.3.30 | LLM orchestration | Inherited, multi-provider fallback chain |
| @react-pdf/renderer | ^4.3.0 | PDF generation | Inherited, already in codebase |
| @fast-csv/format | ^5.0.2 | CSV generation | Inherited, used for RD Prep pipe-delimited export |
| react-day-picker | ^8.10.1 | Date picker | Inherited, upgrade to v9 for Buddhist calendar |
| date-fns | ^3.6.0 | Date utilities | Inherited, filing deadline calculations |
| Zod | ^3.24.2 | Validation | Inherited, tax form field validation |

### New Dependencies for Thai Tax Features

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| next-intl | ^4.8.3 | i18n (Thai/English) | Best Next.js App Router + Server Component support. Uses locale prefix "never" to avoid URL restructuring. Native Server Component support without client wrappers. | HIGH |
| exceljs | ^4.4.0 | Excel report generation | Server-side .xlsx with cell styling (borders, merged cells, number formats). Built-in TypeScript types. Thai accountant report format requires rich formatting that SheetJS community edition lacks. | HIGH |
| thai-baht-text | ^2.0.5 | Number-to-text conversion | Converts numbers to Thai baht text (e.g., 10050 -> "หนึ่งหมื่นห้าสิบบาทถ้วน"). Required for WHT certificates and tax invoices. Written in TypeScript, works in Node.js and browser. MIT license. | HIGH |
| @fontsource/noto-sans-thai | Latest | Thai web font (UI) | Self-hosted Noto Sans Thai for the web UI. Google-backed, SIL Open Font License. Variable weight support (100-900). Eliminates Google Fonts CDN dependency for self-hosted privacy. | HIGH |

### Dependencies to Upgrade (Already Installed)

| Technology | Current | Target | Purpose | Why Upgrade |
|------------|---------|--------|---------|-------------|
| react-day-picker | ^8.10.1 | ^9.14.0 | Buddhist calendar date picker | v9.11.0+ adds native Buddhist calendar: `import { DayPicker } from "react-day-picker/buddhist"`. Displays years in B.E. (2568 instead of 2025) by default with Thai locale and Thai numerals. Eliminates need for separate Thai date picker library. |

### Thai Font Files (Manual Download, Not npm)

| Font | Source | Purpose | Why |
|------|--------|---------|-----|
| TH Sarabun New (Regular + Bold) | f0nt.com (official Thai government release) | PDF generation for tax forms | Standard Thai government document font. Required by Revenue Department for official forms (ภ.พ.30, WHT certificates). Register via `@react-pdf/renderer` Font.register(). Free, no license restriction. |
| Noto Sans Thai (ttf/otf) | Google Fonts / fontsource | PDF generation fallback | Modern alternative if TH Sarabun causes rendering issues in @react-pdf/renderer. Google-backed, excellent glyph coverage. |

### Existing Dependencies Leveraged (No New Install)

| Technology | Current Version | New Purpose | Notes |
|------------|-----------------|-------------|-------|
| @react-pdf/renderer | ^4.3.0 | Thai tax form PDFs (ภ.พ.30, WHT certificates, ภ.ง.ด.3/53 forms) | Already installed. Register Thai fonts via Font.register({ family: 'THSarabunNew', src: '/fonts/THSarabunNew.ttf' }). Some users report Thai character rendering issues -- test early with Noto Sans Thai as fallback. |
| @fast-csv/format | ^5.0.2 | RD Prep pipe-delimited TXT export | Already installed. RD Prep accepts pipe-delimited ("\|") .txt files with headers on first row. Use @fast-csv with custom delimiter config. |
| Zod | ^3.24.2 | Thai tax form validation (TIN format: 13 digits, VAT registration, WHT rate validation) | Already installed. Add Thai-specific validation schemas. |
| date-fns | ^3.6.0 | Filing deadline calculations, Buddhist year display | Already installed. Buddhist year = CE year + 543. Simple arithmetic, no library needed for conversion. Use date-fns for deadline math (e.g., "15th of next month for VAT"). |
| Intl.NumberFormat | Built-in | Thai baht currency formatting | Node.js built-in. `new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })`. Handles grouping separators and baht symbol. No library needed. |
| LangChain (existing AI pipeline) | ^0.3.30 | Thai receipt OCR + tax field extraction | Already installed with vision support. LLM vision APIs (GPT-4o, Gemini) outperform Tesseract for Thai receipt extraction (94% vs ~87% accuracy). Add Thai-specific extraction prompts for Tax ID, VAT amount, WHT rate, branch number. |

## Thai-Specific Technical Details

### Currency and Number Formatting

**Use native `Intl.NumberFormat` -- no library needed.**

```typescript
// Thai baht with symbol
new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(1234.56)
// Output: "฿1,234.56"

// Thai numerals (for display on forms)
new Intl.NumberFormat('th-TH-u-nu-thai', { style: 'currency', currency: 'THB' }).format(1234.56)
// Output: "฿๑,๒๓๔.๕๖"

// Baht text for official documents (requires thai-baht-text)
import { ThaiBahtText } from 'thai-baht-text';
ThaiBahtText(1234.56) // "หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบหกสตางค์"
```

### Buddhist Calendar / Date Handling

**Approach: Simple arithmetic + react-day-picker v9 Buddhist calendar.**

No special date library needed. Buddhist Era year = Gregorian year + 543.

```typescript
// Display Buddhist year
const getBuddhistYear = (date: Date): number => date.getFullYear() + 543;

// Format Thai date: "23 มีนาคม 2569"
const formatThaiDate = (date: Date): string => {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
    calendar: 'buddhist'
  }).format(date);
};
```

For date picker UI, upgrade react-day-picker to v9.14.0:
```typescript
import { DayPicker } from 'react-day-picker/buddhist';
// Automatically displays B.E. years, Thai locale, Thai numerals
```

### Revenue Department e-Filing Export

**Format: Pipe-delimited TXT files (not XML) for most forms.**

The Revenue Department's RD Prep program accepts pipe-delimited ("|") .txt files or .csv files. These are converted to .rdx format by RD Prep for upload to efiling.rd.go.th.

Key forms and their export approach:
- **ภ.ง.ด.3 (WHT for individuals)**: Pipe-delimited TXT with fields: tax ID, name, address, income type, payment amount, WHT rate, WHT amount, etc.
- **ภ.ง.ด.53 (WHT for companies)**: Same format as ภ.ง.ด.3, different income type codes
- **ภ.พ.30 (monthly VAT)**: Form data + purchase/sales tax ledger as attachment

**Important: There is NO public Revenue Department API.** All e-filing is manual upload through the RD Prep program or the efiling.rd.go.th web portal. BanChee generates the file, user uploads manually.

**For e-Tax Invoice XML:** The ETDA standard ขมธอ.3-2560 defines XML schema for electronic tax invoices and receipts. This is out of scope for v1 (requires digital certificate from a Certificate Authority + Revenue Department registration). Deferred to v2.

### Thai OCR / Receipt Scanning

**Use existing LLM vision pipeline -- do NOT add Tesseract.**

The existing TaxHacker AI pipeline already supports vision-based document analysis via GPT-4o, Gemini, and Mistral. Research shows:
- LLM vision APIs achieve 91-94% accuracy on receipt/invoice extraction
- Tesseract achieves ~87% on Thai documents and requires significant preprocessing
- LLMs handle structured data extraction (JSON output) natively
- The existing LangChain pipeline with `.withStructuredOutput()` is the ideal approach

Enhancement: Add Thai-specific extraction fields to the AI prompt:
- เลขประจำตัวผู้เสียภาษี (Tax ID, 13 digits)
- สาขาที่ (Branch number, 5 digits, "00000" for head office)
- ภาษีมูลค่าเพิ่ม (VAT amount)
- อัตราหัก ณ ที่จ่าย (WHT rate: 1%, 2%, 3%, 5%)
- ประเภทเงินได้ (Income type code for WHT classification)

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| i18n | next-intl ^4.8.3 | react-i18next | react-i18next requires client-side provider wrapping incompatible with Server Components. next-i18next is Pages Router only. |
| i18n | next-intl ^4.8.3 | Intlayer | Newer, smaller community, less battle-tested. next-intl has 4800+ GitHub stars and proven Next.js 15 support. |
| Excel | exceljs ^4.4.0 | SheetJS (xlsx) community | SheetJS community edition lacks cell styling -- Thai accountant reports require borders, merged cells, number formats, colored headers. SheetJS Pro is paid. Also has known security vulnerabilities. |
| Excel | exceljs ^4.4.0 | xlsx-populate | Less maintained (last npm publish 5+ years ago), smaller community. |
| PDF | @react-pdf/renderer (keep) | pdfmake | Already in codebase. Switching adds migration risk and increases bundle. Font.register() API works for Thai fonts. |
| PDF | @react-pdf/renderer (keep) | Puppeteer | Requires headless Chrome in Docker (heavy), serverless-hostile, overkill for structured tax form PDFs. Only advantage is better non-Latin font support, but @react-pdf/renderer works with registered Thai fonts. |
| Buddhist date | react-day-picker v9 (upgrade) | thaidatepicker-react | thaidatepicker-react is a separate library adding a new dependency. react-day-picker is already installed -- upgrading to v9 gives native Buddhist calendar. Fewer dependencies, better maintained. |
| Buddhist date | Simple arithmetic + Intl.DateTimeFormat | date-fns-buddhist-adapter | date-fns-buddhist-adapter has 717 weekly downloads (low adoption). Built-in Intl.DateTimeFormat with `calendar: 'buddhist'` handles formatting. Simple year+543 arithmetic handles conversion. No library needed. |
| Baht text | thai-baht-text ^2.0.5 | @n0uur/thaibaht-text | thai-baht-text is TypeScript-native, more downloads, MIT license. @n0uur/thaibaht-text is wrapper around other libs. |
| Baht text | thai-baht-text ^2.0.5 | bahttext | bahttext has fewer features, less TypeScript support. |
| Thai OCR | Existing LLM vision pipeline | Tesseract.js | LLM vision APIs outperform Tesseract on Thai documents (94% vs 87%). Tesseract requires preprocessing, language training data, and cannot output structured JSON natively. LangChain pipeline already handles this. |
| Tax calculation | Pure TypeScript functions | External tax API | No Thai tax calculation API exists. Tax rules are simple enough for pure TypeScript (flat 7% VAT, progressive WHT rates, progressive CIT brackets). Self-hosted requirement means no external API dependencies. |
| RD filing | Pipe-delimited TXT export + manual upload | Direct API submission | rd.go.th has no public API. Manual upload via RD Prep is the standard workflow used by all Thai accounting software including FlowAccount and PEAK. |
| FlowAccount compat | Excel/CSV export matching FA format | FlowAccount API SDK | FlowAccount has a TypeScript SDK (flowaccount-openapi-sdk on GitHub) but requires subscription and API credentials. Export in compatible Excel format is simpler and works for all accountants, not just FlowAccount users. |
| Web font | @fontsource/noto-sans-thai | Google Fonts CDN | Self-hosted app should not depend on external CDNs. Fontsource provides npm package for self-hosting. Privacy-first approach. |

## Installation

```bash
# New dependencies
npm install next-intl exceljs thai-baht-text @fontsource/noto-sans-thai

# Upgrade react-day-picker from v8 to v9 for Buddhist calendar
npm install react-day-picker@^9.14.0

# Thai font for PDF generation (manual download, not npm)
# Download TH Sarabun New from: https://www.f0nt.com/release/th-sarabun-new/
# Place THSarabunNew.ttf and THSarabunNew-Bold.ttf in: public/fonts/
# Also download Noto Sans Thai from Google Fonts as fallback
```

## No Additional Infrastructure

BanChee runs as a single Docker container with PostgreSQL. The Thai tax extension does NOT require:
- Redis or message queues (tax calculations are synchronous)
- Background worker processes (deadline reminders shown on dashboard load)
- External APIs (all tax calculation is local pure TypeScript)
- Additional file storage services (uses existing local filesystem)
- Cloud services of any kind (self-hosted first)
- Additional system dependencies in Docker (Ghostscript + GraphicsMagick already present)
- Tesseract OCR engine (LLM vision pipeline handles Thai receipt scanning)

## Docker Impact

The only Docker change needed is adding Thai font files to the image:

```dockerfile
# Add Thai fonts for PDF generation
COPY public/fonts/THSarabunNew*.ttf /usr/share/fonts/thai/
COPY public/fonts/NotoSansThai*.ttf /usr/share/fonts/thai/
RUN fc-cache -fv
```

## Configuration Impact

New environment variables (all optional):

```env
# No new required env vars for Thai tax features
# next-intl uses file-based translations (messages/th.json, messages/en.json)
# Tax rules are hardcoded as constants (they change infrequently)
# Thai font paths are convention-based (public/fonts/)
```

## Dependency Risk Assessment

| Dependency | Weekly Downloads | Last Published | Risk |
|------------|-----------------|----------------|------|
| next-intl | ~500K+ | 1 month ago (v4.8.3) | LOW - actively maintained, large community |
| exceljs | ~1M+ | 2 years ago (v4.4.0) | LOW-MEDIUM - stable but not recently updated. Feature-complete for our needs. |
| thai-baht-text | ~1K | 1 year ago (v2.0.5) | LOW - small niche library but does one thing well. Easy to vendor/fork if abandoned. |
| @fontsource/noto-sans-thai | N/A | Active | LOW - Google-backed font project |
| react-day-picker v9 | ~2M+ | 22 days ago (v9.14.0) | LOW - very actively maintained |

## Sources

- [next-intl official docs - App Router setup](https://next-intl.dev/docs/getting-started/app-router) -- confirmed v4.8.3, Server Component support [HIGH]
- [next-intl v4.0 announcement](https://next-intl.dev/blog/next-intl-4-0) -- confirmed stable release [HIGH]
- [ExcelJS GitHub](https://github.com/exceljs/exceljs) -- v4.4.0, TypeScript types built-in [HIGH]
- [ExcelJS npm](https://www.npmjs.com/package/exceljs) -- confirmed version and features [HIGH]
- [@react-pdf/renderer font docs](https://react-pdf.org/fonts) -- Font.register() API [HIGH]
- [Thai Font in React-pdf (Medium)](https://mchayapol.medium.com/thai-font-%E0%B9%83%E0%B8%99-react-pdf-48049c9d54a5) -- working example with TH Sarabun [MEDIUM]
- [react-pdf Thai character issue #633](https://github.com/diegomura/react-pdf/issues/633) -- historical issues noted [MEDIUM]
- [thai-baht-text npm](https://www.npmjs.com/package/thai-baht-text) -- v2.0.5, TypeScript, MIT [HIGH]
- [thai-baht-text GitHub](https://github.com/antronic/thai-baht-text-js) -- source code, examples [HIGH]
- [react-day-picker Buddhist calendar](https://daypicker.dev/docs/localization) -- v9.11.0+ Buddhist calendar support [HIGH]
- [react-day-picker changelog](https://daypicker.dev/changelog) -- v9.14.0 latest [HIGH]
- [Intl.NumberFormat MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) -- Thai locale + Buddhist calendar built-in [HIGH]
- [Noto Sans Thai - Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+Thai) -- SIL Open Font License [HIGH]
- [@fontsource/noto-sans-thai npm](https://www.npmjs.com/package/@fontsource/noto-sans-thai) -- self-hosted font package [HIGH]
- [ETDA e-Tax Invoice standard](https://standard.etda.or.th/?page_id=4922) -- ขมธอ.3-2560 XML specification [MEDIUM]
- [RD e-Filing portal](https://efiling.rd.go.th/rd-cms/) -- RD Prep program download, form filing [HIGH]
- [Leceipt RD Prep guide](https://www.leceipt.com/docs/etax/%E0%B8%A0%E0%B8%87%E0%B8%943-rd-prep) -- pipe-delimited format confirmed [MEDIUM]
- [FlowAccount developer portal](https://developers.flowaccount.com/) -- TypeScript SDK, Open API [MEDIUM]
- [FlowAccount GitHub SDK](https://github.com/flowaccount/flowaccount-openapi-sdk) -- TypeScript-Node client available [MEDIUM]
- [LLM vs OCR comparison (Koncile)](https://www.koncile.ai/en/ressources/claude-gpt-or-gemini-which-is-the-best-llm-for-invoice-extraction) -- 91-94% accuracy for LLM vision [MEDIUM]
- [Thai receipt OCR research (ACM 2024)](https://dl.acm.org/doi/full/10.1145/3704391.3704407) -- 87.37% accuracy for traditional OCR on Thai receipts [MEDIUM]

---

*Stack research: 2026-03-23*
