import { Document, Page, Text, View } from "@react-pdf/renderer"
import { registerThaiFonts } from "@/exports/pdf/fonts"
import { thaiPdfStyles } from "@/exports/pdf/thai-pdf-styles"
import type { InvoiceData } from "../actions"

// Register THSarabunNew at module top level (Pitfall 6 prevention)
registerThaiFonts()

// Stub -- will be fully implemented in Task 2
export function InvoicePDF({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={thaiPdfStyles.page}>
        <View>
          <Text style={{ fontFamily: "THSarabunNew", fontSize: 20 }}>
            {"\u0e43\u0e1a\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49"} / INVOICE
          </Text>
        </View>
      </Page>
    </Document>
  )
}
