import { getCurrentUser } from "@/lib/auth"
import { listDocuments } from "@/models/documents"
import { formatCurrency } from "@/lib/utils"
import { formatThaiDate } from "@/services/thai-date"
import { StatusBadge } from "../quotation/components/status-badge"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ReceiptPage() {
  const user = await getCurrentUser()
  const receipts = await listDocuments(user.id, { documentType: "RECEIPT" })

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">
          ใบเสร็จรับเงิน
        </h2>
      </header>

      {receipts.length > 0 ? (
        <div className="space-y-2">
          {receipts.map((receipt) => (
            <Link
              key={receipt.id}
              href={`/apps/receipt/${receipt.id}`}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-primary">
                  {receipt.documentNumber}
                </span>
                <span className="text-sm text-muted-foreground">
                  {receipt.issuedAt
                    ? formatThaiDate(new Date(receipt.issuedAt))
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm tabular-nums">
                  {formatCurrency(receipt.paidAmount ?? receipt.total, "THB")}
                </span>
                <StatusBadge status={receipt.status} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6 text-center space-y-3">
          <p className="text-muted-foreground">
            ยังไม่มีใบเสร็จรับเงิน
          </p>
          <p className="text-sm text-muted-foreground">
            สร้างใบเสร็จรับเงินจากหน้าใบแจ้งหนี้
          </p>
        </div>
      )}
    </div>
  )
}
