import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { fmt } from '@/lib/format'
import { toast } from '@/lib/toast'

interface Deal {
  id: string
  name: string
  company: string
  amount: number
  stage: keyof typeof STAGES
  owner: string
  date: string
  priority: 'high' | 'medium' | 'low'
}

const STAGES = {
  lead:     { label: 'عميل محتمل', color: '#94A3B8' },
  contact:  { label: 'تم التواصل',  color: '#2563EB' },
  proposal: { label: 'عرض سعر',    color: '#7C3AED' },
  nego:     { label: 'تفاوض',       color: '#D97706' },
  won:      { label: 'فوز',         color: '#10B981' },
  lost:     { label: 'خسارة',       color: '#EF4444' },
}

const DEALS: Deal[] = [
  { id: '1', name: 'نظام ERP متكامل', company: 'شركة الأفق', amount: 85000, stage: 'proposal', owner: 'أحمد', date: '2025-05-15', priority: 'high' },
  { id: '2', name: 'حزمة محاسبة سنوية', company: 'مؤسسة النور', amount: 24000, stage: 'contact', owner: 'عمر', date: '2025-05-20', priority: 'medium' },
  { id: '3', name: 'POS لمتجرين', company: 'متاجر السعادة', amount: 18500, stage: 'nego', owner: 'أحمد', date: '2025-05-10', priority: 'high' },
  { id: '4', name: 'اشتراك سنوي', company: 'شركة البنيان', amount: 12000, stage: 'won', owner: 'عمر', date: '2025-04-28', priority: 'low' },
  { id: '5', name: 'نظام الفنادق', company: 'فندق الواحة', amount: 55000, stage: 'lead', owner: 'ريم', date: '2025-05-30', priority: 'medium' },
  { id: '6', name: 'موديول المخزون', company: 'شركة الخليج', amount: 9500, stage: 'lost', owner: 'أحمد', date: '2025-04-15', priority: 'low' },
  { id: '7', name: 'نظام HR كامل', company: 'مجموعة الرواد', amount: 38000, stage: 'proposal', owner: 'ريم', date: '2025-05-25', priority: 'high' },
]

export default function CRMPage() {
  const [deals, setDeals] = useState<Deal[]>(DEALS)

  const byStage = (stage: keyof typeof STAGES) => deals.filter(d => d.stage === stage)
  const totalPipeline = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').reduce((s, d) => s + d.amount, 0)
  const wonAmount = deals.filter(d => d.stage === 'won').reduce((s, d) => s + d.amount, 0)

  const moveDeal = (dealId: string, stage: keyof typeof STAGES) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage } : d))
    toast(`تم نقل الصفقة إلى "${STAGES[stage].label}"`, 'success')
  }

  return (
    <>
      <PageHeader
        title="CRM وخط أنابيب المبيعات"
        subtitle="تتبع الصفقات والعملاء المحتملين"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => toast('جارٍ إضافة صفقة...', 'info')}>
            <i className="fa fa-plus" /> صفقة جديدة
          </button>
        }
      />

      {/* Stats */}
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card dark">
          <div className="stat-label">إجمالي خط الأنابيب</div>
          <div className="stat-value">{fmt(totalPipeline)}</div>
          <div className="stat-sub">{deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length} صفقة نشطة</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">صفقات مُغلقة بنجاح</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(wonAmount)}</div>
          <div className="stat-sub">{deals.filter(d => d.stage === 'won').length} صفقة</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">معدل التحويل</div>
          <div className="stat-value">32%</div>
          <div className="stat-sub">فوز / إجمالي</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">متوسط دورة البيع</div>
          <div className="stat-value">21 يوم</div>
          <div className="stat-sub">من عميل محتمل لفوز</div>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' }}>
        {(Object.entries(STAGES) as [keyof typeof STAGES, typeof STAGES[keyof typeof STAGES]][]).map(([stageKey, stageMeta]) => {
          const stageDeals = byStage(stageKey)
          return (
            <div key={stageKey} style={{ minWidth: 240, maxWidth: 240, background: 'var(--bg)', borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
              <div style={{
                padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `2px solid ${stageMeta.color}`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: stageMeta.color }}>{stageMeta.label}</span>
                <span style={{ background: 'rgba(0,0,0,.08)', color: 'var(--muted)', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10 }}>
                  {stageDeals.length}
                </span>
              </div>

              <div style={{ padding: 10, minHeight: 80 }}>
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    style={{
                      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
                      padding: 14, marginBottom: 10, cursor: 'pointer', transition: '.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = stageMeta.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = '' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{deal.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{deal.company}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--blue)', marginBottom: 8 }}>{fmt(deal.amount)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{deal.date}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: deal.priority === 'high' ? 'var(--danger-bg)' : deal.priority === 'medium' ? 'var(--warn-bg)' : 'var(--success-bg)', color: deal.priority === 'high' ? 'var(--danger)' : deal.priority === 'medium' ? 'var(--warn)' : 'var(--success)' }}>
                        {deal.priority === 'high' ? '🔴 عالية' : deal.priority === 'medium' ? '🟡 متوسطة' : '🟢 منخفضة'}
                      </span>
                    </div>

                    {/* Move buttons */}
                    <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {stageKey !== 'won' && stageKey !== 'lost' && (
                        <>
                          <button
                            className="btn btn-sm"
                            style={{ fontSize: 10, padding: '3px 8px', background: 'var(--success-bg)', color: 'var(--success)', border: 'none' }}
                            onClick={() => moveDeal(deal.id, 'won')}
                          >فوز ✓</button>
                          <button
                            className="btn btn-sm"
                            style={{ fontSize: 10, padding: '3px 8px', background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none' }}
                            onClick={() => moveDeal(deal.id, 'lost')}
                          >خسارة ✕</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => toast('جارٍ إضافة صفقة...', 'info')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    width: '100%', padding: '8px 10px',
                    background: 'none', border: '1px dashed var(--border)',
                    borderRadius: 8, color: 'var(--muted)', fontSize: 12,
                    cursor: 'pointer', transition: '.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = stageMeta.color; (e.currentTarget as HTMLElement).style.color = stageMeta.color }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                >
                  <i className="fa fa-plus" /> إضافة
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
