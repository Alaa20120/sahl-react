import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt } from '@/lib/format'
import RevenueChart from '@/components/charts/RevenueChart'
import LineAreaChart from '@/components/charts/LineAreaChart'
import { MONTHLY_DATA } from '@/lib/mock-data/dashboard'
import { toast } from '@/lib/toast'

type ReportTab = 'pl' | 'balance' | 'cashflow' | 'vat'

const PERIODS = ['يناير 2025', 'فبراير 2025', 'مارس 2025', 'أبريل 2025', 'Q1 2025', 'Q2 2025', 'H1 2025', 'السنة الكاملة 2024']

// ── P&L Data ────────────────────────────────────────────────────────────────
const PL_SECTIONS = [
  {
    title: 'الإيرادات',
    color: 'var(--success)',
    rows: [
      { label: 'مبيعات البضائع',         value: 218400 },
      { label: 'إيرادات الخدمات',         value: 54200  },
      { label: 'إيرادات أخرى',            value: 11900  },
    ],
    total: { label: 'إجمالي الإيرادات',   value: 284500 },
  },
  {
    title: 'تكلفة المبيعات',
    color: 'var(--danger)',
    rows: [
      { label: 'تكلفة البضائع المباعة',   value: 78600  },
      { label: 'تكلفة الخدمات',           value: 19600  },
    ],
    total: { label: 'إجمالي التكلفة',     value: 98200  },
  },
  {
    title: 'مصروفات التشغيل',
    color: 'var(--warn)',
    rows: [
      { label: 'الرواتب والأجور',          value: 24500  },
      { label: 'إيجار المكتب',             value: 6000   },
      { label: 'التسويق والإعلان',         value: 5200   },
      { label: 'مصاريف إدارية',            value: 4100   },
      { label: 'استهلاك الأصول',           value: 2300   },
    ],
    total: { label: 'إجمالي المصروفات',   value: 42100  },
  },
]
const PL_SUMMARY = [
  { label: 'إجمالي الربح',               value: 186300, type: 'profit' as const },
  { label: 'الربح التشغيلي',             value: 144200, type: 'profit' as const },
  { label: 'مصروفات التمويل',            value: 5200,   type: 'cost'   as const },
  { label: 'ضريبة القيمة المضافة',        value: 3300,   type: 'cost'   as const },
  { label: 'صافي الربح',                 value: 135700, type: 'grand'  as const },
]

// ── Balance Sheet Data ───────────────────────────────────────────────────────
const BS_ASSETS = [
  { title: 'الأصول المتداولة', rows: [
    { label: 'النقد وما يعادله',           value: 142000 },
    { label: 'الذمم المدينة',              value: 87400  },
    { label: 'المخزون',                   value: 64300  },
    { label: 'مصروفات مدفوعة مقدماً',     value: 8200   },
  ], total: 301900 },
  { title: 'الأصول الثابتة', rows: [
    { label: 'الأجهزة والمعدات',           value: 95000  },
    { label: 'مجمع الاستهلاك',             value: -28000 },
    { label: 'الأثاث والمفروشات',          value: 22000  },
  ], total: 89000 },
]
const BS_LIAB = [
  { title: 'الخصوم المتداولة', rows: [
    { label: 'الذمم الدائنة',              value: 42000  },
    { label: 'رواتب مستحقة',              value: 12400  },
    { label: 'ضريبة مستحقة الدفع',        value: 8700   },
  ], total: 63100 },
  { title: 'حقوق الملكية', rows: [
    { label: 'رأس المال المدفوع',          value: 200000 },
    { label: 'الأرباح المحتجزة',           value: 127800 },
  ], total: 327800 },
]

// ── Cash Flow Data ───────────────────────────────────────────────────────────
const CF_SECTIONS = [
  { title: 'التدفقات التشغيلية', icon: 'fa-arrow-trend-up', color: 'var(--success)', rows: [
    { label: 'صافي الربح',                 value: 135700 },
    { label: 'الاستهلاك والإطفاء',         value: 2300   },
    { label: 'التغير في الذمم المدينة',    value: -14200 },
    { label: 'التغير في المخزون',          value: -8600  },
    { label: 'التغير في الذمم الدائنة',   value: 6400   },
  ], total: 121600 },
  { title: 'التدفقات الاستثمارية', icon: 'fa-building', color: 'var(--blue)', rows: [
    { label: 'شراء أصول ثابتة',            value: -18000 },
    { label: 'عائد بيع أصل',               value: 4500   },
  ], total: -13500 },
  { title: 'التدفقات التمويلية', icon: 'fa-university', color: 'var(--pending)', rows: [
    { label: 'قرض بنكي',                   value: 50000  },
    { label: 'سداد قرض',                   value: -30000 },
  ], total: 20000 },
]

