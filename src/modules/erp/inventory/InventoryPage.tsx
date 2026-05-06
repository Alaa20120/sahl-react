import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { fmt, fmtNum } from '@/lib/format'
import { CATEGORIES, hasPendingWithdrawals } from '@/lib/mock-data/inventory'
import { useInventoryStore } from '@/store/inventory.store'
import { useDelegateStore } from '@/store/delegate.store'
import { useInvoiceStore } from '@/store/invoice.store'
import { exportExcel } from '@/lib/excel'
import { toast } from '@/lib/toast'

export default function InventoryPage() {
  const navigate = useNavigate()
  const { products, deleteProducts } = useInventoryStore()
  const { delegates } = useDelegateStore()
  const { invoices } = useInvoiceStore()
  const [showProfitability, setShowProfitability] = useState(false)

  // Product profitability: for each product, find all invoice items matching it,
  // then calculate (sold qty × sell price) - (sold qty × cost price) = gross profit
  const _profitabilityData = useMemo(() => {
    return products.map(product => {
      let soldQty = 0
      let soldRevenue = 0
      // Admin invoices
      invoices.filter(inv => inv.status !== 'draft').forEach(inv => {
        inv.items.forEach(item => {
          if (item.productId === product.id || item.description === product.name) {
            soldQty += item.qty
            soldRevenue += item.total
          }
        })
      })
      // Delegate invoices
      delegates.forEach(del => {
        del.invoices.filter(inv => inv.type === 'sale').forEach(inv => {
          inv.items.forEach((item: any) => {
            if (item.productId === product.id || item.description === product.name) {
              soldQty += item.qty
              soldRevenue += item.total
            }
          })
        })
      })
      const cogs = soldQty * product.costPrice
      const grossProfit = soldRevenue - cogs
      const margin = soldRevenue > 0 ? Math.round(grossProfit / soldRevenue * 100) : 0
      return { product, soldQty, soldRevenue, cogs, grossProfit, margin }
    }).sort((a, b) => b.grossProfit - a.grossProfit)
  }, [products, invoices, delegates])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('الكل')
  const [showNew, setShowNew] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const filtered = products.filter(p => {
    const matchCat = category === 'الكل' || p.category === category
    const matchSearch = !search || p.name.includes(search) || p.sku.includes(search)
    return matchCat && matchSearch
  })

  const lowStock = products.filter(p => p.stock <= p.minStock)
  const totalValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0)

  const selectableFiltered = filtered.filter(p => !hasPendingWithdrawals(p.id))
  const allFilteredSelected = selectableFiltered.length > 0 && selectableFiltered.every(p => selectedIds.has(p.id))
  const someFilteredSelected = selectableFiltered.some(p => selectedIds.has(p.id))

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        selectableFiltered.forEach(p => next.delete(p.id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        selectableFiltered.forEach(p => next.add(p.id))
        return next
      })
    }
  }

  function toggleSelect(id: string) {
    if (hasPendingWithdrawals(id)) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleDeleteConfirmed() {
    const count = selectedIds.size
    deleteProducts(Array.from(selectedIds))
    setSelectedIds(new Set())
    setShowDeleteConfirm(false)
    toast(`تم حذف ${count} ${count === 1 ? 'منتج' : 'منتجات'} بنجاح`, 'success')
  }

  return (
    <>
      <PageHeader
        title="إدارة المخزون"
        subtitle={`${products.length} صنف مسجل`}
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setShowProfitability(p => !p)}>
              <i className="fa fa-chart-bar" /> {showProfitability ? 'إخفاء' : 'ربحية المنتجات'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => {
              exportExcel({
                title: 'تقرير المخزون',
                filename: `مخزون-${new Date().toISOString().slice(0, 10)}`,
                columns: [
                  { header: 'الكود',          key: 'sku',       width: 14, type: 'text',     align: 'center' },
                  { header: 'اسم الصنف',       key: 'name',      width: 30, type: 'text' },
                  { header: 'الفئة',           key: 'category',  width: 16, type: 'text',     align: 'center' },
                  { header: 'الوحدة',          key: 'unit',      width: 12, type: 'text',     align: 'center' },
                  { header: 'سعر الشراء',      key: 'costPrice', width: 16, type: 'currency' },
                  { header: 'سعر البيع',       key: 'sellPrice', width: 16, type: 'currency' },
                  { header: 'المخزون الحالي',  key: 'stock',     width: 16, type: 'number',   align: 'center' },
                  { header: 'الحد الأدنى',     key: 'minStock',  width: 14, type: 'number',   align: 'center' },
                  { header: 'قيمة المخزون',    key: 'value',     width: 18, type: 'currency' },
                  { header: 'الحالة',          key: 'status',    width: 12, type: 'status',   align: 'center' },
                ],
                rows: filtered.map(p => ({ ...p, value: p.stock * p.costPrice })),
                totals: {
                  sku: '',
                  name: `${filtered.length} صنف`,
                  stock: filtered.reduce((s, p) => s + p.stock, 0),
                  value: filtered.reduce((s, p) => s + p.stock * p.costPrice, 0),
                },
              })
              toast('تم تصدير المخزون بنجاح', 'success')
            }}>
              <i className="fa fa-file-excel" /> تصدير Excel
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
              <i className="fa fa-plus" /> صنف جديد
            </button>
          </>
        }
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي الأصناف" value={fmtNum(products.length)} dark icon="fa-box" />
        <StatCard label="قيمة المخزون" value={fmt(totalValue)} icon="fa-coins" iconColor="var(--success)" />
        <StatCard label="أصناف منخفضة" value={String(lowStock.length)} badge="تنبيه" badgeType="danger" icon="fa-exclamation-triangle" iconColor="var(--danger)" />
        <StatCard label="أصناف نشطة" value={String(products.filter(p => p.status === 'active').length)} badge="نشط" badgeType="success" icon="fa-check-circle" iconColor="var(--success)" />
      </div>

      {showProfitability && (
        <div className="card mb-6">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}><i className="fa fa-chart-bar" style={{ marginLeft: 8, color: 'var(--primary)' }} />ربحية المنتجات — مقارنة تكلفة الشراء بإيرادات البيع</span>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
              <span>إجمالي الإيرادات: <strong style={{ color: 'var(--success)' }}>{fmt(_profitabilityData.reduce((s, r) => s + r.soldRevenue, 0))}</strong></span>
              <span>إجمالي التكلفة: <strong style={{ color: 'var(--danger)' }}>{fmt(_profitabilityData.reduce((s, r) => s + r.cogs, 0))}</strong></span>
              <span>صافي الربح: <strong style={{ color: 'var(--primary)' }}>{fmt(_profitabilityData.reduce((s, r) => s + r.grossProfit, 0))}</strong></span>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th style={{ textAlign: 'center' }}>الكمية المباعة</th>
                  <th>إيرادات البيع</th>
                  <th>تكلفة البضاعة المباعة</th>
                  <th>الربح الإجمالي</th>
                  <th style={{ textAlign: 'center' }}>هامش الربح</th>
                  <th>المخزون المتبقي</th>
                  <th>قيمة المخزون</th>
                </tr>
              </thead>
              <tbody>
                {_profitabilityData.map(({ product: p, soldQty, soldRevenue, cogs, grossProfit, margin }) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{p.sku}</div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {fmtNum(soldQty)} <span style={{ fontSize: 10, color: 'var(--muted)' }}>{p.unit}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{soldRevenue > 0 ? fmt(soldRevenue) : '—'}</td>
                    <td style={{ color: 'var(--danger)' }}>{cogs > 0 ? fmt(cogs) : '—'}</td>
                    <td>
                      <span style={{ fontWeight: 800, color: grossProfit > 0 ? 'var(--success)' : grossProfit < 0 ? 'var(--danger)' : 'var(--muted)' }}>
                        {grossProfit !== 0 ? (grossProfit > 0 ? '+' : '') + fmt(grossProfit) : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {soldRevenue > 0 ? (
                        <span style={{ fontWeight: 700, fontSize: 12, padding: '2px 8px', borderRadius: 20, background: margin >= 30 ? 'var(--success-bg)' : margin >= 10 ? 'var(--warn-bg)' : 'var(--danger-bg)', color: margin >= 30 ? 'var(--success)' : margin >= 10 ? 'var(--warn)' : 'var(--danger)' }}>
                          {margin}%
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmtNum(p.stock)} {p.unit}</td>
                    <td>{fmt(p.stock * p.costPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg)', fontWeight: 800 }}>
                  <td>الإجمالي</td>
                  <td style={{ textAlign: 'center' }}>{fmtNum(_profitabilityData.reduce((s, r) => s + r.soldQty, 0))}</td>
                  <td style={{ color: 'var(--success)' }}>{fmt(_profitabilityData.reduce((s, r) => s + r.soldRevenue, 0))}</td>
                  <td style={{ color: 'var(--danger)' }}>{fmt(_profitabilityData.reduce((s, r) => s + r.cogs, 0))}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 900 }}>{fmt(_profitabilityData.reduce((s, r) => s + r.grossProfit, 0))}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800 }}>
                    {(() => {
                      const rev = _profitabilityData.reduce((s, r) => s + r.soldRevenue, 0)
                      const profit = _profitabilityData.reduce((s, r) => s + r.grossProfit, 0)
                      return rev > 0 ? `${Math.round(profit / rev * 100)}%` : '—'
                    })()}
                  </td>
                  <td>{fmtNum(_profitabilityData.reduce((s, r) => s + r.product.stock, 0))}</td>
                  <td>{fmt(_profitabilityData.reduce((s, r) => s + r.product.stock * r.product.costPrice, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Low stock products footer */}
      {lowStock.length > 0 && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <i className="fa fa-exclamation-triangle" style={{ color: 'var(--danger)', fontSize: 18 }} />
            <strong>تنبيه: منتجات وصلت للحد الأدنى ({lowStock.length} منتج)</strong>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {lowStock.map(p => (
              <span key={p.id} style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                {p.name}
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>({p.stock}/{p.minStock})</span>
              </span>
            ))}
          </div>
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
        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div style={{ padding: '11px 20px', background: 'var(--pending-bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fa fa-check-square" style={{ color: 'var(--pending)', fontSize: 16 }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--pending)' }}>
              تم تحديد {selectedIds.size} {selectedIds.size === 1 ? 'منتج' : 'منتجات'}
            </span>
            <button className="btn btn-outline btn-sm" onClick={() => setSelectedIds(new Set())}>
              <i className="fa fa-times" /> إلغاء التحديد
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteConfirm(true)}>
              <i className="fa fa-trash" /> حذف المحدد ({selectedIds.size})
            </button>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={el => { if (el) el.indeterminate = !allFilteredSelected && someFilteredSelected }}
                    onChange={toggleSelectAll}
                    style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--primary)' }}
                    title="تحديد الكل"
                  />
                </th>
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
                const isProtected = hasPendingWithdrawals(p.id)
                const isSelected = selectedIds.has(p.id)
                return (
                  <tr key={p.id} style={{ background: isSelected ? '#F5F3FF' : undefined }}>
                    <td style={{ textAlign: 'center' }}>
                      {isProtected ? (
                        <span title="لا يمكن الحذف: يوجد طلبات معلقة على هذا المنتج">
                          <i className="fa fa-lock" style={{ color: 'var(--warn)', fontSize: 13 }} />
                        </span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--primary)' }}
                        />
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--muted)', fontSize: 12 }}>{p.sku}</td>
                    <td>
                      <button
                        style={{ fontWeight: 600, background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: 13, padding: 0, textAlign: 'right' }}
                        onClick={() => navigate(`/erp/inventory/${p.id}`)}
                      >
                        {p.name}
                      </button>
                      {isProtected && (
                        <span style={{ marginRight: 8, fontSize: 10, background: 'var(--warn-bg)', color: 'var(--warn)', padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>
                          معلق
                        </span>
                      )}
                    </td>
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
                        <button
                          className="btn btn-icon btn-outline btn-sm"
                          onClick={() => navigate(`/erp/inventory/${p.id}`)}
                          title="عرض التفاصيل"
                        >
                          <i className="fa fa-eye" />
                        </button>
                        <button
                          className="btn btn-icon btn-outline btn-sm"
                          onClick={() => toast('جارٍ استخراج الباركود...', 'info')}
                          title="QR Code"
                        >
                          <i className="fa fa-qrcode" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="تأكيد حذف المنتجات"
        width={460}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>إلغاء</button>
            <button className="btn btn-danger" onClick={handleDeleteConfirmed}>
              <i className="fa fa-trash" /> تأكيد الحذف
            </button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '8px 0 8px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <i className="fa fa-trash" style={{ fontSize: 26, color: 'var(--danger)' }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
            حذف {selectedIds.size} {selectedIds.size === 1 ? 'منتج' : 'منتجات'}؟
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
            سيتم حذف المنتجات المحددة نهائياً ولن يمكن التراجع عن هذا الإجراء.
          </div>
        </div>
      </Modal>

      {/* Add New Product Modal */}
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
