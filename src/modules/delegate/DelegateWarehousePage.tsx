import { useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt, fmtNum } from '@/lib/format'
import { useAuthStore } from '@/store/auth.store'
import { useDelegateStore } from '@/store/delegate.store'

export default function DelegateWarehousePage() {
  const user = useAuthStore(s => s.user)
  const delegateId = user?.delegateId || ''
  const delegates = useDelegateStore(s => s.delegates)
  const delegate = useMemo(() => delegates.find(d => d.id === delegateId), [delegates, delegateId])
  const warehouse = delegate?.warehouse.filter(w => w.status === 'in-stock') ?? []

  const totalQty = warehouse.reduce((s, w) => s + w.qty, 0)
  const totalValue = warehouse.reduce((s, w) => s + w.qty * w.costPrice, 0)

  return (
    <>
      <PageHeader title="مستودعي" subtitle="البضاعة المتاحة في عهدتك" />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card dark">
          <div className="stat-label">إجمالي الأصناف</div>
          <div className="stat-value">{warehouse.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">إجمالي الكميات</div>
          <div className="stat-value">{fmtNum(totalQty)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">القيمة الإجمالية</div>
          <div className="stat-value">{fmt(totalValue)}</div>
        </div>
      </div>

      {/* Desktop: Table */}
      <div className="desktop-only">
        <Card title="بضاعة العهدة">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>الصنف</th><th>الكود</th><th>الكمية</th><th>سعر التكلفة</th><th>القيمة</th><th>المصدر</th></tr>
              </thead>
              <tbody>
                {warehouse.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 600 }}>{w.productName}</td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--blue)' }}>{w.productSku}</span></td>
                    <td style={{ fontWeight: 700 }}>{fmtNum(w.qty)}</td>
                    <td>{fmt(w.costPrice)}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(w.qty * w.costPrice)}</td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: w.source === 'company' ? 'var(--blue-light)' : 'var(--success-bg)', color: w.source === 'company' ? 'var(--blue)' : 'var(--success)' }}>
                        {w.source === 'company' ? 'من الشركة' : 'مشترى'}
                      </span>
                    </td>
                  </tr>
                ))}
                {warehouse.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>المستودع فارغ</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg)', fontWeight: 800 }}>
                  <td colSpan={5}>الإجمالي</td>
                  <td>{fmt(totalValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile: Cards */}
      <div className="mobile-card-list">
        {warehouse.map(w => (
          <div key={w.id} className="mobile-card">
            <div className="mobile-card-row">
              <span className="mobile-card-label">الصنف</span>
              <span style={{ fontWeight: 600 }}>{w.productName}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">الكود</span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--blue)' }}>{w.productSku}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">الكمية</span>
              <span className="mobile-card-value">{fmtNum(w.qty)}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">سعر التكلفة</span>
              <span>{fmt(w.costPrice)}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">القيمة</span>
              <span className="mobile-card-value">{fmt(w.qty * w.costPrice)}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-label">المصدر</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: w.source === 'company' ? 'var(--blue-light)' : 'var(--success-bg)', color: w.source === 'company' ? 'var(--blue)' : 'var(--success)' }}>
                {w.source === 'company' ? 'من الشركة' : 'مشترى'}
              </span>
            </div>
          </div>
        ))}
        {warehouse.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>المستودع فارغ</div>
        )}
      </div>
    </>
  )
}
