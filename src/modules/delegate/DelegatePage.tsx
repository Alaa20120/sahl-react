import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import { fmt } from '@/lib/format'
import { toast } from '@/lib/toast'

const VISITS = [
  { id: 'V-081', customer: 'شركة الرواد',           time: '09:30', status: 'done',    result: 'طلب عرض سعر',      amount: 0      },
  { id: 'V-082', customer: 'مؤسسة التميز',           time: '11:00', status: 'done',    result: 'إغلاق صفقة',       amount: 25000  },
  { id: 'V-083', customer: 'مجموعة النخبة',          time: '13:30', status: 'current', result: '',                 amount: 0      },
  { id: 'V-084', customer: 'شركة البناء الحديث',     time: '15:00', status: 'pending', result: '',                 amount: 0      },
  { id: 'V-085', customer: 'مؤسسة الإبداع الرقمي',  time: '16:30', status: 'pending', result: '',                 amount: 0      },
]

const TASKS = [
  { id: 1, task: 'تسليم عروض الأسعار لشركة الخليج',     done: true  },
  { id: 2, task: 'متابعة فاتورة مجموعة النخبة المعلقة', done: false },
  { id: 3, task: 'جمع توقيع العقد من شركة البناء',      done: false },
  { id: 4, task: 'تحديث بيانات عميل الأفق',             done: true  },
]

const STATUS_COLORS: Record<string, string> = { done: 'var(--success)', current: 'var(--blue)', pending: 'var(--muted)' }
const STATUS_LABELS: Record<string, string> = { done: 'مكتملة', current: 'جارية', pending: 'قادمة' }

export default function DelegatePage() {
  const [tasks, setTasks] = useState(TASKS)
  const [tab, setTab] = useState('زيارات اليوم')

  const doneVisits  = VISITS.filter(v => v.status === 'done').length
  const totalSales  = VISITS.filter(v => v.status === 'done').reduce((s, v) => s + v.amount, 0)
  const doneTasks   = tasks.filter(t => t.done).length

  return (
    <>
      <PageHeader
        title="تطبيق المندوب"
        subtitle={`مرحباً، محمد — ${new Date().toLocaleDateString('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' })}`}
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="زيارات اليوم" value={`${doneVisits} / ${VISITS.length}`} dark icon="fa-route" />
        <StatCard label="مبيعات اليوم" value={fmt(totalSales)} badge="▲" badgeType="success" icon="fa-dollar-sign" iconColor="var(--success)" />
        <StatCard label="المهام المنجزة" value={`${doneTasks} / ${tasks.length}`} icon="fa-clipboard-check" iconColor="var(--blue)" />
        <StatCard label="هدف الشهر" value="68%" badge="▲" badgeType="warn" icon="fa-bullseye" iconColor="var(--warn)" />
      </div>

      <div className="tabs mb-4">
        {['زيارات اليوم', 'المهام', 'خريطة الزيارات'].map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'زيارات اليوم' && (
        <Card title="جدول زيارات اليوم">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {VISITS.map(v => (
              <div key={v.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px', borderBottom: '1px solid var(--border)',
                background: v.status === 'current' ? 'var(--blue)08' : 'transparent',
              }}>
                <div style={{ textAlign: 'center', minWidth: 50 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: v.status === 'current' ? 'var(--blue)' : 'var(--text)' }}>{v.time}</div>
                </div>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: STATUS_COLORS[v.status], flexShrink: 0,
                  boxShadow: v.status === 'current' ? `0 0 0 4px ${STATUS_COLORS[v.status]}30` : 'none' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{v.customer}</div>
                  {v.result && <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 2 }}><i className="fa fa-check" style={{ marginLeft: 4 }} />{v.result}</div>}
                </div>
                {v.amount > 0 && <div style={{ fontWeight: 800, color: 'var(--success)' }}>{fmt(v.amount)}</div>}
                <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[v.status], background: STATUS_COLORS[v.status] + '15', borderRadius: 6, padding: '3px 10px' }}>
                  {STATUS_LABELS[v.status]}
                </span>
                {v.status === 'current' && (
                  <button className="btn btn-sm btn-primary" onClick={() => toast('تم تسجيل نتيجة الزيارة', 'success')}>
                    <i className="fa fa-check" /> تسجيل
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'المهام' && (
        <Card title="مهام اليوم">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => setTasks(prev => prev.map(x => x.id === t.id ? { ...x, done: !x.done } : x))}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${t.done ? 'var(--success)' : 'var(--border)'}`,
                    background: t.done ? 'var(--success)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  {t.done && <i className="fa fa-check" style={{ fontSize: 11, color: '#fff' }} />}
                </button>
                <span style={{ fontSize: 13, flex: 1, textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--muted)' : 'var(--text)' }}>{t.task}</span>
              </div>
            ))}
            <button className="btn btn-outline btn-sm" style={{ marginTop: 14, alignSelf: 'flex-start' }}
              onClick={() => toast('تم إضافة المهمة', 'success')}>
              <i className="fa fa-plus" /> إضافة مهمة
            </button>
          </div>
        </Card>
      )}

      {tab === 'خريطة الزيارات' && (
        <Card title="خريطة مسار اليوم">
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--muted)' }}>
            <i className="fa fa-map-location-dot" style={{ fontSize: 40, color: 'var(--muted-2)' }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>خريطة Google Maps</div>
            <div style={{ fontSize: 12 }}>ستكون متاحة عند ربط API المواقع</div>
            <button className="btn btn-outline btn-sm" onClick={() => toast('جارٍ فتح الخريطة...', 'info')}>
              <i className="fa fa-location-dot" /> افتح في خرائط جوجل
            </button>
          </div>
        </Card>
      )}
    </>
  )
}
