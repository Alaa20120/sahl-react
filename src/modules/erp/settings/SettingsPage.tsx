import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { toast } from '@/lib/toast'

const TABS = ['الشركة', 'الفواتير', 'الضريبة', 'الإشعارات', 'النسخ الاحتياطي']

export default function SettingsPage() {
  const [tab, setTab] = useState('الشركة')
  const [logo, setLogo] = useState<string | null>(null)
  const [company, setCompany] = useState({
    name: 'شركة سهل التقنية',
    nameEn: 'Sahl Technology Co.',
    cr: '1234567890',
    vat: '310123456700003',
    phone: '0112345678',
    email: 'info@sahl.sa',
    address: 'الرياض، حي العليا، شارع التحلية',
    city: 'الرياض',
    country: 'المملكة العربية السعودية',
  })
  const [invoice, setInvoice] = useState({
    prefix: 'INV',
    nextNum: 9,
    payDays: 30,
    currency: 'SAR',
    notes: 'شكراً لتعاملكم معنا. يُرجى الدفع خلال 30 يوماً من تاريخ الفاتورة.',
    terms: '',
  })
  const [notifs, setNotifs] = useState({
    overdueAlerts: true,
    lowStockAlerts: true,
    paymentReceived: true,
    monthlyReport: false,
    emailNotifs: true,
    smsNotifs: false,
  })

  const handleSave = () => toast('تم حفظ الإعدادات بنجاح', 'success')

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: value ? 'var(--success)' : 'var(--border)',
        position: 'relative', transition: '.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: '.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        right: value ? 2 : 22,
      }} />
    </button>
  )

  return (
    <>
      <PageHeader title="الإعدادات" subtitle="إعدادات النظام والشركة" />

      <div className="tabs mb-6">
        {TABS.map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'الشركة' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="شعار الشركة">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 12, border: '2px dashed var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg)', overflow: 'hidden', flexShrink: 0,
              }}>
                {logo
                  ? <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <i className="fa fa-image" style={{ fontSize: 28, color: 'var(--muted)' }} />
                }
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>تحميل شعار الشركة</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>PNG أو SVG — بحد أقصى 1MB</div>
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                  <i className="fa fa-upload" /> اختيار ملف
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) { const url = URL.createObjectURL(file); setLogo(url) }
                  }} />
                </label>
              </div>
            </div>
          </Card>

          <Card title="بيانات الشركة">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'اسم الشركة (عربي)', key: 'name' },
                { label: 'اسم الشركة (إنجليزي)', key: 'nameEn' },
                { label: 'رقم السجل التجاري', key: 'cr' },
                { label: 'الرقم الضريبي', key: 'vat' },
                { label: 'رقم الهاتف', key: 'phone' },
                { label: 'البريد الإلكتروني', key: 'email' },
                { label: 'المدينة', key: 'city' },
                { label: 'الدولة', key: 'country' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input className="form-control" value={company[f.key as keyof typeof company]}
                    onChange={e => setCompany(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>العنوان</label>
                <input className="form-control" value={company.address}
                  onChange={e => setCompany(prev => ({ ...prev, address: e.target.value }))} />
              </div>
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button className="btn btn-primary" onClick={handleSave}>
              <i className="fa fa-floppy-disk" /> حفظ التغييرات
            </button>
          </div>
        </div>
      )}

      {tab === 'الفواتير' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="إعدادات الترقيم">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>بادئة رقم الفاتورة</label>
                <input className="form-control" value={invoice.prefix} onChange={e => setInvoice(p => ({ ...p, prefix: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الرقم التالي</label>
                <input className="form-control" type="number" value={invoice.nextNum} onChange={e => setInvoice(p => ({ ...p, nextNum: +e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>مهلة الدفع (يوم)</label>
                <input className="form-control" type="number" value={invoice.payDays} onChange={e => setInvoice(p => ({ ...p, payDays: +e.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, fontSize: 12, color: 'var(--muted)' }}>
              مثال على رقم الفاتورة التالية: <strong style={{ color: 'var(--text)' }}>{invoice.prefix}-2025-{String(invoice.nextNum).padStart(3,'0')}</strong>
            </div>
          </Card>

          <Card title="ملاحظات وشروط الفاتورة">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الملاحظات الافتراضية</label>
                <textarea className="form-control" rows={3} value={invoice.notes}
                  onChange={e => setInvoice(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الشروط والأحكام</label>
                <textarea className="form-control" rows={3} value={invoice.terms}
                  onChange={e => setInvoice(p => ({ ...p, terms: e.target.value }))}
                  style={{ resize: 'none' }} placeholder="أدخل الشروط والأحكام الخاصة بفواتيركم..." />
              </div>
            </div>
          </Card>

          <div>
            <button className="btn btn-primary" onClick={handleSave}>
              <i className="fa fa-floppy-disk" /> حفظ التغييرات
            </button>
          </div>
        </div>
      )}

      {tab === 'الضريبة' && (
        <Card title="إعدادات الضريبة">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الرقم الضريبي (VAT)</label>
              <input className="form-control" defaultValue="310123456700003" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>نسبة ضريبة القيمة المضافة</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input className="form-control" defaultValue="15" type="number" />
                <span style={{ fontSize: 14, color: 'var(--muted)', flexShrink: 0 }}>%</span>
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <i className="fa fa-file-shield" style={{ fontSize: 18, color: 'var(--blue)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>الفوترة الإلكترونية (ZATCA)</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>المرحلة الثانية — ربط مباشر مع هيئة الزكاة والضريبة</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', background: 'var(--success)15', borderRadius: 6, padding: '4px 12px' }}>مفعّل</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSave}>
              <i className="fa fa-floppy-disk" /> حفظ التغييرات
            </button>
          </div>
        </Card>
      )}

      {tab === 'الإشعارات' && (
        <Card title="إعدادات الإشعارات">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { key: 'overdueAlerts',   label: 'تنبيهات الفواتير المتأخرة',   desc: 'إشعار عند تجاوز فاتورة تاريخ الاستحقاق' },
              { key: 'lowStockAlerts',  label: 'تنبيهات المخزون المنخفض',     desc: 'إشعار عند وصول صنف للحد الأدنى' },
              { key: 'paymentReceived', label: 'تأكيد استلام الدفعات',         desc: 'إشعار عند تسجيل دفعة من عميل' },
              { key: 'monthlyReport',   label: 'التقرير الشهري التلقائي',       desc: 'إرسال ملخص شهري في بداية كل شهر' },
              { key: 'emailNotifs',     label: 'إشعارات البريد الإلكتروني',   desc: 'استقبال الإشعارات على البريد' },
              { key: 'smsNotifs',       label: 'إشعارات SMS',                 desc: 'استقبال الإشعارات برسائل نصية' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{item.desc}</div>
                </div>
                <Toggle
                  value={notifs[item.key as keyof typeof notifs]}
                  onChange={() => setNotifs(p => ({ ...p, [item.key]: !p[item.key as keyof typeof notifs] }))}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSave}>
              <i className="fa fa-floppy-disk" /> حفظ
            </button>
          </div>
        </Card>
      )}

      {tab === 'النسخ الاحتياطي' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="النسخ الاحتياطي">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { date: '2025-04-15 03:00', size: '4.2 MB', type: 'تلقائي', status: 'success' },
                { date: '2025-04-08 03:00', size: '4.0 MB', type: 'تلقائي', status: 'success' },
                { date: '2025-04-01 03:00', size: '3.8 MB', type: 'يدوي',   status: 'success' },
              ].map(b => (
                <div key={b.date} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <i className="fa fa-database" style={{ color: 'var(--blue)', fontSize: 18 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.date}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{b.size} — {b.type}</div>
                  </div>
                  <button className="btn btn-sm btn-outline" onClick={() => toast('جارٍ تحميل النسخة الاحتياطية...', 'info')}>
                    <i className="fa fa-download" /> تحميل
                  </button>
                </div>
              ))}
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => toast('جارٍ إنشاء نسخة احتياطية...', 'info')}>
                  <i className="fa fa-database" /> إنشاء نسخة الآن
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
