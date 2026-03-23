"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { toBuddhistYear } from "@/services/thai-date"
import type { CITReportData } from "../actions"

function formatBaht(satang: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(satang / 100)
}

function formatTierRange(from: number, to: number): string {
  const fromBaht = formatBaht(from)
  if (to === Infinity) {
    return `${fromBaht} +`
  }
  return `${fromBaht} - ${formatBaht(to)}`
}

function formatRate(rateBasisPoints: number): string {
  return `${rateBasisPoints / 100}%`
}

function capStatusBadge(status: "under" | "approaching" | "over") {
  switch (status) {
    case "under":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{"\u0e1b\u0e01\u0e15\u0e34"}</Badge>
    case "approaching":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{"\u0e43\u0e01\u0e25\u0e49\u0e40\u0e1e\u0e14\u0e32\u0e19"}</Badge>
    case "over":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{"\u0e40\u0e01\u0e34\u0e19\u0e40\u0e1e\u0e14\u0e32\u0e19"}</Badge>
  }
}

export function CITSummary({ data }: { data: CITReportData }) {
  const { period, businessProfile, estimate } = data
  const { citResult, entertainmentCap, charitableCap } = estimate

  const periodLabel = period.type === "annual"
    ? `\u0e1b\u0e35\u0e20\u0e32\u0e29\u0e35 ${toBuddhistYear(period.year)}`
    : `\u0e04\u0e23\u0e36\u0e48\u0e07\u0e1b\u0e35 ${toBuddhistYear(period.year)}`

  const formLabel = period.type === "annual"
    ? "\u0e20.\u0e07.\u0e14.50"
    : "\u0e20.\u0e07.\u0e14.51"

  return (
    <div className="space-y-6">
      {/* Business Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">
              {formLabel} -- {periodLabel}
            </CardTitle>
            {estimate.isEligible ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">SME</Badge>
            ) : (
              <Badge variant="destructive">{"\u0e44\u0e21\u0e48\u0e43\u0e0a\u0e48 SME"}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">{"\u0e0a\u0e37\u0e48\u0e2d\u0e01\u0e34\u0e08\u0e01\u0e32\u0e23"}:</span>{" "}
              <span className="font-medium">{businessProfile.companyName || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tax ID:</span>{" "}
              <span className="font-medium">{businessProfile.taxId || "-"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income / Expense Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{"\u0e2a\u0e23\u0e38\u0e1b\u0e23\u0e32\u0e22\u0e44\u0e14\u0e49\u0e41\u0e25\u0e30\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-muted-foreground">{"\u0e23\u0e32\u0e22\u0e44\u0e14\u0e49\u0e23\u0e27\u0e21"}</span>
              <span className="text-sm tabular-nums font-medium">{formatCurrency(estimate.totalIncome, "THB")}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-muted-foreground">{"\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22\u0e23\u0e27\u0e21"}</span>
              <span className="text-sm tabular-nums font-medium">{formatCurrency(estimate.totalExpenses, "THB")}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-muted-foreground">
                {"\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22\u0e15\u0e49\u0e2d\u0e07\u0e2b\u0e49\u0e32\u0e21"} <span className="text-xs">(+{"\u0e1a\u0e27\u0e01\u0e01\u0e25\u0e31\u0e1a"})</span>
              </span>
              <span className="text-sm tabular-nums font-medium text-amber-600">
                {formatCurrency(estimate.nonDeductibleTotal, "THB")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-t font-bold">
              <span className="text-sm">{"\u0e01\u0e33\u0e44\u0e23\u0e2a\u0e38\u0e17\u0e18\u0e34"}</span>
              <span className="text-sm tabular-nums">{formatCurrency(estimate.netProfit, "THB")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiered Rate Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{"\u0e04\u0e33\u0e19\u0e27\u0e13\u0e20\u0e32\u0e29\u0e35\u0e40\u0e07\u0e34\u0e19\u0e44\u0e14\u0e49\u0e19\u0e34\u0e15\u0e34\u0e1a\u0e38\u0e04\u0e04\u0e25"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{"\u0e0a\u0e48\u0e27\u0e07\u0e01\u0e33\u0e44\u0e23"}</TableHead>
                <TableHead className="text-right">{"\u0e2d\u0e31\u0e15\u0e23\u0e32"}</TableHead>
                <TableHead className="text-right">{"\u0e01\u0e33\u0e44\u0e23\u0e17\u0e35\u0e48\u0e04\u0e33\u0e19\u0e27\u0e13"}</TableHead>
                <TableHead className="text-right">{"\u0e20\u0e32\u0e29\u0e35"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citResult.tiers.map((tier, index) => (
                <TableRow key={index}>
                  <TableCell className="tabular-nums text-sm">
                    {formatTierRange(tier.from, tier.to)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {formatRate(tier.rate)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {formatBaht(tier.taxableAmount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {formatBaht(tier.tax)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Total row */}
              <TableRow className="font-bold bg-muted/50">
                <TableCell colSpan={3}>
                  {"\u0e20\u0e32\u0e29\u0e35\u0e40\u0e07\u0e34\u0e19\u0e44\u0e14\u0e49\u0e19\u0e34\u0e15\u0e34\u0e1a\u0e38\u0e04\u0e04\u0e25\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatBaht(citResult.totalCIT)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="flex justify-between items-center mt-4 px-1">
            <span className="text-sm text-muted-foreground">{"\u0e2d\u0e31\u0e15\u0e23\u0e32\u0e20\u0e32\u0e29\u0e35\u0e17\u0e35\u0e48\u0e41\u0e17\u0e49\u0e08\u0e23\u0e34\u0e07"}</span>
            <span className="text-sm font-bold tabular-nums">{formatRate(citResult.effectiveRate)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Entertainment Cap (only if there are entertainment expenses) */}
      {entertainmentCap.actualAmount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">{"\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22\u0e23\u0e31\u0e1a\u0e23\u0e2d\u0e07 (Section 65 tri (4))"}</CardTitle>
              {capStatusBadge(entertainmentCap.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{"\u0e04\u0e48\u0e32\u0e43\u0e0a\u0e49\u0e08\u0e48\u0e32\u0e22\u0e08\u0e23\u0e34\u0e07"}</span>
                <span className="tabular-nums">{formatCurrency(entertainmentCap.actualAmount, "THB")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{"\u0e40\u0e1e\u0e14\u0e32\u0e19\u0e2b\u0e31\u0e01\u0e44\u0e14\u0e49"}</span>
                <span className="tabular-nums">{formatCurrency(entertainmentCap.deductibleAmount, "THB")}</span>
              </div>
              {entertainmentCap.nonDeductibleAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{"\u0e2a\u0e48\u0e27\u0e19\u0e40\u0e01\u0e34\u0e19\u0e40\u0e1e\u0e14\u0e32\u0e19 (\u0e2b\u0e31\u0e01\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49)"}</span>
                  <span className="tabular-nums">{formatCurrency(entertainmentCap.nonDeductibleAmount, "THB")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charitable Cap (only if there are charitable expenses) */}
      {charitableCap.actualAmount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">{"\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22\u0e01\u0e32\u0e23\u0e01\u0e38\u0e28\u0e25 (Section 65 tri (3))"}</CardTitle>
              {capStatusBadge(charitableCap.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{"\u0e04\u0e48\u0e32\u0e43\u0e0a\u0e49\u0e08\u0e48\u0e32\u0e22\u0e08\u0e23\u0e34\u0e07"}</span>
                <span className="tabular-nums">{formatCurrency(charitableCap.actualAmount, "THB")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{"\u0e40\u0e1e\u0e14\u0e32\u0e19\u0e2b\u0e31\u0e01\u0e44\u0e14\u0e49"}</span>
                <span className="tabular-nums">{formatCurrency(charitableCap.deductibleAmount, "THB")}</span>
              </div>
              {charitableCap.nonDeductibleAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{"\u0e2a\u0e48\u0e27\u0e19\u0e40\u0e01\u0e34\u0e19\u0e40\u0e1e\u0e14\u0e32\u0e19 (\u0e2b\u0e31\u0e01\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49)"}</span>
                  <span className="tabular-nums">{formatCurrency(charitableCap.nonDeductibleAmount, "THB")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground text-center px-4">
        {"\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e19\u0e35\u0e49\u0e40\u0e1b\u0e47\u0e19\u0e01\u0e32\u0e23\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13\u0e40\u0e17\u0e48\u0e32\u0e19\u0e31\u0e49\u0e19 \u0e43\u0e0a\u0e49\u0e1b\u0e23\u0e30\u0e01\u0e2d\u0e1a\u0e01\u0e32\u0e23\u0e22\u0e37\u0e48\u0e19 \u0e20.\u0e07.\u0e14.50/51 \u0e1a\u0e19 rd.go.th"}
      </p>
    </div>
  )
}
