import { prisma } from "@/lib/db"
import { calcTotalPerCurrency } from "@/lib/stats"
import { Prisma } from "@/prisma/client"
import { differenceInDays, subMonths } from "date-fns"
import { cache } from "react"
import { TransactionFilters } from "./transactions"

export type DashboardStats = {
  totalIncomePerCurrency: Record<string, number>
  totalExpensesPerCurrency: Record<string, number>
  profitPerCurrency: Record<string, number>
  invoicesProcessed: number
}

export const getDashboardStats = cache(
  async (userId: string, filters: TransactionFilters = {}): Promise<DashboardStats> => {
    const where: Prisma.TransactionWhereInput = {}

    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }

    const transactions = await prisma.transaction.findMany({ where: { ...where, userId } })
    const totalIncomePerCurrency = calcTotalPerCurrency(transactions.filter((t) => t.type === "income"))
    const totalExpensesPerCurrency = calcTotalPerCurrency(transactions.filter((t) => t.type === "expense"))
    const profitPerCurrency = Object.fromEntries(
      Object.keys(totalIncomePerCurrency).map((currency) => [
        currency,
        totalIncomePerCurrency[currency] - totalExpensesPerCurrency[currency],
      ])
    )
    const invoicesProcessed = transactions.length

    return {
      totalIncomePerCurrency,
      totalExpensesPerCurrency,
      profitPerCurrency,
      invoicesProcessed,
    }
  }
)

export type ProjectStats = {
  totalIncomePerCurrency: Record<string, number>
  totalExpensesPerCurrency: Record<string, number>
  profitPerCurrency: Record<string, number>
  invoicesProcessed: number
}

export const getProjectStats = cache(async (userId: string, projectId: string, filters: TransactionFilters = {}) => {
  const where: Prisma.TransactionWhereInput = {
    projectCode: projectId,
  }

  if (filters.dateFrom || filters.dateTo) {
    where.issuedAt = {
      gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
    }
  }

  const transactions = await prisma.transaction.findMany({ where: { ...where, userId } })
  const totalIncomePerCurrency = calcTotalPerCurrency(transactions.filter((t) => t.type === "income"))
  const totalExpensesPerCurrency = calcTotalPerCurrency(transactions.filter((t) => t.type === "expense"))
  const profitPerCurrency = Object.fromEntries(
    Object.keys(totalIncomePerCurrency).map((currency) => [
      currency,
      totalIncomePerCurrency[currency] - totalExpensesPerCurrency[currency],
    ])
  )

  const invoicesProcessed = transactions.length
  return {
    totalIncomePerCurrency,
    totalExpensesPerCurrency,
    profitPerCurrency,
    invoicesProcessed,
  }
})

export type TimeSeriesData = {
  period: string
  income: number
  expenses: number
  date: Date
}

export type CategoryBreakdown = {
  code: string
  name: string
  color: string
  income: number
  expenses: number
  transactionCount: number
}

export type DetailedTimeSeriesData = {
  period: string
  income: number
  expenses: number
  date: Date
  categories: CategoryBreakdown[]
  totalTransactions: number
}

