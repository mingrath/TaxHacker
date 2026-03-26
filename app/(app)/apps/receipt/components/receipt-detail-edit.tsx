"use client"

import { startTransition, useActionState, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateReceiptAction } from "../actions"
import { toast } from "sonner"

const PAYMENT_METHODS = [
  { value: "transfer", label: "โอนเงิน" },
  { value: "cash", label: "เงินสด" },
  { value: "cheque", label: "เช็ค" },
  { value: "credit_card", label: "บัตรเครดิต" },
] as const

function getPaymentMethodLabel(method: string): string {
  const found = PAYMENT_METHODS.find((m) => m.value === method)
  return found ? found.label : method
}

function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toISOString().split("T")[0]
}

export function ReceiptDetailEdit({
  documentId,
  status,
  paymentMethod,
  paymentDate,
  paidAmount,
}: {
  documentId: string
  status: string
  paymentMethod: string | null
  paymentDate: string | null
  paidAmount: number | null // satang
}) {
  const isDraft = status === "draft"

  const [state, formAction] = useActionState(updateReceiptAction, null)

  useEffect(() => {
    if (state?.success) {
      toast.success("อัปเดตข้อมูลการชำระเงินสำเร็จ")
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  const submitUpdate = useCallback(
    (updates: Record<string, string>) => {
      const fd = new FormData()
      fd.set("documentId", documentId)
      fd.set("paymentMethod", updates.paymentMethod ?? paymentMethod ?? "transfer")
      fd.set("paymentDate", updates.paymentDate ?? formatDateForInput(paymentDate))
      fd.set(
        "paidAmount",
        updates.paidAmount ?? ((paidAmount ?? 0) / 100).toString()
      )
      startTransition(() => {
        formAction(fd)
      })
    },
    [documentId, paymentMethod, paymentDate, paidAmount, formAction]
  )

  // Display amount in baht (from satang)
  const displayAmount = ((paidAmount ?? 0) / 100).toFixed(2)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ข้อมูลการชำระเงิน</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Payment Method */}
          <div className="space-y-2">
            <Label>วิธีการชำระเงิน</Label>
            {isDraft ? (
              <Select
                defaultValue={paymentMethod ?? "transfer"}
                onValueChange={(value) =>
                  submitUpdate({ paymentMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm py-2">
                {getPaymentMethodLabel(paymentMethod ?? "transfer")}
              </p>
            )}
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label>วันที่ชำระเงิน</Label>
            {isDraft ? (
              <Input
                type="date"
                defaultValue={formatDateForInput(paymentDate)}
                onChange={(e) =>
                  submitUpdate({ paymentDate: e.target.value })
                }
              />
            ) : (
              <p className="text-sm py-2">
                {paymentDate
                  ? new Date(paymentDate).toLocaleDateString("th-TH")
                  : "\u2014"}
              </p>
            )}
          </div>

          {/* Paid Amount */}
          <div className="space-y-2">
            <Label>จำนวนเงินที่ได้รับ (บาท)</Label>
            {isDraft ? (
              <Input
                type="number"
                step="0.01"
                min="0"
                defaultValue={displayAmount}
                onBlur={(e) =>
                  submitUpdate({ paidAmount: e.target.value })
                }
              />
            ) : (
              <p className="text-sm py-2 tabular-nums">
                {new Intl.NumberFormat("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format((paidAmount ?? 0) / 100)}{" "}
                บาท
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
