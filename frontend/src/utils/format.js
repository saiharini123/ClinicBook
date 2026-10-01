// Date/time helpers. Everything user-facing is DD-MM-YYYY and 12-hour AM/PM.
// Backend also stores dates as DD-MM-YYYY strings so we mostly pass through,
// but these helpers are used for validation, sorting and display.

// returns today's date as DD-MM-YYYY
export const getTodayDDMMYYYY = () => {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

// add days to today, return DD-MM-YYYY
export const addDaysDDMMYYYY = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

// convert DD-MM-YYYY string to a Date object (for sorting / comparisons)
export const parseDDMMYYYY = (str) => {
  if (!str) return null
  const parts = str.split('-')
  if (parts.length !== 3) return null
  // note: month-1 because JS months are 0 indexed
  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
}

// validate that a date string is proper DD-MM-YYYY and a real date
export const isValidDDMMYYYY = (str) => {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(str)) return false
  const d = parseDDMMYYYY(str)
  return d instanceof Date && !isNaN(d.getTime())
}

// format a JS Date to DD-MM-YYYY
export const formatDateDDMMYYYY = (date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

// IST current time string. IST is UTC+5:30, we compute manually so it works
// even if the user's machine is in another timezone.
export const getISTNow = () => {
  const nowUtcMs = Date.now() + new Date().getTimezoneOffset() * 60000
  const istMs = nowUtcMs + 330 * 60000 // +5:30 = 330 minutes
  return new Date(istMs)
}

// show current IST clock as HH:MM:SS AM/PM
export const getISTClock = () => {
  const d = getISTNow()
  return format12Hour(
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  )
}

// convert "14:30" 24h to "02:30 PM" 12h format
export const format12Hour = (time24) => {
  if (!time24) return ''
  const parts = time24.split(':')
  let hours = Number(parts[0])
  const minutes = parts[1] || '00'
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`
}

// get browser timezone (Intl). Used for international users' auto detection.
export const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  } catch (e) {
    return 'Asia/Kolkata'
  }
}

// detect if user is likely in India based on their system timezone
export const isIndiaTimezone = () => {
  return getBrowserTimezone() === 'Asia/Kolkata' || getBrowserTimezone() === 'Asia/Calcutta'
}

// ------- currency helpers (INR base, approximate foreign equivalents) -------

// rough conversion rates - these are static approximations updated monthly,
// good enough for a "approx equivalent" display next to INR prices
export const APPROX_RATES = {
  USD: 0.012, // 1 INR = 0.012 USD
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
}

export const formatINR = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0'
  return '₹' + Number(amount).toLocaleString('en-IN')
}

// returns like "≈ $7.08 / €6.49 / £5.55"
export const approxForeignCurrency = (inrAmount) => {
  if (!inrAmount || isNaN(inrAmount)) return ''
  const usd = (inrAmount * APPROX_RATES.USD).toFixed(2)
  const eur = (inrAmount * APPROX_RATES.EUR).toFixed(2)
  const gbp = (inrAmount * APPROX_RATES.GBP).toFixed(2)
  const aed = (inrAmount * APPROX_RATES.AED).toFixed(2)
  return `≈ $${usd} / €${eur} / £${gbp} / AED ${aed}`
}

// human friendly status badge class mapping used in a few pages
export const statusBadgeClass = (status) => {
  switch (status) {
    case 'scheduled': return 'bg-info text-dark'
    case 'in-consultation': return 'bg-warning text-dark'
    case 'completed': return 'bg-success'
    case 'cancelled': return 'bg-secondary'
    default: return 'bg-light text-dark'
  }
}
