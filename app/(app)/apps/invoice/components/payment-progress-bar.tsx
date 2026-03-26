"use client"

import { formatCurrency } from "@/lib/utils"

export function PaymentProgressBar({
  totalAmount,
  paidAmount,
  isOverdue,
  overdueDays,
}: {
  totalAmount: number // satang
  paidAmount: number // satang
  isOverdue: boolean
  overdueDays: number
}) {
  const percentage = totalAmount > 0
    ? Math.min((paidAmount / totalAmount) * 100, 100)
    : 0
  const remaining = totalAmount - paidAmount
  const isFullyPaid = paidAmount >= totalAmount
  const isUnpaid = paidAmount === 0

  // Left label
  const paidLabel = isFullyPaid
    ? "ชำระครบแล้ว"
    : isUnpaid
      ? "ยังไม่ได้ชำระ"
      : `ชำระแล้ว ${formatCurrency(paidAmount, "THB")}`

  // Right label
  const remainingLabel = isFullyPaid
    ? formatCurrency(0, "THB")
    : `คงเหลือ ${formatCurrency(remaining, "THB")}`

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex justify-between text-xs font-medium">
        <span>{paidLabel}</span>
        <span>{remainingLabel}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-3">
        <div
          className="bg-green-600 h-3 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Overdue text */}
      {isOverdue && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          เกินกำหนดชำระ {overdueDays} วัน
        </p>
      )}
    </div>
  )
}
