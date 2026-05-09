import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { fmt, fmtDate } from '@/lib/format'
import { type PurchaseStatus } from '@/lib/mock-data/purchases'
import { useCustomerStore } from '@/store/customer.store'
import { exportExcel } from '@/lib/excel'
import { toast } from '@/lib/toast'
import type { PaymentMethod } from '@/lib/mock-data/invoices'
import { usePurchaseStore } from '@/store/purchase.store'
import { useInventoryStore } from '@/store/inventory.store'
import type { Product } from '@/lib/mock-data/inventory'
import { useSaving } from '@/lib/useSaving'

const STATUS_COLORS: Record<PurchaseStatus, string> = {
  received: 'var(--success)', pending: 'var(--warn)', partial: 'var(--blue)',
  cancelled: 'var(--danger)', voided: 'var(--danger)',
}
const STATUS_LABELS: Record<PurchaseStatus, string> = {
  received: 'مستلمة', pending: 'معلقة', partial: 'جزئية', cancelled: 'ملغاة', voided: 'مسترجعة',
}

interface LineItem { id: number; productId?: string; desc: string; qty: string; price: string }

const VAT = 0.15

function POProductPicker({ value, onChange, onSelect }: {
  value: string
  onChange: (v: string) => void
  onSelect: (p: Product) => void
}) {
  const products = useInventoryStore(s => s.products)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const matches = value.trim()
    ? products.filter(p => p.name.includes(value) || p.sku.toLowerCase().includes(value.toLowerCase()))
    : products

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input className="form-control" placeholder="اسم المنتج أو الكود..." value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} autoComplete="off" />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 999,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          maxHeight: 200, overflowY: 'auto', marginTop: 2,
        }}>
          {matches.length === 0
            ? <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted)' }}>لا توجد منتجات</div>
            : matches.map(p => (
              <button key={p.id} type="button"
                onMouseDown={e => { e.preventDefault(); onSelect(p); setOpen(false) }}
                style={{
                  width: '100%', textAlign: 'right', background: 'none', border: 'none',
                  padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border)', alignItems: 'center',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.sku} · التكلفة: {fmt(p.costPrice)}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: p.stock <= p.minStock ? 'var(--danger)' : 'var(--muted)', flexShrink: 0 }}>
                  مخزون: {p.stock}
                </span>
              </button>
            ))
          }
        </div>
      )}
    </div>
  )
}

