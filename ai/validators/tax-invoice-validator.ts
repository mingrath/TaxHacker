/**
 * Tax Invoice Validator -- Section 86/4 compliance checker.
 *
 * Validates AI-extracted data against the 10+ required fields
 * of a full-format Thai tax invoice per Revenue Department rules.
 * Returns per-field validation status for inline UI display.
 */

export type FieldValidationStatus = "valid" | "invalid" | "missing" | "not_applicable"

export type FieldValidation = {
  status: FieldValidationStatus
  value: string | null
  message?: string
}

export type ValidationResult = {
  isValidTaxInvoice: boolean
  fields: Record<string, FieldValidation>
  missingCount: number
  warnings: string[]
}

const TAX_ID_REGEX = /^\d{13}$/

/**
 * Validate AI-extracted data against Section 86/4 required fields.
 *
 * Required fields (1-10) must all be valid for isValidTaxInvoice = true.
 * Field 11 (buyer_tax_id) is optional (B2B only) and marked as not_applicable if missing.
 */
export function validateTaxInvoiceFields(
  extractedData: Record<string, unknown>
): ValidationResult {
  const fields: Record<string, FieldValidation> = {}
  const warnings: string[] = []

  // 1. Tax invoice label -- check if document appears to be a tax invoice
  const name = asString(extractedData.name)
  const description = asString(extractedData.description)
  const text = asString(extractedData.text)
  const combinedText = [name, description, text].join(" ")
  const hasTaxInvoiceLabel =
    combinedText.includes("ใบกำกับภาษี") || combinedText.toLowerCase().includes("tax invoice")
  fields.tax_invoice_label = hasTaxInvoiceLabel
    ? { status: "valid", value: "ใบกำกับภาษี" }
    : { status: "missing", value: null, message: 'ไม่พบคำว่า "ใบกำกับภาษี"' }

  // 2. Seller name
  const merchant = asString(extractedData.merchant)
  fields.seller_name = merchant
    ? { status: "valid", value: merchant }
    : { status: "missing", value: null, message: "ไม่พบชื่อผู้ขาย" }

  // 3. Seller Tax ID -- must be exactly 13 digits
  const merchantTaxId = asString(extractedData.merchant_tax_id)
  if (merchantTaxId) {
    fields.seller_tax_id = TAX_ID_REGEX.test(merchantTaxId)
      ? { status: "valid", value: merchantTaxId }
      : { status: "invalid", value: merchantTaxId, message: "เลขประจำตัวผู้เสียภาษีต้องเป็น 13 หลัก" }
  } else {
    fields.seller_tax_id = { status: "missing", value: null, message: "ไม่พบเลขประจำตัวผู้เสียภาษีผู้ขาย" }
  }

  // 4. Seller address -- check description or text for address-like content
  const hasAddress =
    combinedText.includes("ที่อยู่") ||
    combinedText.includes("ถนน") ||
    combinedText.includes("แขวง") ||
    combinedText.includes("เขต") ||
    combinedText.includes("จังหวัด") ||
    combinedText.match(/\d{5}/) !== null // Thai postal code
  fields.seller_address = hasAddress
    ? { status: "valid", value: "found in text" }
    : { status: "missing", value: null, message: "ไม่พบที่อยู่ผู้ขาย" }

  // 5. Seller branch
  const merchantBranch = asString(extractedData.merchant_branch)
  fields.seller_branch = merchantBranch
    ? { status: "valid", value: merchantBranch }
    : { status: "missing", value: null, message: "ไม่พบสาขา (สำนักงานใหญ่/สาขาที่)" }

  // 6. Buyer info -- may be N/A for simplified invoices
  const buyerName = asString(extractedData.buyer_name)
  const buyerInText =
    combinedText.includes("ผู้ซื้อ") ||
    combinedText.includes("ลูกค้า") ||
    combinedText.includes("customer")
  if (buyerName || buyerInText) {
    fields.buyer_info = { status: "valid", value: buyerName || "found in text" }
  } else {
    fields.buyer_info = {
      status: "not_applicable",
      value: null,
      message: "ไม่พบข้อมูลผู้ซื้อ (อาจเป็นใบกำกับภาษีอย่างย่อ)",
    }
  }

  // 7. Invoice number (document number)
  const documentNumber = asString(extractedData.document_number)
  fields.invoice_number = documentNumber
    ? { status: "valid", value: documentNumber }
    : { status: "missing", value: null, message: "ไม่พบเลขที่ใบกำกับภาษี" }

  // 8. Items and values
  const items = extractedData.items
  const hasItems = Array.isArray(items) && items.length > 0
  fields.items_and_values = hasItems
    ? { status: "valid", value: `${(items as unknown[]).length} รายการ` }
    : { status: "missing", value: null, message: "ไม่พบรายการสินค้า/บริการ" }

  // 9. VAT separated
  const vatAmount = extractedData.vat_amount
  const hasVat = vatAmount !== null && vatAmount !== undefined && vatAmount !== "" && Number(vatAmount) > 0
  fields.vat_separated = hasVat
    ? { status: "valid", value: String(vatAmount) }
    : { status: "missing", value: null, message: "ไม่พบจำนวน VAT ที่แยกออกจากราคาสินค้า" }

  // 10. Issue date
  const issuedAt = asString(extractedData.issuedAt)
  if (issuedAt) {
    const parsed = Date.parse(issuedAt)
    fields.issue_date = !isNaN(parsed)
      ? { status: "valid", value: issuedAt }
      : { status: "invalid", value: issuedAt, message: "รูปแบบวันที่ไม่ถูกต้อง" }
  } else {
    fields.issue_date = { status: "missing", value: null, message: "ไม่พบวันที่ออกใบกำกับภาษี" }
  }

  // 11. Buyer Tax ID -- only required for B2B, mark not_applicable if absent
  const buyerTaxId = asString(extractedData.buyer_tax_id)
  if (buyerTaxId) {
    fields.buyer_tax_id = TAX_ID_REGEX.test(buyerTaxId)
      ? { status: "valid", value: buyerTaxId }
      : { status: "invalid", value: buyerTaxId, message: "เลขประจำตัวผู้เสียภาษีผู้ซื้อต้องเป็น 13 หลัก" }
  } else {
    fields.buyer_tax_id = {
      status: "not_applicable",
      value: null,
      message: "ไม่จำเป็นสำหรับการซื้อทั่วไป (เฉพาะ B2B)",
    }
  }

  // Add warnings for common issues
  if (fields.seller_tax_id.status === "valid" && merchantTaxId === "0000000000000") {
    warnings.push("เลขประจำตัวผู้เสียภาษีเป็นศูนย์ทั้งหมด -- กรุณาตรวจสอบ")
    fields.seller_tax_id = {
      status: "invalid",
      value: merchantTaxId,
      message: "เลขประจำตัวผู้เสียภาษีไม่ถูกต้อง (เป็นศูนย์ทั้งหมด)",
    }
  }

  // Count missing required fields (fields 1-10, excluding buyer_tax_id which is optional)
  const requiredFieldKeys = [
    "tax_invoice_label",
    "seller_name",
    "seller_tax_id",
    "seller_address",
    "seller_branch",
    "buyer_info",
    "invoice_number",
    "items_and_values",
    "vat_separated",
    "issue_date",
  ]
  const missingCount = requiredFieldKeys.filter(
    (key) => fields[key]?.status === "missing" || fields[key]?.status === "invalid"
  ).length

  // buyer_info with not_applicable does NOT count as missing
  const adjustedMissing =
    fields.buyer_info?.status === "not_applicable" ? Math.max(0, missingCount - 0) : missingCount

  const isValidTaxInvoice = adjustedMissing === 0

  if (!isValidTaxInvoice && missingCount > 0) {
    warnings.push(`ขาดข้อมูลที่จำเป็น ${missingCount} รายการตามมาตรา 86/4`)
  }

  return {
    isValidTaxInvoice,
    fields,
    missingCount: adjustedMissing,
    warnings,
  }
}

