import { describe, it, expect } from "vitest"
import {
  canTransition,
  assertValidTransition,
  formatDocumentNumber,
  getCounterKey,
  DOCUMENT_PREFIXES,
  QUOTATION_STATUSES,
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
