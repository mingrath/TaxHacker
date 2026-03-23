"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ValidationResult } from "@/ai/validators/tax-invoice-validator"
import { Check, X, Minus, AlertTriangle, ShieldCheck } from "lucide-react"

type ValidationBadgeProps = {
  status: "valid" | "invalid" | "missing" | "not_applicable"
  message?: string
}

export function ValidationBadge({ status, message }: ValidationBadgeProps) {
  switch (status) {
    case "valid":
      return (
        <Badge
          variant="outline"
          className="gap-1 text-green-600 border-green-200 bg-green-50/50 dark:text-green-400 dark:border-green-800 dark:bg-green-950/30"
          title={message}
        >
          <Check className="h-3 w-3" />
        </Badge>
      )
    case "invalid":
      return (
        <Badge
          variant="outline"
          className="gap-1 text-red-600 border-red-200 bg-red-50/50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/30"
          title={message}
        >
          <X className="h-3 w-3" />
          {message && <span className="text-xs max-w-[160px] truncate">{message}</span>}
        </Badge>
      )
    case "missing":
      return (
        <Badge
          variant="outline"
          className="gap-1 text-red-600 border-red-200 bg-red-50/50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/30"
          title={message}
        >
          <X className="h-3 w-3" />
          {message && <span className="text-xs max-w-[160px] truncate">{message}</span>}
        </Badge>
      )
    case "not_applicable":
      return (
        <Badge
          variant="outline"
          className="gap-1 text-muted-foreground border-muted bg-muted/30"
          title={message}
        >
          <Minus className="h-3 w-3" />
        </Badge>
      )
  }
}

export function TaxInvoiceValidationSummary({
  validation,
}: {
  validation: ValidationResult
}) {
  if (validation.isValidTaxInvoice) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50/50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span className="font-medium">ใบกำกับภาษีถูกต้องครบถ้วน</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <div>
        <span className="font-medium">
          ขาด {validation.missingCount} รายการตามมาตรา 86/4
        </span>
        {validation.warnings.length > 0 && (
          <ul className="mt-1 list-inside list-disc text-xs opacity-80">
            {validation.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * Map form field codes to their corresponding Section 86/4 validation keys.
 * Used by AnalyzeForm to look up the correct validation badge for each field.
 */
export const FIELD_VALIDATION_MAP: Record<string, string> = {
  merchant: "seller_name",
  merchant_tax_id: "seller_tax_id",
  merchant_branch: "seller_branch",
  document_number: "invoice_number",
  issuedAt: "issue_date",
}
