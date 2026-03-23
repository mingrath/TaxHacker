/**
 * Thai VAT Calculator — Pure functions using satang integer arithmetic.
 *
 * All monetary amounts are in satang (1 baht = 100 satang).
 * Rates are in basis points (700 = 7.00%).
 * No floating-point arithmetic to avoid rounding errors.
 */

export const VAT_RATE = 700 // 7.00% in basis points

export type VATResult = {
  subtotal: number // pre-VAT base amount in satang
  vatAmount: number // VAT portion in satang
  total: number // subtotal + vatAmount in satang
}

/**
 * Extract VAT from a VAT-inclusive total (the /107 method).
 *
 * Formula: subtotal = Math.round(total * 10000 / (10000 + rate))
 * This avoids floating-point by keeping everything in integer domain.
 *
 * Example: extractVATFromTotal(107000) => { subtotal: 100000, vatAmount: 7000, total: 107000 }
 */
export function extractVATFromTotal(totalInclVAT: number, vatRate: number = VAT_RATE): VATResult {
  if (totalInclVAT === 0) {
    return { subtotal: 0, vatAmount: 0, total: 0 }
  }

  const subtotal = Math.round(totalInclVAT * 10000 / (10000 + vatRate))
  const vatAmount = totalInclVAT - subtotal

  return {
    subtotal,
    vatAmount,
    total: totalInclVAT,
  }
}

/**
 * Compute VAT on a pre-VAT subtotal.
 *
 * Formula: vatAmount = Math.round(subtotal * rate / 10000)
 *
 * Example: computeVATOnSubtotal(100000) => { subtotal: 100000, vatAmount: 7000, total: 107000 }
 */
export function computeVATOnSubtotal(subtotal: number, vatRate: number = VAT_RATE): VATResult {
  if (subtotal === 0) {
    return { subtotal: 0, vatAmount: 0, total: 0 }
  }

  const vatAmount = Math.round(subtotal * vatRate / 10000)
  const total = subtotal + vatAmount

  return {
    subtotal,
    vatAmount,
    total,
  }
}

/**
 * Convert satang to baht for display purposes only.
 * Do NOT use this for calculations -- always compute in satang.
 */
export function formatSatangToDisplay(satang: number): number {
  return satang / 100
}
