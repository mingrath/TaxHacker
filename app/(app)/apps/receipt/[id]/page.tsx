import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { getDocumentById, getDocumentsBySourceId } from "@/models/documents"
import { formatCurrency } from "@/lib/utils"
import { formatThaiDate } from "@/services/thai-date"
import { RECEIPT_STATUSES } from "@/services/document-workflow"
import type { QuotationLineItem } from "@/services/document-workflow"
import type { ReceiptData } from "../actions"
import { StatusBadge } from "../../quotation/components/status-badge"
import { ReceiptDetailEdit } from "../components/receipt-detail-edit"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReceiptDetailActions } from "./detail-actions"

export const dynamic = "force-dynamic"

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  const doc = await getDocumentById(user.id, id)

  if (!doc) {
    redirect("/apps/receipt")
  }

  const sellerData = (doc.sellerData as {
    name?: string
    taxId?: string
    branch?: string
    address?: string
    logo?: string
  }) ?? { name: "", taxId: "", branch: "", address: "" }

  const buyerData = (doc.buyerData as {
    name?: string
    taxId?: string
    branch?: string
    address?: string
  }) ?? { name: "", taxId: "", branch: "", address: "" }

  const items = (doc.items as QuotationLineItem[]) ?? []

  // Load source document (invoice) and its source (quotation, if any)
  const sourceDoc = doc.sourceDocumentId
    ? await getDocumentById(user.id, doc.sourceDocumentId)
    : null

  const grandparentDoc = sourceDoc?.sourceDocumentId
    ? await getDocumentById(user.id, sourceDoc.sourceDocumentId)
    : null

  // Build ReceiptData for PDF download
  const receiptData: ReceiptData = {
    id: doc.id,
    documentNumber: doc.documentNumber,
    status: doc.status,
    issuedAt: doc.issuedAt?.toISOString() ?? "",
    seller: {
      name: sellerData.name ?? "",
      taxId: sellerData.taxId ?? "",
      branch: sellerData.branch ?? "",
      address: sellerData.address ?? "",
      logo: sellerData.logo,
    },
    buyer: {
      name: buyerData.name ?? "",
      taxId: buyerData.taxId ?? "",
      branch: buyerData.branch ?? "",
      address: buyerData.address ?? "",
    },
    items,
    subtotal: doc.subtotal,
    discountAmount: doc.discountAmount,
    includeVat: doc.vatRate > 0,
    vatAmount: doc.vatAmount,
    total: doc.total,
    note: doc.note ?? undefined,
    paymentMethod: doc.paymentMethod ?? "transfer",
    paymentDate: doc.paymentDate?.toISOString() ?? "",
    paidAmount: doc.paidAmount ?? 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{doc.documentNumber}</h2>
          <StatusBadge status={doc.status} />
        </div>

        <ReceiptDetailActions
          documentId={doc.id}
          currentStatus={doc.status}
          documentNumber={doc.documentNumber}
          receiptData={receiptData}
        />
      </div>

      {/* Payment Information Card (editable while draft) */}
      <ReceiptDetailEdit
        documentId={doc.id}
        status={doc.status}
        paymentMethod={doc.paymentMethod}
        paymentDate={doc.paymentDate?.toISOString() ?? null}
        paidAmount={doc.paidAmount}
      />

      {/* Document Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            ข้อมูลเอกสาร
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Seller Info */}
            <div className="space-y-1 text-sm">
              <p className="font-medium text-muted-foreground">
                ผู้รับเงิน
              </p>
              <p className="font-medium">{sellerData.name}</p>
              <p>{sellerData.address}</p>
              <p>Tax ID: {sellerData.taxId}</p>
              <p>
                {sellerData.branch === "00000"
                  ? "สำนักงานใหญ่"
                  : `สาขาที่ ${parseInt(sellerData.branch ?? "0", 10)}`}
              </p>
            </div>

            {/* Buyer Info */}
            <div className="space-y-1 text-sm">
              <p className="font-medium text-muted-foreground">
                ผู้ชำระเงิน
              </p>
              <p className="font-medium">{buyerData.name}</p>
              <p>{buyerData.address}</p>
              <p>Tax ID: {buyerData.taxId}</p>
              <p>
                {buyerData.branch === "00000"
                  ? "สำนักงานใหญ่"
                  : `สาขาที่ ${parseInt(buyerData.branch ?? "0", 10)}`}
              </p>
            </div>
          </div>

          {/* Date */}
          <div className="grid grid-cols-1 gap-4 mt-4 pt-4 border-t text-sm">
            <div>
              <span className="text-muted-foreground">
                วันที่ออก:
              </span>{" "}
              {doc.issuedAt ? formatThaiDate(new Date(doc.issuedAt)) : "\u2014"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            รายการสินค้า / บริการ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="text-right">
                    จำนวน
                  </TableHead>
                  <TableHead>หน่วย</TableHead>
                  <TableHead className="text-right">
                    ราคา/หน่วย
                  </TableHead>
                  <TableHead className="text-right">
                    ส่วนลด
                  </TableHead>
                  <TableHead className="text-right">
                    จำนวนเงิน
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.unitPrice, "THB")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.discount, "THB")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.amount, "THB")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 mt-4 space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                มูลค่าสินค้า/บริการ
              </span>
              <span className="tabular-nums">
                {formatCurrency(doc.subtotal, "THB")}
              </span>
            </div>
            {doc.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  ส่วนลดรวม
                </span>
                <span className="tabular-nums">
                  {formatCurrency(doc.discountAmount, "THB")}
                </span>
              </div>
            )}
            {doc.vatRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  ภาษีมูลค่าเพิ่ม 7%
                </span>
                <span className="tabular-nums">
                  {formatCurrency(doc.vatAmount, "THB")}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t pt-2">
              <span>รวมทั้งสิ้น</span>
              <span className="tabular-nums">
                {formatCurrency(doc.total, "THB")}
              </span>
            </div>
          </div>

          {/* Note */}
          {doc.note && (
            <div className="mt-4 pt-4 border-t text-sm">
              <span className="text-muted-foreground font-medium">
                หมายเหตุ:
              </span>{" "}
              {doc.note}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            เอกสารที่เกี่ยวข้อง
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sourceDoc || grandparentDoc ? (
            <div className="space-y-2">
              {/* Source invoice */}
              {sourceDoc && (
                <Link
                  href={`/apps/invoice/${sourceDoc.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      ใบแจ้งหนี้:
                    </span>
                    <span className="font-medium text-sm text-primary">
                      {sourceDoc.documentNumber}
                    </span>
                  </div>
                  <StatusBadge status={sourceDoc.status} />
                </Link>
              )}

              {/* Grandparent quotation */}
              {grandparentDoc && (
                <Link
                  href={`/apps/quotation/${grandparentDoc.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      ใบเสนอราคา:
                    </span>
                    <span className="font-medium text-sm text-primary">
                      {grandparentDoc.documentNumber}
                    </span>
                  </div>
                  <StatusBadge status={grandparentDoc.status} />
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              ยังไม่มีเอกสารที่เกี่ยวข้อง
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
