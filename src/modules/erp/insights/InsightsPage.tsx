import { useState, useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import { fmt, fmtNum } from '@/lib/format'
import RevenueChart from '@/components/charts/RevenueChart'
import LineAreaChart from '@/components/charts/LineAreaChart'
import { toast } from '@/lib/toast'
import { useInvoiceStore } from '@/store/invoice.store'
import { useExpenseStore } from '@/store/expense.store'
import { usePurchaseStore } from '@/store/purchase.store'
import { useInventoryStore } from '@/store/inventory.store'
import { useTreasuryStore } from '@/store/treasury.store'
import { useCustomerStore } from '@/store/customer.store'
import { useDelegateStore } from '@/store/delegate.store'

type InsightTab = 'financial' | 'analytics' | 'budget'

// Budget targets (loaded from Supabase in future)
const BUDGET_TARGETS: Record<string, number> = {}
const REVENUE_TARGET = 0

export default function InsightsPage() {
  const [tab, setTab] = useState<InsightTab>('financial')
  const [reportSub, setReportSub] = useState<'pl' | 'balance' | 'cashflow' | 'vat'>('pl')

  const invoices = useInvoiceStore(s => s.invoices)
  const expenses = useExpenseStore(s => s.expenses)
  const purchases = usePurchaseStore(s => s.purchases)
  const products = useInventoryStore(s => s.products)
  const accounts = useTreasuryStore(s => s.accounts)
  const customers = useCustomerStore(s => s.customers)
  const delegates = useDelegateStore(s => s.delegates)

  // ── Core computations ──────────────────────────────────────────────────────
  const core = useMemo(() => {
    const paid = invoices.filter(i => i.status !== 'draft')
    const adminRevenue = paid.reduce((s, i) => s + i.amount, 0)
    const adminTax = paid.reduce((s, i) => s + i.tax, 0)
    const delegateRevenue = delegates.reduce((s, d) =>
      s + d.invoices.filter(i => i.type === 'sale').reduce((ss, i) => ss + i.subtotal, 0), 0)
    const delegateTax = delegates.reduce((s, d) =>
      s + d.invoices.filter(i => i.type === 'sale').reduce((ss, i) => ss + i.tax, 0), 0)
    const totalRevenue = adminRevenue + delegateRevenue
    const totalTax = adminTax + delegateTax
    const approvedExp = expenses.filter(e => e.status === 'approved')
    const totalExpenses = approvedExp.reduce((s, e) => s + e.amount, 0)
    const totalPurchases = purchases.reduce((s, p) => s + p.amount, 0)
    const purchaseTax = purchases.reduce((s, p) => s + (p.tax ?? Math.max(0, p.total - p.amount)), 0)
    const cashBalance = accounts.reduce((s, a) => s + a.balance, 0)
    const inventoryValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0)
    const grossProfit = totalRevenue - totalPurchases
    const netProfit = grossProfit - totalExpenses
    const vatNet = Math.max(0, totalTax - purchaseTax)

    const custMap: Record<string, { name: string; revenue: number }> = {}
    paid.forEach(inv => {
      const k = inv.customerId || inv.customer
      if (!custMap[k]) custMap[k] = { name: inv.customer, revenue: 0 }
      custMap[k].revenue += inv.total
    })
    delegates.forEach(d => d.invoices.filter(i => i.type === 'sale').forEach(i => {
      const k = i.customerId || i.party
      if (!custMap[k]) custMap[k] = { name: i.party, revenue: 0 }
      custMap[k].revenue += i.total
    }))
    const topCustomers = Object.values(custMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    const totalCustRev = topCustomers.reduce((s, c) => s + c.revenue, 0)

    return { totalRevenue, adminRevenue, delegateRevenue, totalTax, delegateTax, totalExpenses, totalPurchases, purchaseTax, cashBalance, inventoryValue, grossProfit, netProfit, vatNet, topCustomers, totalCustRev }
  }, [invoices, expenses, purchases, products, accounts, delegates])

  // ── Monthly data ───────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; revenue: number; expenses: number }> = {}
    invoices.filter(i => i.status !== 'draft').forEach(i => {
      const k = i.date.slice(0, 7)
      if (!months[k]) months[k] = { month: k, revenue: 0, expenses: 0 }
      months[k].revenue += i.amount
    })
    delegates.forEach(d => d.invoices.filter(i => i.type === 'sale').forEach(i => {
      const k = i.date.slice(0, 7)
      if (!months[k]) months[k] = { month: k, revenue: 0, expenses: 0 }
      months[k].revenue += i.subtotal
    }))
    expenses.filter(e => e.status === 'approved').forEach(e => {
      const k = e.date.slice(0, 7)
      if (!months[k]) months[k] = { month: k, revenue: 0, expenses: 0 }
      months[k].expenses += e.amount
    })
    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(d => ({ ...d, month: new Date(d.month + '-01').toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }) }))
      .slice(-12)
  }, [invoices, expenses, delegates])

  const monthlyGrowth = useMemo(() => monthlyData.map((d, i) => ({
    ...d,
    profit: d.revenue - d.expenses,
    margin: d.revenue > 0 ? Math.round((d.revenue - d.expenses) / d.revenue * 100) : 0,
    growth: i === 0 || !monthlyData[i - 1].revenue ? 0 : Math.round((d.revenue - monthlyData[i - 1].revenue) / monthlyData[i - 1].revenue * 100),
  })), [monthlyData])

  // ── VAT by month ───────────────────────────────────────────────────────────
  const vatRows = useMemo(() => {
    const months: Record<string, { period: string; sales: number; vat_out: number; purchases: number; vat_in: number }> = {}
    invoices.filter(i => i.status !== 'draft').forEach(i => {
      const k = i.date.slice(0, 7)
      if (!months[k]) months[k] = { period: k, sales: 0, vat_out: 0, purchases: 0, vat_in: 0 }
      months[k].sales += i.amount; months[k].vat_out += i.tax
    })
    purchases.forEach(p => {
      const k = p.date.slice(0, 7)
      if (!months[k]) months[k] = { period: k, sales: 0, vat_out: 0, purchases: 0, vat_in: 0 }
      months[k].purchases += p.amount; months[k].vat_in += (p.tax ?? Math.max(0, p.total - p.amount))
    })
    return Object.values(months).sort((a, b) => b.period.localeCompare(a.period)).slice(0, 6)
      .map(r => ({ ...r, period: new Date(r.period + '-01').toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }), net: r.vat_out - r.vat_in }))
  }, [invoices, purchases])

  // ── Budget data ────────────────────────────────────────────────────────────
  const budgetData = useMemo(() => {
    const actuals: Record<string, number> = {}
    expenses.filter(e => e.status === 'approved').forEach(e => {
      actuals[e.category] = (actuals[e.category] || 0) + e.amount
    })
    const items = Object.entries(BUDGET_TARGETS).map(([cat, budget]) => ({ category: cat, budget, actual: actuals[cat] || 0 }))
    Object.entries(actuals).forEach(([cat, actual]) => { if (!BUDGET_TARGETS[cat]) items.push({ category: cat, budget: 0, actual }) })
    const totalBudget = items.reduce((s, i) => s + i.budget, 0)
    const totalActual = items.reduce((s, i) => s + i.actual, 0)
    const revActualPct = Math.min(100, Math.round(core.totalRevenue / REVENUE_TARGET * 100))
    return { items: items.sort((a, b) => b.actual - a.actual), totalBudget, totalActual, revActualPct, overBudget: items.filter(i => i.actual > i.budget).length }
  }, [expenses, core.totalRevenue])

  // ── Product profitability ─────────────────────────────────────────────────
  const profitability = useMemo(() => products.map(p => {
    let soldQty = 0, soldRevenue = 0
    invoices.filter(i => i.status !== 'draft').forEach(i => i.items.forEach(it => {
      if (it.productId === p.id || it.description === p.name) { soldQty += it.qty; soldRevenue += it.total }
    }))
    delegates.forEach(d => d.invoices.filter(i => i.type === 'sale').forEach(i => {
      (i.items as any[]).forEach((it: any) => {
        if (it.productId === p.id || it.description === p.name) { soldQty += it.qty; soldRevenue += it.total }
      })
    }))
    const cogs = soldQty * p.costPrice
    const grossProfit = soldRevenue - cogs
    const margin = soldRevenue > 0 ? Math.round(grossProfit / soldRevenue * 100) : 0
    return { product: p, soldQty, soldRevenue, cogs, grossProfit, margin }
  }).sort((a, b) => b.grossProfit - a.grossProfit), [products, invoices, delegates])

  const Row = ({ label, value, color, bold }: { label: string; value: number; color?: string; bold?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: bold ? 14 : 13, fontWeight: bold ? 800 : 500 }}>{label}</span>
      <span style={{ fontSize: bold ? 15 : 13, fontWeight: 800, color: color ?? 'var(--text)' }}>{fmt(value)}</span>
    </div>
  )

  return (
    <>
      <PageHeader
        title="التقارير والتحليلات"
        subtitle="التقارير المالية · التحليلات المتقدمة · الميزانية التقديرية"
        actions={
          <button className="btn btn-outline btn-sm" onClick={() => toast('جارٍ تصدير التقرير...', 'info')}>
            <i className="fa fa-file-pdf" /> تصدير PDF
          </button>
        }
      />

      {/* KPI Row */}
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي الإيرادات" value={fmt(core.totalRevenue)} dark icon="fa-dollar-sign" />
        <StatCard label="صافي الربح" value={fmt(core.netProfit)} badge={core.netProfit >= 0 ? '▲' : '▼'} badgeType={core.netProfit >= 0 ? 'success' : 'danger'} icon="fa-chart-line" iconColor="var(--success)" />
        <StatCard label="إجمالي المصروفات" value={fmt(core.totalExpenses + core.totalPurchases)} icon="fa-receipt" iconColor="var(--warn)" />
        <StatCard label="رصيد الخزينة" value={fmt(core.cashBalance)} icon="fa-university" iconColor="var(--blue)" />
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {[
          { id: 'financial' as const, label: 'التقارير المالية', icon: 'fa-file-invoice-dollar' },
          { id: 'analytics' as const, label: 'التحليلات', icon: 'fa-chart-bar' },
          { id: 'budget' as const, label: 'الميزانية التقديرية', icon: 'fa-balance-scale' },
        ].map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            <i className={`fa ${t.icon}`} style={{ marginLeft: 6 }} />{t.label}
          </button>
        ))}
      </div>

      {/* ── FINANCIAL REPORTS ────────────────────────────────────────────────── */}
      {tab === 'financial' && (
        <>
          <div className="tabs mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            {([['pl','قائمة الدخل'],['balance','الميزانية'],['cashflow','التدفق النقدي'],['vat','الضريبة']] as const).map(([k,v]) => (
              <button key={k} className={`tab-btn${reportSub === k ? ' active' : ''}`} style={{ fontSize: 12 }} onClick={() => setReportSub(k)}>{v}</button>
            ))}
          </div>

          {reportSub === 'pl' && (
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card title="الإيرادات" action={<span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>{fmt(core.totalRevenue)}</span>}>
                  <Row label="مبيعات مباشرة" value={core.adminRevenue} color="var(--success)" />
                  <Row label="مبيعات المناديب" value={core.delegateRevenue} color="var(--success)" />
                  <Row label="إجمالي الإيرادات" value={core.totalRevenue} color="var(--success)" bold />
                </Card>
                <Card title="التكاليف والمصروفات">
                  <Row label="تكلفة المشتريات" value={core.totalPurchases} color="var(--danger)" />
                  <Row label="إجمالي الربح" value={core.grossProfit} color={core.grossProfit >= 0 ? 'var(--success)' : 'var(--danger)'} bold />
                  <Row label="المصروفات التشغيلية" value={core.totalExpenses} color="var(--warn)" />
                  <Row label="ضريبة المخرجات" value={core.totalTax} color="var(--warn)" />
                  <Row label="صافي الربح" value={core.netProfit} color={core.netProfit >= 0 ? 'var(--success)' : 'var(--danger)'} bold />
                </Card>
              </div>
              <div style={{ width: 340 }}>
                <Card title="الرسم البياني الشهري" style={{ marginBottom: 16 }}>
                  <RevenueChart data={monthlyData} />
                </Card>
                <Card title="نمو الربح">
                  <LineAreaChart data={monthlyGrowth} dataKey="profit" label="الربح" color="var(--success)" />
                </Card>
              </div>
            </div>
          )}

          {reportSub === 'balance' && (
            <div className="grid-2">
              <Card title="الأصول">
                <Row label="النقد وأرصدة الخزينة" value={core.cashBalance} />
                <Row label="قيمة المخزون" value={core.inventoryValue} />
                <Row label="الذمم المدينة" value={customers.filter(c => c.balance < 0).reduce((s, c) => s + Math.abs(c.balance), 0)} />
                <Row label="إجمالي الأصول" value={core.cashBalance + core.inventoryValue} bold color="var(--blue)" />
              </Card>
              <Card title="الخصوم والملكية">
                <Row label="ضريبة مستحقة" value={Math.max(0, core.vatNet)} color="var(--danger)" />
                <Row label="ذمم دائنة" value={customers.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0)} />
                <Row label="صافي الأصول" value={core.cashBalance + core.inventoryValue - Math.max(0, core.vatNet)} bold color="var(--primary)" />
              </Card>
            </div>
          )}

          {reportSub === 'cashflow' && (
            <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
              <Card title="التدفق النقدي الشهري"><RevenueChart data={monthlyData} /></Card>
              <Card title="ملخص التدفق">
                <Row label="إيرادات محصّلة (مدفوعة)" value={invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)} color="var(--success)" />
                <Row label="مدفوعات مصروفات" value={core.totalExpenses} color="var(--danger)" />
                <Row label="مدفوعات مشتريات" value={core.totalPurchases} color="var(--danger)" />
                <Row label="رصيد الخزينة الحالي" value={core.cashBalance} bold color="var(--primary)" />
              </Card>
            </div>
          )}

          {reportSub === 'vat' && (
            <>
              <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                <StatCard label="ضريبة المخرجات" value={fmt(core.totalTax)} icon="fa-percent" iconColor="var(--danger)" />
                <StatCard label="ضريبة المدخلات" value={fmt(core.purchaseTax)} icon="fa-percent" iconColor="var(--success)" />
                <StatCard label="الصافي المستحق" value={fmt(core.vatNet)} dark icon="fa-receipt" />
              </div>
              <Card title="الضريبة الشهرية">
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>الفترة</th><th>المبيعات</th><th>ضريبة المخرجات</th><th>المشتريات</th><th>ضريبة المدخلات</th><th>الصافي</th></tr></thead>
                    <tbody>
                      {vatRows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد بيانات</td></tr>}
                      {vatRows.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{r.period}</td>
                          <td>{fmt(r.sales)}</td>
                          <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{fmt(r.vat_out)}</td>
                          <td>{fmt(r.purchases)}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(r.vat_in)}</td>
                          <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{fmt(r.net)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}

      {/* ── ANALYTICS ────────────────────────────────────────────────────────── */}
      {tab === 'analytics' && (
        <>
          <div className="grid-2 mb-6">
            <Card title="الإيراد والمصروفات الشهرية" action={<span style={{ fontSize: 11, color: 'var(--success)' }}>بيانات حقيقية</span>}>
              <RevenueChart data={monthlyData} />
            </Card>
            <Card title="أفضل العملاء إيراداً">
              {core.topCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>لا توجد بيانات بعد</div>
              ) : core.topCustomers.map((c, i) => (
                <div key={c.name + i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--muted)', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${core.totalCustRev > 0 ? c.revenue / core.totalCustRev * 100 : 0}%`, background: 'var(--blue)', borderRadius: 3 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{fmt(c.revenue)}</span>
                </div>
              ))}
            </Card>
          </div>

          <Card title="ربحية المنتجات — مقارنة التكلفة بالإيراد" action={<span style={{ fontSize: 11, color: 'var(--success)' }}>بيانات حقيقية</span>}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>المنتج</th><th style={{ textAlign: 'center' }}>مباع</th><th>إيرادات البيع</th><th>تكلفة المبيعات</th><th>الربح الإجمالي</th><th style={{ textAlign: 'center' }}>الهامش</th><th>المخزون المتبقي</th></tr>
                </thead>
                <tbody>
                  {profitability.map(({ product: p, soldQty, soldRevenue, cogs, grossProfit, margin }) => (
                    <tr key={p.id}>
                      <td><div style={{ fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{p.sku}</div></td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{fmtNum(soldQty)} <span style={{ fontSize: 10, color: 'var(--muted)' }}>{p.unit}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>{soldRevenue > 0 ? fmt(soldRevenue) : '—'}</td>
                      <td style={{ color: 'var(--danger)' }}>{cogs > 0 ? fmt(cogs) : '—'}</td>
                      <td><span style={{ fontWeight: 800, color: grossProfit > 0 ? 'var(--success)' : grossProfit < 0 ? 'var(--danger)' : 'var(--muted)' }}>{grossProfit !== 0 ? (grossProfit > 0 ? '+' : '') + fmt(grossProfit) : '—'}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        {soldRevenue > 0 ? <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: margin >= 30 ? 'var(--success-bg)' : margin >= 10 ? 'var(--warn-bg)' : 'var(--danger-bg)', color: margin >= 30 ? 'var(--success)' : margin >= 10 ? 'var(--warn)' : 'var(--danger)' }}>{margin}%</span> : '—'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{fmtNum(p.stock)} {p.unit}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg)', fontWeight: 800 }}>
                    <td>الإجمالي</td>
                    <td style={{ textAlign: 'center' }}>{fmtNum(profitability.reduce((s, r) => s + r.soldQty, 0))}</td>
                    <td style={{ color: 'var(--success)' }}>{fmt(profitability.reduce((s, r) => s + r.soldRevenue, 0))}</td>
                    <td style={{ color: 'var(--danger)' }}>{fmt(profitability.reduce((s, r) => s + r.cogs, 0))}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 900 }}>{fmt(profitability.reduce((s, r) => s + r.grossProfit, 0))}</td>
                    <td style={{ textAlign: 'center' }}>
                      {(() => { const rev = profitability.reduce((s, r) => s + r.soldRevenue, 0); const p = profitability.reduce((s, r) => s + r.grossProfit, 0); return rev > 0 ? `${Math.round(p / rev * 100)}%` : '—' })()}
                    </td>
                    <td>{fmtNum(profitability.reduce((s, r) => s + r.product.stock, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Monthly performance table */}
          <Card title="الأداء الشهري التفصيلي" style={{ marginTop: 16 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>الشهر</th><th>الإيراد</th><th>المصروفات</th><th>صافي الربح</th><th>الهامش</th><th>النمو</th></tr></thead>
                <tbody>
                  {monthlyGrowth.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد بيانات بعد</td></tr>}
                  {monthlyGrowth.map(d => (
                    <tr key={d.month}>
                      <td style={{ fontWeight: 600 }}>{d.month}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(d.revenue)}</td>
                      <td style={{ color: 'var(--danger)' }}>{fmt(d.expenses)}</td>
                      <td style={{ fontWeight: 700, color: d.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(d.profit)}</td>
                      <td><span style={{ fontSize: 12, fontWeight: 700, color: d.margin >= 60 ? 'var(--success)' : 'var(--warn)' }}>{d.margin}%</span></td>
                      <td>{d.growth !== 0 && <span style={{ fontSize: 12, fontWeight: 700, color: d.growth > 0 ? 'var(--success)' : 'var(--danger)' }}>{d.growth > 0 ? '▲' : '▼'} {Math.abs(d.growth)}%</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── BUDGET ───────────────────────────────────────────────────────────── */}
      {tab === 'budget' && (
        <>
          <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <StatCard label="إجمالي الميزانية" value={fmt(budgetData.totalBudget)} dark icon="fa-balance-scale" />
            <StatCard label="المصروف الفعلي" value={fmt(budgetData.totalActual)} badge={`${budgetData.totalBudget > 0 ? Math.round(budgetData.totalActual / budgetData.totalBudget * 100) : 0}%`} badgeType="warn" icon="fa-receipt" iconColor="var(--warn)" />
            <StatCard label="المتبقي" value={fmt(Math.max(0, budgetData.totalBudget - budgetData.totalActual))} badge="✓" badgeType="success" icon="fa-piggy-bank" iconColor="var(--success)" />
            <StatCard label="بنود تجاوزت الميزانية" value={String(budgetData.overBudget)} badge={budgetData.overBudget > 0 ? '!' : '✓'} badgeType={budgetData.overBudget > 0 ? 'danger' : 'success'} icon="fa-exclamation-triangle" iconColor={budgetData.overBudget > 0 ? 'var(--danger)' : 'var(--success)'} />
          </div>

          <Card title="الإيراد مقارنةً بالمستهدف" style={{ marginBottom: 16 }}>
            <div style={{ padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{fmt(core.totalRevenue)}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)', marginRight: 8 }}>من {fmt(REVENUE_TARGET)}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: budgetData.revActualPct >= 80 ? 'var(--success)' : 'var(--warn)' }}>{budgetData.revActualPct}% تحقق</span>
              </div>
              <div style={{ height: 16, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${budgetData.revActualPct}%`, background: 'linear-gradient(90deg, var(--primary), var(--blue))', borderRadius: 8, transition: 'width .4s' }} />
              </div>
            </div>
          </Card>

          <Card title="تفاصيل الميزانية — المصروفات مقارنةً بالمخطط">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {budgetData.items.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>لا توجد مصروفات مسجلة</div>}
              {budgetData.items.map(item => {
                const pct = item.budget > 0 ? Math.round(item.actual / item.budget * 100) : 100
                const over = item.budget > 0 && item.actual > item.budget
                const color = over ? 'var(--danger)' : pct > 80 ? 'var(--warn)' : 'var(--success)'
                return (
                  <div key={item.category} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fa fa-tag" style={{ color, fontSize: 14 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{item.category}</span>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                          <span style={{ color: 'var(--muted)' }}>الميزانية: <strong>{fmt(item.budget)}</strong></span>
                          <span style={{ color: over ? 'var(--danger)' : 'var(--text)' }}>الفعلي: <strong style={{ color }}>{fmt(item.actual)}</strong></span>
                        </div>
                      </div>
                      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 4, transition: 'width .4s' }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color, flexShrink: 0, minWidth: 40, textAlign: 'left' }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}
    </>
  )
}
