import { z } from "zod"

export const businessProfileSchema = z.object({
  biz_company_name: z.string().min(2, "กรุณากรอกชื่อบริษัท"),
  biz_tax_id: z.string().regex(/^\d{13}$/, "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก"),
  biz_branch: z.string().min(1, "กรุณาเลือกสาขา"),
  biz_address: z.string().min(1, "กรุณากรอกที่อยู่"),
  biz_vat_registered: z.enum(["true", "false"]),
  biz_vat_reg_date: z.string().optional(),
  biz_fiscal_year_start: z.string().regex(/^(1[0-2]|[1-9])$/, "เดือนไม่ถูกต้อง"),
})

export type BusinessProfileFormData = z.infer<typeof businessProfileSchema>