export default function PurchasesPage() {
  const { saving, run } = useSaving()
  const navigate = useNavigate()
  const { purchases, addPurchase, nextNumber } = usePurchaseStore()
  const allCustomers = useCustomerStore(s => s.customers)
  const SUPPLIERS = allCustomers.filter(c => c.type === 'supplier' || c.type === 'both')
  const [statusFilter, setStatusFilter] = useState<'all' | PurchaseStatus>('all')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  // New PO form
  const [supplierId, setSupplierId] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [customSupplier, setCustomSupplier] = useState('')
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [hasDueDate, setHasDueDate] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [createdBy, setCreatedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ id: 1, desc: '', qty: '1', price: '' }])
  const [saveError, setSaveError] = useState('')

  // Auto-select first supplier when data loads
  useEffect(() => {
    if (!supplierId && SUPPLIERS.length > 0) {
      setSupplierId(SUPPLIERS[0].id)
    }
  }, [SUPPLIERS.length])

  const selectedSupplier = SUPPLIERS.find((s: any) => s.id === supplierId)
  const supplierName = showCustom ? customSupplier : (selectedSupplier?.name ?? '')

  const addItem = () => setItems(prev => [...prev, { id: Date.now(), desc: '', qty: '1', price: '' }])
  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id))
  const updateItem = (id: number, key: keyof LineItem, val: string | number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [key]: val } : i))
  const selectProduct = (id: number, product: Product) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, productId: product.id, desc: product.name, price: String(product.costPrice) } : i))

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.qty)||0) * (parseFloat(i.price)||0), 0)
  const tax = subtotal * VAT
  const total = subtotal + tax

  const resetForm = () => {
    setItems([{ id: 1, desc: '', qty: '1', price: '' }])
    setCustomSupplier(''); setCreatedBy(''); setNotes('')
    setShowCustom(false); setSupplierId(SUPPLIERS[0]?.id ?? '')
    setDueDate(''); setHasDueDate(false); setPaymentMethod('cash')
  }

  const handleSave = () => {
    setSaveError('')
    if (!supplierName.trim()) { setSaveError('يرجى اختيار مورد أو إدخال اسمه'); return }
    if (items.length === 0) { setSaveError('أضف صنفاً واحداً على الأقل'); return }
    const hasEmpty = items.some(i => !i.desc.trim())
    if (hasEmpty) { setSaveError('يرجى ملء وصف جميع الأصناف'); return }

    run(async () => {
      await addPurchase({
        date: poDate,
        dueDate: hasDueDate ? (dueDate || undefined) : undefined,
        supplier: supplierName,
        supplierVat: showCustom ? undefined : selectedSupplier?.vatNumber,
        itemCount: items.length,
        amount: subtotal,
        tax,
        total,
        paid: paymentMethod === 'cash' ? total : 0,
        status: paymentMethod === 'cash' ? 'received' : 'pending',
        lineItems: items.map(i => { const q = parseFloat(i.qty)||1; const p = parseFloat(i.price)||0; return { description: i.desc, productId: i.productId, qty: q, price: p, total: q*p } }),
        createdBy: createdBy || undefined,
      })
      toast('تم إنشاء أمر الشراء بنجاح', 'success')
      setShowNew(false)
      resetForm()
    }).catch((err: any) => setSaveError(err?.message || 'فشل الحفظ — تحقق من الاتصال وحاول مرة أخرى'))
  }

  const filtered = purchases.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchSearch = !search || p.supplier.includes(search) || p.id.includes(search)
    return matchStatus && matchSearch
  })

  const totalAmt = purchases.reduce((s, p) => s + p.total, 0)
  const paidAmt = purchases.reduce((s, p) => s + p.paid, 0)
  const suppliersCount = new Set(purchases.map(p => p.supplier)).size

  const remaining = (p: typeof purchases[0]) => p.total - p.paid
  const paidPct = (p: typeof purchases[0]) => Math.round((p.paid / p.total) * 100)
  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <>
      <PageHeader
        title="أوامر الشراء"
        subtitle="متابعة المشتريات والموردين"
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => exportExcel({
              title: 'تقرير أوامر الشراء',
              filename: `مشتريات-${new Date().toISOString().slice(0, 10)}`,
              columns: [
                { header: 'رقم الأمر', key: 'id', width: 18, type: 'text', align: 'center' },
                { header: 'التاريخ', key: 'date', width: 14, type: 'date', align: 'center' },
                { header: 'المورد', key: 'supplier', width: 28, type: 'text' },
                { header: 'الإجمالي', key: 'total', width: 18, type: 'currency' },
                { header: 'المدفوع', key: 'paid', width: 18, type: 'currency' },
                { header: 'الحالة', key: 'status', width: 14, type: 'status', align: 'center' },
              ],
              rows: filtered as unknown as Record<string, unknown>[],
              totals: { id: '', supplier: `${filtered.length} أمر`, total: filtered.reduce((s, p) => s + p.total, 0), paid: filtered.reduce((s, p) => s + p.paid, 0) },
            })}>
              <i className="fa fa-file-excel" /> تصدير Excel
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
              <i className="fa fa-plus" /> أمر شراء جديد
            </button>
          </>
        }
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي المشتريات" value={fmt(totalAmt)} dark icon="fa-shopping-cart" />
        <StatCard label="المدفوع" value={fmt(paidAmt)} badge="✓" badgeType="success" icon="fa-check-circle" iconColor="var(--success)" />
        <StatCard label="المتبقي" value={fmt(totalAmt - paidAmt)} badge="!" badgeType="warn" icon="fa-clock" iconColor="var(--warn)" />
        <StatCard label="عدد الموردين" value={String(suppliersCount)} icon="fa-industry" iconColor="var(--blue)" />
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body" style={{ padding: '12px 20px' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-box" style={{ flex: 1, maxWidth: 300 }}>
              <i className="fa fa-search icon" />
              <input placeholder="ابحث برقم الأمر أو المورد..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {(['all', 'received', 'pending', 'partial', 'cancelled'] as (typeof statusFilter)[]).map(k => (
              <button key={k} onClick={() => setStatusFilter(k)} className={`btn btn-sm ${statusFilter === k ? 'btn-primary' : 'btn-outline'}`}>
                {k === 'all' ? 'الكل' : STATUS_LABELS[k as PurchaseStatus]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox"
                    onChange={e => setSelected(e.target.checked ? purchases.map(p => p.id) : [])}
                    checked={selected.length === purchases.length && purchases.length > 0}
                  />
                </th>
                <th>رقم الأمر</th><th>التاريخ</th><th>المورد</th><th>الأصناف</th>
                <th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>نسبة السداد</th><th>الحالة</th><th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(po => (
                <tr key={po.id}>
                  <td><input type="checkbox" checked={selected.includes(po.id)} onChange={() => toggleSelect(po.id)} /></td>
                  <td>
                    <Link to={`/erp/purchases/${po.id}`} style={{ color: 'var(--blue)', fontWeight: 700 }}>{po.id}</Link>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(new Date(po.date))}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-link"
                      style={{ fontWeight: 600, fontSize: 13, padding: 0, textAlign: 'right' }}
                      onClick={() => {
                        const supplier = allCustomers.find(c => c.name === po.supplier || c.id === (po as any).supplierId)
                        if (supplier) {
                          navigate('/erp/customers', { state: { openProfile: supplier.id } })
                        } else {
                          toast('المورد غير مسجل في قائمة العملاء والموردين', 'warn')
                        }
                      }}
                    >
                      {po.supplier}
                    </button>
                    {po.createdBy && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{po.createdBy}</div>}
                  </td>
                  <td style={{ textAlign: 'center' }}>{po.itemCount}</td>
                  <td style={{ fontWeight: 700 }}>{fmt(po.total)}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(po.paid)}</td>
                  <td style={{ color: remaining(po) > 0 ? 'var(--danger)' : 'var(--muted)', fontWeight: 600 }}>{fmt(remaining(po))}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${paidPct(po)}%`, background: paidPct(po) === 100 ? 'var(--success)' : 'var(--blue)', borderRadius: 3, transition: 'width .3s' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', minWidth: 30 }}>{paidPct(po)}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[po.status], background: STATUS_COLORS[po.status] + '15', padding: '2px 8px', borderRadius: 6 }}>
                      {STATUS_LABELS[po.status]}
                    </span>
                  </td>
                  <td>
                    <Link to={`/erp/purchases/${po.id}`} className="btn btn-icon btn-outline" title="عرض">
                      <i className="fa fa-eye" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><i className="fa fa-shopping-cart" /></div>
              <div className="empty-state-title">لا توجد أوامر شراء</div>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>عرض {filtered.length} من {purchases.length} أمر</span>
        </div>
      </div>

      {/* ── New PO Modal ── */}
      <Modal open={showNew} onClose={() => { setShowNew(false); resetForm() }} title={`أمر شراء جديد — ${nextNumber()}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '72vh', overflowY: 'auto', paddingLeft: 4 }}>

          {/* Supplier — prominent at top */}
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 10, color: 'var(--primary)' }}>
              <i className="fa fa-truck" style={{ marginLeft: 6 }} />اسم المورد *
            </label>
            {SUPPLIERS.length > 0 ? (
              <select
                className="form-control"
                value={supplierId}
                onChange={e => { setSupplierId(e.target.value); setShowCustom(false) }}
                style={{ marginBottom: 8 }}
              >
                <option value="">— اختر مورداً —</option>
                {SUPPLIERS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : null}
            <input
              className="form-control"
              placeholder={SUPPLIERS.length > 0 ? 'أو اكتب اسم مورد غير مسجل...' : 'اكتب اسم المورد...'}
              value={supplierId ? '' : customSupplier}
              onChange={e => { setCustomSupplier(e.target.value); setSupplierId('') }}
              style={{ display: supplierId ? 'none' : 'block' }}
            />
            {supplierId && (
              <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>
                <i className="fa fa-check-circle" style={{ marginLeft: 4 }} />
                {SUPPLIERS.find(s => s.id === supplierId)?.name}
                <button type="button" onClick={() => { setSupplierId(''); setCustomSupplier('') }}
                  style={{ marginRight: 8, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11 }}>
                  تغيير
                </button>
              </div>
            )}
          </div>

          {/* Dates + responsible */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>تاريخ الأمر</label>
              <input className="form-control" type="date" value={poDate} onChange={e => setPoDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={hasDueDate}
                  onChange={e => {
                    setHasDueDate(e.target.checked)
                    if (e.target.checked && !dueDate) {
                      const d30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
                      setDueDate(d30)
                    }
                  }}
                  style={{ marginLeft: 6 }}
                />
                تاريخ الاستلام المتوقع
              </label>
              {hasDueDate && (
                <input className="form-control" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              )}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>المسؤول عن الأمر</label>
              <input className="form-control" placeholder="اسم الموظف المسؤول..." value={createdBy} onChange={e => setCreatedBy(e.target.value)} />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>طريقة الدفع</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                ['cash', 'نقدي', 'مدفوع فوراً', 'fa-money-bill-wave', 'var(--success)'],
                ['credit', 'آجل', 'مؤجل الدفع', 'fa-clock', 'var(--warn)'],
              ] as const).map(([k, l, sub, ic, c]) => (
                <button key={k} type="button" onClick={() => setPaymentMethod(k as PaymentMethod)}
                  style={{
                    padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${paymentMethod === k ? c : 'var(--border)'}`,
                    background: paymentMethod === k ? c + '12' : 'var(--bg)',
                  }}>
                  <i className={`fa ${ic}`} style={{ fontSize: 18, color: paymentMethod === k ? c : 'var(--muted)', display: 'block', marginBottom: 4 }} />
                  <div style={{ fontWeight: 800, fontSize: 13, color: paymentMethod === k ? c : 'inherit' }}>{l}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Line items */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>الأصناف</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 32px', gap: 6, marginBottom: 6 }}>
              {['الوصف / الصنف', 'الكمية', 'السعر', ''].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{h}</div>
              ))}
            </div>
            {items.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 32px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <POProductPicker
                  value={item.desc}
                  onChange={v => updateItem(item.id, 'desc', v)}
                  onSelect={p => selectProduct(item.id, p)}
                />
                <input className="form-control" type="text" inputMode="decimal" value={item.qty}
                  onChange={e => updateItem(item.id, 'qty', e.target.value.replace(/[^0-9.]/g, ''))}
                  style={{ textAlign: 'center', padding: '6px 8px' }} />
                <input className="form-control" type="text" inputMode="decimal" value={item.price}
                  onChange={e => updateItem(item.id, 'price', e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00" style={{ padding: '6px 8px' }} />
                <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                  style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', cursor: items.length === 1 ? 'default' : 'pointer', color: 'var(--danger)', opacity: items.length === 1 ? .3 : 1 }}>
                  <i className="fa fa-xmark" />
                </button>
              </div>
            ))}
            <button className="btn btn-outline btn-sm" style={{ marginTop: 4 }} onClick={addItem}>
              <i className="fa fa-plus" /> إضافة صنف
            </button>

            {subtotal > 0 && (
              <div style={{ marginTop: 12, background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)' }}>قبل الضريبة</span>
                  <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)' }}>ضريبة 15%</span>
                  <span style={{ fontWeight: 600, color: 'var(--warn)' }}>{fmt(tax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
                  <span>الإجمالي</span>
                  <span style={{ color: 'var(--primary)' }}>{fmt(total)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>ملاحظات</label>
            <textarea className="form-control" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="ملاحظات الأمر..." style={{ resize: 'none' }} />
          </div>

          {/* Error box */}
          {saveError && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fa fa-exclamation-circle" />
              {saveError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
              <i className="fa fa-check" /> إنشاء الأمر
            </button>
            <button className="btn btn-outline" onClick={() => { setShowNew(false); resetForm() }}>إلغاء</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
