import { getCurrentUser } from "@/lib/auth"
import {
  getBusinessProfile,
  isBusinessProfileComplete,
} from "@/models/business-profile"
import { getContactsByUserId } from "@/models/contacts"
import { listDocuments } from "@/models/documents"
import { InvoiceForm } from "./components/invoice-form"
import { InvoiceList } from "./components/invoice-list"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function InvoicePage() {
  const user = await getCurrentUser()
  const isComplete = await isBusinessProfileComplete(user.id)

  if (!isComplete) {
    return (
      <div>
        <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            {"\u0e43\u0e1a\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49"}
          </h2>
        </header>

        <div className="rounded-lg border bg-card p-6 text-center space-y-3">
          <p className="text-muted-foreground">
            {"\u0e01\u0e23\u0e38\u0e13\u0e32\u0e01\u0e23\u0e2d\u0e01\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08\u0e01\u0e48\u0e2d\u0e19\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e43\u0e1a\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49"}
          </p>
          <p className="text-sm text-muted-foreground">
            {"\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e1a\u0e23\u0e34\u0e29\u0e31\u0e17"} Tax ID {"\u0e41\u0e25\u0e30\u0e17\u0e35\u0e48\u0e2d\u0e22\u0e39\u0e48\u0e08\u0e33\u0e40\u0e1b\u0e47\u0e19\u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a\u0e43\u0e1a\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49"} ({"\u0e1c\u0e39\u0e49\u0e02\u0e32\u0e22"})
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {"\u0e44\u0e1b\u0e2b\u0e19\u0e49\u0e32\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08"}
          </Link>
        </div>
      </div>
    )
  }

  const [contacts, profile, invoices] = await Promise.all([
    getContactsByUserId(user.id),
    getBusinessProfile(user.id),
    listDocuments(user.id, { documentType: "INVOICE" }),
  ])

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">
          {"\u0e43\u0e1a\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49"}
        </h2>
      </header>

      {invoices.length > 0 && <InvoiceList documents={invoices} />}

      <InvoiceForm
        contacts={contacts}
        userId={user.id}
        profile={profile}
      />
    </div>
  )
}
