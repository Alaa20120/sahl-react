import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { fmt, fmtNum } from '@/lib/format'
import { PRODUCTS, CATEGORIES } from '@/lib/mock-data/inventory'
import { toast } from '@/lib/toast'

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('الكل')
  const [showNew, setShowNew] = useState(false)

  const filtered = PRODUCTS.filter(p => {
    const matchCat = category === 'الكل' || p.category === category
    const matchSearch = !search || p.name.includes(search) || p.sku.includes(search)
    return matchCat && matchSearch
  })

  const lowStock = PRODUCTS.filter(p => p.stock <= p.minStock)
  const totalValue = PRODUCTS.reduce((s, p) => s + p.stock * p.costPrice, 0)

  return (
    <>
      <PageHeader
        title="إدارة المخزون"
        subtitle={`${PRODUCTS.length} صنف مسجل`}
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => toast('جارٍ تصدير المخزون...', 'info')}>
              <i className="fa fa-download" /> تصدير
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
              <i className="fa fa-plus" /> صنف جديد
            </button>
          </>
        }
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي الأصناف" value={fmtNum(PRODUCTS.length)} dark icon="fa-box" />
        <StatCard label="قيمة المخزون" value={fmt(totalValue)} icon="fa-coins" iconColor="var(--success)" />
        <StatCard label="أصناف منخفضة" value={String(lowStock.length)} badge="تنبيه" badgeType="danger" icon="fa-exclamation-triangle" iconColor="var(--danger)" />
        <StatCard label="أصناف نشطة" value={String(PRODUCTS.filter(p => p.status === 'active').length)} badge="نشط" badgeType="success" icon="fa-check-circle" iconColor="var(--success)" />
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="fa fa-exclamation-triangle" style={{ color: 'var(--danger)', fontSize: 18 }} />
          <div style={{ flex: 1 }}>
            <strong>تنبيه مخزون منخفض:</strong> {lowStock.map(p => p.name).join(' • ')}
          </div>
          <button className="btn btn-danger btn-sm">طلب تزويد</button>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-box" style={{ flex: 1, maxWidth: 320 }}>
              <i className="fa fa-search icon" />
              <input placeholder="ابحث بالاسم أو الكود..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-outline'}`}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الكود</th>
                <th>الصنف</th>
                <th>الفئة</th>
                <th>الوحدة</th>
                <th>سعر الشراء</th>
                <th>سعر البيع</th>
                <th>المخزون</th>
                <th>الحد الأدنى</th>
                <th>القيمة</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isLow = p.stock <= p.minStock
                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--muted)', fontSize: 12 }}>{p.sku}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>
                      <span style={{ background: 'var(--blue-light)', color: 'var(--blue)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{p.unit}</td>
                    <td>{fmt(p.costPrice)}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(p.sellPrice)}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--success)' }}>
                        {fmtNum(p.stock)}
                        {isLow && <i className="fa fa-exclamation-circle" style={{ marginRight: 4, fontSize: 11 }} />}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{fmtNum(p.minStock)}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(p.stock * p.costPrice)}</td>
                    <td>
                      <span className={`status ${p.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                        {p.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-icon btn-outline btn-sm" onClick={() => toast('جارٍ التعديل...', 'info')}><i className="fa fa-edit" /></button>
                        <button className="btn btn-icon btn-outline btn-sm" onClick={() => toast('جارٍ استخراج الباركود...', 'info')}><i className="fa fa-qrcode" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="إضافة صنف جديد"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
            <button className="btn btn-primary" onClick={() => { toast('تم إضافة الصنف', 'success'); setShowNew(false) }}>حفظ</button>
          </>
        }
      >
        <div className="form-grid-2">
          <div className="form-group col-span-2"><label className="form-label">اسم الصنف</label><input className="form-control" placeholder="اسم الصنف أو المنتج" /></div>
          <div className="form-group"><label className="form-label">الفئة</label><select className="form-control">{CATEGORIES.filter(c => c !== 'الكل').map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="form-group"><label className="form-label">الوحدة</label><select className="form-control"><option>قطعة</option><option>كيلو</option><option>لتر</option><option>كرتون</option></select></div>
          <div className="form-group"><label className="form-label">سعر الشراء</label><input className="form-control" type="number" placeholder="0.00" /></div>
          <div className="form-group"><label className="form-label">سعر البيع</label><input className="form-control" type="number" placeholder="0.00" /></div>
          <div className="form-group"><label className="form-label">الكمية المبدئية</label><input className="form-control" type="number" placeholder="0" /></div>
          <div className="form-group"><label className="form-label">الحد الأدنى</label><input className="form-control" type="number" placeholder="10" /></div>
        </div>
      </Modal>
    </>
  )
}
