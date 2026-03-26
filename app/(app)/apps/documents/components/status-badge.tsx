"use client"

import { Badge } from "@/components/ui/badge"
import { ALL_DOCUMENT_STATUSES } from "@/services/document-workflow"

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground",
  sent: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  accepted:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  rejected: "bg-destructive/10 text-destructive",
  expired:
    "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  converted:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  overdue:
    "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  paid: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  confirmed:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  delivered:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  voided: "bg-muted text-muted-foreground",
}

type StatusMapEntry = { label: string; color: string }

export function StatusBadge({
  status,
  statusMap,
}: {
  status: string
  statusMap?: Record<string, StatusMapEntry>
}) {
  const effectiveMap = statusMap ?? ALL_DOCUMENT_STATUSES
  const statusInfo = effectiveMap[status as keyof typeof effectiveMap] as
    | StatusMapEntry
    | undefined
  const label = statusInfo?.label ?? status
  const className =
    STATUS_STYLES[status] ?? "bg-secondary text-secondary-foreground"

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