// ── VAT Summary ──────────────────────────────────────────────────────────────
const VAT_ROWS = [
  { period: 'يناير 2025',  sales: 218400, vat_out: 32760, purchases: 98200, vat_in: 14730, net: 18030, status: 'paid'    },
  { period: 'فبراير 2025', sales: 196500, vat_out: 29475, purchases: 87400, vat_in: 13110, net: 16365, status: 'paid'    },
  { period: 'مارس 2025',   sales: 241200, vat_out: 36180, purchases: 104300, vat_in: 15645, net: 20535, status: 'paid'   },
  { period: 'أبريل 2025',  sales: 284500, vat_out: 42675, purchases: 98200, vat_in: 14730, net: 27945, status: 'pending' },
]

export default function FinancialReportsPage() {
  const [tab, setTab] = useState<ReportTab>('pl')
  const [period, setPeriod] = useState(PERIODS[3])

  const exportReport = () => toast(`جارٍ تصدير ${tab === 'pl' ? 'قائمة الدخل' : tab === 'balance' ? 'الميزانية العمومية' : tab === 'cashflow' ? 'التدفق النقدي' : 'ملخص الضريبة'} — ${period}`, 'info')
  const printReport = () => window.print()

  return (
    <>
      <PageHeader
        title="التقارير المالية"
        subtitle="قوائم مالية معتمدة جاهزة للتدقيق"
        actions={
          <>
            <select
              className="form-control"
              style={{ width: 'auto', fontSize: 13 }}
              value={period}
              onChange={e => setPeriod(e.target.value)}
            >
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="btn btn-outline btn-sm" onClick={printReport}>
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
          <div className="stat-value">{fmt(284500)}</div>
          <div className="stat-badge badge-dark"><i className="fa fa-arrow-up" /> 14.2% عن الشهر الماضي</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">صافي الربح</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(135700)}</div>
          <div className="stat-badge badge-success"><i className="fa fa-arrow-up" /> هامش 47.7%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">إجمالي المصروفات</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(140800)}</div>
          <div className="stat-badge badge-warn"><i className="fa fa-arrow-up" /> 8.3%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">صافي التدفق النقدي</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{fmt(128100)}</div>
          <div className="stat-badge badge-success"><i className="fa fa-check" /> إيجابي</div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <Card title="الإيرادات والمصروفات — 2025">
          <RevenueChart data={MONTHLY_DATA} />
        </Card>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {([
          { id: 'pl',        label: 'قائمة الدخل',        icon: 'fa-file-invoice-dollar' },
          { id: 'balance',   label: 'الميزانية العمومية', icon: 'fa-scale-balanced'      },
          { id: 'cashflow',  label: 'التدفق النقدي',       icon: 'fa-water'               },
          { id: 'vat',       label: 'ملخص الضريبة',       icon: 'fa-receipt'             },
        ] as { id: ReportTab; label: string; icon: string }[]).map(t => (
          <button
            key={t.id}
            className={`tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`fa ${t.icon}`} style={{ marginLeft: 6 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── P&L ── */}
      {tab === 'pl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {PL_SECTIONS.map(sec => (
            <Card key={sec.title} title={sec.title}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>البيان</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', width: 160 }}>المبلغ (ر.س)</th>
                  </tr>
                </thead>
                <tbody>
                  {sec.rows.map(r => (
                    <tr key={r.label}>
                      <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{r.label}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>{fmt(r.value)}</td>
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
            <div style={{ maxWidth: 400 }}>
              {PL_SUMMARY.map(row => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: row.type !== 'grand' ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{
                    fontSize: row.type === 'grand' ? 15 : 13,
                    fontWeight: row.type === 'grand' ? 800 : 600,
                    color: row.type === 'grand' ? 'var(--success)' : row.type === 'cost' ? 'var(--danger)' : 'var(--text)',
                  }}>
                    {row.label}
                  </span>
                  <span style={{
                    fontSize: row.type === 'grand' ? 17 : 14,
                    fontWeight: 800,
                    color: row.type === 'grand' ? 'var(--success)' : row.type === 'cost' ? 'var(--danger)' : 'var(--primary)',
                  }}>
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
            {BS_ASSETS.map(sec => (
              <Card key={sec.title} title={sec.title}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {sec.rows.map(r => (
                      <tr key={r.label}>
                        <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid var(--border)', color: r.value < 0 ? 'var(--danger)' : 'inherit' }}>{r.label}</td>
                        <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'left', borderBottom: '1px solid var(--border)', color: r.value < 0 ? 'var(--danger)' : 'var(--text-2)', width: 130 }}>
                          {r.value < 0 ? `(${fmt(Math.abs(r.value))})` : fmt(r.value)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--bg)' }}>
                      <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>إجمالي {sec.title}</td>
                      <td style={{ padding: '9px 12px', fontSize: 14, fontWeight: 800, textAlign: 'left', color: 'var(--blue)' }}>{fmt(sec.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            ))}
            <div style={{ padding: '14px 16px', background: 'var(--primary)', color: '#fff', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800 }}>إجمالي الأصول</span>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{fmt(390900)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>الخصوم وحقوق الملكية</div>
            {BS_LIAB.map(sec => (
              <Card key={sec.title} title={sec.title}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {sec.rows.map(r => (
                      <tr key={r.label}>
                        <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{r.label}</td>
                        <td style={{ padding: '9px 12px', fontSize: 13, textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', width: 130 }}>{fmt(r.value)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--bg)' }}>
                      <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, color: 'var(--pending)' }}>إجمالي {sec.title}</td>
                      <td style={{ padding: '9px 12px', fontSize: 14, fontWeight: 800, textAlign: 'left', color: 'var(--pending)' }}>{fmt(sec.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            ))}
            <div style={{ padding: '14px 16px', background: 'var(--primary)', color: '#fff', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800 }}>إجمالي الخصوم وحقوق الملكية</span>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{fmt(390900)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Cash Flow ── */}
      {tab === 'cashflow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="حركة النقد الشهرية">
            <LineAreaChart data={MONTHLY_DATA} dataKey="revenue" label="الإيرادات" />
          </Card>

          {CF_SECTIONS.map(sec => (
            <Card key={sec.title} title={sec.title}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {sec.rows.map(r => (
                    <tr key={r.label}>
                      <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{r.label}</td>
                      <td style={{
                        padding: '9px 12px', fontSize: 13, textAlign: 'left', width: 140,
                        borderBottom: '1px solid var(--border)',
                        color: r.value < 0 ? 'var(--danger)' : r.value > 0 ? 'var(--success)' : 'var(--muted)',
                      }}>
                        {r.value < 0 ? `(${fmt(Math.abs(r.value))})` : `+${fmt(r.value)}`}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg)' }}>
                    <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700 }}>صافي التدفق — {sec.title}</td>
                    <td style={{
                      padding: '9px 12px', fontSize: 14, fontWeight: 800, textAlign: 'left',
                      color: sec.total >= 0 ? 'var(--success)' : 'var(--danger)',
                    }}>
                      {sec.total >= 0 ? `+${fmt(sec.total)}` : `(${fmt(Math.abs(sec.total))})`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          ))}

          <div style={{ padding: '16px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, opacity: .7, marginBottom: 2 }}>صافي التدفق النقدي الإجمالي</div>
              <div style={{ fontSize: 11, opacity: .5 }}>تشغيلي + استثماري + تمويلي</div>
            </div>
            <span style={{ fontWeight: 800, fontSize: 22 }}>+{fmt(128100)}</span>
          </div>
        </div>
      )}

      {/* ── VAT ── */}
      {tab === 'vat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <div className="stat-card">
              <div className="stat-label">إجمالي ضريبة المخرجات</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(141090)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">إجمالي ضريبة المدخلات</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(58215)}</div>
            </div>
            <div className="stat-card dark">
              <div className="stat-label">صافي الضريبة المستحقة</div>
              <div className="stat-value">{fmt(82875)}</div>
            </div>
          </div>

          <Card title="ملخص الضريبة الشهري">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الفترة</th>
                    <th>المبيعات الخاضعة</th>
                    <th>ضريبة المخرجات (15%)</th>
                    <th>المشتريات الخاضعة</th>
                    <th>ضريبة المدخلات</th>
                    <th>الصافي المستحق</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {VAT_ROWS.map(r => (
                    <tr key={r.period}>
                      <td style={{ fontWeight: 600 }}>{r.period}</td>
                      <td>{fmt(r.sales)}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{fmt(r.vat_out)}</td>
                      <td>{fmt(r.purchases)}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(r.vat_in)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmt(r.net)}</td>
                      <td>
                        <span className={`status status-${r.status === 'paid' ? 'paid' : 'pending'}`}>
                          {r.status === 'paid' ? 'مسدّد' : 'معلق'}
                        </span>
                      </td>
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
