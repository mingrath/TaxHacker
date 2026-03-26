/**
 * Document Workflow — Status transitions, numbering, and type definitions.
 *
 * Enforces the document state machine for quotations (and future document types).
 * All monetary amounts follow the project-wide satang convention (1 baht = 100 satang).
 */

export const DOCUMENT_PREFIXES = {
  QUOTATION: "QT",
  INVOICE: "INV",
  RECEIPT: "RCT",
  DELIVERY_NOTE: "DLV",
  TAX_INVOICE: "TAX",
} as const

export type DocumentType = keyof typeof DOCUMENT_PREFIXES

export const QUOTATION_STATUSES = {
  draft: { label: "\u0e41\u0e1a\u0e1a\u0e23\u0e48\u0e32\u0e07", color: "secondary" },
  sent: { label: "\u0e2a\u0e48\u0e07\u0e41\u0e25\u0e49\u0e27", color: "blue" },
  accepted: { label: "\u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34", color: "green" },
  rejected: { label: "\u0e1b\u0e0f\u0e34\u0e40\u0e2a\u0e18", color: "destructive" },
  expired: { label: "\u0e2b\u0e21\u0e14\u0e2d\u0e32\u0e22\u0e38", color: "orange" },
  converted: { label: "\u0e41\u0e1b\u0e25\u0e07\u0e41\u0e25\u0e49\u0e27", color: "purple" },
  voided: { label: "\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01", color: "muted" },
} as const

export type QuotationStatus = keyof typeof QUOTATION_STATUSES

/**
 * Valid status transitions per document type.
 * Terminal states (rejected, converted, voided, expired) have no outgoing transitions.
 */
export const VALID_TRANSITIONS: Record<string, Record<string, string[]>> = {
  QUOTATION: {
    draft: ["sent", "voided"],
    sent: ["accepted", "rejected", "voided"],
    accepted: ["converted"],
  },
}

/**
 * Check if a status transition is allowed for a given document type.
 */
export function canTransition(documentType: string, currentStatus: string, targetStatus: string): boolean {
  const typeTransitions = VALID_TRANSITIONS[documentType]
  if (!typeTransitions) return false
  return typeTransitions[currentStatus]?.includes(targetStatus) ?? false
}

/**
 * Assert a status transition is valid. Throws if not.
 */
export function assertValidTransition(documentType: string, currentStatus: string, targetStatus: string): void {
  if (!canTransition(documentType, currentStatus, targetStatus)) {
    throw new Error(`Invalid transition: ${documentType} cannot go from "${currentStatus}" to "${targetStatus}"`)
  }
}

/**
 * Format a document number in PREFIX-BBBB-NNNN format.
 * BBBB = Buddhist Era year, NNNN = zero-padded sequence number.
 */
export function formatDocumentNumber(prefix: string, buddhistYear: number, sequence: number): string {
  return `${prefix}-${buddhistYear}-${sequence.toString().padStart(4, "0")}`
}

/**
 * Get the Setting code used as the counter key for sequential numbering.
 * Format: seq_{prefix_lowercase}_{buddhistYear}
 */
export function getCounterKey(prefix: string, buddhistYear: number): string {
  return `seq_${prefix.toLowerCase()}_${buddhistYear}`
}

// ─── Quotation Data Types ───────────────────────────────────

export type QuotationLineItem = {
  description: string
  quantity: number
  unit: string
  unitPrice: number   // satang
  discount: number    // satang (per-item discount)
  amount: number      // satang = (quantity * unitPrice) - discount
}

export type QuotationData = {
  id: string
  documentNumber: string
  status: string
  issuedAt: string
  validUntil: string
  paymentTerms: string
  seller: {
    name: string
    taxId: string
    branch: string
    address: string
    logo?: string
  }
  buyer: {
    name: string
    taxId: string
    branch: string
    address: string
  }
  items: QuotationLineItem[]
  subtotal: number
  discountAmount: number
  includeVat: boolean
  vatAmount: number
  total: number
  note?: string
}
