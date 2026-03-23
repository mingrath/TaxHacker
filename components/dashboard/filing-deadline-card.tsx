"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { DeadlineWithStatus } from "@/models/stats"
import { toggleFilingStatusAction } from "./filing-deadline-actions"
import { CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react"
import { useTransition } from "react"

const THAI_MONTHS = [
  "",
  "\u0e21\u0e01\u0e23\u0e32\u0e04\u0e21",
  "\u0e01\u0e38\u0e21\u0e20\u0e32\u0e1e\u0e31\u0e19\u0e18\u0e4c",
  "\u0e21\u0e35\u0e19\u0e32\u0e04\u0e21",
  "\u0e40\u0e21\u0e29\u0e32\u0e22\u0e19",
  "\u0e1e\u0e24\u0e29\u0e20\u0e32\u0e04\u0e21",
  "\u0e21\u0e34\u0e16\u0e38\u0e19\u0e32\u0e22\u0e19",
  "\u0e01\u0e23\u0e01\u0e0e\u0e32\u0e04\u0e21",
  "\u0e2a\u0e34\u0e07\u0e2b\u0e32\u0e04\u0e21",
  "\u0e01\u0e31\u0e19\u0e22\u0e32\u0e22\u0e19",
  "\u0e15\u0e38\u0e25\u0e32\u0e04\u0e21",
  "\u0e1e\u0e24\u0e28\u0e08\u0e34\u0e01\u0e32\u0e22\u0e19",
  "\u0e18\u0e31\u0e19\u0e27\u0e32\u0e04\u0e21",
]

const STATUS_STYLES = {
  green:
    "bg-gradient-to-br from-white via-green-50/30 to-emerald-50/40 border-green-200/50",
  amber:
    "bg-gradient-to-br from-white via-amber-50/30 to-orange-50/40 border-amber-200/50",
  red: "bg-gradient-to-br from-white via-red-50/30 to-rose-50/40 border-red-200/50",
  filed:
    "bg-gradient-to-br from-white via-slate-50/30 to-gray-50/40 border-slate-200/50",
}

function getColorKey(
  status: "pending" | "filed" | "overdue",
  daysUntil: number
): keyof typeof STATUS_STYLES {
  if (status === "filed") return "filed"
  if (status === "overdue" || daysUntil < 0) return "red"
  if (daysUntil <= 3) return "red"
  if (daysUntil <= 7) return "amber"
  return "green"
}

function formatThaiDate(date: Date): string {
  const day = date.getDate()
  const month = THAI_MONTHS[date.getMonth() + 1]
  const beYear = date.getFullYear() + 543
  return `${day} ${month} ${beYear}`
}

function DeadlineCard({ item }: { item: DeadlineWithStatus }) {
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  const deadline = item.deadline.adjustedDeadline
  const diffMs = deadline.getTime() - now.getTime()
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  const colorKey = getColorKey(item.status, daysUntil)

  const handleToggle = () => {
    startTransition(async () => {
      await toggleFilingStatusAction(
        item.deadline.formType,
        item.deadline.taxMonth,
        item.deadline.taxYear,
        item.status === "filed" ? "filed" : "pending"
      )
    })
  }

  const beYear = item.deadline.taxYear + 543

  return (
    <Card
      className={`${STATUS_STYLES[colorKey]} hover:shadow-lg transition-all duration-300`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-bold">
          {item.deadline.formLabel}
        </CardTitle>
        {item.status === "filed" ? (
          <CheckCircle2 className="h-4 w-4 text-slate-500" />
        ) : item.status === "overdue" || daysUntil <= 3 ? (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        ) : (
          <CalendarClock className="h-4 w-4 text-amber-500" />
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {"\u0e40\u0e14\u0e37\u0e2d\u0e19"} {THAI_MONTHS[item.deadline.taxMonth]}{" "}
          {beYear}
        </p>
        <p className="text-sm font-medium">
          {"\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e22\u0e37\u0e48\u0e19:"}{" "}
          {formatThaiDate(deadline)}
        </p>

        {/* Days remaining */}
        {item.status === "filed" ? (
          <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
            {"\u0e22\u0e37\u0e48\u0e19\u0e41\u0e25\u0e49\u0e27"}
            {item.filedAt
              ? ` (${formatThaiDate(new Date(item.filedAt))})`
              : ""}
          </Badge>
        ) : daysUntil < 0 ? (
          <Badge variant="destructive" className="text-xs">
            {"\u0e40\u0e25\u0e22\u0e01\u0e33\u0e2b\u0e19\u0e14"} {Math.abs(daysUntil)}{" "}
            {"\u0e27\u0e31\u0e19"}
          </Badge>
        ) : daysUntil === 0 ? (
          <Badge variant="destructive" className="text-xs">
            {"\u0e04\u0e23\u0e1a\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49"}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className={`text-xs ${
              daysUntil <= 3
                ? "border-red-300 text-red-600"
                : daysUntil <= 7
                  ? "border-amber-300 text-amber-600"
                  : "border-green-300 text-green-600"
            }`}
          >
            {"\u0e40\u0e2b\u0e25\u0e37\u0e2d\u0e2d\u0e35\u0e01"} {daysUntil}{" "}
            {"\u0e27\u0e31\u0e19"}
          </Badge>
        )}

        {/* Toggle button */}
        <div className="pt-1">
          {item.status === "filed" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-500 hover:text-slate-700"
              onClick={handleToggle}
              disabled={isPending}
            >
              {isPending
                ? "\u0e01\u0e33\u0e25\u0e31\u0e07\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01..."
                : "\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleToggle}
              disabled={isPending}
            >
              {isPending
                ? "\u0e01\u0e33\u0e25\u0e31\u0e07\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01..."
                : "\u0e22\u0e37\u0e48\u0e19\u0e41\u0e25\u0e49\u0e27"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function FilingDeadlineCard({
  deadlines,
}: {
  deadlines: DeadlineWithStatus[]
  defaultCurrency: string
}) {
  if (deadlines.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">
          {"\u0e44\u0e21\u0e48\u0e21\u0e35\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e22\u0e37\u0e48\u0e19\u0e20\u0e32\u0e29\u0e35\u0e17\u0e35\u0e48\u0e43\u0e01\u0e25\u0e49\u0e08\u0e30\u0e16\u0e36\u0e07"}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {deadlines.map((item) => (
        <DeadlineCard
          key={`${item.deadline.formType}-${item.deadline.taxMonth}-${item.deadline.taxYear}`}
          item={item}
        />
      ))}
    </div>
  )
}
