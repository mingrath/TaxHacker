"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { formatThaiDate } from "@/services/thai-date"
import { Download, Loader2, Plus } from "lucide-react"
import { useState, useCallback, createElement } from "react"
import { pdf } from "@react-pdf/renderer"
import { CreditNotePDF } from "./credit-note-pdf"
import type { CreditNoteData } from "../actions"
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

export function NotePreview({
  open,
  onOpenChange,
  noteData,
  onCreateNew,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteData: CreditNoteData
  onCreateNew: () => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)

  const { docNumber, noteType, buyer, issuedAt, totalDifference, vatOnDifference, items } = noteData
  const issuedDate = new Date(issuedAt)
  const noteTypeLabel = noteType === "credit" ? "\u0e43\u0e1a\u0e25\u0e14\u0e2b\u0e19\u0e35\u0e49" : "\u0e43\u0e1a\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2b\u0e19\u0e35\u0e49"

  const handleDownload = useCallback(async () => {
    setIsGenerating(true)
    try {
      const element = createElement(CreditNotePDF, { noteData })
      const blob = await pdf(element as any).toBlob()
      downloadBlob(blob, `${docNumber}.pdf`)
      toast.success("PDF \u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e14\u0e32\u0e27\u0e19\u0e4c\u0e42\u0e2b\u0e25\u0e14")
    } catch (error) {
      console.error("Failed to generate PDF:", error)
      toast.error("\u0e2a\u0e23\u0e49\u0e32\u0e07 PDF \u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 -- \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07")
    } finally {
      setIsGenerating(false)
    }
  }, [noteData, docNumber])

  const summaryRows = [
    { label: "\u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17", value: noteTypeLabel, isAmount: false },
    { label: "\u0e1c\u0e39\u0e49\u0e0b\u0e37\u0e49\u0e2d", value: buyer.name, isAmount: false },
    {
      label: "\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e2d\u0e2d\u0e01",
      value: formatThaiDate(issuedDate),
      isAmount: false,
    },
    { label: "\u0e08\u0e33\u0e19\u0e27\u0e19\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23", value: `${items.length} \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23`, isAmount: false },
    { label: "\u0e1c\u0e25\u0e15\u0e48\u0e32\u0e07", value: formatCurrency(totalDifference, "THB"), isAmount: true },
    { label: "VAT 7%", value: formatCurrency(vatOnDifference, "THB"), isAmount: true },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{`\u0e2a\u0e23\u0e49\u0e32\u0e07${noteTypeLabel}\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08`}</DialogTitle>
          <DialogDescription>
            {"\u0e40\u0e25\u0e02\u0e17\u0e35\u0e48\u0e40\u0e2d\u0e01\u0e2a\u0e32\u0e23"}: {docNumber}
          </DialogDescription>
        </DialogHeader>

        {/* Summary Table */}
        <div className="space-y-1">
          {summaryRows.map((row) => (
            <div
              key={row.label}
              className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-muted/50"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span
                className={`text-sm ${row.isAmount ? "tabular-nums font-medium" : ""}`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1"
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

          <Button
            variant="outline"
            onClick={onCreateNew}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            {"\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e43\u0e1a\u0e43\u0e2b\u0e21\u0e48"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
