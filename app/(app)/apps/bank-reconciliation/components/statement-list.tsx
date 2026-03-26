"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import { formatThaiDate } from "@/services/thai-date"
import { BANK_PRESETS } from "@/services/bank-constants"
import { StatusBadge } from "@/app/(app)/apps/documents/components/status-badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteStatementAction } from "@/app/(app)/apps/bank-reconciliation/actions"
import { toast } from "sonner"
import type { BankStatement } from "@/prisma/client"

// ─── Reconciliation Status Map ────────────────────────────────

const RECONCILIATION_STATUS_MAP: Record<
  string,
  { label: string; color: string }
> = {
  imported: { label: "นำเข้าแล้ว", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  in_progress: { label: "กำลังดำเนินการ", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
  reconciled: { label: "กระทบยอดเสร็จ", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" },
}

// ─── Loading Skeleton ─────────────────────────────────────────

function StatementListSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-2 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

// ─── Statement List Component ─────────────────────────────────

export function StatementList({
  statements,
  isLoading = false,
}: {
  statements: BankStatement[]
  isLoading?: boolean
}) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<BankStatement | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  function handleRowClick(statementId: string) {
    router.push(`/apps/bank-reconciliation/${statementId}`)
  }

  function handleDelete() {
    if (!deleteTarget) return
    startDeleteTransition(async () => {
      const result = await deleteStatementAction(deleteTarget.id)
      if (result.success) {
        toast.success("ลบรายการเรียบร้อยแล้ว")
      } else {
        toast.error(result.error ?? "ลบรายการไม่สำเร็จ")
      }
      setDeleteTarget(null)
    })
  }

  function getBankLabel(bankName: string): string {
    const preset = BANK_PRESETS[bankName]
    return preset?.labelTh ?? bankName
  }

  // Empty state
  if (!isLoading && statements.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center space-y-4">
        <h3 className="text-lg font-medium">ยังไม่มีรายการธนาคาร</h3>
        <p className="text-sm text-muted-foreground">
          นำเข้ารายการจากไฟล์ CSV หรือ Excel เพื่อเริ่มกระทบยอด
        </p>
        <Button
          onClick={() => router.push("/apps/bank-reconciliation/import")}
        >
          นำเข้ารายการ
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ธนาคาร</TableHead>
              <TableHead>ชื่อไฟล์</TableHead>
              <TableHead>วันที่นำเข้า</TableHead>
              <TableHead>รายการ</TableHead>
              <TableHead>ความคืบหน้า</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <StatementListSkeleton />
            ) : (
              statements.map((statement) => {
                const progressPercent =
                  statement.totalEntries > 0
                    ? (statement.matchedEntries / statement.totalEntries) * 100
                    : 0

                return (
                  <TableRow
                    key={statement.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(statement.id)}
                  >
                    <TableCell className="font-medium">
                      {getBankLabel(statement.bankName)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {statement.filename}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatThaiDate(new Date(statement.createdAt))}
                    </TableCell>
                    <TableCell className="text-sm">
                      {statement.totalEntries} รายการ
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          className="h-2 w-16"
                          value={progressPercent}
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {statement.matchedEntries}/{statement.totalEntries}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={statement.status}
                        statusMap={RECONCILIATION_STATUS_MAP}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(statement)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลบรายการธนาคาร</DialogTitle>
            <DialogDescription>
              รายการทั้งหมดใน {deleteTarget?.filename} จะถูกลบ
              ไม่สามารถกู้คืนได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              ไม่ลบ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบรายการ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
