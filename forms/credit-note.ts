import { z } from "zod"

export const creditNoteFormSchema = z.object({
  originalInvoiceKey: z.string().min(1, "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e43\u0e1a\u0e01\u0e33\u0e01\u0e31\u0e1a\u0e20\u0e32\u0e29\u0e35\u0e15\u0e49\u0e19\u0e09\u0e1a\u0e31\u0e1a"),
  noteType: z.enum(["credit", "debit"]),
  issuedAt: z.string().min(1, "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e2d\u0e2d\u0e01"),
  reason: z.string().min(1, "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e23\u0e30\u0e1a\u0e38\u0e40\u0e2b\u0e15\u0e38\u0e1c\u0e25"),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e01\u0e23\u0e2d\u0e01\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14"),
        originalAmount: z.coerce.number(), // satang
        correctedAmount: z.coerce.number(), // satang
      })
    )
    .min(1, "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e19\u0e49\u0e2d\u0e22 1 \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23"),
  note: z.string().optional(),
})

export type CreditNoteFormData = z.infer<typeof creditNoteFormSchema>
