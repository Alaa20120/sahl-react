import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { fmt, fmtNum } from '@/lib/format'
import { useDelegateStore } from '@/store/delegate.store'
import { toast } from '@/lib/toast'

/* ── Saudi Arabia SVG ── */
const SA_CITIES: { name: string; x: number; y: number }[] = [
  { name: 'الرياض', x: 280, y: 220 }, { name: 'جدة', x: 145, y: 230 },
  { name: 'مكة', x: 155, y: 245 }, { name: 'المدينة', x: 155, y: 190 },
  { name: 'الدمام', x: 345, y: 195 }, { name: 'تبوك', x: 150, y: 120 },
  { name: 'أبها', x: 175, y: 310 }, { name: 'بريدة', x: 265, y: 175 },
]

function latLngToSvg(lat: number, lng: number) {
  return { x: ((lng - 34) / 22) * 450, y: ((32 - lat) / 16) * 400 }
}

const SA_PATH = `M 130,70 L 165,55 L 200,50 L 240,60 L 280,55 L 310,60 L 350,70 L 380,90
  L 395,120 L 390,160 L 370,190 L 355,215 L 340,240 L 320,260 L 300,275 L 280,290
  L 255,310 L 230,325 L 210,340 L 190,345 L 175,340 L 165,325 L 155,305 L 150,285
  L 140,265 L 135,250 L 130,240 L 120,225 L 115,210 L 110,195 L 105,180 L 100,165
  L 105,150 L 110,135 L 115,120 L 120,100 L 125,85 Z`

const ZONES = ['منطقة الرياض', 'منطقة جدة', 'المنطقة الشرقية', 'منطقة المدينة', 'منطقة تبوك', 'منطقة أبها']

