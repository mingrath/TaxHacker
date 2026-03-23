import { getCurrentUser } from "@/lib/auth"
import { getBusinessProfile } from "@/models/business-profile"
import { manifest } from "./manifest"
import { CITReportClient } from "./components/cit-report-client"

export const dynamic = "force-dynamic"

export default async function CITReportPage() {
  const user = await getCurrentUser()
  const businessProfile = await getBusinessProfile(user.id)

  const currentYear = new Date().getFullYear()

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">
            {manifest.name}
          </span>
        </h2>
      </header>

      <CITReportClient
        defaultYear={currentYear}
        businessProfile={businessProfile}
      />
    </div>
  )
}
