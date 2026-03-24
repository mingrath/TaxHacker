import { getCurrentUser } from "@/lib/auth"
import { getBusinessProfile, isBusinessProfileComplete } from "@/models/business-profile"
import { manifest } from "./manifest"
import { CreditNoteForm } from "./components/credit-note-form"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function CreditNotePage() {
  const user = await getCurrentUser()
  const businessProfile = await getBusinessProfile(user.id)
  const isComplete = await isBusinessProfileComplete(user.id)

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">
            {manifest.name}
          </span>
        </h2>
      </header>

      {!isComplete ? (
        <div className="rounded-lg border bg-card p-6 text-center space-y-3">
          <p className="text-muted-foreground">
            {"\u0e01\u0e23\u0e38\u0e13\u0e32\u0e01\u0e23\u0e2d\u0e01\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08\u0e01\u0e48\u0e2d\u0e19\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e43\u0e1a\u0e25\u0e14\u0e2b\u0e19\u0e35\u0e49/\u0e43\u0e1a\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2b\u0e19\u0e35\u0e49"}
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {"\u0e44\u0e1b\u0e2b\u0e19\u0e49\u0e32\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08"}
          </Link>
        </div>
      ) : (
        <CreditNoteForm businessProfile={businessProfile} />
      )}
    </div>
  )
}
