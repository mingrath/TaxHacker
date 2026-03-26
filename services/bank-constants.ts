/**
 * Bank reconciliation constants and types.
 *
 * Separated from bank-statement-parser.ts so client components
 * can import these without pulling in @fast-csv/parse (which requires Node.js `fs`).
 */

export type ColumnMapping = {
  date: number
  description: number
  deposit: number | null
  withdrawal: number | null
  balance: number | null
  reference: number | null
}

export type BankPreset = {
  label: string
  labelTh: string
  defaultMapping: ColumnMapping
  defaultSkipLines: number
  encoding: "utf-8" | "windows-874"
  dateFormat: "DD/MM/YYYY" | "YYYY-MM-DD"
  useBuddhistEra: boolean
}

export const BANK_PRESETS: Record<string, BankPreset> = {
  kbank: {
    label: "KBank",
    labelTh: "กสิกรไทย",
    defaultMapping: { date: 0, description: 1, withdrawal: 2, deposit: 3, balance: 4, reference: null },
    defaultSkipLines: 1,
    encoding: "windows-874",
    dateFormat: "DD/MM/YYYY",
    useBuddhistEra: true,
  },
  scb: {
    label: "SCB",
    labelTh: "ไทยพาณิชย์",
    defaultMapping: { date: 0, description: 1, withdrawal: 2, deposit: 3, balance: 4, reference: null },
    defaultSkipLines: 1,
    encoding: "utf-8",
    dateFormat: "DD/MM/YYYY",
    useBuddhistEra: false,
  },
  bbl: {
    label: "BBL",
    labelTh: "กรุงเทพ",
    defaultMapping: { date: 0, description: 1, withdrawal: 2, deposit: 3, balance: 4, reference: null },
    defaultSkipLines: 1,
    encoding: "utf-8",
    dateFormat: "DD/MM/YYYY",
    useBuddhistEra: false,
  },
}
