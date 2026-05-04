import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import { fmt } from '@/lib/format'
import { toast } from '@/lib/toast'

const BUDGET_ITEMS = [
  { category: 'الرواتب والأجور',         budget: 800000, actual: 686000, icon: 'fa-users',             color: '#2563EB' },
  { category: 'الإيجارات',               budget: 150000, actual: 144000, icon: 'fa-building',           color: '#7C3AED' },
  { category: 'المشتريات والمخزون',       budget: 300000, actual: 274500, icon: 'fa-boxes-stacked',      color: '#10B981' },
  { category: 'التسويق والإعلانات',       budget: 80000,  actual: 54200,  icon: 'fa-bullhorn',           color: '#D97706' },
  { category: 'المصروفات الإدارية',       budget: 60000,  actual: 47800,  icon: 'fa-receipt',            color: '#DC2626' },
  { category: 'الصيانة والإصلاح',        budget: 40000,  actual: 18600,  icon: 'fa-screwdriver-wrench', color: '#0891B2' },
  { category: 'الاتصالات والانترنت',      budget: 24000,  actual: 20280,  icon: 'fa-wifi',               color: '#059669' },
  { category: 'التدريب والتطوير',         budget: 30000,  actual: 12400,  icon: 'fa-graduation-cap',     color: '#7C3AED' },
]

const REVENUE_BUDGET = { budget: 3400000, actual: 2845000 }

export default function BudgetPage() {
  const totalBudget = BUDGET_ITEMS.reduce((s, i) => s + i.budget, 0)
  const totalActual = BUDGET_ITEMS.reduce((s, i) => s + i.actual, 0)
  const remaining   = totalBudget - totalActual
  const overBudget  = BUDGET_ITEMS.filter(i => i.actual > i.budget).length

  const revActualPct = Math.round((REVENUE_BUDGET.actual / REVENUE_BUDGET.budget) * 100)
  const expActualPct = Math.round((totalActual / totalBudget) * 100)

  return (
    <>
      <PageHeader
        title="الميزانية التقديرية"
        subtitle="متابعة الميزانية مقارنةً بالفعلي"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => toast('ستتوفر ميزة إعداد الميزانية قريباً', 'info')}>
            <i className="fa fa-plus" /> ميزانية جديدة
          </button>
        }
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي الميزانية" value={fmt(totalBudget)} dark icon="fa-balance-scale" />
        <StatCard label="المصروف الفعلي" value={fmt(totalActual)} badge={`${expActualPct}%`} badgeType={expActualPct > 90 ? 'danger' : 'warn'} icon="fa-receipt" iconColor="var(--warn)" />
        <StatCard label="المتبقي من الميزانية" value={fmt(remaining)} badge="✓" badgeType="success" icon="fa-piggy-bank" iconColor="var(--success)" />
        <StatCard label="بنود تجاوزت الميزانية" value={String(overBudget)} badge={overBudget > 0 ? '!' : '✓'} badgeType={overBudget > 0 ? 'danger' : 'success'} icon="fa-exclamation-triangle" iconColor={overBudget > 0 ? 'var(--danger)' : 'var(--success)'} />
      </div>

      {/* Revenue vs budget */}
      <Card title="الإيراد مقارنةً بالمستهدف" style={{ marginBottom: 20 }}>
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{fmt(REVENUE_BUDGET.actual)}</span>
              <span style={{ fontSize: 13, color: 'var(--muted)', marginRight: 8 }}>من {fmt(REVENUE_BUDGET.budget)}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: revActualPct >= 80 ? 'var(--success)' : 'var(--warn)' }}>{revActualPct}% تحقق</span>
          </div>
          <div style={{ height: 16, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${revActualPct}%`, background: 'linear-gradient(90deg, var(--primary), var(--blue))', borderRadius: 8, transition: 'width .4s' }} />
          </div>
        </div>
      </Card>

      {/* Budget items */}
      <Card title="تفاصيل الميزانية — المصروفات">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {BUDGET_ITEMS.map(item => {
            const pct = Math.round((item.actual / item.budget) * 100)
            const over = item.actual > item.budget
            return (
              <div key={item.category} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: item.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`fa ${item.icon}`} style={{ color: item.color, fontSize: 14 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.category}</span>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                      <span style={{ color: 'var(--muted)' }}>الميزانية: <strong>{fmt(item.budget)}</strong></span>
                      <span style={{ color: over ? 'var(--danger)' : 'var(--text)' }}>الفعلي: <strong>{fmt(item.actual)}</strong></span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(pct, 100)}%`,
                      background: over ? 'var(--danger)' : pct > 80 ? 'var(--warn)' : item.color,
                      borderRadius: 4,
                      transition: 'width .4s',
                    }} />
                  </div>
                </div>
                <div style={{ minWidth: 60, textAlign: 'left' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: over ? 'var(--danger)' : pct > 80 ? 'var(--warn)' : 'var(--success)' }}>
                    {pct}%
                  </span>
                  {over && <div style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 700 }}>تجاوز!</div>}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}
