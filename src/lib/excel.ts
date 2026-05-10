import * as XLSX from 'xlsx'

// ── Types ────────────────────────────────────────────────────────────────────
export interface ExcelCol {
  header: string
  key: string
  width: number                                           // characters wide
  type?: 'text' | 'currency' | 'number' | 'date' | 'status'
  align?: 'right' | 'center' | 'left'
}

export interface ExcelConfig {
  title: string
  filename: string
  company?: string
  columns: ExcelCol[]
  rows: Record<string, unknown>[]
  totals?: Record<string, unknown>
}

// ── Colour palette ───────────────────────────────────────────────────────────
const PAL = {
  darkBg:  '0D1117',
  darkBg2: '1A2035',
  blue:    '2563EB',
  blueDk:  '1D4ED8',
  white:   'FFFFFF',
  light:   'F4F6FA',
  border:  'E5E7EB',
  totalBg: '0F172A',
  text:    '111827',
}

const STATUS_AR: Record<string, string> = {
  paid: 'مدفوع', pending: 'معلق', overdue: 'متأخر', draft: 'مسودة',
  received: 'مستلمة', partial: 'جزئية', cancelled: 'ملغاة', voided: 'مسترجعة',
  active: 'نشط', inactive: 'غير نشط', in: 'وارد', out: 'صادر',
}

// ── Style helpers ────────────────────────────────────────────────────────────
type CellStyle = Record<string, unknown>

function border(color = PAL.border, topWeight: 'thin' | 'medium' = 'thin'): CellStyle {
  const thin = { style: 'thin', color: { rgb: color } }
  return {
    top:    { style: topWeight, color: { rgb: color } },
    bottom: thin, left: thin, right: thin,
  }
}

function s_header(bg = PAL.darkBg, sz = 13): CellStyle {
  return {
    font:      { bold: true, sz, color: { rgb: PAL.white }, name: 'Arial' },
    fill:      { fgColor: { rgb: bg }, patternType: 'solid' },
    alignment: { horizontal: 'right', vertical: 'center', readingOrder: 2, wrapText: true },
  }
}