export default function DelegatesListPage() {
  const navigate = useNavigate()
  const delegates = useDelegateStore(s => s.delegates)
  const addDelegate = useDelegateStore(s => s.addDelegate)
  const setDelegateStatus = useDelegateStore(s => s.setDelegateStatus)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [showCredentials, setShowCredentials] = useState<null | { name: string; username: string; password: string }>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', zone: ZONES[0], username: '', password: '' })

  const totalDelegates = delegates.length
  const activeDelegates = delegates.filter(d => d.status === 'active').length
  const totalSales = delegates.reduce((s, d) => s + d.stats.totalSales, 0)
  const totalBalance = delegates.reduce((s, d) => s + (d.stats.totalSales - d.stats.totalPurchases), 0)
  const totalCredit = delegates.reduce((s, d) => s + d.stats.externalCredit, 0)

  const [addingDelegate, setAddingDelegate] = useState(false)

  async function handleAdd() {
    if (!form.name.trim() || !form.phone.trim()) { toast('أدخل الاسم ورقم الهاتف', 'warn'); return }
    setAddingDelegate(true)
    try {
      const newDel = await addDelegate(form)
      setShowNew(false)
      setForm({ name: '', phone: '', email: '', zone: ZONES[0], username: '', password: '' })
      setShowCredentials({ name: newDel.name, username: newDel.username, password: newDel.password })
      toast(`تم إضافة المندوب "${newDel.name}" بنجاح`, 'success')
    } catch (err: any) {
      toast(`خطأ: ${err?.message || 'فشل إضافة المندوب'}`, 'danger')
    }
    setAddingDelegate(false)
  }

  function handleToggle(e: React.MouseEvent, delegateId: string, currentStatus: string) {
    e.stopPropagation()
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    setDelegateStatus(delegateId, newStatus)
    toast(newStatus === 'active' ? 'تم تنشيط المندوب' : 'تم إيقاف المندوب', 'success')
  }

  return (
    <>
      <PageHeader
        title="إدارة المندوبين"
        subtitle={`${totalDelegates} مندوب — ${activeDelegates} نشط`}
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
            <i className="fa fa-plus" /> إضافة مندوب
          </button>
        }
      />

      {/* Stats */}
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي المندوبين" value={fmtNum(totalDelegates)} dark icon="fa-user-tie" />
        <StatCard label="إجمالي المبيعات" value={fmt(totalSales)} badge="▲" badgeType="success" icon="fa-chart-line" iconColor="var(--success)" />
        <StatCard label="صافي المبيعات - المشتريات" value={fmt(totalBalance)} badge={totalBalance >= 0 ? '▲' : '▼'} badgeType={totalBalance >= 0 ? 'success' : 'warn'} icon="fa-wallet" iconColor="var(--blue)" />
        <StatCard label="الآجل الخارجي" value={fmt(totalCredit)} badge={totalCredit > 0 ? '!' : ''} badgeType="warn" icon="fa-clock" iconColor="var(--warn)" />
      </div>

      {/* Map */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa fa-map-marked-alt" style={{ color: 'var(--blue)' }} /> خريطة تتبع المندوبين
        </div>
        <div style={{ padding: 20, background: 'var(--bg)', borderRadius: '0 0 10px 10px' }}>
          <svg viewBox="0 0 450 400" style={{ width: '100%', maxHeight: 380, display: 'block' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 40} x2="450" y2={i * 40} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="400" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            <path d={SA_PATH} fill="var(--card-bg)" stroke="var(--accent)" strokeWidth="2" opacity="0.8" />
            {SA_CITIES.map(c => (
              <g key={c.name}>
                <circle cx={c.x} cy={c.y} r="3" fill="var(--muted)" opacity="0.4" />
                <text x={c.x} y={c.y - 8} textAnchor="middle" fill="var(--muted)" fontSize="9" fontFamily="Tajawal, sans-serif">{c.name}</text>
              </g>
            ))}
            {delegates.map(d => {
              const pos = latLngToSvg(d.location.lat, d.location.lng)
              const isActive = d.status === 'active'
              const isSel = selectedId === d.id
              return (
                <g key={d.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(isSel ? null : d.id)}>
                  {isActive && (
                    <circle cx={pos.x} cy={pos.y} r="14" fill="none" stroke="var(--success)" strokeWidth="1.5" opacity="0.3">
                      <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {isSel && <circle cx={pos.x} cy={pos.y} r="16" fill="none" stroke="var(--accent)" strokeWidth="2" />}
                  <circle cx={pos.x} cy={pos.y} r="10" fill={isActive ? 'var(--success)' : 'var(--danger)'} stroke="#fff" strokeWidth="2" />
                  <text x={pos.x} y={pos.y + 22} textAnchor="middle" fill="var(--text)" fontSize="10" fontWeight="700" fontFamily="Tajawal, sans-serif">{d.name.split(' ')[0]}</text>
                  {isSel && (
                    <g>
                      <rect x={pos.x - 70} y={pos.y - 65} width="140" height="48" rx="6" fill="var(--card-bg)" stroke="var(--border)" />
                      <text x={pos.x} y={pos.y - 47} textAnchor="middle" fill="var(--text)" fontSize="10" fontWeight="700" fontFamily="Tajawal, sans-serif">{d.name}</text>
                      <text x={pos.x} y={pos.y - 33} textAnchor="middle" fill="var(--muted)" fontSize="8" fontFamily="Tajawal, sans-serif">{d.location.address}</text>
                      <text x={pos.x} y={pos.y - 20} textAnchor="middle" fill="var(--success)" fontSize="9" fontWeight="700" fontFamily="Tajawal, sans-serif">المبيعات: {d.stats.totalSales.toLocaleString('ar-SA')} ر.س</text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Delegates table */}
      <div className="card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa fa-list" style={{ color: 'var(--accent)' }} /> قائمة المندوبين
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>المندوب</th><th>اسم المستخدم</th><th>المنطقة</th><th>الحالة</th><th>المبيعات</th>
                <th>المشتريات</th><th>الرصيد</th><th>الآجل</th><th>المستودع</th><th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {delegates.map(d => {
                const whCount = d.warehouse.reduce((s, w) => s + w.qty, 0)
                const netBalance = d.stats.totalSales - d.stats.totalPurchases
                return (
                  <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/delegates/${d.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: d.status === 'active' ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: d.status === 'active' ? 'var(--success)' : 'var(--danger)',
                          fontWeight: 800, fontSize: 12,
                        }}>{d.avatar}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--blue)' }}>{d.username}</td>
                    <td style={{ fontSize: 12 }}>{d.zone}</td>
                    <td><span className={`status ${d.status === 'active' ? 'status-active' : 'status-inactive'}`}>{d.status === 'active' ? 'نشط' : 'موقوف'}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(d.stats.totalSales)}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(d.stats.totalPurchases)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 700, color: netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>{netBalance >= 0 ? '+' : ''}{fmt(netBalance)}</span>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>مبيعات − مشتريات</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: d.stats.externalCredit > 0 ? 'var(--warn)' : 'var(--muted)' }}>{fmt(d.stats.externalCredit)}</td>
                    <td>
                      <span style={{ background: 'var(--blue-light)', color: 'var(--blue)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{whCount} صنف</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/erp/delegates/${d.id}`) }}>
                          <i className="fa fa-eye" />
                        </button>
                        <button
                          className={`btn btn-sm ${d.status === 'active' ? 'btn-outline' : 'btn-primary'}`}
                          style={d.status === 'active' ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
                          onClick={(e) => handleToggle(e, d.id, d.status)}
                          title={d.status === 'active' ? 'إيقاف' : 'تنشيط'}
                        >
                          <i className={`fa ${d.status === 'active' ? 'fa-ban' : 'fa-check-circle'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Delegate Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="إضافة مندوب جديد" footer={
        <>
          <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={addingDelegate}>
            {addingDelegate ? <><i className="fa fa-spinner fa-spin" /> جارٍ الحفظ...</> : <><i className="fa fa-save" /> حفظ</>}
          </button>
        </>
      }>
        <div className="form-grid-2">
          <div className="form-group col-span-2">
            <label className="form-label">اسم المندوب</label>
            <input className="form-control" placeholder="مثال: أحمد محمد" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">رقم الهاتف</label>
            <input className="form-control" type="tel" placeholder="05xxxxxxxx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input className="form-control" type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">منطقة العمل</label>
            <select className="form-control" value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">اسم المستخدم (اختياري)</label>
            <input className="form-control" placeholder="يتم التوليد تلقائياً" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">كلمة المرور (اختياري)</label>
            <input className="form-control" placeholder="يتم التوليد تلقائياً" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>إذا تركتهما فارغين، سيتم توليدهما تلقائياً</div>
          </div>
        </div>
      </Modal>

      {/* Credentials Modal */}
      {showCredentials && (
        <Modal open={!!showCredentials} onClose={() => setShowCredentials(null)} title="بيانات تسجيل الدخول">
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, color: 'var(--success)', marginBottom: 12 }}><i className="fa fa-check-circle" /></div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>تم إنشاء المندوب بنجاح</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>احفظ بيانات تسجيل الدخول التالية</div>

            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'right' }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>اسم المستخدم</div>
                <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: 'var(--blue)' }}>{showCredentials.username}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>كلمة المرور</div>
                <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{showCredentials.password}</div>
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => {
              navigator.clipboard?.writeText(`اسم المستخدم: ${showCredentials.username}\nكلمة المرور: ${showCredentials.password}`)
              toast('تم نسخ البيانات!', 'success')
            }}>
              <i className="fa fa-copy" /> نسخ البيانات
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
