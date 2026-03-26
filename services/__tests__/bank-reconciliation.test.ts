import { describe, it, expect } from "vitest"
import { scoreMatch, findMatches } from "../bank-reconciliation"
import type { MatchCandidate } from "../bank-reconciliation"

describe("scoreMatch", () => {
  const baseDate = new Date("2026-03-15")

  it("returns 40 points for exact amount match (both 500000 satang)", () => {
    const result = scoreMatch(500000, baseDate, "test", 500000, baseDate, "")
    expect(result.score).toBeGreaterThanOrEqual(40)
    expect(result.reasons).toContain("exact_amount")
  })

  it("returns 0 amount points for different amounts (500000 vs 300000)", () => {
    const result = scoreMatch(500000, baseDate, "", 300000, baseDate, "")
    expect(result.reasons).not.toContain("exact_amount")
  })

  it("returns 30 date points for same date (0 days apart)", () => {
    // Use mismatched amounts to isolate date scoring
    const result = scoreMatch(100, baseDate, "", 200, baseDate, "")
    expect(result.score).toBe(30)
    expect(result.reasons).toContain("same_date")
  })

  it("returns 25 date points for 1 day apart", () => {
    const nextDay = new Date("2026-03-16")
    // Use mismatched amounts to isolate date scoring
    const result = scoreMatch(100, baseDate, "", 200, nextDay, "")
    expect(result.score).toBe(25)
    expect(result.reasons).toContain("date_within_1_day")
  })

  it("returns 20 date points for 2-3 days apart", () => {
    const twoDaysLater = new Date("2026-03-17")
    const result = scoreMatch(100, baseDate, "", 200, twoDaysLater, "")
    expect(result.score).toBe(20)
    expect(result.reasons).toContain("date_within_3_days")

    const threeDaysLater = new Date("2026-03-18")
    const result2 = scoreMatch(100, baseDate, "", 200, threeDaysLater, "")
    expect(result2.score).toBe(20)
    expect(result2.reasons).toContain("date_within_3_days")
  })

  it("returns 10 date points for 4-7 days apart", () => {
    const fiveDaysLater = new Date("2026-03-20")
    const result = scoreMatch(100, baseDate, "", 200, fiveDaysLater, "")
    expect(result.score).toBe(10)
    expect(result.reasons).toContain("date_within_7_days")
  })

  it("returns 0 date points for more than 7 days apart", () => {
    const tenDaysLater = new Date("2026-03-25")
    const result = scoreMatch(100, baseDate, "", 200, tenDaysLater, "")
    expect(result.score).toBe(0)
    expect(result.reasons).not.toContain("same_date")
    expect(result.reasons).not.toContain("date_within_1_day")
    expect(result.reasons).not.toContain("date_within_3_days")
    expect(result.reasons).not.toContain("date_within_7_days")
  })

  it("returns 30 description points when transaction name is contained in entry description", () => {
    // Use mismatched amounts and dates to isolate description scoring
    const farDate = new Date("2020-01-01")
    const result = scoreMatch(100, baseDate, "Payment to ABC Company Ltd", 200, farDate, "ABC Company")
    // txName "ABC Company" is contained in entry description
    expect(result.reasons).toContain("description_contains")
    expect(result.score).toBe(30)
  })

  it("returns 15 description points for partial match (first 10 chars)", () => {
    const farDate = new Date("2020-01-01")
    // entry description = "Transfer K" (first 10 chars = "transfer k")
    // txName = "Transfer KBank Regular Payment" contains "transfer k"
    // But entryLower does NOT contain full txLower (too short) -> partial match
    const result = scoreMatch(100, baseDate, "Transfer K", 200, farDate, "Transfer KBank Regular Payment")
    expect(result.reasons).toContain("partial_description")
    expect(result.score).toBe(15)
  })

  it("returns 0 description points when no match", () => {
    const farDate = new Date("2020-01-01")
    const result = scoreMatch(100, baseDate, "Totally different text", 200, farDate, "Nothing similar")
    expect(result.reasons).not.toContain("description_contains")
    expect(result.reasons).not.toContain("partial_description")
    expect(result.score).toBe(0)
  })

  it("returns 100 for exact amount + same date + description match (perfect score)", () => {
    const result = scoreMatch(
      500000,
      baseDate,
      "Payment to ABC Company for services",
      500000,
      baseDate,
      "ABC Company"
    )
    expect(result.score).toBe(100)
  })

  it("uses absolute values for amount comparison (handles deposit vs income sign)", () => {
    const result = scoreMatch(-500000, baseDate, "", 500000, baseDate, "")
    expect(result.reasons).toContain("exact_amount")
    expect(result.score).toBeGreaterThanOrEqual(40)
  })
})

describe("findMatches", () => {
  const baseDate = new Date("2026-03-15")
  const transactions = [
    { id: "tx-1", total: 500000, issuedAt: baseDate, name: "ABC Company" },
    { id: "tx-2", total: 300000, issuedAt: new Date("2026-03-14"), name: "XYZ Corp" },
    { id: "tx-3", total: 100000, issuedAt: new Date("2026-01-01"), name: "Old Transaction" },
  ]

  it("returns candidates sorted by score descending", () => {
    const entry = { amount: 500000, date: baseDate, description: "Payment ABC Company" }
    const candidates = findMatches(entry, transactions)
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i - 1].score).toBeGreaterThanOrEqual(candidates[i].score)
    }
  })

  it("only includes candidates with score >= 60 (threshold per D-07)", () => {
    const entry = { amount: 500000, date: baseDate, description: "Payment ABC Company" }
    const candidates = findMatches(entry, transactions)
    for (const c of candidates) {
      expect(c.score).toBeGreaterThanOrEqual(60)
    }
  })

  it("returns empty array when no transactions score above threshold", () => {
    const entry = { amount: 999999, date: new Date("2020-01-01"), description: "No match possible" }
    const candidates = findMatches(entry, transactions)
    expect(candidates).toHaveLength(0)
  })

  it("marks the top candidate as 'suggested' (first element)", () => {
    const entry = { amount: 500000, date: baseDate, description: "Payment ABC Company" }
    const candidates = findMatches(entry, transactions)
    expect(candidates.length).toBeGreaterThan(0)
    // The first element should be the highest-scoring candidate
    if (candidates.length > 1) {
      expect(candidates[0].score).toBeGreaterThanOrEqual(candidates[1].score)
    }
  })
})
