import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Expense } from '@/lib/mock-data/expenses'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import StatusBadge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { fmt, initials, fmtDate } from '@/lib/format'
import { DEPARTMENTS } from '@/lib/mock-data/hr'
import { useHRStore } from '@/store/hr.store'
import { useDelegateStore } from '@/store/delegate.store'
import { useTreasuryStore } from '@/store/treasury.store'
import { useExpenseStore } from '@/store/expense.store'
import { useAppStore } from '@/store/app.store'
import { printPayslip } from '@/lib/print'
import { toast } from '@/lib/toast'
import { useSaving } from '@/lib/useSaving'

// ── Fixed Assets imports ──
import { FIXED_ASSETS, ASSET_CATEGORIES, type AssetStatus, type AssetOwnership, type FixedAsset } from '@/lib/mock-data/fixed-assets'

// ── Users imports ──
import { USERS, ROLE_LABELS, USER_STATS, type UserRole, type UserStatus } from '@/lib/mock-data/users'

const TABS = ['الموظفون', 'المندوبون', 'مسير الرواتب', 'سجل الرواتب', 'السلف والمصروفات', 'الأصول الثابتة', 'المستخدمون']

// ── Fixed Assets helpers ──
const ASSET_STATUS_COLORS: Record<AssetStatus, string> = { active: 'var(--success)', maintenance: 'var(--warn)', disposed: 'var(--danger)' }
const ASSET_STATUS_LABELS: Record<AssetStatus, string> = { active: 'نشط', maintenance: 'في الصيانة', disposed: 'مُستغنى عنه' }
const ASSET_CAT_ICONS: Record<string, string> = { 'أجهزة كمبيوتر': 'fa-laptop', 'معدات مكتبية': 'fa-print', 'سيارات': 'fa-car', 'أثاث': 'fa-couch', 'معدات طباعة': 'fa-print' }
const EMPTY_ASSET_FORM = { name: '', category: 'أجهزة كمبيوتر', ownership: 'owned' as AssetOwnership, monthlyRent: '', purchaseDate: '', cost: '', depRate: '33', location: 'الرئيسي', status: 'active' as AssetStatus, serialNumber: '' }

function buildDepSchedule(asset: FixedAsset) {
  const rows: { year: string; charge: number; accumulated: number; bookValue: number }[] = []
  const annual = (asset.cost * asset.depRate) / 100
  const startYear = new Date(asset.purchaseDate).getFullYear()
  let acc = 0
  for (let i = 0; i < Math.ceil(100 / asset.depRate); i++) {
    acc = Math.min(acc + annual, asset.cost)
    rows.push({ year: String(startYear + i), charge: Math.min(annual, asset.cost - (acc - Math.min(annual, asset.cost - acc + annual))), accumulated: acc, bookValue: Math.max(asset.cost - acc, 0) })
    if (acc >= asset.cost) break
  }
  return rows
}

// ── Users helpers ──
const USER_STATUS_COLORS: Record<UserStatus, string> = { active: 'var(--success)', inactive: 'var(--muted)', suspended: 'var(--danger)' }
const USER_STATUS_LABELS: Record<UserStatus, string> = { active: 'نشط', inactive: 'غير نشط', suspended: 'موقوف' }
const USER_ROLE_COLORS: Record<UserRole, string> = { admin: '#7C3AED', accountant: '#2563EB', cashier: '#10B981', sales: '#D97706', hr: '#DC2626', viewer: '#6B7280' }
const USER_AVATAR_COLORS = ['#2563EB','#7C3AED','#10B981','#D97706','#DC2626','#0891B2','#059669','#6B7280']

