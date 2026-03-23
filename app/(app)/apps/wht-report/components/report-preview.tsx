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
import { PND3PDF } from "./pnd3-pdf"
import { PND53PDF } from "./pnd53-pdf"
import { FiftyTawiPDF } from "./fifty-tawi-pdf"
import type { WHTReportData, WHTTransactionForReport } from "../actions"
import { toast } from "sonner"
import { formatSatangToDisplay } from "@/services/tax-calculator"

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

function formatAmount(satang: number): string {
  const baht = formatSatangToDisplay(satang)
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baht)
}

export function ReportPreview({
  open,
  onOpenChange,
  reportData,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportData: WHTReportData
}) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  const {
    pnd3Summary,
    pnd53Summary,
    pnd3Transactions,
    pnd53Transactions,
    transactions,
    month,
    year,
    businessProfile,
  } = reportData

  const periodLabel = `${String(month).padStart(2, "0")}-${year}`
  const period = { month, year }

  const totalIncomePaid = pnd3Summary.totalIncomePaid + pnd53Summary.totalIncomePaid
  const totalTaxWithheld = pnd3Summary.totalTaxWithheld + pnd53Summary.totalTaxWithheld
  const totalTransactions = pnd3Summary.transactionCount + pnd53Summary.transactionCount

  // ─── PDF generators ─────────────────────────────────────────

  const generatePND3 = useCallback(async () => {
    const element = createElement(PND3PDF, {
      transactions: pnd3Transactions,
      summary: pnd3Summary,
      businessProfile,
      period,
    })
    return pdf(element as any).toBlob()
  }, [pnd3Transactions, pnd3Summary, businessProfile, period])

  const generatePND53 = useCallback(async () => {
    const element = createElement(PND53PDF, {
      transactions: pnd53Transactions,
      summary: pnd53Summary,
      businessProfile,
      period,
    })
    return pdf(element as any).toBlob()
  }, [pnd53Transactions, pnd53Summary, businessProfile, period])

  const generateSingle50Tawi = useCallback(
    async (txn: WHTTransactionForReport, certNumber: string) => {
      const element = createElement(FiftyTawiPDF, {
        transaction: txn,
        businessProfile,
        certificateNumber: certNumber,
        issuedDate: new Date(),
      })
      return pdf(element as any).toBlob()
    },
    [businessProfile]
  )

  // ─── Download handlers ──────────────────────────────────────

  const handleDownloadPND3 = useCallback(async () => {
    setIsGenerating("pnd3")
    try {
      const blob = await generatePND3()
      downloadBlob(blob, `PND3-${periodLabel}.pdf`)
      toast.success("ดาวน์โหลด ภ.ง.ด.3 สำเร็จ")
    } catch (error) {
      console.error("Failed to generate PND3 PDF:", error)
      toast.error("สร้างรายงานไม่สำเร็จ -- กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsGenerating(null)
    }
  }, [generatePND3, periodLabel])

  const handleDownloadPND53 = useCallback(async () => {
    setIsGenerating("pnd53")
    try {
      const blob = await generatePND53()
      downloadBlob(blob, `PND53-${periodLabel}.pdf`)
      toast.success("ดาวน์โหลด ภ.ง.ด.53 สำเร็จ")
    } catch (error) {
      console.error("Failed to generate PND53 PDF:", error)
      toast.error("สร้างรายงานไม่สำเร็จ -- กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsGenerating(null)
    }
  }, [generatePND53, periodLabel])

  const handleDownloadSingle50Tawi = useCallback(
    async (txn: WHTTransactionForReport) => {
      setIsGenerating(`tawi-${txn.id}`)
      try {
        const buddhistYear = new Date().getFullYear() + 543
        const certNumber = `${txn.sequenceNumber}/${buddhistYear}`
        const blob = await generateSingle50Tawi(txn, certNumber)
        const safeName = (txn.contactName || txn.merchant || txn.id).replace(/[^a-zA-Z0-9ก-๙]/g, "_")
        downloadBlob(blob, `50Tawi-${safeName}-${periodLabel}.pdf`)
        toast.success("ดาวน์โหลด 50 ทวิ สำเร็จ")
      } catch (error) {
        console.error("Failed to generate 50 Tawi PDF:", error)
        toast.error("สร้างหนังสือรับรองไม่สำเร็จ -- กรุณาลองใหม่อีกครั้ง")
      } finally {
        setIsGenerating(null)
      }
    },
    [generateSingle50Tawi, periodLabel]
  )

  const handleDownloadBatch50Tawi = useCallback(async () => {
    setIsGenerating("batch-tawi")
    try {
      const zip = new JSZip()
      const buddhistYear = new Date().getFullYear() + 543

      for (let i = 0; i < transactions.length; i++) {
        const txn = transactions[i]
        const certNumber = `${i + 1}/${buddhistYear}`
        const blob = await generateSingle50Tawi(txn, certNumber)
        const safeName = (txn.contactName || txn.merchant || txn.id).replace(/[^a-zA-Z0-9ก-๙]/g, "_")
        zip.file(`50Tawi-${String(i + 1).padStart(3, "0")}-${safeName}.pdf`, blob)
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      downloadBlob(zipBlob, `50Tawi-Batch-${periodLabel}.zip`)
      toast.success(`ดาวน์โหลด 50 ทวิ ${transactions.length} ฉบับ สำเร็จ`)
    } catch (error) {
      console.error("Failed to generate batch 50 Tawi ZIP:", error)
      toast.error("สร้างรายงานไม่สำเร็จ -- กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsGenerating(null)
    }
  }, [transactions, generateSingle50Tawi, periodLabel])

  // ─── Summary rows ───────────────────────────────────────────

  const summaryRows = [
    {
      label: "รวมเงินได้ที่จ่าย",
      value: formatCurrency(totalIncomePaid, "THB"),
      color: "",
    },
    {
      label: "รวมภาษีที่หักและนำส่ง",
      value: formatCurrency(totalTaxWithheld, "THB"),
      color: "text-amber-600 font-bold",
    },
    {
      label: "จำนวนรายการ",
      value: `${totalTransactions} รายการ`,
      color: "",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สรุปรายงานภาษีหัก ณ ที่จ่าย</DialogTitle>
          <DialogDescription>
            สำหรับเดือนภาษี {String(month).padStart(2, "0")}/{year}
          </DialogDescription>
        </DialogHeader>

        {/* Overall Summary */}
        <div className="space-y-1">
          {summaryRows.map((row) => (
            <div
              key={row.label}
              className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-muted/50"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className={`text-sm tabular-nums ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* PND3/PND53 Split Summary */}
        {(pnd3Summary.transactionCount > 0 || pnd53Summary.transactionCount > 0) && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            {pnd3Summary.transactionCount > 0 && (
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-sm font-medium">ภ.ง.ด.3 (บุคคลธรรมดา)</p>
                <p className="text-xs text-muted-foreground">
                  {pnd3Summary.transactionCount} รายการ
                </p>
                <p className="text-xs text-muted-foreground">
                  เงินได้: {formatAmount(pnd3Summary.totalIncomePaid)} บาท
                </p>
                <p className="text-xs text-muted-foreground">
                  ภาษี: {formatAmount(pnd3Summary.totalTaxWithheld)} บาท
                </p>
              </div>
            )}
            {pnd53Summary.transactionCount > 0 && (
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-sm font-medium">ภ.ง.ด.53 (นิติบุคคล)</p>
                <p className="text-xs text-muted-foreground">
                  {pnd53Summary.transactionCount} รายการ
                </p>
                <p className="text-xs text-muted-foreground">
                  เงินได้: {formatAmount(pnd53Summary.totalIncomePaid)} บาท
                </p>
                <p className="text-xs text-muted-foreground">
                  ภาษี: {formatAmount(pnd53Summary.totalTaxWithheld)} บาท
                </p>
              </div>
            )}
          </div>
        )}

        {/* Download Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-4">
          {pnd3Summary.transactionCount > 0 && (
            <Button
              variant="outline"
              onClick={handleDownloadPND3}
              disabled={isGenerating !== null}
              className="justify-start"
            >
              {isGenerating === "pnd3" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              ดาวน์โหลด ภ.ง.ด.3
            </Button>
          )}

          {pnd53Summary.transactionCount > 0 && (
            <Button
              variant="outline"
              onClick={handleDownloadPND53}
              disabled={isGenerating !== null}
              className="justify-start"
            >
              {isGenerating === "pnd53" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              ดาวน์โหลด ภ.ง.ด.53
            </Button>
          )}

          {totalTransactions > 0 && (
            <Button
              variant="outline"
              onClick={handleDownloadBatch50Tawi}
              disabled={isGenerating !== null}
              className="justify-start col-span-2 sm:col-span-1"
            >
              {isGenerating === "batch-tawi" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  ดาวน์โหลด 50 ทวิ ทั้งหมด
                </>
              )}
            </Button>
          )}
        </div>

        {/* Individual Transaction List with 50 Tawi Download */}
        {transactions.length > 0 && (
          <div className="pt-4 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              รายการหัก ณ ที่จ่าย ({transactions.length} รายการ)
            </h4>
            <div className="divide-y rounded-lg border max-h-[300px] overflow-y-auto">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {txn.contactName || txn.merchant || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {txn.whtType === "pnd3" ? "ภ.ง.ด.3" : "ภ.ง.ด.53"} |{" "}
                      {formatAmount(txn.subtotal)} บาท |{" "}
                      ภาษี {formatAmount(txn.whtAmount)} บาท
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadSingle50Tawi(txn)}
                    disabled={isGenerating !== null}
                    className="shrink-0 ml-2"
                  >
                    {isGenerating === `tawi-${txn.id}` ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-3 w-3 mr-1" />
                        <span className="text-xs">50 ทวิ</span>
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
