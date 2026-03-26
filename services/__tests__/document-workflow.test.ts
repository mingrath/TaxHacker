import { describe, it, expect } from "vitest"
import {
  canTransition,
  assertValidTransition,
  formatDocumentNumber,
  getCounterKey,
  DOCUMENT_PREFIXES,
  QUOTATION_STATUSES,
  INVOICE_STATUSES,
  RECEIPT_STATUSES,
  DELIVERY_NOTE_STATUSES,
  getEffectiveInvoiceStatus,
} from "@/services/document-workflow"

describe("canTransition", () => {
  // Valid QUOTATION transitions
  it("allows draft -> sent", () => {
    expect(canTransition("QUOTATION", "draft", "sent")).toBe(true)
  })

  it("allows draft -> voided", () => {
    expect(canTransition("QUOTATION", "draft", "voided")).toBe(true)
  })

  it("allows sent -> accepted", () => {
    expect(canTransition("QUOTATION", "sent", "accepted")).toBe(true)
  })

  it("allows sent -> rejected", () => {
    expect(canTransition("QUOTATION", "sent", "rejected")).toBe(true)
  })

  it("allows sent -> voided", () => {
    expect(canTransition("QUOTATION", "sent", "voided")).toBe(true)
  })

  it("allows accepted -> converted", () => {
    expect(canTransition("QUOTATION", "accepted", "converted")).toBe(true)
  })

  // Invalid QUOTATION transitions
  it("rejects draft -> accepted (must go through sent)", () => {
    expect(canTransition("QUOTATION", "draft", "accepted")).toBe(false)
  })

  it("rejects rejected -> sent (terminal state)", () => {
    expect(canTransition("QUOTATION", "rejected", "sent")).toBe(false)
  })

  it("rejects converted -> draft (terminal state)", () => {
    expect(canTransition("QUOTATION", "converted", "draft")).toBe(false)
  })

  it("rejects voided -> draft (terminal state)", () => {
    expect(canTransition("QUOTATION", "voided", "draft")).toBe(false)
  })

  // Unknown document type
  it("returns false for unknown document type", () => {
    expect(canTransition("UNKNOWN_TYPE", "draft", "sent")).toBe(false)
  })
})

describe("assertValidTransition", () => {
  it("throws Error with 'Invalid transition' for invalid transition", () => {
    expect(() =>
      assertValidTransition("QUOTATION", "draft", "accepted")
    ).toThrow("Invalid transition")
  })

  it("does not throw for valid transition", () => {
    expect(() =>
      assertValidTransition("QUOTATION", "draft", "sent")
    ).not.toThrow()
  })
})

describe("formatDocumentNumber", () => {
  it("formats QT-2568-0001 for sequence 1", () => {
    expect(formatDocumentNumber("QT", 2568, 1)).toBe("QT-2568-0001")
  })

  it("formats QT-2568-0042 for sequence 42", () => {
    expect(formatDocumentNumber("QT", 2568, 42)).toBe("QT-2568-0042")
  })

  it("formats QT-2568-9999 for sequence 9999", () => {
    expect(formatDocumentNumber("QT", 2568, 9999)).toBe("QT-2568-9999")
  })

  it("formats INV prefix correctly", () => {
    expect(formatDocumentNumber("INV", 2569, 1)).toBe("INV-2569-0001")
  })
})

describe("getCounterKey", () => {
  it("returns lowercase seq_qt_2568 format", () => {
    expect(getCounterKey("QT", 2568)).toBe("seq_qt_2568")
  })

  it("returns lowercase seq_inv_2569 format", () => {
    expect(getCounterKey("INV", 2569)).toBe("seq_inv_2569")
  })
})

describe("DOCUMENT_PREFIXES", () => {
  it("has QUOTATION = QT", () => {
    expect(DOCUMENT_PREFIXES.QUOTATION).toBe("QT")
  })

  it("has INVOICE = INV", () => {
    expect(DOCUMENT_PREFIXES.INVOICE).toBe("INV")
  })

  it("has RECEIPT = RCT", () => {
    expect(DOCUMENT_PREFIXES.RECEIPT).toBe("RCT")
  })

  it("has DELIVERY_NOTE = DLV", () => {
    expect(DOCUMENT_PREFIXES.DELIVERY_NOTE).toBe("DLV")
  })

  it("has TAX_INVOICE = TAX", () => {
    expect(DOCUMENT_PREFIXES.TAX_INVOICE).toBe("TAX")
  })
})

describe("QUOTATION_STATUSES", () => {
  it("has all 7 statuses", () => {
    const keys = Object.keys(QUOTATION_STATUSES)
    expect(keys).toEqual(
      expect.arrayContaining([
        "draft",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "converted",
        "voided",
      ])
    )
    expect(keys).toHaveLength(7)
  })

  it("draft label is Thai", () => {
    expect(QUOTATION_STATUSES.draft.label).toBe("\u0e41\u0e1a\u0e1a\u0e23\u0e48\u0e32\u0e07")
  })
})