export default function HRPage() {
  const { saving, run } = useSaving()
  const navigate = useNavigate()
  const employees = useHRStore(s => s.employees)
  const addEmployee = useHRStore(s => s.addEmployee)
  const updateEmployee = useHRStore(s => s.updateEmployee)
  const delegates = useDelegateStore(s => s.delegates)
  const addTransaction = useTreasuryStore(s => s.addTransaction)
  const accounts = useTreasuryStore(s => s.accounts)
  const expenseStore = useExpenseStore()
  const [tab, setTab] = useState('الموظفون')
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('الكل')
  const [showNew, setShowNew] = useState(false)
  const [profileEmp, setProfileEmp] = useState<string | null>(null)
  const [editEmpId, setEditEmpId] = useState<string | null>(null)
  const [editEmpForm, setEditEmpForm] = useState({ name: '', position: '', department: '', salary: '', allowances: '', deductions: '', phone: '', email: '', iqama: '' })
  const [newEmpForm, setNewEmpForm] = useState({ name: '', position: '', department: DEPARTMENTS[1] ?? '', salary: '', allowances: '', phone: '', email: '', joinDate: new Date().toISOString().slice(0, 10) })
  const [showNewExpense, setShowNewExpense] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ type: 'سلفة', employee: '', amount: '', reason: '', account: 'cash' })
  const [payrollRun, setPayrollRun] = useState(false)

  // Use expense store instead of local state
  const expenses = expenseStore.expenses
  const totalExpenses = expenseStore.totalExpenses()
  const totalAdvances = expenseStore.totalAdvances()
  const pendingCount = expenseStore.pendingCount()
  const approvedThisMonth = expenseStore.approvedThisMonth()

  // ── Fixed Assets state ──
  const [assets, setAssets] = useState<FixedAsset[]>(FIXED_ASSETS)
  const [assetCatFilter, setAssetCatFilter] = useState('الكل')
  const [assetOwnershipFilter, setAssetOwnershipFilter] = useState<'all' | AssetOwnership>('all')
  const [assetStatusFilter, setAssetStatusFilter] = useState<'all' | AssetStatus>('all')
  const [assetSearch, setAssetSearch] = useState('')
  const [viewAsset, setViewAsset] = useState<FixedAsset | null>(null)
  const [deleteAsset, setDeleteAsset] = useState<FixedAsset | null>(null)
  const [showNewAsset, setShowNewAsset] = useState(false)
  const [assetForm, setAssetForm] = useState(EMPTY_ASSET_FORM)
  const [showRental, setShowRental] = useState(false)
  const [rentalAsset, setRentalAsset] = useState<FixedAsset | null>(null)
  const [rentalMonth, setRentalMonth] = useState(new Date().toISOString().slice(0, 7))
  const [rentalAmount, setRentalAmount] = useState('')
  const [rentalAccount, setRentalAccount] = useState('cash')

  // ── Users state ──
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all')
  const [showNewUser, setShowNewUser] = useState(false)
  const [showPerms, setShowPerms] = useState<typeof USERS[0] | null>(null)

  // ── Unified Payroll Calculation ──
  const payrollItems = useMemo(() => {
    const items: any[] = []

    // 1. Regular Employees
    employees.forEach(emp => {
      if (emp.status !== 'active') return
      const empAdvances = expenses.filter((ex: Expense) => ex.type === 'advance' && ex.employee === emp.name && ex.status === 'approved').reduce((s, ex) => s + ex.amount, 0)
      items.push({
        id: emp.id, name: emp.name, type: 'موظف',
        basic: emp.salary, allowances: emp.allowances, deductions: emp.deductions,
        advance: empAdvances,
        net: emp.salary + emp.allowances - emp.deductions - empAdvances
      })
    })

    // 2. Delegates (Dynamic base salary + commission rate)
    delegates.forEach(del => {
      if (del.status !== 'active') return
      const baseSalary = del.baseSalary || 4000
      const commissionRate = (del.commissionRate || 5) / 100
      const commission = del.stats.totalSales * commissionRate
      const delAdvances = expenses.filter((ex: Expense) => ex.type === 'advance' && ex.employee === del.name && ex.status === 'approved').reduce((s, ex) => s + ex.amount, 0)
      items.push({
        id: del.id, name: del.name, type: 'مندوب',
        basic: baseSalary, allowances: commission, deductions: 0,
        advance: delAdvances,
        net: baseSalary + commission - 0 - delAdvances
      })
    })

    return items
  }, [delegates, expenses])

  const totalPayrollNet = payrollItems.reduce((s, item) => s + item.net, 0)
  const salaryPayments = useHRStore(s => s.salaryPayments)
  const runPayroll = useHRStore(s => s.runPayroll)

  const filtered = employees.filter(e => {
    const matchDept = dept === 'الكل' || e.department === dept
    const matchSearch = !search || e.name.includes(search) || e.position.includes(search)
    return matchDept && matchSearch
  })

  const totalSalaries = employees.reduce((s, e) => s + e.netSalary, 0)
  const active = employees.filter(e => e.status === 'active').length
  const onLeave = employees.filter(e => e.status === 'leave').length

  const currentMonth = new Date().toISOString().slice(0, 7)
  const [payrollMonth, setPayrollMonth] = useState(currentMonth)

  async function handleRunPayroll() {
    if (payrollItems.length === 0) {
      toast('لا يوجد موظفون أو مناديب نشطون للصرف', 'warn')
      return
    }

    const alreadyPaid = salaryPayments.some(p => p.month === payrollMonth)
    if (alreadyPaid) {
      if (!window.confirm('تم صرف رواتب هذا الشهر مسبقاً. هل تريد الصرف مرة أخرى؟')) return
    }

    run(async () => {
      await runPayroll(payrollMonth, payrollItems.map(item => ({
        employeeId: item.type === 'موظف' ? item.id : undefined,
        delegateId: item.type === 'مندوب' ? item.id : undefined,
        name: item.name,
        basicSalary: item.basic,
        allowances: item.allowances,
        deductions: item.deductions,
        netSalary: item.net,
      })))
      setPayrollRun(true)
      toast(`تم صرف رواتب شهر ${payrollMonth} بنجاح!`, 'success')
    }).catch((err: any) => toast(`خطأ في الصرف: ${err?.message || 'حاول مرة أخرى'}`, 'danger'))
  }

  // ── Fixed Assets handlers ──
  const filteredAssets = assets.filter(a => {
    const matchCat = assetCatFilter === 'الكل' || a.category === assetCatFilter
    const matchOwnership = assetOwnershipFilter === 'all' || a.ownership === assetOwnershipFilter
    const matchStatus = assetStatusFilter === 'all' || a.status === assetStatusFilter
    const matchSearch = !assetSearch || a.name.includes(assetSearch) || a.id.includes(assetSearch)
    return matchCat && matchOwnership && matchStatus && matchSearch
  })

  const depPct = (a: FixedAsset) => Math.min(Math.round((a.accumulated / a.cost) * 100), 100)

  const handleDeleteAsset = () => {
    if (!deleteAsset) return
    setAssets(prev => prev.filter(a => a.id !== deleteAsset.id))
    toast(`تم حذف الأصل "${deleteAsset.name}"`, 'success')
    setDeleteAsset(null)
    if (viewAsset?.id === deleteAsset.id) setViewAsset(null)
  }

  const handleAddAsset = () => {
    if (!assetForm.name.trim()) { toast('يرجى إدخال اسم الأصل', 'warn'); return }
    if (!assetForm.purchaseDate) { toast('يرجى تحديد تاريخ الشراء', 'warn'); return }
    if (!assetForm.cost || +assetForm.cost <= 0) { toast('يرجى إدخال تكلفة صحيحة', 'warn'); return }

    run(async () => {
      const cost = +assetForm.cost
      const depRate = +assetForm.depRate
      const newId = `FA-${String(assets.length + 1).padStart(3, '0')}`
      const yearsSince = (new Date().getFullYear() - new Date(assetForm.purchaseDate).getFullYear())
      const accumulated = Math.min((cost * depRate / 100) * Math.max(yearsSince, 0), cost)
      const bookValue = Math.max(cost - accumulated, 0)

      const newAsset: FixedAsset = {
        id: newId, name: assetForm.name.trim(), category: assetForm.category, ownership: assetForm.ownership,
        purchaseDate: assetForm.purchaseDate, cost, accumulated, bookValue, depRate,
        status: assetForm.status, location: assetForm.location || 'الرئيسي',
        monthlyRent: assetForm.ownership === 'rental' && assetForm.monthlyRent ? +assetForm.monthlyRent : undefined,
      }
      setAssets(prev => [newAsset, ...prev])
      toast(`تم إضافة الأصل "${newAsset.name}" بنجاح`, 'success')
      setShowNewAsset(false)
      setAssetForm(EMPTY_ASSET_FORM)
    })
  }

  const handleRental = () => {
    if (!rentalAsset) return
    const amt = parseFloat(rentalAmount)
    if (!amt || amt <= 0) { toast('يرجى إدخال مبلغ الإيجار', 'warn'); return }
    addTransaction({
      date: new Date().toISOString().slice(0, 10),
      description: `إيجار شهري — ${rentalAsset.name} (${rentalMonth})`,
      type: 'out', category: 'expense', amount: amt, account: rentalAccount,
    })
    toast(`تم خصم إيجار ${rentalAsset.name} — ${fmt(amt)} ر.س`, 'success')
    setShowRental(false)
    setRentalAsset(null)
    setRentalAmount('')
  }

  const totalAssetCost = assets.reduce((s, a) => s + a.cost, 0)
  const totalAssetAccumulated = assets.reduce((s, a) => s + a.accumulated, 0)
  const totalAssetBookValue = assets.reduce((s, a) => s + a.bookValue, 0)
  const activeAssetCount = assets.filter(a => a.status === 'active').length

  // ── Users handlers ──
  const filteredUsers = userRoleFilter === 'all' ? USERS : USERS.filter(u => u.role === userRoleFilter)

  function handleAddExpense() {
    const amt = parseFloat(expenseForm.amount)
    if (!amt || !expenseForm.employee) {
      toast('يرجى تعبئة جميع الحقول المطلوبة', 'danger')
      return
    }

    run(async () => {
      // Deduct from treasury
      addTransaction({
        date: new Date().toISOString().slice(0, 10),
        description: `${expenseForm.type} - ${expenseForm.employee} (${expenseForm.reason})`,
        type: 'out',
        category: 'expense',
        amount: amt,
        account: expenseForm.account
      })

      // Add to expense store (real data)
      expenseStore.addExpense({
        date: new Date().toISOString().slice(0, 10),
        employee: expenseForm.employee,
        category: expenseForm.type === 'سلفة' ? 'أخرى' : (expenseForm.reason || 'أخرى'),
        description: `${expenseForm.type} - ${expenseForm.employee}: ${expenseForm.reason}`,
        amount: amt,
        type: expenseForm.type === 'سلفة' ? 'advance' : 'expense',
        status: 'approved',
      })

      toast(`تم تسجيل ال${expenseForm.type} وخصمها من الخزنة`, 'success')
      setShowNewExpense(false)
      setExpenseForm({ type: 'سلفة', employee: '', amount: '', reason: '', account: 'cash' })
    })
  }

  return (
    <>
      <PageHeader
        title="الموارد البشرية والأصول"
        subtitle={`${employees.length} موظف · ${delegates.length} مندوب · ${assets.length} أصل · ${USERS.length} مستخدم`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {tab === 'الموظفون' && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
                <i className="fa fa-plus" /> موظف جديد
              </button>
            )}
            {tab === 'الأصول الثابتة' && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowNewAsset(true)}>
                <i className="fa fa-plus" /> أصل جديد
              </button>
            )}
            {tab === 'المستخدمون' && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowNewUser(true)}>
                <i className="fa fa-user-plus" /> مستخدم جديد
              </button>
            )}
          </div>
        }
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي الموظفين" value={String(employees.length)} dark icon="fa-users" />
        <StatCard label="موظفون نشطون" value={String(active)} badge="نشط" badgeType="success" icon="fa-user-check" iconColor="var(--success)" />
        <StatCard label="في إجازة" value={String(onLeave)} badge="إجازة" badgeType="warn" icon="fa-umbrella-beach" iconColor="var(--warn)" />
        <StatCard label="إجمالي الرواتب" value={fmt(totalSalaries)} icon="fa-money-bill-wave" iconColor="var(--blue)" />
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'الموظفون' && (
        <>
          <div className="card mb-4">
            <div className="card-body" style={{ padding: '14px 20px' }}>
              <div className="filter-bar" style={{ marginBottom: 0 }}>
                <div className="search-box" style={{ flex: 1, maxWidth: 320 }}>
                  <i className="fa fa-search icon" />
                  <input placeholder="ابحث بالاسم أو المسمى..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {DEPARTMENTS.map(d => (
                  <button key={d} onClick={() => setDept(d)} className={`btn btn-sm ${dept === d ? 'btn-primary' : 'btn-outline'}`}>{d}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الموظف</th>
                    <th>المسمى الوظيفي</th>
                    <th>القسم</th>
                    <th>الراتب الأساسي</th>
                    <th>البدلات</th>
                    <th>الخصومات</th>
                    <th>صافي الراتب</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                            {initials(e.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{e.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{e.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{e.position}</td>
                      <td>
                        <span style={{ background: 'var(--blue-light)', color: 'var(--blue)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                          {e.department}
                        </span>
                      </td>
                      <td>{fmt(e.salary)}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>+{fmt(e.allowances)}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 600 }}>-{fmt(e.deductions)}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{fmt(e.netSalary)}</td>
                      <td><StatusBadge status={e.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-icon btn-outline btn-sm" title="عرض البروفايل" onClick={() => setProfileEmp(e.id)}><i className="fa fa-eye" /></button>
                          <button className="btn btn-icon btn-outline btn-sm" title="طباعة قسيمة الراتب" onClick={() => {
                            const month = new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })
                            printPayslip(useAppStore.getState().company, e, month)
                          }}><i className="fa fa-print" /></button>
                          <button className="btn btn-icon btn-outline btn-sm" title="تعديل" onClick={() => {
                            setEditEmpId(e.id)
                            setEditEmpForm({ name: e.name, position: e.position, department: e.department, salary: String(e.salary), allowances: String(e.allowances), deductions: String(e.deductions), phone: e.phone, email: e.email, iqama: e.iqama ?? '' })
                          }}><i className="fa fa-edit" /></button>
                          <button className="btn btn-icon btn-outline btn-sm" title={e.status === 'active' ? 'إيقاف' : 'تفعيل'}
                            style={{ color: e.status === 'active' ? 'var(--warn)' : 'var(--success)' }}
                            onClick={() => {
                              const newStatus = e.status === 'active' ? 'inactive' : 'active'
                              updateEmployee(e.id, { status: newStatus })
                              toast(`تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} الموظف ${e.name}`, 'success')
                            }}>
                            <i className={`fa ${e.status === 'active' ? 'fa-pause' : 'fa-play'}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{filtered.length} موظف</span>
              <button className="btn btn-primary btn-sm" onClick={handleRunPayroll} disabled={payrollRun}>
                <i className="fa fa-play" /> {payrollRun ? 'تم تشغيل المسير' : 'تشغيل مسير الرواتب'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Delegates Tab ── */}
      {tab === 'المندوبون' && (
        <div className="card">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span><i className="fa fa-user-tie" style={{ marginLeft: 8, color: 'var(--blue)' }} /> المندوبون</span>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/erp/delegates')}>
              <i className="fa fa-external-link-alt" /> إدارة المندوبين
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>المندوب</th><th>المنطقة</th><th>الحالة</th><th>المبيعات</th><th>الرصيد</th><th>إجراء</th></tr>
              </thead>
              <tbody>
                {delegates.map(d => (
                  <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/delegates/${d.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: d.status === 'active' ? 'var(--success-bg)' : 'var(--danger-bg)', color: d.status === 'active' ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>{d.avatar}</div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>{d.zone}</td>
                    <td><span className={`status ${d.status === 'active' ? 'status-active' : 'status-inactive'}`}>{d.status === 'active' ? 'نشط' : 'غير نشط'}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(d.stats.totalSales)}</td>
                    <td style={{ fontWeight: 700, color: d.stats.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(d.stats.balance)}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); navigate(`/erp/delegates/${d.id}`) }}><i className="fa fa-eye" /> عرض</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Payroll Tab ── */}
      {tab === 'مسير الرواتب' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">مسير رواتب الشهر</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)' }}>الشهر:</label>
              <input type="month" className="form-control" style={{ width: 160 }} value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} />
            </div>
          </div>
          <div className="card-body">
            <div className="grid-3 mb-4">
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(totalPayrollNet)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>إجمالي الرواتب الصافية</div>
              </div>
              <div style={{ background: 'var(--success-bg)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{payrollItems.length}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>مستحق للراتب</div>
              </div>
              <div style={{ background: 'var(--warn-bg)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warn)' }}>{fmt(payrollItems.reduce((s, i) => s + i.advance, 0))}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>إجمالي السلف المخصومة</div>
              </div>
            </div>

            <div className="table-wrap mb-4">
              <table>
                <thead>
                  <tr><th>الاسم</th><th>النوع</th><th>الأساسي</th><th>البدلات/العمولة</th><th>الاستقطاعات</th><th>سلف مخصومة</th><th>الصافي</th></tr>
                </thead>
                <tbody>
                  {payrollItems.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td><span style={{ background: item.type === 'مندوب' ? 'var(--blue-light)' : 'var(--bg)', color: item.type === 'مندوب' ? 'var(--blue)' : 'var(--text)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{item.type}</span></td>
                      <td>{fmt(item.basic)}</td>
                      <td style={{ color: 'var(--success)' }}>+{fmt(item.allowances)}</td>
                      <td style={{ color: 'var(--danger)' }}>-{fmt(item.deductions)}</td>
                      <td style={{ color: 'var(--warn)' }}>{item.advance > 0 ? `-${fmt(item.advance)}` : '0'}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{fmt(item.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="btn btn-primary" onClick={handleRunPayroll} disabled={saving}>
              <i className={`fa ${saving ? 'fa-spinner fa-spin' : 'fa-rocket'}`} /> {saving ? 'جارٍ الصرف...' : 'تنفيذ مسير الرواتب'}
            </button>
          </div>
        </div>
      )}

      {/* ── Salary History Tab ── */}
      {tab === 'سجل الرواتب' && (
        <div className="card">
          <div className="card-header"><span className="card-title">سجل الرواتب المدفوعة</span></div>
          <div className="card-body">
            {salaryPayments.length === 0 ? (
              <div className="empty-state">
                <i className="fa fa-money-bill-wave empty-state-icon" />
                <div className="empty-state-title">لا توجد رواتب مدفوعة</div>
                <div className="empty-state-sub">سيتم عرض الرواتب بعد تنفيذ مسير الرواتب</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>الشهر</th><th>الاسم</th><th>الراتب الأساسي</th><th>البدلات</th><th>الخصومات</th><th>الصافي</th><th>تاريخ الصرف</th></tr>
                  </thead>
                  <tbody>
                    {salaryPayments.map(payment => (
                      <tr key={payment.id}>
                        <td style={{ fontWeight: 700 }}>{payment.month}</td>
                        <td style={{ fontWeight: 600 }}>{payment.name}</td>
                        <td>{fmt(payment.basicSalary)}</td>
                        <td style={{ color: 'var(--success)' }}>+{fmt(payment.allowances)}</td>
                        <td style={{ color: 'var(--danger)' }}>-{fmt(payment.deductions)}</td>
                        <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{fmt(payment.netSalary)}</td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(payment.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bg)', fontWeight: 800 }}>
                      <td colSpan={5}>الإجمالي</td>
                      <td style={{ color: 'var(--primary)' }}>{fmt(salaryPayments.reduce((s, p) => s + p.netSalary, 0))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Expenses & Advances Tab ── */}
      {tab === 'السلف والمصروفات' && (
        <>
          {/* Stats Cards */}
          <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <StatCard label="إجمالي المصروفات" value={fmt(totalExpenses)} dark icon="fa-receipt" />
            <StatCard label="إجمالي السلف" value={fmt(totalAdvances)} badge="موافق" badgeType="success" icon="fa-hand-holding-usd" iconColor="var(--warn)" />
            <StatCard label="بانتظار الموافقة" value={String(pendingCount)} badge={pendingCount > 0 ? 'تنبيه' : 'لا يوجد'} badgeType={pendingCount > 0 ? 'danger' : 'success'} icon="fa-clock" iconColor="var(--danger)" />
            <StatCard label="معتمد هذا الشهر" value={fmt(approvedThisMonth)} icon="fa-check-circle" iconColor="var(--success)" />
          </div>

          <div className="card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span><i className="fa fa-hand-holding-usd" style={{ marginLeft: 8, color: 'var(--warn)' }} /> سجل السلف والمصروفات</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowNewExpense(true)}>
                <i className="fa fa-plus" /> إضافة سلفة/مصروف
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>التاريخ</th><th>الموظف</th><th>النوع</th><th>المبلغ</th><th>السبب</th><th>الحالة</th></tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id}>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(exp.date)}</td>
                      <td style={{ fontWeight: 600 }}>{exp.employee}</td>
                      <td><span style={{ background: exp.type === 'advance' ? 'var(--blue-light)' : 'var(--warn-bg)', color: exp.type === 'advance' ? 'var(--blue)' : 'var(--warn)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{exp.type === 'advance' ? 'سلفة' : 'مصروف'}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(exp.amount)}</td>
                      <td style={{ fontSize: 12 }}>{exp.description}</td>
                      <td>
                        {exp.status === 'approved' ? (
                          <span className="status status-active" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>معتمد</span>
                        ) : exp.status === 'pending' ? (
                          <span className="status status-pending">بانتظار</span>
                        ) : (
                          <span className="status status-inactive">مرفوض</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'الحضور والإجازات' && (
        <div className="card">
          <div className="card-body empty-state">
            <div className="empty-state-icon">🚧</div>
            <div className="empty-state-title">قيد التطوير</div>
            <div className="empty-state-sub">هذه الميزة ستكون متاحة قريباً</div>
          </div>
        </div>
      )}

      {/* ── Fixed Assets Tab ── */}
      {tab === 'الأصول الثابتة' && (
        <>
          <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <StatCard label="التكلفة الإجمالية" value={fmt(totalAssetCost)} dark icon="fa-building" />
            <StatCard label="مجمع الاستهلاك" value={fmt(totalAssetAccumulated)} icon="fa-arrow-trend-down" iconColor="var(--danger)" />
            <StatCard label="القيمة الدفترية" value={fmt(totalAssetBookValue)} badge="صافي" badgeType="success" icon="fa-scale-balanced" iconColor="var(--success)" />
            <StatCard label="الأصول النشطة" value={String(activeAssetCount)} icon="fa-check-circle" iconColor="var(--blue)" />
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body" style={{ padding: '12px 20px' }}>
              <div className="filter-bar" style={{ marginBottom: 0, flexWrap: 'wrap', gap: 10 }}>
                <div className="search-box" style={{ flex: 1, maxWidth: 280 }}>
                  <i className="fa fa-search icon" />
                  <input placeholder="ابحث بالاسم أو الرقم..." value={assetSearch} onChange={e => setAssetSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ASSET_CATEGORIES.map(c => (
                    <button key={c} onClick={() => setAssetCatFilter(c)} className={`btn btn-sm ${assetCatFilter === c ? 'btn-primary' : 'btn-outline'}`}>{c}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([['all','الكل'],['owned','تمليك'],['rental','إيجار']] as [typeof assetOwnershipFilter, string][]).map(([k,v]) => (
                    <button key={k} onClick={() => setAssetOwnershipFilter(k)} className={`btn btn-sm ${assetOwnershipFilter === k ? 'btn-primary' : 'btn-outline'}`}>{v}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([['all','الكل'],['active','نشط'],['maintenance','صيانة'],['disposed','مُستغنى']] as [typeof assetStatusFilter, string][]).map(([k,v]) => (
                    <button key={k} onClick={() => setAssetStatusFilter(k)} className={`btn btn-sm ${assetStatusFilter === k ? 'btn-primary' : 'btn-outline'}`}>{v}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>رقم الأصل</th><th>اسم الأصل</th><th>الفئة</th><th>الملكية</th><th>تاريخ الشراء</th><th>التكلفة</th><th>الاستهلاك</th><th>القيمة الدفترية</th><th>نسبة الاستهلاك</th><th>الموقع</th><th>الحالة</th><th>إجراء</th></tr>
                </thead>
                <tbody>
                  {filteredAssets.map(a => (
                    <tr key={a.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--blue)' }}>{a.id}</span></td>
                      <td style={{ fontWeight: 600 }}>{a.name}</td>
                      <td><i className={`fa ${ASSET_CAT_ICONS[a.category] ?? 'fa-box'}`} style={{ marginLeft: 6, color: 'var(--muted)' }} />{a.category}</td>
                      <td>{a.ownership === 'owned' ? 'تمليك' : 'إيجار'}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(a.purchaseDate)}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(a.cost)}</td>
                      <td style={{ color: 'var(--danger)' }}>{fmt(a.accumulated)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(a.bookValue)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${depPct(a)}%`, background: depPct(a) > 80 ? 'var(--danger)' : depPct(a) > 50 ? 'var(--warn)' : 'var(--success)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', minWidth: 30 }}>{depPct(a)}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{a.location}</td>
                      <td><span style={{ fontSize: 11, fontWeight: 700, color: ASSET_STATUS_COLORS[a.status], background: ASSET_STATUS_COLORS[a.status] + '15', padding: '2px 8px', borderRadius: 6 }}>{ASSET_STATUS_LABELS[a.status]}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-icon btn-outline btn-sm" title="عرض التفاصيل" onClick={() => setViewAsset(a)}><i className="fa fa-eye" /></button>
                          {a.ownership === 'rental' && (
                            <button className="btn btn-icon btn-outline btn-sm" title="تسجيل إيجار" onClick={() => { setRentalAsset(a); setShowRental(true) }}><i className="fa fa-money-bill-wave" /></button>
                          )}
                          <button className="btn btn-icon btn-outline btn-sm" title="حذف" style={{ color: 'var(--danger)' }} onClick={() => setDeleteAsset(a)}><i className="fa fa-trash" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Users Tab ── */}
      {tab === 'المستخدمون' && (
        <>
          <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <StatCard label="إجمالي المستخدمين" value={String(USER_STATS.total)} dark icon="fa-users-cog" />
            <StatCard label="نشطون" value={String(USER_STATS.active)} badge="✓" badgeType="success" icon="fa-circle-check" iconColor="var(--success)" />
            <StatCard label="غير نشطين" value={String(USER_STATS.inactive)} icon="fa-circle-minus" iconColor="var(--muted)" />
            <StatCard label="موقوفون" value={String(USER_STATS.suspended)} badge="!" badgeType="danger" icon="fa-ban" iconColor="var(--danger)" />
          </div>

          {/* Role filter */}
          <div className="card mb-4">
            <div className="card-body" style={{ padding: '12px 20px' }}>
              <div className="filter-bar" style={{ marginBottom: 0, flexWrap: 'wrap' }}>
                <button onClick={() => setUserRoleFilter('all')} className={`btn btn-sm ${userRoleFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}>الكل</button>
                {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([k, v]) => (
                  <button key={k} onClick={() => setUserRoleFilter(k)} className={`btn btn-sm ${userRoleFilter === k ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderColor: USER_ROLE_COLORS[k], color: userRoleFilter === k ? '#fff' : USER_ROLE_COLORS[k] }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Users grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {filteredUsers.map((user, i) => (
              <div key={user.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: USER_AVATAR_COLORS[i % USER_AVATAR_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {initials(user.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  </div>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: USER_STATUS_COLORS[user.status], boxShadow: user.status === 'active' ? `0 0 0 3px ${USER_STATUS_COLORS[user.status]}30` : 'none', flexShrink: 0 }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: USER_ROLE_COLORS[user.role], background: USER_ROLE_COLORS[user.role] + '18', borderRadius: 6, padding: '3px 10px' }}>{ROLE_LABELS[user.role]}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: USER_STATUS_COLORS[user.status], background: USER_STATUS_COLORS[user.status] + '15', borderRadius: 6, padding: '3px 10px' }}>{USER_STATUS_LABELS[user.status]}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px' }}><i className="fa fa-building" style={{ marginLeft: 4 }} />{user.branch}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}><i className="fa fa-clock" style={{ marginLeft: 6 }} />آخر دخول: {user.lastLogin}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-outline" style={{ flex: 1, fontSize: 11 }} onClick={() => setShowPerms(user)}><i className="fa fa-shield-halved" /> الصلاحيات</button>
                  <button className="btn btn-sm btn-outline" style={{ fontSize: 11 }} onClick={() => toast('تم إرسال رابط تغيير كلمة المرور', 'success')}><i className="fa fa-key" /></button>
                  {user.status === 'active' ? (
                    <button className="btn btn-sm" style={{ fontSize: 11, background: 'var(--danger)', color: '#fff', border: 'none' }} onClick={() => toast('تم إيقاف المستخدم مؤقتاً', 'info')}><i className="fa fa-ban" /></button>
                  ) : (
                    <button className="btn btn-sm" style={{ fontSize: 11, background: 'var(--success)', color: '#fff', border: 'none' }} onClick={() => toast('تم تفعيل المستخدم', 'success')}><i className="fa fa-check" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={showNewExpense} onClose={() => setShowNewExpense(false)} title="إضافة سلفة أو مصروف" footer={
        <>
          <button className="btn btn-outline" onClick={() => setShowNewExpense(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleAddExpense} disabled={saving}><i className="fa fa-save" /> حفظ واعتماد</button>
        </>
      }>
        <div className="form-grid-2">
          <div className="form-group col-span-2">
            <label className="form-label">نوع الطلب</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['سلفة', 'مصروف'].map(t => (
                <button key={t} className={`btn ${expenseForm.type === t ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setExpenseForm(f => ({ ...f, type: t }))}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">الموظف/المندوب</label>
            <select className="form-control" value={expenseForm.employee} onChange={e => setExpenseForm(f => ({ ...f, employee: e.target.value }))}>
              <option value="">اختر الموظف...</option>
              <optgroup label="الموظفون">
                {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
              </optgroup>
              <optgroup label="المندوبون">
                {delegates.map(del => <option key={del.id} value={del.name}>{del.name}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">المبلغ</label>
            <input className="form-control" type="number" placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">خصم من حساب</label>
            <select className="form-control" value={expenseForm.account} onChange={e => setExpenseForm(f => ({ ...f, account: e.target.value }))}>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.label} ({fmt(acc.balance)})</option>)}
            </select>
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">السبب / البيان</label>
            <input className="form-control" placeholder="اكتب تفاصيل الطلب..." value={expenseForm.reason} onChange={e => setExpenseForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="إضافة موظف جديد"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
            <button className="btn btn-primary" disabled={saving} onClick={() => {
              if (!newEmpForm.name || !newEmpForm.position) { toast('يرجى تعبئة الاسم والمسمى الوظيفي', 'danger'); return }
              run(async () => {
                const salary = parseFloat(newEmpForm.salary) || 0
                const allowances = parseFloat(newEmpForm.allowances) || 0
                addEmployee({ name: newEmpForm.name, position: newEmpForm.position, department: newEmpForm.department, salary, allowances, deductions: 0, netSalary: salary + allowances, phone: newEmpForm.phone, email: newEmpForm.email, joinDate: newEmpForm.joinDate, status: 'active' })
                toast('تم إضافة الموظف بنجاح', 'success')
                setShowNew(false)
                setNewEmpForm({ name: '', position: '', department: DEPARTMENTS[1] ?? '', salary: '', allowances: '', phone: '', email: '', joinDate: new Date().toISOString().slice(0, 10) })
              })
            }}>حفظ</button>
          </>
        }
      >
        <div className="form-grid-2">
          <div className="form-group col-span-2"><label className="form-label">الاسم الكامل</label><input className="form-control" value={newEmpForm.name} onChange={e => setNewEmpForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">المسمى الوظيفي</label><input className="form-control" value={newEmpForm.position} onChange={e => setNewEmpForm(f => ({ ...f, position: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">القسم</label><select className="form-control" value={newEmpForm.department} onChange={e => setNewEmpForm(f => ({ ...f, department: e.target.value }))}>{DEPARTMENTS.filter(d => d !== 'الكل').map(d => <option key={d}>{d}</option>)}</select></div>
          <div className="form-group"><label className="form-label">الراتب الأساسي</label><input className="form-control" type="number" value={newEmpForm.salary} onChange={e => setNewEmpForm(f => ({ ...f, salary: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">البدلات</label><input className="form-control" type="number" value={newEmpForm.allowances} onChange={e => setNewEmpForm(f => ({ ...f, allowances: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">الهاتف</label><input className="form-control" type="tel" value={newEmpForm.phone} onChange={e => setNewEmpForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">البريد الإلكتروني</label><input className="form-control" type="email" value={newEmpForm.email} onChange={e => setNewEmpForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">تاريخ الانضمام</label><input className="form-control" type="date" value={newEmpForm.joinDate} onChange={e => setNewEmpForm(f => ({ ...f, joinDate: e.target.value }))} /></div>
        </div>
      </Modal>

      {/* Employee Profile Modal */}
      {(() => {
        const emp = employees.find(e => e.id === profileEmp)
        if (!emp) return null
        return (
          <Modal open={!!profileEmp} onClose={() => setProfileEmp(null)} title="بروفايل الموظف"
            footer={<>
              <button className="btn btn-outline" onClick={() => setProfileEmp(null)}>إغلاق</button>
              <button className="btn btn-outline" onClick={() => {
                const month = new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })
                printPayslip(useAppStore.getState().company, emp, month)
              }}><i className="fa fa-print" /> طباعة قسيمة الراتب</button>
              <button className={`btn ${emp.status === 'active' ? 'btn-outline' : 'btn-primary'}`} style={{ color: emp.status === 'active' ? 'var(--warn)' : undefined }}
                onClick={() => {
                  const newStatus = emp.status === 'active' ? 'inactive' : 'active'
                  updateEmployee(emp.id, { status: newStatus })
                  toast(`تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} الموظف`, 'success')
                }}>
                <i className={`fa ${emp.status === 'active' ? 'fa-pause' : 'fa-play'}`} />
                {emp.status === 'active' ? 'إيقاف' : 'تفعيل'}
              </button>
            </>}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
                {initials(emp.name)}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{emp.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{emp.position} · {emp.department}</div>
                <span className={`status ${emp.status === 'active' ? 'status-active' : 'status-inactive'}`} style={{ marginTop: 4, display: 'inline-block' }}>
                  {emp.status === 'active' ? 'نشط' : emp.status === 'leave' ? 'في إجازة' : 'موقوف'}
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'الرقم الوظيفي', value: emp.id, icon: 'fa-id-badge' },
                { label: 'الهاتف', value: emp.phone, icon: 'fa-phone' },
                { label: 'البريد', value: emp.email, icon: 'fa-envelope' },
                { label: 'رقم الإقامة / الهوية', value: emp.iqama ?? 'غير مسجل', icon: 'fa-id-card' },
                { label: 'تاريخ الانضمام', value: fmtDate(emp.joinDate), icon: 'fa-calendar' },
              ].map(f => (
                <div key={f.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}><i className={`fa ${f.icon}`} style={{ marginLeft: 4 }} />{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                { label: 'الراتب الأساسي', value: fmt(emp.salary), color: 'var(--text)' },
                { label: 'البدلات', value: `+${fmt(emp.allowances)}`, color: 'var(--success)' },
                { label: 'الاستقطاعات', value: `-${fmt(emp.deductions)}`, color: 'var(--danger)' },
                { label: 'صافي الراتب', value: fmt(emp.netSalary), color: 'var(--primary)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </Modal>
        )
      })()}

      {/* Employee Edit Modal */}
      {(() => {
        const emp = employees.find(e => e.id === editEmpId)
        if (!emp) return null
        return (
          <Modal open={!!editEmpId} onClose={() => setEditEmpId(null)} title="تعديل بيانات الموظف"
            footer={<>
              <button className="btn btn-outline" onClick={() => setEditEmpId(null)}>إلغاء</button>
              <button className="btn btn-primary" disabled={saving} onClick={() => {
                run(async () => {
                  const salary = parseFloat(editEmpForm.salary) || 0
                  const allowances = parseFloat(editEmpForm.allowances) || 0
                  const deductions = parseFloat(editEmpForm.deductions) || 0
                  updateEmployee(emp.id, {
                    name: editEmpForm.name,
                    position: editEmpForm.position,
                    department: editEmpForm.department,
                    salary, allowances, deductions,
                    netSalary: salary + allowances - deductions,
                    phone: editEmpForm.phone,
                    email: editEmpForm.email,
                    iqama: editEmpForm.iqama || undefined,
                  })
                  toast('تم تحديث بيانات الموظف', 'success')
                  setEditEmpId(null)
                })
              }}><i className="fa fa-save" /> حفظ</button>
            </>}
          >
            <div className="form-grid-2">
              <div className="form-group col-span-2"><label className="form-label">الاسم</label><input className="form-control" value={editEmpForm.name} onChange={e => setEditEmpForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">المسمى الوظيفي</label><input className="form-control" value={editEmpForm.position} onChange={e => setEditEmpForm(f => ({ ...f, position: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">القسم</label><select className="form-control" value={editEmpForm.department} onChange={e => setEditEmpForm(f => ({ ...f, department: e.target.value }))}>{DEPARTMENTS.filter(d => d !== 'الكل').map(d => <option key={d}>{d}</option>)}</select></div>
              <div className="form-group"><label className="form-label">الراتب الأساسي</label><input className="form-control" type="number" value={editEmpForm.salary} onChange={e => setEditEmpForm(f => ({ ...f, salary: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">البدلات</label><input className="form-control" type="number" value={editEmpForm.allowances} onChange={e => setEditEmpForm(f => ({ ...f, allowances: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">الاستقطاعات</label><input className="form-control" type="number" value={editEmpForm.deductions} onChange={e => setEditEmpForm(f => ({ ...f, deductions: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">الهاتف</label><input className="form-control" type="tel" value={editEmpForm.phone} onChange={e => setEditEmpForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">البريد الإلكتروني</label><input className="form-control" type="email" value={editEmpForm.email} onChange={e => setEditEmpForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="form-group col-span-2"><label className="form-label">رقم الإقامة / الهوية <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(اختياري)</span></label><input className="form-control" value={editEmpForm.iqama} onChange={e => setEditEmpForm(f => ({ ...f, iqama: e.target.value }))} /></div>
            </div>
          </Modal>
        )
      })()}

      {/* ── Fixed Assets Modals ── */}
      {/* View Asset Modal */}
      <Modal open={!!viewAsset} onClose={() => setViewAsset(null)} title={viewAsset?.name ?? 'تفاصيل الأصل'}>
        {viewAsset && (
          <div>
            <div className="stats-grid mb-4" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>التكلفة الأصلية</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{fmt(viewAsset.cost)}</div>
              </div>
              <div style={{ background: 'var(--danger-bg)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>الاستهلاك المُجمَّع</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--danger)' }}>{fmt(viewAsset.accumulated)}</div>
              </div>
              <div style={{ background: 'var(--success-bg)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>القيمة الدفترية</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{fmt(viewAsset.bookValue)}</div>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>نسبة الاستهلاك</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${depPct(viewAsset)}%`, background: depPct(viewAsset) > 80 ? 'var(--danger)' : depPct(viewAsset) > 50 ? 'var(--warn)' : 'var(--success)', borderRadius: 5, transition: 'width .3s' }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{depPct(viewAsset)}%</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'تاريخ الشراء', value: fmtDate(viewAsset.purchaseDate) },
                { label: 'الموقع', value: viewAsset.location },
                { label: 'الفئة', value: viewAsset.category },
                { label: 'معدل الاستهلاك', value: `${viewAsset.depRate}% سنوياً` },
                { label: 'الرسوم السنوية', value: fmt((viewAsset.cost * viewAsset.depRate) / 100) },
                { label: 'السنوات المتبقية', value: `${Math.max(0, Math.ceil((100 - depPct(viewAsset)) / viewAsset.depRate))} سنة` },
              ].map(f => (
                <div key={f.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>جدول الاستهلاك</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>السنة</th><th>الرسوم</th><th>المُجمَّع</th><th>القيمة الدفترية</th></tr></thead>
                <tbody>
                  {buildDepSchedule(viewAsset).map(row => (
                    <tr key={row.year} style={{ background: new Date().getFullYear() === +row.year ? 'var(--warn-bg)' : undefined }}>
                      <td style={{ fontWeight: 700 }}>{row.year}</td>
                      <td>{fmt(row.charge)}</td>
                      <td style={{ color: 'var(--danger)' }}>{fmt(row.accumulated)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(row.bookValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Asset Confirmation */}
      <Modal open={!!deleteAsset} onClose={() => setDeleteAsset(null)} title="تأكيد الحذف">
        {deleteAsset && (
          <div>
            <p style={{ marginBottom: 16 }}>هل أنت متأكد من حذف الأصل <strong>{deleteAsset.name}</strong>؟</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteAsset(null)}>إلغاء</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteAsset}><i className="fa fa-trash" /> حذف</button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Asset Modal */}
      <Modal open={showNewAsset} onClose={() => setShowNewAsset(false)} title="أصل جديد"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowNewAsset(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleAddAsset} disabled={saving}><i className="fa fa-save" /> حفظ</button>
        </>}>
        <div className="form-grid-2">
          <div className="form-group col-span-2"><label className="form-label">اسم الأصل *</label><input className="form-control" value={assetForm.name} onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">الفئة</label><select className="form-control" value={assetForm.category} onChange={e => setAssetForm(f => ({ ...f, category: e.target.value }))}>{ASSET_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="form-group"><label className="form-label">الملكية</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([['owned','تمليك'],['rental','إيجار']] as [AssetOwnership, string][]).map(([k,v]) => (
                <button key={k} className={`btn btn-sm ${assetForm.ownership === k ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setAssetForm(f => ({ ...f, ownership: k }))}>{v}</button>
              ))}
            </div>
          </div>
          {assetForm.ownership === 'rental' && (
            <div className="form-group col-span-2"><label className="form-label">الإيجار الشهري</label><input className="form-control" type="number" value={assetForm.monthlyRent} onChange={e => setAssetForm(f => ({ ...f, monthlyRent: e.target.value }))} /></div>
          )}
          <div className="form-group"><label className="form-label">الحالة</label>
            <select className="form-control" value={assetForm.status} onChange={e => setAssetForm(f => ({ ...f, status: e.target.value as AssetStatus }))}>
              <option value="active">نشط</option><option value="maintenance">في الصيانة</option><option value="disposed">مُستغنى عنه</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">تاريخ الشراء *</label><input className="form-control" type="date" value={assetForm.purchaseDate} onChange={e => setAssetForm(f => ({ ...f, purchaseDate: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">التكلفة *</label><input className="form-control" type="number" value={assetForm.cost} onChange={e => setAssetForm(f => ({ ...f, cost: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">معدل الاستهلاك</label>
            <select className="form-control" value={assetForm.depRate} onChange={e => setAssetForm(f => ({ ...f, depRate: e.target.value }))}>
              {[{v:'10',l:'10% — 10 سنوات'},{v:'20',l:'20% — 5 سنوات'},{v:'25',l:'25% — 4 سنوات'},{v:'33',l:'33% — 3 سنوات'},{v:'50',l:'50% — سنتان'}].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">الموقع</label><input className="form-control" value={assetForm.location} onChange={e => setAssetForm(f => ({ ...f, location: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">الرقم التسلسلي</label><input className="form-control" value={assetForm.serialNumber} onChange={e => setAssetForm(f => ({ ...f, serialNumber: e.target.value }))} /></div>
          {assetForm.cost && assetForm.purchaseDate && (
            <div className="col-span-2" style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, fontSize: 12 }}>
              <strong>معاينة:</strong> قيمة دفترية تقديرية: {fmt(Math.max((+assetForm.cost || 0) - Math.min(((+assetForm.cost || 0) * (+assetForm.depRate || 0) / 100) * Math.max(new Date().getFullYear() - new Date(assetForm.purchaseDate).getFullYear(), 0), (+assetForm.cost || 0)), 0))} ر.س
            </div>
          )}
        </div>
      </Modal>

      {/* Rental Payment Modal */}
      <Modal open={showRental} onClose={() => setShowRental(false)} title="تسجيل إيجار شهري">
        {rentalAsset && (
          <div>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>الأصل</div>
              <div style={{ fontWeight: 700 }}>{rentalAsset.name}</div>
            </div>
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">الشهر</label><input className="form-control" type="month" value={rentalMonth} onChange={e => setRentalMonth(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">المبلغ</label><input className="form-control" type="number" placeholder="0.00" value={rentalAmount} onChange={e => setRentalAmount(e.target.value)} /></div>
              <div className="form-group col-span-2"><label className="form-label">الحساب</label>
                <select className="form-control" value={rentalAccount} onChange={e => setRentalAccount(e.target.value)}>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.label} ({fmt(acc.balance)})</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowRental(false)}>إلغاء</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleRental}><i className="fa fa-save" /> تسجيل</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Users Modals ── */}
      {/* New User Modal */}
      <Modal open={showNewUser} onClose={() => setShowNewUser(false)} title="إضافة مستخدم جديد">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الاسم الكامل</label><input className="form-control" placeholder="الاسم الكامل..." /></div>
          <div><label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>البريد الإلكتروني</label><input className="form-control" type="email" placeholder="example@company.sa" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الدور</label>
              <select className="form-control">{(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الفرع</label>
              <select className="form-control"><option>الرئيسي</option><option>الفرع الشمالي</option><option>الفرع الجنوبي</option></select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { toast('تم إنشاء الحساب وإرسال بيانات الدخول', 'success'); setShowNewUser(false) }}>إنشاء الحساب</button>
            <button className="btn btn-outline" onClick={() => setShowNewUser(false)}>إلغاء</button>
          </div>
        </div>
      </Modal>

      {/* Permissions Modal */}
      <Modal open={!!showPerms} onClose={() => setShowPerms(null)} title={`صلاحيات — ${showPerms?.name}`}>
        {showPerms && (
          <div>
            <div style={{ background: USER_ROLE_COLORS[showPerms.role] + '10', border: `1px solid ${USER_ROLE_COLORS[showPerms.role]}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: USER_ROLE_COLORS[showPerms.role] }}>{ROLE_LABELS[showPerms.role]}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', marginRight: 8 }}>— مجموعة الصلاحيات المحددة</span>
            </div>
            {[
              { label: 'الفواتير', read: true, write: showPerms.role !== 'viewer', del: showPerms.role === 'admin' },
              { label: 'العملاء', read: true, write: showPerms.role !== 'viewer', del: showPerms.role === 'admin' },
              { label: 'المخزون', read: true, write: ['admin','cashier'].includes(showPerms.role), del: showPerms.role === 'admin' },
              { label: 'الموارد البشرية', read: ['admin','hr'].includes(showPerms.role), write: ['admin','hr'].includes(showPerms.role), del: showPerms.role === 'admin' },
              { label: 'الخزينة', read: ['admin','accountant'].includes(showPerms.role), write: showPerms.role === 'admin', del: false },
              { label: 'التقارير', read: showPerms.role !== 'cashier', write: false, del: false },
              { label: 'الإعدادات', read: showPerms.role === 'admin', write: showPerms.role === 'admin', del: false },
            ].map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.label}</span>
                {(['read','write','del'] as const).map(k => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 70 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 4, background: p[k] ? 'var(--success)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p[k] && <i className="fa fa-check" style={{ fontSize: 10, color: '#fff' }} />}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{k === 'read' ? 'عرض' : k === 'write' ? 'تعديل' : 'حذف'}</span>
                  </div>
                ))}
              </div>
            ))}
            <button className="btn btn-outline w-full" style={{ marginTop: 16, justifyContent: 'center' }} onClick={() => setShowPerms(null)}>إغلاق</button>
          </div>
        )}
      </Modal>
    </>
  )
}
