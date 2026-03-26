import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { registerThaiFonts } from "@/exports/pdf/fonts"
import { thaiPdfStyles } from "@/exports/pdf/thai-pdf-styles"
import { formatThaiDateLong } from "@/services/thai-date"
import type { ReceiptData } from "../actions"

// Register THSarabunNew at module top level (Pitfall 6 prevention)
registerThaiFonts()

const styles = StyleSheet.create({
  ...thaiPdfStyles,
  headerSection: {
    marginBottom: 12,
    textAlign: "center",
    alignItems: "center",
  },
  companyName: {
    fontFamily: "THSarabunNew",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  companyDetail: {
    fontFamily: "THSarabunNew",
    fontSize: 11,
    textAlign: "center",
    marginBottom: 1,
  },
  branchBadge: {
    fontFamily: "THSarabunNew",
    fontSize: 10,
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 2,
  },
  mainTitle: {
    fontFamily: "THSarabunNew",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
    marginTop: 8,
  },
  subTitle: {
    fontFamily: "THSarabunNew",
    fontSize: 14,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 8,
  },
  docInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  docInfoText: {
    fontFamily: "THSarabunNew",
    fontSize: 11,
    fontWeight: "bold",
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    marginVertical: 8,
  },
  partySection: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 12,
  },
  partyBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#d1d5db",
    borderRadius: 4,
    padding: 8,
  },
  partyLabel: {
    fontFamily: "THSarabunNew",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#374151",
  },
  partyDetail: {
    fontFamily: "THSarabunNew",
    fontSize: 11,
    marginBottom: 2,
  },
  partyBranchBadge: {
    fontFamily: "THSarabunNew",
    fontSize: 10,
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  itemsTable: {
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontFamily: "THSarabunNew",
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: "#f9fafb",
  },
  colSeq: { width: 30, textAlign: "center" },
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colUnit: { width: 50, textAlign: "center" },
  colPrice: { width: 80, textAlign: "right" },
  colDiscount: { width: 70, textAlign: "right" },
  colAmount: { width: 90, textAlign: "right" },
  cellText: {
    fontFamily: "THSarabunNew",
    fontSize: 11,
  },
  summarySection: {
    alignItems: "flex-end",
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: "row",
    width: 250,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  summaryLabel: {
    fontFamily: "THSarabunNew",
    fontSize: 11,
  },
  summaryValue: {
    fontFamily: "THSarabunNew",
    fontSize: 11,
    textAlign: "right",
  },
  separatorLine: {
    width: 250,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    marginTop: 2,
  },
  totalRow: {
    flexDirection: "row",
    width: 250,
    justifyContent: "space-between",
    paddingVertical: 4,
    marginTop: 2,
  },
  totalLabel: {
    fontFamily: "THSarabunNew",
    fontSize: 13,
    fontWeight: "bold",
  },
  totalValue: {
    fontFamily: "THSarabunNew",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "right",
  },
  paymentInfoSection: {
    marginTop: 16,
    borderWidth: 0.5,
    borderColor: "#d1d5db",
    borderRadius: 4,
    padding: 8,
  },
  paymentInfoTitle: {
    fontFamily: "THSarabunNew",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#374151",
  },
  paymentInfoRow: {
    fontFamily: "THSarabunNew",
    fontSize: 11,
    marginBottom: 2,
  },
  noteSection: {
    fontFamily: "THSarabunNew",
    fontSize: 11,
    marginTop: 8,
  },
  signatureArea: {
    flexDirection: "row",
    marginTop: 40,
    justifyContent: "space-around",
  },
  signatureBlock: {
    alignItems: "center",
  },
  signatureLine: {
    width: 100,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    marginBottom: 4,
  },
  signatureLabel: {
    fontFamily: "THSarabunNew",
    fontSize: 11,
    marginBottom: 2,
  },
  signatureDate: {
    fontFamily: "THSarabunNew",
    fontSize: 11,
    color: "#6b7280",
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 4,
  },
})

function formatAmount(satang: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(satang / 100)
}

function branchDisplay(branch: string): string {
  return branch === "00000"
    ? "สำนักงานใหญ่"
    : `สาขาที่ ${parseInt(branch, 10)}`
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transfer: "โอนเงิน",
  cash: "เงินสด",
  cheque: "เช็ค",
  credit_card: "บัตรเครดิต",
}

export function ReceiptPDF({ data }: { data: ReceiptData }) {
  const {
    seller,
    buyer,
    items,
    subtotal,
    discountAmount,
    includeVat,
    vatAmount,
    total,
    documentNumber,
    issuedAt,
    note,
    paymentMethod,
    paymentDate,
    paidAmount,
  } = data

  const issuedDate = new Date(issuedAt)
  const thaiIssuedDate = formatThaiDateLong(issuedDate)
  const thaiPaymentDate = paymentDate
    ? formatThaiDateLong(new Date(paymentDate))
    : "\u2014"

  const BASE_URL = process.env.BASE_URL ?? "http://localhost:7331"

  return (
    <Document>
      <Page size="A4" style={thaiPdfStyles.page}>
        {/* 1. Company header */}
        <View style={styles.headerSection}>
          {seller.logo && (
            <Image
              src={`${BASE_URL}/files/static/${seller.logo}`}
              style={styles.logo}
            />
          )}
          <Text style={styles.companyName}>{seller.name}</Text>
          <Text style={styles.companyDetail}>{seller.address}</Text>
          <Text style={styles.companyDetail}>
            เลขประจำตัวผู้เสียภาษี: {seller.taxId}
          </Text>
          <Text style={styles.branchBadge}>{branchDisplay(seller.branch)}</Text>
        </View>

        {/* 2. Document title */}
        <View>
          <Text style={styles.mainTitle}>
            ใบเสร็จรับเงิน / RECEIPT
          </Text>
          <Text style={styles.subTitle}>
            (ต้นฉบับ)
          </Text>
        </View>

        {/* 3. Document info rows */}
        <View style={styles.docInfoRow}>
          <Text style={styles.docInfoText}>
            เลขที่: {documentNumber}
          </Text>
          <Text style={styles.docInfoText}>
            วันที่: {thaiIssuedDate}
          </Text>
        </View>

        {/* 4. Horizontal rule */}
        <View style={styles.hr} />

        {/* 5. Party boxes */}
        <View style={styles.partySection}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>ผู้รับเงิน (Seller)</Text>
            <Text style={styles.partyDetail}>{seller.name}</Text>
            <Text style={styles.partyDetail}>{seller.address}</Text>
            <Text style={styles.partyDetail}>
              เลขประจำตัวผู้เสียภาษี: {seller.taxId}
            </Text>
            <Text style={styles.partyBranchBadge}>{branchDisplay(seller.branch)}</Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>ผู้ชำระเงิน (Buyer)</Text>
            <Text style={styles.partyDetail}>{buyer.name}</Text>
            <Text style={styles.partyDetail}>{buyer.address}</Text>
            <Text style={styles.partyDetail}>
              เลขประจำตัวผู้เสียภาษี: {buyer.taxId}
            </Text>
            <Text style={styles.partyBranchBadge}>{branchDisplay(buyer.branch)}</Text>
          </View>
        </View>

        {/* 6. Line items table */}
        <View style={styles.itemsTable}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderText, styles.colSeq]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>
              รายละเอียด
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>
              จำนวน
            </Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>
              หน่วย
            </Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>
              ราคา/หน่วย
            </Text>
            <Text style={[styles.tableHeaderText, styles.colDiscount]}>
              ส่วนลด
            </Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>
              จำนวนเงิน
            </Text>
          </View>
          {items.map((item, index) => (
            <View
              key={index}
              style={index % 2 === 1 ? styles.tableRowAlt : styles.tableRow}
            >
              <Text style={[styles.cellText, styles.colSeq]}>{index + 1}</Text>
              <Text style={[styles.cellText, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.cellText, styles.colUnit]}>{item.unit}</Text>
              <Text style={[styles.cellText, styles.colPrice]}>
                {formatAmount(item.unitPrice)}
              </Text>
              <Text style={[styles.cellText, styles.colDiscount]}>
                {formatAmount(item.discount)}
              </Text>
              <Text style={[styles.cellText, styles.colAmount]}>
                {formatAmount(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* 7. Totals section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              มูลค่าสินค้า/บริการ
            </Text>
            <Text style={styles.summaryValue}>{formatAmount(subtotal)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                ส่วนลดรวม
              </Text>
              <Text style={styles.summaryValue}>{formatAmount(discountAmount)}</Text>
            </View>
          )}
          {includeVat && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                ภาษีมูลค่าเพิ่ม 7%
              </Text>
              <Text style={styles.summaryValue}>{formatAmount(vatAmount)}</Text>
            </View>
          )}
          <View style={styles.separatorLine} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              รวมทั้งสิ้น
            </Text>
            <Text style={styles.totalValue}>
              {formatAmount(total)} บาท
            </Text>
          </View>
        </View>

        {/* 8. Payment info section */}
        <View style={styles.paymentInfoSection}>
          <Text style={styles.paymentInfoTitle}>ข้อมูลการชำระเงิน</Text>
          <Text style={styles.paymentInfoRow}>
            วิธีการชำระ: {PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod}
          </Text>
          <Text style={styles.paymentInfoRow}>
            วันที่ชำระ: {thaiPaymentDate}
          </Text>
          <Text style={styles.paymentInfoRow}>
            จำนวนเงินที่ได้รับ: {formatAmount(paidAmount)} บาท
          </Text>
        </View>

        {/* 9. Note */}
        {note && (
          <Text style={styles.noteSection}>
            หมายเหตุ: {note}
          </Text>
        )}

        {/* 10. Signature area */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>ผู้รับเงิน</Text>
            <Text style={styles.signatureDate}>วันที่ ____/____/____</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>ผู้ชำระเงิน</Text>
            <Text style={styles.signatureDate}>วันที่ ____/____/____</Text>
          </View>
        </View>

        {/* 11. Footer */}
        <View style={thaiPdfStyles.footer}>
          <Text>
            สร้างโดย BanChee {"\u2014"} เอกสารนี้เป็นเอกสารอ้างอิง
          </Text>
        </View>
      </Page>
    </Document>
  )
}
