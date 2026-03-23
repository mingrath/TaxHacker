"use client"

import { useNotification } from "@/app/(app)/context"
import { analyzeFileAction, deleteUnsortedFileAction, saveFileAsTransactionAction } from "@/app/(app)/unsorted/actions"
import { CurrencyConverterTool } from "@/components/agents/currency-converter"
import { ItemsDetectTool } from "@/components/agents/items-detect"
import ToolWindow from "@/components/agents/tool-window"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectProject } from "@/components/forms/select-project"
import { FormSelectType } from "@/components/forms/select-type"
import { FormInput, FormSelect, FormTextarea } from "@/components/forms/simple"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ValidationBadge, TaxInvoiceValidationSummary, FIELD_VALIDATION_MAP } from "@/components/unsorted/tax-invoice-validation"
import { extractVATFromTotal, formatSatangToDisplay } from "@/services/tax-calculator"
import type { ValidationResult } from "@/ai/validators/tax-invoice-validator"
import { Category, Currency, Field, File, Project } from "@/prisma/client"
import { format } from "date-fns"
import { ArrowDownToLine, Brain, Loader2, Trash2 } from "lucide-react"
import { startTransition, useActionState, useCallback, useMemo, useState } from "react"

const VAT_TYPE_OPTIONS = [
  { code: "input", name: "ภาษีซื้อ" },
  { code: "output", name: "ภาษีขาย" },
  { code: "none", name: "ไม่มี VAT" },
]

