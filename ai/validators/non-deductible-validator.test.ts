import { describe, it, expect } from "vitest"
import { validateNonDeductibleExpense } from "./non-deductible-validator"

describe("non-deductible-validator", () => {
  it("flags penalty when category is fees and name contains ค่าปรับ", () => {
    const result = validateNonDeductibleExpense({
      categoryCode: "fees",
      name: "ค่าปรับจราจร",
      is_non_deductible: false,
    })
    expect(result.isNonDeductible).toBe(true)
    expect(result.category).toBe("penalty")
    expect(result.severity).toBe("warning")
  })

  it("flags penalty when name contains เบี้ยปรับ", () => {
    const result = validateNonDeductibleExpense({
      categoryCode: "fees",
      name: "เบี้ยปรับภาษี",
    })
    expect(result.isNonDeductible).toBe(true)
    expect(result.category).toBe("penalty")
  })

  it("flags entertainment for food category", () => {
    const result = validateNonDeductibleExpense({
      categoryCode: "food",
      name: "อาหารเลี้ยงรับรองลูกค้า",
    })
    expect(result.isNonDeductible).toBe(true)
    expect(result.category).toBe("entertainment")
    expect(result.severity).toBe("info")
  })

  it("flags entertainment for events category", () => {
    const result = validateNonDeductibleExpense({
      categoryCode: "events",
      name: "งานเลี้ยงปีใหม่",
    })
    expect(result.isNonDeductible).toBe(true)
    expect(result.category).toBe("entertainment")
    expect(result.severity).toBe("info")
  })

  it("flags charitable for donations category", () => {
    const result = validateNonDeductibleExpense({
      categoryCode: "donations",
      name: "บริจาคมูลนิธิ",
    })
    expect(result.isNonDeductible).toBe(true)
    expect(result.category).toBe("charitable")
    expect(result.severity).toBe("info")
  })

  it("passes through AI result when no heuristic matches", () => {
    const result = validateNonDeductibleExpense({
      categoryCode: "office",
      name: "กระดาษสำนักงาน",
      is_non_deductible: true,
      non_deductible_category: "personal",
      non_deductible_reason: "ค่าใช้จ่ายส่วนตัว",
    })
    expect(result.isNonDeductible).toBe(true)
    expect(result.category).toBe("personal")
    expect(result.reason).toBe("ค่าใช้จ่ายส่วนตัว")
  })

  it("returns not-non-deductible when no flags match", () => {
    const result = validateNonDeductibleExpense({
      categoryCode: "office",
      name: "วัสดุสำนักงาน",
      is_non_deductible: false,
    })
    expect(result.isNonDeductible).toBe(false)
    expect(result.category).toBe("")
  })

  it("handles missing fields gracefully", () => {
    const result = validateNonDeductibleExpense({})
    expect(result.isNonDeductible).toBe(false)
  })
})
