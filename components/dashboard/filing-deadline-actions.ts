"use server"

import { getCurrentUser } from "@/lib/auth"
import { upsertFilingStatus } from "@/models/filing-status"
import { revalidatePath } from "next/cache"

export async function toggleFilingStatusAction(
  formType: string,
  taxMonth: number,
  taxYear: number,
  currentStatus: string
) {
  const user = await getCurrentUser()
  const newStatus = currentStatus === "filed" ? "pending" : "filed"
  const filedAt = newStatus === "filed" ? new Date() : null
  await upsertFilingStatus(user.id, {
    formType,
    taxMonth,
    taxYear,
    status: newStatus,
    filedAt,
  })
  revalidatePath("/dashboard")
  return { success: true }
}
