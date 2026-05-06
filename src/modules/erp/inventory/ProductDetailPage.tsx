import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import { fmt, fmtNum, fmtDate } from '@/lib/format'
import { CATEGORIES, type Product } from '@/lib/mock-data/inventory'
import { useInventoryStore } from '@/store/inventory.store'
import { useInvoiceStore } from '@/store/invoice.store'
import { useDelegateStore } from '@/store/delegate.store'
import { toast } from '@/lib/toast'
import { printStockReceipt } from '@/lib/print'

const W_STATUS: Record<string, { label: string; css: string }> = {
  pending:   { label: 'معلق',   css: 'status-pending'  },
  completed: { label: 'مكتمل', css: 'status-active'   },
  cancelled: { label: 'ملغي',  css: 'status-inactive' },
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // All hooks before any conditional return
  const { products, withdrawals, deductStock, updateProduct } = useInventoryStore()
  const invoices = useInvoiceStore(s => s.invoices)
  const delegates = useDelegateStore(s => s.delegates)
  const addToWarehouse = useDelegateStore(s => s.addToWarehouse)

  const original = products.find(p => p.id === id)
  const [tab, setTab] = useState<'info' | 'withdrawals' | 'delegates'>('info')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Product | null>(original ?? null)

  // Early return after all hooks
  if (!original || !form) {
    return (
      <div className="empty-state">
        <i className="fa fa-box-open empty-state-icon" />
        <div className="empty-state-title">المنتج غير موجود</div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/erp/inventory')}>
          <i className="fa fa-arrow-right" /> العودة للمخزون
        </button>
      </div>
    )
  }

  // delegate withdrawal modal state
  const [showWithdraw, setShowWithdraw]         = useState(false)
  const [withdrawDelegateId, setWithdrawDelegateId] = useState(() => delegates.find(d => d.status === 'active')?.id ?? '')
  const [withdrawQty, setWithdrawQty]           = useState('')

  const productWithdrawals = withdrawals.filter(w => w.productId === id)
  const pendingCount       = productWithdrawals.filter(w => w.status === 'pending').length
  const totalCompleted     = productWithdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + w.qty, 0)

  // Financial sold value: sum of invoice items for this product (productId-linked invoices only)
  const soldValue = invoices.reduce((sum, inv) =>
    sum + inv.items
      .filter(it => it.productId === id)
      .reduce((s, it) => s + it.qty * it.price, 0), 0)

  // Withdrawal-based revenue (from WITHDRAWALS mock data)
  const withdrawalRevenue = totalCompleted * form.sellPrice

  // Live delegate warehouse data
  const delegateStock = delegates.flatMap(d =>
    d.warehouse
      .filter(w => w.productId === id && w.status === 'in-stock')
      .map(w => ({ delegateId: d.id, delegateName: d.name, qty: w.qty, costPrice: w.costPrice, warehouseId: w.id }))
  )
  const totalDelegateQty   = delegateStock.reduce((s, d) => s + d.qty, 0)
  const totalDelegateValue = delegateStock.reduce((s, d) => s + d.qty * d.costPrice, 0)

  function setField<K extends keyof Product>(key: K, value: Product[K]) {
    setForm(prev => prev ? { ...prev, [key]: value } : prev)
  }

  function handleSave() {
    if (form) updateProduct(form.id, form)
    toast('تم حفظ بيانات المنتج بنجاح', 'success')
    setEditing(false)
  }

  function handleCancel() {
    if (original) setForm(original)
    setEditing(false)
  }

  function handleDelegateWithdraw() {
    if (!withdrawDelegateId || !withdrawQty) { toast('يرجى تعبئة جميع الحقول', 'warn'); return }
    const qty = parseInt(withdrawQty)
    if (isNaN(qty) || qty <= 0) { toast('كمية غير صالحة', 'warn'); return }
    if (!original) return
    if (qty > original.stock) { toast('الكمية تتجاوز المخزون المتاح', 'warn'); return }
    const delegate = delegates.find(d => d.id === withdrawDelegateId)
    if (!delegate) { toast('المندوب غير موجود', 'warn'); return }

    deductStock(original.id, qty)
    addToWarehouse(withdrawDelegateId, {
      productId: original.id,
      productName: original.name,
      productSku: original.sku,
      qty,
      costPrice: original.costPrice,
      receivedDate: new Date().toISOString().slice(0, 10),
      source: 'company',
    })
    // Sync local form state to reflect new stock
    setForm(prev => prev ? { ...prev, stock: prev.stock - qty } : prev)
    toast(`تم سحب ${qty} ${original.unit} إلى مستودع ${delegate.name}`, 'success')
    setShowWithdraw(false)
    setWithdrawQty('')

    // Print receipt
    printStockReceipt(delegate.name, original.name, qty, original.unit, qty * original.costPrice)
  }

  return (
    <>
      <PageHeader
        title={form.name}
        subtitle={`${original.sku} · ${original.category}`}
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/erp/inventory')}>
              <i className="fa fa-arrow-right" /> رجوع للمخزون
            </button>
            {!editing && (
              <button
                className="btn btn-sm"
                style={{ background: 'var(--warn)', color: '#fff', border: 'none' }}
                onClick={() => { setShowWithdraw(true); setWithdrawDelegateId(delegates.find(d => d.status === 'active')?.id ?? '') }}
              >
                <i className="fa fa-user-plus" /> سحب للمندوب
              </button>
            )}
            {!editing && tab === 'info' && (
              <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>
                <i className="fa fa-edit" /> تعديل
              </button>
            )}
            {editing && (
              <>
                <button className="btn btn-outline btn-sm" onClick={handleCancel}>إلغاء</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave}>
                  <i className="fa fa-save" /> حفظ التعديلات
                </button>
              </>
            )}
          </>
        }
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>المخزون الرئيسي</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: form.stock <= form.minStock ? 'var(--danger)' : 'var(--success)' }}>
            {fmtNum(form.stock)}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginRight: 4 }}>{form.unit}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{fmt(form.stock * form.costPrice)}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>في مستودعات المناديب</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: totalDelegateQty > 0 ? 'var(--warn)' : 'var(--muted)' }}>
            {fmtNum(totalDelegateQty)}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginRight: 4 }}>{form.unit}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{fmt(totalDelegateValue)}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>إيراد المسحوبات</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {fmtNum(totalCompleted)}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginRight: 4 }}>{form.unit}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>{fmt(withdrawalRevenue)}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>إجمالي المبيعات (فواتير)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: soldValue > 0 ? 'var(--primary)' : 'var(--muted)' }}>
            {fmt(soldValue)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>من الفواتير المرتبطة</div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>إجمالي القيمة الكلية</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {fmt(form.stock * form.costPrice + totalDelegateValue)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>مخزون رئيسي + مناديب</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'info' ? 'active' : ''}`}
          onClick={() => { setTab('info'); if (editing) handleCancel() }}
        >
          <i className="fa fa-box" style={{ marginLeft: 6 }} />
          بيانات المنتج
        </button>
        <button
          className={`tab-btn ${tab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setTab('withdrawals')}
        >
          <i className="fa fa-arrow-circle-up" style={{ marginLeft: 6 }} />
          سجل المسحوبات
          {pendingCount > 0 && (
            <span style={{ marginRight: 6, background: 'var(--warn-bg)', color: 'var(--warn)', padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
              {pendingCount} معلق
            </span>
          )}
        </button>
        {totalDelegateQty > 0 && (
          <button
            className={`tab-btn ${tab === 'delegates' ? 'active' : ''}`}
            onClick={() => setTab('delegates')}
          >
            <i className="fa fa-user-tie" style={{ marginLeft: 6 }} />
            لدى المندوبين
            <span style={{ marginRight: 6, background: 'var(--warn-bg)', color: 'var(--warn)', padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
              {totalDelegateQty}
            </span>
          </button>
        )}
      </div>

      {/* ── Tab: Product Info ── */}
      {tab === 'info' && (
        <div className="card">
          <div className="card-body">
            <div className="form-grid-2">
              <div className="form-group col-span-2">
                <label className="form-label">اسم الصنف</label>
                {editing
                  ? <input className="form-control" value={form.name} onChange={e => setField('name', e.target.value)} />
                  : <div style={{ padding: '9px 12px', fontWeight: 600, fontSize: 15, background: 'var(--bg)', borderRadius: 6 }}>{form.name}</div>
                }
              </div>

              <div className="form-group">
                <label className="form-label">الكود (SKU)</label>
                <div style={{ padding: '9px 12px', fontFamily: 'monospace', color: 'var(--muted)', background: 'var(--bg)', borderRadius: 6 }}>{original.sku}</div>
              </div>

              <div className="form-group">
                <label className="form-label">الحالة</label>
                {editing
                  ? <select className="form-control" value={form.status} onChange={e => setField('status', e.target.value as Product['status'])}>
                      <option value="active">نشط</option>
                      <option value="inactive">غير نشط</option>
                    </select>
                  : <div style={{ padding: '9px 12px', background: 'var(--bg)', borderRadius: 6 }}>
                      <span className={`status ${form.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                        {form.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                }
              </div>

              <div className="form-group">
                <label className="form-label">الفئة</label>
                {editing
                  ? <select className="form-control" value={form.category} onChange={e => setField('category', e.target.value)}>
                      {CATEGORIES.filter(c => c !== 'الكل').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  : <div style={{ padding: '9px 12px', background: 'var(--bg)', borderRadius: 6 }}>
                      <span style={{ background: 'var(--blue-light)', color: 'var(--blue)', padding: '2px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{form.category}</span>
                    </div>
                }
              </div>

              <div className="form-group">
                <label className="form-label">الوحدة</label>
                {editing
                  ? <select className="form-control" value={form.unit} onChange={e => setField('unit', e.target.value)}>
                      {['قطعة', 'كيلو', 'لتر', 'كرتون', 'وحدة', 'خرطوشة'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  : <div style={{ padding: '9px 12px', color: 'var(--muted)', background: 'var(--bg)', borderRadius: 6 }}>{form.unit}</div>
                }
              </div>

              <div className="form-group">
                <label className="form-label">سعر الشراء</label>
                {editing
                  ? <input className="form-control" type="number" value={form.costPrice} onChange={e => setField('costPrice', +e.target.value)} />
                  : <div style={{ padding: '9px 12px', fontWeight: 600, background: 'var(--bg)', borderRadius: 6 }}>{fmt(form.costPrice)}</div>
                }
              </div>

              <div className="form-group">
                <label className="form-label">سعر البيع</label>
                {editing
                  ? <input className="form-control" type="number" value={form.sellPrice} onChange={e => setField('sellPrice', +e.target.value)} />
                  : <div style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--blue)', background: 'var(--bg)', borderRadius: 6 }}>{fmt(form.sellPrice)}</div>
                }
              </div>

              <div className="form-group">
                <label className="form-label">المخزون الحالي</label>
                {editing
                  ? <input className="form-control" type="number" value={form.stock} onChange={e => setField('stock', +e.target.value)} />
                  : <div style={{ padding: '9px 12px', fontWeight: 700, background: 'var(--bg)', borderRadius: 6, color: form.stock <= form.minStock ? 'var(--danger)' : 'var(--success)' }}>
                      {fmtNum(form.stock)} {form.unit}
                      {form.stock <= form.minStock && (
                        <span style={{ marginRight: 8, fontSize: 11, background: 'var(--danger-bg)', color: 'var(--danger)', padding: '1px 8px', borderRadius: 20 }}>منخفض</span>
                      )}
                    </div>
                }
              </div>

              <div className="form-group">
                <label className="form-label">الحد الأدنى للمخزون</label>
                {editing
                  ? <input className="form-control" type="number" value={form.minStock} onChange={e => setField('minStock', +e.target.value)} />
                  : <div style={{ padding: '9px 12px', color: 'var(--muted)', background: 'var(--bg)', borderRadius: 6 }}>{fmtNum(form.minStock)} {form.unit}</div>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Withdrawals ── */}
      {tab === 'withdrawals' && (
        <div className="card">
          {pendingCount > 0 && (
            <div style={{ background: 'var(--warn-bg)', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fa fa-clock" style={{ color: 'var(--warn)', fontSize: 16 }} />
              <span style={{ fontSize: 13 }}>
                <strong>تنبيه:</strong> يوجد <strong>{pendingCount}</strong> {pendingCount === 1 ? 'مسحوبة معلقة' : 'مسحوبات معلقة'} على هذا المنتج.
              </span>
            </div>
          )}

          {productWithdrawals.length === 0 ? (
            <div className="empty-state">
              <i className="fa fa-inbox empty-state-icon" />
              <div className="empty-state-title">لا توجد مسحوبات</div>
              <div className="empty-state-sub">لم يتم تسجيل أي مسحوبات لهذا المنتج بعد</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>رقم المرجع</th>
                    <th>العميل / الجهة</th>
                    <th>الكمية</th>
                    <th>الحالة</th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {productWithdrawals.map(w => {
                    const st = W_STATUS[w.status]
                    return (
                      <tr key={w.id} style={{ background: w.status === 'pending' ? 'var(--warn-bg)' : undefined }}>
                        <td style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtDate(w.date)}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 600, fontSize: 12 }}>
                            {w.reference}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{w.customer}</td>
                        <td>
                          <span style={{ fontWeight: 700 }}>{fmtNum(w.qty)}</span>
                          <span style={{ color: 'var(--muted)', fontSize: 11, marginRight: 4 }}>{form.unit}</span>
                        </td>
                        <td><span className={`status ${st.css}`}>{st.label}</span></td>
                        <td style={{ color: 'var(--muted)', fontSize: 12 }}>{w.notes ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Delegate Stock ── */}
      {tab === 'delegates' && (
        <div className="card">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
            <i className="fa fa-user-tie" style={{ marginLeft: 8, color: 'var(--warn)' }} />
            كميات لدى المندوبين
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>المندوب</th>
                  <th>الكمية</th>
                  <th>سعر الشراء</th>
                  <th>القيمة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {delegateStock.map(ds => (
                  <tr key={ds.delegateId}>
                    <td style={{ fontWeight: 600 }}>{ds.delegateName}</td>
                    <td style={{ fontWeight: 700 }}>{fmtNum(ds.qty)} <span style={{ color: 'var(--muted)', fontSize: 11 }}>{form.unit}</span></td>
                    <td>{fmt(ds.costPrice)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--warn)' }}>{fmt(ds.qty * ds.costPrice)}</td>
                    <td>
                      <a href={`/erp/delegates/${ds.delegateId}`} className="btn btn-outline btn-sm">
                        <i className="fa fa-user-tie" /> عرض المندوب
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg)', fontWeight: 700 }}>
                  <td>الإجمالي</td>
                  <td>{fmtNum(totalDelegateQty)} {form.unit}</td>
                  <td>—</td>
                  <td style={{ color: 'var(--warn)' }}>{fmt(totalDelegateValue)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Delegate Withdrawal Modal ── */}
      <Modal
        open={showWithdraw}
        onClose={() => { setShowWithdraw(false); setWithdrawQty('') }}
        title="سحب مخزون إلى مندوب"
        width={440}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setShowWithdraw(false); setWithdrawQty('') }}>إلغاء</button>
            <button className="btn btn-primary" style={{ background: 'var(--warn)', border: 'none' }} onClick={handleDelegateWithdraw}>
              <i className="fa fa-user-plus" /> تأكيد السحب
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
            <span style={{ color: 'var(--muted)' }}>الصنف: </span>
            <strong>{form.name}</strong>
            <span style={{ margin: '0 12px', color: 'var(--muted)' }}>المتاح: </span>
            <strong style={{ color: 'var(--success)' }}>{fmtNum(form.stock)} {form.unit}</strong>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>المندوب</label>
            <select className="form-control" value={withdrawDelegateId} onChange={e => setWithdrawDelegateId(e.target.value)}>
              {delegates.filter(d => d.status === 'active').map(d => (
                <option key={d.id} value={d.id}>{d.name} — {d.zone}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              الكمية ({form.unit})
            </label>
            <input
              className="form-control"
              type="number"
              min={1}
              max={form.stock}
              placeholder="0"
              value={withdrawQty}
              onChange={e => setWithdrawQty(e.target.value)}
            />
          </div>
          {withdrawQty && +withdrawQty > 0 && (
            <div style={{ background: 'var(--warn-bg)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--warn)' }}>
              <i className="fa fa-info-circle" style={{ marginLeft: 6 }} />
              سيتم تحويل {withdrawQty} {form.unit} بقيمة {fmt(+withdrawQty * form.costPrice)} إلى مستودع المندوب
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
