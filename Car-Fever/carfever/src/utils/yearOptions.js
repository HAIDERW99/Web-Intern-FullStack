/**
 * Dynamic year selection range helper.
 * Generates an array of years starting from maxYear (default: 2026) down to minYear (default: 1990).
 */
export function getYearOptions(maxYear = 2026, minYear = 1990) {
  const currentYear = new Date().getFullYear()
  const upperLimit = Math.max(currentYear, maxYear)
  const years = []
  for (let y = upperLimit; y >= minYear; y--) {
    years.push(String(y))
  }
  return years
}

export function getYearSelectOptions(placeholder = 'Select Year', maxYear = 2026, minYear = 1990) {
  const years = getYearOptions(maxYear, minYear)
  return placeholder ? [placeholder, ...years] : years
}
