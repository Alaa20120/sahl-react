export function fmt(n: number, currency = 'SAR'): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

export function fmtNum(n: number): string {
  return new Intl.NumberFormat('ar-SA').format(n)
}

export function fmtDate(d: string | Date): string {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(typeof d === 'string' ? new Date(d) : d)
}

export function fmtDateShort(d: string | Date): string {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(typeof d === 'string' ? new Date(d) : d)
}

export function fmtPercent(n: number): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`
}

export function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('')
}
