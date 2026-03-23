"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { formatCurrency } from "@/lib/utils"
import type { ExpiringInvoice } from "@/models/stats"
import { formatThaiDate } from "@/services/thai-date"
import { AlertTriangle, ChevronDown } from "lucide-react"
import { useState } from "react"

export function VATExpiryWarnings({ invoices }: { invoices: ExpiringInvoice[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mt-4">
      <Alert className="border-amber-200/50 bg-amber-50/50">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-700">
          {invoices.length} {"\u0e43\u0e1a\u0e01\u0e33\u0e01\u0e31\u0e1a\u0e20\u0e32\u0e29\u0e35\u0e43\u0e01\u0e25\u0e49\u0e2b\u0e21\u0e14\u0e2d\u0e32\u0e22\u0e38 (6 \u0e40\u0e14\u0e37\u0e2d\u0e19)"}
        </AlertTitle>
        <AlertDescription>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 mt-1">
              {isOpen
                ? "\u0e0b\u0e48\u0e2d\u0e19\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23"
                : "\u0e14\u0e39\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23"}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between text-sm border-b border-amber-100 pb-1"
                  >
                    <div>
                      <span className="font-medium">
                        {invoice.merchant || "\u0e44\u0e21\u0e48\u0e23\u0e30\u0e1a\u0e38\u0e0a\u0e37\u0e48\u0e2d\u0e1c\u0e39\u0e49\u0e02\u0e32\u0e22"}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {formatThaiDate(invoice.issuedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-600 font-medium">
                        {formatCurrency(invoice.vatAmount, "THB")}
                      </span>
                      <span className="text-xs text-amber-500">
                        {"\u0e40\u0e2b\u0e25\u0e37\u0e2d"} {invoice.daysRemaining} {"\u0e27\u0e31\u0e19"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </AlertDescription>
      </Alert>
    </div>
  )
}
