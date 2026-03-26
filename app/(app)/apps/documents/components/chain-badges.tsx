"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

type ChainDoc = {
  id: string
  documentNumber: string
  documentType: string
}

const TYPE_ROUTE_MAP: Record<string, string> = {
  QUOTATION: "quotation",
  INVOICE: "invoice",
  RECEIPT: "receipt",
  DELIVERY_NOTE: "delivery-note",
}

const TYPE_BADGE_STYLES: Record<string, string> = {
  QUOTATION: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  INVOICE: "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300",
  RECEIPT: "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300",
  DELIVERY_NOTE:
    "bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300",
}

/**
 * Abbreviate document number: "QT-2568-0001" -> "QT-0001"
 */
function abbreviateDocNumber(docNumber: string): string {
  const parts = docNumber.split("-")
  if (parts.length === 3) {
    return `${parts[0]}-${parts[2]}`
  }
  return docNumber
}

export function ChainBadges({
  sourceDocument,
  derivedDocuments,
  currentDoc,
}: {
  sourceDocument?: ChainDoc | null
  derivedDocuments: ChainDoc[]
  currentDoc: ChainDoc
}) {
  const chain: ChainDoc[] = []

  if (sourceDocument) {
    chain.push(sourceDocument)
  }

  chain.push(currentDoc)

  for (const derived of derivedDocuments) {
    if (derived.id !== currentDoc.id) {
      chain.push(derived)
    }
  }

  if (chain.length <= 1) {
    return <span className="text-muted-foreground text-xs">--</span>
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {chain.map((doc, index) => {
        const route = TYPE_ROUTE_MAP[doc.documentType] ?? "documents"
        const style =
          TYPE_BADGE_STYLES[doc.documentType] ??
          "bg-secondary text-secondary-foreground"
        const isCurrent = doc.id === currentDoc.id

        return (
          <span key={doc.id} className="flex items-center gap-1">
            {index > 0 && (
              <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
            {isCurrent ? (
              <Badge
                variant="outline"
                className={`${style} text-xs px-2 py-0.5 opacity-60`}
              >
                {abbreviateDocNumber(doc.documentNumber)}
              </Badge>
            ) : (
              <Link
                href={`/apps/${route}/${doc.id}`}
                className="hover:opacity-80 transition"
              >
                <Badge
                  variant="outline"
                  className={`${style} text-xs px-2 py-0.5 cursor-pointer`}
                >
                  {abbreviateDocNumber(doc.documentNumber)}
                </Badge>
              </Link>
            )}
          </span>
        )
      })}
    </div>
  )
}
