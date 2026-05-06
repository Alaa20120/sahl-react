import { useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt, fmtDate } from '@/lib/format'
import { useAuthStore } from '@/store/auth.store'
import { useDelegateStore } from '@/store/delegate.store'
import { useCustomerStore } from '@/store/customer.store'

export default function DelegateCustomersPage() {
  const user = useAuthStore(s => s.user)
  const delegateId = user?.delegateId || ''
  const delegates = useDelegateStore(s => s.delegates)
  const allCustomers = useCustomerStore(s => s.customers)
  const delegate = useMemo(() => delegates.find(d => d.id === delegateId), [delegates, delegateId])

  // Build customer list from delegate invoices + cross-reference with customer store
  const customers = useMemo(() => {
    if (!delegate) return []
    const map: Record<string, { id: string; name: string; phone: string; totalSales: number; invoiceCount: number; lastDate: string; customerId?: string }> = {}
    delegate.invoices.filter(inv => inv.type === 'sale').forEach(inv => {
      const key = inv.customerId || inv.party
      if (!map[key]) {
        const stored = inv.customerId ? allCustomers.find(c => c.id === inv.customerId) : null
        map[key] = { id: key, name: inv.party, phone: stored?.phone || '—', totalSales: 0, invoiceCount: 0, lastDate: inv.date, customerId: inv.customerId }
      }
      map[key].totalSales += inv.total
      map[key].invoiceCount += 1
      if (inv.date > map[key].lastDate) map[key].lastDate = inv.date
    })
    return Object.values(map).sort((a, b) => b.totalSales - a.totalSales)
  }, [delegate, allCustomers])

  const totalSales = customers.reduce((s, c) => s + c.totalSales, 0)

  return (
    <>
      <PageHeader
        title="عملائي"
        subtitle={`${customers.length} عميل — إجمالي المبيعات ${fmt(totalSales)}`}
      />

      {/* Desktop: Table */}
      <div className="desktop-only">
        <Card title="العملاء الذين تعاملت معهم">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>العميل</th><th>الهاتف</th><th>عدد الفواتير</th>
                  <th>إجمالي المبيعات</th><th>آخر تعامل</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                    لا توجد بيانات عملاء بعد — ابدأ بإنشاء فواتير بيع
                  </td></tr>
                )}
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      {c.customerId && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{c.customerId}</div>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.phone}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.invoiceCount}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(c.totalSales)}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(c.lastDate)}</td>
                  </tr>
                ))}
              </tbody>
              {customers.length > 0 && (
                <tfoot>
                  <tr style={{ fontWeight: 800, background: 'var(--bg)' }}>
                    <td colSpan={3}>الإجمالي ({customers.length} عميل)</td>
                    <td style={{ color: 'var(--success)' }}>{fmt(totalSales)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile: Cards */}
      <div className="mobile-card-list">
        {customers.map(c => (
          <div key={c.id} className="mobile-card">
            <div className="mobile-card-row">
              <span className="mobile-card-label">العميل</span>
              <span style={{ fontWeight: 600 }}>{c.name}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">الهاتف</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, direction: 'ltr' }}>{c.phone}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">عدد الفواتير</span>
              <span>{c.invoiceCount}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">إجمالي المبيعات</span>
              <span className="mobile-card-value">{fmt(c.totalSales)}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">آخر تعامل</span>
              <span>{fmtDate(c.lastDate)}</span>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            لا توجد بيانات عملاء بعد
          </div>
        )}
      </div>
    </>
  )
}
