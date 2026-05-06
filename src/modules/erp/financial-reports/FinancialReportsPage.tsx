import { useState, useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt } from '@/lib/format'
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

type ReportTab = 'pl' | 'balance' | 'cashflow' | 'vat'

export default function FinancialReportsPage() {
  const [tab, setTab] = useState<ReportTab>('pl')

  const invoices = useInvoiceStore(s => s.invoices)
  const expenses = useExpenseStore(s => s.expenses)
  const purchases = usePurchaseStore(s => s.purchases)
  const products = useInventoryStore(s => s.products)
  const accounts = useTreasuryStore(s => s.accounts)
  const customers = useCustomerStore(s => s.customers)
  const delegates = useDelegateStore(s => s.delegates)

  // ── Core Computations ────────────────────────────────────────────────────────
  const data = useMemo(() => {
    const paidInvoices = invoices.filter(i => i.status !== 'draft')
    const adminRevenue = paidInvoices.reduce((s, i) => s + i.amount, 0)
    const adminTax = paidInvoices.reduce((s, i) => s + i.tax, 0)
    const delegateRevenue = delegates.reduce((s, d) =>
      s + d.invoices.filter(i => i.type === 'sale' && (i.status === 'paid' || i.status === 'confirmed'))
        .reduce((ss, i) => ss + i.subtotal, 0), 0)
    const delegateTax = delegates.reduce((s, d) =>
      s + d.invoices.filter(i => i.type === 'sale' && (i.status === 'paid' || i.status === 'confirmed'))
        .reduce((ss, i) => ss + i.tax, 0), 0)

    const totalRevenue = adminRevenue + delegateRevenue
    const totalVatOut = adminTax + delegateTax

    const approvedExpenses = expenses.filter(e => e.status === 'approved')
    const totalExpenses = approvedExpenses.reduce((s, e) => s + e.amount, 0)

    const totalPurchases = purchases.reduce((s, p) => s + p.amount, 0)
    const purchaseTax = purchases.reduce((s, p) => s + (p.tax ?? p.total - p.amount), 0)

    // Inventory value
    const inventoryValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0)
    const delegateInventoryValue = delegates.reduce((s, d) =>
      s + d.warehouse.reduce((ss, w) => ss + w.qty * w.costPrice, 0), 0)

    // Cash & receivables
    const cashBalance = accounts.reduce((s, a) => s + a.balance, 0)
    const receivables = customers.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0)
    const payables = customers.filter(c => c.balance < 0).reduce((s, c) => s + Math.abs(c.balance), 0)

    // P&L
    const grossProfit = totalRevenue - totalPurchases
    const operatingProfit = grossProfit - totalExpenses
    const netProfit = operatingProfit - totalVatOut

    // Cash flow
    const totalCashFlow = cashBalance

    return {
      totalRevenue, delegateRevenue, adminRevenue,
      totalVatOut, delegateTax,
      totalExpenses, totalPurchases, purchaseTax,
      inventoryValue, delegateInventoryValue,
      cashBalance, receivables, payables,
      grossProfit, operatingProfit, netProfit,
      totalCashFlow,
    }
  }, [invoices, expenses, purchases, products, accounts, customers, delegates])

  // ── Monthly Chart Data ───────────────────────────────────────────────────────
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
      .map(d => ({
        ...d,
        month: new Date(d.month + '-01').toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }),
      }))
      .slice(-12)
  }, [invoices, expenses, delegates])

  // ── VAT by Month ─────────────────────────────────────────────────────────────
  const vatRows = useMemo(() => {
    const months: Record<string, { period: string; sales: number; vat_out: number; purchases: number; vat_in: number }> = {}
    invoices.filter(i => i.status !== 'draft').forEach(i => {
      const k = i.date.slice(0, 7)
      if (!months[k]) months[k] = { period: k, sales: 0, vat_out: 0, purchases: 0, vat_in: 0 }
      months[k].sales += i.amount
      months[k].vat_out += i.tax
    })
    purchases.forEach(p => {
      const k = p.date.slice(0, 7)
      if (!months[k]) months[k] = { period: k, sales: 0, vat_out: 0, purchases: 0, vat_in: 0 }
      months[k].purchases += p.amount
      months[k].vat_in += (p.tax ?? p.total - p.amount)
    })
    return Object.values(months)
      .sort((a, b) => b.period.localeCompare(a.period))
      .slice(0, 6)
      .map(r => ({
        ...r,
        period: new Date(r.period + '-01').toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }),
        net: r.vat_out - r.vat_in,
      }))
  }, [invoices, purchases])

  const exportReport = () => toast('جارٍ تصدير التقرير...', 'info')

  return (
    <>
      <PageHeader
        title="التقارير المالية"
        subtitle="قوائم مالية حقيقية من بيانات النظام"
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
              <i className="fa fa-print" /> طباعة
            </button>
            <button className="btn btn-primary btn-sm" onClick={exportReport}>
              <i className="fa fa-file-pdf" /> تصدير PDF
            </button>
          </>
        }
      />

      {/* Summary KPIs */}
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card dark">
          <div className="stat-label">إجمالي الإيرادات</div>
          <div className="stat-value">{fmt(data.totalRevenue)}</div>
          <div className="stat-badge badge-dark"><i className="fa fa-users" /> شامل المناديب</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">صافي الربح</div>
          <div className="stat-value" style={{ color: data.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(data.netProfit)}</div>
          <div className={`stat-badge ${data.netProfit >= 0 ? 'badge-success' : 'badge-danger'}`}>
            هامش {data.totalRevenue > 0 ? Math.round(data.netProfit / data.totalRevenue * 100) : 0}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">إجمالي المصروفات</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(data.totalExpenses + data.totalPurchases)}</div>
          <div className="stat-badge badge-warn">مصروفات + مشتريات</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">رصيد الخزينة</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{fmt(data.cashBalance)}</div>
          <div className="stat-badge badge-success"><i className="fa fa-check" /> إيجابي</div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <Card title="الإيرادات والمصروفات الشهرية — بيانات حقيقية">
          <RevenueChart data={monthlyData} />
        </Card>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {([
          { id: 'pl',       label: 'قائمة الدخل',        icon: 'fa-file-invoice-dollar' },
          { id: 'balance',  label: 'الميزانية العمومية', icon: 'fa-scale-balanced'      },
          { id: 'cashflow', label: 'التدفق النقدي',       icon: 'fa-water'               },
          { id: 'vat',      label: 'ملخص الضريبة',       icon: 'fa-receipt'             },
        ] as { id: ReportTab; label: string; icon: string }[]).map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            <i className={`fa ${t.icon}`} style={{ marginLeft: 6 }} />{t.label}
          </button>
        ))}
      </div>

      {/* ── P&L ── */}
      {tab === 'pl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { title: 'الإيرادات', color: 'var(--success)', rows: [
              { label: 'مبيعات مباشرة (قبل الضريبة)', value: data.adminRevenue },
              { label: 'مبيعات المناديب', value: data.delegateRevenue },
            ], total: { label: 'إجمالي الإيرادات', value: data.totalRevenue } },
            { title: 'تكلفة المبيعات والمشتريات', color: 'var(--danger)', rows: [
              { label: 'تكلفة البضائع المشتراة', value: data.totalPurchases },
              { label: 'قيمة المخزون الحالي', value: data.inventoryValue },
            ], total: { label: 'إجمالي التكاليف', value: data.totalPurchases } },
            { title: 'المصروفات التشغيلية', color: 'var(--warn)', rows:
              expenses.filter(e => e.status === 'approved').slice(0, 10).map(e => ({ label: e.description, value: e.amount })),
              total: { label: 'إجمالي المصروفات', value: data.totalExpenses } },
          ].map(sec => (
            <Card key={sec.title} title={sec.title}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {sec.rows.length === 0 && (
                    <tr><td colSpan={2} style={{ padding: '12px', color: 'var(--muted)', fontSize: 13 }}>لا توجد بيانات</td></tr>
                  )}
                  {sec.rows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{r.label}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', width: 160 }}>{fmt(r.value)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg)' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: sec.color }}>{sec.total.label}</td>
                    <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 800, textAlign: 'left', color: sec.color }}>{fmt(sec.total.value)}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          ))}

          <Card title="ملخص النتائج">
            <div style={{ maxWidth: 440 }}>
              {[
                { label: 'إجمالي الربح',    value: data.grossProfit,    type: 'profit' as const },
                { label: 'الربح التشغيلي',  value: data.operatingProfit, type: 'profit' as const },
                { label: 'ضريبة المخرجات',  value: data.totalVatOut,    type: 'cost'   as const },
                { label: 'صافي الربح',       value: data.netProfit,      type: 'grand'  as const },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: row.type !== 'grand' ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: row.type === 'grand' ? 15 : 13, fontWeight: row.type === 'grand' ? 800 : 600, color: row.type === 'grand' ? (data.netProfit >= 0 ? 'var(--success)' : 'var(--danger)') : row.type === 'cost' ? 'var(--danger)' : 'var(--text)' }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: row.type === 'grand' ? 17 : 14, fontWeight: 800, color: row.type === 'grand' ? (data.netProfit >= 0 ? 'var(--success)' : 'var(--danger)') : row.type === 'cost' ? 'var(--danger)' : 'var(--primary)' }}>
                    {fmt(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Balance Sheet ── */}
      {tab === 'balance' && (
        <div className="grid-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>الأصول</div>
            <Card title="الأصول المتداولة">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { label: 'النقد وأرصدة الخزينة', value: data.cashBalance },
                    { label: 'الذمم المدينة (مستحقة من العملاء)', value: data.receivables },
                    { label: 'المخزون (قيمة التكلفة)', value: data.inventoryValue },
                    { label: 'بضاعة في عهدة المناديب', value: data.delegateInventoryValue },
                  ].map(r => (
                    <tr key={r.label}>
                      <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{r.label}</td>
                      <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', width: 140 }}>{fmt(r.value)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg)' }}>
                    <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>إجمالي الأصول المتداولة</td>
                    <td style={{ padding: '9px 12px', fontSize: 14, fontWeight: 800, textAlign: 'left', color: 'var(--blue)' }}>
                      {fmt(data.cashBalance + data.receivables + data.inventoryValue + data.delegateInventoryValue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
            <div style={{ padding: '14px 16px', background: 'var(--primary)', color: '#fff', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800 }}>إجمالي الأصول</span>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{fmt(data.cashBalance + data.receivables + data.inventoryValue + data.delegateInventoryValue)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>الخصوم وحقوق الملكية</div>
            <Card title="الخصوم المتداولة">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { label: 'الذمم الدائنة (مستحقة للموردين)', value: data.payables },
                    { label: 'ضريبة القيمة المضافة المستحقة', value: data.totalVatOut - data.purchaseTax },
                  ].map(r => (
                    <tr key={r.label}>
                      <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{r.label}</td>
                      <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', width: 140 }}>{fmt(Math.max(0, r.value))}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg)' }}>
                    <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, color: 'var(--warn)' }}>إجمالي الخصوم</td>
                    <td style={{ padding: '9px 12px', fontSize: 14, fontWeight: 800, textAlign: 'left', color: 'var(--warn)' }}>{fmt(data.payables + Math.max(0, data.totalVatOut - data.purchaseTax))}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
            <Card title="حقوق الملكية">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>صافي الربح المحتجز</td>
                    <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', width: 140 }}>{fmt(data.netProfit)}</td>
                  </tr>
                  <tr style={{ background: 'var(--bg)' }}>
                    <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>إجمالي حقوق الملكية</td>
                    <td style={{ padding: '9px 12px', fontSize: 14, fontWeight: 800, textAlign: 'left', color: 'var(--success)' }}>{fmt(data.netProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}

      {/* ── Cash Flow ── */}
      {tab === 'cashflow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="حركة النقد الشهرية — بيانات حقيقية">
            <LineAreaChart data={monthlyData} dataKey="revenue" label="الإيرادات" />
          </Card>
          {[
            { title: 'التدفقات التشغيلية', icon: 'fa-arrow-trend-up', color: 'var(--success)', rows: [
              { label: 'إيرادات محصّلة', value: data.totalRevenue },
              { label: 'مدفوعات مصروفات', value: -data.totalExpenses },
              { label: 'مدفوعات مشتريات', value: -data.totalPurchases },
            ], total: data.totalRevenue - data.totalExpenses - data.totalPurchases },
            { title: 'رصيد الخزينة', icon: 'fa-university', color: 'var(--blue)', rows:
              accounts.map(a => ({ label: a.label, value: a.balance })),
              total: data.cashBalance },
          ].map(sec => (
            <Card key={sec.title} title={sec.title}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {sec.rows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{r.label}</td>
                      <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'left', width: 140, borderBottom: '1px solid var(--border)', color: r.value < 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {r.value < 0 ? `(${fmt(Math.abs(r.value))})` : `+${fmt(r.value)}`}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg)' }}>
                    <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700 }}>صافي — {sec.title}</td>
                    <td style={{ padding: '9px 12px', fontSize: 14, fontWeight: 800, textAlign: 'left', color: sec.total >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {sec.total >= 0 ? `+${fmt(sec.total)}` : `(${fmt(Math.abs(sec.total))})`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          ))}
          <div style={{ padding: '16px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, opacity: .7, marginBottom: 2 }}>رصيد الخزينة الإجمالي</div>
              <div style={{ fontSize: 11, opacity: .5 }}>جميع الحسابات</div>
            </div>
            <span style={{ fontWeight: 800, fontSize: 22 }}>{fmt(data.cashBalance)}</span>
          </div>
        </div>
      )}

      {/* ── VAT ── */}
      {tab === 'vat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <div className="stat-card">
              <div className="stat-label">إجمالي ضريبة المخرجات</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(data.totalVatOut)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">إجمالي ضريبة المدخلات</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(data.purchaseTax)}</div>
            </div>
            <div className="stat-card dark">
              <div className="stat-label">صافي الضريبة المستحقة</div>
              <div className="stat-value">{fmt(Math.max(0, data.totalVatOut - data.purchaseTax))}</div>
            </div>
          </div>

          <Card title="ملخص الضريبة الشهري — بيانات حقيقية">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الفترة</th><th>المبيعات الخاضعة</th><th>ضريبة المخرجات (15%)</th>
                    <th>المشتريات الخاضعة</th><th>ضريبة المدخلات</th><th>الصافي المستحق</th>
                  </tr>
                </thead>
                <tbody>
                  {vatRows.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد بيانات ضريبية بعد</td></tr>
                  )}
                  {vatRows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{r.period}</td>
                      <td>{fmt(r.sales)}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{fmt(r.vat_out)}</td>
                      <td>{fmt(r.purchases)}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(r.vat_in)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmt(r.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={() => toast('جارٍ إعداد الإقرار الضريبي...', 'info')}>
              <i className="fa fa-file-shield" /> إعداد الإقرار الضريبي
            </button>
            <button className="btn btn-outline" onClick={() => toast('جارٍ التصدير...', 'info')}>
              <i className="fa fa-download" /> تصدير Excel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
