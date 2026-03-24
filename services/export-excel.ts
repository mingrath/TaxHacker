/**
 * Thai accountant Excel workbook generator using ExcelJS.
 *
 * Produces an .xlsx workbook with 5 worksheets matching standard
 * Thai accounting report formats:
 *   1. Purchase Tax Report (รายงานภาษีซื้อ)
 *   2. Sales Tax Report (รายงานภาษีขาย)
 *   3. PP30 Summary (สรุป ภ.พ.30)
 *   4. WHT Summary (สรุปภาษีหัก ณ ที่จ่าย)
 *   5. Income/Expense (รายได้-รายจ่าย)
 *
 * All amounts stored as satang in the database are converted to baht
 * (numeric) for cell values. ExcelJS handles display formatting.
 */

import ExcelJS from "exceljs"
import type { VATReportData, TransactionForReport } from "@/app/(app)/apps/vat-report/actions"
import type { WHTReportData, WHTTransactionForReport } from "@/app/(app)/apps/wht-report/actions"
import type { BusinessProfile } from "@/models/business-profile"
import { toBuddhistYear } from "@/services/thai-date"

// ── Types ────────────────────────────────────────────────────

export type IncomeExpenseRow = {
  date: Date | null
  description: string | null
  type: "income" | "expense"
  amount: number // satang
  vatAmount: number // satang
  category: string | null
}

export type ExportDataForExcel = {
  vatData: VATReportData
  whtData: WHTReportData
  incomeExpenseTransactions: IncomeExpenseRow[]
  businessProfile: BusinessProfile
  period: { month: number; year: number }
}

// ── Helpers ──────────────────────────────────────────────────

/** Convert satang to baht (numeric for ExcelJS formatting). */
function satangToBaht(satang: number): number {
  return satang / 100
}

/** Format date for Excel display: dd/mm/yyyy B.E. */
function formatDateForExcel(date: Date | null): string {
  if (!date) return ""
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const beYear = toBuddhistYear(date.getFullYear())
  return `${day}/${month}/${beYear}`
}

/** Thai month names */
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

// ── Styling constants ────────────────────────────────────────

const CURRENCY_FORMAT = "#,##0.00"

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF2F2F2" },
}

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 11,
}

const COVER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 13,
}

const SECTION_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 12,
}

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
}

// ── Cover rows ───────────────────────────────────────────────

function addCoverRows(
  ws: ExcelJS.Worksheet,
  profile: BusinessProfile,
  period: { month: number; year: number },
  title: string
): number {
  const beYear = toBuddhistYear(period.year)
  const monthName = THAI_MONTHS[period.month - 1]

  ws.addRow([profile.companyName]).font = COVER_FONT
  ws.addRow([`เลขประจำตัวผู้เสียภาษี: ${profile.taxId}  สาขา: ${profile.branch}`])
  ws.addRow([`${title} ประจำเดือน ${monthName} พ.ศ. ${beYear}`])
  ws.addRow([]) // blank row

  return 4 // number of cover rows added
}

// ── Worksheet builders ───────────────────────────────────────

/**
 * Worksheet 1: Purchase Tax Report (รายงานภาษีซื้อ)
 * Per THAI_TAX_REFERENCE Section 4.
 */
function buildPurchaseTax(
  wb: ExcelJS.Workbook,
  data: ExportDataForExcel
): void {
  const ws = wb.addWorksheet("รายงานภาษีซื้อ")

  // Column widths
  ws.columns = [
    { width: 8 },  // seq
    { width: 15 }, // date
    { width: 18 }, // invoice no
    { width: 30 }, // seller name
    { width: 18 }, // tax id
    { width: 12 }, // branch
    { width: 18 }, // amount
    { width: 18 }, // vat
  ]

  addCoverRows(ws, data.businessProfile, data.period, "รายงานภาษีซื้อ")

  // Header row
  const headerRow = ws.addRow([
    "ลำดับที่",
    "วัน เดือน ปี",
    "เลขที่",
    "ชื่อผู้ขาย",
    "เลขประจำตัวผู้เสียภาษี",
    "สาขา",
    "มูลค่าสินค้า/บริการ",
    "ภาษีมูลค่าเพิ่ม",
  ])
  headerRow.font = HEADER_FONT
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.border = THIN_BORDER
  })

  // Data rows
  let totalSubtotal = 0
  let totalVat = 0

  for (const txn of data.vatData.inputTransactions) {
    const subtotalBaht = satangToBaht(txn.subtotal)
    const vatBaht = satangToBaht(txn.vatAmount)
    totalSubtotal += subtotalBaht
    totalVat += vatBaht

    const row = ws.addRow([
      txn.sequenceNumber,
      formatDateForExcel(txn.issuedAt),
      txn.documentNumber || "",
      txn.merchant || "",
      txn.merchantTaxId || "",
      txn.merchantBranch || "",
      subtotalBaht,
      vatBaht,
    ])
    row.getCell(7).numFmt = CURRENCY_FORMAT
    row.getCell(8).numFmt = CURRENCY_FORMAT
    row.eachCell((cell) => { cell.border = THIN_BORDER })
  }

  // Totals row
  const totalsRow = ws.addRow([
    "",
    "",
    "",
    "",
    "",
    "รวม",
    totalSubtotal,
    totalVat,
  ])
  totalsRow.font = HEADER_FONT
  totalsRow.getCell(7).numFmt = CURRENCY_FORMAT
  totalsRow.getCell(8).numFmt = CURRENCY_FORMAT
  totalsRow.eachCell((cell) => { cell.border = THIN_BORDER })
}

