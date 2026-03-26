"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import {
  createDocumentFromSource,
  getDocumentById,
  updateDocumentStatus,
} from "@/models/documents"
import { prisma } from "@/lib/db"

export async function createDeliveryNoteFromSourceAction(
  prevState: ActionState<null> | null,
  formData: FormData
): Promise<ActionState<null>> {
  const sourceDocumentId = formData.get("sourceDocumentId") as string
  let newDocId: string | null = null

  try {
    const user = await getCurrentUser()

    if (!sourceDocumentId) {
      return { success: false, error: "ข้อมูลไม่ครบถ้วน" }
    }

    // Load and validate source document
    const source = await getDocumentById(user.id, sourceDocumentId)
    if (!source) {
      return { success: false, error: "ไม่พบเอกสารต้นทาง" }
    }
    if (source.status === "voided") {
      return { success: false, error: "เอกสารต้นทางถูกยกเลิกแล้ว" }
    }

    // Validate source type and status
    if (source.documentType === "QUOTATION") {
      if (!["accepted", "converted"].includes(source.status)) {
        return {
          success: false,
          error: "ใบเสนอราคาต้องมีสถานะ 'อนุมัติ' หรือ 'แปลงแล้ว' ก่อนสร้างใบส่งของ",
        }
      }
    } else if (source.documentType === "INVOICE") {
      if (source.status === "draft") {
        return {
          success: false,
          error: "ใบแจ้งหนี้ต้องมีสถานะ 'ส่งแล้ว' ก่อนสร้างใบส่งของ",
        }
      }
    } else {
      return { success: false, error: "เอกสารต้นทางไม่ถูกต้อง" }
    }

    // Create delivery note from source (do NOT update source status)
    await prisma.$transaction(async () => {
      const newDoc = await createDocumentFromSource(
        user.id,
        sourceDocumentId,
        "DELIVERY_NOTE"
      )
      newDocId = newDoc.id
    })

    revalidatePath("/apps/quotation")
    revalidatePath("/apps/invoice")
    revalidatePath("/apps/delivery-note")
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
    console.error("Failed to create delivery note:", error)
    return { success: false, error: "สร้างใบส่งของไม่สำเร็จ" }
  }

  // Redirect after successful creation (outside try/catch per Pitfall 1)
  if (newDocId) {
    redirect(`/apps/delivery-note/${newDocId}`)
  }

  return { success: true }
}

export async function updateDeliveryNoteStatusAction(
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
    revalidatePath("/apps/delivery-note")
    return { success: true }
  } catch (error) {
    console.error("Failed to update delivery note status:", error)
    return { success: false, error: "อัปเดตสถานะไม่สำเร็จ" }
  }
}
