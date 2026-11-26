export function normalizeBrazilianPhoneNumber(value: string): string | null {
  if (!/^[\d\s()+.-]+$/.test(value)) return null

  const digits = value.replace(/\D/g, '')
  const nationalNumber = digits.startsWith('55') && (digits.length === 12 || digits.length === 13)
    ? digits.slice(2)
    : digits

  return nationalNumber.length === 10 || nationalNumber.length === 11
    ? nationalNumber
    : null
}

export function isAtLeastEighteen(birthDateValue: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDateValue)
  if (!match) return false

  const [, yearValue, monthValue, dayValue] = match
  const birthYear = Number(yearValue)
  const birthMonth = Number(monthValue)
  const birthDay = Number(dayValue)
  const parsedBirthDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay))
  if (
    parsedBirthDate.getUTCFullYear() !== birthYear ||
    parsedBirthDate.getUTCMonth() !== birthMonth - 1 ||
    parsedBirthDate.getUTCDate() !== birthDay
  ) {
    return false
  }

  const todayInBrazil = new Date(Date.now() - 3 * 60 * 60 * 1000)
  let age = todayInBrazil.getUTCFullYear() - birthYear
  const birthdayHasPassed =
    todayInBrazil.getUTCMonth() + 1 > birthMonth ||
    (todayInBrazil.getUTCMonth() + 1 === birthMonth && todayInBrazil.getUTCDate() >= birthDay)
  if (!birthdayHasPassed) age -= 1

  return age >= 18
}
