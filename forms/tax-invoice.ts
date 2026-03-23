import { z } from "zod"

/**
 * Tax Invoice form schema enforcing Section 86/4 required fields.
 *
 * Fields auto-populated (not in form):
 *   1 = "ใบกำกับภาษี" header (PDF only)
 *   2 = Seller info (from business profile)
 *   6 = VAT computed from item totals
 *   8 = Branch designation (from business profile + contact)
 */
export const taxInvoiceFormSchema = z.object({
  // Field 3: Buyer info (from selected contact)
  contactId: z.string().min(1, "กรุณาเลือกผู้ซื้อ"),

  // Field 4: Sequential number (auto-generated, read-only in form)
  documentNumber: z.string().optional(),

  // Field 5: Line items — description, quantity, unit price
  items: z
    .array(
      z.object({
        description: z.string().min(1, "กรุณากรอกรายละเอียด"),
        quantity: z.coerce.number().min(1, "จำนวนต้องมากกว่า 0"),
        unitPrice: z.coerce.number().min(0, "ราคาต่อหน่วยต้องไม่ติดลบ"), // in satang
      })
    )
    .min(1, "กรุณาเพิ่มอย่างน้อย 1 รายการ"),

  // Field 7: Date of issuance
  issuedAt: z.string().min(1, "กรุณาเลือกวันที่ออก"),

  // Additional fields
  note: z.string().optional(),
})

export type TaxInvoiceFormData = z.infer<typeof taxInvoiceFormSchema>
