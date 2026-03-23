"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Contact } from "@/prisma/client"
import { searchContactsAction } from "./contact-actions"
import { ChevronsUpDown, Plus, Search } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

type ContactAutocompleteProps = {
  onSelect: (contact: Contact) => void
  onCreateNew: () => void
  selectedContact?: Contact | null
}

export function ContactAutocomplete({
  onSelect,
  onCreateNew,
  selectedContact,
}: ContactAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Contact[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length === 0) {
      setResults([])
      return
    }
    setIsSearching(true)
    try {
      const contacts = await searchContactsAction(searchQuery.trim())
      setResults(contacts)
    } catch (error) {
      console.error("Failed to search contacts:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      handleSearch(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, handleSearch])

  const handleSelect = (contact: Contact) => {
    onSelect(contact)
    setOpen(false)
    setQuery("")
  }

  const displayLabel = selectedContact
    ? `${selectedContact.name} (${selectedContact.taxId})`
    : "เลือกผู้ซื้อ / ผู้ติดต่อ"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="h-4 w-4 mr-2 opacity-50 shrink-0" />
          <Input
            placeholder="ค้นหาชื่อหรือเลขประจำตัวผู้เสียภาษี..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 h-8 p-0"
          />
        </div>

        <div className="max-h-[200px] overflow-y-auto">
          {isSearching && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              กำลังค้นหา...
            </div>
          )}

          {!isSearching && query.trim().length > 0 && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              ไม่พบผู้ติดต่อ
            </div>
          )}

          {results.map((contact) => (
            <button
              key={contact.id}
              type="button"
              className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-accent cursor-pointer"
              onClick={() => handleSelect(contact)}
            >
              <span className="text-sm font-medium">{contact.name}</span>
              <span className="text-xs text-muted-foreground">
                Tax ID: {contact.taxId}{" "}
                {contact.branch === "00000"
                  ? "(สำนักงานใหญ่)"
                  : `(สาขาที่ ${parseInt(contact.branch, 10)})`}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent cursor-pointer"
            onClick={() => {
              setOpen(false)
              onCreateNew()
            }}
          >
            <Plus className="h-4 w-4" />
            สร้างผู้ติดต่อใหม่
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
