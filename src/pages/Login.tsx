import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/lib/toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast('يرجى إدخال البيانات', 'warn'); return }
    setLoading(true)
    setTimeout(() => {
      login({ id: '1', name: 'أحمد المدير', email, role: 'admin', company: 'شركة النور للتجارة' })
      toast('مرحباً بك في سهل!', 'success')
      navigate('/erp/dashboard')
    }, 800)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-form-side">
        <div className="auth-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="40" height="40" style={{ marginBottom: 8 }}>
            <rect x="8" y="8" width="104" height="104" rx="20" fill="#0D1117" />
            <rect x="24" y="68" width="8" height="20" fill="#FFFFFF" />
            <rect x="38" y="68" width="8" height="20" fill="#FFFFFF" />
            <rect x="52" y="68" width="8" height="20" fill="#FFFFFF" />
            <rect x="20" y="88" width="80" height="4" fill="#FFFFFF" />
            <circle cx="78" cy="48" r="10" fill="#FFFFFF" />
            <circle cx="78" cy="48" r="4" fill="#0D1117" />
            <rect x="94" y="24" width="6" height="56" fill="#FFFFFF" />
          </svg>
          <div className="brand">سهل</div>
        </div>

        <div className="auth-title">تسجيل الدخول</div>
        <div className="auth-sub">أدخل بياناتك للوصول لحسابك</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@company.sa"
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                }}
              >
                <i className={`fa ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> تذكرني
            </label>
            <a href="#" style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 600 }}>نسيت كلمة المرور؟</a>
          </div>

          <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', padding: '12px 0' }}>
            {loading ? <><i className="fa fa-spinner fa-spin" /> جارٍ تسجيل الدخول...</> : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="auth-footer">
          ليس لديك حساب؟ <a href="/register">أنشئ حساباً مجانياً</a>
        </div>
      </div>

      <div className="auth-hero-side">
        <div className="auth-hero-content">
          <div className="auth-hero-title">نظام ERP عربي متكامل لشركتك السعودية</div>
          <div className="auth-hero-sub">فواتير ZATCA، مخزون، موارد بشرية، CRM، تقارير مالية — كل شيء في مكان واحد.</div>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['✓ متوافق مع متطلبات ZATCA المرحلة الثانية', '✓ فواتير إلكترونية مع QR Code', '✓ تقارير مالية متقدمة (P&L، Balance Sheet)', '✓ إدارة المخزون وتنبيهات إعادة الطلب', '✓ مسير رواتب كامل مع GOSI'].map(f => (
              <div key={f} style={{ fontSize: 14, color: 'rgba(255,255,255,.85)', display: 'flex', gap: 10, alignItems: 'center' }}>
                {f}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48, display: 'flex', gap: 32 }}>
            {[['500+', 'شركة تستخدم سهل'], ['99.9%', 'وقت التشغيل'], ['24/7', 'دعم فني']].map(([val, lbl]) => (
              <div key={lbl}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
