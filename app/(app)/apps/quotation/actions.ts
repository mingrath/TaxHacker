"use server"

import { revalidatePath } from "next/cache"
import { addDays } from "date-fns"
import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { quotationFormSchema } from "@/forms/quotation"
import { getBusinessProfile } from "@/models/business-profile"
import { getContactById } from "@/models/contacts"
import { createDocument, listDocuments, updateDocumentStatus } from "@/models/documents"
import { computeVATOnSubtotal, VAT_RATE } from "@/services/tax-calculator"
import type { QuotationData, QuotationLineItem } from "@/services/document-workflow"
import type { Document } from "@/prisma/client"

export async function createQuotationAction(
  prevState: ActionState<QuotationData> | null,
  formData: FormData
): Promise<ActionState<QuotationData>> {
  try {
    const user = await getCurrentUser()

    // 1. Parse scalar fields from formData
    const raw = Object.fromEntries(formData.entries())
    const parsed = quotationFormSchema.safeParse(raw)
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
      return { success: false, error: "กรุณาเพิ่มอย่างน้อย 1 รายการ" }
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
          unit: itemUnits[i] || "ชิ้น",
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
      return { success: false, error: "กรุณากรอกข้อมูลธุรกิจก่อน" }
    }

    // 7. Load contact for buyer snapshot
    const contact = await getContactById(user.id, parsed.data.contactId)
    if (!contact) {
      return { success: false, error: "ไม่พบผู้ติดต่อ" }
    }

    // 8. Compute validUntil from issuedAt + validityDays
    const issuedDate = new Date(parsed.data.issuedAt)
    const validUntil = addDays(issuedDate, parsed.data.validityDays)

    // 9. Create document via the Document model layer
    const doc = await createDocument(user.id, {
      documentType: "QUOTATION",
      contactId: parsed.data.contactId,
      issuedAt: issuedDate,
      validUntil,
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

    // 10. Build QuotationData response
    const quotationData: QuotationData = {
      id: doc.id,
      documentNumber: doc.documentNumber,
      status: doc.status,
      issuedAt: parsed.data.issuedAt,
      validUntil: validUntil.toISOString(),
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

    revalidatePath("/apps/quotation")
    return { success: true, data: quotationData }
  } catch (error) {
    console.error("Failed to create quotation:", error)
    return { success: false, error: "สร้างใบเสนอราคาไม่สำเร็จ" }
  }
}

export async function updateQuotationStatusAction(
  prevState: ActionState<null> | null,
  formData: FormData
): Promise<ActionState<null>> {
  try {
    const user = await getCurrentUser()
    const documentId = formData.get("documentId") as string
    const newStatus = formData.get("newStatus") as string

    if (!documentId || !newStatus) {
      return { success: false, error: "ข้อมูลไม่ครบถ้วน" }
    }

    await updateDocumentStatus(user.id, documentId, newStatus)
    revalidatePath("/apps/quotation")
    return { success: true }
  } catch (error) {
    console.error("Failed to update quotation status:", error)
    return { success: false, error: "อัปเดตสถานะไม่สำเร็จ" }
  }
}

export async function listQuotationsAction(): Promise<ActionState<Document[]>> {
  try {
    const user = await getCurrentUser()
    const documents = await listDocuments(user.id, { documentType: "QUOTATION" })
    return { success: true, data: documents }
  } catch (error) {
    console.error("Failed to list quotations:", error)
    return { success: false, error: "โหลดรายการใบเสนอราคาไม่สำเร็จ" }
  }
}
