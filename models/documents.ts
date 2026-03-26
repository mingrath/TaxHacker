import { prisma } from "@/lib/db"
import {
  assertValidTransition,
  formatDocumentNumber,
  getCounterKey,
  DOCUMENT_PREFIXES,
} from "@/services/document-workflow"
import { toBuddhistYear } from "@/services/thai-date"

export type CreateDocumentInput = {
  documentType: string
  contactId?: string | null
  issuedAt?: Date | null
  validUntil?: Date | null
  paymentTerms?: string | null
  subtotal: number
  discountAmount: number
  vatRate: number
  vatAmount: number
  total: number
  items: unknown[]
  sellerData?: unknown
  buyerData?: unknown
  note?: string | null
}

/**
 * Create a new document with an auto-generated sequential number.
 * Uses prisma.$transaction for atomic counter increment.
 */
export async function createDocument(userId: string, input: CreateDocumentInput) {
  const now = new Date()
  const gregorianYear = now.getFullYear()
  const buddhistYear = toBuddhistYear(gregorianYear)
  const prefix =
    DOCUMENT_PREFIXES[input.documentType as keyof typeof DOCUMENT_PREFIXES] ||
    input.documentType
  const counterKey = getCounterKey(prefix, buddhistYear)

  return prisma.$transaction(async (tx) => {
    const current = await tx.setting.findFirst({
      where: { userId, code: counterKey },
    })
    const nextSeq = parseInt(current?.value ?? "0", 10) + 1
    await tx.setting.upsert({
      where: { userId_code: { userId, code: counterKey } },
      update: { value: nextSeq.toString() },
      create: {
        userId,
        code: counterKey,
        name: counterKey,
        value: nextSeq.toString(),
      },
    })
    const documentNumber = formatDocumentNumber(prefix, buddhistYear, nextSeq)

    return tx.document.create({
      data: {
        userId,
        documentType: input.documentType,
        documentNumber,
        status: "draft",
        contactId: input.contactId ?? null,
        issuedAt: input.issuedAt ?? now,
        validUntil: input.validUntil ?? null,
        paymentTerms: input.paymentTerms ?? null,
        subtotal: input.subtotal,
        discountAmount: input.discountAmount,
        vatRate: input.vatRate,
        vatAmount: input.vatAmount,
        total: input.total,
        items: input.items as unknown[],
        sellerData: (input.sellerData as object) ?? null,
        buyerData: (input.buyerData as object) ?? null,
        note: input.note ?? null,
      },
    })
  })
}

/**
 * Get a single document by ID, scoped to the given user.
 */
export async function getDocumentById(userId: string, documentId: string) {
  return prisma.document.findFirst({
    where: { id: documentId, userId },
  })
}

/**
 * List documents for a user with optional filters.
 */
export async function listDocuments(
  userId: string,
  filters?: {
    documentType?: string
    status?: string
    limit?: number
    offset?: number
  }
) {
  return prisma.document.findMany({
    where: {
      userId,
      ...(filters?.documentType
        ? { documentType: filters.documentType }
        : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit,
    skip: filters?.offset,
  })
}

/**
 * Update a document's status, enforcing the state machine.
 * Throws if the transition is invalid.
 */
export async function updateDocumentStatus(
  userId: string,
  documentId: string,
  newStatus: string
) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId },
  })
  if (!doc) throw new Error("Document not found")
  assertValidTransition(doc.documentType, doc.status, newStatus)
  return prisma.document.update({
    where: { id: documentId },
    data: { status: newStatus },
  })
}