export default function AnalyzeForm({
  file,
  categories,
  projects,
  currencies,
  fields,
  settings,
}: {
  file: File
  categories: Category[]
  projects: Project[]
  currencies: Currency[]
  fields: Field[]
  settings: Record<string, string>
}) {
  const { showNotification } = useNotification()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeStep, setAnalyzeStep] = useState<string>("")
  const [analyzeError, setAnalyzeError] = useState<string>("")
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteUnsortedFileAction, null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [validation, setValidation] = useState<ValidationResult | null>(null)

  const fieldMap = useMemo(() => {
    return fields.reduce(
      (acc, field) => {
        acc[field.code] = field
        return acc
      },
      {} as Record<string, Field>
    )
  }, [fields])

  const extraFields = useMemo(() => fields.filter((field) => field.isExtra), [fields])
  const initialFormState = useMemo(() => {
    const baseState: Record<string, unknown> = {
      name: file.filename,
      merchant: "",
      description: "",
      type: settings.default_type,
      total: 0.0,
      currencyCode: settings.default_currency,
      convertedTotal: 0.0,
      convertedCurrencyCode: settings.default_currency,
      categoryCode: settings.default_category,
      projectCode: settings.default_project,
      issuedAt: "",
      note: "",
      text: "",
      items: [],
      // VAT fields
      vatType: "none",
      subtotal: 0.0,
      vatAmount: 0.0,
      merchantTaxId: "",
      merchantBranch: "00000",
      documentNumber: "",
    }

    // Add extra fields
    const extraFieldsState = extraFields.reduce(
      (acc, field) => {
        acc[field.code] = ""
        return acc
      },
      {} as Record<string, string>
    )

    // Load cached results if they exist
    const cachedResults = file.cachedParseResult
      ? Object.fromEntries(
          Object.entries(file.cachedParseResult as Record<string, string>).filter(
            ([_, value]) => value !== null && value !== undefined && value !== ""
          )
        )
      : {}

    return {
      ...baseState,
      ...extraFieldsState,
      ...cachedResults,
    }
  }, [file.filename, settings, extraFields, file.cachedParseResult])
  const [formData, setFormData] = useState(initialFormState)

  /** Auto-compute subtotal and vatAmount when total changes and vatType is not "none" */
  const handleTotalChange = useCallback((newTotal: number) => {
    setFormData((prev) => {
      const updated = { ...prev, total: newTotal }
      if (prev.vatType !== "none" && newTotal > 0) {
        // Total is in display units (baht), convert to satang for calculation
        const totalSatang = Math.round(newTotal * 100)
        const result = extractVATFromTotal(totalSatang)
        updated.subtotal = formatSatangToDisplay(result.subtotal)
        updated.vatAmount = formatSatangToDisplay(result.vatAmount)
      }
      return updated
    })
  }, [])

  /** Auto-compute when VAT type changes */
  const handleVatTypeChange = useCallback((newVatType: string) => {
    setFormData((prev) => {
      const updated = { ...prev, vatType: newVatType }
      const total = Number(prev.total) || 0
      if (newVatType !== "none" && total > 0) {
        const totalSatang = Math.round(total * 100)
        const result = extractVATFromTotal(totalSatang)
        updated.subtotal = formatSatangToDisplay(result.subtotal)
        updated.vatAmount = formatSatangToDisplay(result.vatAmount)
      } else if (newVatType === "none") {
        updated.subtotal = 0
        updated.vatAmount = 0
      }
      return updated
    })
  }, [])

  /** Look up validation status for a given form field code */
  const getFieldValidation = useCallback(
    (fieldCode: string) => {
      if (!validation) return null
      const validationKey = FIELD_VALIDATION_MAP[fieldCode]
      if (!validationKey) return null
      return validation.fields[validationKey] ?? null
    },
    [validation]
  )

  async function saveAsTransaction(formData: FormData) {
    setSaveError("")
    setIsSaving(true)
    startTransition(async () => {
      const result = await saveFileAsTransactionAction(null, formData)
      setIsSaving(false)

      if (result.success) {
        showNotification({ code: "global.banner", message: "บันทึกสำเร็จ", type: "success" })
        showNotification({ code: "sidebar.transactions", message: "new" })
        setTimeout(() => showNotification({ code: "sidebar.transactions", message: "" }), 3000)
      } else {
        setSaveError(result.error ? result.error : "เกิดข้อผิดพลาด...")
        showNotification({ code: "global.banner", message: "บันทึกไม่สำเร็จ", type: "failed" })
      }
    })
  }

  const startAnalyze = async () => {
    setIsAnalyzing(true)
    setAnalyzeError("")
    setValidation(null)
    try {
      setAnalyzeStep("กำลังวิเคราะห์...")
      const results = await analyzeFileAction(file, settings, fields, categories, projects)

      console.log("Analysis results:", results)

      if (!results.success) {
        setAnalyzeError(results.error ? results.error : "วิเคราะห์ไม่สำเร็จ -- ลองอัปโหลดภาพที่ชัดขึ้นหรือลองใหม่อีกครั้ง")
      } else {
        const output = results.data?.output || {}
        const nonEmptyFields = Object.fromEntries(
          Object.entries(output).filter(
            ([key, value]) => key !== "_validation" && value !== null && value !== undefined && value !== ""
          )
        )

        // Map AI-extracted fields to form state
        const mapped: Record<string, unknown> = { ...nonEmptyFields }

        // Map snake_case AI fields to camelCase form fields
        if (output.merchant_tax_id) mapped.merchantTaxId = output.merchant_tax_id
        if (output.merchant_branch) mapped.merchantBranch = output.merchant_branch
        if (output.document_number) mapped.documentNumber = output.document_number
        if (output.vat_amount) mapped.vatAmount = Number(output.vat_amount) || 0
        if (output.vat_type) mapped.vatType = output.vat_type

        // Auto-compute subtotal if we have total and vatAmount
        const total = Number(mapped.total || formData.total) || 0
        const vatAmountFromAI = Number(mapped.vatAmount) || 0
        if (total > 0 && vatAmountFromAI > 0) {
          // Both values from AI in display units
          mapped.subtotal = total - vatAmountFromAI
        } else if (total > 0 && mapped.vatType && mapped.vatType !== "none") {
          const totalSatang = Math.round(total * 100)
          const result = extractVATFromTotal(totalSatang)
          mapped.subtotal = formatSatangToDisplay(result.subtotal)
          mapped.vatAmount = formatSatangToDisplay(result.vatAmount)
        }

        setFormData((prev) => ({ ...prev, ...mapped }))

        // Set validation result
        const validationData = (output as Record<string, unknown>)._validation as ValidationResult | undefined
        if (validationData) {
          setValidation(validationData)
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      setAnalyzeError(error instanceof Error ? error.message : "วิเคราะห์ไม่สำเร็จ")
    } finally {
      setIsAnalyzing(false)
      setAnalyzeStep("")
    }
  }

  return (
    <>
      {file.isSplitted ? (
        <div className="flex justify-end">
          <Badge variant="outline">ไฟล์นี้ถูกแยกรายการแล้ว</Badge>
        </div>
      ) : (
        <Button className="w-full mb-6 py-6 text-lg" onClick={startAnalyze} disabled={isAnalyzing} data-analyze-button>
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              <span>{analyzeStep}</span>
            </>
          ) : (
            <>
              <Brain className="mr-1 h-4 w-4" />
              <span>วิเคราะห์</span>
            </>
          )}
        </Button>
      )}

      <div>{analyzeError && <FormError>{analyzeError}</FormError>}</div>

      <form className="space-y-4" action={saveAsTransaction}>
        <input type="hidden" name="fileId" value={file.id} />
        <FormInput
          title="ชื่อรายการ"
          name="name"
          value={formData.name as string}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required={fieldMap.name?.isRequired}
        />

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FormInput
              title="ผู้ขาย/ผู้ให้บริการ"
              name="merchant"
              value={formData.merchant as string}
              onChange={(e) => setFormData((prev) => ({ ...prev, merchant: e.target.value }))}
              hideIfEmpty={!fieldMap.merchant?.isVisibleInAnalysis}
              required={fieldMap.merchant?.isRequired}
            />
          </div>
          {getFieldValidation("merchant") && (
            <ValidationBadge {...getFieldValidation("merchant")!} />
          )}
        </div>

        <FormInput
          title="รายละเอียด"
          name="description"
          value={formData.description as string}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          hideIfEmpty={!fieldMap.description?.isVisibleInAnalysis}
          required={fieldMap.description?.isRequired}
        />

        <div className="flex flex-wrap gap-4">
          <FormInput
            title="จำนวนเงิน"
            name="total"
            type="number"
            step="0.01"
            value={(formData.total as number) || ""}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value || "0")
              if (!isNaN(newValue)) handleTotalChange(newValue)
            }}
            className="w-32"
            required={fieldMap.total?.isRequired}
          />

          <FormSelectCurrency
            title="สกุลเงิน"
            currencies={currencies}
            name="currencyCode"
            value={formData.currencyCode as string}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, currencyCode: value }))}
            hideIfEmpty={!fieldMap.currencyCode?.isVisibleInAnalysis}
            required={fieldMap.currencyCode?.isRequired}
          />

          <FormSelectType
            title="ประเภท"
            name="type"
            value={formData.type as string}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
            hideIfEmpty={!fieldMap.type?.isVisibleInAnalysis}
            required={fieldMap.type?.isRequired}
          />
        </div>

        {(formData.total as number) != 0 && formData.currencyCode && formData.currencyCode !== settings.default_currency && (
          <ToolWindow title={`Exchange rate on ${format(new Date((formData.issuedAt as string) || Date.now()), "LLLL dd, yyyy")}`}>
            <CurrencyConverterTool
              originalTotal={formData.total as number}
              originalCurrencyCode={formData.currencyCode as string}
              targetCurrencyCode={settings.default_currency}
              date={new Date((formData.issuedAt as string) || Date.now())}
              onChange={(value) => setFormData((prev) => ({ ...prev, convertedTotal: value }))}
            />
            <input type="hidden" name="convertedCurrencyCode" value={settings.default_currency} />
          </ToolWindow>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FormInput
              title="วันที่"
              type="date"
              name="issuedAt"
              value={formData.issuedAt as string}
              onChange={(e) => setFormData((prev) => ({ ...prev, issuedAt: e.target.value }))}
              hideIfEmpty={!fieldMap.issuedAt?.isVisibleInAnalysis}
              required={fieldMap.issuedAt?.isRequired}
            />
          </div>
          {getFieldValidation("issuedAt") && (
            <ValidationBadge {...getFieldValidation("issuedAt")!} />
          )}
        </div>

        <div className="flex flex-row gap-4">
          <FormSelectCategory
            title="หมวดหมู่"
            categories={categories}
            name="categoryCode"
            value={formData.categoryCode as string}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryCode: value }))}
            placeholder="เลือกหมวดหมู่"
            hideIfEmpty={!fieldMap.categoryCode?.isVisibleInAnalysis}
            required={fieldMap.categoryCode?.isRequired}
          />

          {projects.length > 0 && (
            <FormSelectProject
              title="โปรเจกต์"
              projects={projects}
              name="projectCode"
              value={formData.projectCode as string}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, projectCode: value }))}
              placeholder="เลือกโปรเจกต์"
              hideIfEmpty={!fieldMap.projectCode?.isVisibleInAnalysis}
              required={fieldMap.projectCode?.isRequired}
            />
          )}
        </div>

        <FormInput
          title="หมายเหตุ"
          name="note"
          value={formData.note as string}
          onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
          hideIfEmpty={!fieldMap.note?.isVisibleInAnalysis}
          required={fieldMap.note?.isRequired}
        />

        {/* ---- Tax Information Section (ข้อมูลภาษี) ---- */}
        <div className="space-y-4 border-t pt-4 mt-4">
          <h3 className="text-sm font-bold text-foreground">ข้อมูลภาษี</h3>

          {validation && <TaxInvoiceValidationSummary validation={validation} />}

          <FormSelect
            title="ประเภทภาษี"
            name="vatType"
            items={VAT_TYPE_OPTIONS}
            value={formData.vatType as string}
            onValueChange={handleVatTypeChange}
            placeholder="เลือกประเภทภาษี"
          />

          {formData.vatType !== "none" && (
            <>
              <div className="flex flex-wrap gap-4">
                <FormInput
                  title="ยอดก่อน VAT"
                  name="subtotal"
                  type="number"
                  step="0.01"
                  value={(formData.subtotal as number) || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value || "0")
                    if (!isNaN(val)) setFormData((prev) => ({ ...prev, subtotal: val }))
                  }}
                  className="w-40"
                />

                <FormInput
                  title="จำนวน VAT"
                  name="vatAmount"
                  type="number"
                  step="0.01"
                  value={(formData.vatAmount as number) || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value || "0")
                    if (!isNaN(val)) setFormData((prev) => ({ ...prev, vatAmount: val }))
                  }}
                  className="w-40"
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <FormInput
                    title="เลขประจำตัวผู้เสียภาษี (ผู้ขาย)"
                    name="merchantTaxId"
                    value={formData.merchantTaxId as string}
                    onChange={(e) => setFormData((prev) => ({ ...prev, merchantTaxId: e.target.value }))}
                    maxLength={13}
                    placeholder="0000000000000"
                  />
                </div>
                {getFieldValidation("merchant_tax_id") && (
                  <ValidationBadge {...getFieldValidation("merchant_tax_id")!} />
                )}
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <FormInput
                    title="สาขา"
                    name="merchantBranch"
                    value={formData.merchantBranch as string}
                    onChange={(e) => setFormData((prev) => ({ ...prev, merchantBranch: e.target.value }))}
                    placeholder="00000"
                  />
                </div>
                {getFieldValidation("merchant_branch") && (
                  <ValidationBadge {...getFieldValidation("merchant_branch")!} />
                )}
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <FormInput
                    title="เลขที่เอกสาร"
                    name="documentNumber"
                    value={formData.documentNumber as string}
                    onChange={(e) => setFormData((prev) => ({ ...prev, documentNumber: e.target.value }))}
                    placeholder="INV-XXXXXXXX"
                  />
                </div>
                {getFieldValidation("document_number") && (
                  <ValidationBadge {...getFieldValidation("document_number")!} />
                )}
              </div>
            </>
          )}
        </div>

        {extraFields.map((field) => (
          <FormInput
            key={field.code}
            type="text"
            title={field.name}
            name={field.code}
            value={formData[field.code as keyof typeof formData] as string}
            onChange={(e) => setFormData((prev) => ({ ...prev, [field.code]: e.target.value }))}
            hideIfEmpty={!field.isVisibleInAnalysis}
            required={field.isRequired}
          />
        ))}

        {formData.items && (formData.items as unknown[]).length > 0 && (
          <ToolWindow title="Detected items">
            <ItemsDetectTool file={file} data={formData} />
          </ToolWindow>
        )}

        <div className="hidden">
          <input type="text" name="items" value={JSON.stringify(formData.items)} readOnly />
          <FormTextarea
            title="ข้อความที่สกัดได้"
            name="text"
            value={formData.text as string}
            onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
            hideIfEmpty={!fieldMap.text?.isVisibleInAnalysis}
          />
        </div>

        <div className="flex justify-between gap-4 pt-6">
          <Button
            type="button"
            onClick={() => startTransition(() => deleteAction(file.id))}
            variant="destructive"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "กำลังลบ..." : "ลบ"}
          </Button>

          <Button type="submit" disabled={isSaving} data-save-button>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4" />
                บันทึกรายการ
              </>
            )}
          </Button>
        </div>

        <div>
          {deleteState?.error && <FormError>{deleteState.error}</FormError>}
          {saveError && <FormError>{saveError}</FormError>}
        </div>
      </form>
    </>
  )
}
