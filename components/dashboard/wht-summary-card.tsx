"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { WHTSummary } from "@/models/stats"
import { Receipt, Building2, Wallet } from "lucide-react"
import Link from "next/link"

export function WHTSummaryCard({
  whtSummary,
  defaultCurrency,
}: {
  whtSummary: WHTSummary
  defaultCurrency: string
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* PND3 WHT */}
      <Card className="bg-gradient-to-br from-white via-purple-50/30 to-violet-50/40 border-purple-200/50 hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-purple-600">
            {"\u0e2b\u0e31\u0e01 \u0e20.\u0e07.\u0e14.3"}
          </CardTitle>
          <Receipt className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(whtSummary.pnd3Withheld, defaultCurrency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {whtSummary.pnd3Count} {"\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23"}
          </p>
        </CardContent>
      </Card>

      {/* PND53 WHT */}
      <Card className="bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/40 border-indigo-200/50 hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-indigo-600">
            {"\u0e2b\u0e31\u0e01 \u0e20.\u0e07.\u0e14.53"}
          </CardTitle>
          <Building2 className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">
            {formatCurrency(whtSummary.pnd53Withheld, defaultCurrency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {whtSummary.pnd53Count} {"\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23"}
          </p>
        </CardContent>
      </Card>

      {/* Total WHT */}
      <Card className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/40 border-orange-200/50 hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-orange-600">
            {"\u0e23\u0e27\u0e21\u0e20\u0e32\u0e29\u0e35\u0e2b\u0e31\u0e01 \u0e13 \u0e17\u0e35\u0e48\u0e08\u0e48\u0e32\u0e22"}
          </CardTitle>
          <Wallet className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(whtSummary.totalWithheld, defaultCurrency)}
          </div>
          <Link
            href="/apps/wht-report"
            className="text-xs text-orange-600 mt-1 inline-block hover:underline"
          >
            {"\u0e14\u0e39\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14"}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
