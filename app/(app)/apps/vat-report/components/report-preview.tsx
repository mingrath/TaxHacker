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
import { Download, FileText, Loader2, Package } from "lucide-react"
import { useState, useCallback } from "react"
import { pdf } from "@react-pdf/renderer"
import { createElement } from "react"
import JSZip from "jszip"
import { PP30PDF } from "./pp30-pdf"
import { PurchaseTaxReportPDF } from "./purchase-tax-report-pdf"
import { SalesTaxReportPDF } from "./sales-tax-report-pdf"
import type { VATReportData } from "../actions"
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

export function ReportPreview({
  open,
  onOpenChange,
  reportData,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportData: VATReportData
}) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  const { period, businessProfile, outputVAT, inputVAT, netVAT, pp30Fields } = reportData
  const periodLabel = `${String(period.month).padStart(2, "0")}-${period.year}`
  const isPayable = netVAT > 0

  const generatePP30 = useCallback(async () => {
    const element = createElement(PP30PDF, {
      pp30Fields,
      businessProfile,
      period,
    })
    const blob = await pdf(element).toBlob()
    return blob
  }, [pp30Fields, businessProfile, period])

  const generatePurchaseReport = useCallback(async () => {
    const element = createElement(PurchaseTaxReportPDF, {
      transactions: reportData.inputTransactions,
      businessProfile,
      period,
    })
    const blob = await pdf(element).toBlob()
    return blob
  }, [reportData.inputTransactions, businessProfile, period])

  const generateSalesReport = useCallback(async () => {
    const element = createElement(SalesTaxReportPDF, {
      transactions: reportData.outputTransactions,
      businessProfile,
      period,
    })
    const blob = await pdf(element).toBlob()
    return blob
  }, [reportData.outputTransactions, businessProfile, period])

  const handleDownload = useCallback(
    async (type: "pp30" | "purchase" | "sales") => {
      setIsGenerating(type)
      try {
        let blob: Blob
        let filename: string

        switch (type) {
          case "pp30":
            blob = await generatePP30()
            filename = `PP30-${periodLabel}.pdf`
            break
          case "purchase":
            blob = await generatePurchaseReport()
            filename = `Purchase-Tax-Report-${periodLabel}.pdf`
            break
          case "sales":
            blob = await generateSalesReport()
            filename = `Sales-Tax-Report-${periodLabel}.pdf`
            break
        }

        downloadBlob(blob, filename)
        toast.success("รายงานพร้อมดาวน์โหลด")
      } catch (error) {
        console.error("Failed to generate PDF:", error)
        toast.error("สร้างรายงานไม่สำเร็จ -- กรุณาลองใหม่อีกครั้ง")
      } finally {
        setIsGenerating(null)
      }
    },
    [generatePP30, generatePurchaseReport, generateSalesReport, periodLabel]
  )

  const handleDownloadAll = useCallback(async () => {
    setIsGenerating("all")
    try {
      const [pp30Blob, purchaseBlob, salesBlob] = await Promise.all([
        generatePP30(),
        generatePurchaseReport(),
        generateSalesReport(),
      ])

      const zip = new JSZip()
      zip.file(`PP30-${periodLabel}.pdf`, pp30Blob)
      zip.file(`Purchase-Tax-Report-${periodLabel}.pdf`, purchaseBlob)
      zip.file(`Sales-Tax-Report-${periodLabel}.pdf`, salesBlob)

      const zipBlob = await zip.generateAsync({ type: "blob" })
      downloadBlob(zipBlob, `VAT-Reports-${periodLabel}.zip`)
      toast.success("รายงานพร้อมดาวน์โหลด")
    } catch (error) {
      console.error("Failed to generate ZIP:", error)
      toast.error("สร้างรายงานไม่สำเร็จ -- กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsGenerating(null)
    }
  }, [generatePP30, generatePurchaseReport, generateSalesReport, periodLabel])

  const summaryRows = [
    { label: "ยอดขาย", value: pp30Fields.salesAmount, color: "" },
    { label: "ภาษีขาย", value: outputVAT, color: "text-green-600" },
    { label: "ยอดซื้อ", value: pp30Fields.purchaseAmount, color: "" },
    { label: "ภาษีซื้อ", value: inputVAT, color: "text-blue-600" },
    {
      label: isPayable ? "ภาษีสุทธิ (ต้องชำระ)" : "ภาษีสุทธิ (เครดิตภาษี)",
      value: Math.abs(netVAT),
      color: isPayable ? "text-amber-600 font-bold" : "text-green-600 font-bold",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>สรุปรายงาน VAT</DialogTitle>
          <DialogDescription>
            สำหรับเดือนภาษี {String(period.month).padStart(2, "0")}/{period.year}
          </DialogDescription>
        </DialogHeader>

        {/* Summary Table */}
        <div className="space-y-1">
          {summaryRows.map((row) => (
            <div key={row.label} className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-muted/50">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className={`text-sm tabular-nums ${row.color}`}>
                {formatCurrency(row.value, "THB")}
              </span>
            </div>
          ))}
        </div>

        {/* Download Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => handleDownload("purchase")}
            disabled={isGenerating !== null}
            className="justify-start"
          >
            {isGenerating === "purchase" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            รายงานภาษีซื้อ
          </Button>

          <Button
            variant="outline"
            onClick={() => handleDownload("sales")}
            disabled={isGenerating !== null}
            className="justify-start"
          >
            {isGenerating === "sales" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            รายงานภาษีขาย
          </Button>

          <Button
            variant="outline"
            onClick={() => handleDownload("pp30")}
            disabled={isGenerating !== null}
            className="justify-start"
          >
            {isGenerating === "pp30" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            ภ.พ.30
          </Button>

          <Button
            onClick={handleDownloadAll}
            disabled={isGenerating !== null}
            className="justify-start"
          >
            {isGenerating === "all" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                กำลังสร้างรายงาน...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                ดาวน์โหลดทั้งหมด
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
