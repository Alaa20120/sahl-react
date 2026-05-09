import { useState, useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { fmt, fmtDate } from '@/lib/format'
import { EXPENSE_CATEGORIES, type ExpenseType } from '@/lib/mock-data/expenses'
import { useExpenseStore } from '@/store/expense.store'
import { useHRStore } from '@/store/hr.store'
import { toast } from '@/lib/toast'
import { useSaving } from '@/lib/useSaving'

const STATUS_COLORS = { approved: 'var(--success)', pending: 'var(--warn)', rejected: 'var(--danger)' }
const STATUS_LABELS = { approved: 'معتمد', pending: 'قيد المراجعة', rejected: 'مرفوض' }

const BLANK = { employee: '', category: EXPENSE_CATEGORIES[1] ?? 'مصروفات إدارية', amount: '', description: '', date: new Date().toISOString().slice(0, 10) }

export default function ExpensesPage() {
  const { expenses, addExpense, updateStatus } = useExpenseStore()
  const employees = useHRStore(s => s.employees)
  const { saving, run } = useSaving()

  const [typeFilter, setTypeFilter] = useState<'all' | ExpenseType>('all')
  const [catFilter, setCatFilter] = useState('الكل')
  const [showNew, setShowNew] = useState(false)
  const [newType, setNewType] = useState<ExpenseType>('expense')
  const [form, setForm] = useState(BLANK)
  const [saveError, setSaveError] = useState('')

  const filtered = expenses.filter(e => {
    const matchType = typeFilter === 'all' || e.type === typeFilter
    const matchCat  = catFilter === 'الكل' || e.category === catFilter
    return matchType && matchCat
  })

  const stats = useMemo(() => ({
    totalExpenses: expenses.filter(e => e.type === 'expense' && e.status === 'approved').reduce((s, e) => s + e.amount, 0),
    totalAdvances: expenses.filter(e => e.type === 'advance' && e.status === 'approved').reduce((s, e) => s + e.amount, 0),
    pendingCount: expenses.filter(e => e.status === 'pending').length,
    approvedThisMonth: expenses.filter(e => e.status === 'approved' && e.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, e) => s + e.amount, 0),
  }), [expenses])

  function handleSave() {
    if (!form.employee.trim()) { toast('أدخل اسم الموظف', 'warn'); return }
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) { toast('أدخل مبلغاً صحيحاً', 'warn'); return }
    if (!form.description.trim()) { toast('أدخل البيان', 'warn'); return }
    setSaveError('')
    run(async () => {
      await addExpense({ date: form.date, employee: form.employee.trim(), category: form.category, description: form.description.trim(), type: newType, amount, status: 'pending' })
      toast('تم تقديم الطلب — في انتظار الموافقة', 'success')
      setShowNew(false)
      setForm(BLANK)
    }).catch((err: any) => setSaveError(err?.message || 'فشل الحفظ — حاول مرة أخرى'))
  }

  function handleApprove(id: string) {
    run(async () => { await updateStatus(id, 'approved'); toast('تمت الموافقة', 'success') })
      .catch(() => toast('خطأ في التحديث', 'danger'))
  }

  function handleReject(id: string) {
    run(async () => { await updateStatus(id, 'rejected'); toast('تم الرفض', 'warn') })
      .catch(() => toast('خطأ في التحديث', 'danger'))
  }

  return (
    <>
      <PageHeader
        title="المصروفات والسلف"
        subtitle="متابعة المصروفات وطلبات السلف"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => { setShowNew(true); setForm(BLANK); setNewType('expense') }}>
            <i className="fa fa-plus" /> طلب جديد
          </button>
        }
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي المصروفات" value={fmt(stats.totalExpenses)} dark icon="fa-receipt" />
        <StatCard label="السلف الممنوحة" value={fmt(stats.totalAdvances)} icon="fa-hand-holding-dollar" iconColor="var(--blue)" />
        <StatCard label="طلبات معلقة" value={String(stats.pendingCount)} badge={stats.pendingCount > 0 ? '!' : '✓'} badgeType={stats.pendingCount > 0 ? 'warn' : 'success'} icon="fa-clock" iconColor="var(--warn)" />
        <StatCard label="معتمد هذا الشهر" value={fmt(stats.approvedThisMonth)} badge="✓" badgeType="success" icon="fa-check-circle" iconColor="var(--success)" />
      </div>

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
                <th>رقم الطلب</th><th>التاريخ</th><th>الموظف</th><th>الفئة</th>
                <th>البيان</th><th>النوع</th><th>المبلغ</th><th>الحالة</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>لا توجد طلبات</td></tr>
              )}
              {filtered.map(exp => (
                <tr key={exp.id}>
                  <td style={{ fontWeight: 600, fontSize: 12, color: 'var(--blue)' }}>{exp.id}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(new Date(exp.date))}</td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{exp.employee}</td>
                  <td>
                    <span style={{ fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 8px' }}>{exp.category}</span>
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
                        <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff', border: 'none', padding: '3px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer' }}
                          onClick={() => handleApprove(exp.id)}>
                          <i className="fa fa-check" /> موافقة
                        </button>
                        <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '3px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer' }}
                          onClick={() => handleReject(exp.id)}>
                          <i className="fa fa-times" /> رفض
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="طلب مصروف أو سلفة"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><i className="fa fa-spinner fa-spin" /> جارٍ الحفظ...</> : <><i className="fa fa-paper-plane" /> تقديم الطلب</>}
          </button>
        </>}
      >
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
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الموظف *</label>
            <select className="form-control" value={form.employee} onChange={e => setForm(f => ({ ...f, employee: e.target.value }))}>
              <option value="">اختر الموظف...</option>
              {employees.filter(e => e.status === 'active').map(emp => (
                <option key={emp.id} value={emp.name}>{emp.name} — {emp.position}</option>
              ))}
              <option value="__other__">موظف آخر (أدخل الاسم)</option>
            </select>
            {form.employee === '__other__' && (
              <input className="form-control" style={{ marginTop: 8 }} placeholder="اسم الموظف..." onChange={e => setForm(f => ({ ...f, employee: e.target.value }))} />
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الفئة</label>
              <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {EXPENSE_CATEGORIES.filter(c => c !== 'الكل').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>المبلغ (ر.س) *</label>
              <input className="form-control" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>التاريخ</label>
            <input className="form-control" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>البيان *</label>
            <textarea className="form-control" rows={3} placeholder="وصف المصروف أو سبب السلفة..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'none' }} />
          </div>
        </div>
        {saveError && (
          <div style={{ marginTop: 14, background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--danger)' }}>
            <i className="fa fa-exclamation-circle" style={{ marginLeft: 6 }} />{saveError}
          </div>
        )}
      </Modal>
    </>
  )
}
