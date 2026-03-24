/**
 * FlowAccount-compatible CSV export generator.
 *
 * Produces a comma-delimited CSV that can be imported into FlowAccount,
 * Thailand's popular cloud accounting platform. Dates use Gregorian
 * format (dd/mm/yyyy) per FlowAccount convention. Amounts are in baht
 * with 2 decimal places.
 *
 * Uses @fast-csv/format (already installed) for CSV generation.
 */

import { format } from "@fast-csv/format"

// ── Types ────────────────────────────────────────────────────

/**
 * Transaction data shaped for FlowAccount CSV export.
 * Callers map Prisma transaction data into this type before export.
 */
export type FlowAccountTransaction = {
  date: Date | null
  documentNumber: string | null
  description: string | null
  type: "income" | "expense"
  amount: number // satang
  vatAmount: number // satang
  category: string | null
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Convert satang integer to baht string with 2 decimal places.
 */
function satangToBaht(satang: number): string {
  return (satang / 100).toFixed(2)
}

/**
 * Format date as dd/mm/yyyy (Gregorian, not B.E.).
 * FlowAccount uses Gregorian dates.
 */
function formatDateForFlowAccount(date: Date | null): string {
  if (!date) return ""
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// ── CSV Columns ──────────────────────────────────────────────

const CSV_HEADERS = [
  "Date",
  "DocumentNo",
  "Description",
  "Type",
  "Amount",
  "VATAmount",
  "Category",
]

// ── Generator ────────────────────────────────────────────────

/**
 * Generate a FlowAccount-compatible CSV string from transactions.
 * Returns header row + data rows. Empty array returns header only.
 */
export async function generateFlowAccountCSV(
  transactions: FlowAccountTransaction[]
): Promise<string> {
  // fast-csv only emits headers when at least one row is written.
  // For empty input, return a manually-built header line.
  if (transactions.length === 0) {
    return CSV_HEADERS.join(",") + "\n"
  }

  return new Promise<string>((resolve, reject) => {
    const chunks: string[] = []

    const csvStream = format({
      headers: CSV_HEADERS,
      writeHeaders: true,
    })

    csvStream.on("data", (chunk: Buffer | string) => {
      chunks.push(chunk.toString())
    })

    csvStream.on("end", () => {
      resolve(chunks.join(""))
    })

    csvStream.on("error", (err: Error) => {
      reject(err)
    })

    for (const txn of transactions) {
      csvStream.write({
        Date: formatDateForFlowAccount(txn.date),
        DocumentNo: txn.documentNumber || "",
        Description: txn.description || "",
        Type: txn.type,
        Amount: satangToBaht(txn.amount),
        VATAmount: satangToBaht(txn.vatAmount),
        Category: txn.category || "",
      })
    }

    csvStream.end()
  })
}
