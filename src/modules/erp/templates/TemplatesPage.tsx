import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { toast } from '@/lib/toast'

type TemplateId = 'classic' | 'modern' | 'clean'
const TEMPLATE_KEY = 'sahl-inv-template'

const TEMPLATES: { id: TemplateId; name: string; desc: string; accent: string; preview: React.ReactNode }[] = [
  {
    id: 'classic',
    name: 'كلاسيكي',
    desc: 'خلفية داكنة في الرأس، احترافي ورسمي',
    accent: '#0D1117',
    preview: (
      <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.08)' }}>
        <div style={{ background: '#0D1117', padding: '16px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>شركة سهل التقنية</div>
            <div style={{ fontSize: 10, opacity: .6, marginTop: 2 }}>الرياض — الرقم الضريبي: 310...0003</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 800, opacity: .9 }}>فاتورة ضريبية</div>
            <div style={{ fontSize: 10, opacity: .6 }}>INV-2025-009</div>
          </div>
        </div>
        <div style={{ padding: '12px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10, fontSize: 10, color: '#6B7280' }}>
            <div><div style={{ fontWeight: 700 }}>فاتورة إلى</div><div style={{ color: '#111', fontWeight: 600, marginTop: 2 }}>شركة الرياض للتجارة</div></div>
            <div><div style={{ fontWeight: 700 }}>تاريخ الاستحقاق</div><div style={{ color: '#111', fontWeight: 600, marginTop: 2 }}>30 مايو 2025</div></div>
          </div>
          <div style={{ background: '#F4F6FA', borderRadius: 4, padding: '6px 8px', fontSize: 10, display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: '#6B7280' }}>الوصف</span>
            <span style={{ fontWeight: 700, color: '#6B7280' }}>الإجمالي</span>
          </div>
          <div style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #E5E7EB' }}>
            <span>استشارات تقنية × 5</span><span style={{ fontWeight: 700 }}>12,500</span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 10, width: 130 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}><span>قبل الضريبة</span><span>12,500</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F59E0B' }}><span>ضريبة 15%</span><span>1,875</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 12, marginTop: 4, paddingTop: 4, borderTop: '1px solid #E5E7EB' }}><span>الإجمالي</span><span>14,375</span></div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'modern',
    name: 'عصري',
    desc: 'تدرج لوني أزرق، تصميم معاصر وجذاب',
    accent: '#2563EB',
    preview: (
      <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.08)' }}>
        <div style={{ background: 'linear-gradient(135deg,#1a2035,#2563EB)', padding: '16px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>شركة سهل التقنية</div>
            <div style={{ fontSize: 10, opacity: .6, marginTop: 2 }}>الرياض — الرقم الضريبي: 310...0003</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 800, opacity: .9 }}>فاتورة ضريبية</div>
            <div style={{ fontSize: 10, opacity: .6 }}>INV-2025-009</div>
          </div>
        </div>
        <div style={{ padding: '12px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10, fontSize: 10, color: '#6B7280' }}>
            <div><div style={{ fontWeight: 700 }}>فاتورة إلى</div><div style={{ color: '#111', fontWeight: 600, marginTop: 2 }}>شركة الرياض للتجارة</div></div>
            <div><div style={{ fontWeight: 700 }}>تاريخ الاستحقاق</div><div style={{ color: '#111', fontWeight: 600, marginTop: 2 }}>30 مايو 2025</div></div>
          </div>
          <div style={{ background: '#EFF6FF', borderRadius: 4, padding: '6px 8px', fontSize: 10, display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: '#2563EB' }}>الوصف</span>
            <span style={{ fontWeight: 700, color: '#2563EB' }}>الإجمالي</span>
          </div>
          <div style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #E5E7EB' }}>
            <span>استشارات تقنية × 5</span><span style={{ fontWeight: 700 }}>12,500</span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 10, width: 130 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}><span>قبل الضريبة</span><span>12,500</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F59E0B' }}><span>ضريبة 15%</span><span>1,875</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 12, color: '#2563EB', marginTop: 4, paddingTop: 4, borderTop: '2px solid #2563EB' }}><span>الإجمالي</span><span>14,375</span></div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'clean',
    name: 'نظيف',
    desc: 'أبيض بخط سفلي ملون، بسيط وأنيق',
    accent: '#10B981',
    preview: (
      <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.08)' }}>
        <div style={{ background: '#fff', padding: '16px 20px', color: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0D1117' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>شركة سهل التقنية</div>
            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>الرياض — الرقم الضريبي: 310...0003</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>فاتورة ضريبية</div>
            <div style={{ fontSize: 10, color: '#6B7280' }}>INV-2025-009</div>
          </div>
        </div>
        <div style={{ padding: '12px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10, fontSize: 10, color: '#6B7280' }}>
            <div><div style={{ fontWeight: 700 }}>فاتورة إلى</div><div style={{ color: '#111', fontWeight: 600, marginTop: 2 }}>شركة الرياض للتجارة</div></div>
            <div><div style={{ fontWeight: 700 }}>تاريخ الاستحقاق</div><div style={{ color: '#111', fontWeight: 600, marginTop: 2 }}>30 مايو 2025</div></div>
          </div>
          <div style={{ background: '#F4F6FA', borderRadius: 4, padding: '6px 8px', fontSize: 10, display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: '#6B7280' }}>الوصف</span>
            <span style={{ fontWeight: 700, color: '#6B7280' }}>الإجمالي</span>
          </div>
          <div style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #E5E7EB' }}>
            <span>استشارات تقنية × 5</span><span style={{ fontWeight: 700 }}>12,500</span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 10, width: 130 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}><span>قبل الضريبة</span><span>12,500</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F59E0B' }}><span>ضريبة 15%</span><span>1,875</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 12, marginTop: 4, paddingTop: 4, borderTop: '1px solid #E5E7EB' }}><span>الإجمالي</span><span>14,375</span></div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

export default function TemplatesPage() {
  const [selected, setSelected] = useState<TemplateId>(
    (localStorage.getItem(TEMPLATE_KEY) as TemplateId) ?? 'classic'
  )


  const handleSelect = (id: TemplateId) => {
    setSelected(id)
    localStorage.setItem(TEMPLATE_KEY, id)
    toast('تم تطبيق القالب — سيُستخدم في الفواتير الجديدة', 'success')
  }

  return (
    <>
      <PageHeader
        title="قوالب الفواتير"
        subtitle="اختر تصميم الفاتورة المناسب لعملك"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 32 }}>
        {TEMPLATES.map(tpl => (
          <div
            key={tpl.id}
            style={{
              background: 'var(--card)', borderRadius: 14,
              border: `2px solid ${selected === tpl.id ? tpl.accent : 'var(--border)'}`,
              overflow: 'hidden', transition: '.2s', cursor: 'pointer',
              boxShadow: selected === tpl.id ? `0 0 0 3px ${tpl.accent}22` : 'none',
            }}
            onClick={() => handleSelect(tpl.id)}
          >
            {/* Preview */}
            <div style={{ padding: 16, background: 'var(--bg)' }}>
              {tpl.preview}
            </div>

            {/* Info */}
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{tpl.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{tpl.desc}</div>
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `2px solid ${selected === tpl.id ? tpl.accent : 'var(--border)'}`,
                background: selected === tpl.id ? tpl.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: '.2s', flexShrink: 0,
              }}>
                {selected === tpl.id && <i className="fa fa-check" style={{ fontSize: 11, color: '#fff' }} />}
              </div>
            </div>

            {selected === tpl.id && (
              <div style={{ background: tpl.accent, color: '#fff', textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '6px' }}>
                ✓ القالب المستخدم حالياً
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Document settings */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 20 }}>
          <i className="fa fa-gear" style={{ color: 'var(--muted)', marginLeft: 8 }} />إعدادات المستند
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { label: 'لغة الفاتورة', opts: ['عربي','إنجليزي','عربي + إنجليزي'] },
            { label: 'حجم الورق', opts: ['A4','Letter','A5'] },
            { label: 'اتجاه الطباعة', opts: ['عمودي (Portrait)','أفقي (Landscape)'] },
          ].map(s => (
            <div key={s.label}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>{s.label}</label>
              <select className="form-control">
                {s.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>إظهار QR Code</label>
            <select className="form-control"><option>نعم</option><option>لا</option></select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>إظهار الختم والتوقيع</label>
            <select className="form-control"><option>نعم</option><option>لا</option></select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>ترقيم الصفحات</label>
            <select className="form-control"><option>تلقائي</option><option>بدون</option></select>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
          <i className="fa fa-note-sticky" style={{ color: 'var(--muted)', marginLeft: 8 }} />نصوص ثابتة في كل الفواتير
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الملاحظات الافتراضية</label>
            <textarea className="form-control" rows={2} defaultValue="شكراً لتعاملكم معنا. يُرجى الدفع خلال 30 يوماً من تاريخ الفاتورة." style={{ resize: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الشروط والأحكام</label>
            <textarea className="form-control" rows={2} defaultValue="الأسعار شاملة ضريبة القيمة المضافة 15%. لا يحق إلغاء الطلب بعد التنفيذ." style={{ resize: 'none' }} />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => toast('تم حفظ الإعدادات', 'success')}>
          <i className="fa fa-floppy-disk" /> حفظ الإعدادات
        </button>
      </div>
    </>
  )
}
