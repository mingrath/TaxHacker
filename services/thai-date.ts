/**
 * Thai Date Utilities — Buddhist Era formatting via Intl API.
 *
 * All dates are stored as Gregorian in the database.
 * Convert to Buddhist Era (พ.ศ.) only at the display layer.
 * NEVER store B.E. dates in the database.
 */

/**
 * Format date in Thai short format: "25 มี.ค. 2569"
 * Uses Intl.DateTimeFormat with Buddhist calendar.
 */
export function formatThaiDate(date: Date): string {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

/**
 * Format date in Thai long format: "25 มกราคม 2569"
 * Uses full month name.
 */
export function formatThaiDateLong(date: Date): string {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

/**
 * Format month and year in Thai: "มีนาคม 2569"
 */
export function formatThaiMonth(date: Date): string {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    year: "numeric",
    month: "long",
  }).format(date)
}

/**
 * Convert a Gregorian year to Buddhist Era year.
 * Buddhist Era = Gregorian + 543
 */
export function toBuddhistYear(gregorianYear: number): number {
  return gregorianYear + 543
}
