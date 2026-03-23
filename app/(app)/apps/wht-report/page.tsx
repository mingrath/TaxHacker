import { getCurrentUser } from "@/lib/auth"
import { getBusinessProfile } from "@/models/business-profile"
import { manifest } from "./manifest"
import { WHTReportClient } from "./components/wht-report-client"

export const dynamic = "force-dynamic"

export default async function WHTReportPage() {
  const user = await getCurrentUser()
  const businessProfile = await getBusinessProfile(user.id)

  // Default to previous month (WHT is filed for the prior month)
  const now = new Date()
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">
            {manifest.name}
          </span>
        </h2>
      </header>

      <WHTReportClient
        defaultMonth={prevMonth}
        defaultYear={prevYear}
        businessProfile={businessProfile}
      />
    </div>
  )
}
