import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { fmt, fmtDate } from '@/lib/format'
import { FIXED_ASSETS, ASSET_CATEGORIES, type AssetStatus, type AssetOwnership, type FixedAsset } from '@/lib/mock-data/fixed-assets'
import { useTreasuryStore } from '@/store/treasury.store'
import { toast } from '@/lib/toast'
import { useSaving } from '@/lib/useSaving'

const STATUS_COLORS: Record<AssetStatus, string> = {
  active:      'var(--success)',
  maintenance: 'var(--warn)',
  disposed:    'var(--danger)',
}
const STATUS_LABELS: Record<AssetStatus, string> = {
  active:      'نشط',
  maintenance: 'في الصيانة',
  disposed:    'مُستغنى عنه',
}
const CAT_ICONS: Record<string, string> = {
  'أجهزة كمبيوتر':  'fa-laptop',
  'معدات مكتبية':   'fa-print',
  'سيارات':          'fa-car',
  'أثاث':            'fa-couch',
  'معدات طباعة':    'fa-print',
}

const EMPTY_FORM = { name: '', category: 'أجهزة كمبيوتر', ownership: 'owned' as AssetOwnership, monthlyRent: '', purchaseDate: '', cost: '', depRate: '33', location: 'الرئيسي', status: 'active' as AssetStatus, serialNumber: '' }

function buildDepSchedule(asset: FixedAsset) {
  const rows: { year: string; charge: number; accumulated: number; bookValue: number }[] = []
  const annual = (asset.cost * asset.depRate) / 100
  const startYear = new Date(asset.purchaseDate).getFullYear()
  let acc = 0
  for (let i = 0; i < Math.ceil(100 / asset.depRate); i++) {
    acc = Math.min(acc + annual, asset.cost)
    rows.push({ year: String(startYear + i), charge: Math.min(annual, asset.cost - (acc - Math.min(annual, asset.cost - acc + annual))), accumulated: acc, bookValue: Math.max(asset.cost - acc, 0) })
    if (acc >= asset.cost) break
  }
  return rows
}

