import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt } from '@/lib/format'
import { MONTHLY_DATA } from '@/lib/mock-data/dashboard'
import RevenueChart from '@/components/charts/RevenueChart'
import LineAreaChart from '@/components/charts/LineAreaChart'

const TOP_CUSTOMERS = [
  { name: 'شركة الرواد التجارية',       revenue: 84050, pct: 29.5, growth: +12.4 },
  { name: 'مؤسسة الإبداع الرقمي',       revenue: 52400, pct: 18.4, growth: +8.1  },
  { name: 'مجموعة النخبة',              revenue: 43200, pct: 15.2, growth: -2.3  },
  { name: 'شركة البناء الحديث',          revenue: 38700, pct: 13.6, growth: +22.7 },
  { name: 'مؤسسة التميز للخدمات',       revenue: 29150, pct: 10.2, growth: +5.6  },
]

const TOP_PRODUCTS = [
  { name: 'حبر طابعة HP (أسود)',    sold: 142, revenue: 12070 },
  { name: 'ورق A4 (رزمة)',          sold: 380, revenue: 8360  },
  { name: 'لوحة عرض بيضاء',         sold: 18,  revenue: 5040  },
  { name: 'دباسة مكتبية',            sold: 96,  revenue: 3360  },
  { name: 'علبة أقلام ملونة',        sold: 74,  revenue: 3330  },
]

const MONTHLY_GROWTH = MONTHLY_DATA.map((d, i) => ({
  ...d,
  profit: d.revenue - d.expenses,
  margin: Math.round(((d.revenue - d.expenses) / d.revenue) * 100),
  growth: i === 0 ? 0 : Math.round(((d.revenue - MONTHLY_DATA[i - 1].revenue) / MONTHLY_DATA[i - 1].revenue) * 100),
}))

const CHANNEL_DATA = [
  { label: 'فواتير مباشرة', value: 58, color: '#2563EB' },
  { label: 'نقطة البيع',    value: 24, color: '#10B981' },
  { label: 'أونلاين',       value: 18, color: '#7C3AED' },
]

export default function AnalyticsPage() {
  const totalRevenue = MONTHLY_DATA.reduce((s, d) => s + d.revenue, 0)

  return (
    <>
      <PageHeader title="التحليلات المتقدمة" subtitle="رؤى تفصيلية لأداء الأعمال" />

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'إيراد السنة',    value: fmt(totalRevenue),           icon: 'fa-dollar-sign',     color: '#2563EB' },
          { label: 'متوسط شهري',     value: fmt(Math.round(totalRevenue / 10)), icon: 'fa-chart-bar',   color: '#10B981' },
          { label: 'أعلى شهر',       value: 'أبريل',                    icon: 'fa-trophy',           color: '#D97706' },
          { label: 'نمو YTD',         value: '+14.2%',                   icon: 'fa-arrow-trend-up',  color: '#10B981' },
          { label: 'هامش الربح',      value: '65.5%',                    icon: 'fa-percent',          color: '#7C3AED' },
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
        <Card title="الإيراد والمصروفات" action={<span style={{ fontSize: 12, color: 'var(--muted)' }}>آخر 10 أشهر</span>}>
          <RevenueChart data={MONTHLY_DATA} />
        </Card>
        <Card title="نمو صافي الربح" action={<span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>▲ 18.7%</span>}>
          <LineAreaChart data={MONTHLY_DATA.map(d => ({ ...d, profit: d.revenue - d.expenses }))} dataKey="profit" label="الربح" color="var(--success)" />
        </Card>
      </div>

      <div className="grid-2 mb-6">
        {/* Top customers */}
        <Card title="أفضل العملاء إيراداً">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>
            {TOP_CUSTOMERS.map((c, i) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                <span style={{ fontSize: 11, fontWeight: 700, color: c.growth > 0 ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
                  {c.growth > 0 ? '▲' : '▼'}{Math.abs(c.growth)}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top products */}
        <Card title="أكثر المنتجات مبيعاً">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {TOP_PRODUCTS.map((p, i) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < TOP_PRODUCTS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--muted)', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{p.sold} وحدة مباعة</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{fmt(p.revenue)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Channel breakdown */}
      <Card title="توزيع قنوات البيع">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, padding: '8px 0' }}>
          {CHANNEL_DATA.map(ch => (
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
      <Card title="الأداء الشهري التفصيلي" action={<span style={{ fontSize: 12, color: 'var(--muted)' }}>آخر 10 أشهر</span>} style={{ marginTop: 20 }}>
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
              {MONTHLY_GROWTH.map(d => (
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
