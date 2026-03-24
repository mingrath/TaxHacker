import { describe, it, expect } from "vitest"
import { generatePP30Txt, generatePND3Txt, generatePND53Txt } from "./export-rd"
import type { VATReportData, PP30Fields, TransactionForReport } from "@/app/(app)/apps/vat-report/actions"
import type { WHTReportData, WHTTransactionForReport, WHTReportSummary } from "@/app/(app)/apps/wht-report/actions"
import type { BusinessProfile } from "@/models/business-profile"

// ── Helpers ──────────────────────────────────────────────────

function makeBusinessProfile(overrides: Partial<BusinessProfile> = {}): BusinessProfile {
  return {
    companyName: "Test Company Co., Ltd.",
    taxId: "0105500000001",
    branch: "00000",
    address: "123 Test Rd, Bangkok 10100",
    vatRegistered: true,
    vatRegDate: "2024-01-01",
    fiscalYearStart: 1,
    paidUpCapital: 500000000, // 5M baht in satang
    ...overrides,
  }
}

function makePP30Fields(overrides: Partial<PP30Fields> = {}): PP30Fields {
  return {
    salesAmount: 10000000, // 100,000 baht
    zeroRateSales: 0,
    exemptSales: 0,
    taxableSales: 10000000,
    outputTax: 700000, // 7,000 baht
    purchaseAmount: 5000000, // 50,000 baht
    inputTax: 350000, // 3,500 baht
    taxPayable: 350000, // 3,500 baht
    excessTax: 0,
    carriedForward: 0,
    netPayable: 350000,
    netExcess: 0,
    surcharge: 0,
    penalty: 0,
    totalPayable: 350000,
    totalExcess: 0,
    ...overrides,
  }
}

function makeVATReportData(overrides: Partial<VATReportData> = {}): VATReportData {
  return {
    period: { month: 3, year: 2026 },
    businessProfile: makeBusinessProfile(),
    outputVAT: 700000,
    inputVAT: 350000,
    netVAT: 350000,
    outputTransactions: [],
    inputTransactions: [],
    pp30Fields: makePP30Fields(),
    ...overrides,
  }
}

function makeWHTTransaction(overrides: Partial<WHTTransactionForReport> = {}): WHTTransactionForReport {
  return {
    id: "test-id-1",
    sequenceNumber: 1,
    merchant: "John Smith",
    description: "Consulting service",
    issuedAt: new Date(2026, 2, 15), // March 15, 2026
    subtotal: 1000000, // 10,000 baht
    total: 1070000, // 10,700 baht
    whtRate: 300, // 3% in basis points
    whtAmount: 30000, // 300 baht
    whtType: "pnd3",
    contactId: "contact-1",
    contactName: "John Smith",
    contactTaxId: "1100500000001",
    contactBranch: "00000",
    contactAddress: "456 Test Rd, Bangkok 10200",
    ...overrides,
  }
}

function makeWHTReportData(overrides: Partial<WHTReportData> = {}): WHTReportData {
  const pnd3Txn = makeWHTTransaction()
  const pnd53Txn = makeWHTTransaction({
    id: "test-id-2",
    sequenceNumber: 1,
    merchant: "ABC Corp",
    contactName: "ABC Corp",
    contactTaxId: "0105500000002",
    whtType: "pnd53",
    subtotal: 5000000, // 50,000 baht
    whtAmount: 150000, // 1,500 baht
    whtRate: 300,
  })

  return {
    transactions: [pnd3Txn, pnd53Txn],
    pnd3Summary: { totalIncomePaid: 1000000, totalTaxWithheld: 30000, transactionCount: 1 },
    pnd53Summary: { totalIncomePaid: 5000000, totalTaxWithheld: 150000, transactionCount: 1 },
    pnd3Transactions: [pnd3Txn],
    pnd53Transactions: [pnd53Txn],
    month: 3,
    year: 2026,
    businessProfile: makeBusinessProfile(),
    ...overrides,
  }
}

// ── Tests ────────────────────────────────────────────────────