export default function FixedAssetsPage() {
  const { saving, run } = useSaving()
  const addTransaction = useTreasuryStore(s => s.addTransaction)
  const accounts = useTreasuryStore(s => s.accounts)

  const [assets, setAssets]         = useState<FixedAsset[]>(FIXED_ASSETS)
  const [catFilter, setCatFilter]   = useState('الكل')
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | AssetOwnership>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | AssetStatus>('all')
  const [search, setSearch]         = useState('')
  const [viewAsset, setViewAsset]   = useState<FixedAsset | null>(null)
  const [deleteAsset, setDeleteAsset] = useState<FixedAsset | null>(null)
  const [showNew, setShowNew]       = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [showRental, setShowRental] = useState(false)
  const [rentalAsset, setRentalAsset] = useState<FixedAsset | null>(null)
  const [rentalMonth, setRentalMonth] = useState(new Date().toISOString().slice(0, 7))
  const [rentalAmount, setRentalAmount] = useState('')
  const [rentalAccount, setRentalAccount] = useState('cash')

  const filtered = assets.filter(a => {
    const matchCat       = catFilter === 'الكل' || a.category === catFilter
    const matchOwnership = ownershipFilter === 'all' || a.ownership === ownershipFilter
    const matchStatus    = statusFilter === 'all' || a.status === statusFilter
    const matchSearch    = !search || a.name.includes(search) || a.id.includes(search)
    return matchCat && matchOwnership && matchStatus && matchSearch
  })

  const depPct = (a: FixedAsset) => Math.min(Math.round((a.accumulated / a.cost) * 100), 100)

  const handleDelete = () => {
    if (!deleteAsset) return
    setAssets(prev => prev.filter(a => a.id !== deleteAsset.id))
    toast(`تم حذف الأصل "${deleteAsset.name}"`, 'success')
    setDeleteAsset(null)
    if (viewAsset?.id === deleteAsset.id) setViewAsset(null)
  }

  const handleAdd = () => {
    if (!form.name.trim())        { toast('يرجى إدخال اسم الأصل', 'warn'); return }
    if (!form.purchaseDate)       { toast('يرجى تحديد تاريخ الشراء', 'warn'); return }
    if (!form.cost || +form.cost <= 0) { toast('يرجى إدخال تكلفة صحيحة', 'warn'); return }

    run(async () => {
      const cost = +form.cost
      const depRate = +form.depRate
      const newId = `FA-${String(assets.length + 1).padStart(3, '0')}`
      const yearsSince = (new Date().getFullYear() - new Date(form.purchaseDate).getFullYear())
      const accumulated = Math.min((cost * depRate / 100) * Math.max(yearsSince, 0), cost)
      const bookValue = Math.max(cost - accumulated, 0)

      const newAsset: FixedAsset = {
        id: newId,
        name: form.name.trim(),
        category: form.category,
        ownership: form.ownership,
        purchaseDate: form.purchaseDate,
        cost,
        accumulated,
        bookValue,
        depRate,
        status: form.status,
        location: form.location || 'الرئيسي',
        monthlyRent: form.ownership === 'rental' && form.monthlyRent ? +form.monthlyRent : undefined,
      }
      setAssets(prev => [newAsset, ...prev])
      toast(`تم إضافة الأصل "${newAsset.name}" بنجاح`, 'success')
      setShowNew(false)
      setForm(EMPTY_FORM)
    })
  }

  const totalCost        = assets.reduce((s, a) => s + a.cost, 0)
  const totalAccumulated = assets.reduce((s, a) => s + a.accumulated, 0)
  const totalBookValue   = assets.reduce((s, a) => s + a.bookValue, 0)
  const activeCount      = assets.filter(a => a.status === 'active').length

  const depSchedule = viewAsset ? buildDepSchedule(viewAsset) : []

  const handleRental = () => {
    if (!rentalAsset) return
    const amt = parseFloat(rentalAmount)
    if (!amt || amt <= 0) { toast('يرجى إدخال مبلغ الإيجار', 'warn'); return }
    addTransaction({
      date: new Date().toISOString().slice(0, 10),
      description: `إيجار شهري — ${rentalAsset.name} (${rentalMonth})`,
      type: 'out',
      category: 'expense',
      amount: amt,
      account: rentalAccount,
    })
    toast(`تم خصم إيجار ${rentalAsset.name} — ${fmt(amt)} ر.س`, 'success')
    setShowRental(false)
    setRentalAsset(null)
    setRentalAmount('')
  }

  return (
    <>
      <PageHeader
        title="الأصول الثابتة"
        subtitle="إدارة الأصول والاستهلاك"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
            <i className="fa fa-plus" /> أصل جديد
          </button>
        }
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="التكلفة الإجمالية" value={fmt(totalCost)} dark icon="fa-building" />
        <StatCard label="مجمع الاستهلاك" value={fmt(totalAccumulated)} icon="fa-arrow-trend-down" iconColor="var(--danger)" />
        <StatCard label="القيمة الدفترية" value={fmt(totalBookValue)} badge="صافي" badgeType="success" icon="fa-scale-balanced" iconColor="var(--success)" />
        <StatCard label="الأصول النشطة" value={String(activeCount)} icon="fa-check-circle" iconColor="var(--blue)" />
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body" style={{ padding: '12px 20px' }}>
          <div className="filter-bar" style={{ marginBottom: 0, flexWrap: 'wrap', gap: 10 }}>
            <div className="search-box" style={{ flex: 1, maxWidth: 280 }}>
              <i className="fa fa-search icon" />
              <input placeholder="ابحث بالاسم أو الرقم..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ASSET_CATEGORIES.map(c => (
                <button key={c} onClick={() => setCatFilter(c)} className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-outline'}`}>{c}</button>
              ))}
            </div>
            {/* Ownership filter */}
            <div style={{ display: 'flex', gap: 6 }}>
              {([['all','الكل'],['owned','تمليك'],['rental','إيجار']] as [typeof ownershipFilter, string][]).map(([k,v]) => (
                <button
                  key={k}
                  onClick={() => setOwnershipFilter(k)}
                  className={`btn btn-sm ${ownershipFilter === k ? 'btn-primary' : 'btn-outline'}`}
                  style={k === 'rental' && ownershipFilter !== 'rental' ? { color: 'var(--blue)', borderColor: 'var(--blue)40' } : {}}
                >
                  {k === 'rental' && <i className="fa fa-key" style={{ marginLeft: 4, fontSize: 10 }} />}
                  {v}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['all','الكل'],['active','نشط'],['maintenance','صيانة'],['disposed','مُستغنى']] as [typeof statusFilter, string][]).map(([k,v]) => (
                <button key={k} onClick={() => setStatusFilter(k)} className={`btn btn-sm ${statusFilter === k ? 'btn-primary' : 'btn-outline'}`}>{v}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>رقم الأصل</th>
                <th>اسم الأصل</th>
                <th>الفئة</th>
                <th>النوع</th>
                <th>تاريخ الشراء</th>
                <th>التكلفة / الإيجار</th>
                <th>مجمع الاستهلاك</th>
                <th>القيمة الدفترية</th>
                <th>نسبة الاستهلاك</th>
                <th>الموقع</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(asset => (
                <tr key={asset.id}>
                  <td style={{ fontWeight: 600, fontSize: 12, color: 'var(--blue)', cursor: 'pointer' }} onClick={() => setViewAsset(asset)}>{asset.id}</td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{asset.name}</td>
                  <td>
                    <span style={{ fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <i className={`fa ${CAT_ICONS[asset.category] ?? 'fa-box'}`} style={{ fontSize: 10 }} />
                      {asset.category}
                    </span>
                  </td>
                  <td>
                    {asset.ownership === 'rental'
                      ? <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--blue)15', color: 'var(--blue)', borderRadius: 6, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}><i className="fa fa-key" style={{ fontSize: 9 }} />إيجار</span>
                      : <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--success)15', color: 'var(--success)', borderRadius: 6, padding: '2px 8px' }}>تمليك</span>
                    }
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(new Date(asset.purchaseDate))}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{fmt(asset.cost)}</div>
                    {asset.ownership === 'rental' && asset.monthlyRent && (
                      <div style={{ fontSize: 10, color: 'var(--blue)', marginTop: 2 }}><i className="fa fa-key" style={{ marginLeft: 3, fontSize: 8 }} />{fmt(asset.monthlyRent)}/شهر</div>
                    )}
                  </td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{fmt(asset.accumulated)}</td>
                  <td style={{ fontWeight: 700, color: asset.bookValue === 0 ? 'var(--muted)' : 'var(--success)' }}>{fmt(asset.bookValue)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${depPct(asset)}%`, background: depPct(asset) >= 100 ? 'var(--danger)' : 'var(--warn)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', minWidth: 30 }}>{depPct(asset)}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{asset.location}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[asset.status], background: STATUS_COLORS[asset.status] + '15', borderRadius: 6, padding: '2px 8px' }}>
                      {STATUS_LABELS[asset.status]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-icon btn-outline" title="عرض التفاصيل" onClick={() => setViewAsset(asset)}>
                        <i className="fa fa-eye" />
                      </button>
                      {asset.ownership === 'rental' && (
                        <button
                          className="btn btn-icon btn-outline"
                          title="دفع إيجار شهري"
                          style={{ color: 'var(--blue)', borderColor: 'var(--blue)40' }}
                          onClick={() => { setRentalAsset(asset); setRentalAmount(String(asset.monthlyRent ?? '')); setShowRental(true) }}
                        >
                          <i className="fa fa-car" />
                        </button>
                      )}
                      <button
                        className="btn btn-icon btn-outline"
                        title="حذف الأصل"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' + '60' }}
                        onClick={() => setDeleteAsset(asset)}
                      >
                        <i className="fa fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><i className="fa fa-building" /></div>
              <div className="empty-state-title">لا توجد أصول</div>
              <div className="empty-state-sub">لم يتم العثور على أصول تطابق الفلتر المحدد</div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>عرض {filtered.length} من {assets.length} أصل</span>
        </div>
      </div>

      {/* ── View Asset Modal ── */}
      <Modal open={!!viewAsset} onClose={() => setViewAsset(null)} title="بيانات الأصل">
        {viewAsset && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: STATUS_COLORS[viewAsset.status] + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className={`fa ${CAT_ICONS[viewAsset.category] ?? 'fa-box'}`} style={{ fontSize: 22, color: STATUS_COLORS[viewAsset.status] }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{viewAsset.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{viewAsset.id} — {viewAsset.category}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLORS[viewAsset.status], background: STATUS_COLORS[viewAsset.status] + '15', borderRadius: 8, padding: '5px 12px' }}>
                {STATUS_LABELS[viewAsset.status]}
              </span>
            </div>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
              {[
                { label: 'التكلفة الأصلية', value: fmt(viewAsset.cost),        color: 'var(--text)' },
                { label: 'مجمع الاستهلاك',  value: fmt(viewAsset.accumulated), color: 'var(--danger)' },
                { label: 'القيمة الدفترية', value: fmt(viewAsset.bookValue),   color: viewAsset.bookValue > 0 ? 'var(--success)' : 'var(--muted)' },
              ].map(k => (
                <div key={k.label} style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Depreciation bar */}
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>نسبة الاستهلاك المتراكم</span>
                <span style={{ fontWeight: 800, color: depPct(viewAsset) >= 100 ? 'var(--danger)' : 'var(--warn)' }}>{depPct(viewAsset)}%</span>
              </div>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${depPct(viewAsset)}%`, background: depPct(viewAsset) >= 100 ? 'var(--danger)' : 'linear-gradient(90deg,var(--blue),var(--warn))', borderRadius: 5, transition: 'width .4s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
                <span>0%</span>
                <span>معدل الاستهلاك السنوي: {viewAsset.depRate}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {[
                { label: 'تاريخ الشراء',     value: fmtDate(new Date(viewAsset.purchaseDate)), icon: 'fa-calendar' },
                { label: 'الموقع',           value: viewAsset.location,                        icon: 'fa-location-dot' },
                { label: 'الفئة',            value: viewAsset.category,                        icon: 'fa-tag' },
                { label: 'معدل الاستهلاك',  value: `${viewAsset.depRate}% سنوياً`,           icon: 'fa-percent' },
                { label: 'الاستهلاك السنوي', value: fmt(Math.round(viewAsset.cost * viewAsset.depRate / 100)), icon: 'fa-arrow-trend-down' },
                { label: 'سنوات العمر المتبقية', value: viewAsset.bookValue > 0 ? `${Math.ceil(viewAsset.bookValue / (viewAsset.cost * viewAsset.depRate / 100))} سنة` : 'مستهلك بالكامل', icon: 'fa-clock' },
              ].map(f => (
                <div key={f.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fa ${f.icon}`} style={{ fontSize: 12, color: 'var(--muted)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{f.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Depreciation schedule */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>جدول الاستهلاك</div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: 11, borderBottom: '1px solid var(--border)' }}>السنة</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: 11, borderBottom: '1px solid var(--border)' }}>الاستهلاك السنوي</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: 11, borderBottom: '1px solid var(--border)' }}>مجمع الاستهلاك</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: 11, borderBottom: '1px solid var(--border)' }}>القيمة الدفترية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depSchedule.map((row, i) => {
                      const isPast = row.accumulated <= viewAsset.accumulated
                      return (
                        <tr key={i} style={{ background: isPast ? 'var(--danger)06' : 'transparent', borderBottom: i < depSchedule.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <td style={{ padding: '7px 12px', fontWeight: 600, color: isPast ? 'var(--muted)' : 'var(--text)' }}>{row.year}</td>
                          <td style={{ padding: '7px 12px', color: 'var(--danger)' }}>{fmt(viewAsset.cost * viewAsset.depRate / 100)}</td>
                          <td style={{ padding: '7px 12px', fontWeight: 600 }}>{fmt(Math.min(row.accumulated, viewAsset.cost))}</td>
                          <td style={{ padding: '7px 12px', fontWeight: 700, color: row.bookValue === 0 ? 'var(--muted)' : 'var(--success)' }}>{fmt(row.bookValue)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setViewAsset(null)}>إغلاق</button>
              {viewAsset.ownership === 'rental' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setRentalAsset(viewAsset); setRentalAmount(String(viewAsset.monthlyRent ?? '')); setShowRental(true); setViewAsset(null) }}
                >
                  <i className="fa fa-car" /> دفع إيجار شهري
                </button>
              )}
              <button
                className="btn btn-sm"
                style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}
                onClick={() => { setDeleteAsset(viewAsset); setViewAsset(null) }}
              >
                <i className="fa fa-trash" /> حذف الأصل
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal open={!!deleteAsset} onClose={() => setDeleteAsset(null)} title="تأكيد الحذف">
        {deleteAsset && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#FEF2F2', border: '1px solid var(--danger)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12 }}>
              <i className="fa fa-triangle-exclamation" style={{ color: 'var(--danger)', fontSize: 20, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>هل أنت متأكد من حذف هذا الأصل؟</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>لن يمكن التراجع عن هذا الإجراء وستُحذف جميع بيانات الأصل نهائياً.</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>رقم الأصل</span>
                <span style={{ fontWeight: 700 }}>{deleteAsset.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>الاسم</span>
                <span style={{ fontWeight: 700 }}>{deleteAsset.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>القيمة الدفترية</span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(deleteAsset.bookValue)} ر.س</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-sm"
                style={{ flex: 1, background: 'var(--danger)', color: '#fff', border: 'none' }}
                onClick={handleDelete}
              >
                <i className="fa fa-trash" /> نعم، احذف الأصل
              </button>
              <button className="btn btn-outline" onClick={() => setDeleteAsset(null)}>إلغاء</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Vehicle Rental Modal ── */}
      <Modal open={showRental} onClose={() => { setShowRental(false); setRentalAsset(null) }} title="دفع إيجار شهري — مركبة">
        {rentalAsset && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Vehicle card */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--blue)18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fa fa-car" style={{ fontSize: 20, color: 'var(--blue)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{rentalAsset.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {rentalAsset.id} — {rentalAsset.location}
                  {rentalAsset.monthlyRent && (
                    <span style={{ marginRight: 8, color: 'var(--blue)', fontWeight: 700 }}>
                      الإيجار المعتاد: {fmt(rentalAsset.monthlyRent)} ر.س/شهر
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Month */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الشهر المراد سداده <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                className="form-control"
                type="month"
                value={rentalMonth}
                onChange={e => setRentalMonth(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>مبلغ الإيجار (ر.س) <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                className="form-control"
                type="number"
                placeholder="0.00"
                value={rentalAmount}
                onChange={e => setRentalAmount(e.target.value)}
              />
              {rentalAsset.monthlyRent && rentalAmount !== String(rentalAsset.monthlyRent) && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  الإيجار المعتاد: {fmt(rentalAsset.monthlyRent)} ر.س
                </div>
              )}
            </div>

            {/* Account */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الخصم من حساب</label>
              <select className="form-control" value={rentalAccount} onChange={e => setRentalAccount(e.target.value)}>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.label} — الرصيد: {fmt(a.balance)} ر.س
                  </option>
                ))}
              </select>
            </div>

            {/* Info note */}
            <div style={{ background: '#EFF6FF', border: '1px solid var(--blue)30', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <i className="fa fa-circle-info" style={{ color: 'var(--blue)', fontSize: 14, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: 'var(--blue)', lineHeight: 1.6 }}>
                سيتم خصم المبلغ مباشرة من الحساب المحدد وتسجيله كمصروف إيجار في سجل الخزنة.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleRental}>
                <i className="fa fa-check" /> تأكيد السداد وخصم من الخزنة
              </button>
              <button className="btn btn-outline" onClick={() => { setShowRental(false); setRentalAsset(null) }}>إلغاء</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add New Asset Modal ── */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setForm(EMPTY_FORM) }} title="إضافة أصل جديد">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>اسم الأصل <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-control" placeholder="مثال: سيارة تويوتا كامري 2024" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الفئة</label>
              <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {ASSET_CATEGORIES.filter(c => c !== 'الكل').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {/* Ownership type toggle */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>نوع الأصل</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {([['owned','تمليك','fa-building','var(--success)'],['rental','إيجار','fa-key','var(--blue)']] as [AssetOwnership,string,string,string][]).map(([k,v,icon,color]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, ownership: k }))}
                    style={{
                      flex: 1, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                      border: `2px solid ${form.ownership === k ? color : 'var(--border)'}`,
                      background: form.ownership === k ? color + '12' : 'var(--bg)',
                      transition: 'all .15s',
                    }}
                  >
                    <i className={`fa ${icon}`} style={{ fontSize: 18, color: form.ownership === k ? color : 'var(--muted)', display: 'block', marginBottom: 4 }} />
                    <div style={{ fontWeight: 700, fontSize: 13, color: form.ownership === k ? color : 'var(--text)' }}>{v}</div>
                  </button>
                ))}
              </div>
            </div>
            {form.ownership === 'rental' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>قيمة الإيجار الشهري (ر.س) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="form-control"
                  type="number"
                  placeholder="0.00"
                  value={form.monthlyRent}
                  onChange={e => setForm(f => ({ ...f, monthlyRent: e.target.value }))}
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الحالة</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AssetStatus }))}>
                <option value="active">نشط</option>
                <option value="maintenance">في الصيانة</option>
                <option value="disposed">مُستغنى عنه</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>تاريخ الشراء <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-control" type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>التكلفة (ر.س) <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-control" type="number" placeholder="0.00" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>معدل الاستهلاك السنوي (%)</label>
              <select className="form-control" value={form.depRate} onChange={e => setForm(f => ({ ...f, depRate: e.target.value }))}>
                <option value="10">10% (10 سنوات)</option>
                <option value="20">20% (5 سنوات)</option>
                <option value="25">25% (4 سنوات)</option>
                <option value="33">33% (3 سنوات)</option>
                <option value="50">50% (سنتان)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الموقع</label>
              <input className="form-control" placeholder="الرئيسي / الفرع الشمالي..." value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>رقم السيريال (اختياري)</label>
              <input className="form-control" placeholder="SN-XXXXXXXX" value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} />
            </div>
          </div>

          {/* Preview calculation */}
          {form.cost && form.purchaseDate && (
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>معاينة الحسابات</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { label: 'الاستهلاك السنوي', value: fmt(+form.cost * +form.depRate / 100) },
                  { label: 'العمر الإنتاجي',   value: `${Math.ceil(100 / +form.depRate)} سنوات` },
                  { label: 'القيمة الأولية',   value: fmt(+form.cost) },
                ].map(p => (
                  <div key={p.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{p.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--blue)' }}>{p.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd} disabled={saving}>
              <i className="fa fa-plus" /> إضافة الأصل
            </button>
            <button className="btn btn-outline" onClick={() => { setShowNew(false); setForm(EMPTY_FORM) }}>إلغاء</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
