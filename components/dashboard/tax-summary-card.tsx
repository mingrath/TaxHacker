"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { VATSummary, WHTSummary, CITEstimate, NonDeductibleSummary, DeadlineWithStatus } from "@/models/stats"
import { Receipt, Scale, Calculator, AlertTriangle, CalendarClock } from "lucide-react"
import Link from "next/link"

type TaxSummaryProps = {
  vatSummary: VATSummary
  whtSummary: WHTSummary
  citEstimate: CITEstimate
  nonDeductibleSummary: NonDeductibleSummary
  upcomingDeadlines: DeadlineWithStatus[]
  defaultCurrency: string
}

const THAI_MONTHS = [
  "",
  "\u0e21.\u0e04.",
  "\u0e01.\u0e1e.",
  "\u0e21\u0e35.\u0e04.",
  "\u0e40\u0e21.\u0e22.",
  "\u0e1e.\u0e04.",
  "\u0e21\u0e34.\u0e22.",
  "\u0e01.\u0e04.",
  "\u0e2a.\u0e04.",
  "\u0e01.\u0e22.",
  "\u0e15.\u0e04.",
  "\u0e1e.\u0e22.",
  "\u0e18.\u0e04.",
]

function formatThaiDateShort(date: Date): string {
  const day = date.getDate()
  const month = THAI_MONTHS[date.getMonth() + 1]
  const beYear = date.getFullYear() + 543
  return `${day} ${month} ${beYear}`
}

