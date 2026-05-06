import { useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt, fmtNum } from '@/lib/format'
import RevenueChart from '@/components/charts/RevenueChart'
import LineAreaChart from '@/components/charts/LineAreaChart'
import { useInventoryStore } from '@/store/inventory.store'
import { useInvoiceStore } from '@/store/invoice.store'
import { useExpenseStore } from '@/store/expense.store'
import { useDelegateStore } from '@/store/delegate.store'

export default function AnalyticsPage() {
  const products = useInventoryStore(s => s.products)
  const invoices = useInvoiceStore(s => s.invoices)
  const expenses = useExpenseStore(s => s.expenses)
  const delegates = useDelegateStore(s => s.delegates)

  // Build real monthly data from invoices + expenses
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; revenue: number; expenses: number }> = {}
    invoices.filter(inv => inv.status !== 'draft').forEach(inv => {
      const key = inv.date.slice(0, 7)
      if (!months[key]) months[key] = { month: key, revenue: 0, expenses: 0 }
      months[key].revenue += inv.total
    })
    // Also add delegate sales
    delegates.forEach(d => {
      d.invoices.filter(inv => inv.type === 'sale' && (inv.status === 'paid' || inv.status === 'confirmed')).forEach(inv => {
        const key = inv.date.slice(0, 7)
        if (!months[key]) months[key] = { month: key, revenue: 0, expenses: 0 }
        months[key].revenue += inv.total
      })
    })
    expenses.filter(e => e.status === 'approved').forEach(exp => {
      const key = exp.date.slice(0, 7)
      if (!months[key]) months[key] = { month: key, revenue: 0, expenses: 0 }
      months[key].expenses += exp.amount
    })
    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(d => ({
        ...d,
        month: new Date(d.month + '-01').toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }),
      }))
      .slice(-12)
  }, [invoices, expenses, delegates])

  // Real top customers from invoices
  const topCustomers = useMemo(() => {
    const map: Record<string, { name: string; revenue: number }> = {}
    invoices.filter(inv => inv.status !== 'draft').forEach(inv => {
      const key = inv.customerId || inv.customer
      if (!map[key]) map[key] = { name: inv.customer, revenue: 0 }
      map[key].revenue += inv.total
    })
    // Add delegate customers
    delegates.forEach(d => {
      d.invoices.filter(inv => inv.type === 'sale').forEach(inv => {
        const key = inv.customerId || inv.party
        if (!map[key]) map[key] = { name: inv.party, revenue: 0 }
        map[key].revenue += inv.total
      })
    })
    const sorted = Object.values(map).sort((a, b) => b.revenue - a.revenue)
    const totalRev = sorted.reduce((s, c) => s + c.revenue, 0)
    return sorted.slice(0, 5).map(c => ({
      name: c.name,
      revenue: c.revenue,
      pct: totalRev > 0 ? Math.round(c.revenue / totalRev * 1000) / 10 : 0,
    }))
  }, [invoices, delegates])

  const { totalRevenue, avgMonthly, bestMonth, ytdGrowth, avgMargin } = useMemo(() => {
    const total = monthlyData.reduce((s, d) => s + d.revenue, 0)
    const avg = monthlyData.length > 0 ? Math.round(total / monthlyData.length) : 0
    const best = monthlyData.reduce((max, d) => d.revenue > max.revenue ? d : max, monthlyData[0] ?? { month: '-', revenue: 0, expenses: 0 })
    const first = monthlyData[0]?.revenue ?? 1
    const last = monthlyData[monthlyData.length - 1]?.revenue ?? 0
    const growth = first > 0 ? Math.round(((last - first) / first) * 100) : 0
    const margins = monthlyData.map(d => d.revenue > 0 ? ((d.revenue - d.expenses) / d.revenue) * 100 : 0)
    const margin = margins.length > 0 ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length) : 0
    return { totalRevenue: total, avgMonthly: avg, bestMonth: best.month, ytdGrowth: growth, avgMargin: margin }
  }, [monthlyData])

  // Calculate COGS and profitability per product
  const productProfitability = useMemo(() => {
    return products.map(product => {
      let soldQty = 0
      let revenue = 0
      invoices.forEach(inv => {
        if (inv.status === 'draft') return
        inv.items.forEach(it => {
          if (it.description === product.name || it.description === product.sku || it.productId === product.id) {
            soldQty += it.qty
            revenue += it.total
          }
        })
      })

      const cogs = soldQty * product.costPrice
      const profit = revenue - cogs
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0

      let delegateQty = 0
      delegates.forEach(d => {
        d.warehouse.forEach(w => {
          if (w.productId === product.id && w.status === 'in-stock') {
            delegateQty += w.qty
          }
        })
      })

      const remainingQty = product.stock + delegateQty
      const remainingCost = remainingQty * product.costPrice

      return {
        id: product.id,
        name: product.name,
        soldQty,
        revenue,
        cogs,
        profit,
        margin,
        remainingQty,
        remainingCost,
        unit: product.unit
      }
    }).sort((a, b) => b.profit - a.profit)
  }, [products, invoices, delegates])

  const monthlyGrowth = useMemo(() => {
    return monthlyData.map((d, i) => ({
      ...d,
      profit: d.revenue - d.expenses,
      margin: d.revenue > 0 ? Math.round(((d.revenue - d.expenses) / d.revenue) * 100) : 0,
      growth: i === 0 ? 0 : monthlyData[i - 1].revenue > 0
        ? Math.round(((d.revenue - monthlyData[i - 1].revenue) / monthlyData[i - 1].revenue) * 100)
        : 0,
    }))
  }, [monthlyData])

  // Channel breakdown computed from invoices vs delegate invoices
  const channelData = useMemo(() => {
    const direct = invoices.filter(i => i.status !== 'draft').reduce((s, i) => s + i.total, 0)
    const delegate = delegates.reduce((s, d) => s + d.invoices.filter(i => i.type === 'sale').reduce((ss, i) => ss + i.total, 0), 0)
    const total = direct + delegate || 1
    return [
      { label: 'فواتير مباشرة', value: Math.round(direct / total * 100), color: '#2563EB' },
      { label: 'مناديب', value: Math.round(delegate / total * 100), color: '#10B981' },
    ].filter(c => c.value > 0)
  }, [invoices, delegates])

  return (
    <>
      <PageHeader title="التحليلات المتقدمة" subtitle="رؤى تفصيلية لأداء الأعمال" />

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'إيراد السنة',    value: fmt(totalRevenue),           icon: 'fa-dollar-sign',     color: '#2563EB' },
          { label: 'متوسط شهري',     value: fmt(avgMonthly), icon: 'fa-chart-bar',   color: '#10B981' },
          { label: 'أعلى شهر',       value: bestMonth,                    icon: 'fa-trophy',           color: '#D97706' },
          { label: 'نمو YTD',         value: `${ytdGrowth > 0 ? '+' : ''}${ytdGrowth}%`,                   icon: 'fa-arrow-trend-up',  color: '#10B981' },
          { label: 'هامش الربح',      value: `${avgMargin}%`,                    icon: 'fa-percent',          color: '#7C3AED' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <i className={`fa ${s.icon}`} style={{ color: s.color, fontSize: 16 }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid-2 mb-6">
        <Card title="الإيراد والمصروفات" action={<span style={{ fontSize: 12, color: 'var(--muted)' }}>آخر 12 شهر — بيانات حقيقية</span>}>
          <RevenueChart data={monthlyData} />
        </Card>
        <Card title="نمو صافي الربح" action={<span style={{ fontSize: 12, color: ytdGrowth >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{ytdGrowth >= 0 ? '▲' : '▼'} {Math.abs(ytdGrowth)}%</span>}>
          <LineAreaChart data={monthlyGrowth} dataKey="profit" label="الربح" color="var(--success)" />
        </Card>
      </div>

      <div className="grid-2 mb-6">
        {/* Top customers */}
        <Card title="أفضل العملاء إيراداً" action={<span style={{ fontSize: 11, color: 'var(--success)' }}>بيانات حقيقية</span>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>
            {topCustomers.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 13 }}>لا توجد بيانات عملاء بعد</div>
            )}
            {topCustomers.map((c, i) => (
              <div key={c.name + i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--muted)', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, flexShrink: 0, marginRight: 8 }}>{fmt(c.revenue)}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.pct}%`, background: 'var(--blue)', borderRadius: 3 }} />
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>{c.pct}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top products (Dynamic) */}
        <Card title="أكثر المنتجات ربحية">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {productProfitability.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: 13 }}>
                لا توجد بيانات مبيعات حالياً
              </div>
            )}
            {productProfitability.slice(0, 5).map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--muted)', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{fmtNum(p.soldQty)} {p.unit} مباعة</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--success)' }}>{fmt(p.profit)}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>صافي الربح</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* COGS Detailed Table */}
      <Card title="تحليل ربحية المنتجات (تكلفة المبيعات والمخزون)" action={<span style={{ fontSize: 12, color: 'var(--muted)' }}>حسابات حية</span>} style={{ marginBottom: 24 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th style={{ textAlign: 'center' }}>الكمية المباعة</th>
                <th>تكلفة المبيعات</th>
                <th>الإيرادات</th>
                <th>صافي الربح</th>
                <th style={{ textAlign: 'center' }}>الكمية المتبقية</th>
                <th>تكلفة المتبقي (أصول)</th>
              </tr>
            </thead>
            <tbody>
              {productProfitability.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>لا توجد بيانات مبيعات حالياً</td>
                </tr>
              )}
              {productProfitability.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{fmtNum(p.soldQty)} <span style={{ fontSize: 10, color: 'var(--muted)' }}>{p.unit}</span></td>
                  <td style={{ color: 'var(--danger)' }}>{fmt(p.cogs)}</td>
                  <td style={{ fontWeight: 700 }}>{fmt(p.revenue)}</td>
                  <td style={{ fontWeight: 800, color: p.profit > 0 ? 'var(--success)' : p.profit < 0 ? 'var(--danger)' : 'var(--muted)' }}>
                    {p.profit > 0 ? '+' : ''}{fmt(p.profit)}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--blue)' }}>{fmtNum(p.remainingQty)} <span style={{ fontSize: 10, color: 'var(--muted)' }}>{p.unit}</span></td>
                  <td style={{ color: 'var(--warn)' }}>{fmt(p.remainingCost)}</td>
                </tr>
              ))}
            </tbody>
            {productProfitability.length > 0 && (
              <tfoot>
                <tr style={{ background: 'var(--bg)', fontWeight: 800 }}>
                  <td>الإجمالي</td>
                  <td style={{ textAlign: 'center' }}>{fmtNum(productProfitability.reduce((s, p) => s + p.soldQty, 0))}</td>
                  <td style={{ color: 'var(--danger)' }}>{fmt(productProfitability.reduce((s, p) => s + p.cogs, 0))}</td>
                  <td>{fmt(productProfitability.reduce((s, p) => s + p.revenue, 0))}</td>
                  <td style={{ color: 'var(--success)' }}>{fmt(productProfitability.reduce((s, p) => s + p.profit, 0))}</td>
                  <td style={{ textAlign: 'center', color: 'var(--blue)' }}>{fmtNum(productProfitability.reduce((s, p) => s + p.remainingQty, 0))}</td>
                  <td style={{ color: 'var(--warn)' }}>{fmt(productProfitability.reduce((s, p) => s + p.remainingCost, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* Channel breakdown */}
      <Card title="توزيع قنوات البيع" action={<span style={{ fontSize: 11, color: 'var(--success)' }}>بيانات حقيقية</span>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, padding: '8px 0' }}>
          {channelData.map(ch => (
            <div key={ch.label} style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 80 80" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke={ch.color} strokeWidth="8"
                    strokeDasharray={`${ch.value * 2.01} 201`} strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 16, fontWeight: 800, color: ch.color }}>{ch.value}%</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{ch.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Monthly table */}
      <Card title="الأداء الشهري التفصيلي" action={<span style={{ fontSize: 12, color: 'var(--success)' }}>بيانات حقيقية من الفواتير</span>} style={{ marginTop: 20 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الشهر</th>
                <th>الإيراد</th>
                <th>المصروفات</th>
                <th>صافي الربح</th>
                <th>هامش الربح</th>
                <th>النمو</th>
              </tr>
            </thead>
            <tbody>
              {monthlyGrowth.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد بيانات بعد — ابدأ بإنشاء فواتير</td></tr>
              )}
              {monthlyGrowth.map(d => (
                <tr key={d.month}>
                  <td style={{ fontWeight: 600 }}>{d.month}</td>
                  <td style={{ fontWeight: 700 }}>{fmt(d.revenue)}</td>
                  <td style={{ color: 'var(--danger)' }}>{fmt(d.expenses)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(d.profit)}</td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 700, color: d.margin >= 60 ? 'var(--success)' : 'var(--warn)' }}>{d.margin}%</span>
                  </td>
                  <td>
                    {d.growth !== 0 && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: d.growth > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {d.growth > 0 ? '▲' : '▼'} {Math.abs(d.growth)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
