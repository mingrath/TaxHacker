"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { NonDeductibleSummary } from "@/models/stats"
import { AlertTriangle } from "lucide-react"

const CATEGORY_LABELS: Record<string, string> = {
  provision: "\u0e2a\u0e33\u0e23\u0e2d\u0e07/\u0e01\u0e2d\u0e07\u0e17\u0e38\u0e19",
  personal: "\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22\u0e2a\u0e48\u0e27\u0e19\u0e15\u0e31\u0e27",
  charitable: "\u0e1a\u0e23\u0e34\u0e08\u0e32\u0e04",
  entertainment: "\u0e04\u0e48\u0e32\u0e23\u0e31\u0e1a\u0e23\u0e2d\u0e07",
  capital: "\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22\u0e25\u0e07\u0e17\u0e38\u0e19",
  penalty: "\u0e04\u0e48\u0e32\u0e1b\u0e23\u0e31\u0e1a/\u0e40\u0e1a\u0e35\u0e49\u0e22\u0e1b\u0e23\u0e31\u0e1a",
  no_recipient: "\u0e44\u0e21\u0e48\u0e23\u0e30\u0e1a\u0e38\u0e1c\u0e39\u0e49\u0e23\u0e31\u0e1a",
  cit_payment: "\u0e20\u0e32\u0e29\u0e35\u0e40\u0e07\u0e34\u0e19\u0e44\u0e14\u0e49\u0e19\u0e34\u0e15\u0e34\u0e1a\u0e38\u0e04\u0e04\u0e25",
}

const STATUS_COLORS = {
  under: { text: "text-green-600", bg: "bg-green-50", border: "border-green-200", progress: "bg-green-500" },
  approaching: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", progress: "bg-amber-500" },
  over: { text: "text-red-600", bg: "bg-red-50", border: "border-red-200", progress: "bg-red-500" },
} as const

const STATUS_LABELS: Record<string, string> = {
  under: "\u0e44\u0e21\u0e48\u0e40\u0e01\u0e34\u0e19\u0e40\u0e1e\u0e14\u0e32\u0e19",
  approaching: "\u0e43\u0e01\u0e25\u0e49\u0e40\u0e1e\u0e14\u0e32\u0e19",
  over: "\u0e40\u0e01\u0e34\u0e19\u0e40\u0e1e\u0e14\u0e32\u0e19",
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category
}

export function NonDeductibleSummaryCard({
  summary,
  defaultCurrency,
}: {
  summary: NonDeductibleSummary
  defaultCurrency: string
}) {
  if (summary.totalFlagged === 0) {
    return null
  }

  const entertainmentStatus = summary.entertainmentCap.status
  const charitableStatus = summary.charitableCap.status

  const entertainmentRatio =
    summary.entertainmentCap.deductibleAmount > 0
      ? Math.min(
          (summary.entertainmentAmount / summary.entertainmentCap.deductibleAmount) * 100,
          100
        )
      : summary.entertainmentAmount > 0
        ? 100
        : 0

  // Use cap for charitable ratio (deductibleAmount is min of actual and cap)
  const charitableRatio =
    summary.charitableCap.cap > 0
      ? Math.min(
          (summary.charitableAmount / summary.charitableCap.cap) * 100,
          100
        )
      : summary.charitableAmount > 0
        ? 100
        : 0

  return (
    <Card className="bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 border-orange-200/40">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-bold text-orange-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {"\u0e2a\u0e23\u0e38\u0e1b\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22\u0e15\u0e49\u0e2d\u0e07\u0e2b\u0e49\u0e32\u0e21 (Section 65 \u0e15\u0e23\u0e35)"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entertainment Cap Row */}
        {summary.entertainmentAmount > 0 && (
          <CapTrackingRow
            label={"\u0e04\u0e48\u0e32\u0e23\u0e31\u0e1a\u0e23\u0e2d\u0e07"}
            amount={summary.entertainmentAmount}
            capAmount={summary.entertainmentCap.deductibleAmount}
            nonDeductibleAmount={summary.entertainmentCap.nonDeductibleAmount}
            status={entertainmentStatus}
            ratio={entertainmentRatio}
            defaultCurrency={defaultCurrency}
          />
        )}

        {/* Charitable Cap Row */}
        {summary.charitableAmount > 0 && (
          <CapTrackingRow
            label={"\u0e1a\u0e23\u0e34\u0e08\u0e32\u0e04"}
            amount={summary.charitableAmount}
            capAmount={summary.charitableCap.cap}
            nonDeductibleAmount={summary.charitableCap.nonDeductibleAmount}
            status={charitableStatus}
            ratio={charitableRatio}
            defaultCurrency={defaultCurrency}
          />
        )}

        {/* Category Breakdown Table */}
        {summary.byCategory.length > 0 && (
          <div className="mt-3">
            <div className="rounded-md border border-orange-200/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-orange-50/50 border-b border-orange-200/40">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                      {"\u0e2b\u0e21\u0e27\u0e14"}
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                      {"\u0e08\u0e33\u0e19\u0e27\u0e19"}
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                      {"\u0e22\u0e2d\u0e14\u0e23\u0e27\u0e21"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byCategory.map((cat) => (
                    <tr
                      key={cat.category}
                      className="border-b border-orange-100/40 last:border-0"
                    >
                      <td className="px-3 py-2">
                        {getCategoryLabel(cat.category)}
                      </td>
                      <td className="text-right px-3 py-2 text-muted-foreground">
                        {cat.count}
                      </td>
                      <td className="text-right px-3 py-2 font-medium">
                        {formatCurrency(cat.amount, defaultCurrency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CapTrackingRow({
  label,
  amount,
  capAmount,
  nonDeductibleAmount,
  status,
  ratio,
  defaultCurrency,
}: {
  label: string
  amount: number
  capAmount: number
  nonDeductibleAmount: number
  status: "under" | "approaching" | "over"
  ratio: number
  defaultCurrency: string
}) {
  const colors = STATUS_COLORS[status]

  return (
    <div className={cn("rounded-lg p-3 border", colors.bg, colors.border)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge
          variant="outline"
          className={cn("text-xs", colors.text, colors.border)}
        >
          {STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-muted-foreground">
          {"\u0e22\u0e2d\u0e14\u0e2a\u0e30\u0e2a\u0e21: "}
          <span className={cn("font-medium", colors.text)}>
            {formatCurrency(amount, defaultCurrency)}
          </span>
        </span>
        <span className="text-muted-foreground">
          {"\u0e40\u0e1e\u0e14\u0e32\u0e19: "}
          {formatCurrency(capAmount, defaultCurrency)}
        </span>
      </div>

      {/* Progress indicator */}
      <div className="relative h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", colors.progress)}
          style={{ width: `${Math.min(ratio, 100)}%` }}
        />
      </div>

      {/* Over-cap message */}
      {status === "over" && nonDeductibleAmount > 0 && (
        <p className="text-xs text-red-600 mt-1.5">
          {"\u0e2a\u0e48\u0e27\u0e19\u0e40\u0e01\u0e34\u0e19\u0e17\u0e35\u0e48\u0e2b\u0e31\u0e01\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49: "}
          {formatCurrency(nonDeductibleAmount, defaultCurrency)}
        </p>
      )}
    </div>
  )
}
