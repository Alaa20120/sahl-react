import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import { fmt } from '@/lib/format'
import { toast } from '@/lib/toast'
import { useAppStore } from '@/store/app.store'

const VAT_PERIODS = [
  { period: 'Q1 2025 (يناير–مارس)', status: 'filed',   dueDate: '2025-04-30', vatOut: 42840, vatIn: 14700, net: 28140 },
  { period: 'Q4 2024 (أكتوبر–ديسمبر)', status: 'filed', dueDate: '2025-01-31', vatOut: 38220, vatIn: 12800, net: 25420 },
  { period: 'Q3 2024 (يوليو–سبتمبر)', status: 'filed', dueDate: '2024-10-31', vatOut: 35190, vatIn: 11600, net: 23590 },
]

const EINVOICES = [
  { id: 'ZATCA-001', ref: 'INV-2025-008', buyer: 'مؤسسة الإبداع الرقمي', amount: 7475, vat: 1121.25, total: 8596.25, status: 'approved', date: '2025-04-16' },
  { id: 'ZATCA-002', ref: 'INV-2025-007', buyer: 'شركة الرواد',           amount: 54050, vat: 8107.5, total: 62157.5, status: 'approved', date: '2025-03-20' },
  { id: 'ZATCA-003', ref: 'INV-2025-006', buyer: 'مؤسسة التميز',          amount: 11270, vat: 1690.5, total: 12960.5, status: 'pending', date: '2025-04-14' },
  { id: 'ZATCA-004', ref: 'INV-2025-005', buyer: 'شركة البناء الحديث',    amount: 25300, vat: 3795,   total: 29095,   status: 'approved', date: '2025-04-12' },
]

const STATUS_COLORS: Record<string, string> = { filed: 'var(--success)', pending: 'var(--warn)', overdue: 'var(--danger)', approved: 'var(--success)' }
const STATUS_LABELS: Record<string, string> = { filed: 'مُقدَّم', pending: 'معلق', overdue: 'متأخر', approved: 'معتمد' }

export default function ZATCAPage() {
  const company = useAppStore(s => s.company)
  const [tab, setTab] = useState('الإقرارات')

  const currentVat = 8107.5 + 1121.25 + 1690.5 + 3795
  const currentVatIn = 14700 * (2 / 3)

  return (
    <>
      <PageHeader
        title="ZATCA والضريبة"
        subtitle="إدارة الفاتورة الإلكترونية والإقرارات الضريبية"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => toast('جارٍ مزامنة بيانات ZATCA...', 'info')}>
              <i className="fa fa-rotate" /> مزامنة
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => toast('سيتم إطلاق هذه الميزة قريباً', 'info')}>
              <i className="fa fa-file-shield" /> إقرار جديد
            </button>
          </div>
        }
      />

      {/* Status banner */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A5F, #2563EB)', borderRadius: 12, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa fa-shield-halved" style={{ fontSize: 22, color: '#fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>النظام مرتبط بـ ZATCA</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>الفواتير الإلكترونية مفعلة — المرحلة الثانية (الربط والتكامل)</div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginBottom: 2 }}>رقم التسجيل الضريبي</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: 2 }}>{company.vat || '—'}</div>
        </div>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,.3)' }} />
      </div>

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="ضريبة محصّلة (Q2)" value={fmt(currentVat)} dark icon="fa-percent" />
        <StatCard label="ضريبة مدفوعة" value={fmt(currentVatIn)} icon="fa-arrow-up-from-line" iconColor="var(--danger)" />
        <StatCard label="صافي الضريبة المستحقة" value={fmt(currentVat - currentVatIn)} badge="مستحق" badgeType="warn" icon="fa-scale-balanced" iconColor="var(--warn)" />
        <StatCard label="فواتير معتمدة" value={String(EINVOICES.filter(i => i.status === 'approved').length)} badge="✓" badgeType="success" icon="fa-file-circle-check" iconColor="var(--success)" />
      </div>

      <div className="tabs mb-4">
        {['الإقرارات', 'الفواتير الإلكترونية'].map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'الإقرارات' && (
        <Card title="سجل الإقرارات الضريبية">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {VAT_PERIODS.map(vp => (
              <div key={vp.period} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: STATUS_COLORS[vp.status] + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="fa fa-file-shield" style={{ color: STATUS_COLORS[vp.status], fontSize: 18 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{vp.period}</div>
                  {vp.dueDate && <div style={{ fontSize: 12, color: 'var(--muted)' }}>تاريخ الاستحقاق: {vp.dueDate}</div>}
                </div>
                <div style={{ textAlign: 'center', minWidth: 100 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>ضريبة محصلة</div>
                  <div style={{ fontWeight: 700 }}>{fmt(vp.vatOut)}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 100 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>ضريبة مدفوعة</div>
                  <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(vp.vatIn)}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 100 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>الصافي المستحق</div>
                  <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{fmt(vp.net)}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[vp.status], background: STATUS_COLORS[vp.status] + '15', borderRadius: 6, padding: '4px 12px' }}>
                  {STATUS_LABELS[vp.status]}
                </span>
                <button className="btn btn-sm btn-outline" onClick={() => toast('جارٍ تحميل الإقرار...', 'info')}>
                  <i className="fa fa-download" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'الفواتير الإلكترونية' && (
        <Card title="سجل الفواتير الإلكترونية">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>رقم ZATCA</th>
                  <th>رقم الفاتورة</th>
                  <th>المشتري</th>
                  <th>المبلغ قبل الضريبة</th>
                  <th>ضريبة 15%</th>
                  <th>الإجمالي</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>QR</th>
                </tr>
              </thead>
              <tbody>
                {EINVOICES.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, fontSize: 12, color: 'var(--blue)' }}>{inv.id}</td>
                    <td style={{ fontSize: 12 }}>{inv.ref}</td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{inv.buyer}</td>
                    <td>{fmt(inv.amount)}</td>
                    <td style={{ color: 'var(--warn)', fontWeight: 600 }}>{fmt(inv.vat)}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{inv.date}</td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[inv.status], background: STATUS_COLORS[inv.status] + '15', borderRadius: 6, padding: '2px 8px' }}>
                        {STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" style={{ fontSize: 11 }} onClick={() => toast('جارٍ توليد QR...', 'info')}>
                        <i className="fa fa-qrcode" /> QR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
