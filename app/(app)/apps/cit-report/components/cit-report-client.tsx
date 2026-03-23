"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calculator, Loader2 } from "lucide-react"
import { startTransition, useActionState, useCallback, useEffect, useState } from "react"
import { generateCITReportAction, type CITReportData } from "../actions"
import { CITSummary } from "./cit-summary"
import type { BusinessProfile } from "@/models/business-profile"
import { toBuddhistYear } from "@/services/thai-date"

export function CITReportClient({
  defaultYear,
  businessProfile,
}: {
  defaultYear: number
  businessProfile: BusinessProfile
}) {
  const [year, setYear] = useState(String(defaultYear))
  const [periodType, setPeriodType] = useState<"annual" | "half-year">("annual")
  const [reportData, setReportData] = useState<CITReportData | null>(null)

  const [generateState, generateAction, isGenerating] = useActionState(generateCITReportAction, null)

  // Build year options (current year and 2 years back)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i)

  const handleGenerate = useCallback(() => {
    const formData = new FormData()
    formData.set("year", year)
    formData.set("periodType", periodType)
    startTransition(() => {
      generateAction(formData)
    })
  }, [year, periodType, generateAction])

  // When generation completes, update reportData
  useEffect(() => {
    if (generateState?.success && generateState.data) {
      setReportData(generateState.data)
    }
  }, [generateState])

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>{"\u0e1b\u0e35\u0e20\u0e32\u0e29\u0e35"} ({"\u0e1e.\u0e28."})</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {toBuddhistYear(y)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{"\u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17\u0e23\u0e32\u0e22\u0e07\u0e32\u0e19"}</Label>
          <Select value={periodType} onValueChange={(v) => setPeriodType(v as "annual" | "half-year")}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annual">
                {"\u0e20.\u0e07.\u0e14.50 (\u0e23\u0e32\u0e22\u0e1b\u0e35)"}
              </SelectItem>
              <SelectItem value="half-year">
                {"\u0e20.\u0e07.\u0e14.51 (\u0e04\u0e23\u0e36\u0e48\u0e07\u0e1b\u0e35)"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {"\u0e01\u0e33\u0e25\u0e31\u0e07\u0e04\u0e33\u0e19\u0e27\u0e13..."}
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              {"\u0e04\u0e33\u0e19\u0e27\u0e13\u0e20\u0e32\u0e29\u0e35"}
            </>
          )}
        </Button>
      </div>

      {/* Error display */}
      {generateState?.error && (
        <p className="text-sm text-destructive">{generateState.error}</p>
      )}

      {/* Placeholder when no data */}
      {!reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {periodType === "annual"
                ? `\u0e20.\u0e07.\u0e14.50 \u0e1b\u0e35\u0e20\u0e32\u0e29\u0e35 ${toBuddhistYear(parseInt(year))}`
                : `\u0e20.\u0e07.\u0e14.51 \u0e04\u0e23\u0e36\u0e48\u0e07\u0e1b\u0e35 ${toBuddhistYear(parseInt(year))}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {"\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e1b\u0e35\u0e41\u0e25\u0e30\u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17\u0e23\u0e32\u0e22\u0e07\u0e32\u0e19 \u0e41\u0e25\u0e49\u0e27\u0e01\u0e14 \"\u0e04\u0e33\u0e19\u0e27\u0e13\u0e20\u0e32\u0e29\u0e35\" \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e14\u0e39\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13\u0e01\u0e32\u0e23"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* CIT Summary */}
      {reportData && (
        <CITSummary data={reportData} />
      )}
    </div>
  )
}
