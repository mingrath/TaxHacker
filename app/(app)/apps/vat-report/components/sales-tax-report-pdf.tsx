import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { registerThaiFonts } from "@/exports/pdf/fonts"
import { thaiPdfStyles } from "@/exports/pdf/thai-pdf-styles"
import { formatThaiDate, formatThaiMonth } from "@/services/thai-date"
import { formatSatangToDisplay } from "@/services/tax-calculator"
import type { TransactionForReport } from "../actions"
import type { BusinessProfile } from "@/models/business-profile"

// Ensure fonts are registered
registerThaiFonts()

const styles = StyleSheet.create({
  headerInfo: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 11,
    width: 140,
    fontWeight: "bold",
  },
  infoValue: {
    fontSize: 11,
    flex: 1,
  },
  table: {
    marginTop: 6,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  // Column widths for 9 columns
  colSeq: { width: 30, padding: 3, fontSize: 10, textAlign: "center" },
  colDate: { width: 60, padding: 3, fontSize: 10 },
  colInvoice: { width: 55, padding: 3, fontSize: 10 },
  colBook: { width: 30, padding: 3, fontSize: 10, textAlign: "center" },
  colName: { width: 85, padding: 3, fontSize: 10 },
  colTaxId: { width: 75, padding: 3, fontSize: 10 },
  colBranch: { width: 55, padding: 3, fontSize: 10 },
  colAmount: { width: 62, padding: 3, fontSize: 10, textAlign: "right" },
  colVat: { width: 62, padding: 3, fontSize: 10, textAlign: "right" },
  // Header variants (bold)
  colSeqH: { width: 30, padding: 3, fontSize: 9, textAlign: "center", fontWeight: "bold" },
  colDateH: { width: 60, padding: 3, fontSize: 9, fontWeight: "bold" },
  colInvoiceH: { width: 55, padding: 3, fontSize: 9, fontWeight: "bold" },
  colBookH: { width: 30, padding: 3, fontSize: 9, textAlign: "center", fontWeight: "bold" },
  colNameH: { width: 85, padding: 3, fontSize: 9, fontWeight: "bold" },
  colTaxIdH: { width: 75, padding: 3, fontSize: 9, fontWeight: "bold" },
  colBranchH: { width: 55, padding: 3, fontSize: 9, fontWeight: "bold" },
  colAmountH: { width: 62, padding: 3, fontSize: 9, textAlign: "right", fontWeight: "bold" },
  colVatH: { width: 62, padding: 3, fontSize: 9, textAlign: "right", fontWeight: "bold" },
})

function formatAmount(satang: number): string {
  const baht = formatSatangToDisplay(satang)
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baht)
}

function formatBranch(branch: string | null): string {
  if (!branch) return "-"
  if (branch === "00000") return "สำนักงานใหญ่"
  return `สาขาที่ ${branch}`
}

export function SalesTaxReportPDF({
  transactions,
  businessProfile,
  period,
}: {
  transactions: TransactionForReport[]
  businessProfile: BusinessProfile
  period: { month: number; year: number }
}) {
  const periodDate = new Date(period.year, period.month - 1, 1)
  const thaiPeriod = formatThaiMonth(periodDate)
  const branchDisplay =
    businessProfile.branch === "00000"
      ? "สำนักงานใหญ่"
      : `สาขาที่ ${businessProfile.branch}`

  const totalSubtotal = transactions.reduce((sum, t) => sum + t.subtotal, 0)
  const totalVat = transactions.reduce((sum, t) => sum + t.vatAmount, 0)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={thaiPdfStyles.page}>
        {/* Title */}
        <Text style={thaiPdfStyles.title}>รายงานภาษีขาย</Text>
        <Text style={{ fontSize: 12, textAlign: "center", marginBottom: 8 }}>
          สำหรับเดือนภาษี {thaiPeriod}
        </Text>

        {/* Company Info */}
        <View style={styles.headerInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ชื่อผู้ประกอบการ:</Text>
            <Text style={styles.infoValue}>{businessProfile.companyName || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>เลขประจำตัวผู้เสียภาษี:</Text>
            <Text style={styles.infoValue}>{businessProfile.taxId || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>สถานประกอบการ:</Text>
            <Text style={styles.infoValue}>{branchDisplay}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row -- Note: Column 5 is "ชื่อผู้ซื้อ" (buyer) for sales report */}
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colSeqH}>ลำดับที่</Text>
            <Text style={styles.colDateH}>วัน เดือน ปี</Text>
            <Text style={styles.colInvoiceH}>เลขที่</Text>
            <Text style={styles.colBookH}>เล่มที่</Text>
            <Text style={styles.colNameH}>ชื่อผู้ซื้อ</Text>
            <Text style={styles.colTaxIdH}>เลขประจำตัวผู้เสียภาษี</Text>
            <Text style={styles.colBranchH}>สถานประกอบการ</Text>
            <Text style={styles.colAmountH}>มูลค่าสินค้าหรือบริการ</Text>
            <Text style={styles.colVatH}>จำนวนเงินภาษี</Text>
          </View>

          {/* Data Rows */}
          {transactions.map((t) => (
            <View key={t.sequenceNumber} style={styles.tableRow}>
              <Text style={styles.colSeq}>{t.sequenceNumber}</Text>
              <Text style={styles.colDate}>
                {t.issuedAt ? formatThaiDate(new Date(t.issuedAt)) : "-"}
              </Text>
              <Text style={styles.colInvoice}>{t.documentNumber || "-"}</Text>
              <Text style={styles.colBook}>-</Text>
              <Text style={styles.colName}>{t.merchant || "-"}</Text>
              <Text style={styles.colTaxId}>{t.merchantTaxId || "-"}</Text>
              <Text style={styles.colBranch}>{formatBranch(t.merchantBranch)}</Text>
              <Text style={styles.colAmount}>{formatAmount(t.subtotal)}</Text>
              <Text style={styles.colVat}>{formatAmount(t.vatAmount)}</Text>
            </View>
          ))}

          {/* Totals Row */}
          <View style={styles.totalRow}>
            <Text style={styles.colSeq}></Text>
            <Text style={styles.colDate}></Text>
            <Text style={styles.colInvoice}></Text>
            <Text style={styles.colBook}></Text>
            <Text style={styles.colName}></Text>
            <Text style={styles.colTaxId}></Text>
            <Text style={{ ...styles.colBranch, fontWeight: "bold" }}>รวม</Text>
            <Text style={{ ...styles.colAmount, fontWeight: "bold" }}>
              {formatAmount(totalSubtotal)}
            </Text>
            <Text style={{ ...styles.colVat, fontWeight: "bold" }}>
              {formatAmount(totalVat)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={thaiPdfStyles.footer}>
          <Text>สร้างโดย BanChee -- เอกสารนี้เป็นเอกสารอ้างอิงเท่านั้น ไม่ใช่เอกสารราชการ</Text>
        </View>
      </Page>
    </Document>
  )
}
