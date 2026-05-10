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

  // Aggregate by productId — المستلم، المباع، المتوفر
  const rows = useMemo(() => {
    const allWarehouse = delegate?.warehouse ?? []
    const invoices = delegate?.invoices ?? []

    // Step 1: current available qty from warehouse (already has confirmed-sale deductions applied)
    const grouped: Record<string, { name: string; sku: string; cost: number; available: number }> = {}
    allWarehouse.forEach((w: any) => {
      const key = w.productId || w.productName
      if (!grouped[key]) grouped[key] = { name: w.productName, sku: w.productSku || '', cost: w.costPrice, available: 0 }
      grouped[key].available += w.qty
    })

    // Step 2: sold qty from confirmed/paid sale invoices
    const soldQty: Record<string, number> = {}
    invoices
      .filter((inv: any) => inv.type === 'sale' && (inv.status === 'confirmed' || inv.status === 'paid'))
      .forEach((inv: any) => {
        (inv.items || []).forEach((it: any) => {
          if (it.productId) soldQty[it.productId] = (soldQty[it.productId] || 0) + (it.qty || 0)
        })
      })

    // Step 3: include fully-sold products (no longer in warehouse)
    Object.keys(soldQty).forEach(productId => {
      if (!grouped[productId]) {
        const sample = invoices.flatMap((inv: any) => inv.items || []).find((it: any) => it.productId === productId)
        if (sample) grouped[productId] = { name: sample.description, sku: '', cost: sample.price, available: 0 }
      }
    })

    return Object.entries(grouped).map(([key, r]) => {
      const sold = soldQty[key] || 0
      return { key, ...r, sold, received: r.available + sold }
    })
  }, [delegate])

  const totalReceived = rows.reduce((s, r) => s + r.received, 0)
  const totalSold = rows.reduce((s, r) => s + r.sold, 0)
  const totalAvailable = rows.reduce((s, r) => s + r.available, 0)
  const totalValue = rows.reduce((s, r) => s + r.available * r.cost, 0)

  return (
    <>
      <PageHeader title="مستودعي" subtitle="البضاعة المتاحة في عهدتك" />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card dark">
          <div className="stat-label">إجمالي الأصناف</div>
          <div className="stat-value">{rows.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">المستلم</div>
          <div className="stat-value">{fmtNum(totalReceived)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: 'var(--danger)' }}>المباع</div>
          <div className="stat-value" style={{ color: totalSold > 0 ? 'var(--danger)' : undefined }}>{fmtNum(totalSold)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: 'var(--success)' }}>المتوفر</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{fmtNum(totalAvailable)}</div>
        </div>
      </div>

      <Card title={`مستودعي — قيمة المتوفر: ${fmt(totalValue)}`}>
        {/* Desktop */}
        <div className="desktop-only">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الصنف</th>
                  <th style={{ textAlign: 'center' }}>المستلم</th>
                  <th style={{ textAlign: 'center', color: 'var(--danger)' }}>المباع</th>
                  <th style={{ textAlign: 'center', color: 'var(--success)' }}>المتوفر</th>
                  <th>سعر التكلفة</th>
                  <th>قيمة المتوفر</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.key}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{fmtNum(r.received)}</td>
                    <td style={{ textAlign: 'center', color: 'var(--danger)', fontWeight: 700 }}>{r.sold > 0 ? fmtNum(r.sold) : '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: r.available === 0 ? 'var(--danger)' : 'var(--success)' }}>{fmtNum(r.available)}</td>
                    <td>{fmt(r.cost)}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(r.available * r.cost)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>المستودع فارغ</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg)', fontWeight: 800 }}>
                  <td>الإجمالي</td>
                  <td style={{ textAlign: 'center' }}>{fmtNum(totalReceived)}</td>
                  <td style={{ textAlign: 'center', color: 'var(--danger)' }}>{fmtNum(totalSold)}</td>
                  <td style={{ textAlign: 'center', color: 'var(--success)' }}>{fmtNum(totalAvailable)}</td>
                  <td></td>
                  <td>{fmt(totalValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Mobile */}
        <div className="mobile-card-list">
          {rows.map(r => (
            <div key={r.key} className="mobile-card">
              <div className="mobile-card-row">
                <span style={{ fontWeight: 700 }}>{r.name}</span>
                <span style={{ fontWeight: 800, color: r.available === 0 ? 'var(--danger)' : 'var(--success)' }}>متوفر: {fmtNum(r.available)}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">المستلم</span>
                <span>{fmtNum(r.received)}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label" style={{ color: 'var(--danger)' }}>المباع</span>
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{r.sold > 0 ? fmtNum(r.sold) : '—'}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">سعر التكلفة</span>
                <span>{fmt(r.cost)}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">قيمة المتوفر</span>
                <span className="mobile-card-value">{fmt(r.available * r.cost)}</span>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>المستودع فارغ</div>
          )}
        </div>
      </Card>
    </>
  )
}
