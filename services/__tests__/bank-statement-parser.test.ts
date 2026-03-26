import { describe, it, expect } from "vitest"
import {
  detectEncoding,
  normalizeYear,
  bahtToSatang,
  parseCSVBuffer,
  parseExcelBuffer,
  parseBankEntries,
  generateFileHash,
  BANK_PRESETS,
} from "../bank-statement-parser"

describe("detectEncoding", () => {
  it("returns 'utf-8' for a buffer containing Thai Unicode characters (0x0E00-0x0E7F)", () => {
    const thaiText = "รายการธนาคาร"
    const buffer = Buffer.from(thaiText, "utf-8")
    expect(detectEncoding(buffer)).toBe("utf-8")
  })

  it("returns 'windows-874' for a buffer with bytes in TIS-620 range (0xA1-0xFB) but no Thai Unicode", () => {
    // TIS-620 encoded bytes for Thai text -- bytes in 0xA1-0xFB range
    const tis620Bytes = Buffer.from([0xC3, 0xD2, 0xC2, 0xA1, 0xD2, 0xC3]) // "รายการ" in TIS-620
    expect(detectEncoding(tis620Bytes)).toBe("windows-874")
  })

  it("returns 'utf-8' for plain ASCII text (default)", () => {
    const asciiText = "Hello World 123"
    const buffer = Buffer.from(asciiText, "utf-8")
    expect(detectEncoding(buffer)).toBe("utf-8")
  })
})

describe("normalizeYear", () => {
  it("converts B.E. 2569 to Gregorian 2026", () => {
    expect(normalizeYear(2569)).toBe(2026)
  })

  it("returns 2026 unchanged (already Gregorian)", () => {
    expect(normalizeYear(2026)).toBe(2026)
  })

  it("returns 2400 unchanged (boundary -- not B.E.)", () => {
    expect(normalizeYear(2400)).toBe(2400)
  })

  it("converts 2401 to 1858 (just above boundary -- is B.E.)", () => {
    expect(normalizeYear(2401)).toBe(1858)
  })
})

describe("bahtToSatang", () => {
  it("converts '1,234.56' to 123456", () => {
    expect(bahtToSatang("1,234.56")).toBe(123456)
  })

  it("converts '5000' to 500000", () => {
    expect(bahtToSatang("5000")).toBe(500000)
  })

  it("converts '0.50' to 50", () => {
    expect(bahtToSatang("0.50")).toBe(50)
  })

  it("converts '' (empty string) to 0", () => {
    expect(bahtToSatang("")).toBe(0)
  })

  it("converts 'abc' (non-numeric) to 0", () => {
    expect(bahtToSatang("abc")).toBe(0)
  })
})

describe("parseCSVBuffer", () => {
  it("parses a simple 3-row UTF-8 CSV into string[][] with correct cell values", async () => {
    const csv = "Date,Description,Amount\n2026-03-01,Test Item,1000\n2026-03-02,Another,2000\n2026-03-03,Third,3000"
    const buffer = Buffer.from(csv, "utf-8")
    const rows = await parseCSVBuffer(buffer)
    expect(rows).toHaveLength(4) // header + 3 data rows
    expect(rows[0]).toEqual(["Date", "Description", "Amount"])
    expect(rows[1]).toEqual(["2026-03-01", "Test Item", "1000"])
    expect(rows[2]).toEqual(["2026-03-02", "Another", "2000"])
    expect(rows[3]).toEqual(["2026-03-03", "Third", "3000"])
  })

  it("skips header row with skipLines=1", async () => {
    const csv = "Date,Description,Amount\n2026-03-01,Test Item,1000\n2026-03-02,Another,2000"
    const buffer = Buffer.from(csv, "utf-8")
    const rows = await parseCSVBuffer(buffer, 1)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual(["2026-03-01", "Test Item", "1000"])
  })
})

