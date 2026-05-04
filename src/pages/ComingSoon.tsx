import { Link } from 'react-router-dom'

interface Props {
  title: string
  icon?: string
}

export default function ComingSoon({ title, icon = 'fa-tools' }: Props) {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">{title}</div>
      </div>
      <div className="card">
        <div className="card-body empty-state" style={{ padding: '80px 20px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'var(--bg)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <i className={`fa ${icon}`} style={{ fontSize: 32, color: 'var(--muted)' }} />
          </div>
          <div className="empty-state-title" style={{ fontSize: 20 }}>{title}</div>
          <div className="empty-state-sub" style={{ fontSize: 14, maxWidth: 400, marginTop: 8 }}>
            هذه الصفحة قيد التطوير وستكون متاحة قريباً
          </div>
          <div style={{ marginTop: 24 }}>
            <Link to="/erp/dashboard" className="btn btn-primary">
              <i className="fa fa-home" /> العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
