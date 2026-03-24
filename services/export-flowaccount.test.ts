import { describe, it, expect } from "vitest"
import { generateFlowAccountCSV, type FlowAccountTransaction } from "./export-flowaccount"

// ── Helpers ──────────────────────────────────────────────────

function makeTransaction(overrides: Partial<FlowAccountTransaction> = {}): FlowAccountTransaction {
  return {
    date: new Date(2026, 2, 15), // March 15, 2026
    documentNumber: "INV-2026-001",
    description: "Web development service",
    type: "income",
    amount: 10000000, // 100,000 baht in satang
    vatAmount: 700000, // 7,000 baht in satang
    category: "Service Income",
    ...overrides,
  }
}

// ── Tests ────────────────────────────────────────────────────

describe("export-flowaccount", () => {
  describe("generateFlowAccountCSV", () => {
    it("should return a string with comma-delimited header row", async () => {
      const result = await generateFlowAccountCSV([makeTransaction()])
      const lines = result.split("\n").filter((l) => l.length > 0)

      expect(lines[0]).toContain(",")
      expect(lines[0]).toContain("Date")
      expect(lines[0]).toContain("DocumentNo")
      expect(lines[0]).toContain("Description")
      expect(lines[0]).toContain("Type")
      expect(lines[0]).toContain("Amount")
      expect(lines[0]).toContain("VATAmount")
      expect(lines[0]).toContain("Category")
    })

    it("should use comma delimiter (not pipe or tab)", async () => {
      const result = await generateFlowAccountCSV([makeTransaction()])
      const dataLine = result.split("\n").filter((l) => l.length > 0)[1]

      expect(dataLine).toContain(",")
      // Should not use pipe
      const pipes = (dataLine.match(/\|/g) || []).length
      expect(pipes).toBe(0)
    })

    it("should convert satang to baht with 2 decimal places", async () => {
      const result = await generateFlowAccountCSV([makeTransaction()])

      // amount = 10000000 satang = 100000.00 baht
      expect(result).toContain("100000.00")
      // vatAmount = 700000 satang = 7000.00 baht
      expect(result).toContain("7000.00")
    })

    it("should use Gregorian date format dd/mm/yyyy (not B.E.)", async () => {
      const result = await generateFlowAccountCSV([makeTransaction()])

      // March 15, 2026 -> 15/03/2026 (NOT 15/03/2569)
      expect(result).toContain("15/03/2026")
      expect(result).not.toContain("2569")
    })

    it("should return header-only for empty input", async () => {
      const result = await generateFlowAccountCSV([])
      const lines = result.split("\n").filter((l) => l.length > 0)

      expect(lines.length).toBe(1) // header only
      expect(lines[0]).toContain("Date")
    })

    it("should handle null date gracefully", async () => {
      const txn = makeTransaction({ date: null })
      const result = await generateFlowAccountCSV([txn])

      // Should not throw
      expect(result).toBeDefined()
    })

    it("should handle multiple transactions", async () => {
      const txns = [
        makeTransaction(),
        makeTransaction({
          documentNumber: "EXP-2026-001",
          description: "Office supplies",
          type: "expense",
          amount: 500000,
          vatAmount: 35000,
          category: "Office Supplies",
        }),
      ]
      const result = await generateFlowAccountCSV(txns)
      const lines = result.split("\n").filter((l) => l.length > 0)

      // header + 2 data rows
      expect(lines.length).toBe(3)
    })

    it("should include transaction type (income/expense)", async () => {
      const txns = [
        makeTransaction({ type: "income" }),
        makeTransaction({ type: "expense" }),
      ]
      const result = await generateFlowAccountCSV(txns)

      expect(result).toContain("income")
      expect(result).toContain("expense")
    })
  })
})
