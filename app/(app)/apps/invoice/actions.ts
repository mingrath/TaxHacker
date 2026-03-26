"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { addDays } from "date-fns"
import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { invoiceFormSchema } from "@/forms/invoice"
import { getBusinessProfile } from "@/models/business-profile"
import { getContactById } from "@/models/contacts"
import {
  createDocument,
  createDocumentFromSource,
  getDocumentById,
  updateDocumentStatus,
} from "@/models/documents"
import { computeVATOnSubtotal, VAT_RATE } from "@/services/tax-calculator"
import { prisma } from "@/lib/db"
import type { QuotationLineItem } from "@/services/document-workflow"

export type InvoiceData = {
  id: string
  documentNumber: string
  status: string
  issuedAt: string
  dueDate: string
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

export async function createInvoiceAction(
  prevState: ActionState<InvoiceData> | null,
  formData: FormData
): Promise<ActionState<InvoiceData>> {
  try {
    const user = await getCurrentUser()

    // 1. Parse scalar fields from formData
    const raw = Object.fromEntries(formData.entries())
    const parsed = invoiceFormSchema.safeParse(raw)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    // 2. Parse line items from dynamic FormData arrays
    const itemDescriptions = formData.getAll("item_description") as string[]
    const itemQuantities = formData.getAll("item_quantity") as string[]
    const itemUnits = formData.getAll("item_unit") as string[]
    const itemUnitPrices = formData.getAll("item_unitPrice") as string[]
    const itemDiscounts = formData.getAll("item_discount") as string[]

    // 3. Validate at least 1 line item with description
    const validDescriptions = itemDescriptions.filter((d) => d.trim().length > 0)
    if (validDescriptions.length === 0) {
      return { success: false, error: "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e19\u0e49\u0e2d\u0e22 1 \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23" }
    }

    // 4. Map line items with baht-to-satang conversion at the action boundary
    const items: QuotationLineItem[] = itemDescriptions
      .map((desc, i) => {
        if (!desc.trim()) return null
        const qty = parseFloat(itemQuantities[i] || "0")
        const unitPrice = Math.round(parseFloat(itemUnitPrices[i] || "0") * 100) // baht to satang
        const discount = Math.round(parseFloat(itemDiscounts[i] || "0") * 100) // baht to satang
        const amount = Math.round(qty * unitPrice) - discount
        return {
          description: desc,
          quantity: qty,
          unit: itemUnits[i] || "\u0e0a\u0e34\u0e49\u0e19",
          unitPrice,
          discount,
          amount,
        }
      })
      .filter((item): item is QuotationLineItem => item !== null)

    // 5. Compute totals: per-item amounts -> subtotal -> overall discount -> VAT -> total
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const overallDiscount = Math.round(parsed.data.overallDiscount * 100) // baht to satang
    const subtotalAfterDiscount = subtotal - overallDiscount
    const includeVat = parsed.data.includeVat === "true"
    const vatResult = includeVat
      ? computeVATOnSubtotal(subtotalAfterDiscount)
      : { vatAmount: 0, total: subtotalAfterDiscount, subtotal: subtotalAfterDiscount }
    const vatRate = includeVat ? VAT_RATE : 0
    const total = subtotalAfterDiscount + vatResult.vatAmount

    // 6. Load business profile for seller snapshot
    const profile = await getBusinessProfile(user.id)
    if (!profile.companyName || !profile.taxId) {
      return { success: false, error: "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e01\u0e23\u0e2d\u0e01\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08\u0e01\u0e48\u0e2d\u0e19" }
    }

    // 7. Load contact for buyer snapshot
    const contact = await getContactById(user.id, parsed.data.contactId)
    if (!contact) {
      return { success: false, error: "\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e1c\u0e39\u0e49\u0e15\u0e34\u0e14\u0e15\u0e48\u0e2d" }
    }

    // 8. Parse dueDate
    const issuedDate = new Date(parsed.data.issuedAt)
    const dueDate = new Date(parsed.data.dueDate)

    // 9. Create document via the Document model layer
    const doc = await createDocument(user.id, {
      documentType: "INVOICE",
      contactId: parsed.data.contactId,
      issuedAt: issuedDate,
      dueDate,
      paymentTerms: parsed.data.paymentTerms || null,
      subtotal: subtotalAfterDiscount,
      discountAmount: overallDiscount,
      vatRate,
      vatAmount: vatResult.vatAmount,
      total,
      items,
      sellerData: {
        name: profile.companyName,
        taxId: profile.taxId,
        branch: profile.branch,
        address: profile.address,
      },
      buyerData: {
        name: contact.name,
        taxId: contact.taxId,
        branch: contact.branch,
        address: contact.address,
      },
      note: parsed.data.note || null,
    })

    // 10. Build InvoiceData response
    const invoiceData: InvoiceData = {
      id: doc.id,
      documentNumber: doc.documentNumber,
      status: doc.status,
      issuedAt: parsed.data.issuedAt,
      dueDate: parsed.data.dueDate,
      paymentTerms: parsed.data.paymentTerms || "",
      seller: {
        name: profile.companyName,
        taxId: profile.taxId,
        branch: profile.branch,
        address: profile.address,
      },
      buyer: {
        name: contact.name,
        taxId: contact.taxId,
        branch: contact.branch,
        address: contact.address,
      },
      items,
      subtotal: subtotalAfterDiscount,
      discountAmount: overallDiscount,
      includeVat,
      vatAmount: vatResult.vatAmount,
      total,
      note: parsed.data.note || undefined,
    }

    revalidatePath("/apps/invoice")
    return { success: true, data: invoiceData }
  } catch (error) {
    console.error("Failed to create invoice:", error)
    return { success: false, error: "\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e43\u0e1a\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08" }
  }
}

export async function convertQuotationToInvoiceAction(
  prevState: ActionState<null> | null,
  formData: FormData
): Promise<ActionState<null>> {
  const sourceDocumentId = formData.get("sourceDocumentId") as string
  let newInvoiceId: string | null = null

  try {
    const user = await getCurrentUser()

    if (!sourceDocumentId) {
      return { success: false, error: "\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e44\u0e21\u0e48\u0e04\u0e23\u0e1a\u0e16\u0e49\u0e27\u0e19" }
    }

    // Load and validate source quotation
    const source = await getDocumentById(user.id, sourceDocumentId)
    if (!source) {
      return { success: false, error: "\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e43\u0e1a\u0e40\u0e2a\u0e19\u0e2d\u0e23\u0e32\u0e04\u0e32" }
    }
    if (source.documentType !== "QUOTATION") {
      return { success: false, error: "\u0e40\u0e2d\u0e01\u0e2a\u0e32\u0e23\u0e15\u0e49\u0e19\u0e17\u0e32\u0e07\u0e44\u0e21\u0e48\u0e43\u0e0a\u0e48\u0e43\u0e1a\u0e40\u0e2a\u0e19\u0e2d\u0e23\u0e32\u0e04\u0e32" }
    }
    if (source.status !== "accepted") {
      return {
        success: false,
        error: "\u0e43\u0e1a\u0e40\u0e2a\u0e19\u0e2d\u0e23\u0e32\u0e04\u0e32\u0e15\u0e49\u0e2d\u0e07\u0e21\u0e35\u0e2a\u0e16\u0e32\u0e19\u0e30 '\u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34' \u0e01\u0e48\u0e2d\u0e19\u0e41\u0e1b\u0e25\u0e07\u0e40\u0e1b\u0e47\u0e19\u0e43\u0e1a\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49",
      }
    }

    // Create invoice from source and update source status in a transaction
    await prisma.$transaction(async (tx) => {
      // Create the new invoice document
      const newInvoice = await createDocumentFromSource(
        user.id,
        sourceDocumentId,
        "INVOICE",
        { dueDate: addDays(new Date(), 30) }
      )
      newInvoiceId = newInvoice.id

      // Mark the source quotation as "converted"
      await tx.document.update({
        where: { id: sourceDocumentId },
        data: { status: "converted" },
      })
    })

    revalidatePath("/apps/quotation")
    revalidatePath("/apps/invoice")
  } catch (error) {
    // CRITICAL: re-throw NEXT_REDIRECT errors (Pitfall 1 from research)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }
    // Also handle the redirect error from Next.js internal mechanism
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error
    }
    console.error("Failed to convert quotation to invoice:", error)
    return { success: false, error: "\u0e41\u0e1b\u0e25\u0e07\u0e43\u0e1a\u0e40\u0e2a\u0e19\u0e2d\u0e23\u0e32\u0e04\u0e32\u0e40\u0e1b\u0e47\u0e19\u0e43\u0e1a\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08" }
  }

  // Redirect after successful conversion (outside try/catch per Pitfall 1)
  if (newInvoiceId) {
    redirect(`/apps/invoice/${newInvoiceId}`)
  }

  return { success: true }
}

export async function updateInvoiceStatusAction(
  prevState: ActionState<null> | null,
  formData: FormData
): Promise<ActionState<null>> {
  try {
    const user = await getCurrentUser()
    const documentId = formData.get("documentId") as string
    const newStatus = formData.get("newStatus") as string

    if (!documentId || !newStatus) {
      return { success: false, error: "\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e44\u0e21\u0e48\u0e04\u0e23\u0e1a\u0e16\u0e49\u0e27\u0e19" }
    }

    await updateDocumentStatus(user.id, documentId, newStatus)
    revalidatePath("/apps/invoice")
    return { success: true }
  } catch (error) {
    console.error("Failed to update invoice status:", error)
    return { success: false, error: "\u0e2d\u0e31\u0e1b\u0e40\u0e14\u0e15\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08" }
  }
}
