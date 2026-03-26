"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, X } from "lucide-react"
import { formatThaiDate } from "@/services/thai-date"
import {
  QUOTATION_STATUSES,
  INVOICE_STATUSES,
  RECEIPT_STATUSES,
  DELIVERY_NOTE_STATUSES,
  ALL_DOCUMENT_STATUSES,
} from "@/services/document-workflow"

export type DocumentFilterState = {
  documentType: string
  status: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
}

const DOCUMENT_TYPES = [
  { value: "all", label: "ทั้งหมด" },
  { value: "QUOTATION", label: "ใบเสนอราคา" },
  { value: "INVOICE", label: "ใบแจ้งหนี้" },
  { value: "RECEIPT", label: "ใบเสร็จรับเงิน" },
  { value: "DELIVERY_NOTE", label: "ใบส่งของ" },
]

const STATUS_MAP_BY_TYPE: Record<string, Record<string, { label: string; color: string }>> = {
  QUOTATION: QUOTATION_STATUSES,
  INVOICE: INVOICE_STATUSES,
  RECEIPT: RECEIPT_STATUSES,
  DELIVERY_NOTE: DELIVERY_NOTE_STATUSES,
}

function getStatusesForType(docType: string) {
  if (docType === "all") {
    return ALL_DOCUMENT_STATUSES
  }
  return STATUS_MAP_BY_TYPE[docType] ?? ALL_DOCUMENT_STATUSES
}

export function DocumentFilters({
  filters,
  onFilterChange,
}: {
  filters: DocumentFilterState
  onFilterChange: (filters: DocumentFilterState) => void
}) {
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)

  const statuses = getStatusesForType(filters.documentType)

  function handleTypeChange(value: string) {
    onFilterChange({
      ...filters,
      documentType: value,
      status: "all",
    })
  }

  function handleStatusChange(value: string) {
    onFilterChange({ ...filters, status: value })
  }

  function handleDateFromChange(date: Date | undefined) {
    onFilterChange({ ...filters, dateFrom: date })
    setDateFromOpen(false)
  }

  function handleDateToChange(date: Date | undefined) {
    onFilterChange({ ...filters, dateTo: date })
    setDateToOpen(false)
  }

  function handleClearDates() {
    onFilterChange({ ...filters, dateFrom: undefined, dateTo: undefined })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <Select value={filters.documentType} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="ประเภทเอกสาร" />
        </SelectTrigger>
        <SelectContent>
          {DOCUMENT_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="สถานะ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทั้งหมด</SelectItem>
          {Object.entries(statuses).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[140px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateFrom
              ? formatThaiDate(filters.dateFrom)
              : "ตั้งแต่วันที่"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateFrom}
            onSelect={handleDateFromChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[140px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateTo ? formatThaiDate(filters.dateTo) : "ถึงวันที่"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateTo}
            onSelect={handleDateToChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {(filters.dateFrom || filters.dateTo) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearDates}
          className="h-9 w-9"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
