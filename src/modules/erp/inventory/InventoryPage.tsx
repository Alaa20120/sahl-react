import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { fmt, fmtNum } from '@/lib/format'
import { hasPendingWithdrawals } from '@/lib/mock-data/inventory'
import { useInventoryStore } from '@/store/inventory.store'
import { useDelegateStore } from '@/store/delegate.store'
import { useInvoiceStore } from '@/store/invoice.store'
import { useCategoryStore } from '@/store/category.store'
import { exportExcel } from '@/lib/excel'
import { toast } from '@/lib/toast'
import { useSaving } from '@/lib/useSaving'

const BLANK_PRODUCT = { name: '', category: '', unit: 'قطعة', costPrice: '', sellPrice: '', stock: '0', minStock: '10' }

export default function InventoryPage() {
  const navigate = useNavigate()
  const { products, deleteProducts, addProduct } = useInventoryStore()
  const { delegates, getAggregatedWarehouse } = useDelegateStore()
  const { invoices } = useInvoiceStore()
  const { categories, addCategory } = useCategoryStore()
  const { saving, run } = useSaving()
  const saveCat = useSaving()
  const [showProfitability, setShowProfitability] = useState(false)
  const [newForm, setNewForm] = useState(BLANK_PRODUCT)
  const [saveError, setSaveError] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [catError, setCatError] = useState('')

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
  const [adjustProduct, setAdjustProduct] = useState<{id: string; name: string; stock: number} | null>(null)
  const [adjustQty, setAdjustQty] = useState('')
  const adjustSaving = useSaving()

  // Withdraw from delegate warehouse
  const [showWithdrawDlg, setShowWithdrawDlg] = useState(false)
  const [withdrawDelegateId, setWithdrawDelegateId] = useState('')
  const [withdrawProductId, setWithdrawProductId] = useState('')
  const [withdrawQtyInput, setWithdrawQtyInput] = useState('')
  const transferToMainWarehouse = useDelegateStore(s => s.transferToMainWarehouse)

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
    run(async () => {
      await deleteProducts(Array.from(selectedIds))
      setSelectedIds(new Set())
      setShowDeleteConfirm(false)
      toast(`تم حذف ${count} ${count === 1 ? 'منتج' : 'منتجات'} بنجاح`, 'success')
    }).catch((err: any) => toast(`خطأ في الحذف: ${err?.message || 'حاول مرة أخرى'}`, 'danger'))
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
            <button className="btn btn-outline btn-sm" onClick={() => { setShowNewCat(true); setNewCatName(''); setCatError('') }}>
              <i className="fa fa-tag" /> فئة جديدة
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => { setShowWithdrawDlg(true); setWithdrawDelegateId(''); setWithdrawProductId(''); setWithdrawQtyInput('') }}>
              <i className="fa fa-warehouse" /> سحب من مندوب
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
              <i className="fa fa-plus" /> صنف جديد
            </button>
          </>
        }
      />

      <div className="stats-grid mb-6">
        <StatCard label="إجمالي الأصناف" value={fmtNum(products.length)} dark icon="fa-box" />
        <StatCard label="قيمة المخزون" value={fmt(totalValue)} icon="fa-coins" iconColor="var(--success)" />
        <StatCard label="أصناف منخفضة" value={String(lowStock.length)} badge="تنبيه" badgeType="danger" icon="fa-exclamation-triangle" iconColor="var(--danger)" />
        <StatCard label="أصناف نشطة" value={String(products.filter(p => p.status === 'active').length)} badge="نشط" badgeType="success" icon="fa-check-circle" iconColor="var(--success)" />
      </div>

      {showProfitability && (
        <div className="card mb-6">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}><i className="fa fa-chart-bar" style={{ marginLeft: 8, color: 'var(--primary)' }} />ربحية المنتجات — مقارنة تكلفة الشراء بإيرادات البيع</span>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4, WebkitOverflowScrolling: 'touch' as any }}>
            {lowStock.map(p => (
              <span key={p.id} style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, whiteSpace: 'nowrap' }}>
                {p.name}
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>({p.stock}/{p.minStock})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body" style={{ padding: '14px 20px' }}>
          {/* Search box */}
          <div className="search-box" style={{ marginBottom: 12 }}>
            <i className="fa fa-search icon" />
            <input placeholder="ابحث بالاسم أو الكود..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Category buttons — horizontal scroll */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4, WebkitOverflowScrolling: 'touch' as any }}>
            {['الكل', ...categories].map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-outline'}`}
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div style={{ padding: '11px 20px', background: 'var(--pending-bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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
                <th className="hidden-mobile">الكود</th>
                <th>الصنف</th>
                <th>الفئة</th>
                <th className="hidden-mobile">الوحدة</th>
                <th>سعر الشراء</th>
                <th>سعر البيع</th>
                <th>المخزون</th>
                <th className="hidden-mobile">الحد الأدنى</th>
                <th>القيمة</th>
                <th className="hidden-mobile">الحالة</th>
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
                    <td className="hidden-mobile" style={{ fontFamily: 'monospace', color: 'var(--muted)', fontSize: 12 }}>{p.sku}</td>
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
                    <td className="hidden-mobile" style={{ color: 'var(--muted)' }}>{p.unit}</td>
                    <td>{fmt(p.costPrice)}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(p.sellPrice)}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--success)' }}>
                        {fmtNum(p.stock)}
                        {isLow && <i className="fa fa-exclamation-circle" style={{ marginRight: 4, fontSize: 11 }} />}
                      </span>
                    </td>
                    <td className="hidden-mobile" style={{ color: 'var(--muted)' }}>{fmtNum(p.minStock)}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(p.stock * p.costPrice)}</td>
                    <td className="hidden-mobile">
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
                          onClick={() => { setAdjustProduct({ id: p.id, name: p.name, stock: p.stock }); setAdjustQty(String(p.stock)) }}
                          title="تصحيح الكمية"
                          style={{ color: 'var(--warn)' }}
                        >
                          <i className="fa fa-sliders" />
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
        onClose={() => { setShowNew(false); setNewForm(BLANK_PRODUCT); setSaveError('') }}
        title="إضافة صنف جديد"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setShowNew(false); setNewForm(BLANK_PRODUCT); setSaveError('') }}>إلغاء</button>
            <button className="btn btn-primary" disabled={saving} onClick={() => {
              if (!newForm.name.trim()) { setSaveError('أدخل اسم الصنف'); return }
              if (!newForm.costPrice || !newForm.sellPrice) { setSaveError('أدخل أسعار الشراء والبيع'); return }
              setSaveError('')
              run(async () => {
                const sku = `SKU-${Date.now()}`
                await addProduct({
                  id: crypto.randomUUID(),
                  sku,
                  name: newForm.name.trim(),
                  category: newForm.category || categories[0] || 'عام',
                  unit: newForm.unit,
                  costPrice: parseFloat(newForm.costPrice) || 0,
                  sellPrice: parseFloat(newForm.sellPrice) || 0,
                  stock: parseInt(newForm.stock) || 0,
                  minStock: parseInt(newForm.minStock) || 0,
                  status: 'active',
                })
                toast(`تم إضافة "${newForm.name}" بنجاح`, 'success')
                setShowNew(false)
                setNewForm(BLANK_PRODUCT)
              }).catch((err: any) => setSaveError(err?.message || 'فشل الحفظ'))
            }}>
              {saving ? <><i className="fa fa-spinner fa-spin" /> جارٍ الحفظ...</> : <><i className="fa fa-save" /> حفظ</>}
            </button>
          </>
        }
      >
        <div className="form-grid-2">
          <div className="form-group col-span-2">
            <label className="form-label">اسم الصنف *</label>
            <input className="form-control" placeholder="اسم الصنف أو المنتج" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">الفئة</label>
            <select className="form-control" value={newForm.category} onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">الوحدة</label>
            <select className="form-control" value={newForm.unit} onChange={e => setNewForm(f => ({ ...f, unit: e.target.value }))}>
              {['قطعة','كيلو','لتر','كرتون','متر','طن'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">سعر الشراء *</label>
            <input className="form-control" type="number" placeholder="0.00" value={newForm.costPrice} onChange={e => setNewForm(f => ({ ...f, costPrice: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">سعر البيع *</label>
            <input className="form-control" type="number" placeholder="0.00" value={newForm.sellPrice} onChange={e => setNewForm(f => ({ ...f, sellPrice: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">الكمية المبدئية</label>
            <input className="form-control" type="number" placeholder="0" value={newForm.stock} onChange={e => setNewForm(f => ({ ...f, stock: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">الحد الأدنى</label>
            <input className="form-control" type="number" placeholder="10" value={newForm.minStock} onChange={e => setNewForm(f => ({ ...f, minStock: e.target.value }))} />
          </div>
        </div>
        {saveError && (
          <div style={{ marginTop: 12, background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--danger)' }}>
            <i className="fa fa-exclamation-circle" style={{ marginLeft: 6 }} />{saveError}
          </div>
        )}
      </Modal>
      {/* Stock Adjustment Modal */}
      <Modal
        open={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        title={`تصحيح كمية: ${adjustProduct?.name}`}
        width={380}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setAdjustProduct(null)}>إلغاء</button>
            <button className="btn btn-primary" disabled={adjustSaving.saving} onClick={() => {
              const newStock = parseInt(adjustQty)
              if (isNaN(newStock) || newStock < 0) { toast('أدخل كمية صحيحة', 'warn'); return }
              adjustSaving.run(async () => {
                const { updateProduct } = useInventoryStore.getState()
                await updateProduct(adjustProduct!.id, { stock: newStock })
                toast(`تم تصحيح كمية "${adjustProduct!.name}" إلى ${newStock}`, 'success')
                setAdjustProduct(null)
              }).catch((e: any) => toast(`خطأ: ${e?.message}`, 'danger'))
            }}>
              {adjustSaving.saving ? <><i className="fa fa-spinner fa-spin" /> جارٍ الحفظ...</> : <><i className="fa fa-check" /> تصحيح</>}
            </button>
          </>
        }
      >
        <div style={{ marginBottom: 12, background: 'var(--warn-bg)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--warn)' }}>
          <i className="fa fa-triangle-exclamation" style={{ marginLeft: 6 }} />
          الكمية الحالية: <strong>{adjustProduct?.stock}</strong> — أدخل الكمية الصحيحة
        </div>
        <div className="form-group">
          <label className="form-label">الكمية الصحيحة</label>
          <input
            className="form-control"
            type="number"
            min="0"
            value={adjustQty}
            onChange={e => setAdjustQty(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>

      {/* Add New Category Modal */}
      <Modal
        open={showNewCat}
        onClose={() => setShowNewCat(false)}
        title="إضافة فئة جديدة"
        width={400}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowNewCat(false)}>إلغاء</button>
            <button className="btn btn-primary" disabled={saveCat.saving} onClick={() => {
              if (!newCatName.trim()) { setCatError('أدخل اسم الفئة'); return }
              if (categories.includes(newCatName.trim())) { setCatError('هذه الفئة موجودة مسبقاً'); return }
              setCatError('')
              saveCat.run(async () => {
                await addCategory(newCatName.trim())
                toast(`تم إضافة فئة "${newCatName.trim()}"`, 'success')
                setShowNewCat(false)
                setNewCatName('')
              }).catch((err: any) => setCatError(err?.message || 'فشل الحفظ'))
            }}>
              {saveCat.saving ? <><i className="fa fa-spinner fa-spin" /> جارٍ الحفظ...</> : <><i className="fa fa-tag" /> إضافة الفئة</>}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">اسم الفئة *</label>
          <input
            className="form-control"
            placeholder="مثال: إلكترونيات، أغذية، مواد خام..."
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.querySelector<HTMLButtonElement>('[data-save-cat]')?.click()}
            autoFocus
          />
        </div>
        {catError && (
          <div style={{ marginTop: 10, background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--danger)' }}>
            <i className="fa fa-exclamation-circle" style={{ marginLeft: 6 }} />{catError}
          </div>
        )}
        {categories.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>الفئات الحالية:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {categories.map(c => (
                <span key={c} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 12px', fontSize: 12, color: 'var(--text-2)' }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Withdraw from Delegate Warehouse Modal */}
      <Modal
        open={showWithdrawDlg}
        onClose={() => { setShowWithdrawDlg(false); setWithdrawDelegateId(''); setWithdrawProductId(''); setWithdrawQtyInput('') }}
        title="سحب صنف من مستودع مندوب"
        width={480}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setShowWithdrawDlg(false); setWithdrawDelegateId(''); setWithdrawProductId(''); setWithdrawQtyInput('') }}>إلغاء</button>
            <button className="btn btn-primary" disabled={!withdrawDelegateId || !withdrawProductId || !withdrawQtyInput} onClick={async () => {
              const qty = parseInt(withdrawQtyInput)
              if (isNaN(qty) || qty <= 0) { toast('أدخل كمية صحيحة', 'warn'); return }
              const agg = getAggregatedWarehouse(withdrawDelegateId)
              const item = agg.find(a => a.productId === withdrawProductId)
              if (!item) { toast('الصنف غير موجود', 'warn'); return }
              if (qty > item.available) { toast('الكمية المطلوبة أكبر من المتاح', 'warn'); return }
              await transferToMainWarehouse(withdrawDelegateId, withdrawProductId, qty)
              toast(`تم سحب ${qty} ${item.productName} وإضافته للمخزن الرئيسي`, 'success')
              setShowWithdrawDlg(false)
              setWithdrawDelegateId('')
              setWithdrawProductId('')
              setWithdrawQtyInput('')
            }}>
              <i className="fa fa-check" /> تأكيد السحب
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">المندوب</label>
            <select className="form-control" value={withdrawDelegateId} onChange={e => { setWithdrawDelegateId(e.target.value); setWithdrawProductId(''); setWithdrawQtyInput('') }}>
              <option value="">اختر مندوب...</option>
              {delegates.filter(d => d.warehouse.length > 0).map(d => (
                <option key={d.id} value={d.id}>{d.name} ({getAggregatedWarehouse(d.id).length} صنف)</option>
              ))}
            </select>
          </div>
          {withdrawDelegateId && (
            <div className="form-group">
              <label className="form-label">الصنف</label>
              <select className="form-control" value={withdrawProductId} onChange={e => { setWithdrawProductId(e.target.value); setWithdrawQtyInput('') }}>
                <option value="">اختر صنف...</option>
                {getAggregatedWarehouse(withdrawDelegateId).map(a => (
                  <option key={a.productId} value={a.productId}>{a.productName} — وارد: {a.received} | مباع: {a.sold} | متاح: {a.available} {a.productSku ? `(${a.productSku})` : ''}</option>
                ))}
              </select>
            </div>
          )}
          {withdrawProductId && (
            <div className="form-group">
              <label className="form-label">الكمية المراد سحبها</label>
              <input className="form-control" type="number" min="1" value={withdrawQtyInput} onChange={e => setWithdrawQtyInput(e.target.value)} placeholder="أدخل الكمية..." />
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
