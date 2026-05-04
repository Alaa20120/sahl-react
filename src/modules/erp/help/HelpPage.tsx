import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { toast } from '@/lib/toast'

const FAQ = [
  { q: 'كيف أنشئ فاتورة جديدة؟', a: 'من قائمة الفواتير اضغط على زر "فاتورة جديدة" في أعلى الصفحة، أو استخدم اختصار الإجراءات السريعة من لوحة التحكم.' },
  { q: 'كيف أضيف عميلاً جديداً؟', a: 'من صفحة العملاء والموردين اضغط على "إضافة جديد"، أو عند إنشاء فاتورة يمكنك إضافة عميل جديد مباشرة.' },
  { q: 'كيف أصدّر تقريراً بصيغة Excel؟', a: 'في كل صفحة يوجد زر "تصدير" في أعلى يمين الجدول — يدعم Excel وPDF.' },
  { q: 'كيف أفعّل الفاتورة الإلكترونية ZATCA؟', a: 'من الإعدادات > الضريبة > تفعيل الفوترة الإلكترونية. ستحتاج إلى الرقم الضريبي وشهادة ZATCA.' },
  { q: 'هل يدعم النظام أكثر من فرع؟', a: 'نعم، يمكنك إضافة فروع متعددة من الإعدادات وتعيين موظفين وصلاحيات لكل فرع.' },
  { q: 'كيف أسترجع بيانات محذوفة؟', a: 'من الإعدادات > النسخ الاحتياطي يمكنك استعادة بيانات من نسخة سابقة أو التواصل مع الدعم الفني.' },
]

const GUIDES = [
  { icon: 'fa-play-circle', title: 'البدء السريع',           desc: 'تعلم أساسيات النظام في 10 دقائق', color: '#2563EB', time: '10 دقائق' },
  { icon: 'fa-file-invoice', title: 'إنشاء وإدارة الفواتير',  desc: 'دليل شامل للفوترة والتحصيل',      color: '#10B981', time: '15 دقيقة' },
  { icon: 'fa-users',        title: 'إدارة العملاء والموردين', desc: 'كيفية إضافة وإدارة جهات الاتصال', color: '#7C3AED', time: '8 دقائق'  },
  { icon: 'fa-chart-bar',    title: 'التقارير والتحليلات',    desc: 'فهم الأرقام واتخاذ القرار',        color: '#D97706', time: '12 دقيقة' },
  { icon: 'fa-shield-halved','title': 'ZATCA والفوترة الإلكترونية', desc: 'الامتثال للهيئة', color: '#DC2626', time: '20 دقيقة' },
  { icon: 'fa-users-cog',    title: 'إدارة المستخدمين',       desc: 'الصلاحيات والأدوار الوظيفية',     color: '#0891B2', time: '7 دقائق'  },
]

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [ticket, setTicket] = useState({ subject: '', message: '' })

  return (
    <>
      <PageHeader title="المساعدة والدعم" subtitle="نحن هنا لمساعدتك في أي وقت" />

      {/* Quick contact */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: 'fa-comments', label: 'محادثة مباشرة', desc: 'متاح 24/7', color: '#10B981', action: () => toast('جارٍ فتح المحادثة...', 'info') },
          { icon: 'fa-envelope', label: 'البريد الإلكتروني', desc: 'support@sahl.sa', color: '#2563EB', action: () => toast('تم نسخ البريد الإلكتروني', 'success') },
          { icon: 'fa-phone',    label: 'الهاتف',          desc: '920012345', color: '#7C3AED', action: () => toast('رقم الهاتف: 920012345', 'info') },
        ].map(c => (
          <button key={c.label} onClick={c.action} style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '18px 20px', cursor: 'pointer', textAlign: 'right', transition: '.15s',
            display: 'flex', alignItems: 'center', gap: 14,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.color }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 10, background: c.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`fa ${c.icon}`} style={{ fontSize: 20, color: c.color }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid-2 mb-6">
        {/* Guides */}
        <Card title="أدلة الاستخدام">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {GUIDES.map(g => (
              <button key={g.title} onClick={() => toast(`جارٍ فتح الدليل: ${g.title}`, 'info')} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 4px',
                background: 'none', border: 'none', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'right', width: '100%',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: g.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`fa ${g.icon}`} style={{ color: g.color, fontSize: 14 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{g.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{g.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg)', borderRadius: 5, padding: '2px 8px', border: '1px solid var(--border)' }}>
                    <i className="fa fa-clock" style={{ marginLeft: 4 }} />{g.time}
                  </span>
                  <i className="fa fa-chevron-left" style={{ fontSize: 11, color: 'var(--muted)' }} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* FAQ */}
        <Card title="الأسئلة الشائعة">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FAQ.map((faq, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', gap: 10 }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{faq.q}</span>
                  <i className={`fa fa-chevron-${openFaq === i ? 'up' : 'down'}`} style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }} />
                </button>
                {openFaq === i && (
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, paddingBottom: 12 }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Support ticket */}
      <Card title="تواصل مع الدعم الفني">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 700 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>موضوع الطلب</label>
            <input className="form-control" placeholder="وصف مختصر للمشكلة أو الاستفسار..."
              value={ticket.subject} onChange={e => setTicket(p => ({ ...p, subject: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>تفاصيل الطلب</label>
            <textarea className="form-control" rows={4} placeholder="اشرح المشكلة بالتفصيل..."
              value={ticket.message} onChange={e => setTicket(p => ({ ...p, message: e.target.value }))}
              style={{ resize: 'none' }} />
          </div>
          <div>
            <button className="btn btn-primary" onClick={() => {
              if (!ticket.subject || !ticket.message) { toast('يرجى ملء جميع الحقول', 'warn'); return }
              toast('تم إرسال طلب الدعم — سنتواصل معك خلال 24 ساعة', 'success')
              setTicket({ subject: '', message: '' })
            }}>
              <i className="fa fa-paper-plane" /> إرسال الطلب
            </button>
          </div>
        </div>
      </Card>
    </>
  )
}
