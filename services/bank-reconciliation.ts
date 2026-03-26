/**
 * Bank Reconciliation Service — Multi-factor matching algorithm.
 *
 * Scores bank entries against existing transactions using three factors:
 * - Amount match: 40 points for exact satang match (absolute values)
 * - Date proximity: 30 points max (graduated by days apart)
 * - Description similarity: 30 points max (substring match)
 *
 * Threshold: score >= 60 to suggest a match (per D-07).
 * Never auto-confirms -- this service only scores and suggests.
 */

import { differenceInDays } from "date-fns"

// ─── Types ─────────────────────────────────────────────────────

export type MatchCandidate = {
  transactionId: string
  score: number       // 0-100
  reasons: string[]   // ["exact_amount", "same_date", "description_contains"]
}

// ─── Score Match ───────────────────────────────────────────────

/**
 * Score a single bank entry against a single transaction.
 *
 * Weights per D-07:
 *   Amount: 40 points (exact match on absolute values)
 *   Date:   30 points (graduated: 0d=30, 1d=25, 2-3d=20, 4-7d=10, >7d=0)
 *   Desc:   30 points (contains=30, partial first 10 chars=15, none=0)
 */
export function scoreMatch(
  entryAmount: number,
  entryDate: Date,
  entryDescription: string,
  txTotal: number,
  txDate: Date,
  txName: string
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Amount match: 40 points for exact match on absolute value
  if (Math.abs(entryAmount) === Math.abs(txTotal)) {
    score += 40
    reasons.push("exact_amount")
  }

  // Date proximity: 30 points max
  const daysDiff = Math.abs(differenceInDays(entryDate, txDate))
  if (daysDiff === 0) {
    score += 30
    reasons.push("same_date")
  } else if (daysDiff <= 1) {
    score += 25
    reasons.push("date_within_1_day")
  } else if (daysDiff <= 3) {
    score += 20
    reasons.push("date_within_3_days")
  } else if (daysDiff <= 7) {
    score += 10
    reasons.push("date_within_7_days")
  }

  // Description similarity: 30 points max
  const entryLower = entryDescription.toLowerCase()
  const txLower = (txName || "").toLowerCase()
  if (txLower && entryLower.includes(txLower)) {
    score += 30
    reasons.push("description_contains")
  } else if (txLower && entryLower.length >= 10 && txLower.includes(entryLower.substring(0, 10))) {
    score += 15
    reasons.push("partial_description")
  }

  return { score, reasons }
}

// ─── Find Matches ──────────────────────────────────────────────

/**
 * Score all transactions against a bank entry, filter by threshold, sort descending.
 *
 * @param entry - Bank entry with amount (satang), date, description
 * @param transactions - Candidate transactions to match against
 * @param threshold - Minimum score to include (default 60 per D-07)
 * @returns MatchCandidate[] sorted by score descending (first = top suggestion)
 */
export function findMatches(
  entry: { amount: number; date: Date; description: string },
  transactions: { id: string; total: number; issuedAt: Date; name: string }[],
  threshold: number = 60
): MatchCandidate[] {
  const candidates: MatchCandidate[] = []

  for (const tx of transactions) {
    const { score, reasons } = scoreMatch(
      entry.amount,
      entry.date,
      entry.description,
      tx.total,
      tx.issuedAt,
      tx.name
    )

    if (score >= threshold) {
      candidates.push({
        transactionId: tx.id,
        score,
        reasons,
      })
    }
  }

  // Sort descending by score -- first element is the "suggested" match
  candidates.sort((a, b) => b.score - a.score)

  return candidates
}
