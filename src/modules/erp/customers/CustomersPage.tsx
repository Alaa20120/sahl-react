import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import { fmt, initials } from '@/lib/format'
import { CUSTOMERS, type Customer } from '@/lib/mock-data/customers'
import { toast } from '@/lib/toast'

const TYPE_LABELS = { all: 'الكل', customer: 'عملاء', supplier: 'موردون', both: 'عميل ومورد' }
const AVATAR_COLORS = ['#2563EB','#7C3AED','#10B981','#D97706','#DC2626','#0891B2']

export default function CustomersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'supplier' | 'both'>('all')
  const [showNew, setShowNew] = useState(false)
  const [profile, setProfile] = useState<Customer | null>(null)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)

  const filtered = CUSTOMERS.filter(c => {
    const matchType = typeFilter === 'all' || c.type === typeFilter
    const matchSearch = !search || c.name.includes(search) || c.phone.includes(search)
    return matchType && matchSearch
  })

  const customers = CUSTOMERS.filter(c => c.type === 'customer' || c.type === 'both')
  const suppliers = CUSTOMERS.filter(c => c.type === 'supplier' || c.type === 'both')
  const totalBalance = CUSTOMERS.reduce((s, c) => s + c.balance, 0)

  return (
    <>
      <PageHeader
        title="الموردون والعملاء"
        subtitle={`${CUSTOMERS.length} جهة تجارية`}
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
            <i className="fa fa-plus" /> إضافة جديد
          </button>
        }
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي الجهات" value={String(CUSTOMERS.length)} dark icon="fa-handshake" />
        <StatCard label="عملاء" value={String(customers.length)} badge="نشط" badgeType="success" icon="fa-user" iconColor="var(--success)" />
        <StatCard label="موردون" value={String(suppliers.length)} badge="نشط" badgeType="pending" icon="fa-industry" iconColor="var(--blue)" />
        <StatCard label="إجمالي الرصيد" value={fmt(Math.abs(totalBalance))} icon="fa-balance-scale" iconColor="var(--primary)" />
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-box" style={{ flex: 1, maxWidth: 320 }}>
              <i className="fa fa-search icon" />
              <input
                placeholder="ابحث بالاسم أو الهاتف..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {(Object.entries(TYPE_LABELS) as [typeof typeFilter, string][]).map(([k, v]) => (
              <button key={k} onClick={() => setTypeFilter(k)} className={`btn btn-sm ${typeFilter === k ? 'btn-primary' : 'btn-outline'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>النوع</th>
                <th>الهاتف</th>
                <th>البريد</th>
                <th>الرصيد</th>
                <th>الفواتير</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--primary)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {initials(c.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                        {c.vatNumber && <div style={{ fontSize: 11, color: 'var(--muted)' }}>الرقم الضريبي: {c.vatNumber}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status ${c.type === 'supplier' ? 'status-pending' : c.type === 'both' ? 'status-active' : 'status-active'}`}>
                      {c.type === 'customer' ? 'عميل' : c.type === 'supplier' ? 'مورد' : 'عميل ومورد'}
                    </span>
                  </td>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}>{c.phone}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>{c.email}</td>
                  <td style={{ fontWeight: 700, color: c.balance < 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {fmt(Math.abs(c.balance))}
                    {c.balance < 0 && <span style={{ fontSize: 10, color: 'var(--muted)', marginRight: 4 }}>(مستحق)</span>}
                  </td>
                  <td>{c.totalInvoices}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-icon btn-outline btn-sm" title="عرض الملف" onClick={() => setProfile(c)}><i className="fa fa-eye" /></button>
                      <button className="btn btn-icon btn-outline btn-sm" title="تعديل" onClick={() => setEditCustomer(c)}><i className="fa fa-edit" /></button>
                      <button className="btn btn-icon btn-outline btn-sm" title="كشف حساب" onClick={() => navigate(`/erp/account-statement?id=${c.id}`)}><i className="fa fa-scroll" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New customer modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="إضافة عميل / مورد جديد">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الاسم الكامل</label>
            <input className="form-control" placeholder="اسم الشركة أو الشخص" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>النوع</label>
            <select className="form-control"><option>عميل</option><option>مورد</option><option>عميل ومورد</option></select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الهاتف</label>
            <input className="form-control" type="tel" placeholder="05xxxxxxxx" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>البريد الإلكتروني</label>
            <input className="form-control" type="email" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الرقم الضريبي</label>
            <input className="form-control" placeholder="3xxxxxxxxxx" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>العنوان</label>
            <input className="form-control" placeholder="المدينة، الحي" />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { toast('تم الحفظ', 'success'); setShowNew(false) }}>حفظ</button>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
          </div>
        </div>
      </Modal>

      {/* Customer profile modal */}
      <Modal open={!!profile} onClose={() => setProfile(null)} title="ملف العميل">
        {profile && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: AVATAR_COLORS[parseInt(profile.id) % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                {initials(profile.name)}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{profile.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{profile.type === 'customer' ? 'عميل' : profile.type === 'supplier' ? 'مورد' : 'عميل ومورد'} — منذ {profile.since}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              {[
                { label: 'الهاتف', value: profile.phone, icon: 'fa-phone' },
                { label: 'البريد', value: profile.email, icon: 'fa-envelope' },
                { label: 'العنوان', value: profile.address, icon: 'fa-location-dot' },
                { label: 'الرقم الضريبي', value: profile.vatNumber ?? 'غير مسجل', icon: 'fa-percent' },
              ].map(f => (
                <div key={f.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>
                    <i className={`fa ${f.icon}`} style={{ marginLeft: 4 }} />{f.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: profile.balance >= 0 ? 'var(--success)10' : 'var(--danger)10', border: `1px solid ${profile.balance >= 0 ? 'var(--success)' : 'var(--danger)'}30`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>الرصيد الحالي</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: profile.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {fmt(Math.abs(profile.balance))} {profile.balance < 0 ? '(مستحق عليك)' : '(مستحق له)'}
                </div>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>إجمالي الفواتير</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{profile.totalInvoices} فاتورة</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { navigate(`/erp/account-statement?id=${profile.id}`); setProfile(null) }}>
                <i className="fa fa-scroll" /> كشف الحساب
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { navigate(`/erp/invoices?customer=${profile.name}`); setProfile(null) }}>
                <i className="fa fa-file-invoice" /> الفواتير
              </button>
              <button className="btn btn-outline" onClick={() => setProfile(null)}>إغلاق</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit customer modal */}
      <Modal open={!!editCustomer} onClose={() => setEditCustomer(null)} title="تعديل بيانات العميل">
        {editCustomer && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الاسم</label>
              <input className="form-control" defaultValue={editCustomer.name} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الهاتف</label>
              <input className="form-control" defaultValue={editCustomer.phone} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>البريد</label>
              <input className="form-control" type="email" defaultValue={editCustomer.email} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>العنوان</label>
              <input className="form-control" defaultValue={editCustomer.address} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { toast('تم تحديث البيانات', 'success'); setEditCustomer(null) }}>حفظ التغييرات</button>
              <button className="btn btn-outline" onClick={() => setEditCustomer(null)}>إلغاء</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
