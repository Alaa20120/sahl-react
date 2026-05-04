import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { initials } from '@/lib/format'
import { USERS, ROLE_LABELS, USER_STATS, type UserRole, type UserStatus } from '@/lib/mock-data/users'
import { toast } from '@/lib/toast'

const STATUS_COLORS: Record<UserStatus, string> = {
  active:    'var(--success)',
  inactive:  'var(--muted)',
  suspended: 'var(--danger)',
}
const STATUS_LABELS: Record<UserStatus, string> = {
  active:    'نشط',
  inactive:  'غير نشط',
  suspended: 'موقوف',
}
const ROLE_COLORS: Record<UserRole, string> = {
  admin:      '#7C3AED',
  accountant: '#2563EB',
  cashier:    '#10B981',
  sales:      '#D97706',
  hr:         '#DC2626',
  viewer:     '#6B7280',
}
const AVATAR_COLORS = ['#2563EB','#7C3AED','#10B981','#D97706','#DC2626','#0891B2','#059669','#6B7280']

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [showNew, setShowNew] = useState(false)
  const [showPerms, setShowPerms] = useState<typeof USERS[0] | null>(null)

  const filtered = roleFilter === 'all' ? USERS : USERS.filter(u => u.role === roleFilter)

  return (
    <>
      <PageHeader
        title="إدارة المستخدمين"
        subtitle="صلاحيات وحسابات فريق العمل"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
            <i className="fa fa-user-plus" /> مستخدم جديد
          </button>
        }
      />

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
            <button onClick={() => setRoleFilter('all')} className={`btn btn-sm ${roleFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}>الكل</button>
            {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([k, v]) => (
              <button key={k} onClick={() => setRoleFilter(k)} className={`btn btn-sm ${roleFilter === k ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderColor: ROLE_COLORS[k], color: roleFilter === k ? '#fff' : ROLE_COLORS[k] }}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map((user, i) => (
          <div key={user.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {initials(user.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: STATUS_COLORS[user.status],
                boxShadow: user.status === 'active' ? `0 0 0 3px ${STATUS_COLORS[user.status]}30` : 'none',
                flexShrink: 0,
              }} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: ROLE_COLORS[user.role], background: ROLE_COLORS[user.role] + '18', borderRadius: 6, padding: '3px 10px' }}>
                {ROLE_LABELS[user.role]}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[user.status], background: STATUS_COLORS[user.status] + '15', borderRadius: 6, padding: '3px 10px' }}>
                {STATUS_LABELS[user.status]}
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px' }}>
                <i className="fa fa-building" style={{ marginLeft: 4 }} />{user.branch}
              </span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
              <i className="fa fa-clock" style={{ marginLeft: 6 }} />
              آخر دخول: {user.lastLogin}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-outline" style={{ flex: 1, fontSize: 11 }} onClick={() => setShowPerms(user)}>
                <i className="fa fa-shield-halved" /> الصلاحيات
              </button>
              <button className="btn btn-sm btn-outline" style={{ fontSize: 11 }} onClick={() => toast('تم إرسال رابط تغيير كلمة المرور', 'success')}>
                <i className="fa fa-key" />
              </button>
              {user.status === 'active' ? (
                <button className="btn btn-sm" style={{ fontSize: 11, background: 'var(--danger)', color: '#fff', border: 'none' }} onClick={() => toast('تم إيقاف المستخدم مؤقتاً', 'info')}>
                  <i className="fa fa-ban" />
                </button>
              ) : (
                <button className="btn btn-sm" style={{ fontSize: 11, background: 'var(--success)', color: '#fff', border: 'none' }} onClick={() => toast('تم تفعيل المستخدم', 'success')}>
                  <i className="fa fa-check" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New user modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="إضافة مستخدم جديد">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الاسم الكامل</label>
            <input className="form-control" placeholder="الاسم الكامل..." />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>البريد الإلكتروني</label>
            <input className="form-control" type="email" placeholder="example@company.sa" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الدور</label>
              <select className="form-control">
                {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الفرع</label>
              <select className="form-control">
                <option>الرئيسي</option>
                <option>الفرع الشمالي</option>
                <option>الفرع الجنوبي</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { toast('تم إنشاء الحساب وإرسال بيانات الدخول', 'success'); setShowNew(false) }}>إنشاء الحساب</button>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
          </div>
        </div>
      </Modal>

      {/* Permissions modal */}
      <Modal open={!!showPerms} onClose={() => setShowPerms(null)} title={`صلاحيات — ${showPerms?.name}`}>
        {showPerms && (
          <div>
            <div style={{ background: ROLE_COLORS[showPerms.role] + '10', border: `1px solid ${ROLE_COLORS[showPerms.role]}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: ROLE_COLORS[showPerms.role] }}>{ROLE_LABELS[showPerms.role]}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', marginRight: 8 }}>— مجموعة الصلاحيات المحددة</span>
            </div>
            {[
              { label: 'الفواتير',     read: true,  write: showPerms.role !== 'viewer', del: showPerms.role === 'admin' },
              { label: 'العملاء',      read: true,  write: showPerms.role !== 'viewer', del: showPerms.role === 'admin' },
              { label: 'المخزون',      read: true,  write: ['admin','cashier'].includes(showPerms.role), del: showPerms.role === 'admin' },
              { label: 'الموارد البشرية', read: ['admin','hr'].includes(showPerms.role), write: ['admin','hr'].includes(showPerms.role), del: showPerms.role === 'admin' },
              { label: 'الخزينة',      read: ['admin','accountant'].includes(showPerms.role), write: showPerms.role === 'admin', del: false },
              { label: 'التقارير',     read: showPerms.role !== 'cashier', write: false, del: false },
              { label: 'الإعدادات',    read: showPerms.role === 'admin', write: showPerms.role === 'admin', del: false },
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
