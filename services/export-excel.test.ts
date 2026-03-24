import { describe, it, expect } from "vitest"
import { generateAccountantExcel, type ExportDataForExcel, type IncomeExpenseRow } from "./export-excel"
import ExcelJS from "exceljs"
import type { VATReportData, PP30Fields, TransactionForReport } from "@/app/(app)/apps/vat-report/actions"
import type { WHTReportData, WHTTransactionForReport, WHTReportSummary } from "@/app/(app)/apps/wht-report/actions"
import type { BusinessProfile } from "@/models/business-profile"

// ── Helpers ──────────────────────────────────────────────────

function makeBusinessProfile(): BusinessProfile {
  return {
    companyName: "Test Company Co., Ltd.",
    taxId: "0105500000001",
    branch: "00000",
    address: "123 Test Rd, Bangkok 10100",
    vatRegistered: true,
    vatRegDate: "2024-01-01",
    fiscalYearStart: 1,
    paidUpCapital: 500000000,
  }
}

function makeVATReportData(): VATReportData {
  return {
    period: { month: 3, year: 2026 },
    businessProfile: makeBusinessProfile(),
    outputVAT: 700000,
    inputVAT: 350000,
    netVAT: 350000,
    outputTransactions: [
      {
        sequenceNumber: 1,
        issuedAt: new Date(2026, 2, 10),
        documentNumber: "SI-2026-001",
        merchant: "Customer A",
        merchantTaxId: "1100500000001",
        merchantBranch: "00000",
        subtotal: 10000000, // 100,000 baht
        vatAmount: 700000, // 7,000 baht
      },
    ],
    inputTransactions: [
      {
        sequenceNumber: 1,
        issuedAt: new Date(2026, 2, 5),
        documentNumber: "PI-2026-001",
        merchant: "Supplier B",
        merchantTaxId: "1100500000002",
        merchantBranch: "00001",
        subtotal: 5000000, // 50,000 baht
        vatAmount: 350000, // 3,500 baht
      },
    ],
    pp30Fields: {
      salesAmount: 10000000,
      zeroRateSales: 0,
      exemptSales: 0,
      taxableSales: 10000000,
      outputTax: 700000,
      purchaseAmount: 5000000,
      inputTax: 350000,
      taxPayable: 350000,
      excessTax: 0,
      carriedForward: 0,
      netPayable: 350000,
      netExcess: 0,
      surcharge: 0,
      penalty: 0,
      totalPayable: 350000,
      totalExcess: 0,
    },
  }
}

function makeWHTReportData(): WHTReportData {
  const pnd3Txn: WHTTransactionForReport = {
    id: "t1",
    sequenceNumber: 1,
    merchant: "John Smith",
    description: "Consulting",
    issuedAt: new Date(2026, 2, 15),
    subtotal: 1000000,
    total: 1070000,
    whtRate: 300,
    whtAmount: 30000,
    whtType: "pnd3",
    contactId: "c1",
    contactName: "John Smith",
    contactTaxId: "1100500000003",
    contactBranch: "00000",
    contactAddress: "456 Test Rd",
  }

  const pnd53Txn: WHTTransactionForReport = {
    id: "t2",
    sequenceNumber: 1,
    merchant: "ABC Corp",
    description: "IT Service",
    issuedAt: new Date(2026, 2, 20),
    subtotal: 5000000,
    total: 5350000,
    whtRate: 300,
    whtAmount: 150000,
    whtType: "pnd53",
    contactId: "c2",
    contactName: "ABC Corp",
    contactTaxId: "0105500000002",
    contactBranch: "00000",
    contactAddress: "789 Corp Rd",
  }

  return {
    transactions: [pnd3Txn, pnd53Txn],
    pnd3Summary: { totalIncomePaid: 1000000, totalTaxWithheld: 30000, transactionCount: 1 },
    pnd53Summary: { totalIncomePaid: 5000000, totalTaxWithheld: 150000, transactionCount: 1 },
    pnd3Transactions: [pnd3Txn],
    pnd53Transactions: [pnd53Txn],
    month: 3,
    year: 2026,
    businessProfile: makeBusinessProfile(),
  }
}

function makeIncomeExpenseRows(): IncomeExpenseRow[] {
  return [
    {
      date: new Date(2026, 2, 10),
      description: "Web development",
      type: "income",
      amount: 10000000,
      vatAmount: 700000,
      category: "Service Income",
    },
    {
      date: new Date(2026, 2, 5),
      description: "Office supplies",
      type: "expense",
      amount: 500000,
      vatAmount: 35000,
      category: "Office Supplies",
    },
  ]
}

function makeExportData(overrides: Partial<ExportDataForExcel> = {}): ExportDataForExcel {
  return {
    vatData: makeVATReportData(),
    whtData: makeWHTReportData(),
    incomeExpenseTransactions: makeIncomeExpenseRows(),
    businessProfile: makeBusinessProfile(),
    period: { month: 3, year: 2026 },
    ...overrides,
  }
}

async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  return wb
}