/**
 * Worksheet 2: Sales Tax Report (รายงานภาษีขาย)
 * Same structure as Purchase Tax but for output transactions.
 */
function buildSalesTax(
  wb: ExcelJS.Workbook,
  data: ExportDataForExcel
): void {
  const ws = wb.addWorksheet("รายงานภาษีขาย")

  ws.columns = [
    { width: 8 },
    { width: 15 },
    { width: 18 },
    { width: 30 },
    { width: 18 },
    { width: 12 },
    { width: 18 },
    { width: 18 },
  ]

  addCoverRows(ws, data.businessProfile, data.period, "รายงานภาษีขาย")

  const headerRow = ws.addRow([
    "ลำดับที่",
    "วัน เดือน ปี",
    "เลขที่",
    "ชื่อผู้ซื้อ",
    "เลขประจำตัวผู้เสียภาษี",
    "สาขา",
    "มูลค่าสินค้า/บริการ",
    "ภาษีมูลค่าเพิ่ม",
  ])
  headerRow.font = HEADER_FONT
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.border = THIN_BORDER
  })

  let totalSubtotal = 0
  let totalVat = 0

  for (const txn of data.vatData.outputTransactions) {
    const subtotalBaht = satangToBaht(txn.subtotal)
    const vatBaht = satangToBaht(txn.vatAmount)
    totalSubtotal += subtotalBaht
    totalVat += vatBaht

    const row = ws.addRow([
      txn.sequenceNumber,
      formatDateForExcel(txn.issuedAt),
      txn.documentNumber || "",
      txn.merchant || "",
      txn.merchantTaxId || "",
      txn.merchantBranch || "",
      subtotalBaht,
      vatBaht,
    ])
    row.getCell(7).numFmt = CURRENCY_FORMAT
    row.getCell(8).numFmt = CURRENCY_FORMAT
    row.eachCell((cell) => { cell.border = THIN_BORDER })
  }

  const totalsRow = ws.addRow([
    "",
    "",
    "",
    "",
    "",
    "รวม",
    totalSubtotal,
    totalVat,
  ])
  totalsRow.font = HEADER_FONT
  totalsRow.getCell(7).numFmt = CURRENCY_FORMAT
  totalsRow.getCell(8).numFmt = CURRENCY_FORMAT
  totalsRow.eachCell((cell) => { cell.border = THIN_BORDER })
}

/**
 * Worksheet 3: PP30 Summary (สรุป ภ.พ.30)
 * Two-column layout with Thai field labels and amounts.
 * Per THAI_TAX_REFERENCE Section 5.
 */
function buildPP30Summary(
  wb: ExcelJS.Workbook,
  data: ExportDataForExcel
): void {
  const ws = wb.addWorksheet("สรุป ภ.พ.30")

  ws.columns = [
    { width: 8 },  // field number
    { width: 50 }, // label
    { width: 20 }, // amount
  ]

  addCoverRows(ws, data.businessProfile, data.period, "สรุป ภ.พ.30")

  const pp30 = data.vatData.pp30Fields

  const PP30_ROWS: Array<[string, string, number]> = [
    ["1", "ยอดขายในเดือนนี้", pp30.salesAmount],
    ["2", "หัก ยอดขายที่เสียภาษีในอัตราร้อยละ 0", pp30.zeroRateSales],
    ["3", "หัก ยอดขายที่ได้รับยกเว้น", pp30.exemptSales],
    ["4", "ยอดขายที่เสียภาษี (1)-(2)-(3)", pp30.taxableSales],
    ["5", "ภาษีขายเดือนนี้", pp30.outputTax],
    ["6", "ยอดซื้อในเดือนนี้", pp30.purchaseAmount],
    ["7", "ภาษีซื้อเดือนนี้", pp30.inputTax],
    ["8", "ภาษีที่ชำระเกินนำมาหัก (5)>(7)", pp30.taxPayable],
    ["9", "ภาษีที่ชำระไว้เกิน (7)>(5)", pp30.excessTax],
    ["10", "ภาษีที่ชำระเกินยกมา", pp30.carriedForward],
    ["11", "ภาษีที่ต้องชำระ (8)-(10)", pp30.netPayable],
    ["12", "ภาษีที่ชำระไว้เกินสุทธิ", pp30.netExcess],
    ["13", "เงินเพิ่ม", pp30.surcharge],
    ["14", "เบี้ยปรับ", pp30.penalty],
    ["15", "รวมภาษีที่ต้องชำระ (11)+(13)+(14)", pp30.totalPayable],
    ["16", "รวมภาษีที่ชำระไว้เกิน", pp30.totalExcess],
  ]

  // Header
  const headerRow = ws.addRow(["ข้อ", "รายการ", "จำนวนเงิน (บาท)"])
  headerRow.font = HEADER_FONT
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.border = THIN_BORDER
  })

  for (const [field, label, satangValue] of PP30_ROWS) {
    const row = ws.addRow([field, label, satangToBaht(satangValue)])
    row.getCell(3).numFmt = CURRENCY_FORMAT
    row.eachCell((cell) => { cell.border = THIN_BORDER })
  }
}

