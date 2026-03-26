"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { formatThaiDate } from "@/services/thai-date"
import { getEffectiveInvoiceStatus } from "@/services/document-workflow"
import { StatusBadge } from "./status-badge"
import { ChainBadges } from "./chain-badges"
import { DocumentFilters, type DocumentFilterState } from "./document-filters"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Document } from "@/prisma/client"

type ChainDoc = {
  id: string
  documentNumber: string
  documentType: string
}

type DocumentWithChain = Document & {
  sourceDocument: ChainDoc | null
  derivedDocuments: ChainDoc[]
}

const TYPE_ROUTE_MAP: Record<string, string> = {
  QUOTATION: "quotation",
  INVOICE: "invoice",
  RECEIPT: "receipt",
  DELIVERY_NOTE: "delivery-note",
}

const TYPE_LABELS: Record<string, string> = {
  QUOTATION: "ใบเสนอราคา",
  INVOICE: "ใบแจ้งหนี้",
  RECEIPT: "ใบเสร็จรับเงิน",
  DELIVERY_NOTE: "ใบส่งของ",
}

const TYPE_BADGE_STYLES: Record<string, string> = {
  QUOTATION:
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  INVOICE: "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300",
  RECEIPT: "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300",
  DELIVERY_NOTE:
    "bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300",
}

/**
 * Compute display status: lazy expiry for quotations, overdue for invoices.
 */
function getDisplayStatus(doc: Document): string {
  if (
    doc.documentType === "QUOTATION" &&
    doc.status === "sent" &&
    doc.validUntil &&
    new Date(doc.validUntil) < new Date()
  ) {
    return "expired"
  }
  if (doc.documentType === "INVOICE") {
    return getEffectiveInvoiceStatus(doc.status, doc.dueDate)
  }
  return doc.status
}

export function DocumentTable({
  documents,
}: {
  documents: DocumentWithChain[]
}) {
  const router = useRouter()
  const [filters, setFilters] = useState<DocumentFilterState>({
    documentType: "all",
    status: "all",
    dateFrom: undefined,
    dateTo: undefined,
  })

  // Client-side filtering
  const filteredDocs = documents.filter((doc) => {
    if (filters.documentType !== "all" && doc.documentType !== filters.documentType) {
      return false
    }
    if (filters.status !== "all") {
      const displayStatus = getDisplayStatus(doc)
      if (displayStatus !== filters.status) {
        return false
      }
    }
    if (filters.dateFrom && doc.issuedAt) {
      const issuedDate = new Date(doc.issuedAt)
      if (issuedDate < filters.dateFrom) return false
    }
    if (filters.dateTo && doc.issuedAt) {
      const issuedDate = new Date(doc.issuedAt)
      const endOfDay = new Date(filters.dateTo)
      endOfDay.setHours(23, 59, 59, 999)
      if (issuedDate > endOfDay) return false
    }
    return true
  })

  function handleRowClick(doc: DocumentWithChain) {
    const route = TYPE_ROUTE_MAP[doc.documentType] ?? "documents"
    router.push(`/apps/${route}/${doc.id}`)
  }

  return (
    <div className="space-y-4">
      <DocumentFilters filters={filters} onFilterChange={setFilters} />

      {filteredDocs.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center space-y-2">
          <p className="font-medium">ยังไม่มีเอกสาร</p>
          <p className="text-sm text-muted-foreground">
            สร้างเอกสารใหม่จากหน้าใบเสนอราคาหรือใบแจ้งหนี้
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead className="text-right">ยอดรวม</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>เอกสารที่เกี่ยวข้อง</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => {
                const displayStatus = getDisplayStatus(doc)
                const buyerData = doc.buyerData as {
                  name?: string
                } | null
                const buyerName = buyerData?.name ?? "\u2014"
                const route = TYPE_ROUTE_MAP[doc.documentType] ?? "documents"
                const typeLabel = TYPE_LABELS[doc.documentType] ?? doc.documentType
                const typeStyle =
                  TYPE_BADGE_STYLES[doc.documentType] ??
                  "bg-secondary text-secondary-foreground"

                return (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(doc)}
                  >
                    <TableCell>
                      <Link
                        href={`/apps/${route}/${doc.id}`}
                        className="text-primary hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {doc.documentNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${typeStyle} text-xs`}
                      >
                        {typeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.issuedAt
                        ? formatThaiDate(new Date(doc.issuedAt))
                        : "\u2014"}
                    </TableCell>
                    <TableCell>{buyerName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(doc.total, "THB")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={displayStatus} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ChainBadges
                        sourceDocument={doc.sourceDocument}
                        derivedDocuments={doc.derivedDocuments}
                        currentDoc={{
                          id: doc.id,
                          documentNumber: doc.documentNumber,
                          documentType: doc.documentType,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