// ── Tests ────────────────────────────────────────────────────

describe("export-excel", () => {
  describe("generateAccountantExcel", () => {
    it("should return a Buffer with length > 0", async () => {
      const buffer = await generateAccountantExcel(makeExportData())

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it("should produce a valid xlsx with 5 worksheets", async () => {
      const buffer = await generateAccountantExcel(makeExportData())
      const wb = await loadWorkbook(buffer)

      expect(wb.worksheets.length).toBe(5)
    })

    it("should have correct Thai worksheet names", async () => {
      const buffer = await generateAccountantExcel(makeExportData())
      const wb = await loadWorkbook(buffer)

      const names = wb.worksheets.map((ws) => ws.name)
      expect(names).toContain("รายงานภาษีซื้อ")
      expect(names).toContain("รายงานภาษีขาย")
      expect(names).toContain("สรุป ภ.พ.30")
      expect(names).toContain("สรุปภาษีหัก ณ ที่จ่าย")
      expect(names).toContain("รายได้-รายจ่าย")
    })

    it("should include business profile info in Purchase Tax worksheet", async () => {
      const buffer = await generateAccountantExcel(makeExportData())
      const wb = await loadWorkbook(buffer)
      const ws = wb.getWorksheet("รายงานภาษีซื้อ")!

      // Check cover row contains company name
      let foundCompanyName = false
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          if (String(cell.value).includes("Test Company")) {
            foundCompanyName = true
          }
        })
      })
      expect(foundCompanyName).toBe(true)
    })

    it("should have correct header columns in Purchase Tax worksheet", async () => {
      const buffer = await generateAccountantExcel(makeExportData())
      const wb = await loadWorkbook(buffer)
      const ws = wb.getWorksheet("รายงานภาษีซื้อ")!

      // Find the header row (row after cover rows)
      let headerRowValues: string[] = []
      ws.eachRow((row, rowNumber) => {
        const firstCell = String(row.getCell(1).value || "")
        if (firstCell.includes("ลำดับ")) {
          headerRowValues = row.values as string[]
        }
      })

      const headerText = headerRowValues.join(" ")
      expect(headerText).toContain("ลำดับ")
    })

    it("should convert satang to baht in amount cells", async () => {
      const buffer = await generateAccountantExcel(makeExportData())
      const wb = await loadWorkbook(buffer)
      const ws = wb.getWorksheet("รายงานภาษีซื้อ")!

      // Find the data row (input transaction subtotal = 5000000 satang = 50000 baht)
      let foundBahtValue = false
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          if (cell.value === 50000) {
            foundBahtValue = true
          }
        })
      })
      expect(foundBahtValue).toBe(true)
    })

    it("should have PP30 summary fields in the PP30 worksheet", async () => {
      const buffer = await generateAccountantExcel(makeExportData())
      const wb = await loadWorkbook(buffer)
      const ws = wb.getWorksheet("สรุป ภ.พ.30")!

      // Check that PP30 field labels exist
      let foundSalesLabel = false
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          if (String(cell.value).includes("ยอดขาย")) {
            foundSalesLabel = true
          }
        })
      })
      expect(foundSalesLabel).toBe(true)
    })

    it("should handle empty transactions producing workbook with headers only", async () => {
      const emptyData = makeExportData({
        vatData: {
          ...makeVATReportData(),
          outputTransactions: [],
          inputTransactions: [],
        },
        whtData: {
          ...makeWHTReportData(),
          pnd3Transactions: [],
          pnd53Transactions: [],
          transactions: [],
          pnd3Summary: { totalIncomePaid: 0, totalTaxWithheld: 0, transactionCount: 0 },
          pnd53Summary: { totalIncomePaid: 0, totalTaxWithheld: 0, transactionCount: 0 },
        },
        incomeExpenseTransactions: [],
      })

      const buffer = await generateAccountantExcel(emptyData)
      const wb = await loadWorkbook(buffer)

      // Still has 5 worksheets
      expect(wb.worksheets.length).toBe(5)
      // Buffer is valid
      expect(buffer.length).toBeGreaterThan(0)
    })

    it("should have WHT data in WHT summary worksheet", async () => {
      const buffer = await generateAccountantExcel(makeExportData())
      const wb = await loadWorkbook(buffer)
      const ws = wb.getWorksheet("สรุปภาษีหัก ณ ที่จ่าย")!

      // Check PND3 section header exists
      let foundPnd3Header = false
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          if (String(cell.value).includes("ภ.ง.ด.3")) {
            foundPnd3Header = true
          }
        })
      })
      expect(foundPnd3Header).toBe(true)
    })

    it("should have income/expense data in the last worksheet", async () => {
      const buffer = await generateAccountantExcel(makeExportData())
      const wb = await loadWorkbook(buffer)
      const ws = wb.getWorksheet("รายได้-รายจ่าย")!

      let foundDescription = false
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          if (String(cell.value).includes("Web development")) {
            foundDescription = true
          }
        })
      })
      expect(foundDescription).toBe(true)
    })
  })
})
