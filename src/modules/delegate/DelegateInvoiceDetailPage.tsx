import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fmt, fmtDate } from '@/lib/format'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/store/auth.store'
import { useDelegateStore } from '@/store/delegate.store'
import { useCustomerStore } from '@/store/customer.store'
import { useInventoryStore } from '@/store/inventory.store'
import { useTreasuryStore } from '@/store/treasury.store'
import { useAppStore } from '@/store/app.store'
import { printFinancialReceipt } from '@/lib/print'
import { PRODUCTS } from '@/lib/mock-data/inventory'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: 'مدفوعة',  color: 'var(--success)', bg: 'var(--success-bg)' },
  pending: { label: 'معلقة',   color: 'var(--warn)',    bg: 'rgba(234,179,8,.1)' },
  overdue: { label: 'متأخرة',  color: 'var(--danger)',  bg: 'var(--danger-bg)' },
  confirmed: { label: 'مؤكدة', color: 'var(--success)', bg: 'var(--success-bg)' },
}

export default function DelegateInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const delegateId = user?.delegateId || ''
  const delegates = useDelegateStore(s => s.delegates)
  const payDelegateInvoice = useDelegateStore(s => s.payDelegateInvoice)
  const confirmDelegateInvoice = useDelegateStore(s => s.confirmDelegateInvoice)
  const customers = useCustomerStore(s => s.customers)
  const updateBalance = useCustomerStore(s => s.updateBalance)
  const addTreasuryTransaction = useTreasuryStore(s => s.addTransaction)

  const deductFromInventory = useInventoryStore(s => s.deductFromInventory)
  const co = useAppStore(s => s.company)
  const delegate = useMemo(() => delegates.find(d => d.id === delegateId), [delegates, delegateId])
  const invoice = useMemo(() => delegate?.invoices.find(inv => inv.id === id), [delegate, id])

  const [payAmount, setPayAmount] = useState('')
  const [showPayForm, setShowPayForm] = useState(false)

  function handleConfirmDelivery() {
    if (!invoice) return
    const result = confirmDelegateInvoice(delegateId, invoice.id)
    if (!result.success) {
      toast(`تعذر التأكيد: "${result.failedItem}" — الكمية غير كافية في المستودع`, 'danger')
      return
    }
    // Sync main inventory for catalog items
    const catalogItems = (invoice.items ?? []).filter((it: any) => it.productId && PRODUCTS.some((p: any) => p.id === it.productId))
    if (catalogItems.length > 0) deductFromInventory(catalogItems.map((it: any) => ({ productId: it.productId, qty: it.qty })))
    toast('تم تأكيد التسليم وخصم المخزون بنجاح', 'success')
  }

  if (!invoice) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
        <i className="fa fa-file-circle-xmark" style={{ fontSize: 48, marginBottom: 16, display: 'block', opacity: .3 }} />
        <div style={{ fontSize: 16, fontWeight: 700 }}>الفاتورة غير موجودة</div>
        <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/delegate/invoices')}>
          <i className="fa fa-arrow-right" /> رجوع للفواتير
        </button>
      </div>
    )
  }

  const paidAmount = invoice.paidAmount ?? (invoice.status === 'paid' ? invoice.total : 0)
  const remaining = Math.max(0, invoice.total - paidAmount)
  const statusMap: Record<string, { label: string; color: string; bg: string }> = { ...STATUS_MAP, confirmed: { label: 'مؤكدة', color: 'var(--success)', bg: 'var(--success-bg)' } }
  const st = statusMap[invoice.status] ?? STATUS_MAP.pending
  const isSale = invoice.type === 'sale'
  const customer = invoice.customerId ? customers.find(c => c.id === invoice.customerId) : null

  function handlePay() {
    if (!invoice) return
    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) { toast('أدخل مبلغاً صحيحاً', 'warn'); return }
    if (amount > remaining) { toast(`المبلغ أكبر من المتبقي (${fmt(remaining)})`, 'warn'); return }

    payDelegateInvoice(delegateId, invoice.id, amount)

    // Payment received → customer's debt decreases → balance increases toward 0
    if (isSale && invoice.customerId) {
      updateBalance(invoice.customerId, amount)
    }

    // Record in treasury as collection
    const ref = `COL-INV-${Date.now()}`
    addTreasuryTransaction({
      date: new Date().toISOString().slice(0, 10),
      description: `تحصيل فاتورة ${invoice.number} — ${invoice.party}`,
      type: 'in',
      category: 'collection',
      amount,
      account: 'cash',
      ref,
    })

    // Print receipt automatically
    printFinancialReceipt('in', amount, `تحصيل فاتورة ${invoice.number} — ${invoice.party}`, 'نقدي', 'تحصيل', ref)

    toast(`تم تسجيل دفعة ${fmt(amount)} وتحديث الخزنة بنجاح`, 'success')
    setPayAmount('')
    setShowPayForm(false)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/delegate/invoices')}>
          <i className="fa fa-arrow-right" /> رجوع
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace', color: 'var(--primary)' }}>
            {invoice.number}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {fmtDate(invoice.date)} — {isSale ? 'فاتورة بيع' : 'فاتورة شراء'}
          </div>
        </div>
        <span style={{ padding: '6px 16px', borderRadius: 20, fontWeight: 800, fontSize: 13, background: st.bg, color: st.color }}>
          {st.label}
        </span>
      </div>

      {/* Company + Delegate info banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'var(--primary)', color: '#fff', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, opacity: .6, marginBottom: 6 }}>البائع / الشركة</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{co.name || 'اسم الشركة'}</div>
          {co.nameEn && <div style={{ fontSize: 11, opacity: .7 }}>{co.nameEn}</div>}
          <div style={{ fontSize: 11, opacity: .7, marginTop: 6, lineHeight: 1.8 }}>
            {co.vat && <div>الرقم الضريبي: {co.vat}</div>}
            {co.phone && <div>ج: {co.phone}</div>}
            {co.address && <div>{co.address}، {co.city}</div>}
          </div>
        </div>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>المندوب المسؤول</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{delegate?.name || user?.name || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            <div>{delegate?.zone || ''}</div>
            <div>{delegate?.phone || ''}</div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, background: 'var(--success-bg)', color: 'var(--success)', padding: '3px 10px', borderRadius: 20, display: 'inline-block', fontWeight: 700 }}>
            {isSale ? 'فاتورة مبيعات' : 'فاتورة مشتريات'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Party info */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 12 }}>
              <i className="fa fa-user" style={{ marginLeft: 6 }} />
              {isSale ? 'بيانات العميل' : 'بيانات المورد'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {customer ? (
                <button className="btn btn-link" style={{ padding: 0, fontSize: 16, fontWeight: 800 }}
                  onClick={() => navigate('/erp/customers', { state: { openProfile: customer.id } })}>
                  {invoice.party}
                </button>
              ) : invoice.party}
            </div>
            {customer && (
              <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
                <span><i className="fa fa-phone" style={{ marginLeft: 4 }} />{customer.phone}</span>
                {customer.email && <span><i className="fa fa-envelope" style={{ marginLeft: 4 }} />{customer.email}</span>}
                <span style={{ fontWeight: 700, color: customer.balance < 0 ? 'var(--danger)' : 'var(--success)' }}>
                  الرصيد: {fmt(customer.balance)}
                </span>
              </div>
            )}
          </div>

          {/* Items table */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
              <i className="fa fa-list" style={{ marginLeft: 6 }} />الأصناف ({invoice.items.length})
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الصنف</th>
                    <th style={{ textAlign: 'center' }}>الكمية</th>
                    <th>سعر الوحدة</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--muted)', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.description}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.qty}</td>
                      <td>{fmt(item.price)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment history (if credit) */}
          {invoice.paymentMethod === 'credit' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 14 }}>
                <i className="fa fa-history" style={{ marginLeft: 6 }} />سجل الدفعات
              </div>
              {paidAmount > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--success-bg)', borderRadius: 8, marginBottom: 10 }}>
                  <i className="fa fa-check-circle" style={{ color: 'var(--success)', fontSize: 18 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>مدفوع {fmt(paidAmount)}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>من إجمالي {fmt(invoice.total)}</div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 16, color: 'var(--muted)', fontSize: 13 }}>
                  لا توجد دفعات مسجلة بعد
                </div>
              )}

              {remaining > 0 && (
                <>
                  {!showPayForm ? (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowPayForm(true)}>
                      <i className="fa fa-plus" /> تسجيل دفعة
                    </button>
                  ) : (
                    <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, border: '1px solid var(--border)', marginTop: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                        تسجيل دفعة — المتبقي: <span style={{ color: 'var(--danger)' }}>{fmt(remaining)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          className="form-control"
                          type="number"
                          placeholder={`المبلغ (حتى ${fmt(remaining)})`}
                          value={payAmount}
                          onChange={e => setPayAmount(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary btn-sm" onClick={handlePay}>
                          <i className="fa fa-check" /> تأكيد
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => { setShowPayForm(false); setPayAmount('') }}>
                          إلغاء
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        {[remaining, remaining / 2].filter(v => v > 0).map(v => (
                          <button key={v} className="btn btn-sm btn-outline" style={{ fontSize: 11 }}
                            onClick={() => setPayAmount(String(Math.round(v)))}>
                            {v === remaining ? 'دفع كامل' : 'نصف المبلغ'} ({fmt(v)})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Totals */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 14 }}>ملخص الفاتورة</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>الإجمالي شامل الضريبة</span>
                <span style={{ fontWeight: 600 }}>{fmt(invoice.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>ضريبة القيمة المضافة مستخرجة (15%)</span>
                <span style={{ fontWeight: 600, color: 'var(--warn)' }}>- {fmt(invoice.tax)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900 }}>
                <span>صافي قبل الضريبة</span>
                <span style={{ color: 'var(--primary)' }}>{fmt(invoice.subtotal)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900 }}>
                <span>المبلغ الإجمالي</span>
                <span style={{ color: 'var(--primary)' }}>{fmt(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment status */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 14 }}>طريقة الدفع</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10,
              background: invoice.paymentMethod === 'cash' ? 'rgba(34,197,94,.08)' : 'rgba(234,179,8,.08)',
              border: `1px solid ${invoice.paymentMethod === 'cash' ? 'rgba(34,197,94,.3)' : 'rgba(234,179,8,.3)'}`,
            }}>
              <i className={`fa ${invoice.paymentMethod === 'cash' ? 'fa-money-bill-wave' : 'fa-clock'}`}
                style={{ fontSize: 20, color: invoice.paymentMethod === 'cash' ? 'var(--success)' : 'var(--warn)' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{invoice.paymentMethod === 'cash' ? 'نقدي' : 'آجل'}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {invoice.paymentMethod === 'cash' ? 'مدفوع بالكامل' : `متبقي: ${fmt(remaining)}`}
                </div>
              </div>
            </div>

            {invoice.paymentMethod === 'credit' && (
              <div style={{ marginTop: 12 }}>
                {/* Progress bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                  <span>مدفوع</span>
                  <span>{Math.round((paidAmount / invoice.total) * 100)}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (paidAmount / invoice.total) * 100)}%`,
                    background: paidAmount >= invoice.total ? 'var(--success)' : 'var(--warn)',
                    borderRadius: 4,
                    transition: 'width .3s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(paidAmount)}</span>
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{fmt(remaining)} متبقي</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 10 }}>إجراءات</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Confirm delivery button — deducts from warehouse */}
              {isSale && invoice.status === 'pending' && (
                <button className="btn btn-primary btn-sm w-full" style={{ justifyContent: 'center' }} onClick={handleConfirmDelivery}>
                  <i className="fa fa-truck" /> تأكيد التسليم (خصم المخزون)
                </button>
              )}
              {/* Pay button — only for credit invoices */}
              {invoice.paymentMethod === 'credit' && remaining > 0 && !showPayForm && (
                <button className="btn btn-sm w-full" style={{ justifyContent: 'center', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }} onClick={() => setShowPayForm(true)}>
                  <i className="fa fa-coins" /> تسديد دفعة
                </button>
              )}
              <button className="btn btn-outline btn-sm w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('/delegate/invoices')}>
                <i className="fa fa-list" /> قائمة الفواتير
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
