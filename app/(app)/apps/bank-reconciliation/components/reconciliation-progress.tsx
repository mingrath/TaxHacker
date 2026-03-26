"use client"

import { Progress } from "@/components/ui/progress"

export function ReconciliationProgress({
  resolved,
  total,
}: {
  resolved: number
  total: number
}) {
  const percentage = total > 0 ? (resolved / total) * 100 : 0

  return (
    <div className="flex items-center gap-4">
      <Progress className="flex-1 h-2" value={percentage} />
      <span className="text-sm font-medium whitespace-nowrap">
        {resolved}/{total} รายการ
      </span>
    </div>
  )
}
