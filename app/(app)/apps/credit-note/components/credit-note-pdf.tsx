import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { registerThaiFonts } from "@/exports/pdf/fonts"
import { thaiPdfStyles } from "@/exports/pdf/thai-pdf-styles"
import { formatThaiDateLong } from "@/services/thai-date"
import { formatSatangToDisplay } from "@/services/tax-calculator"
import type { CreditNoteData } from "../actions"

// Ensure fonts are registered
registerThaiFonts()

const styles = StyleSheet.create({
  ...thaiPdfStyles,
  headerSection: {
    marginBottom: 12,
    textAlign: "center",
  },
  mainTitle: {
    fontFamily: "THSarabunNew",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  subTitle: {
    fontFamily: "THSarabunNew",
    fontSize: 14,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 8,
  },
  docInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    paddingBottom: 8,
  },
  partySection: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 20,
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
  branchBadge: {
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
  refSection: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  refLabel: {
    fontFamily: "THSarabunNew",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  refText: {
    fontFamily: "THSarabunNew",
    fontSize: 11,
    marginBottom: 1,
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
  colSeq: { width: 30, textAlign: "center" },
  colDesc: { flex: 1 },
  colAmount: { width: 90, textAlign: "right" },
  colDiff: { width: 90, textAlign: "right" },
  cellText: {
    fontFamily: "THSarabunNew",
    fontSize: 11,
  },
  summarySection: {
    alignItems: "flex-end",
    marginTop: 8,
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
  totalRowPdf: {
    flexDirection: "row",
    width: 250,
    justifyContent: "space-between",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
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
  noteSection: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  noteLabel: {
    fontFamily: "THSarabunNew",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  noteText: {
    fontFamily: "THSarabunNew",
    fontSize: 10,
  },
})

function formatAmount(satang: number): string {
  const baht = formatSatangToDisplay(satang)
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baht)
}

function branchDisplay(branch: string): string {
  return branch === "00000"
    ? "\u0e2a\u0e33\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19\u0e43\u0e2b\u0e0d\u0e48"
    : `\u0e2a\u0e32\u0e02\u0e32\u0e17\u0e35\u0e48 ${parseInt(branch, 10)}`
}

export function CreditNotePDF({
  noteData,
}: {
  noteData: CreditNoteData
}) {
  const {
    seller,
    buyer,
    items,
    totalDifference,
    vatOnDifference,
    docNumber,
    noteType,
    issuedAt,
    reason,
    originalInvoice,
    note,
  } = noteData

  const issuedDate = new Date(issuedAt)
  const thaiDate = formatThaiDateLong(issuedDate)
  const titleText = noteType === "credit"
    ? "\u0e43\u0e1a\u0e25\u0e14\u0e2b\u0e19\u0e35\u0e49 / CREDIT NOTE"
    : "\u0e43\u0e1a\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2b\u0e19\u0e35\u0e49 / DEBIT NOTE"

  return (
    <Document>
      <Page size="A4" style={thaiPdfStyles.page}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>{titleText}</Text>
          <Text style={styles.subTitle}>
            ({"\u0e40\u0e2d\u0e01\u0e2a\u0e32\u0e23\u0e2d\u0e49\u0e32\u0e07\u0e2d\u0e34\u0e07"})
          </Text>
        </View>

        {/* Document info */}
        <View style={styles.docInfo}>
          <View>
            <Text style={[styles.cellText, { fontWeight: "bold" }]}>
              {"\u0e40\u0e25\u0e02\u0e17\u0e35\u0e48"}: {docNumber}
            </Text>
          </View>
          <View>
            <Text style={[styles.cellText, { fontWeight: "bold" }]}>
              {"\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48"}: {thaiDate}
            </Text>
          </View>
        </View>

        {/* Seller and Buyer */}
        <View style={styles.partySection}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>{"\u0e1c\u0e39\u0e49\u0e02\u0e32\u0e22"} (Seller)</Text>
            <Text style={styles.partyDetail}>{seller.name}</Text>
            <Text style={styles.partyDetail}>{seller.address}</Text>
            <Text style={styles.partyDetail}>
              {"\u0e40\u0e25\u0e02\u0e1b\u0e23\u0e30\u0e08\u0e33\u0e15\u0e31\u0e27\u0e1c\u0e39\u0e49\u0e40\u0e2a\u0e35\u0e22\u0e20\u0e32\u0e29\u0e35"}: {seller.taxId}
            </Text>
            <Text style={styles.branchBadge}>{branchDisplay(seller.branch)}</Text>
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>{"\u0e1c\u0e39\u0e49\u0e0b\u0e37\u0e49\u0e2d"} (Buyer)</Text>
            <Text style={styles.partyDetail}>{buyer.name}</Text>
            <Text style={styles.partyDetail}>{buyer.address}</Text>
            <Text style={styles.partyDetail}>
              {"\u0e40\u0e25\u0e02\u0e1b\u0e23\u0e30\u0e08\u0e33\u0e15\u0e31\u0e27\u0e1c\u0e39\u0e49\u0e40\u0e2a\u0e35\u0e22\u0e20\u0e32\u0e29\u0e35"}: {buyer.taxId}
            </Text>
            <Text style={styles.branchBadge}>{branchDisplay(buyer.branch)}</Text>
          </View>
        </View>

        {/* Reference to original invoice */}
        <View style={styles.refSection}>
          <Text style={styles.refLabel}>{"\u0e2d\u0e49\u0e32\u0e07\u0e2d\u0e34\u0e07\u0e43\u0e1a\u0e01\u0e33\u0e01\u0e31\u0e1a\u0e20\u0e32\u0e29\u0e35\u0e15\u0e49\u0e19\u0e09\u0e1a\u0e31\u0e1a"}:</Text>
          <Text style={styles.refText}>
            {"\u0e40\u0e25\u0e02\u0e17\u0e35\u0e48"}: {originalInvoice.documentNumber}
          </Text>
          {originalInvoice.issuedAt && (
            <Text style={styles.refText}>
              {"\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48"}: {formatThaiDateLong(new Date(originalInvoice.issuedAt))}
            </Text>
          )}
          <Text style={styles.refText}>
            {"\u0e40\u0e2b\u0e15\u0e38\u0e1c\u0e25"}: {reason}
          </Text>
        </View>

        {/* Items table */}
        <View style={styles.itemsTable}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderText, styles.colSeq]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>
              {"\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14"}
            </Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>
              {"\u0e22\u0e2d\u0e14\u0e40\u0e14\u0e34\u0e21"}
            </Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>
              {"\u0e22\u0e2d\u0e14\u0e41\u0e01\u0e49\u0e44\u0e02"}
            </Text>
            <Text style={[styles.tableHeaderText, styles.colDiff]}>
              {"\u0e1c\u0e25\u0e15\u0e48\u0e32\u0e07"}
            </Text>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.cellText, styles.colSeq]}>{index + 1}</Text>
              <Text style={[styles.cellText, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.cellText, styles.colAmount]}>
                {formatAmount(item.originalAmount)}
              </Text>
              <Text style={[styles.cellText, styles.colAmount]}>
                {formatAmount(item.correctedAmount)}
              </Text>
              <Text style={[styles.cellText, styles.colDiff]}>
                {formatAmount(item.difference)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {"\u0e1c\u0e25\u0e15\u0e48\u0e32\u0e07\u0e23\u0e27\u0e21"} ({noteType === "credit" ? "\u0e25\u0e14" : "\u0e40\u0e1e\u0e34\u0e48\u0e21"})
            </Text>
            <Text style={styles.summaryValue}>{formatAmount(totalDifference)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {"\u0e20\u0e32\u0e29\u0e35\u0e21\u0e39\u0e25\u0e04\u0e48\u0e32\u0e40\u0e1e\u0e34\u0e48\u0e21"} (7%)
            </Text>
            <Text style={styles.summaryValue}>{formatAmount(vatOnDifference)}</Text>
          </View>
          <View style={styles.totalRowPdf}>
            <Text style={styles.totalLabel}>
              {"\u0e23\u0e27\u0e21\u0e17\u0e31\u0e49\u0e07\u0e2a\u0e34\u0e49\u0e19"}
            </Text>
            <Text style={styles.totalValue}>
              {formatAmount(totalDifference)} {"\u0e1a\u0e32\u0e17"}
            </Text>
          </View>
        </View>

        {/* Note */}
        {note && (
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>{"\u0e2b\u0e21\u0e32\u0e22\u0e40\u0e2b\u0e15\u0e38"}:</Text>
            <Text style={styles.noteText}>{note}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={thaiPdfStyles.footer}>
          <Text>
            {"\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e42\u0e14\u0e22"} BanChee -- {"\u0e40\u0e2d\u0e01\u0e2a\u0e32\u0e23\u0e19\u0e35\u0e49\u0e40\u0e1b\u0e47\u0e19\u0e40\u0e2d\u0e01\u0e2a\u0e32\u0e23\u0e2d\u0e49\u0e32\u0e07\u0e2d\u0e34\u0e07\u0e40\u0e17\u0e48\u0e32\u0e19\u0e31\u0e49\u0e19"}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
