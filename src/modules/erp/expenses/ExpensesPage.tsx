import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { fmt, fmtDate } from '@/lib/format'
import { EXPENSES, EXPENSE_CATEGORIES, EXPENSE_STATS, type ExpenseStatus, type ExpenseType } from '@/lib/mock-data/expenses'
import { toast } from '@/lib/toast'

const STATUS_COLORS: Record<ExpenseStatus, string> = {
  approved: 'var(--success)',
  pending:  'var(--warn)',
  rejected: 'var(--danger)',
}
const STATUS_LABELS: Record<ExpenseStatus, string> = {
  approved: 'معتمد',
  pending:  'قيد المراجعة',
  rejected: 'مرفوض',
}

export default function ExpensesPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | ExpenseType>('all')
  const [catFilter, setCatFilter] = useState('الكل')
  const [showNew, setShowNew] = useState(false)
  const [newType, setNewType] = useState<ExpenseType>('expense')

  const filtered = EXPENSES.filter(e => {
    const matchType = typeFilter === 'all' || e.type === typeFilter
    const matchCat  = catFilter === 'الكل' || e.category === catFilter
    return matchType && matchCat
  })

  const handleSave = () => {
    toast('تم تقديم الطلب بنجاح — في انتظار الموافقة', 'success')
    setShowNew(false)
  }

  return (
    <>
      <PageHeader
        title="المصروفات والسلف"
        subtitle="متابعة المصروفات وطلبات السلف"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
            <i className="fa fa-plus" /> طلب جديد
          </button>
        }
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي المصروفات" value={fmt(EXPENSE_STATS.totalExpenses)} dark icon="fa-receipt" />
        <StatCard label="السلف الممنوحة" value={fmt(EXPENSE_STATS.totalAdvances)} icon="fa-hand-holding-dollar" iconColor="var(--blue)" />
        <StatCard label="طلبات معلقة" value={String(EXPENSE_STATS.pendingCount)} badge="!" badgeType="warn" icon="fa-clock" iconColor="var(--warn)" />
        <StatCard label="معتمد هذا الشهر" value={fmt(EXPENSE_STATS.approvedThisMonth)} badge="✓" badgeType="success" icon="fa-check-circle" iconColor="var(--success)" />
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filter-bar" style={{ marginBottom: 0, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['all','الكل'],['expense','مصروف'],['advance','سلفة']] as [typeof typeFilter, string][]).map(([k,v]) => (
                <button key={k} onClick={() => setTypeFilter(k)} className={`btn btn-sm ${typeFilter === k ? 'btn-primary' : 'btn-outline'}`}>{v}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EXPENSE_CATEGORIES.map(c => (
                <button key={c} onClick={() => setCatFilter(c)} className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-outline'}`}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Card title="سجل المصروفات والسلف" action={<span style={{ fontSize: 12, color: 'var(--muted)' }}>{filtered.length} طلب</span>}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>التاريخ</th>
                <th>الموظف</th>
                <th>الفئة</th>
                <th>البيان</th>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(exp => (
                <tr key={exp.id}>
                  <td style={{ fontWeight: 600, fontSize: 12, color: 'var(--blue)' }}>{exp.id}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(new Date(exp.date))}</td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{exp.employee}</td>
                  <td>
                    <span style={{ fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 8px' }}>
                      {exp.category}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>{exp.description}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, color: exp.type === 'advance' ? 'var(--blue)' : 'var(--text)', background: exp.type === 'advance' ? '#EFF6FF' : 'var(--bg)', borderRadius: 5, padding: '2px 8px' }}>
                      {exp.type === 'expense' ? 'مصروف' : 'سلفة'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{fmt(exp.amount)}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[exp.status], background: STATUS_COLORS[exp.status] + '18', borderRadius: 6, padding: '2px 8px' }}>
                      {STATUS_LABELS[exp.status]}
                    </span>
                  </td>
                  <td>
                    {exp.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff', border: 'none', padding: '3px 10px', fontSize: 11 }}
                          onClick={() => toast('تمت الموافقة', 'success')}>موافقة</button>
                        <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '3px 10px', fontSize: 11 }}
                          onClick={() => toast('تم الرفض', 'warn')}>رفض</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="طلب مصروف أو سلفة">
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['expense', 'advance'] as ExpenseType[]).map(t => (
            <button key={t} onClick={() => setNewType(t)}
              className={`btn btn-sm ${newType === t ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>
              <i className={`fa ${t === 'expense' ? 'fa-receipt' : 'fa-hand-holding-dollar'}`} />
              {t === 'expense' ? 'مصروف' : 'سلفة'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الموظف</label>
            <input className="form-control" placeholder="اسم الموظف..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الفئة</label>
              <select className="form-control">
                {EXPENSE_CATEGORIES.filter(c => c !== 'الكل').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>المبلغ (ر.س)</label>
              <input className="form-control" type="number" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>البيان</label>
            <textarea className="form-control" rows={3} placeholder="وصف المصروف أو سبب السلفة..." style={{ resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>تقديم الطلب</button>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