/**
 * Worksheet 4: WHT Summary (สรุปภาษีหัก ณ ที่จ่าย)
 * PND3 section, then PND53 section, each with transaction rows and subtotals.
 */
function buildWHTSummary(
  wb: ExcelJS.Workbook,
  data: ExportDataForExcel
): void {
  const ws = wb.addWorksheet("สรุปภาษีหัก ณ ที่จ่าย")

  ws.columns = [
    { width: 8 },  // seq
    { width: 25 }, // name
    { width: 18 }, // tax id
    { width: 15 }, // date
    { width: 25 }, // description
    { width: 10 }, // rate %
    { width: 18 }, // income
    { width: 18 }, // wht amount
  ]

  addCoverRows(ws, data.businessProfile, data.period, "สรุปภาษีหัก ณ ที่จ่าย")

  const whtHeaders = [
    "ลำดับ",
    "ชื่อผู้มีเงินได้",
    "เลขประจำตัวผู้เสียภาษี",
    "วันที่จ่าย",
    "รายละเอียด",
    "อัตรา (%)",
    "จำนวนเงินที่จ่าย",
    "ภาษีที่หัก",
  ]

  // ── PND3 section ──
  const pnd3TitleRow = ws.addRow(["ภ.ง.ด.3 (บุคคลธรรมดา)"])
  pnd3TitleRow.font = SECTION_FONT

  const pnd3Header = ws.addRow(whtHeaders)
  pnd3Header.font = HEADER_FONT
  pnd3Header.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.border = THIN_BORDER
  })

  addWHTTransactionRows(ws, data.whtData.pnd3Transactions)

  // PND3 subtotal
  const pnd3TotalRow = ws.addRow([
    "",
    "",
    "",
    "",
    "รวม ภ.ง.ด.3",
    "",
    satangToBaht(data.whtData.pnd3Summary.totalIncomePaid),
    satangToBaht(data.whtData.pnd3Summary.totalTaxWithheld),
  ])
  pnd3TotalRow.font = HEADER_FONT
  pnd3TotalRow.getCell(7).numFmt = CURRENCY_FORMAT
  pnd3TotalRow.getCell(8).numFmt = CURRENCY_FORMAT
  pnd3TotalRow.eachCell((cell) => { cell.border = THIN_BORDER })

  // Blank separator
  ws.addRow([])

  // ── PND53 section ──
  const pnd53TitleRow = ws.addRow(["ภ.ง.ด.53 (นิติบุคคล)"])
  pnd53TitleRow.font = SECTION_FONT

  const pnd53Header = ws.addRow(whtHeaders)
  pnd53Header.font = HEADER_FONT
  pnd53Header.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.border = THIN_BORDER
  })

  addWHTTransactionRows(ws, data.whtData.pnd53Transactions)

  // PND53 subtotal
  const pnd53TotalRow = ws.addRow([
    "",
    "",
    "",
    "",
    "รวม ภ.ง.ด.53",
    "",
    satangToBaht(data.whtData.pnd53Summary.totalIncomePaid),
    satangToBaht(data.whtData.pnd53Summary.totalTaxWithheld),
  ])
  pnd53TotalRow.font = HEADER_FONT
  pnd53TotalRow.getCell(7).numFmt = CURRENCY_FORMAT
  pnd53TotalRow.getCell(8).numFmt = CURRENCY_FORMAT
  pnd53TotalRow.eachCell((cell) => { cell.border = THIN_BORDER })

  // Blank + grand total
  ws.addRow([])
  const grandTotalIncome =
    satangToBaht(data.whtData.pnd3Summary.totalIncomePaid) +
    satangToBaht(data.whtData.pnd53Summary.totalIncomePaid)
  const grandTotalWht =
    satangToBaht(data.whtData.pnd3Summary.totalTaxWithheld) +
    satangToBaht(data.whtData.pnd53Summary.totalTaxWithheld)

  const grandTotalRow = ws.addRow([
    "",
    "",
    "",
    "",
    "รวมทั้งสิ้น",
    "",
    grandTotalIncome,
    grandTotalWht,
  ])
  grandTotalRow.font = { bold: true, size: 12 }
  grandTotalRow.getCell(7).numFmt = CURRENCY_FORMAT
  grandTotalRow.getCell(8).numFmt = CURRENCY_FORMAT
  grandTotalRow.eachCell((cell) => { cell.border = THIN_BORDER })
}

