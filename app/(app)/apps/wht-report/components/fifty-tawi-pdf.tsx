import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { registerThaiFonts } from "@/exports/pdf/fonts"
import { thaiPdfStyles } from "@/exports/pdf/thai-pdf-styles"
import { formatThaiDateLong, toBuddhistYear } from "@/services/thai-date"
import { formatSatangToDisplay } from "@/services/tax-calculator"
import type { WHTTransactionForReport } from "../actions"
import type { BusinessProfile } from "@/models/business-profile"

// Ensure fonts are registered
registerThaiFonts()

const styles = StyleSheet.create({
  ...thaiPdfStyles,
  copyLabel: {
    fontSize: 10,
    textAlign: "right",
    marginBottom: 6,
    color: "#4b5563",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
  },
  section: {
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#d1d5db",
    padding: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
    backgroundColor: "#f3f4f6",
    padding: 3,
  },
  row: {
    flexDirection: "row",
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    width: 160,
  },
  value: {
    fontSize: 11,
    flex: 1,
  },
  taxIdRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "center",
  },
  taxIdLabel: {
    fontSize: 11,
    width: 220,
  },
  taxIdValue: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  incomeTable: {
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: "#d1d5db",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
    padding: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    padding: 4,
  },
  colDesc: {
    fontSize: 10,
    flex: 3,
  },
  colDate: {
    fontSize: 10,
    width: 80,
    textAlign: "center",
  },
  colAmount: {
    fontSize: 10,
    width: 80,
    textAlign: "right",
  },
  colTax: {
    fontSize: 10,
    width: 80,
    textAlign: "right",
  },
  colCondition: {
    fontSize: 10,
    width: 40,
    textAlign: "center",
  },
  totalRow: {
    flexDirection: "row",
    padding: 4,
    backgroundColor: "#f9fafb",
    fontWeight: "bold",
  },
  checkboxRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "center",
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: "#374151",
    marginRight: 6,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 1,
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#374151",
    marginRight: 6,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 1,
    color: "#ffffff",
  },
  checkboxLabel: {
    fontSize: 11,
  },
  certInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  signatureSection: {
    marginTop: 20,
    alignItems: "flex-end",
    paddingRight: 40,
  },
  signatureLine: {
    width: 200,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 10,
    textAlign: "center",
    width: 200,
  },
})

function formatAmount(satang: number): string {
  const baht = formatSatangToDisplay(satang)
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baht)
}

function formatWhtRatePercent(basisPoints: number): string {
  return (basisPoints / 100).toFixed(1)
}

/**
 * Map WHT rate to income type description per Section 40 categories.
 */
function getIncomeTypeLabel(whtRate: number, description: string | null): string {
  // Common mapping based on WHT rate
  switch (whtRate) {
    case 100: // 1%
      return "6. ค่าขนส่ง / เบี้ยประกันวินาศภัย"
    case 200: // 2%
      return "6. ค่าโฆษณา"
    case 300: // 3%
      return "6. ค่าจ้างทำของ / ค่าบริการ (มาตรา 40(2),(6)-(8))"
    case 500: // 5%
      return "5. ค่าเช่า (มาตรา 40(5))"
    case 1000: // 10%
      return "4. (ข) เงินปันผล (มาตรา 40(4)(ข))"
    default:
      return description || "6. ค่าจ้างทำของ / ค่าบริการ"
  }
}

// ─── Copy labels per Revenue Department requirement ───────────

const COPY_LABELS = [
  "สำหรับผู้ถูกหักภาษี (แนบพร้อมแบบแสดงรายการภาษี)",
  "สำหรับผู้ถูกหักภาษี (เก็บไว้เป็นหลักฐาน)",
  "สำหรับผู้หักภาษี (เก็บไว้เป็นหลักฐาน)",
] as const

// ─── Single Certificate Page ──────────────────────────────────

