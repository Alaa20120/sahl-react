// ============================================================
// ZATCA QR Code — TLV (Tag-Length-Value) Format
// ============================================================
// Tag 1: Seller Name
// Tag 2: VAT Registration Number
// Tag 3: Invoice Timestamp (ISO 8601)
// Tag 4: Invoice Total with VAT
// Tag 5: VAT Total
// ============================================================

interface TLVField {
  tag: number
  value: string
}

function toTLVBytes(fields: TLVField[]): Uint8Array {
  const bytes: number[] = []
  const encoder = new TextEncoder()
  for (const f of fields) {
    const valBytes = encoder.encode(f.value)
    bytes.push(f.tag)
    bytes.push(valBytes.length)
    for (let i = 0; i < valBytes.length; i++) bytes.push(valBytes[i])
  }
  return new Uint8Array(bytes)
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export interface ZATCAInvoiceData {
  sellerName: string
  vatNumber: string
  timestamp: string // ISO 8601: 2024-01-15T10:30:00Z
  totalWithVat: number
  vatTotal: number
}

export function generateZATCAQR(data: ZATCAInvoiceData): string {
  const fields: TLVField[] = [
    { tag: 1, value: data.sellerName },
    { tag: 2, value: data.vatNumber },
    { tag: 3, value: data.timestamp },
    { tag: 4, value: data.totalWithVat.toFixed(2) },
    { tag: 5, value: data.vatTotal.toFixed(2) },
  ]
  const tlvBytes = toTLVBytes(fields)
  return bytesToBase64(tlvBytes)
}

// Company info for الفروج الوطني
export const COMPANY_INFO = {
  name: 'الفروج الوطني',
  vatNumber: '310123456700003', // placeholder — replace with actual
}
