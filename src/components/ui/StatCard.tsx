interface Props {
  label: string
  value: string
  sub?: string
  badge?: string
  badgeType?: 'success' | 'warn' | 'danger' | 'pending' | 'dark'
  dark?: boolean
  icon?: string
  iconColor?: string
}

export default function StatCard({ label, value, sub, badge, badgeType = 'success', dark, icon, iconColor }: Props) {
  return (
    <div className={`stat-card${dark ? ' dark' : ''}`}>
      {icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 8, marginBottom: 12,
          background: dark ? 'rgba(255,255,255,.1)' : 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i
            className={`fa ${icon}`}
            style={{
              fontSize: 16,
              color: dark ? 'rgba(255,255,255,.8)' : (iconColor ?? 'var(--primary)'),
            }}
          />
        </div>
      )}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {badge && <div className={`stat-badge badge-${badgeType}`}>{badge}</div>}
    </div>
  )
}
