import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fmt } from '@/lib/format'
import { CUSTOMERS } from '@/lib/mock-data/customers'
import { toast } from '@/lib/toast'

interface LineItem { id: number; desc: string; qty: number; price: number }

const VAT = 0.15

export default function InvoiceNewPage() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const due30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [customerId, setCustomerId] = useState(CUSTOMERS[0]?.id ?? '')
  const [date, setDate]           = useState(today)
  const [dueDate, setDueDate]     = useState(due30)
  const [notes, setNotes]         = useState('شكراً لتعاملكم معنا. يُرجى الدفع خلال 30 يوماً.')
  const [items, setItems]         = useState<LineItem[]>([
    { id: 1, desc: '', qty: 1, price: 0 },
  ])
  const [saving, setSaving] = useState(false)

  const customer = CUSTOMERS.find(c => c.id === customerId)

  const addItem = () => setItems(prev => [...prev, { id: Date.now(), desc: '', qty: 1, price: 0 }])
  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id))
  const updateItem = (id: number, key: keyof LineItem, val: string | number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [key]: val } : i))

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
  const tax      = subtotal * VAT
  const total    = subtotal + tax

  const handleSave = (status: 'draft' | 'pending') => {
    const hasEmpty = items.some(i => !i.desc || i.price <= 0)
    if (hasEmpty) { toast('يرجى ملء بيانات جميع الأصناف', 'warn'); return }
    if (!customerId) { toast('يرجى اختيار العميل', 'warn'); return }
    setSaving(true)
    setTimeout(() => {
      toast(status === 'draft' ? 'تم حفظ الفاتورة كمسودة' : 'تم إصدار الفاتورة بنجاح', 'success')
      navigate('/erp/invoices')
    }, 600)
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
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>INV-2025-009 (تلقائي)</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => handleSave('draft')} disabled={saving}>
          <i className="fa fa-floppy-disk" /> حفظ مسودة
        </button>
        <button className="btn btn-primary" onClick={() => handleSave('pending')} disabled={saving}>
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
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>تاريخ الاستحقاق</label>
                <input className="form-control" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
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

          {/* Line items */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--muted)' }}>
              <i className="fa fa-list" style={{ marginLeft: 6 }} />الأصناف والخدمات
            </div>

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px 36px', gap: 8, marginBottom: 8, padding: '0 2px' }}>
              {['الوصف', 'الكمية', 'سعر الوحدة', 'الإجمالي', ''].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{h}</div>
              ))}
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, idx) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px 36px', gap: 8, alignItems: 'center' }}>
                  <input
                    className="form-control"
                    placeholder={`الصنف أو الخدمة ${idx + 1}...`}
                    value={item.desc}
                    onChange={e => updateItem(item.id, 'desc', e.target.value)}
                  />
                  <input
                    className="form-control"
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={e => updateItem(item.id, 'qty', +e.target.value || 1)}
                    style={{ textAlign: 'center' }}
                  />
                  <input
                    className="form-control"
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={item.price || ''}
                    onChange={e => updateItem(item.id, 'price', +e.target.value || 0)}
                  />
                  <div style={{ fontWeight: 700, fontSize: 13, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
                    {fmt(item.qty * item.price)}
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
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 12 }}>إعدادات الفاتورة</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>قالب الفاتورة</label>
                <select className="form-control" style={{ fontSize: 12 }}
                  defaultValue={localStorage.getItem('sahl-inv-template') ?? 'classic'}
                  onChange={e => localStorage.setItem('sahl-inv-template', e.target.value)}>
                  <option value="classic">كلاسيكي — داكن</option>
                  <option value="modern">عصري — متدرج</option>
                  <option value="clean">نظيف — أبيض</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>اللغة</label>
                <select className="form-control" style={{ fontSize: 12 }}>
                  <option>عربي</option>
                  <option>إنجليزي</option>
                  <option>عربي + إنجليزي</option>
                </select>
              </div>
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

          <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => handleSave('pending')} disabled={saving}>
            {saving ? <><i className="fa fa-spinner fa-spin" /> جارٍ الإصدار...</> : <><i className="fa fa-check" /> إصدار الفاتورة</>}
          </button>
          <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => handleSave('draft')}>
            <i className="fa fa-floppy-disk" /> حفظ كمسودة
          </button>
        </div>
      </div>
    </div>
  )
}