export function TaxSummarySection({
  vatSummary,
  whtSummary,
  citEstimate,
  nonDeductibleSummary,
  upcomingDeadlines,
  defaultCurrency,
}: TaxSummaryProps) {
  const isVATCredit = vatSummary.netVAT < 0
  const hasFlaggedExpenses = nonDeductibleSummary.totalFlagged > 0
  const isCapExceeded =
    nonDeductibleSummary.entertainmentCap.status === "over" ||
    nonDeductibleSummary.charitableCap.status === "over"

  // Get pending deadlines (not filed), sorted by date, top 3
  const pendingDeadlines = upcomingDeadlines
    .filter((d) => d.status !== "filed")
    .sort(
      (a, b) =>
        a.deadline.adjustedDeadline.getTime() -
        b.deadline.adjustedDeadline.getTime()
    )
    .slice(0, 3)

  return (
    <div className="space-y-4">
      {/* 4-card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 - VAT */}
        <Card
          className={cn(
            "hover:shadow-lg transition-all duration-300",
            isVATCredit
              ? "bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 border-blue-200/50"
              : "bg-gradient-to-br from-white via-amber-50/30 to-orange-50/40 border-amber-200/50"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={cn(
                "text-sm font-bold",
                isVATCredit ? "text-blue-600" : "text-amber-600"
              )}
            >
              {"\u0e20\u0e32\u0e29\u0e35\u0e21\u0e39\u0e25\u0e04\u0e48\u0e32\u0e40\u0e1e\u0e34\u0e48\u0e21"}
            </CardTitle>
            <Receipt
              className={cn(
                "h-4 w-4",
                isVATCredit ? "text-blue-500" : "text-amber-500"
              )}
            />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                isVATCredit ? "text-blue-600" : "text-amber-600"
              )}
            >
              {formatCurrency(Math.abs(vatSummary.netVAT), defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isVATCredit
                ? "\u0e20\u0e32\u0e29\u0e35\u0e40\u0e01\u0e34\u0e19"
                : "\u0e15\u0e49\u0e2d\u0e07\u0e0a\u0e33\u0e23\u0e30"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {"\u0e20\u0e32\u0e29\u0e35\u0e02\u0e32\u0e22 "}
              {formatCurrency(vatSummary.outputVAT, defaultCurrency)}
              {" - \u0e20\u0e32\u0e29\u0e35\u0e0b\u0e37\u0e49\u0e2d "}
              {formatCurrency(vatSummary.inputVAT, defaultCurrency)}
            </p>
          </CardContent>
        </Card>

        {/* Card 2 - WHT */}
        <Card className="bg-gradient-to-br from-white via-purple-50/30 to-violet-50/40 border-purple-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-purple-600">
              {"\u0e20\u0e32\u0e29\u0e35\u0e2b\u0e31\u0e01 \u0e13 \u0e17\u0e35\u0e48\u0e08\u0e48\u0e32\u0e22"}
            </CardTitle>
            <Scale className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(whtSummary.totalWithheld, defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {"PND3: "}
              {whtSummary.pnd3Count}
              {" \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23 | PND53: "}
              {whtSummary.pnd53Count}
              {" \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3 - CIT */}
        <Card className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/40 border-green-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-green-600">
              {"\u0e20\u0e32\u0e29\u0e35\u0e40\u0e07\u0e34\u0e19\u0e44\u0e14\u0e49\u0e19\u0e34\u0e15\u0e34\u0e1a\u0e38\u0e04\u0e04\u0e25"}
            </CardTitle>
            <Calculator className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  citEstimate.citResult.totalCIT,
                  defaultCurrency
                )}
              </span>
              <Badge
                variant="outline"
                className="text-xs border-green-300 text-green-600"
              >
                {(citEstimate.citResult.effectiveRate / 100).toFixed(1)}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {citEstimate.isEligible
                ? "SME \u0e2d\u0e31\u0e15\u0e23\u0e32\u0e01\u0e49\u0e32\u0e27\u0e2b\u0e19\u0e49\u0e32"
                : "\u0e2d\u0e31\u0e15\u0e23\u0e32\u0e1b\u0e01\u0e15\u0e34 20%"}
            </p>
            <Link
              href="/apps/cit-report"
              className="text-xs text-green-600 mt-1 inline-block hover:underline"
            >
              {"\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e40\u0e15\u0e34\u0e21"}
            </Link>
          </CardContent>
        </Card>

        {/* Card 4 - Flagged Expenses */}
        <Card
          className={cn(
            "hover:shadow-lg transition-all duration-300",
            hasFlaggedExpenses
              ? isCapExceeded
                ? "bg-gradient-to-br from-white via-red-50/30 to-rose-50/40 border-red-200/50"
                : "bg-gradient-to-br from-white via-amber-50/30 to-orange-50/40 border-amber-200/50"
              : "bg-gradient-to-br from-white via-slate-50/30 to-gray-50/40 border-slate-200/50"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={cn(
                "text-sm font-bold",
                hasFlaggedExpenses
                  ? isCapExceeded
                    ? "text-red-600"
                    : "text-amber-600"
                  : "text-slate-600"
              )}
            >
              {"\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22\u0e15\u0e49\u0e2d\u0e07\u0e2b\u0e49\u0e32\u0e21"}
            </CardTitle>
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                hasFlaggedExpenses
                  ? isCapExceeded
                    ? "text-red-500"
                    : "text-amber-500"
                  : "text-slate-400"
              )}
            />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                hasFlaggedExpenses
                  ? isCapExceeded
                    ? "text-red-600"
                    : "text-amber-600"
                  : "text-slate-600"
              )}
            >
              {nonDeductibleSummary.totalFlagged}
              {" \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(
                nonDeductibleSummary.totalAmount,
                defaultCurrency
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compact deadline row */}
      {pendingDeadlines.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-1">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">
            {"\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e22\u0e37\u0e48\u0e19\u0e16\u0e31\u0e14\u0e44\u0e1b:"}
          </span>
          {pendingDeadlines.map((d) => {
            const now = new Date()
            const daysUntil = Math.ceil(
              (d.deadline.adjustedDeadline.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            )
            return (
              <Badge
                key={`${d.deadline.formType}-${d.deadline.taxMonth}-${d.deadline.taxYear}`}
                variant="outline"
                className={cn(
                  "text-xs",
                  d.status === "overdue" || daysUntil < 0
                    ? "border-red-300 text-red-600 bg-red-50"
                    : daysUntil <= 3
                      ? "border-red-300 text-red-600 bg-red-50"
                      : daysUntil <= 7
                        ? "border-amber-300 text-amber-600 bg-amber-50"
                        : "border-green-300 text-green-600 bg-green-50"
                )}
              >
                {d.deadline.formLabel}{" "}
                {formatThaiDateShort(d.deadline.adjustedDeadline)}
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
