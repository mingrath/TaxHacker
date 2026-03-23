import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { registerThaiFonts } from "@/exports/pdf/fonts"
import { thaiPdfStyles } from "@/exports/pdf/thai-pdf-styles"
import { formatThaiDate, formatThaiMonth, toBuddhistYear } from "@/services/thai-date"
import { formatSatangToDisplay } from "@/services/tax-calculator"
import type { WHTTransactionForReport, WHTReportSummary } from "../actions"
import type { BusinessProfile } from "@/models/business-profile"

// Ensure fonts are registered
registerThaiFonts()

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
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
  summarySection: {
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#d1d5db",
    padding: 8,
  },
  summaryRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  summaryFieldNumber: {
    fontSize: 11,
    width: 30,
    textAlign: "center",
  },
  summaryFieldLabel: {
    fontSize: 11,
    flex: 3,
  },
  summaryFieldValue: {
    fontSize: 11,
    flex: 1,
    textAlign: "right",
  },
  // Attachment table columns (8 columns per THAI_TAX_REFERENCE.md Section 7)
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
  // Column widths for 8-column attachment table
  colSeq: { width: 28, padding: 3, fontSize: 9, textAlign: "center" },
  colName: { width: 120, padding: 3, fontSize: 9 },
  colDate: { width: 60, padding: 3, fontSize: 9, textAlign: "center" },
  colDetail: { width: 90, padding: 3, fontSize: 9 },
  colRate: { width: 40, padding: 3, fontSize: 9, textAlign: "center" },
  colPaid: { width: 65, padding: 3, fontSize: 9, textAlign: "right" },
  colTax: { width: 65, padding: 3, fontSize: 9, textAlign: "right" },
  colCond: { width: 35, padding: 3, fontSize: 9, textAlign: "center" },
  // Header variants (bold)
  colSeqH: { width: 28, padding: 3, fontSize: 8, textAlign: "center", fontWeight: "bold" },
  colNameH: { width: 120, padding: 3, fontSize: 8, fontWeight: "bold" },
  colDateH: { width: 60, padding: 3, fontSize: 8, textAlign: "center", fontWeight: "bold" },
  colDetailH: { width: 90, padding: 3, fontSize: 8, fontWeight: "bold" },
  colRateH: { width: 40, padding: 3, fontSize: 8, textAlign: "center", fontWeight: "bold" },
  colPaidH: { width: 65, padding: 3, fontSize: 8, textAlign: "right", fontWeight: "bold" },
  colTaxH: { width: 65, padding: 3, fontSize: 8, textAlign: "right", fontWeight: "bold" },
  colCondH: { width: 35, padding: 3, fontSize: 8, textAlign: "center", fontWeight: "bold" },
})

function formatAmount(satang: number): string {
  const baht = formatSatangToDisplay(satang)
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baht)
}

function formatRatePercent(basisPoints: number): string {
  return (basisPoints / 100).toFixed(1)
}

function getPaymentDetail(whtRate: number, description: string | null): string {
  switch (whtRate) {
    case 100: return "ค่าขนส่ง"
    case 200: return "ค่าโฆษณา"
    case 300: return description || "ค่าบริการ/ค่าจ้างทำของ"
    case 500: return "ค่าเช่า"
    case 1000: return "เงินปันผล"
    default: return description || "ค่าบริการ"
  }
}

function SummaryFieldRow({
  number,
  label,
  value,
}: {
  number: string
  label: string
  value: number
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryFieldNumber}>({number})</Text>
      <Text style={styles.summaryFieldLabel}>{label}</Text>
      <Text style={styles.summaryFieldValue}>{formatAmount(value)}</Text>
    </View>
  )
}

