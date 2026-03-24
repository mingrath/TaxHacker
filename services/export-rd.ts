/**
 * Revenue Department pipe-delimited TXT export generators.
 *
 * Generates PP30 (VAT return), PND3 (WHT for individuals),
 * and PND53 (WHT for companies) in pipe-delimited format
 * compatible with RD e-Filing upload.
 *
 * All amounts stored as satang in the database are converted
 * to baht (2 decimal places) for output. Dates use Buddhist Era.
 */

import type { VATReportData } from "@/app/(app)/apps/vat-report/actions"
import type { WHTReportData, WHTTransactionForReport, WHTReportSummary } from "@/app/(app)/apps/wht-report/actions"
import { toBuddhistYear } from "@/services/thai-date"

// ── Helpers ──────────────────────────────────────────────────

/**
 * Convert satang integer to baht string with 2 decimal places.
 * e.g., 10000 -> "100.00"
 */
function satangToBaht(satang: number): string {
  return (satang / 100).toFixed(2)
}

/**
 * Format a Date for RD export: dd/mm/YYYY where YYYY is Buddhist Era.
 * Returns empty string for null dates.
 */
function formatDateForRD(date: Date | null): string {
  if (!date) return ""
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const beYear = toBuddhistYear(date.getFullYear())
  return `${day}/${month}/${beYear}`
}

// ── PP30 (VAT Return) ───────────────────────────────────────

const PP30_HEADER = [
  "TaxID",
  "Branch",
  "Month",
  "Year",
  "SalesAmount",
  "OutputTax",
  "PurchaseAmount",
  "InputTax",
  "TaxPayable",
  "ExcessTax",
  "NetPayable",
  "NetExcess",
  "Surcharge",
  "Penalty",
  "TotalPayable",
  "TotalExcess",
].join("|")

/**
 * Generate PP30 pipe-delimited TXT for Revenue Department upload.
 * Contains one header row and one data row with all PP30 fields.
 */
export function generatePP30Txt(data: VATReportData): string {
  const { businessProfile, period, pp30Fields } = data
  const beYear = toBuddhistYear(period.year)

  const dataRow = [
    businessProfile.taxId,
    businessProfile.branch,
    String(period.month),
    String(beYear),
    satangToBaht(pp30Fields.salesAmount),
    satangToBaht(pp30Fields.outputTax),
    satangToBaht(pp30Fields.purchaseAmount),
    satangToBaht(pp30Fields.inputTax),
    satangToBaht(pp30Fields.taxPayable),
    satangToBaht(pp30Fields.excessTax),
    satangToBaht(pp30Fields.netPayable),
    satangToBaht(pp30Fields.netExcess),
    satangToBaht(pp30Fields.surcharge),
    satangToBaht(pp30Fields.penalty),
    satangToBaht(pp30Fields.totalPayable),
    satangToBaht(pp30Fields.totalExcess),
  ].join("|")

  return `${PP30_HEADER}\n${dataRow}\n`
}

// ── PND3 / PND53 (WHT Returns) ──────────────────────────────

const PND_HEADER = [
  "Seq",
  "TaxID",
  "Name",
  "Address",
  "PaymentDate",
  "Description",
  "TaxRate",
  "IncomeAmount",
  "TaxAmount",
  "Condition",
].join("|")

/**
 * Generate a pipe-delimited TXT for PND attachment rows.
 * Shared logic between PND3 and PND53 -- caller provides the
 * filtered transaction list and matching summary.
 */
function generatePNDTxt(
  transactions: WHTTransactionForReport[],
  summary: WHTReportSummary
): string {
  const rows: string[] = [PND_HEADER]

  for (const txn of transactions) {
    const row = [
      String(txn.sequenceNumber),
      txn.contactTaxId || "",
      txn.contactName || txn.merchant || "",
      txn.contactAddress || "",
      formatDateForRD(txn.issuedAt),
      txn.description || "",
      (txn.whtRate / 100).toFixed(2), // basis points to percent
      satangToBaht(txn.subtotal),
      satangToBaht(txn.whtAmount),
      "1", // Condition 1 = WHT deducted
    ].join("|")
    rows.push(row)
  }

  // Summary TOTAL row
  const totalRow = [
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    "",
    satangToBaht(summary.totalIncomePaid),
    satangToBaht(summary.totalTaxWithheld),
    "",
  ].join("|")
  rows.push(totalRow)

  return rows.join("\n") + "\n"
}

/**
 * Generate PND3 pipe-delimited TXT (WHT for individuals).
 * Uses pnd3Transactions and pnd3Summary from WHTReportData.
 */
export function generatePND3Txt(data: WHTReportData): string {
  return generatePNDTxt(data.pnd3Transactions, data.pnd3Summary)
}

/**
 * Generate PND53 pipe-delimited TXT (WHT for companies).
 * Uses pnd53Transactions and pnd53Summary from WHTReportData.
 */
export function generatePND53Txt(data: WHTReportData): string {
  return generatePNDTxt(data.pnd53Transactions, data.pnd53Summary)
}
