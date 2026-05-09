import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/lib/toast'

type LoginMode = 'admin' | 'delegate'

export default function Login() {
  const [mode, setMode] = useState<LoginMode>('admin')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [errorBox, setErrorBox] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked) { toast('الحساب مقفل مؤقتاً — جرب بعد 5 دقائق', 'danger'); return }
    if (loginAttempts >= 5) {
      setIsLocked(true)
      setTimeout(() => { setIsLocked(false); setLoginAttempts(0) }, 5 * 60 * 1000)
      toast('تم قفل الحساب مؤقتاً — جرب بعد 5 دقائق', 'danger')
      return
    }

    setLoading(true)
    setErrorBox('')
    try {
      if (mode === 'admin') {
        if (!email || !password) { toast('يرجى إدخال البريد وكلمة المرور', 'warn'); return }

        const SUPA_URL = import.meta.env.VITE_SUPABASE_URL
        const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

        // Use direct fetch — bypasses supabase-js client issues
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('انتهت مهلة الاتصال')), 10000)
        )
        const authFetch = fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': SUPA_KEY,
            'Authorization': `Bearer ${SUPA_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim(), password }),
        }).then(async r => {
          const text = await r.text()
          try { return JSON.parse(text) } catch { return { raw: text, status: r.status } }
        })

        const authData = await Promise.race([authFetch, timeout]) as any

        // Show raw response for debugging
        if (!authData?.access_token) {
          setErrorBox(`Supabase response: ${JSON.stringify(authData)}`)
          return
        }

        const user = authData.user
        const meta = user?.user_metadata || {}
        login({
          id: user.id,
          name: meta.name || user.email?.split('@')[0] || 'مدير',
          email: user.email || '',
          role: (meta.role || 'admin') as any,
          company: import.meta.env.VITE_COMPANY_NAME || 'سهل',
          accessToken: authData.access_token,
        })
        setLoginAttempts(0)
        // Force hard navigation to avoid React Router issues
        window.location.href = '/sahl-react/erp/dashboard'

      } else {
        // Delegate login
        if (!username || !password) { toast('يرجى إدخال اسم المستخدم وكلمة المرور', 'warn'); return }

        // Use direct fetch (bypasses supabase-js client issues)
        const SUPA_URL = import.meta.env.VITE_SUPABASE_URL
        const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('انتهت مهلة الاتصال — Supabase REST API لا يستجيب')), 8000)
        )

        const fetchDelegate = fetch(
          `${SUPA_URL}/rest/v1/delegates?username=eq.${encodeURIComponent(username.trim())}&select=id,name,phone,email,zone,status,username,password_hash,avatar&limit=1`,
          { headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` } }
        ).then(r => r.json())

        const rows = await Promise.race([fetchDelegate, timeout]) as any[]

        const dbDelegate = Array.isArray(rows) ? rows[0] : null

        if (!Array.isArray(rows)) {
          setErrorBox(`خطأ في الاستجابة: ${JSON.stringify(rows)}`)
          return
        }

        if (!dbDelegate) {
          setLoginAttempts(p => p + 1)
          setErrorBox(`لم يُعثر على مستخدم باسم: "${username.trim()}"`)
          return
        }

        if (dbDelegate.password_hash !== password.trim()) {
          setLoginAttempts(p => p + 1)
          setErrorBox(`كلمة المرور غير صحيحة`)
          return
        }

        const delegateData = {
          id: dbDelegate.id, name: dbDelegate.name,
          phone: dbDelegate.phone || '', email: dbDelegate.email || '',
          zone: dbDelegate.zone || '', status: dbDelegate.status,
          username: dbDelegate.username, password: dbDelegate.password_hash,
          avatar: dbDelegate.avatar || '',
          location: { lat: 24.7136, lng: 46.6753, address: 'غير محدد', timestamp: new Date().toISOString() },
          locationHistory: [], warehouse: [], invoices: [], transactions: [],
          stats: { totalSales: 0, totalPurchases: 0, collected: 0, balance: 0, externalCredit: 0, expenses: 0, companyEntrusted: 0 },
        }

        if (delegateData.status !== 'active') {
          toast('هذا الحساب موقوف — تواصل مع الإدارة', 'danger')
          return
        }

        login({
          id: delegateData.id, name: delegateData.name,
          email: delegateData.email, role: 'delegate',
          company: import.meta.env.VITE_COMPANY_NAME || 'سهل',
          delegateId: delegateData.id,
        })
        toast(`مرحباً ${delegateData.name}!`, 'success')
        setLoginAttempts(0)
        navigate('/delegate/home')
      }
    } catch (err: any) {
      setErrorBox(`خطأ غير متوقع: ${err?.message || 'حاول مرة أخرى'}`)
    } finally {
      setLoading(false)
    }
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

        {/* Mode switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setMode('admin')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, transition: 'all .2s',
              background: mode === 'admin' ? 'var(--card)' : 'transparent',
              color: mode === 'admin' ? 'var(--text)' : 'var(--muted)',
              boxShadow: mode === 'admin' ? 'var(--shadow)' : 'none',
            }}
          >
            <i className="fa fa-user-shield" style={{ marginLeft: 6 }} />
            إدارة
          </button>
          <button
            type="button"
            onClick={() => setMode('delegate')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, transition: 'all .2s',
              background: mode === 'delegate' ? 'var(--card)' : 'transparent',
              color: mode === 'delegate' ? 'var(--text)' : 'var(--muted)',
              boxShadow: mode === 'delegate' ? 'var(--shadow)' : 'none',
            }}
          >
            <i className="fa fa-user-tie" style={{ marginLeft: 6 }} />
            مندوب
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'admin' ? (
            <>
              <div className="form-group">
                <label className="form-label">البريد أو اسم المستخدم</label>
                <input
                  className="form-control"
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
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
                    placeholder="كلمة المرور"
                    style={{ paddingLeft: 40 }}
                    autoComplete="current-password"
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
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">اسم المستخدم</label>
                <input
                  className="form-control"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="اسم المستخدم"
                  autoComplete="username"
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
                    placeholder="كلمة المرور"
                    style={{ paddingLeft: 40 }}
                    autoComplete="current-password"
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
            </>
          )}

          {loginAttempts > 0 && (
            <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12, padding: '8px 12px', background: 'var(--danger-bg)', borderRadius: 8 }}>
              <i className="fa fa-exclamation-triangle" style={{ marginLeft: 6 }} />
              محاولات خاطئة: {loginAttempts} / 5
            </div>
          )}

          {errorBox && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #EF4444', borderRadius: 10,
              padding: '12px 14px', marginBottom: 16, fontSize: 12,
              color: '#B91C1C', wordBreak: 'break-all', lineHeight: 1.6,
            }}>
              <i className="fa fa-exclamation-circle" style={{ marginLeft: 6 }} />
              {errorBox}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> تذكرني
            </label>
            <a href="#" style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 600 }}>نسيت كلمة المرور؟</a>
          </div>

          <button className="btn btn-primary w-full" type="submit" disabled={loading || isLocked} style={{ justifyContent: 'center', padding: '12px 0' }}>
            {loading ? <><i className="fa fa-spinner fa-spin" /> جارٍ تسجيل الدخول...</> : isLocked ? 'الحساب مقفل' : 'تسجيل الدخول'}
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