export const getTimeSeriesStats = cache(
  async (
    userId: string,
    filters: TransactionFilters = {},
    defaultCurrency: string = "EUR"
  ): Promise<TimeSeriesData[]> => {
    const where: Prisma.TransactionWhereInput = { userId }

    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }

    if (filters.categoryCode) {
      where.categoryCode = filters.categoryCode
    }

    if (filters.projectCode) {
      where.projectCode = filters.projectCode
    }

    if (filters.type) {
      where.type = filters.type
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { issuedAt: "asc" },
    })

    if (transactions.length === 0) {
      return []
    }

    // Determine if we should group by day or month
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(transactions[0].issuedAt!)
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date(transactions[transactions.length - 1].issuedAt!)
    const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24))
    const groupByDay = daysDiff <= 50

    // Group transactions by time period
    const grouped = transactions.reduce(
      (acc, transaction) => {
        if (!transaction.issuedAt) return acc

        const date = new Date(transaction.issuedAt)
        const period = groupByDay
          ? date.toISOString().split("T")[0] // YYYY-MM-DD
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` // YYYY-MM

        if (!acc[period]) {
          acc[period] = { period, income: 0, expenses: 0, date }
        }

        // Get amount in default currency
        const amount =
          transaction.convertedCurrencyCode?.toUpperCase() === defaultCurrency.toUpperCase()
            ? transaction.convertedTotal || 0
            : transaction.currencyCode?.toUpperCase() === defaultCurrency.toUpperCase()
              ? transaction.total || 0
              : 0 // Skip transactions not in default currency for simplicity

        if (transaction.type === "income") {
          acc[period].income += amount
        } else if (transaction.type === "expense") {
          acc[period].expenses += amount
        }

        return acc
      },
      {} as Record<string, TimeSeriesData>
    )

    return Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime())
  }
)

export const getDetailedTimeSeriesStats = cache(
  async (
    userId: string,
    filters: TransactionFilters = {},
    defaultCurrency: string = "EUR"
  ): Promise<DetailedTimeSeriesData[]> => {
    const where: Prisma.TransactionWhereInput = { userId }

    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }

    if (filters.categoryCode) {
      where.categoryCode = filters.categoryCode
    }

    if (filters.projectCode) {
      where.projectCode = filters.projectCode
    }

    if (filters.type) {
      where.type = filters.type
    }

    const [transactions, categories] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { issuedAt: "asc" },
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
    ])

    if (transactions.length === 0) {
      return []
    }

    // Determine if we should group by day or month
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(transactions[0].issuedAt!)
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date(transactions[transactions.length - 1].issuedAt!)
    const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24))
    const groupByDay = daysDiff <= 50

    // Create category lookup
    const categoryLookup = new Map(categories.map((cat) => [cat.code, cat]))

    // Group transactions by time period
    const grouped = transactions.reduce(
      (acc, transaction) => {
        if (!transaction.issuedAt) return acc

        const date = new Date(transaction.issuedAt)
        const period = groupByDay
          ? date.toISOString().split("T")[0] // YYYY-MM-DD
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` // YYYY-MM

        if (!acc[period]) {
          acc[period] = {
            period,
            income: 0,
            expenses: 0,
            date,
            categories: new Map<string, CategoryBreakdown>(),
            totalTransactions: 0,
          }
        }

        // Get amount in default currency
        const amount =
          transaction.convertedCurrencyCode?.toUpperCase() === defaultCurrency.toUpperCase()
            ? transaction.convertedTotal || 0
            : transaction.currencyCode?.toUpperCase() === defaultCurrency.toUpperCase()
              ? transaction.total || 0
              : 0 // Skip transactions not in default currency for simplicity

        const categoryCode = transaction.categoryCode || "other"
        const category = categoryLookup.get(categoryCode) || {
          code: "other",
          name: "Other",
          color: "#6b7280",
        }

        // Initialize category if not exists
        if (!acc[period].categories.has(categoryCode)) {
          acc[period].categories.set(categoryCode, {
            code: category.code,
            name: category.name,
            color: category.color || "#6b7280",
            income: 0,
            expenses: 0,
            transactionCount: 0,
          })
        }

        const categoryData = acc[period].categories.get(categoryCode)!
        categoryData.transactionCount++
        acc[period].totalTransactions++

        if (transaction.type === "income") {
          acc[period].income += amount
          categoryData.income += amount
        } else if (transaction.type === "expense") {
          acc[period].expenses += amount
          categoryData.expenses += amount
        }

        return acc
      },
      {} as Record<
        string,
        {
          period: string
          income: number
          expenses: number
          date: Date
          categories: Map<string, CategoryBreakdown>
          totalTransactions: number
        }
      >
    )

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        categories: Array.from(item.categories.values()).filter((cat) => cat.income > 0 || cat.expenses > 0),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }
)

// --- VAT Stats ---

export type VATSummary = {
  outputVAT: number // total output VAT in satang for period
  inputVAT: number // total input VAT in satang for period
  netVAT: number // outputVAT - inputVAT (positive = payable, negative = credit)
  outputCount: number // number of output VAT transactions
  inputCount: number // number of input VAT transactions
}

export const getVATSummary = cache(
  async (userId: string, filters: TransactionFilters = {}): Promise<VATSummary> => {
    const dateFilter: Prisma.TransactionWhereInput = {}
    if (filters.dateFrom || filters.dateTo) {
      dateFilter.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }

    const [outputResult, inputResult] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, vatType: "output", ...dateFilter },
        _sum: { vatAmount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { userId, vatType: "input", ...dateFilter },
        _sum: { vatAmount: true },
        _count: true,
      }),
    ])

    const outputVAT = outputResult._sum.vatAmount || 0
    const inputVAT = inputResult._sum.vatAmount || 0

    return {
      outputVAT,
      inputVAT,
      netVAT: outputVAT - inputVAT,
      outputCount: outputResult._count,
      inputCount: inputResult._count,
    }
  }
)

export type ExpiringInvoice = {
  id: string
  merchant: string | null
  issuedAt: Date
  vatAmount: number
  daysRemaining: number
}

export const getExpiringInvoices = cache(
  async (userId: string): Promise<ExpiringInvoice[]> => {
    const now = new Date()
    const sixMonthsAgo = subMonths(now, 6)
    const fiveMonthsAgo = subMonths(now, 5)

    const expiring = await prisma.transaction.findMany({
      where: {
        userId,
        vatType: "input",
        issuedAt: {
          gte: sixMonthsAgo,
          lte: fiveMonthsAgo,
        },
      },
      select: { id: true, merchant: true, issuedAt: true, vatAmount: true },
      orderBy: { issuedAt: "asc" },
    })

    return expiring
      .filter((t): t is typeof t & { issuedAt: Date } => t.issuedAt !== null)
      .map((t) => {
        const expiryDate = subMonths(t.issuedAt, -6) // 6 months after issued
        const daysRemaining = differenceInDays(expiryDate, now)
        return {
          id: t.id,
          merchant: t.merchant,
          issuedAt: t.issuedAt,
          vatAmount: t.vatAmount || 0,
          daysRemaining: Math.max(0, daysRemaining),
        }
      })
  }
)

export const getRevenueYTD = cache(
  async (userId: string): Promise<number> => {
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1) // January 1 of current year

    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "income",
        issuedAt: { gte: yearStart },
      },
      _sum: { total: true },
    })

    return result._sum.total || 0
  }
)
