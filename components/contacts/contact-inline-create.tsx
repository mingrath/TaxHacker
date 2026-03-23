"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FormError } from "@/components/forms/error"
import type { Contact } from "@/prisma/client"
import { createContactAction } from "./contact-actions"
import { Loader2 } from "lucide-react"
import { startTransition, useActionState, useEffect } from "react"

type ContactInlineCreateProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (contact: Contact) => void
}

export function ContactInlineCreate({
  open,
  onOpenChange,
  onCreated,
}: ContactInlineCreateProps) {
  const [state, formAction, isPending] = useActionState(createContactAction, null)

  useEffect(() => {
    if (state?.success && state.data) {
      onCreated(state.data)
      onOpenChange(false)
    }
  }, [state, onCreated, onOpenChange])

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>สร้างผู้ติดต่อใหม่</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">ชื่อ</Label>
            <Input
              id="contact-name"
              name="name"
              placeholder="บริษัท ตัวอย่าง จำกัด"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-taxId">เลขประจำตัวผู้เสียภาษี (13 หลัก)</Label>
            <Input
              id="contact-taxId"
              name="taxId"
              placeholder="1234567890123"
              maxLength={13}
              pattern="\d{13}"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-branch">สาขา</Label>
            <Select name="branch" defaultValue="00000">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="00000">สำนักงานใหญ่</SelectItem>
                <SelectItem value="00001">สาขาที่ 1</SelectItem>
                <SelectItem value="00002">สาขาที่ 2</SelectItem>
                <SelectItem value="00003">สาขาที่ 3</SelectItem>
                <SelectItem value="00004">สาขาที่ 4</SelectItem>
                <SelectItem value="00005">สาขาที่ 5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-address">ที่อยู่</Label>
            <Textarea
              id="contact-address"
              name="address"
              placeholder="ที่อยู่สำนักงาน"
              className="h-20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-type">ประเภท</Label>
            <Select name="type" defaultValue="customer">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendor">ผู้ขาย (Vendor)</SelectItem>
                <SelectItem value="customer">ผู้ซื้อ (Customer)</SelectItem>
                <SelectItem value="both">ทั้งสอง (Both)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state?.error && <FormError>{state.error}</FormError>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  กำลังบันทึก...
                </>
              ) : (
                "สร้างผู้ติดต่อ"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
