"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { Info } from "lucide-react"
import Link from "next/link"

const THRESHOLD_SATANG = 180000000 // 1,800,000 THB in satang

export function VATThresholdAlert({ revenueYTD }: { revenueYTD: number }) {
  const percentage = Math.min(Math.round((revenueYTD / THRESHOLD_SATANG) * 100), 100)

  return (
    <Alert className="border-blue-200/50 bg-blue-50/50">
      <Info className="h-4 w-4 text-blue-500" />
      <AlertTitle className="text-blue-700">
        {"\u0e23\u0e32\u0e22\u0e44\u0e14\u0e49\u0e2a\u0e30\u0e2a\u0e21\u0e1b\u0e35\u0e19\u0e35\u0e49"} {formatCurrency(revenueYTD, "THB")}{" "}
        {"\u2014 \u0e43\u0e01\u0e25\u0e49\u0e16\u0e36\u0e07\u0e40\u0e01\u0e13\u0e11\u0e4c\u0e08\u0e14\u0e17\u0e30\u0e40\u0e1a\u0e35\u0e22\u0e19 VAT (\u0e3f1,800,000)"}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          <Progress value={percentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-blue-600">
            <span>{percentage}%</span>
            <Link href="/settings" className="hover:underline">
              {"\u0e40\u0e1b\u0e34\u0e14\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19 VAT \u0e43\u0e19\u0e01\u0e32\u0e23\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32"}
            </Link>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