// ─── INVOICE status transitions ───────────────────────────────
describe("canTransition — INVOICE", () => {
  it("allows draft -> sent", () => {
    expect(canTransition("INVOICE", "draft", "sent")).toBe(true)
  })

  it("allows draft -> voided", () => {
    expect(canTransition("INVOICE", "draft", "voided")).toBe(true)
  })

  it("allows sent -> paid", () => {
    expect(canTransition("INVOICE", "sent", "paid")).toBe(true)
  })

  it("allows sent -> voided", () => {
    expect(canTransition("INVOICE", "sent", "voided")).toBe(true)
  })

  it("rejects paid -> draft (terminal)", () => {
    expect(canTransition("INVOICE", "paid", "draft")).toBe(false)
  })

  it("rejects voided -> sent (terminal)", () => {
    expect(canTransition("INVOICE", "voided", "sent")).toBe(false)
  })
})

// ─── RECEIPT status transitions ───────────────────────────────
describe("canTransition — RECEIPT", () => {
  it("allows draft -> confirmed", () => {
    expect(canTransition("RECEIPT", "draft", "confirmed")).toBe(true)
  })

  it("allows draft -> voided", () => {
    expect(canTransition("RECEIPT", "draft", "voided")).toBe(true)
  })

  it("rejects confirmed -> draft (terminal)", () => {
    expect(canTransition("RECEIPT", "confirmed", "draft")).toBe(false)
  })
})

// ─── DELIVERY_NOTE status transitions ─────────────────────────
describe("canTransition — DELIVERY_NOTE", () => {
  it("allows draft -> delivered", () => {
    expect(canTransition("DELIVERY_NOTE", "draft", "delivered")).toBe(true)
  })

  it("allows draft -> voided", () => {
    expect(canTransition("DELIVERY_NOTE", "draft", "voided")).toBe(true)
  })

  it("rejects delivered -> draft (terminal)", () => {
    expect(canTransition("DELIVERY_NOTE", "delivered", "draft")).toBe(false)
  })
})

// ─── Status maps ──────────────────────────────────────────────
describe("INVOICE_STATUSES", () => {
  it("has 5 statuses: draft, sent, overdue, paid, voided", () => {
    const keys = Object.keys(INVOICE_STATUSES)
    expect(keys).toEqual(
      expect.arrayContaining(["draft", "sent", "overdue", "paid", "voided"])
    )
    expect(keys).toHaveLength(5)
  })

  it("has correct Thai labels", () => {
    expect(INVOICE_STATUSES.draft.label).toBe("แบบร่าง")
    expect(INVOICE_STATUSES.sent.label).toBe("ส่งแล้ว")
    expect(INVOICE_STATUSES.overdue.label).toBe("เกินกำหนด")
    expect(INVOICE_STATUSES.paid.label).toBe("ชำระแล้ว")
    expect(INVOICE_STATUSES.voided.label).toBe("ยกเลิก")
  })
})

describe("RECEIPT_STATUSES", () => {
  it("has 3 statuses: draft, confirmed, voided", () => {
    const keys = Object.keys(RECEIPT_STATUSES)
    expect(keys).toEqual(
      expect.arrayContaining(["draft", "confirmed", "voided"])
    )
    expect(keys).toHaveLength(3)
  })

  it("has correct Thai labels", () => {
    expect(RECEIPT_STATUSES.draft.label).toBe("แบบร่าง")
    expect(RECEIPT_STATUSES.confirmed.label).toBe("ยืนยันแล้ว")
    expect(RECEIPT_STATUSES.voided.label).toBe("ยกเลิก")
  })
})

describe("DELIVERY_NOTE_STATUSES", () => {
  it("has 3 statuses: draft, delivered, voided", () => {
    const keys = Object.keys(DELIVERY_NOTE_STATUSES)
    expect(keys).toEqual(
      expect.arrayContaining(["draft", "delivered", "voided"])
    )
    expect(keys).toHaveLength(3)
  })

  it("has correct Thai labels", () => {
    expect(DELIVERY_NOTE_STATUSES.draft.label).toBe("แบบร่าง")
    expect(DELIVERY_NOTE_STATUSES.delivered.label).toBe("ส่งแล้ว")
    expect(DELIVERY_NOTE_STATUSES.voided.label).toBe("ยกเลิก")
  })
})

// ─── getEffectiveInvoiceStatus ─────────────────────────────────
describe("getEffectiveInvoiceStatus", () => {
  it('returns "overdue" when status is "sent" and dueDate is in the past', () => {
    const pastDate = new Date("2020-01-01")
    expect(getEffectiveInvoiceStatus("sent", pastDate)).toBe("overdue")
  })

  it('returns "sent" when status is "sent" and dueDate is in the future', () => {
    const futureDate = new Date("2099-12-31")
    expect(getEffectiveInvoiceStatus("sent", futureDate)).toBe("sent")
  })

  it('returns "sent" when status is "sent" and dueDate is null', () => {
    expect(getEffectiveInvoiceStatus("sent", null)).toBe("sent")
  })

  it("returns status as-is for non-sent statuses", () => {
    expect(getEffectiveInvoiceStatus("draft", new Date("2020-01-01"))).toBe("draft")
    expect(getEffectiveInvoiceStatus("paid", new Date("2020-01-01"))).toBe("paid")
  })
})
