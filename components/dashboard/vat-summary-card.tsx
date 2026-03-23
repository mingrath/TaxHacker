"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { VATSummary } from "@/models/stats"
import { TrendingDown, TrendingUp } from "lucide-react"
import Link from "next/link"

export function VATSummaryCard({
  vatSummary,
  defaultCurrency,
}: {
  vatSummary: VATSummary
  defaultCurrency: string
}) {
  const isCredit = vatSummary.netVAT < 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Output VAT */}
      <Card className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/40 border-green-200/50 hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-green-600">
            {"\u0e20\u0e32\u0e29\u0e35\u0e02\u0e32\u0e22"}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(vatSummary.outputVAT, defaultCurrency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {vatSummary.outputCount} {"\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23"}
          </p>
        </CardContent>
      </Card>

      {/* Input VAT */}
      <Card className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 border-blue-200/50 hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-blue-600">
            {"\u0e20\u0e32\u0e29\u0e35\u0e0b\u0e37\u0e49\u0e2d"}
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(vatSummary.inputVAT, defaultCurrency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {vatSummary.inputCount} {"\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23"}
          </p>
        </CardContent>
      </Card>

      {/* Net VAT */}
      <Card
        className={
          isCredit
            ? "bg-gradient-to-br from-white via-green-50/30 to-emerald-50/40 border-green-200/50 hover:shadow-lg transition-all duration-300"
            : "bg-gradient-to-br from-white via-amber-50/30 to-orange-50/40 border-amber-200/50 hover:shadow-lg transition-all duration-300"
        }
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-bold ${isCredit ? "text-green-600" : "text-amber-600"}`}>
            {isCredit
              ? "\u0e40\u0e04\u0e23\u0e14\u0e34\u0e15\u0e20\u0e32\u0e29\u0e35"
              : "\u0e15\u0e49\u0e2d\u0e07\u0e0a\u0e33\u0e23\u0e30"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isCredit ? "text-green-600" : "text-amber-600"}`}>
            {formatCurrency(Math.abs(vatSummary.netVAT), defaultCurrency)}
          </div>
          <Link
            href="/apps/vat-report"
            className={`text-xs mt-1 inline-block hover:underline ${
              isCredit ? "text-green-600" : "text-amber-600"
            }`}
          >
            {"\u0e14\u0e39\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14"}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