/**
 * Correct Buddhist Era (B.E.) dates to Gregorian.
 * If the year component is > 2500, subtracts 543.
 *
 * Handles formats:
 *   "23/03/2569" -> "2026-03-23"
 *   "2569-03-23" -> "2026-03-23"
 *   "23 มี.ค. 2569" -> attempts parse, returns ISO date
 *
 * Returns the original string unchanged if no B.E. year is detected
 * or if parsing fails.
 */
export function correctBuddhistEraDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === "") return dateStr

  const trimmed = dateStr.trim()

  // Pattern 1: DD/MM/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, day, month, yearStr] = slashMatch
    const year = parseInt(yearStr, 10)
    const correctedYear = year > 2500 ? year - 543 : year
    return `${correctedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  // Pattern 2: YYYY-MM-DD (ISO-like)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    const [, yearStr, month, day] = isoMatch
    const year = parseInt(yearStr, 10)
    if (year > 2500) {
      const correctedYear = year - 543
      return `${correctedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }
    return trimmed
  }

  // Pattern 3: Thai short month names -- extract year and correct if B.E.
  const thaiMonthMatch = trimmed.match(/(\d{1,2})\s+\S+\.?\s+(\d{4})/)
  if (thaiMonthMatch) {
    const year = parseInt(thaiMonthMatch[2], 10)
    if (year > 2500) {
      const correctedYear = year - 543
      return trimmed.replace(String(year), String(correctedYear))
    }
  }

  // Pattern 4: Any 4-digit number > 2500 in the string (fallback)
  const yearInString = trimmed.match(/\b(\d{4})\b/)
  if (yearInString) {
    const year = parseInt(yearInString[1], 10)
    if (year > 2500) {
      const correctedYear = year - 543
      return trimmed.replace(String(year), String(correctedYear))
    }
  }

  return trimmed
}

/**
 * Safely coerce a value to string, returning empty string for null/undefined.
 */
function asString(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}
