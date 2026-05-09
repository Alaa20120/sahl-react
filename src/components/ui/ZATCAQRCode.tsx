import { QRCodeSVG } from 'qrcode.react'

interface Props {
  sellerName: string
  vatNumber: string
  invoiceDate: string
  totalWithVat: number
  vatAmount: number
  invoiceNumber?: string
  size?: number
}

function buildViewUrl(invoiceNumber: string): string {
  const base = window.location.origin + '/invoice/' + encodeURIComponent(invoiceNumber)
  return base
}

function encodeTLV(tag: number, value: string): Uint8Array {
  const enc = new TextEncoder()
  const val = enc.encode(value)
  const result = new Uint8Array(2 + val.length)
  result[0] = tag
  result[1] = val.length
  result.set(val, 2)
  return result
}

function buildZATCAQR(seller: string, vat: string, date: string, total: number, vatAmt: number): string {
  const fields = [
    encodeTLV(1, seller),
    encodeTLV(2, vat),
    encodeTLV(3, date),
    encodeTLV(4, total.toFixed(2)),
    encodeTLV(5, vatAmt.toFixed(2)),
  ]
  const totalLen = fields.reduce((s, f) => s + f.length, 0)
  const buf = new Uint8Array(totalLen)
  let offset = 0
  for (const f of fields) { buf.set(f, offset); offset += f.length }
  return btoa(String.fromCharCode(...buf))
}

export default function ZATCAQRCode({ sellerName, vatNumber, invoiceDate, totalWithVat, vatAmount, invoiceNumber, size = 80 }: Props) {
  // If we have an invoice number, encode the view URL so scanning opens the invoice page
  const qrValue = invoiceNumber
    ? buildViewUrl(invoiceNumber)
    : buildZATCAQR(sellerName, vatNumber, invoiceDate, totalWithVat, vatAmount)

  return (
    <div style={{ display: 'inline-block' }}>
      <QRCodeSVG
        value={qrValue}
        size={size}
        level="M"
        style={{ display: 'block', borderRadius: 4 }}
      />
    </div>
  )
}
