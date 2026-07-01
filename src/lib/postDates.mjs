const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/

function getDateOnlyParts(dateStr) {
  const match = dateOnlyPattern.exec(dateStr)

  if (!match) {
    return null
  }

  const [, year, month, day] = match

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  }
}

export function parsePostDate(dateStr) {
  const dateOnly = getDateOnlyParts(dateStr)

  if (dateOnly) {
    return new Date(dateOnly.year, dateOnly.month - 1, dateOnly.day)
  }

  return new Date(dateStr)
}

export function formatPostDate(dateStr) {
  const date = parsePostDate(dateStr)

  if (Number.isNaN(date.getTime())) {
    return dateStr
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function comparePostDatesDesc(a, b) {
  return parsePostDate(b.date).getTime() - parsePostDate(a.date).getTime()
}

export function formatPostDateIso(dateStr) {
  if (getDateOnlyParts(dateStr)) {
    return dateStr
  }

  const date = new Date(dateStr)

  if (Number.isNaN(date.getTime())) {
    return dateStr
  }

  return date.toISOString().slice(0, 10)
}

export function formatPostRssDate(dateStr) {
  const dateOnly = getDateOnlyParts(dateStr)
  const date = dateOnly
    ? new Date(Date.UTC(dateOnly.year, dateOnly.month - 1, dateOnly.day, 12))
    : new Date(dateStr)

  if (Number.isNaN(date.getTime())) {
    return dateStr
  }

  return date.toUTCString()
}
