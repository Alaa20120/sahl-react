import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import StatusBadge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { fmt, initials } from '@/lib/format'
import { EMPLOYEES, DEPARTMENTS } from '@/lib/mock-data/hr'
import { toast } from '@/lib/toast'

const TABS = ['الموظفون', 'مسير الرواتب', 'الحضور والإجازات', 'السلف والمصروفات']

export default function HRPage() {
  const [tab, setTab] = useState('الموظفون')
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('الكل')
  const [showNew, setShowNew] = useState(false)

  const filtered = EMPLOYEES.filter(e => {
    const matchDept = dept === 'الكل' || e.department === dept
    const matchSearch = !search || e.name.includes(search) || e.position.includes(search)
    return matchDept && matchSearch
  })

  const totalSalaries = EMPLOYEES.reduce((s, e) => s + e.netSalary, 0)
  const active = EMPLOYEES.filter(e => e.status === 'active').length
  const onLeave = EMPLOYEES.filter(e => e.status === 'leave').length

  return (
    <>
      <PageHeader
        title="الموارد البشرية"
        subtitle={`${EMPLOYEES.length} موظف`}
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
            <i className="fa fa-plus" /> موظف جديد
          </button>
        }
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي الموظفين" value={String(EMPLOYEES.length)} dark icon="fa-users" />
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
                          <button className="btn btn-icon btn-outline btn-sm" onClick={() => toast('جارٍ طباعة قسيمة الراتب...', 'info')}><i className="fa fa-file-alt" /></button>
                          <button className="btn btn-icon btn-outline btn-sm" onClick={() => toast('جارٍ التعديل...', 'info')}><i className="fa fa-edit" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{filtered.length} موظف</span>
              <button className="btn btn-primary btn-sm" onClick={() => toast('جارٍ تشغيل مسير الرواتب...', 'info')}>
                <i className="fa fa-play" /> تشغيل مسير الرواتب
              </button>
            </div>
          </div>
        </>
      )}

      {tab === 'مسير الرواتب' && (
        <div className="card">
          <div className="card-header"><span className="card-title">مسير رواتب أبريل 2025</span></div>
          <div className="card-body">
            <div className="grid-3 mb-4">
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(totalSalaries)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>إجمالي الرواتب</div>
              </div>
              <div style={{ background: 'var(--success-bg)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{EMPLOYEES.length}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>عدد الموظفين</div>
              </div>
              <div style={{ background: 'var(--warn-bg)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warn)' }}>0</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>فواتير GOSI</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => toast('تم تشغيل مسير الرواتب بنجاح!', 'success')}>
              <i className="fa fa-rocket" /> تنفيذ مسير الرواتب
            </button>
          </div>
        </div>
      )}

      {(tab === 'الحضور والإجازات' || tab === 'السلف والمصروفات') && (
        <div className="card">
          <div className="card-body empty-state">
            <div className="empty-state-icon">🚧</div>
            <div className="empty-state-title">قيد التطوير</div>
            <div className="empty-state-sub">هذه الميزة ستكون متاحة قريباً</div>
          </div>
        </div>
      )}

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="إضافة موظف جديد"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
            <button className="btn btn-primary" onClick={() => { toast('تم إضافة الموظف', 'success'); setShowNew(false) }}>حفظ</button>
          </>
        }
      >
        <div className="form-grid-2">
          <div className="form-group col-span-2"><label className="form-label">الاسم الكامل</label><input className="form-control" /></div>
          <div className="form-group"><label className="form-label">المسمى الوظيفي</label><input className="form-control" /></div>
          <div className="form-group"><label className="form-label">القسم</label><select className="form-control">{DEPARTMENTS.filter(d => d !== 'الكل').map(d => <option key={d}>{d}</option>)}</select></div>
          <div className="form-group"><label className="form-label">الراتب الأساسي</label><input className="form-control" type="number" /></div>
          <div className="form-group"><label className="form-label">البدلات</label><input className="form-control" type="number" /></div>
          <div className="form-group"><label className="form-label">الهاتف</label><input className="form-control" type="tel" /></div>
          <div className="form-group"><label className="form-label">تاريخ الانضمام</label><input className="form-control" type="date" /></div>
        </div>
      </Modal>
    </>
  )
}
