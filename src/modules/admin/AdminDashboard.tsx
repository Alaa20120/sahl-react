import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt } from '@/lib/format'

const TENANTS = [
  { id: 'T001', name: 'شركة الرواد التجارية',       plan: 'Premium', users: 12, status: 'active',   revenue: 1200,  since: '2024-01', modules: ['ERP','HR','CRM'] },
  { id: 'T002', name: 'مؤسسة الإبداع الرقمي',       plan: 'Basic',   users: 4,  status: 'active',   revenue: 350,   since: '2024-03', modules: ['ERP'] },
  { id: 'T003', name: 'مجموعة الخليج للاستثمار',    plan: 'Enterprise',users:45, status: 'active',   revenue: 4500,  since: '2023-08', modules: ['ERP','HR','CRM','Hotel'] },
  { id: 'T004', name: 'شركة البناء الحديث',          plan: 'Basic',   users: 3,  status: 'trial',    revenue: 0,     since: '2025-04', modules: ['ERP'] },
  { id: 'T005', name: 'مؤسسة التميز للخدمات',       plan: 'Premium', users: 8,  status: 'active',   revenue: 800,   since: '2024-06', modules: ['ERP','CRM'] },
  { id: 'T006', name: 'نخبة العقارات',               plan: 'Premium', users: 6,  status: 'suspended',revenue: 0,     since: '2024-01', modules: ['ERP'] },
]

const PLAN_COLORS: Record<string, string> = {
  Basic: '#6B7280', Premium: '#2563EB', Enterprise: '#7C3AED',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'var(--success)', trial: 'var(--blue)', suspended: 'var(--danger)',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'نشط', trial: 'تجريبي', suspended: 'موقوف',
}

export default function AdminDashboard() {
  const activeCount = TENANTS.filter(t => t.status === 'active').length
  const mrr = TENANTS.reduce((s, t) => s + t.revenue, 0)

  return (
    <>
      <PageHeader title="لوحة إدارة المنصة" subtitle="SaaS Admin — إدارة العملاء والاشتراكات" />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'إجمالي الشركات',   value: TENANTS.length,    icon: 'fa-building',        color: '#2563EB' },
          { label: 'نشطون',            value: activeCount,        icon: 'fa-circle-check',    color: '#10B981' },
          { label: 'تجريبيون',         value: TENANTS.filter(t=>t.status==='trial').length, icon: 'fa-hourglass-half', color: '#D97706' },
          { label: 'MRR',              value: fmt(mrr),           icon: 'fa-dollar-sign',     color: '#7C3AED', isStr: true },
          { label: 'إجمالي المستخدمين',value: TENANTS.reduce((s,t)=>s+t.users,0), icon: 'fa-users', color: '#0891B2' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: k.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fa ${k.icon}`} style={{ color: k.color, fontSize: 14 }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.isStr ? k.value : k.value}</div>
          </div>
        ))}
      </div>

      {/* Tenants table */}
      <Card title="الشركات المشتركة" action={
        <button className="btn btn-primary btn-sm">
          <i className="fa fa-plus" /> إضافة شركة
        </button>
      }>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الشركة</th>
                <th>الخطة</th>
                <th>المستخدمون</th>
                <th>الوحدات</th>
                <th>الاشتراك الشهري</th>
                <th>منذ</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {TENANTS.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>
                        {t.name.slice(0,2)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, color: PLAN_COLORS[t.plan], background: PLAN_COLORS[t.plan] + '18', borderRadius: 6, padding: '2px 10px' }}>{t.plan}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{t.users}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {t.modules.map(m => (
                        <span key={m} style={{ fontSize: 10, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>{m}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{t.revenue > 0 ? fmt(t.revenue) : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{t.since}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[t.status], background: STATUS_COLORS[t.status] + '15', borderRadius: 6, padding: '2px 8px' }}>
                      {STATUS_LABELS[t.status]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-outline" style={{ fontSize: 11 }}>
                        <i className="fa fa-eye" />
                      </button>
                      <button className="btn btn-sm btn-outline" style={{ fontSize: 11 }}>
                        <i className="fa fa-gear" />
                      </button>
                    </div>
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
