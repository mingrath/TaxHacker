"use server"

import { searchContacts, createContact } from "@/models/contacts"
import { getCurrentUser } from "@/lib/auth"
import { contactFormSchema } from "@/forms/contacts"
import type { Contact } from "@/prisma/client"
import type { ActionState } from "@/lib/actions"

export async function searchContactsAction(query: string): Promise<Contact[]> {
  const user = await getCurrentUser()
  return searchContacts(user.id, query)
}

export async function createContactAction(
  prevState: ActionState<Contact> | null,
  formData: FormData
): Promise<ActionState<Contact>> {
  try {
    const user = await getCurrentUser()
    const raw = Object.fromEntries(formData.entries())
    const parsed = contactFormSchema.safeParse(raw)

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }

    const contact = await createContact(user.id, parsed.data)
    return { success: true, data: contact }
  } catch (error) {
    console.error("Failed to create contact:", error)
    return { success: false, error: "สร้างผู้ติดต่อไม่สำเร็จ" }
  }
}
