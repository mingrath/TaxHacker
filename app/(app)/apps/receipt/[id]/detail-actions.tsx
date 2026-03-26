"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, Loader2 } from "lucide-react"
import { createElement, startTransition, useActionState, useCallback, useEffect, useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { ReceiptPDF } from "../components/receipt-pdf"
import { updateReceiptStatusAction } from "../actions"
import { canTransition } from "@/services/document-workflow"
import type { ReceiptData } from "../actions"
import { toast } from "sonner"

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function ReceiptDetailActions({
  documentId,
  currentStatus,
  documentNumber,
  receiptData,
}: {
  documentId: string
  currentStatus: string
  documentNumber: string
  receiptData: ReceiptData
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [voidDialogOpen, setVoidDialogOpen] = useState(false)

  const [state, formAction, isPending] = useActionState(
    updateReceiptStatusAction,
    null
  )

  useEffect(() => {
    if (state?.success) {
      toast.success("อัปเดตสถานะสำเร็จ")
      setVoidDialogOpen(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  const handleDownloadPDF = useCallback(async () => {
    setIsGenerating(true)
    try {
      const element = createElement(ReceiptPDF, { data: receiptData })
      const blob = await pdf(element as any).toBlob()
      downloadBlob(blob, `${documentNumber}.pdf`)
      toast.success("PDF พร้อมดาวน์โหลด")
    } catch (error) {
      console.error("Failed to generate PDF:", error)
      toast.error(
        "สร้าง PDF ไม่สำเร็จ \u2014 กรุณาลองใหม่อีกครั้ง"
      )
    } finally {
      setIsGenerating(false)
    }
  }, [receiptData, documentNumber])

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      const fd = new FormData()
      fd.set("documentId", documentId)
      fd.set("newStatus", newStatus)
      startTransition(() => {
        formAction(fd)
      })
    },
    [documentId, formAction]
  )

  const handleVoid = useCallback(() => {
    const fd = new FormData()
    fd.set("documentId", documentId)
    fd.set("newStatus", "voided")
    startTransition(() => {
      formAction(fd)
    })
  }, [documentId, formAction])

  // Terminal statuses have no status action buttons
  const isTerminal = ["confirmed", "voided"].includes(currentStatus)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* PDF Download (always visible) */}
      <Button
        variant="outline"
        onClick={handleDownloadPDF}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            กำลังสร้าง PDF...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            ดาวน์โหลด PDF
          </>
        )}
      </Button>

      {/* Status action buttons (only for non-terminal statuses) */}
      {!isTerminal && (
        <>
          {/* Draft actions */}
          {currentStatus === "draft" && (
            <>
              {canTransition("RECEIPT", currentStatus, "confirmed") && (
                <Button
                  onClick={() => handleStatusChange("confirmed")}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  ยืนยันใบเสร็จ
                </Button>
              )}
              {canTransition("RECEIPT", currentStatus, "voided") && (
                <Button
                  variant="destructive"
                  onClick={() => setVoidDialogOpen(true)}
                  disabled={isPending}
                >
                  ยกเลิก
                </Button>
              )}
            </>
          )}
        </>
      )}

      {/* Void Confirmation Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ยืนยันการยกเลิกใบเสร็จรับเงิน
            </DialogTitle>
            <DialogDescription>
              ใบเสร็จ {documentNumber}{" "}
              จะถูกยกเลิก ยอดชำระของใบแจ้งหนี้จะถูกปรับลด
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setVoidDialogOpen(false)}
            >
              ไม่ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              ยกเลิกใบเสร็จ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
