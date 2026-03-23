"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { getBusinessProfile, type BusinessProfile } from "@/models/business-profile"
import { getCITEstimate, type CITEstimate } from "@/models/stats"

// --- Types ---

export type CITReportData = {
  period: { type: "annual" | "half-year"; year: number }
  businessProfile: BusinessProfile
  estimate: CITEstimate
}

// --- Generate CIT Report ---

export async function generateCITReportAction(
  prevState: ActionState<CITReportData> | null,
  formData: FormData
): Promise<ActionState<CITReportData>> {
  try {
    const user = await getCurrentUser()

    const periodType = formData.get("periodType") as string
    const year = parseInt(formData.get("year") as string, 10)

    if (!periodType || !["annual", "half-year"].includes(periodType)) {
      return { success: false, error: "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17\u0e23\u0e32\u0e22\u0e07\u0e32\u0e19" }
    }

    if (isNaN(year) || year < 2020 || year > 2100) {
      return { success: false, error: "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e1b\u0e35\u0e17\u0e35\u0e48\u0e16\u0e39\u0e01\u0e15\u0e49\u0e2d\u0e07" }
    }

    const validPeriodType = periodType as "annual" | "half-year"
    const businessProfile = await getBusinessProfile(user.id)
    const estimate = await getCITEstimate(user.id, year, validPeriodType)

    return {
      success: true,
      data: {
        period: { type: validPeriodType, year },
        businessProfile,
        estimate,
      },
    }
  } catch (error) {
    console.error("Failed to generate CIT report:", error)
    return { success: false, error: "\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e23\u0e32\u0e22\u0e07\u0e32\u0e19\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 -- \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07" }
  }
}
