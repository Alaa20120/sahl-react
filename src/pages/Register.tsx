import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/lib/toast'

const PLANS = [
  { id: 'starter', name: 'المبتدئ', price: '149', desc: 'للشركات الصغيرة', features: ['5 مستخدمين', 'الفواتير والمشتريات', 'تقارير أساسية'] },
  { id: 'pro',     name: 'الاحترافي', price: '349', desc: 'الأكثر شيوعاً', features: ['20 مستخدم', 'جميع الوحدات', 'ZATCA المرحلة 2', 'دعم مخصص'] },
  { id: 'enterprise', name: 'المؤسسي', price: 'تواصل معنا', desc: 'للشركات الكبيرة', features: ['مستخدمون غير محدودون', 'تكامل مخصص', 'SLA مضمون', 'مدير حساب'] },
]

export default function Register() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [plan, setPlan] = useState('pro')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    companyName: '', companyNameEn: '', cr: '', vat: '',
    city: 'الرياض', industry: '',
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const next = () => {
    if (step === 1) {
      if (!form.companyName || !form.cr) { toast('يرجى إدخال اسم الشركة ورقم السجل التجاري', 'warn'); return }
    }
    if (step === 2) {
      if (!form.name || !form.email || !form.password) { toast('يرجى إدخال جميع بيانات المسؤول', 'warn'); return }
      if (form.password.length < 8) { toast('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'warn'); return }
      if (form.password !== form.confirmPassword) { toast('كلمتا المرور غير متطابقتين', 'warn'); return }
    }
    setStep(prev => (prev < 3 ? (prev + 1) as 1 | 2 | 3 : prev))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      login({ id: '1', name: form.name, email: form.email, role: 'admin', company: form.companyName })
      toast('تم إنشاء الحساب بنجاح! مرحباً بك في سهل', 'success')
      navigate('/erp/dashboard')
    }, 1200)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-form-side" style={{ maxWidth: step === 3 ? 640 : 500 }}>
        {/* Logo */}
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

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
          {[{ n: 1, label: 'بيانات الشركة' }, { n: 2, label: 'بيانات المسؤول' }, { n: 3, label: 'اختيار الباقة' }].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                  background: step >= s.n ? 'var(--primary)' : 'var(--border)',
                  color: step >= s.n ? '#fff' : 'var(--muted)',
                  transition: '.2s',
                }}>
                  {step > s.n ? <i className="fa fa-check" /> : s.n}
                </div>
                <span style={{ fontSize: 11, color: step >= s.n ? 'var(--primary)' : 'var(--muted)', fontWeight: step === s.n ? 700 : 400, whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 2, background: step > s.n ? 'var(--primary)' : 'var(--border)', margin: '0 8px', marginBottom: 20, transition: '.2s' }} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Company Info */}
          {step === 1 && (
            <>
              <div className="auth-title">بيانات الشركة</div>
              <div className="auth-sub">أدخل بيانات شركتك للبدء</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">اسم الشركة (عربي) *</label>
                  <input className="form-control" value={form.companyName} onChange={set('companyName')} placeholder="شركة النور للتجارة" />
                </div>
                <div className="form-group">
                  <label className="form-label">اسم الشركة (إنجليزي)</label>
                  <input className="form-control" value={form.companyNameEn} onChange={set('companyNameEn')} placeholder="Al Noor Trading Co." />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم السجل التجاري *</label>
                  <input className="form-control" value={form.cr} onChange={set('cr')} placeholder="1234567890" maxLength={10} />
                </div>
                <div className="form-group">
                  <label className="form-label">الرقم الضريبي (VAT)</label>
                  <input className="form-control" value={form.vat} onChange={set('vat')} placeholder="310123456700003" maxLength={15} />
                </div>
                <div className="form-group">
                  <label className="form-label">المدينة</label>
                  <select className="form-control" value={form.city} onChange={set('city')}>
                    {['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'أبها', 'تبوك', 'أخرى'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">القطاع</label>
                  <select className="form-control" value={form.industry} onChange={set('industry')}>
                    <option value="">اختر القطاع</option>
                    {['تجارة التجزئة', 'الخدمات المهنية', 'المقاولات', 'التصنيع', 'التقنية', 'الرعاية الصحية', 'التعليم', 'أخرى'].map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Admin Info */}
          {step === 2 && (
            <>
              <div className="auth-title">بيانات المسؤول</div>
              <div className="auth-sub">ستكون هذه بيانات الدخول الرئيسية</div>
              <div className="form-group">
                <label className="form-label">الاسم الكامل *</label>
                <input className="form-control" value={form.name} onChange={set('name')} placeholder="أحمد محمد العمري" />
              </div>
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني *</label>
                <input className="form-control" type="email" value={form.email} onChange={set('email')} placeholder="ahmed@company.sa" />
              </div>
              <div className="form-group">
                <label className="form-label">رقم الجوال</label>
                <input className="form-control" type="tel" value={form.phone} onChange={set('phone')} placeholder="05xxxxxxxx" />
              </div>
              <div className="form-group">
                <label className="form-label">كلمة المرور *</label>
                <input className="form-control" type="password" value={form.password} onChange={set('password')} placeholder="8 أحرف على الأقل" />
              </div>
              <div className="form-group">
                <label className="form-label">تأكيد كلمة المرور *</label>
                <input className="form-control" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="أعد كتابة كلمة المرور" />
              </div>
            </>
          )}

          {/* Step 3: Plan Selection */}
          {step === 3 && (
            <>
              <div className="auth-title">اختر باقتك</div>
              <div className="auth-sub">يمكنك الترقية في أي وقت — جرّب 14 يوماً مجاناً</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {PLANS.map(p => (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '16px', borderRadius: 10, cursor: 'pointer',
                      border: plan === p.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: plan === p.id ? '#f8f9ff' : 'var(--card)',
                      transition: '.15s',
                    }}
                  >
                    <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} style={{ marginTop: 3 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>
                          {p.price === 'تواصل معنا' ? p.price : `${p.price} ر.س/شهر`}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{p.desc}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {p.features.map(f => (
                          <span key={f} style={{ fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', color: 'var(--text-2)' }}>
                            <i className="fa fa-check" style={{ color: 'var(--success)', marginLeft: 4, fontSize: 10 }} />{f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {step > 1 && (
              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)}>
                <i className="fa fa-arrow-right" /> السابق
              </button>
            )}
            {step < 3 ? (
              <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={next}>
                التالي <i className="fa fa-arrow-left" />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px 0' }} disabled={loading}>
                {loading
                  ? <><i className="fa fa-spinner fa-spin" /> جارٍ إنشاء الحساب...</>
                  : <><i className="fa fa-rocket" /> ابدأ تجربتك المجانية</>
                }
              </button>
            )}
          </div>
        </form>

        <div className="auth-footer">
          لديك حساب بالفعل؟ <Link to="/" style={{ color: 'var(--blue)', fontWeight: 600 }}>تسجيل الدخول</Link>
        </div>
      </div>

      <div className="auth-hero-side">
        <div className="auth-hero-content">
          <div className="auth-hero-title">ابدأ رحلتك مع سهل</div>
          <div className="auth-hero-sub">نظام ERP عربي متكامل — متوافق مع ZATCA المرحلة الثانية</div>
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              '✓ إعداد الحساب خلال 5 دقائق فقط',
              '✓ 14 يوماً تجربة مجانية بلا قيود',
              '✓ دعم فني 24/7 باللغة العربية',
              '✓ بيانات محفوظة في السحابة بأمان',
              '✓ لا بطاقة ائتمان مطلوبة للتجربة',
            ].map(f => (
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