function CertificatePage({
  transaction,
  businessProfile,
  certificateNumber,
  issuedDate,
  copyLabel,
}: {
  transaction: WHTTransactionForReport
  businessProfile: BusinessProfile
  certificateNumber: string
  issuedDate: Date
  copyLabel: string
}) {
  const branchDisplay =
    businessProfile.branch === "00000"
      ? "สำนักงานใหญ่"
      : `สาขาที่ ${businessProfile.branch}`

  const payeeBranchDisplay = !transaction.contactBranch || transaction.contactBranch === "00000"
    ? "สำนักงานใหญ่"
    : `สาขาที่ ${transaction.contactBranch}`

  const isPnd3 = transaction.whtType === "pnd3"
  const isPnd53 = transaction.whtType === "pnd53"

  const paymentDate = transaction.issuedAt
    ? formatThaiDateLong(new Date(transaction.issuedAt))
    : "-"

  const issuedDateDisplay = formatThaiDateLong(issuedDate)

  return (
    <Page size="A4" style={thaiPdfStyles.page}>
      {/* Copy Label */}
      <Text style={styles.copyLabel}>{copyLabel}</Text>

      {/* Title */}
      <Text style={styles.formTitle}>หนังสือรับรองการหักภาษี ณ ที่จ่าย</Text>
      <Text style={styles.formSubtitle}>ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</Text>

      {/* Certificate Number */}
      <View style={styles.certInfoRow}>
        <Text style={{ fontSize: 11 }}>เลขที่ {certificateNumber}</Text>
      </View>

      {/* Payer Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ผู้มีหน้าที่หักภาษี ณ ที่จ่าย (ผู้จ่ายเงิน)</Text>
        <View style={styles.row}>
          <Text style={styles.label}>ชื่อ:</Text>
          <Text style={styles.value}>{businessProfile.companyName || "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>ที่อยู่:</Text>
          <Text style={styles.value}>{businessProfile.address || "-"}</Text>
        </View>
        <View style={styles.taxIdRow}>
          <Text style={styles.taxIdLabel}>เลขประจำตัวผู้เสียภาษีอากร (13 หลัก):</Text>
          <Text style={styles.taxIdValue}>{businessProfile.taxId || "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>สถานประกอบการ:</Text>
          <Text style={styles.value}>{branchDisplay}</Text>
        </View>
      </View>

      {/* Payee Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ผู้ถูกหักภาษี ณ ที่จ่าย (ผู้รับเงิน)</Text>
        <View style={styles.row}>
          <Text style={styles.label}>ชื่อ:</Text>
          <Text style={styles.value}>{transaction.contactName || transaction.merchant || "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>ที่อยู่:</Text>
          <Text style={styles.value}>{transaction.contactAddress || "-"}</Text>
        </View>
        <View style={styles.taxIdRow}>
          <Text style={styles.taxIdLabel}>เลขประจำตัวผู้เสียภาษีอากร (13 หลัก):</Text>
          <Text style={styles.taxIdValue}>{transaction.contactTaxId || "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>สถานประกอบการ:</Text>
          <Text style={styles.value}>{payeeBranchDisplay}</Text>
        </View>
      </View>

      {/* Form Type Checkboxes */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: "bold", marginBottom: 4 }}>
          แบบยื่นภาษี:
        </Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={styles.checkboxRow}>
            <View style={isPnd3 ? styles.checkboxChecked : styles.checkbox}>
              {isPnd3 && <Text>X</Text>}
            </View>
            <Text style={styles.checkboxLabel}>ภ.ง.ด.3</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={isPnd53 ? styles.checkboxChecked : styles.checkbox}>
              {isPnd53 && <Text>X</Text>}
            </View>
            <Text style={styles.checkboxLabel}>ภ.ง.ด.53</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>ลำดับที่ในแบบ:</Text>
          <Text style={styles.value}>{transaction.sequenceNumber}</Text>
        </View>
      </View>

      {/* Income Details Table */}
      <View style={styles.incomeTable}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.colDesc}>ประเภทเงินได้พึงประเมินที่จ่าย</Text>
          <Text style={styles.colDate}>วัน เดือน ปี ที่จ่าย</Text>
          <Text style={styles.colAmount}>จำนวนเงินที่จ่าย</Text>
          <Text style={styles.colTax}>ภาษีที่หักและนำส่ง</Text>
          <Text style={styles.colCondition}>เงื่อนไข</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.colDesc}>
            {getIncomeTypeLabel(transaction.whtRate, transaction.description)}
          </Text>
          <Text style={styles.colDate}>{paymentDate}</Text>
          <Text style={styles.colAmount}>{formatAmount(transaction.subtotal)}</Text>
          <Text style={styles.colTax}>{formatAmount(transaction.whtAmount)}</Text>
          <Text style={styles.colCondition}>1</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.colDesc}>รวมเงินที่จ่ายและภาษีที่หัก</Text>
          <Text style={styles.colDate}></Text>
          <Text style={styles.colAmount}>{formatAmount(transaction.subtotal)}</Text>
          <Text style={styles.colTax}>{formatAmount(transaction.whtAmount)}</Text>
          <Text style={styles.colCondition}></Text>
        </View>
      </View>

      {/* Condition Legend */}
      <View style={{ marginTop: 4 }}>
        <Text style={{ fontSize: 9, color: "#6b7280" }}>
          เงื่อนไข: (1) หักภาษี ณ ที่จ่าย   (2) ออกภาษีให้ตลอดไป   (3) ออกภาษีให้ครั้งเดียว
          {" "}  (4) อื่นๆ (ระบุ)
        </Text>
      </View>

      {/* Issue Date */}
      <View style={{ marginTop: 12 }}>
        <View style={styles.row}>
          <Text style={styles.label}>ออกให้ ณ วันที่:</Text>
          <Text style={styles.value}>{issuedDateDisplay}</Text>
        </View>
      </View>

      {/* Signature Section */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>ลงชื่อ ผู้จ่ายเงิน</Text>
        <Text style={{ fontSize: 10, textAlign: "center", width: 200, marginTop: 2 }}>
          ({businessProfile.companyName || "........................................"})
        </Text>
      </View>

      {/* Footer */}
      <View style={thaiPdfStyles.footer}>
        <Text>สร้างโดย BanChee -- เอกสารนี้เป็นเอกสารอ้างอิงเท่านั้น ไม่ใช่เอกสารราชการ</Text>
      </View>
    </Page>
  )
}

// ─── Main 50 Tawi PDF Document (3 copies) ─────────────────────

export function FiftyTawiPDF({
  transaction,
  businessProfile,
  certificateNumber,
  issuedDate,
}: {
  transaction: WHTTransactionForReport
  businessProfile: BusinessProfile
  certificateNumber: string
  issuedDate: Date
}) {
  return (
    <Document>
      {COPY_LABELS.map((label, index) => (
        <CertificatePage
          key={index}
          transaction={transaction}
          businessProfile={businessProfile}
          certificateNumber={certificateNumber}
          issuedDate={issuedDate}
          copyLabel={`${label} (ฉบับที่ ${index + 1})`}
        />
      ))}
    </Document>
  )
}
