import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { registerThaiFonts } from "@/exports/pdf/fonts"
import { thaiPdfStyles } from "@/exports/pdf/thai-pdf-styles"
import { formatThaiMonth, toBuddhistYear } from "@/services/thai-date"
import { formatSatangToDisplay } from "@/services/tax-calculator"
import type { PP30Fields } from "../actions"
import type { BusinessProfile } from "@/models/business-profile"

// Ensure fonts are registered
registerThaiFonts()

const styles = StyleSheet.create({
  ...thaiPdfStyles,
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    backgroundColor: "#f3f4f6",
    padding: 4,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 11,
    flex: 3,
  },
  fieldNumber: {
    fontSize: 11,
    width: 30,
    textAlign: "center",
  },
  fieldValue: {
    fontSize: 11,
    flex: 1,
    textAlign: "right",
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
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 6,
  },
})

function formatAmount(satang: number): string {
  const baht = formatSatangToDisplay(satang)
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baht)
}

function PP30FieldRow({
  number,
  label,
  value,
}: {
  number: string
  label: string
  value: number
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.fieldNumber}>({number})</Text>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{formatAmount(value)}</Text>
    </View>
  )
}

export function PP30PDF({
  pp30Fields,
  businessProfile,
  period,
}: {
  pp30Fields: PP30Fields
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
      <Page size="A4" style={thaiPdfStyles.page}>
        {/* Title */}
        <Text style={thaiPdfStyles.title}>
          แบบ ภ.พ.30
        </Text>
        <Text style={styles.subtitle}>
          แบบแสดงรายการภาษีมูลค่าเพิ่ม
        </Text>

        {/* Taxpayer Info */}
        <View style={styles.section}>
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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ที่อยู่:</Text>
            <Text style={styles.infoValue}>{businessProfile.address || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>สำหรับเดือนภาษี:</Text>
            <Text style={styles.infoValue}>{thaiPeriod}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>การยื่นแบบ:</Text>
            <Text style={styles.infoValue}>ปกติ</Text>
          </View>
        </View>

        {/* Output Tax Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ภาษีขาย (Output Tax)</Text>
          <PP30FieldRow
            number="1"
            label="ยอดขายในเดือนนี้"
            value={pp30Fields.salesAmount}
          />
          <PP30FieldRow
            number="2"
            label="หัก ยอดขายที่เสียภาษีในอัตราร้อยละ 0"
            value={pp30Fields.zeroRateSales}
          />
          <PP30FieldRow
            number="3"
            label="หัก ยอดขายที่ได้รับยกเว้น"
            value={pp30Fields.exemptSales}
          />
          <PP30FieldRow
            number="4"
            label="ยอดขายที่ต้องเสียภาษี (1)-(2)-(3)"
            value={pp30Fields.taxableSales}
          />
          <PP30FieldRow
            number="5"
            label="ภาษีขายเดือนนี้"
            value={pp30Fields.outputTax}
          />
        </View>

        {/* Input Tax Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ภาษีซื้อ (Input Tax)</Text>
          <PP30FieldRow
            number="6"
            label="ยอดซื้อที่มีสิทธิหักภาษีซื้อในเดือนนี้"
            value={pp30Fields.purchaseAmount}
          />
          <PP30FieldRow
            number="7"
            label="ภาษีซื้อเดือนนี้"
            value={pp30Fields.inputTax}
          />
        </View>

        {/* Tax Computation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>การคำนวณภาษี (Tax Computation)</Text>
          <PP30FieldRow
            number="8"
            label="ภาษีที่ต้องชำระ (5)-(7)"
            value={pp30Fields.taxPayable}
          />
          <PP30FieldRow
            number="9"
            label="ภาษีที่ชำระไว้เกิน (7)-(5)"
            value={pp30Fields.excessTax}
          />
          <PP30FieldRow
            number="10"
            label="ภาษีที่ชำระไว้เกินยกมา"
            value={pp30Fields.carriedForward}
          />
          <PP30FieldRow
            number="11"
            label="ภาษีที่ต้องชำระสุทธิ (8)-(10)"
            value={pp30Fields.netPayable}
          />
          <PP30FieldRow
            number="12"
            label="ภาษีที่ชำระไว้เกินสุทธิ"
            value={pp30Fields.netExcess}
          />
          <PP30FieldRow
            number="13"
            label="เงินเพิ่ม"
            value={pp30Fields.surcharge}
          />
          <PP30FieldRow
            number="14"
            label="เบี้ยปรับ"
            value={pp30Fields.penalty}
          />
          <PP30FieldRow
            number="15"
            label="รวมภาษีที่ต้องชำระ (11)+(13)+(14)"
            value={pp30Fields.totalPayable}
          />
          <PP30FieldRow
            number="16"
            label="รวมภาษีที่ชำระไว้เกิน"
            value={pp30Fields.totalExcess}
          />
        </View>

        {/* Footer */}
        <View style={thaiPdfStyles.footer}>
          <Text>สร้างโดย BanChee -- เอกสารนี้เป็นเอกสารอ้างอิงเท่านั้น ไม่ใช่เอกสารราชการ</Text>
        </View>
      </Page>
    </Document>
  )
}
