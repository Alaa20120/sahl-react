import { useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import { fmt } from '@/lib/format'
import { toast } from '@/lib/toast'
import { useExpenseStore } from '@/store/expense.store'
import { useInvoiceStore } from '@/store/invoice.store'

// Budget targets per category (static targets)
const BUDGET_TARGETS: Record<string, number> = {
  'رواتب': 160000,
  'إيجار': 15000,
  'مكتبية': 8000,
  'نقل وتنقل': 6000,
  'ضيافة': 5000,
  'صيانة': 5000,
  'اتصالات': 3000,
  'تسويق': 15000,
  'أخرى': 5000,
}

const REVENUE_TARGET = 350000

export default function BudgetPage() {
  const expenses = useExpenseStore(s => s.expenses)
  const invoices = useInvoiceStore(s => s.invoices)

  const { budgetItems, totalBudget, totalActual, revenueActual } = useMemo(() => {
    // Group expenses by category
    const categoryActuals: Record<string, number> = {}
    expenses
      .filter(e => e.status === 'approved')
      .forEach(e => {
        categoryActuals[e.category] = (categoryActuals[e.category] || 0) + e.amount
      })

    // Build budget items from targets
    const items = Object.entries(BUDGET_TARGETS).map(([category, budget]) => ({
      category,
      budget,
      actual: categoryActuals[category] || 0,
    }))

    // Add any categories with actuals but no budget target
    Object.entries(categoryActuals).forEach(([category, actual]) => {
      if (!BUDGET_TARGETS[category]) {
        items.push({ category, budget: 0, actual })
      }
    })

    const totalB = items.reduce((s, i) => s + i.budget, 0)
    const totalA = items.reduce((s, i) => s + i.actual, 0)

    // Revenue from paid invoices
    const rev = invoices
      .filter(inv => inv.status === 'paid' || inv.status === 'partial')
      .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0)

    return {
      budgetItems: items.sort((a, b) => b.actual - a.actual),
      totalBudget: totalB,
      totalActual: totalA,
      revenueActual: rev,
    }
  }, [expenses, invoices])

  const remaining = totalBudget - totalActual
  const overBudget = budgetItems.filter(i => i.actual > i.budget).length

  const revActualPct = Math.min(100, Math.round((revenueActual / REVENUE_TARGET) * 100))
  const expActualPct = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0

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
        <StatCard label="المتبقي من الميزانية" value={fmt(Math.max(0, remaining))} badge="✓" badgeType="success" icon="fa-piggy-bank" iconColor="var(--success)" />
        <StatCard label="بنود تجاوزت الميزانية" value={String(overBudget)} badge={overBudget > 0 ? '!' : '✓'} badgeType={overBudget > 0 ? 'danger' : 'success'} icon="fa-exclamation-triangle" iconColor={overBudget > 0 ? 'var(--danger)' : 'var(--success)'} />
      </div>

      {/* Revenue vs budget */}
      <Card title="الإيراد مقارنةً بالمستهدف" style={{ marginBottom: 20 }}>
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{fmt(revenueActual)}</span>
              <span style={{ fontSize: 13, color: 'var(--muted)', marginRight: 8 }}>من {fmt(REVENUE_TARGET)}</span>
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
          {budgetItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 14 }}>
              لا توجد مصروفات مسجلة حالياً
            </div>
          )}
          {budgetItems.map(item => {
            const pct = item.budget > 0 ? Math.round((item.actual / item.budget) * 100) : 100
            const over = item.budget > 0 && item.actual > item.budget
            const color = over ? '#DC2626' : pct > 80 ? '#F59E0B' : '#10B981'
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
                      <span style={{ color: over ? 'var(--danger)' : 'var(--text)' }}>الفعلي: <strong>{fmt(item.actual)}</strong></span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(pct, 100)}%`,
                      background: color,
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
