"use client"

import { Badge } from "@/components/ui/badge"
import { QUOTATION_STATUSES } from "@/services/document-workflow"

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground",
  sent: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  accepted: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  converted: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  voided: "bg-muted text-muted-foreground",
}

export function StatusBadge({ status }: { status: string }) {
  const statusInfo = QUOTATION_STATUSES[status as keyof typeof QUOTATION_STATUSES]
  const label = statusInfo?.label ?? status
  const className = STATUS_STYLES[status] ?? "bg-secondary text-secondary-foreground"

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
