// ============================================================
// ZATCA API Integration
// ============================================================
// Sandbox: https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal
// Production: https://gw-fatoora.zatca.gov.sa/e-invoicing/core
// ============================================================

import { supabase } from '@/lib/supabase'
import type { Invoice } from '@/lib/mock-data/invoices'
import { generateZATCAQR, COMPANY_INFO, type ZATCAInvoiceData } from './tlv'
import { generateZATCAXML } from './xml-generator'
import { hashInvoice, signInvoiceHash, generateUUID } from './signature'

// const ZATCA_SANDBOX_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal'
// const ZATCA_PRODUCTION_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core'

export interface ZATCASubmitResult {
  success: boolean
  uuid: string
  qrCode: string
  xml: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  zatcaResponse?: any
  error?: string
}

export async function submitInvoiceToZATCA(invoice: Invoice): Promise<ZATCASubmitResult> {
  try {
    const uuid = generateUUID()
    const now = new Date()
    const timestamp = `${invoice.date}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}Z`

    // 1. Generate QR data
    const qrData: ZATCAInvoiceData = {
      sellerName: COMPANY_INFO.name,
      vatNumber: COMPANY_INFO.vatNumber,
      timestamp,
      totalWithVat: invoice.total,
      vatTotal: invoice.tax,
    }
    const qrCode = generateZATCAQR(qrData)

    // 2. Generate XML (placeholder signature)
    const placeholderSig = await signInvoiceHash(await hashInvoice(JSON.stringify(invoice)))
    const xml = generateZATCAXML({
      invoice,
      uuid,
      invoiceHash: placeholderSig.hash,
      digitalSignature: placeholderSig.signature,
      publicKey: placeholderSig.publicKey,
      certificate: placeholderSig.certificate,
    })

    // 3. Save to database
    await supabase.from('zatca_invoices').insert({
      invoice_id: invoice.id,
      uuid,
      invoice_hash: placeholderSig.hash,
      qr_code: qrCode,
      xml_content: xml,
      status: 'draft',
    })

    // 4. Try to submit to ZATCA (sandbox)
    // Note: This requires a real ZATCA API key and certificate
    // For now, we save as draft and mark as submitted
    /*
    const response = await fetch(`${ZATCA_SANDBOX_URL}/invoices/clearance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_ZATCA_API_KEY}`,
      },
      body: JSON.stringify({
        invoice: xml,
        uuid,
      }),
    })
    const zatcaResult = await response.json()
    */

    return {
      success: true,
      uuid,
      qrCode,
      xml,
      status: 'draft',
    }
  } catch (err: any) {
    return {
      success: false,
      uuid: '',
      qrCode: '',
      xml: '',
      status: 'draft',
      error: err.message || 'Unknown error',
    }
  }
}

export async function getZATCAInvoiceStatus(invoiceId: string): Promise<string> {
  const { data } = await supabase.from('zatca_invoices').select('status').eq('invoice_id', invoiceId).single()
  return data?.status || 'draft'
}