function s_colhdr(): CellStyle {
  return {
    font:      { bold: true, sz: 11, color: { rgb: PAL.white }, name: 'Arial' },
    fill:      { fgColor: { rgb: PAL.blue }, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center', readingOrder: 2 },
    border:    border(PAL.blueDk, 'medium'),
  }
}

function s_data(even: boolean, align: 'right' | 'center' | 'left', bold = false): CellStyle {
  return {
    font:      { bold, sz: 10, color: { rgb: PAL.text }, name: 'Arial' },
    fill:      { fgColor: { rgb: even ? PAL.white : PAL.light }, patternType: 'solid' },
    alignment: { horizontal: align, vertical: 'center', readingOrder: 2 },
    border:    border(),
  }
}

function s_total(align: 'right' | 'center' | 'left' = 'center'): CellStyle {
  return {
    font:      { bold: true, sz: 11, color: { rgb: PAL.white }, name: 'Arial' },
    fill:      { fgColor: { rgb: PAL.totalBg }, patternType: 'solid' },
    alignment: { horizontal: align, vertical: 'center', readingOrder: 2 },
    border:    border('334155', 'medium'),
  }
}

// ── Cell factory ─────────────────────────────────────────────────────────────
function mkCell(
  v: string | number,
  t: 's' | 'n',
  style: CellStyle,
  z?: string,
): XLSX.CellObject {
  return { v, t, s: style, ...(z ? { z } : {}) } as XLSX.CellObject
}

function addr(c: number, r: number): string {
  return XLSX.utils.encode_cell({ c, r })
}

// ── Main export ──────────────────────────────────────────────────────────────
export function exportExcel(cfg: ExcelConfig): void {
  const {
    title,
    filename,
    company = 'شركتي',
    columns,
    rows,
    totals,
  } = cfg

  const colCount = columns.length
  const now = new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date())

  const ws: XLSX.WorkSheet = {}
  let r = 0   // current row index

  // ── Row 0 — company + title + export time ───────────────────────────────
  ws[addr(0, r)] = mkCell(`${company}   |   ${title}   |   ${now}`, 's', s_header(PAL.darkBg, 13))
  for (let c = 1; c < colCount; c++) ws[addr(c, r)] = mkCell('', 's', s_header(PAL.darkBg))
  r++

  // ── Row 1 — record count ─────────────────────────────────────────────────
  ws[addr(0, r)] = mkCell(`📊  إجمالي السجلات: ${rows.length}`, 's', s_header(PAL.darkBg2, 11))
  for (let c = 1; c < colCount; c++) ws[addr(c, r)] = mkCell('', 's', s_header(PAL.darkBg2))
  r++

  // ── Row 2 — column headers ───────────────────────────────────────────────
  columns.forEach((col, c) => {
    ws[addr(c, r)] = mkCell(col.header, 's', s_colhdr())
  })
  r++

  // ── Data rows ────────────────────────────────────────────────────────────
  rows.forEach((row, ri) => {
    const even = ri % 2 === 0
    columns.forEach((col, c) => {
      const raw  = row[col.key]
      const align = col.align ?? (col.type === 'currency' || col.type === 'number' ? 'center' : 'right')

      if (col.type === 'currency' && typeof raw === 'number') {
        ws[addr(c, r)] = mkCell(raw, 'n', { ...s_data(even, align, true), font: { bold: true, sz: 10, color: { rgb: '0D4C1C' }, name: 'Arial' } }, '#,##0.00 "ر.س"')
      } else if (col.type === 'number' && typeof raw === 'number') {
        ws[addr(c, r)] = mkCell(raw, 'n', s_data(even, align, true), '#,##0')
      } else if (col.type === 'date' && typeof raw === 'string' && raw) {
        const d = new Date(raw)
        const formatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
        ws[addr(c, r)] = mkCell(formatted, 's', s_data(even, 'center'))
      } else if (col.type === 'status') {
        ws[addr(c, r)] = mkCell(STATUS_AR[String(raw)] ?? String(raw), 's', s_data(even, 'center', true))
      } else {
        ws[addr(c, r)] = mkCell(raw != null ? String(raw) : '—', 's', s_data(even, align))
      }
    })
    r++
  })

  // ── Totals row ───────────────────────────────────────────────────────────
  if (totals) {
    columns.forEach((col, c) => {
      const raw   = totals[col.key]
      const align = col.align ?? (col.type === 'currency' || col.type === 'number' ? 'center' : 'right')

      if (c === 0 && (raw == null || raw === '')) {
        ws[addr(c, r)] = mkCell('الإجمالي', 's', s_total('right'))
      } else if (raw != null && raw !== '') {
        if (col.type === 'currency' && typeof raw === 'number') {
          ws[addr(c, r)] = mkCell(raw, 'n', s_total(align), '#,##0.00 "ر.س"')
        } else if (col.type === 'number' && typeof raw === 'number') {
          ws[addr(c, r)] = mkCell(raw, 'n', s_total(align), '#,##0')
        } else {
          ws[addr(c, r)] = mkCell(String(raw), 's', s_total(align))
        }
      } else {
        ws[addr(c, r)] = mkCell('', 's', s_total())
      }
    })
    r++
  }

  // ── Sheet range + merges ─────────────────────────────────────────────────
  ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: colCount - 1, r: r - 1 } })

  ws['!merges'] = [
    { s: { c: 0, r: 0 }, e: { c: colCount - 1, r: 0 } },
    { s: { c: 0, r: 1 }, e: { c: colCount - 1, r: 1 } },
  ]

  // ── Column widths ────────────────────────────────────────────────────────
  ws['!cols'] = columns.map(col => ({ wch: col.width }))

  // ── Row heights ──────────────────────────────────────────────────────────
  const rowHeights: XLSX.RowInfo[] = [
    { hpt: 38 },  // company header
    { hpt: 26 },  // record count
    { hpt: 30 },  // column headers
  ]
  for (let i = 0; i < rows.length; i++) rowHeights.push({ hpt: 22 })
  if (totals) rowHeights.push({ hpt: 28 })
  ws['!rows'] = rowHeights

  // ── RTL + freeze top 3 rows ──────────────────────────────────────────────
  ws['!views'] = [{ rightToLeft: true }] as unknown[]

  // ── Build workbook & download ────────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31))

  const buf = XLSX.write(wb, { bookType: 'xlsx', cellStyles: true, type: 'array' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${filename}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
