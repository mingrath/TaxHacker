"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import {
  createDocumentFromSource,
  getDocumentById,
  sumReceiptAmountsForInvoice,
  updateDocumentStatus,
} from "@/models/documents"
import { prisma } from "@/lib/db"
import type { QuotationLineItem } from "@/services/document-workflow"

export type ReceiptData = {
  id: string
  documentNumber: string
  status: string
  issuedAt: string
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
  paymentMethod: string
  paymentDate: string
  paidAmount: number
}

export async function createReceiptFromInvoiceAction(
  prevState: ActionState<null> | null,
  formData: FormData
): Promise<ActionState<null>> {
  const sourceDocumentId = formData.get("sourceDocumentId") as string
  let newReceiptId: string | null = null

  try {
    const user = await getCurrentUser()

    if (!sourceDocumentId) {
      return { success: false, error: "ข้อมูลไม่ครบถ้วน" }
    }

    // Load and validate source invoice
    const source = await getDocumentById(user.id, sourceDocumentId)
    if (!source) {
      return { success: false, error: "ไม่พบใบแจ้งหนี้" }
    }
    if (source.documentType !== "INVOICE") {
      return { success: false, error: "เอกสารต้นทางไม่ใช่ใบแจ้งหนี้" }
    }
    if (source.status === "voided" || source.status === "draft") {
      return {
        success: false,
        error: "ใบแจ้งหนี้ต้องมีสถานะ 'ส่งแล้ว' หรือ 'ชำระแล้ว' ก่อนสร้างใบเสร็จ",
      }
    }

    // Create receipt from invoice and check auto-paid in a transaction
    await prisma.$transaction(async (tx) => {
      // Create the new receipt document with payment defaults
      const newReceipt = await createDocumentFromSource(
        user.id,
        sourceDocumentId,
        "RECEIPT",
        {
          paymentMethod: "transfer",
          paymentDate: new Date(),
          paidAmount: source.total, // default to full invoice amount
        }
      )
      newReceiptId = newReceipt.id

      // Check if total receipts sum >= invoice total for auto-paid
      const totalPaid = await sumReceiptAmountsForInvoice(
        user.id,
        sourceDocumentId
      )
      if (totalPaid >= source.total) {
        await tx.document.update({
          where: { id: sourceDocumentId },
          data: { status: "paid" },
        })
      }
    })

    revalidatePath("/apps/invoice")
    revalidatePath("/apps/receipt")
  } catch (error) {
    // CRITICAL: re-throw NEXT_REDIRECT errors (Pitfall 1)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error
    }
    console.error("Failed to create receipt from invoice:", error)
    return { success: false, error: "สร้างใบเสร็จรับเงินไม่สำเร็จ" }
  }

  // Redirect after successful creation (outside try/catch per Pitfall 1)
  if (newReceiptId) {
    redirect(`/apps/receipt/${newReceiptId}`)
  }

  return { success: true }
}

export async function updateReceiptAction(
  prevState: ActionState<null> | null,
  formData: FormData
): Promise<ActionState<null>> {
  try {
    const user = await getCurrentUser()
    const documentId = formData.get("documentId") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const paymentDateStr = formData.get("paymentDate") as string
    const paidAmountStr = formData.get("paidAmount") as string

    if (!documentId) {
      return { success: false, error: "ข้อมูลไม่ครบถ้วน" }
    }

    // Validate receipt exists and is draft
    const receipt = await getDocumentById(user.id, documentId)
    if (!receipt) {
      return { success: false, error: "ไม่พบใบเสร็จ" }
    }
    if (receipt.status !== "draft") {
      return { success: false, error: "แก้ไขได้เฉพาะใบเสร็จที่เป็นแบบร่างเท่านั้น" }
    }

    // Convert paidAmount from baht to satang
    const paidAmount = Math.round(parseFloat(paidAmountStr || "0") * 100)
    const paymentDate = paymentDateStr ? new Date(paymentDateStr) : null

    // Update receipt payment fields
    await prisma.document.update({
      where: { id: documentId },
      data: {
        ...(paymentMethod ? { paymentMethod } : {}),
        ...(paymentDate ? { paymentDate } : {}),
        ...(paidAmountStr ? { paidAmount } : {}),
      },
    })

    // Recalculate if parent invoice should be "paid"
    if (receipt.sourceDocumentId) {
      const totalPaid = await sumReceiptAmountsForInvoice(
        user.id,
        receipt.sourceDocumentId
      )
      const invoice = await getDocumentById(user.id, receipt.sourceDocumentId)
      if (invoice) {
        if (totalPaid >= invoice.total && invoice.status !== "paid") {
          await prisma.document.update({
            where: { id: invoice.id },
            data: { status: "paid" },
          })
        } else if (totalPaid < invoice.total && invoice.status === "paid") {
          await prisma.document.update({
            where: { id: invoice.id },
            data: { status: "sent" },
          })
        }
      }
    }

    revalidatePath(`/apps/receipt/${documentId}`)
    revalidatePath("/apps/receipt")
    revalidatePath("/apps/invoice")
    return { success: true }
  } catch (error) {
    console.error("Failed to update receipt:", error)
    return { success: false, error: "อัปเดตใบเสร็จไม่สำเร็จ" }
  }
}

export async function updateReceiptStatusAction(
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

    // Load receipt to check for void recalculation
    const receipt = await getDocumentById(user.id, documentId)
    if (!receipt) {
      return { success: false, error: "ไม่พบใบเสร็จ" }
    }

    await updateDocumentStatus(user.id, documentId, newStatus)

    // On void: recalculate parent invoice paid status
    if (newStatus === "voided" && receipt.sourceDocumentId) {
      const totalPaid = await sumReceiptAmountsForInvoice(
        user.id,
        receipt.sourceDocumentId
      )
      const invoice = await getDocumentById(user.id, receipt.sourceDocumentId)
      if (invoice && invoice.status === "paid" && totalPaid < invoice.total) {
        // Revert invoice from "paid" to "sent"
        await prisma.document.update({
          where: { id: invoice.id },
          data: { status: "sent" },
        })
      }
    }

    revalidatePath("/apps/receipt")
    revalidatePath("/apps/invoice")
    return { success: true }
  } catch (error) {
    console.error("Failed to update receipt status:", error)
    return { success: false, error: "อัปเดตสถานะไม่สำเร็จ" }
  }
}
