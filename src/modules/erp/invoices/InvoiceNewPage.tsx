import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fmt } from '@/lib/format'
import { CUSTOMERS } from '@/lib/mock-data/customers'
import { PRODUCTS, type Product } from '@/lib/mock-data/inventory'
import { useInvoiceStore } from '@/store/invoice.store'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/lib/toast'
import type { PaymentMethod } from '@/lib/mock-data/invoices'

interface LineItem { id: number; productId?: string; desc: string; qty: string; price: string }

// ── Product picker input ─────────────────────────────────────────────────────
function ProductPicker({
  value, placeholder, onChange, onSelect,
}: {
  value: string
  placeholder: string
  onChange: (v: string) => void
  onSelect: (p: Product) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const matches = value.trim()
    ? PRODUCTS.filter(p =>
        p.name.includes(value) || p.sku.toLowerCase().includes(value.toLowerCase())
      )
    : PRODUCTS

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const stockColor = (p: Product) => p.stock === 0 ? 'var(--danger)' : p.stock <= p.minStock ? 'var(--warn)' : 'var(--success)'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 1000,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,.15)',
          maxHeight: 320, overflowY: 'auto', marginTop: 4,
        }}>
          {/* Header */}
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', borderRadius: '12px 12px 0 0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {matches.length} منتج متاح
            </div>
          </div>
          {matches.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
              <i className="fa fa-box-open" style={{ fontSize: 24, display: 'block', marginBottom: 8, opacity: .4 }} />
              لا توجد منتجات مطابقة
            </div>
          ) : matches.map(p => (
            <button
              key={p.id}
              type="button"
              onMouseDown={e => { e.preventDefault(); onSelect(p); setOpen(false) }}
              style={{
                width: '100%', textAlign: 'right', background: 'none', border: 'none',
                padding: '10px 14px', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'background .1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {/* Icon placeholder */}
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: 'var(--primary)10', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="fa fa-box" style={{ color: 'var(--primary)', fontSize: 14 }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--blue)', background: 'var(--blue-light)', padding: '1px 6px', borderRadius: 4 }}>
                    {p.sku}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{p.category}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: stockColor(p), background: stockColor(p) + '15', padding: '1px 8px', borderRadius: 10 }}>
                    <i className="fa fa-cubes" style={{ marginLeft: 3, fontSize: 9 }} />
                    {p.stock === 0 ? 'نفد المخزون' : p.stock <= p.minStock ? `منخفض: ${p.stock}` : `مخزون: ${p.stock}`} {p.unit}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)' }}>{fmt(p.sellPrice)}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>ر.س / {p.unit}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

import { calculateTax } from '@/lib/vat'

export default function InvoiceNewPage() {
  const navigate = useNavigate()
  const { nextNumber, addInvoice } = useInvoiceStore()
  const user = useAuthStore(s => s.user)

  const today = new Date().toISOString().split('T')[0]
  const due30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [customerId, setCustomerId]       = useState(CUSTOMERS[0]?.id ?? '')
  const [date, setDate]                   = useState(today)
  const [dueDate, setDueDate]             = useState('')
  const [hasDueDate, setHasDueDate]       = useState(false)
  const [notes, setNotes]                 = useState('شكراً لتعاملكم معنا. يُرجى الدفع خلال 30 يوماً.')
  const [items, setItems]                 = useState<LineItem[]>([{ id: 1, desc: '', qty: '1', price: '' }])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [saving, setSaving]               = useState(false)

  const customer = CUSTOMERS.find(c => c.id === customerId)
  const invoiceNumber = nextNumber()

  const addItem = () => setItems(prev => [...prev, { id: Date.now(), desc: '', qty: '1', price: '' }])
  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id))
  const updateItem = (id: number, key: keyof LineItem, val: string | number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [key]: val } : i))
  const selectProduct = (id: number, product: Product) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, productId: product.id, desc: product.name, price: String(product.sellPrice) } : i))

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0), 0)
  const taxBreakdown = calculateTax(subtotal)
  const tax = taxBreakdown.tax
  const total = taxBreakdown.total

  const handleSave = async (asDraft = false) => {
    const hasEmpty = items.some(i => !i.desc || !(parseFloat(i.price) > 0))
    if (hasEmpty) { toast('يرجى ملء بيانات جميع الأصناف', 'warn'); return }
    if (!customerId) { toast('يرجى اختيار العميل', 'warn'); return }

    const status = asDraft ? 'draft' : paymentMethod === 'cash' ? 'paid' : 'pending'

    setSaving(true)
    try {
      await addInvoice({
        customer: customer!.name,
        customerId,
        date,
        dueDate: hasDueDate ? dueDate || undefined : undefined,
        amount: subtotal,
        tax,
        total,
        status,
        paymentMethod,
        createdBy: user?.name,
        items: items.map(i => { const q = parseFloat(i.qty) || 1; const p = parseFloat(i.price) || 0; return { description: i.desc, productId: i.productId, qty: q, price: p, total: q * p } }),
      })
      toast(
        asDraft
          ? `تم حفظ الفاتورة ${invoiceNumber} كمسودة`
          : `تم إصدار الفاتورة ${invoiceNumber} بنجاح${paymentMethod === 'credit' ? ' — آجل' : ' — نقدي'}`,
        'success'
      )
      navigate('/erp/invoices')
    } catch (err: any) {
      toast(`خطأ في حفظ الفاتورة: ${err?.message || 'حاول مرة أخرى'}`, 'danger')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/erp/invoices')}>
          <i className="fa fa-arrow-right" /> رجوع
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>فاتورة جديدة</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--blue)', background: 'var(--blue-light)', padding: '2px 10px', borderRadius: 6 }}>
              {invoiceNumber}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>سيتم تعيينه تلقائياً عند الإصدار</span>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => handleSave(true)} disabled={saving}>
          <i className="fa fa-floppy-disk" /> حفظ مسودة
        </button>
        <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={saving}>
          {saving ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-check" />}
          {' '}إصدار الفاتورة
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        {/* Left — main form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Customer + dates */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--muted)' }}>
              <i className="fa fa-user" style={{ marginLeft: 6 }} />بيانات العميل والتواريخ
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>العميل *</label>
                <select className="form-control" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                  {CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {customer && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
                    <i className="fa fa-phone" style={{ marginLeft: 4 }} />{customer.phone}
                    <span style={{ margin: '0 8px' }}>|</span>
                    <i className="fa fa-envelope" style={{ marginLeft: 4 }} />{customer.email}
                    {customer.vatNumber && <><span style={{ margin: '0 8px' }}>|</span>الرقم الضريبي: {customer.vatNumber}</>}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>تاريخ الإصدار</label>
                <input className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  <input
                    type="checkbox"
                    checked={hasDueDate}
                    onChange={e => {
                      setHasDueDate(e.target.checked)
                      if (e.target.checked && !dueDate) setDueDate(due30)
                    }}
                    style={{ marginLeft: 6 }}
                  />
                  تاريخ الاستحقاق
                </label>
                {hasDueDate && (
                  <input className="form-control" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>العملة</label>
                <select className="form-control">
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--muted)' }}>
              <i className="fa fa-credit-card" style={{ marginLeft: 6 }} />طريقة الدفع
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${paymentMethod === 'cash' ? 'var(--success)' : 'var(--border)'}`,
                  background: paymentMethod === 'cash' ? 'rgba(34,197,94,.08)' : 'var(--bg)',
                  transition: 'all .15s',
                }}
              >
                <i className="fa fa-money-bill-wave" style={{ fontSize: 22, color: paymentMethod === 'cash' ? 'var(--success)' : 'var(--muted)', display: 'block', marginBottom: 6 }} />
                <div style={{ fontWeight: 800, fontSize: 14, color: paymentMethod === 'cash' ? 'var(--success)' : 'inherit' }}>نقدي</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>مدفوع فوراً</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${paymentMethod === 'credit' ? 'var(--warn)' : 'var(--border)'}`,
                  background: paymentMethod === 'credit' ? 'rgba(234,179,8,.08)' : 'var(--bg)',
                  transition: 'all .15s',
                }}
              >
                <i className="fa fa-clock" style={{ fontSize: 22, color: paymentMethod === 'credit' ? 'var(--warn)' : 'var(--muted)', display: 'block', marginBottom: 6 }} />
                <div style={{ fontWeight: 800, fontSize: 14, color: paymentMethod === 'credit' ? 'var(--warn)' : 'inherit' }}>آجل</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>مؤجل الدفع</div>
              </button>
            </div>
            {paymentMethod === 'credit' && total > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, fontSize: 12 }}>
                <i className="fa fa-circle-info" style={{ marginLeft: 6, color: 'var(--warn)' }} />
                سيُسجَّل مبلغ <strong>{fmt(total)}</strong> في رصيد العميل كدَين مستحق
              </div>
            )}
          </div>

          {/* Line items */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--muted)' }}>
              <i className="fa fa-list" style={{ marginLeft: 6 }} />الأصناف والخدمات
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px 36px', gap: 8, marginBottom: 8, padding: '0 2px' }}>
              {['الوصف', 'الكمية', 'سعر الوحدة', 'الإجمالي', ''].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{h}</div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, idx) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px 36px', gap: 8, alignItems: 'center' }}>
                  <ProductPicker
                    value={item.desc}
                    placeholder={`الصنف أو الخدمة ${idx + 1}...`}
                    onChange={v => updateItem(item.id, 'desc', v)}
                    onSelect={p => selectProduct(item.id, p)}
                  />
                  <input
                    className="form-control"
                    type="text"
                    inputMode="decimal"
                    value={item.qty}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9.]/g, '')
                      updateItem(item.id, 'qty', v)
                    }}
                    style={{ textAlign: 'center' }}
                  />
                  <input
                    className="form-control"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={item.price}
                    onChange={e => updateItem(item.id, 'price', e.target.value.replace(/[^0-9.]/g, ''))}
                  />
                  <div style={{ fontWeight: 700, fontSize: 13, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
                    {fmt((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0))}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', cursor: items.length === 1 ? 'default' : 'pointer', color: 'var(--danger)', opacity: items.length === 1 ? .3 : 1, fontSize: 13 }}
                  >
                    <i className="fa fa-xmark" />
                  </button>
                </div>
              ))}
            </div>

            <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={addItem}>
              <i className="fa fa-plus" /> إضافة صنف
            </button>
          </div>

          {/* Notes */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
              <i className="fa fa-note-sticky" style={{ marginLeft: 6, color: 'var(--muted)' }} />ملاحظات وشروط الدفع
            </label>
            <textarea className="form-control" rows={3} value={notes}
              onChange={e => setNotes(e.target.value)} style={{ resize: 'none' }} />
          </div>
        </div>

        {/* Right — summary */}
        <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Invoice number badge */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, marginBottom: 8 }}>
              <i className="fa fa-hashtag" style={{ marginLeft: 6 }} />رقم الفاتورة
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: 1 }}>
              {invoiceNumber}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>يُولَّد تلقائياً عند الإصدار</div>
          </div>

          {/* Totals */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--muted)' }}>ملخص الفاتورة</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>المجموع قبل الضريبة</span>
                <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>ضريبة القيمة المضافة (15%)</span>
                <span style={{ fontWeight: 600, color: 'var(--warn)' }}>{fmt(tax)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                <span>الإجمالي</span>
                <span style={{ color: 'var(--primary)' }}>{fmt(total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginTop: 4 }}>
                <span style={{ color: 'var(--muted)' }}>طريقة الدفع</span>
                <span style={{
                  padding: '2px 10px', borderRadius: 20, fontWeight: 700, fontSize: 11,
                  background: paymentMethod === 'cash' ? 'rgba(34,197,94,.12)' : 'rgba(234,179,8,.12)',
                  color: paymentMethod === 'cash' ? 'var(--success)' : 'var(--warn)',
                }}>
                  <i className={`fa ${paymentMethod === 'cash' ? 'fa-money-bill-wave' : 'fa-clock'}`} style={{ marginLeft: 4 }} />
                  {paymentMethod === 'cash' ? 'نقدي' : 'آجل'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 12 }}>إعدادات الفاتورة</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              <i className="fa fa-info-circle" style={{ marginLeft: 6 }} />
              يتم التحكم في تصميم الفاتورة من صفحة <a href="/erp/settings" style={{ color: 'var(--blue)', fontWeight: 700 }}>الإعدادات ← القوالب</a>
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 700 }}>معلومات ZATCA</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <i className="fa fa-shield-halved" style={{ color: 'var(--success)', fontSize: 16, marginTop: 1 }} />
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
                سيتم توليد QR Code تلقائياً عند إصدار الفاتورة وإرسالها لمنصة ZATCA
              </div>
            </div>
          </div>

          <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <><i className="fa fa-spinner fa-spin" /> جارٍ الإصدار...</> : <><i className="fa fa-check" /> إصدار الفاتورة</>}
          </button>
          <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => handleSave(true)}>
            <i className="fa fa-floppy-disk" /> حفظ كمسودة
          </button>
        </div>
      </div>
    </div>
  )
}
