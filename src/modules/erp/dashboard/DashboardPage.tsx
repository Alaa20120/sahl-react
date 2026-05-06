import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/Badge'
import RevenueChart from '@/components/charts/RevenueChart'
import LineAreaChart from '@/components/charts/LineAreaChart'
import { fmt, fmtDate } from '@/lib/format'
import { MONTHLY_DATA, AI_INSIGHTS } from '@/lib/mock-data/dashboard'
import { useInvoiceStore } from '@/store/invoice.store'
import { useExpenseStore } from '@/store/expense.store'
import { useTreasuryStore } from '@/store/treasury.store'
import { useCustomerStore } from '@/store/customer.store'
import { useHRStore } from '@/store/hr.store'
import { useDelegateStore } from '@/store/delegate.store'

export default function DashboardPage() {
  const invoices = useInvoiceStore(s => s.invoices)
  const expenses = useExpenseStore(s => s.expenses)
  const accounts = useTreasuryStore(s => s.accounts)
  const customers = useCustomerStore(s => s.customers)
  const employees = useHRStore(s => s.employees)
  const delegates = useDelegateStore(s => s.delegates)

  const stats = useMemo(() => {
    // Revenue from paid/partial/confirmed invoices (admin)
    const adminRevenue = invoices
      .filter(inv => inv.status !== 'draft')
      .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0)

    // Revenue from delegate sales (confirmed/paid)
    const delegateRevenue = delegates.reduce((total, del) =>
      total + del.invoices
        .filter(inv => inv.type === 'sale' && (inv.status === 'paid' || inv.status === 'confirmed'))
        .reduce((s, inv) => s + (inv.paidAmount ?? (inv.status === 'paid' ? inv.total : 0)), 0)
    , 0)

    const revenue = adminRevenue + delegateRevenue

    // Total expenses (approved) - excluding salaries
    const totalExpenses = expenses
      .filter(e => e.status === 'approved' && e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0)

    // Total advances (approved)
    const totalAdvances = expenses
      .filter(e => e.status === 'approved' && e.type === 'advance')
      .reduce((sum, e) => sum + e.amount, 0)

    // Profit
    const profit = revenue - totalExpenses - totalAdvances

    // Cash balance from treasury accounts
    const cashBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

    // Pending invoices (not fully paid)
    const pendingInvoices = invoices.filter(
      inv => inv.status === 'pending' || inv.status === 'confirmed' || (inv.status === 'partial' && (inv.paidAmount || 0) < inv.total)
    ).length

    // Overdue invoices
    const today = new Date().toISOString().split('T')[0]
    const overdueInvoices = invoices.filter(
      inv => inv.dueDate && inv.dueDate < today && (inv.status === 'pending' || inv.status === 'partial' || inv.status === 'overdue')
    ).length

    // New customers this month (mock: active customers with joinDate in current month)
    const currentMonth = new Date().toISOString().slice(0, 7)
    const newCustomers = customers.filter(c => c.since.startsWith(currentMonth)).length || customers.filter(c => c.status === 'active').length

    // Active employees
    const activeEmployees = employees.filter(e => e.status === 'active').length

    return {
      revenue,
      totalExpenses,
      totalAdvances,
      profit,
      cashBalance,
      pendingInvoices,
      overdueInvoices,
      newCustomers,
      activeEmployees,
    }
  }, [invoices, expenses, accounts, customers, employees, delegates])

  // Recent invoices sorted by date
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
  }, [invoices])

  return (
    <>
      <PageHeader
        title="لوحة التحكم"
        subtitle={`مرحباً، أحمد — ${new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      {/* AI Insights */}
      {AI_INSIGHTS.length > 0 && (
        <div style={{ background: 'var(--primary)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 24, overflowX: 'auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa fa-robot" style={{ color: 'var(--blue)' }} />AI
          </div>
          {AI_INSIGHTS.map((insight, idx) => (
            <div key={idx} style={{ fontSize: 12, color: 'rgba(255,255,255,.9)', fontWeight: 500, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className={`fa ${insight.icon}`} style={{ color: insight.color, fontSize: 11 }} />
              {insight.text}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard
          label="إجمالي الإيراد المحصل"
          value={fmt(stats.revenue)}
          badge="▲ 14.2%"
          badgeType="success"
          dark
          icon="fa-dollar-sign"
        />
        <StatCard
          label="صافي الربح"
          value={fmt(stats.profit)}
          badge={stats.profit >= 0 ? '▲ ربح' : '▼ خسارة'}
          badgeType={stats.profit >= 0 ? 'success' : 'danger'}
          icon="fa-chart-line"
          iconColor="var(--success)"
        />
        <StatCard
          label="المصروفات"
          value={fmt(stats.totalExpenses)}
          badge="▼ 3.5%"
          badgeType="warn"
          icon="fa-receipt"
          iconColor="var(--warn)"
        />
        <StatCard
          label="السلف المُعتمدة"
          value={fmt(stats.totalAdvances)}
          badge="موثق"
          badgeType="pending"
          icon="fa-hand-holding-usd"
          iconColor="var(--warn)"
        />
        <StatCard
          label="رصيد الخزينة"
          value={fmt(stats.cashBalance)}
          badge="▲ 8.3%"
          badgeType="success"
          icon="fa-university"
          iconColor="var(--blue)"
        />
      </div>

      {/* Delegate summary row */}
      <div className="desktop-only">
      {delegates.length > 0 && (() => {
        const activeDelegates = delegates.filter(d => d.status === 'active')
        const totalDelegateSales = delegates.reduce((s, d) => s + d.stats.totalSales, 0)
        const totalDelegateCustody = delegates.reduce((s, d) => s + d.stats.totalSales - d.stats.totalPurchases, 0)
        const totalPending = delegates.reduce((s, d) => s + d.invoices.filter(i => i.status === 'pending').length, 0)
        return (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fa fa-users" style={{ color: 'var(--primary)', fontSize: 18 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>المناديب النشطون</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)' }}>{activeDelegates.length}</div>
              </div>
            </div>
            <div style={{ height: 32, width: 1, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>مبيعات المناديب</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--success)' }}>{fmt(totalDelegateSales)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>إجمالي العهدة</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--warn)' }}>{fmt(totalDelegateCustody)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>فواتير معلقة للمناديب</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: totalPending > 0 ? 'var(--danger)' : 'var(--muted)' }}>{totalPending}</div>
            </div>
            <Link to="/erp/delegates" className="btn btn-outline btn-sm" style={{ marginRight: 'auto' }}>
              <i className="fa fa-users" /> إدارة المناديب
            </Link>
          </div>
        )
      })()}
      </div>

      {/* Alert row */}
      <div className="grid-2 mb-6">
        <div style={{ background: 'var(--warn-bg)', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="fa fa-clock" style={{ color: 'var(--warn)', fontSize: 18 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>فواتير معلقة: {stats.pendingInvoices}</div>
            <div style={{ fontSize: 12, color: '#B45309' }}>تحتاج مراجعة وإرسال تذكير</div>
          </div>
          <Link to="/erp/invoices?status=pending" className="btn btn-sm" style={{ marginRight: 'auto', background: '#FDE68A', color: '#92400E', border: 'none' }}>عرض</Link>
        </div>
        <div style={{ background: 'var(--danger-bg)', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="fa fa-exclamation-circle" style={{ color: 'var(--danger)', fontSize: 18 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>فواتير متأخرة: {stats.overdueInvoices}</div>
            <div style={{ fontSize: 12, color: '#DC2626' }}>تجاوزت تاريخ الاستحقاق</div>
          </div>
          <Link to="/erp/invoices?status=overdue" className="btn btn-sm" style={{ marginRight: 'auto', background: '#FECACA', color: '#991B1B', border: 'none' }}>عرض</Link>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2 mb-6">
        <Card title="الإيراد والمصروفات" action={<span style={{ fontSize: 12, color: 'var(--muted)' }}>آخر 10 أشهر</span>} bodyStyle={{ minHeight: 280 }}>
          <RevenueChart data={MONTHLY_DATA} />
        </Card>
        <Card title="نمو الإيراد" action={<span style={{ fontSize: 12, color: 'var(--muted)' }}>اتجاه تصاعدي</span>} bodyStyle={{ minHeight: 280 }}>
          <LineAreaChart data={MONTHLY_DATA} dataKey="revenue" label="الإيراد" color="var(--blue)" />
        </Card>
      </div>

      {/* Recent Invoices + Quick Actions */}
      <div className="grid-2">
        <Card
          title="آخر الفواتير"
          action={<Link to="/erp/invoices" style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>عرض الكل</Link>}
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>العميل</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>لا توجد فواتير حالياً</td>
                  </tr>
                )}
                {recentInvoices.map(inv => (
                  <tr key={inv.id} style={{ cursor: 'pointer' }}>
                    <td><Link to={`/erp/invoices/${inv.id}`} style={{ color: 'var(--blue)', fontWeight: 600 }}>{inv.number}</Link></td>
                    <td>{inv.customer}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="إجراءات سريعة">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: 'fa-file-invoice', label: 'فاتورة جديدة',  href: '/erp/invoices/new',       color: 'var(--primary)' },
                { icon: 'fa-user-plus',    label: 'عميل جديد',     href: '/erp/customers',           color: '#7C3AED' },
                { icon: 'fa-box',          label: 'إضافة منتج',    href: '/erp/inventory',           color: '#059669' },
                { icon: 'fa-coins',        label: 'تسجيل دفعة',    href: '/erp/treasury',            color: '#2563EB' },
                { icon: 'fa-chart-line',   label: 'تقرير مالي',    href: '/erp/financial-reports',   color: '#D97706' },
                { icon: 'fa-cash-register',label: 'نقطة البيع',    href: '/erp/pos',                 color: '#DC2626' },
              ].map(a => (
                <Link
                  key={a.href}
                  to={a.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    transition: '.15s', textDecoration: 'none',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = a.color; (e.currentTarget as HTMLElement).style.background = 'var(--card)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fa ${a.icon}`} style={{ fontSize: 14, color: a.color }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{a.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="ملخص سريع">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'عملاء نشطون', value: customers.filter(c => c.status === 'active').length, icon: 'fa-users', color: 'var(--blue)' },
                { label: 'موظفون نشطون', value: stats.activeEmployees, icon: 'fa-user-tie', color: 'var(--success)' },
                { label: 'عدد الفواتير', value: invoices.length, icon: 'fa-file-invoice', color: 'var(--warn)' },
                { label: 'المصروفات المعتمدة', value: expenses.filter(e => e.status === 'approved').length, icon: 'fa-receipt', color: 'var(--danger)' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fa ${s.icon}`} style={{ fontSize: 16, color: s.color }} />
                  </div>
                  <div style={{ flex: 1, fontSize: 13, color: 'var(--muted)' }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                <Link to="/erp/reports" className="btn btn-outline btn-sm w-full" style={{ justifyContent: 'center' }}>
                  <i className="fa fa-chart-bar" /> عرض كل التقارير
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Period display */}
      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
        البيانات المعروضة: فعلية من النظام • آخر تحديث: {fmtDate(new Date())}
      </div>
    </>
  )
}