/** Add WHT transaction data rows to a worksheet. */
function addWHTTransactionRows(
  ws: ExcelJS.Worksheet,
  transactions: WHTTransactionForReport[]
): void {
  for (const txn of transactions) {
    const row = ws.addRow([
      txn.sequenceNumber,
      txn.contactName || txn.merchant || "",
      txn.contactTaxId || "",
      formatDateForExcel(txn.issuedAt),
      txn.description || "",
      (txn.whtRate / 100).toFixed(2),
      satangToBaht(txn.subtotal),
      satangToBaht(txn.whtAmount),
    ])
    row.getCell(7).numFmt = CURRENCY_FORMAT
    row.getCell(8).numFmt = CURRENCY_FORMAT
    row.eachCell((cell) => { cell.border = THIN_BORDER })
  }
}

/**
 * Worksheet 5: Income/Expense (รายได้-รายจ่าย)
 * All transactions with type, running totals, and profit summary.
 */
function buildIncomeExpense(
  wb: ExcelJS.Workbook,
  data: ExportDataForExcel
): void {
  const ws = wb.addWorksheet("รายได้-รายจ่าย")

  ws.columns = [
    { width: 15 }, // date
    { width: 35 }, // description
    { width: 12 }, // type
    { width: 18 }, // amount
    { width: 18 }, // vat
    { width: 20 }, // category
  ]

  addCoverRows(ws, data.businessProfile, data.period, "รายได้-รายจ่าย")

  const headerRow = ws.addRow([
    "วันที่",
    "รายละเอียด",
    "ประเภท",
    "จำนวนเงิน",
    "ภาษีมูลค่าเพิ่ม",
    "หมวดหมู่",
  ])
  headerRow.font = HEADER_FONT
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.border = THIN_BORDER
  })

  let totalIncome = 0
  let totalExpense = 0

  for (const txn of data.incomeExpenseTransactions) {
    const amountBaht = satangToBaht(txn.amount)
    const vatBaht = satangToBaht(txn.vatAmount)

    if (txn.type === "income") {
      totalIncome += amountBaht
    } else {
      totalExpense += amountBaht
    }

    const row = ws.addRow([
      formatDateForExcel(txn.date),
      txn.description || "",
      txn.type === "income" ? "รายได้" : "รายจ่าย",
      amountBaht,
      vatBaht,
      txn.category || "",
    ])
    row.getCell(4).numFmt = CURRENCY_FORMAT
    row.getCell(5).numFmt = CURRENCY_FORMAT
    row.eachCell((cell) => { cell.border = THIN_BORDER })
  }

  // Summary rows
  ws.addRow([])

  const incomeRow = ws.addRow(["", "", "รวมรายได้", totalIncome, "", ""])
  incomeRow.font = HEADER_FONT
  incomeRow.getCell(4).numFmt = CURRENCY_FORMAT

  const expenseRow = ws.addRow(["", "", "รวมรายจ่าย", totalExpense, "", ""])
  expenseRow.font = HEADER_FONT
  expenseRow.getCell(4).numFmt = CURRENCY_FORMAT

  const profitRow = ws.addRow(["", "", "กำไร (ขาดทุน)", totalIncome - totalExpense, "", ""])
  profitRow.font = { bold: true, size: 12 }
  profitRow.getCell(4).numFmt = CURRENCY_FORMAT
}

// ── Main generator ───────────────────────────────────────────

/**
 * Generate a Thai accountant Excel workbook with 5 worksheets.
 * Returns a Buffer containing the .xlsx file data.
 */
export async function generateAccountantExcel(
  data: ExportDataForExcel
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "BanChee"
  workbook.created = new Date()

  buildPurchaseTax(workbook, data)
  buildSalesTax(workbook, data)
  buildPP30Summary(workbook, data)
  buildWHTSummary(workbook, data)
  buildIncomeExpense(workbook, data)

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
