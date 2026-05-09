import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt, fmtDate } from '@/lib/format'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/store/auth.store'
import { useDelegateStore } from '@/store/delegate.store'
import { useInventoryStore } from '@/store/inventory.store'
import { PRODUCTS } from '@/lib/mock-data/inventory'

const INV_STATUS: Record<string, { label: string; css: string }> = {
  paid:      { label: 'مدفوعة',   css: 'status-active' },
  confirmed: { label: 'مؤكدة',    css: 'status-active' },
  pending:   { label: 'معلقة',    css: 'status-pending' },
  overdue:   { label: 'متأخرة',   css: 'status-inactive' },
}

export default function DelegateInvoicesPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const delegateId = user?.delegateId || ''
  const delegates = useDelegateStore(s => s.delegates)
  const confirmDelegateInvoice = useDelegateStore(s => s.confirmDelegateInvoice)
  const deductFromInventory = useInventoryStore(s => s.deductFromInventory)
  const delegate = useMemo(() => delegates.find(d => d.id === delegateId), [delegates, delegateId])
  const invoices = delegate?.invoices ?? []

  const [filter, setFilter] = useState<'all' | 'sale' | 'purchase'>('all')
  const filtered = invoices.filter(inv => filter === 'all' || inv.type === filter)

  async function handleConfirm(id: string) {
    const result = confirmDelegateInvoice(delegateId, id)
    if (!result.success) {
      toast(`تعذر التأكيد: "${result.failedItem}" — الكمية غير كافية في المستودع`, 'danger')
      return
    }
    // Sync main inventory
    const inv = invoices.find(i => i.id === id)
    try {
      if (inv) {
        const catalogItems = (inv.items ?? []).filter((it: any) => it.productId && PRODUCTS.some((p: any) => p.id === it.productId))
        if (catalogItems.length > 0) await deductFromInventory(catalogItems.map((it: any) => ({ productId: it.productId, qty: it.qty })))
      }
      toast('تم تأكيد التسليم وخصم المخزون', 'success')
    } catch (err: any) {
      toast(`خطأ في خصم المخزون: ${err?.message || 'حاول مرة أخرى'}`, 'danger')
    }
  }

  return (
    <>
      <PageHeader title="فواتيري" subtitle={`${invoices.length} فاتورة — متابعة فواتير البيع والشراء`} />

      <div className="card mb-4">
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[{ key: 'all' as const, label: 'الكل' }, { key: 'sale' as const, label: 'مبيعات' }, { key: 'purchase' as const, label: 'مشتريات' }].map(f => (
                <button key={f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f.key)}>{f.label}</button>
              ))}
            </div>
            <Link to="/delegate/home" className="btn btn-primary btn-sm"><i className="fa fa-plus" /> فاتورة جديدة</Link>
          </div>
        </div>
      </div>

      {/* Desktop: Table */}
      <div className="desktop-only">
        <Card title={`الفواتير (${filtered.length})`}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>الرقم</th><th>التاريخ</th><th>النوع</th><th>الطرف</th><th>الإجمالي</th><th>الدفع</th><th>الحالة</th><th>إجراءات</th></tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const st = INV_STATUS[inv.status] ?? { label: inv.status, css: '' }
                  const paidAmt = inv.paidAmount ?? (inv.status === 'paid' ? inv.total : 0)
                  const remaining = Math.max(0, inv.total - paidAmt)
                  return (
                    <tr key={inv.id}>
                      <td>
                        <button onClick={() => navigate(`/delegate/invoices/${inv.id}`)}
                          style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                          {inv.number}
                        </button>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(inv.date)}</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: inv.type === 'sale' ? 'var(--success-bg)' : 'var(--blue-light)', color: inv.type === 'sale' ? 'var(--success)' : 'var(--blue)' }}>
                          {inv.type === 'sale' ? 'بيع' : 'شراء'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{inv.party}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                      <td>
                        {inv.paymentMethod === 'credit' && (
                          <span style={{ fontSize: 11, color: remaining > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                            {remaining > 0 ? `متبقي ${fmt(remaining)}` : 'مسدد'}
                          </span>
                        )}
                        {inv.paymentMethod === 'cash' && <span style={{ fontSize: 11, color: 'var(--success)' }}>نقدي</span>}
                      </td>
                      <td><span className={`status ${st.css}`}>{st.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {inv.type === 'sale' && inv.status === 'pending' && (
                            <button className="btn btn-sm btn-primary" onClick={() => handleConfirm(inv.id)} title="تأكيد التسليم وخصم المخزون">
                              <i className="fa fa-truck" /> تأكيد التسليم
                            </button>
                          )}
                          {inv.paymentMethod === 'credit' && remaining > 0 && (
                            <button className="btn btn-sm btn-outline" onClick={() => navigate(`/delegate/invoices/${inv.id}`)} title="تسديد دفعة">
                              <i className="fa fa-coins" /> دفعة
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد فواتير</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile: Cards */}
      <div className="mobile-card-list">
        {filtered.map(inv => {
          const st = INV_STATUS[inv.status] ?? { label: inv.status, css: '' }
          const paidAmt = inv.paidAmount ?? (inv.status === 'paid' ? inv.total : 0)
          const remaining = Math.max(0, inv.total - paidAmt)
          return (
            <div key={inv.id} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">رقم الفاتورة</span>
                <button onClick={() => navigate(`/delegate/invoices/${inv.id}`)}
                  style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                  {inv.number}
                </button>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">التاريخ</span>
                <span>{fmtDate(inv.date)}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">النوع</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: inv.type === 'sale' ? 'var(--success-bg)' : 'var(--blue-light)', color: inv.type === 'sale' ? 'var(--success)' : 'var(--blue)' }}>
                  {inv.type === 'sale' ? 'بيع' : 'شراء'}
                </span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">الطرف</span>
                <span style={{ fontWeight: 600 }}>{inv.party}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">الإجمالي</span>
                <span className="mobile-card-value">{fmt(inv.total)}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">الحالة</span>
                <span className={`status ${st.css}`}>{st.label}</span>
              </div>
              <div className="mobile-card-row" style={{ paddingTop: 8 }}>
                {inv.type === 'sale' && inv.status === 'pending' && (
                  <button className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleConfirm(inv.id)}>
                    <i className="fa fa-truck" /> تأكيد التسليم
                  </button>
                )}
                {inv.paymentMethod === 'credit' && remaining > 0 && (
                  <button className="btn btn-sm btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate(`/delegate/invoices/${inv.id}`)}>
                    <i className="fa fa-coins" /> دفعة
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>لا توجد فواتير</div>
        )}
      </div>
    </>
  )
}
