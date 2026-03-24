"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormError } from "@/components/forms/error"
import { formatCurrency } from "@/lib/utils"
import { extractVATFromTotal } from "@/services/tax-calculator"
import type { BusinessProfile } from "@/models/business-profile"
import { createCreditNoteAction, type CreditNoteData } from "../actions"
import { NotePreview } from "./note-preview"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { startTransition, useActionState, useCallback, useEffect, useMemo, useState } from "react"

type LineItem = {
  description: string
  originalAmount: string // in baht, user-facing
  correctedAmount: string // in baht, user-facing
}

const EMPTY_ITEM: LineItem = { description: "", originalAmount: "", correctedAmount: "" }

export function CreditNoteForm({
  businessProfile,
}: {
  businessProfile: BusinessProfile
}) {
  const [noteType, setNoteType] = useState<"credit" | "debit">("credit")
  const [originalInvoiceKey, setOriginalInvoiceKey] = useState("")
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().split("T")[0])
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [noteData, setNoteData] = useState<CreditNoteData | null>(null)

  const [state, formAction, isPending] = useActionState(createCreditNoteAction, null)

  // Compute totals for display
  const { originalTotal, correctedTotal, difference, vatOnDifference } = useMemo(() => {
    const origTotal = items.reduce((sum, item) => {
      return sum + Math.round((parseFloat(item.originalAmount) || 0) * 100)
    }, 0)
    const corrTotal = items.reduce((sum, item) => {
      return sum + Math.round((parseFloat(item.correctedAmount) || 0) * 100)
    }, 0)
    const diff = corrTotal - origTotal
    const absDiff = Math.abs(diff)
    const vatResult = extractVATFromTotal(absDiff)
    return {
      originalTotal: origTotal,
      correctedTotal: corrTotal,
      difference: diff,
      vatOnDifference: vatResult.vatAmount,
    }
  }, [items])

  // When creation completes, open preview
  useEffect(() => {
    if (state?.success && state.data) {
      setNoteData(state.data)
      setPreviewOpen(true)
    }
  }, [state])

  const handleAddItem = useCallback(() => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }])
  }, [])

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const handleItemChange = useCallback(
    (index: number, field: keyof LineItem, value: string) => {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
      )
    },
    []
  )

  const handleSubmit = (formData: FormData) => {
    formData.set("originalInvoiceKey", originalInvoiceKey)
    formData.set("noteType", noteType)
    formData.set("issuedAt", issuedAt)
    formData.set("reason", reason)
    formData.set("note", note)

    // Append dynamic line items
    for (const item of items) {
      formData.append("item_description", item.description)
      formData.append("item_originalAmount", item.originalAmount)
      formData.append("item_correctedAmount", item.correctedAmount)
    }

    startTransition(() => {
      formAction(formData)
    })
  }

  const handleCreateNew = useCallback(() => {
    setOriginalInvoiceKey("")
    setItems([{ ...EMPTY_ITEM }])
    setIssuedAt(new Date().toISOString().split("T")[0])
    setReason("")
    setNote("")
    setNoteData(null)
    setPreviewOpen(false)
  }, [])

  const noteTypeLabel = noteType === "credit" ? "\u0e43\u0e1a\u0e25\u0e14\u0e2b\u0e19\u0e35\u0e49" : "\u0e43\u0e1a\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2b\u0e19\u0e35\u0e49"

  return (
    <>
      <form action={handleSubmit} className="space-y-6">
        {/* Note Type + Invoice Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{"\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e2b\u0e25\u0e31\u0e01"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{"\u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17\u0e40\u0e2d\u0e01\u0e2a\u0e32\u0e23"}</Label>
                <Select value={noteType} onValueChange={(v) => setNoteType(v as "credit" | "debit")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">{"\u0e43\u0e1a\u0e25\u0e14\u0e2b\u0e19\u0e35\u0e49 (Credit Note)"}</SelectItem>
                    <SelectItem value="debit">{"\u0e43\u0e1a\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2b\u0e19\u0e35\u0e49 (Debit Note)"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="originalInvoiceKey">{"\u0e40\u0e25\u0e02\u0e17\u0e35\u0e48\u0e43\u0e1a\u0e01\u0e33\u0e01\u0e31\u0e1a\u0e20\u0e32\u0e29\u0e35\u0e15\u0e49\u0e19\u0e09\u0e1a\u0e31\u0e1a"}</Label>
                <Input
                  id="originalInvoiceKey"
                  placeholder="INV-2569-0001"
                  value={originalInvoiceKey}
                  onChange={(e) => setOriginalInvoiceKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {"\u0e01\u0e23\u0e2d\u0e01\u0e40\u0e25\u0e02\u0e17\u0e35\u0e48\u0e43\u0e1a\u0e01\u0e33\u0e01\u0e31\u0e1a\u0e20\u0e32\u0e29\u0e35\u0e15\u0e49\u0e19\u0e09\u0e1a\u0e31\u0e1a\u0e17\u0e35\u0e48\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e41\u0e01\u0e49\u0e44\u0e02"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuedAt">{"\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e2d\u0e2d\u0e01"}</Label>
                <Input
                  id="issuedAt"
                  type="date"
                  value={issuedAt}
                  onChange={(e) => setIssuedAt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">{"\u0e40\u0e2b\u0e15\u0e38\u0e1c\u0e25\u0e01\u0e32\u0e23\u0e2d\u0e2d\u0e01"}</Label>
                <Input
                  id="reason"
                  placeholder={noteType === "credit" ? "\u0e40\u0e0a\u0e48\u0e19 \u0e04\u0e33\u0e19\u0e27\u0e13\u0e23\u0e32\u0e04\u0e32\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14, \u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e0a\u0e33\u0e23\u0e38\u0e14" : "\u0e40\u0e0a\u0e48\u0e19 \u0e04\u0e33\u0e19\u0e27\u0e13\u0e23\u0e32\u0e04\u0e32\u0e15\u0e48\u0e33\u0e01\u0e27\u0e48\u0e32\u0e04\u0e27\u0e32\u0e21\u0e40\u0e1b\u0e47\u0e19\u0e08\u0e23\u0e34\u0e07"}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{"\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e17\u0e35\u0e48\u0e41\u0e01\u0e49\u0e44\u0e02"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Table Header */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_120px_120px_80px_40px] gap-2 text-sm font-medium text-muted-foreground px-1">
              <span>{"\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14"}</span>
              <span className="text-right">{"\u0e22\u0e2d\u0e14\u0e40\u0e14\u0e34\u0e21 (\u0e1a\u0e32\u0e17)"}</span>
              <span className="text-right">{"\u0e22\u0e2d\u0e14\u0e41\u0e01\u0e49\u0e44\u0e02 (\u0e1a\u0e32\u0e17)"}</span>
              <span className="text-right">{"\u0e1c\u0e25\u0e15\u0e48\u0e32\u0e07"}</span>
              <span />
            </div>

            {items.map((item, index) => {
              const orig = Math.round((parseFloat(item.originalAmount) || 0) * 100)
              const corr = Math.round((parseFloat(item.correctedAmount) || 0) * 100)
              const diff = corr - orig
              return (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_80px_40px] gap-2 items-start"
                >
                  <Input
                    placeholder={"\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32 / \u0e1a\u0e23\u0e34\u0e01\u0e32\u0e23"}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={"\u0e22\u0e2d\u0e14\u0e40\u0e14\u0e34\u0e21"}
                    value={item.originalAmount}
                    onChange={(e) => handleItemChange(index, "originalAmount", e.target.value)}
                    className="text-right"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={"\u0e22\u0e2d\u0e14\u0e41\u0e01\u0e49\u0e44\u0e02"}
                    value={item.correctedAmount}
                    onChange={(e) => handleItemChange(index, "correctedAmount", e.target.value)}
                    className="text-right"
                  />
                  <div className="flex items-center justify-end h-10 text-sm tabular-nums">
                    <span className={diff < 0 ? "text-red-600" : diff > 0 ? "text-green-600" : ""}>
                      {diff !== 0 ? formatCurrency(diff, "THB") : "-"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length <= 1}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              )
            })}

            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-1" />
              {"\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23"}
            </Button>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{"\u0e22\u0e2d\u0e14\u0e40\u0e14\u0e34\u0e21\u0e23\u0e27\u0e21"}</span>
                <span className="tabular-nums">{formatCurrency(originalTotal, "THB")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{"\u0e22\u0e2d\u0e14\u0e41\u0e01\u0e49\u0e44\u0e02\u0e23\u0e27\u0e21"}</span>
                <span className="tabular-nums">{formatCurrency(correctedTotal, "THB")}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>{"\u0e1c\u0e25\u0e15\u0e48\u0e32\u0e07"}</span>
                <span className={`tabular-nums ${difference < 0 ? "text-red-600" : difference > 0 ? "text-green-600" : ""}`}>
                  {formatCurrency(difference, "THB")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT 7% {"\u0e1a\u0e19\u0e1c\u0e25\u0e15\u0e48\u0e32\u0e07"}</span>
                <span className="tabular-nums">{formatCurrency(vatOnDifference, "THB")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{"\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e40\u0e15\u0e34\u0e21"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="note">{"\u0e2b\u0e21\u0e32\u0e22\u0e40\u0e2b\u0e15\u0e38 (\u0e44\u0e21\u0e48\u0e1a\u0e31\u0e07\u0e04\u0e31\u0e1a)"}</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={"\u0e2b\u0e21\u0e32\u0e22\u0e40\u0e2b\u0e15\u0e38\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e40\u0e15\u0e34\u0e21"}
                className="h-20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Seller Info (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{"\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e1c\u0e39\u0e49\u0e02\u0e32\u0e22 (\u0e08\u0e32\u0e01\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08)"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
              <p>
                <span className="font-medium">{"\u0e0a\u0e37\u0e48\u0e2d"}:</span> {businessProfile.companyName}
              </p>
              <p>
                <span className="font-medium">Tax ID:</span> {businessProfile.taxId}
              </p>
              <p>
                <span className="font-medium">{"\u0e2a\u0e32\u0e02\u0e32"}:</span>{" "}
                {businessProfile.branch === "00000"
                  ? "\u0e2a\u0e33\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19\u0e43\u0e2b\u0e0d\u0e48"
                  : `\u0e2a\u0e32\u0e02\u0e32\u0e17\u0e35\u0e48 ${parseInt(businessProfile.branch, 10)}`}
              </p>
              <p>
                <span className="font-medium">{"\u0e17\u0e35\u0e48\u0e2d\u0e22\u0e39\u0e48"}:</span> {businessProfile.address}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {state?.error && <FormError>{state.error}</FormError>}

        {/* Submit */}
        <Button type="submit" size="lg" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {`\u0e01\u0e33\u0e25\u0e31\u0e07\u0e2a\u0e23\u0e49\u0e32\u0e07${noteTypeLabel}...`}
            </>
          ) : (
            `\u0e2a\u0e23\u0e49\u0e32\u0e07${noteTypeLabel}`
          )}
        </Button>
      </form>

      {/* Preview Dialog */}
      {noteData && (
        <NotePreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          noteData={noteData}
          onCreateNew={handleCreateNew}
        />
      )}
    </>
  )
}
