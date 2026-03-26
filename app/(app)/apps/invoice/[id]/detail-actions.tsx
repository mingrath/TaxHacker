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
import { Download, FileText, Loader2, Truck } from "lucide-react"
import { createElement, startTransition, useActionState, useCallback, useEffect, useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { InvoicePDF } from "../components/invoice-pdf"
import { updateInvoiceStatusAction } from "../actions"
import { createReceiptFromInvoiceAction } from "../../receipt/actions"
import { createDeliveryNoteFromSourceAction } from "../../delivery-note/actions"
import { canTransition } from "@/services/document-workflow"
import type { InvoiceData } from "../actions"
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

export function InvoiceDetailActions({
  documentId,
  currentStatus,
  effectiveStatus,
  documentNumber,
  invoiceData,
}: {
  documentId: string
  currentStatus: string
  effectiveStatus: string
  documentNumber: string
  invoiceData: InvoiceData
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [voidDialogOpen, setVoidDialogOpen] = useState(false)

  const [state, formAction, isPending] = useActionState(
    updateInvoiceStatusAction,
    null
  )

  useEffect(() => {
    if (state?.success) {
      toast.success("\u0e2d\u0e31\u0e1b\u0e40\u0e14\u0e15\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08")
      setVoidDialogOpen(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  const handleDownloadPDF = useCallback(async () => {
    setIsGenerating(true)
    try {
      const element = createElement(InvoicePDF, { data: invoiceData })
      const blob = await pdf(element as any).toBlob()
      downloadBlob(blob, `${documentNumber}.pdf`)
      toast.success("PDF \u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e14\u0e32\u0e27\u0e19\u0e4c\u0e42\u0e2b\u0e25\u0e14")
    } catch (error) {
      console.error("Failed to generate PDF:", error)
      toast.error(
        "\u0e2a\u0e23\u0e49\u0e32\u0e07 PDF \u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 \u2014 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07"
      )
    } finally {
      setIsGenerating(false)
    }
  }, [invoiceData, documentNumber])

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
  const isTerminal = ["paid", "voided"].includes(effectiveStatus)

  // Conversion button visibility
  const showReceiptButton = effectiveStatus !== "voided" && effectiveStatus !== "draft"
  const showDeliveryButton = effectiveStatus === "sent" || effectiveStatus === "overdue"

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
            {"\u0e01\u0e33\u0e25\u0e31\u0e07\u0e2a\u0e23\u0e49\u0e32\u0e07 PDF..."}
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            {"\u0e14\u0e32\u0e27\u0e19\u0e4c\u0e42\u0e2b\u0e25\u0e14 PDF"}
          </>
        )}
      </Button>

      {/* Status action buttons (only for non-terminal statuses) */}
      {!isTerminal && (
        <>
          {/* Draft actions */}
          {currentStatus === "draft" && (
            <>
              {canTransition("INVOICE", currentStatus, "sent") && (
                <Button
                  onClick={() => handleStatusChange("sent")}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {"\u0e2a\u0e48\u0e07\u0e43\u0e1a\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49"}
                </Button>
              )}
              {canTransition("INVOICE", currentStatus, "voided") && (
                <Button
                  variant="destructive"
                  onClick={() => setVoidDialogOpen(true)}
                  disabled={isPending}
                >
                  {"\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01"}
                </Button>
              )}
            </>
          )}

          {/* Sent actions */}
          {currentStatus === "sent" && (
            <>
              {canTransition("INVOICE", currentStatus, "voided") && (
                <Button
                  variant="destructive"
                  onClick={() => setVoidDialogOpen(true)}
                  disabled={isPending}
                >
                  {"\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01"}
                </Button>
              )}
            </>
          )}
        </>
      )}

      {/* Conversion buttons separator */}
      {(showReceiptButton || showDeliveryButton) && (
        <div className="hidden sm:block border-l h-6 mx-1" />
      )}

      {/* Conversion: Create Receipt */}
      {showReceiptButton && (
        <form action={createReceiptFromInvoiceAction as any}>
          <input type="hidden" name="sourceDocumentId" value={documentId} />
          <Button
            type="submit"
            variant="default"
            disabled={isPending}
          >
            <FileText className="h-4 w-4 mr-2" />
            {"\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08"}
          </Button>
        </form>
      )}

      {/* Conversion: Create Delivery Note */}
      {showDeliveryButton && (
        <form action={createDeliveryNoteFromSourceAction as any}>
          <input type="hidden" name="sourceDocumentId" value={documentId} />
          <Button
            type="submit"
            variant="outline"
            disabled={isPending}
          >
            <Truck className="h-4 w-4 mr-2" />
            {"\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e43\u0e1a\u0e2a\u0e48\u0e07\u0e02\u0e2d\u0e07"}
          </Button>
        </form>
      )}

      {/* Void Confirmation Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {"\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19\u0e01\u0e32\u0e23\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01\u0e43\u0e1a\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49"}
            </DialogTitle>
            <DialogDescription>
              {"\u0e43\u0e1a\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49"} {documentNumber}{" "}
              {"\u0e08\u0e30\u0e16\u0e39\u0e01\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01\u0e41\u0e25\u0e30\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e41\u0e01\u0e49\u0e44\u0e02\u0e44\u0e14\u0e49\u0e2d\u0e35\u0e01"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setVoidDialogOpen(false)}
            >
              {"\u0e44\u0e21\u0e48\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {"\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01\u0e43\u0e1a\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