describe("parseExcelBuffer", () => {
  it("parses a workbook buffer into string[][] rows", async () => {
    // Create an Excel workbook in memory using ExcelJS
    const ExcelJS = await import("exceljs")
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Sheet1")
    worksheet.addRow(["Date", "Description", "Amount"])
    worksheet.addRow(["2026-03-01", "Test Item", 1000])
    worksheet.addRow(["2026-03-02", "Another", 2000])

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const rows = await parseExcelBuffer(buffer)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(["Date", "Description", "Amount"])
    expect(rows[1][0]).toBe("2026-03-01")
    expect(rows[1][1]).toBe("Test Item")
    expect(rows[1][2]).toBe("1000")
  })
})

describe("BANK_PRESETS", () => {
  it("contains entries for 'kbank', 'scb', 'bbl' with label, defaultMapping, encoding fields", () => {
    expect(BANK_PRESETS).toHaveProperty("kbank")
    expect(BANK_PRESETS).toHaveProperty("scb")
    expect(BANK_PRESETS).toHaveProperty("bbl")

    for (const key of ["kbank", "scb", "bbl"]) {
      const preset = BANK_PRESETS[key]
      expect(preset).toHaveProperty("label")
      expect(preset).toHaveProperty("defaultMapping")
      expect(preset).toHaveProperty("encoding")
    }
  })

  it("KBank preset has encoding 'windows-874' and useBuddhistEra true", () => {
    expect(BANK_PRESETS.kbank.encoding).toBe("windows-874")
    expect(BANK_PRESETS.kbank.useBuddhistEra).toBe(true)
  })

  it("SCB preset has encoding 'utf-8' and useBuddhistEra false", () => {
    expect(BANK_PRESETS.scb.encoding).toBe("utf-8")
    expect(BANK_PRESETS.scb.useBuddhistEra).toBe(false)
  })
})

describe("parseBankEntries", () => {
  const mapping = {
    date: 0,
    description: 1,
    deposit: 2,
    withdrawal: 3,
    balance: 4,
    reference: null,
  }

  it("applies column mapping to extract ParsedBankEntry[] with date, description, deposit/withdrawal in satang", () => {
    const rows: string[][] = [
      ["01/03/2026", "Transfer from A", "5,000.00", "", "50,000.00"],
      ["02/03/2026", "Payment to B", "", "1,234.56", "48,765.44"],
    ]

    const entries = parseBankEntries(rows, mapping, false)
    expect(entries).toHaveLength(2)

    expect(entries[0].description).toBe("Transfer from A")
    expect(entries[0].deposit).toBe(500000)
    expect(entries[0].withdrawal).toBe(0)
    expect(entries[0].balance).toBe(5000000)

    expect(entries[1].description).toBe("Payment to B")
    expect(entries[1].deposit).toBe(0)
    expect(entries[1].withdrawal).toBe(123456)
    expect(entries[1].balance).toBe(4876544)
  })

  it("normalizes B.E. year when useBuddhistEra is true (25/03/2569 becomes 2026-03-25)", () => {
    const rows: string[][] = [
      ["25/03/2569", "B.E. transaction", "1,000.00", "", "10,000.00"],
    ]

    const entries = parseBankEntries(rows, mapping, true)
    expect(entries).toHaveLength(1)
    expect(entries[0].date.getFullYear()).toBe(2026)
    expect(entries[0].date.getMonth()).toBe(2) // March is 0-indexed month 2
    expect(entries[0].date.getDate()).toBe(25)
  })
})

describe("generateFileHash", () => {
  it("returns consistent hash for same buffer content", () => {
    const content = "test file content for hashing"
    const buffer = Buffer.from(content, "utf-8")
    const hash1 = generateFileHash(buffer)
    const hash2 = generateFileHash(buffer)
    expect(hash1).toBe(hash2)
    expect(typeof hash1).toBe("string")
    expect(hash1.length).toBeGreaterThan(0)
  })
})