describe("export-rd", () => {
  describe("generatePP30Txt", () => {
    it("should return a string with pipe-delimited header row", () => {
      const result = generatePP30Txt(makeVATReportData())
      const lines = result.split("\n").filter((l) => l.length > 0)

      expect(lines.length).toBeGreaterThanOrEqual(2)
      expect(lines[0]).toContain("|")
      expect(lines[0]).toContain("TaxID")
      expect(lines[0]).toContain("Branch")
      expect(lines[0]).toContain("Month")
      expect(lines[0]).toContain("Year")
    })

    it("should use pipe delimiter, not comma or tab", () => {
      const result = generatePP30Txt(makeVATReportData())
      const dataLine = result.split("\n")[1]

      expect(dataLine).toContain("|")
      // Count pipes to verify structure
      const pipeCount = (dataLine.match(/\|/g) || []).length
      expect(pipeCount).toBeGreaterThanOrEqual(10)
    })

    it("should convert satang to baht with 2 decimal places", () => {
      const data = makeVATReportData()
      const result = generatePP30Txt(data)
      const dataLine = result.split("\n")[1]

      // salesAmount = 10000000 satang = 100000.00 baht
      expect(dataLine).toContain("100000.00")
      // outputTax = 700000 satang = 7000.00 baht
      expect(dataLine).toContain("7000.00")
    })

    it("should include Buddhist Era year (2026 -> 2569)", () => {
      const data = makeVATReportData({ period: { month: 3, year: 2026 } })
      const result = generatePP30Txt(data)
      const dataLine = result.split("\n")[1]

      expect(dataLine).toContain("2569")
    })

    it("should include business profile Tax ID and branch", () => {
      const data = makeVATReportData()
      const result = generatePP30Txt(data)
      const dataLine = result.split("\n")[1]

      expect(dataLine).toContain("0105500000001")
      expect(dataLine).toContain("00000")
    })

    it("should handle empty data with header and zero values", () => {
      const data = makeVATReportData({
        pp30Fields: makePP30Fields({
          salesAmount: 0,
          outputTax: 0,
          purchaseAmount: 0,
          inputTax: 0,
          taxPayable: 0,
          totalPayable: 0,
        }),
      })
      const result = generatePP30Txt(data)
      const lines = result.split("\n").filter((l) => l.length > 0)

      expect(lines.length).toBe(2) // header + data
      expect(lines[1]).toContain("0.00")
    })
  })

  describe("generatePND3Txt", () => {
    it("should return pipe-delimited header row", () => {
      const result = generatePND3Txt(makeWHTReportData())
      const lines = result.split("\n").filter((l) => l.length > 0)

      expect(lines[0]).toContain("Seq")
      expect(lines[0]).toContain("TaxID")
      expect(lines[0]).toContain("Name")
      expect(lines[0]).toContain("|")
    })

    it("should include only PND3 transactions (not PND53)", () => {
      const data = makeWHTReportData()
      const result = generatePND3Txt(data)
      const lines = result.split("\n").filter((l) => l.length > 0)

      // header + 1 PND3 row + TOTAL row = 3 lines
      expect(lines.length).toBe(3)
      expect(result).toContain("John Smith")
      expect(result).not.toContain("ABC Corp")
    })

    it("should convert satang to baht for income and WHT amounts", () => {
      const data = makeWHTReportData()
      const result = generatePND3Txt(data)

      // subtotal = 1000000 satang = 10000.00 baht
      expect(result).toContain("10000.00")
      // whtAmount = 30000 satang = 300.00 baht
      expect(result).toContain("300.00")
    })

    it("should format WHT rate as percentage (basis points / 100)", () => {
      const data = makeWHTReportData()
      const result = generatePND3Txt(data)

      // whtRate = 300 basis points = 3.00%
      expect(result).toContain("3.00")
    })

    it("should use B.E. year in payment date (dd/mm/YYYY+543)", () => {
      const data = makeWHTReportData()
      const result = generatePND3Txt(data)

      // March 15, 2026 -> 15/03/2569
      expect(result).toContain("15/03/2569")
    })

    it("should include TOTAL summary row at the end", () => {
      const data = makeWHTReportData()
      const result = generatePND3Txt(data)
      const lines = result.split("\n").filter((l) => l.length > 0)
      const lastLine = lines[lines.length - 1]

      expect(lastLine).toMatch(/^TOTAL/)
    })

    it("should handle empty PND3 transactions", () => {
      const data = makeWHTReportData({
        pnd3Transactions: [],
        pnd3Summary: { totalIncomePaid: 0, totalTaxWithheld: 0, transactionCount: 0 },
      })
      const result = generatePND3Txt(data)
      const lines = result.split("\n").filter((l) => l.length > 0)

      // header + TOTAL row only
      expect(lines.length).toBe(2)
    })

    it("should handle null issuedAt dates gracefully", () => {
      const txn = makeWHTTransaction({ issuedAt: null })
      const data = makeWHTReportData({
        pnd3Transactions: [txn],
        pnd3Summary: { totalIncomePaid: txn.subtotal, totalTaxWithheld: txn.whtAmount, transactionCount: 1 },
      })
      const result = generatePND3Txt(data)

      // Should not throw, should have empty date field
      expect(result).toBeDefined()
    })
  })

  describe("generatePND53Txt", () => {
    it("should include only PND53 transactions (not PND3)", () => {
      const data = makeWHTReportData()
      const result = generatePND53Txt(data)
      const lines = result.split("\n").filter((l) => l.length > 0)

      // header + 1 PND53 row + TOTAL row = 3 lines
      expect(lines.length).toBe(3)
      expect(result).toContain("ABC Corp")
      expect(result).not.toContain("John Smith")
    })

    it("should have same pipe-delimited structure as PND3", () => {
      const data = makeWHTReportData()
      const pnd3Result = generatePND3Txt(data)
      const pnd53Result = generatePND53Txt(data)

      const pnd3Header = pnd3Result.split("\n")[0]
      const pnd53Header = pnd53Result.split("\n")[0]

      expect(pnd3Header).toEqual(pnd53Header)
    })

    it("should use pnd53Summary for TOTAL row", () => {
      const data = makeWHTReportData()
      const result = generatePND53Txt(data)
      const lines = result.split("\n").filter((l) => l.length > 0)
      const totalLine = lines[lines.length - 1]

      // pnd53Summary.totalIncomePaid = 5000000 satang = 50000.00 baht
      expect(totalLine).toContain("50000.00")
      // pnd53Summary.totalTaxWithheld = 150000 satang = 1500.00 baht
      expect(totalLine).toContain("1500.00")
    })
  })
})