export function PND53PDF({
  transactions,
  summary,
  businessProfile,
  period,
}: {
  transactions: WHTTransactionForReport[]
  summary: WHTReportSummary
  businessProfile: BusinessProfile
  period: { month: number; year: number }
}) {
  const periodDate = new Date(period.year, period.month - 1, 1)
  const thaiPeriod = formatThaiMonth(periodDate)
  const branchDisplay =
    businessProfile.branch === "00000"
      ? "สำนักงานใหญ่"
      : `สาขาที่ ${businessProfile.branch}`

  return (
    <Document>
      {/* Main Form Page */}
      <Page size="A4" style={thaiPdfStyles.page}>
        {/* Title */}
        <Text style={thaiPdfStyles.title}>แบบ ภ.ง.ด.53</Text>
        <Text style={styles.subtitle}>
          แบบยื่นรายการภาษีเงินได้หัก ณ ที่จ่าย (สำหรับนิติบุคคล)
        </Text>

        {/* Taxpayer Info */}
        <View style={styles.headerInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>เลขประจำตัวผู้เสียภาษี:</Text>
            <Text style={styles.infoValue}>{businessProfile.taxId || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ชื่อผู้ประกอบการ:</Text>
            <Text style={styles.infoValue}>{businessProfile.companyName || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>สถานประกอบการ:</Text>
            <Text style={styles.infoValue}>{branchDisplay}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ที่อยู่:</Text>
            <Text style={styles.infoValue}>{businessProfile.address || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>การยื่นแบบ:</Text>
            <Text style={styles.infoValue}>ปกติ</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>สำหรับเดือน:</Text>
            <Text style={styles.infoValue}>{thaiPeriod}</Text>
          </View>
        </View>

        {/* Summary Fields */}
        <View style={styles.summarySection}>
          <Text style={{ fontSize: 12, fontWeight: "bold", marginBottom: 4 }}>
            สรุปรายการภาษีหัก ณ ที่จ่าย
          </Text>
          <SummaryFieldRow
            number="1"
            label="รวมยอดเงินได้ทั้งสิ้น"
            value={summary.totalIncomePaid}
          />
          <SummaryFieldRow
            number="2"
            label="รวมยอดภาษีที่นำส่งทั้งสิ้น"
            value={summary.totalTaxWithheld}
          />
          <SummaryFieldRow
            number="3"
            label="เงินเพิ่ม (ถ้ามี)"
            value={0}
          />
          <SummaryFieldRow
            number="4"
            label="รวมยอดภาษีที่นำส่งและเงินเพิ่ม (2)+(3)"
            value={summary.totalTaxWithheld}
          />
        </View>

        {/* Transaction Count */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>จำนวนผู้มีเงินได้:</Text>
          <Text style={styles.infoValue}>{summary.transactionCount} ราย</Text>
        </View>

        {/* Footer */}
        <View style={thaiPdfStyles.footer}>
          <Text>สร้างโดย BanChee -- เอกสารนี้เป็นเอกสารอ้างอิงเท่านั้น ไม่ใช่เอกสารราชการ</Text>
        </View>
      </Page>

      {/* Attachment Page (ใบแนบ) */}
      {transactions.length > 0 && (
        <Page size="A4" orientation="landscape" style={thaiPdfStyles.page}>
          <Text style={thaiPdfStyles.title}>ใบแนบ ภ.ง.ด.53</Text>
          <Text style={styles.subtitle}>
            สำหรับเดือน {thaiPeriod}
          </Text>

          {/* 8-column attachment table per THAI_TAX_REFERENCE.md Section 7 */}
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.colSeqH}>ลำดับที่</Text>
              <Text style={styles.colNameH}>ชื่อและที่อยู่ของผู้มีเงินได้</Text>
              <Text style={styles.colDateH}>วัน เดือน ปี ที่จ่าย</Text>
              <Text style={styles.colDetailH}>รายละเอียดการจ่ายเงิน</Text>
              <Text style={styles.colRateH}>อัตราภาษี %</Text>
              <Text style={styles.colPaidH}>จำนวนเงินที่จ่าย</Text>
              <Text style={styles.colTaxH}>ภาษีที่หักและนำส่ง</Text>
              <Text style={styles.colCondH}>เงื่อนไข</Text>
            </View>

            {transactions.map((t) => (
              <View key={t.id} style={styles.tableRow}>
                <Text style={styles.colSeq}>{t.sequenceNumber}</Text>
                <Text style={styles.colName}>
                  {t.contactName || t.merchant || "-"}
                  {t.contactAddress ? `\n${t.contactAddress}` : ""}
                </Text>
                <Text style={styles.colDate}>
                  {t.issuedAt ? formatThaiDate(new Date(t.issuedAt)) : "-"}
                </Text>
                <Text style={styles.colDetail}>
                  {getPaymentDetail(t.whtRate, t.description)}
                </Text>
                <Text style={styles.colRate}>{formatRatePercent(t.whtRate)}</Text>
                <Text style={styles.colPaid}>{formatAmount(t.subtotal)}</Text>
                <Text style={styles.colTax}>{formatAmount(t.whtAmount)}</Text>
                <Text style={styles.colCond}>1</Text>
              </View>
            ))}

            {/* Totals */}
            <View style={styles.totalRow}>
              <Text style={styles.colSeq}></Text>
              <Text style={styles.colName}></Text>
              <Text style={styles.colDate}></Text>
              <Text style={{ ...styles.colDetail, fontWeight: "bold" }}>รวม</Text>
              <Text style={styles.colRate}></Text>
              <Text style={{ ...styles.colPaid, fontWeight: "bold" }}>
                {formatAmount(summary.totalIncomePaid)}
              </Text>
              <Text style={{ ...styles.colTax, fontWeight: "bold" }}>
                {formatAmount(summary.totalTaxWithheld)}
              </Text>
              <Text style={styles.colCond}></Text>
            </View>
          </View>

          {/* Footer */}
          <View style={thaiPdfStyles.footer}>
            <Text>สร้างโดย BanChee -- เอกสารนี้เป็นเอกสารอ้างอิงเท่านั้น ไม่ใช่เอกสารราชการ</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}
