import GlobalSettingsForm from "@/components/settings/global-settings-form"
import { BusinessProfileForm } from "@/components/settings/business-profile-form"
import { getCurrentUser } from "@/lib/auth"
import { getCategories } from "@/models/categories"
import { getCurrencies } from "@/models/currencies"
import { getSettings } from "@/models/settings"
import { getBusinessProfile } from "@/models/business-profile"

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const settings = await getSettings(user.id)
  const currencies = await getCurrencies(user.id)
  const categories = await getCategories(user.id)
  const businessProfile = await getBusinessProfile(user.id)

  return (
    <>
      <div className="w-full max-w-2xl space-y-8">
        <BusinessProfileForm businessProfile={businessProfile} />
        <div className="border-t pt-6">
          <GlobalSettingsForm settings={settings} currencies={currencies} categories={categories} />
        </div>
      </div>
    </>
  )
}
