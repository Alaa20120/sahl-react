import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/Badge'
import RevenueChart from '@/components/charts/RevenueChart'
import LineAreaChart from '@/components/charts/LineAreaChart'
import { fmt, fmtDate } from '@/lib/format'
import { DASHBOARD_STATS, MONTHLY_DATA, RECENT_INVOICES } from '@/lib/mock-data/dashboard'

const PERIODS = ['اليوم', 'هذا الأسبوع', 'هذا الشهر', 'ربع السنة', 'هذا العام']

export default function DashboardPage() {
  const [period, setPeriod] = useState('هذا الشهر')

  return (
    <>
      <PageHeader
        title="لوحة التحكم"
        subtitle={`مرحباً، أحمد — ${new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
        actions={
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all .15s',
                  background: period === p ? 'var(--card)' : 'transparent',
                  color: period === p ? 'var(--text)' : 'var(--muted)',
                  boxShadow: period === p ? 'var(--shadow)' : 'none',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      {/* AI Insights */}
      <div style={{ background: 'var(--primary)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 24, overflowX: 'auto' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="fa fa-robot" style={{ color: 'var(--blue)' }} />AI
        </div>

         
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard
          label="إجمالي الإيراد"
          value={fmt(DASHBOARD_STATS.revenue)}
          badge={`▲ ${DASHBOARD_STATS.revenueChange}%`}
          badgeType="success"
          dark
          icon="fa-dollar-sign"
        />
        <StatCard
          label="صافي الربح"
          value={fmt(DASHBOARD_STATS.profit)}
          badge={`▲ ${DASHBOARD_STATS.profitChange}%`}
          badgeType="success"
          icon="fa-chart-line"
          iconColor="var(--success)"
        />
        <StatCard
          label="المصروفات"
          value={fmt(DASHBOARD_STATS.expenses)}
          badge={`▼ ${Math.abs(DASHBOARD_STATS.expensesChange)}%`}
          badgeType="warn"
          icon="fa-receipt"
          iconColor="var(--warn)"
        />
        <StatCard
          label="رصيد الخزينة"
          value={fmt(DASHBOARD_STATS.cashBalance)}
          badge={`▲ ${DASHBOARD_STATS.cashChange}%`}
          badgeType="success"
          icon="fa-university"
          iconColor="var(--blue)"
        />
      </div>

      {/* Alert row */}
      <div className="grid-2 mb-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ background: 'var(--warn-bg)', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="fa fa-clock" style={{ color: 'var(--warn)', fontSize: 18 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>فواتير معلقة: {fmt(DASHBOARD_STATS.pendingInvoices)}</div>
            <div style={{ fontSize: 12, color: '#B45309' }}>تحتاج مراجعة وإرسال تذكير</div>
          </div>
          <Link to="/erp/invoices?status=pending" className="btn btn-sm" style={{ marginRight: 'auto', background: '#FDE68A', color: '#92400E', border: 'none' }}>عرض</Link>
        </div>
        <div style={{ background: 'var(--danger-bg)', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="fa fa-exclamation-circle" style={{ color: 'var(--danger)', fontSize: 18 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>فواتير متأخرة: {fmt(DASHBOARD_STATS.overdueInvoices)}</div>
            <div style={{ fontSize: 12, color: '#DC2626' }}>تجاوزت تاريخ الاستحقاق</div>
          </div>
          <Link to="/erp/invoices?status=overdue" className="btn btn-sm" style={{ marginRight: 'auto', background: '#FECACA', color: '#991B1B', border: 'none' }}>عرض</Link>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2 mb-6">
        <Card title="الإيراد والمصروفات" action={<span style={{ fontSize: 12, color: 'var(--muted)' }}>آخر 10 أشهر</span>}>
          <RevenueChart data={MONTHLY_DATA} />
        </Card>
        <Card title="نمو الإيراد" action={<span style={{ fontSize: 12, color: 'var(--muted)' }}>اتجاه تصاعدي</span>}>
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
                {RECENT_INVOICES.map(inv => (
                  <tr key={inv.id} style={{ cursor: 'pointer' }}>
                    <td><Link to={`/erp/invoices/${inv.id}`} style={{ color: 'var(--blue)', fontWeight: 600 }}>{inv.id}</Link></td>
                    <td>{inv.customer}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(inv.amount)}</td>
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
                { label: 'عملاء جدد هذا الشهر', value: DASHBOARD_STATS.newCustomers, icon: 'fa-users', color: 'var(--blue)' },
                { label: 'موظفون نشطون', value: DASHBOARD_STATS.activeEmployees, icon: 'fa-user-tie', color: 'var(--success)' },
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
        البيانات المعروضة: {period} • آخر تحديث: {fmtDate(new Date())}
      </div>
    </>
  )
}
