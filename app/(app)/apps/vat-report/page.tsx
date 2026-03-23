import { getCurrentUser } from "@/lib/auth"
import { getBusinessProfile } from "@/models/business-profile"
import { getVATSummary } from "@/models/stats"
import { manifest } from "./manifest"
import { VATReportClient } from "./components/vat-report-client"

export const dynamic = "force-dynamic"

export default async function VATReportPage() {
  const user = await getCurrentUser()
  const businessProfile = await getBusinessProfile(user.id)

  // Get current month summary for initial display
  const now = new Date()
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const dateFrom = new Date(prevYear, prevMonth - 1, 1).toISOString()
  const dateTo = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999).toISOString()

  const vatSummary = await getVATSummary(user.id, { dateFrom, dateTo })

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">
            {manifest.name}
          </span>
        </h2>
      </header>

      <VATReportClient
        defaultMonth={prevMonth}
        defaultYear={prevYear}
        initialSummary={vatSummary}
        businessProfile={businessProfile}
      />
    </div>
  )
}
