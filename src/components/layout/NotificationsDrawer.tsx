import { useState } from 'react'
import { useUiStore } from '@/store/ui.store'

const INITIAL_NOTIFICATIONS = [
  { id: 1, icon: 'fa-file-invoice', title: 'فاتورة متأخرة', body: 'شركة الرواد — 54,050 ر.س متأخر 7 أيام', time: 'منذ ساعة', read: false, type: 'danger' },
  { id: 2, icon: 'fa-coins', title: 'دفعة مستلمة', body: 'مؤسسة الإبداع — 7,475 ر.س', time: 'منذ 3 ساعات', read: false, type: 'success' },
  { id: 3, icon: 'fa-box-open', title: 'مخزون منخفض', body: 'حبر الطابعة وصل للحد الأدنى (2 قطعة)', time: 'منذ 5 ساعات', read: false, type: 'warn' },
  { id: 4, icon: 'fa-user-plus', title: 'عميل جديد', body: 'تم تسجيل مجموعة الأفق كعميل جديد', time: 'أمس', read: true, type: 'info' },
  { id: 5, icon: 'fa-rotate', title: 'تجديد اشتراك', body: 'اشتراك شركة الخليج ينتهي خلال 14 يوم', time: 'أمس', read: true, type: 'warn' },
]

const typeColors: Record<string, string> = {
  danger: 'var(--danger)',
  success: 'var(--success)',
  warn: 'var(--warn)',
  info: 'var(--blue)',
}

export default function NotificationsDrawer() {
  const { notifOpen, closeNotif, setNotifCount } = useUiStore()
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setNotifCount(0)
  }

  const markRead = (id: number) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n)
      setNotifCount(updated.filter(n => !n.read).length)
      return updated
    })
  }

  return (
    <>
      {notifOpen && <div className="drawer-overlay" onClick={closeNotif} />}
      <div className={`drawer${notifOpen ? ' open' : ''}`}>
        <div className="drawer-header">
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>الإشعارات</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {unreadCount > 0 ? `${unreadCount} غير مقروءة` : 'كل الإشعارات مقروءة'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button className="btn btn-sm btn-outline" style={{ fontSize: 11 }} onClick={markAllRead}>
                تحديد الكل كمقروء
              </button>
            )}
            <button className="btn btn-icon btn-outline" onClick={closeNotif}><i className="fa fa-xmark" /></button>
          </div>
        </div>

        <div className="drawer-body">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              style={{
                display: 'flex', gap: 12, padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                background: n.read ? 'transparent' : 'rgba(37,99,235,.03)',
                cursor: !n.read ? 'pointer' : 'default',
                transition: 'background .15s',
              }}
              onMouseEnter={e => { if (!n.read) (e.currentTarget as HTMLDivElement).style.background = 'rgba(37,99,235,.06)' }}
              onMouseLeave={e => { if (!n.read) (e.currentTarget as HTMLDivElement).style.background = 'rgba(37,99,235,.03)' }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 8,
                background: `${typeColors[n.type]}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className={`fa ${n.icon}`} style={{ fontSize: 16, color: typeColors[n.type] }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{n.title}</span>
                  {!n.read && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', display: 'block', marginTop: 4, flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{n.body}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
