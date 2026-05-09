import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supaFetch } from '@/lib/supabase'
import { useAppStore } from '@/store/app.store'

function fmt(n: number) {
  return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' ر.س'
}

export default function InvoiceView() {
  const { number } = useParams<{ number: string }>()
  const co = useAppStore(s => s.company)
  const [invoice, setInvoice] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!number) return
    async function load() {
      try {
        const invData = await supaFetch('invoices', {
          filter: `number=eq.${encodeURIComponent(number!)}`,
          limit: 1,
        })
        const inv = Array.isArray(invData) ? invData[0] : null
        if (!inv) { setError('الفاتورة غير موجودة'); setLoading(false); return }

        const itemsData = await supaFetch('invoice_items', {
          filter: `invoice_id=eq.${inv.id}`,
          limit: 200,
        })
        setInvoice(inv)
        setItems(Array.isArray(itemsData) ? itemsData : [])
      } catch (e: any) {
        setError(e.message || 'خطأ في تحميل الفاتورة')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [number])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Tajawal, sans-serif', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>⏳</div>
      <div style={{ fontSize: 16, color: '#6B7280' }}>جارٍ تحميل الفاتورة...</div>
    </div>
  )

  if (error || !invoice) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Tajawal, sans-serif', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48 }}>❌</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{error || 'الفاتورة غير موجودة'}</div>
    </div>
  )

  const statusLabel: Record<string, { label: string; color: string }> = {
    paid:     { label: 'مدفوعة', color: '#10B981' },
    partial:  { label: 'مدفوعة جزئياً', color: '#F59E0B' },
    pending:  { label: 'معلقة', color: '#F59E0B' },
    overdue:  { label: 'متأخرة', color: '#EF4444' },
    draft:    { label: 'مسودة', color: '#9CA3AF' },
    returned: { label: 'مرتجعة', color: '#EF4444' },
  }
  const st = statusLabel[invoice.status] ?? { label: invoice.status, color: '#6B7280' }

  return (
    <div dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif", background: '#F4F6FA', minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#0D1117', color: '#fff', padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{co.name || 'الشركة'}</div>
            {co.nameEn && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{co.nameEn}</div>}
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10, lineHeight: 1.8 }}>
              {co.address && <div>{co.address}، {co.city}</div>}
              {co.phone && <div>ج: {co.phone}</div>}
              {co.vat && <div>الرقم الضريبي: {co.vat}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 24, fontWeight: 900 }}>فاتورة ضريبية</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>TAX INVOICE</div>
            <div style={{ marginTop: 12, fontSize: 13, lineHeight: 2, opacity: 0.85 }}>
              <div><strong style={{ opacity: 0.6 }}>رقم:</strong> {invoice.number}</div>
              <div><strong style={{ opacity: 0.6 }}>تاريخ:</strong> {invoice.date}</div>
              <div>
                <span style={{ background: st.color, color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {st.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill to */}
        <div style={{ padding: '20px 36px', background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>فاتورة إلى</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{invoice.customer}</div>
        </div>

        {/* Items table */}
        <div style={{ padding: '24px 36px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#F4F6FA' }}>
                {['الوصف', 'الكمية', 'سعر الوحدة', 'الإجمالي'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, textAlign: 'right', borderBottom: '2px solid #E5E7EB', color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 14px', fontSize: 14 }}>{it.description}</td>
                  <td style={{ padding: '12px 14px', fontSize: 14, textAlign: 'center' }}>{it.qty}</td>
                  <td style={{ padding: '12px 14px', fontSize: 14 }}>{fmt(it.price)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 700 }}>{fmt(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ minWidth: 260 }}>
              {[
                { label: 'المجموع', value: invoice.amount },
                { label: 'ضريبة القيمة المضافة (15%)', value: invoice.tax },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
                  <span>{r.label}</span>
                  <span>{fmt(r.value)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 16, fontWeight: 900, color: '#0D1117', borderTop: '2px solid #0D1117', marginTop: 4 }}>
                <span>الإجمالي</span>
                <span>{fmt(invoice.total)}</span>
              </div>
              {invoice.paid_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#10B981' }}>
                  <span>المدفوع</span>
                  <span>{fmt(invoice.paid_amount)}</span>
                </div>
              )}
              {invoice.total - invoice.paid_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, fontWeight: 700, color: '#EF4444' }}>
                  <span>المتبقي</span>
                  <span>{fmt(invoice.total - invoice.paid_amount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#F8FAFC', padding: '16px 36px', textAlign: 'center', fontSize: 12, color: '#9CA3AF', borderTop: '1px solid #E5E7EB' }}>
          تم إصدار هذه الفاتورة إلكترونياً بواسطة نظام سهل ERP
        </div>
      </div>
    </div>
  )
}
