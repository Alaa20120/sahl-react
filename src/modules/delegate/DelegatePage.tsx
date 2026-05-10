import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import { useIsMobile } from '@/lib/useIsMobile'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import { fmt, fmtNum, fmtDate } from '@/lib/format'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/store/auth.store'
import { useDelegateStore } from '@/store/delegate.store'
import { useCustomerStore } from '@/store/customer.store'
import { useInventoryStore } from '@/store/inventory.store'
import { PRODUCTS } from '@/lib/mock-data/inventory'

const INV_STATUS: Record<string, { label: string; css: string }> = {
  paid:    { label: 'مدفوعة',  css: 'status-active' },
  pending: { label: 'معلقة',   css: 'status-pending' },
  overdue: { label: 'متأخرة',  css: 'status-inactive' },
}

export default function DelegatePage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAuthStore(s => s.user)
  const delegateId = user?.delegateId || ''
  const delegates = useDelegateStore(s => s.delegates)
  const delegate = useMemo(() => delegates.find(x => x.id === delegateId), [delegates, delegateId])
  const addInvoice = useDelegateStore(s => s.addInvoice)
  const confirmDelegateInvoice = useDelegateStore(s => s.confirmDelegateInvoice)
  const deductFromWarehouse = useDelegateStore(s => s.deductFromWarehouse)
  const addToWarehouse = useDelegateStore(s => s.addToWarehouse)

  const d = delegate || {
    id: delegateId,
    name: user?.name || 'المندوب',
    warehouse: [] as any[],
    invoices: [] as any[],
    stats: { totalSales: 0, totalPurchases: 0, balance: 0, externalCredit: 0, companyEntrusted: 0 },
  }

  const delegateInvoices = d.invoices
  const delegateWarehouse = d.warehouse

  const customers = useCustomerStore(s => s.customers)
  const addCustomer = useCustomerStore(s => s.addCustomer)
  const updateBalance = useCustomerStore(s => s.updateBalance)
  const deductFromInventory = useInventoryStore(s => s.deductFromInventory)

  const [tab, setTab] = useState<'overview' | 'invoices' | 'warehouse' | 'finance'>('overview')
  const [invFilter, setInvFilter] = useState<'all' | 'sale' | 'purchase'>('all')
  const [showNewInvoice, setShowNewInvoice] = useState(false)
  const [newInvType, setNewInvType] = useState<'sale' | 'purchase'>('sale')
  const [newParty, setNewParty] = useState('')
  const [newPartyId, setNewPartyId] = useState('')
  const [newPaymentMethod, setNewPaymentMethod] = useState<'cash' | 'credit'>('cash')
  const [newItems, setNewItems] = useState<{productId:string; desc:string; qty:string; price:string}[]>([])

  const [showPartyPicker, setShowPartyPicker] = useState(false)
  const [partySearch, setPartySearch] = useState('')
  const [showAddParty, setShowAddParty] = useState(false)
  const [newPartyName, setNewPartyName] = useState('')
  const [newPartyPhone, setNewPartyPhone] = useState('')

  const [activeItemIdx, setActiveItemIdx] = useState<number | null>(null)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  const filteredInvoices = delegateInvoices.filter((inv: any) => invFilter === 'all' || inv.type === invFilter)
  const totalSales = delegateInvoices.filter((i: any) => i.type === 'sale').reduce((s: number, i: any) => s + i.total, 0)
  const totalPurchases = delegateInvoices.filter((i: any) => i.type === 'purchase').reduce((s: number, i: any) => s + i.total, 0)
  const pendingCount = delegateInvoices.filter((i: any) => i.status === 'pending').length
  const whTotal = delegateWarehouse.reduce((s: number, w: any) => s + (w.qty * w.costPrice), 0)
  // الآجل الخارجي = فواتير بيع آجلة غير مدفوعة بالكامل
  const externalCredit = delegateInvoices
    .filter((i: any) => i.type === 'sale' && i.paymentMethod === 'credit' && i.status !== 'paid')
    .reduce((s: number, i: any) => s + (i.total - (i.paidAmount ?? 0)), 0)

  const parties = newInvType === 'sale'
    ? customers.filter((c: any) => c.type === 'customer' || c.type === 'both')
    : customers.filter((c: any) => c.type === 'supplier' || c.type === 'both')
  const filteredParties = partySearch.trim()
    ? parties.filter((p: any) => p.name.includes(partySearch) || p.phone.includes(partySearch))
    : parties

  // Available = sum of warehouse qty minus confirmed/paid sales
  const availableProducts = newInvType === 'sale'
    ? (() => {
        const grouped: Record<string, any> = {}
        delegateWarehouse.forEach((w: any) => {
          if (!w.productId || w.qty <= 0) return
          if (!grouped[w.productId]) {
            const catalogProduct = PRODUCTS.find((pr: any) => pr.id === w.productId)
            grouped[w.productId] = {
              id: w.productId,
              name: catalogProduct?.name || w.productName,
              sku: catalogProduct?.sku || w.productSku,
              category: catalogProduct?.category || '',
              sellPrice: catalogProduct?.sellPrice || w.costPrice,
              costPrice: w.costPrice,
              whQty: 0,
            }
          }
          grouped[w.productId].whQty += w.qty
        })
        // Deduct confirmed/paid sales
        delegateInvoices.filter((inv: any) => inv.type === 'sale' && (inv.status === 'confirmed' || inv.status === 'paid')).forEach((inv: any) => {
          (inv.items || []).forEach((it: any) => {
            if (it.productId && grouped[it.productId]) {
              grouped[it.productId].whQty -= (it.qty || 0)
            }
          })
        })
        return Object.values(grouped).filter((p: any) => p.whQty > 0)
      })()
    : PRODUCTS.map((p: any) => ({ ...p, whQty: undefined }))
  const filteredProducts = productSearch.trim()
    ? (availableProducts as any[]).filter((p: any) =>
        p.name.includes(productSearch) || (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())
      )
    : availableProducts

  function handleAddItem() {
    setNewItems([...newItems, { productId: '', desc: '', qty: '1', price: '' }])
  }

  function handleUpdateItem(idx: number, field: string, value: string | number) {
    setNewItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }

  function handleRemoveItem(idx: number) {
    setNewItems(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSelectProduct(idx: number, product: any) {
    const price = newInvType === 'sale' ? product.sellPrice : product.costPrice
    handleUpdateItem(idx, 'productId', product.id)
    handleUpdateItem(idx, 'desc', product.name)
    handleUpdateItem(idx, 'price', String(price))
    setShowProductPicker(false)
    setProductSearch('')
  }

  async function handleAddPartySubmit() {
    if (!newPartyName.trim()) { toast('أدخل الاسم', 'warn'); return }
    const vatEl = document.getElementById('delegate-party-vat') as HTMLInputElement | null
    const crEl = document.getElementById('delegate-party-cr') as HTMLInputElement | null
    const created = await addCustomer({
      name: newPartyName,
      type: newInvType === 'sale' ? 'customer' : 'supplier',
      phone: newPartyPhone || 'غير محدد',
      email: '',
      address: '',
      vatNumber: vatEl?.value.trim() || undefined,
      commercialReg: crEl?.value.trim() || undefined,
      balance: 0,
      status: 'active',
    })
    toast(`تم الإضافة — "${created.name}"`, 'success')
    setNewParty(created.name)
    setNewPartyId(created.id)
    setShowAddParty(false)
    setShowPartyPicker(false)
    setNewPartyName('')
    setNewPartyPhone('')
  }

  async function handleCreateInvoice() {
    if (!newParty.trim()) { toast('أدخل اسم الطرف', 'warn'); return }
    if (newItems.length === 0 || newItems.some(it => !it.productId || (parseFloat(it.qty) || 0) <= 0)) {
      toast('أكمل بيانات جميع الأصناف', 'warn'); return
    }

    // Prices are VAT-inclusive — extract 15% from total
    const total = newItems.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0)
    const tax = Math.round(total * 15 / 115 * 100) / 100
    const subtotal = Math.round((total - tax) * 100) / 100

    // For sales: invoice is pending until confirmed (warehouse deduction happens at confirmation)
    // For cash sales: treat as immediately confirmed (deduct warehouse now)
    const isCashSale = newInvType === 'sale' && newPaymentMethod === 'cash'

    if (isCashSale) {
      for (const item of newItems) {
        const ok = deductFromWarehouse(delegateId, item.productId, parseFloat(item.qty) || 0)
        if (!ok) { toast(`الكمية غير متوفرة في المستودع لـ "${item.desc}"`, 'danger'); return }
      }
      const catalogItems = newItems.filter(it => PRODUCTS.some((p: any) => p.id === it.productId))
      if (catalogItems.length > 0) deductFromInventory(catalogItems.map(it => ({ productId: it.productId, qty: parseFloat(it.qty) || 0 })))
    }

    const inv = await addInvoice(delegateId, {
      date: new Date().toISOString().slice(0, 10),
      type: newInvType,
      party: newParty,
      customerId: newPartyId || undefined,
      items: newItems.map(it => { const q = parseFloat(it.qty)||0; const p = parseFloat(it.price)||0; return { productId: it.productId, description: it.desc, qty: q, price: p, total: q*p } }),
      subtotal,
      tax,
      total,
      status: isCashSale ? 'confirmed' : 'pending',
      paymentMethod: newPaymentMethod,
      paidAmount: isCashSale ? total : 0,
      confirmedAt: isCashSale ? new Date().toISOString().slice(0, 10) : undefined,
    })

    // Credit invoice → customer owes us more → balance decreases
    if (newInvType === 'sale' && newPaymentMethod === 'credit' && newPartyId) {
      updateBalance(newPartyId, -total)
    }

    // Add purchased items to delegate warehouse
    if (newInvType === 'purchase') {
      for (const item of newItems) {
        const catalogProduct = PRODUCTS.find((p: any) => p.id === item.productId)
        addToWarehouse(delegateId, {
          productId: item.productId || `PROD-${Date.now()}`,
          productName: item.desc,
          productSku: catalogProduct?.sku || item.productId || '',
          qty: parseFloat(item.qty) || 0,
          costPrice: parseFloat(item.price) || 0,
          receivedDate: new Date().toISOString().slice(0, 10),
          source: 'purchased',
        })
      }
    }

    toast(`${newInvType === 'sale' ? 'فاتورة بيع' : 'فاتورة شراء'} ${inv.number} بقيمة ${fmt(total)} — تمت`, 'success')
    setShowNewInvoice(false)
    setNewParty('')
    setNewPartyId('')
    setNewPaymentMethod('cash')
    setNewItems([])
  }

  async function handleConfirmInvoice(invId: string) {
    const result = await confirmDelegateInvoice(delegateId, invId)
    if (!result.success) {
      toast(`تعذر التأكيد: "${result.failedItem}" — الكمية غير كافية`, 'danger')
      return
    }
    // Sync main inventory
    const inv = d.invoices.find((i: any) => i.id === invId)
    if (inv) {
      const catalogItems = (inv.items || []).filter((it: any) => it.productId && PRODUCTS.some((p: any) => p.id === it.productId))
      if (catalogItems.length > 0) deductFromInventory(catalogItems.map((it: any) => ({ productId: it.productId, qty: it.qty })))
    }
    toast('تم تأكيد التسليم وخصم المخزون', 'success')
  }

  return (
    <>
      <PageHeader
        title="بوابة المندوب"
        subtitle={`مرحباً، ${user?.name || 'المندوب'} — ${new Date().toLocaleDateString('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' })}`}
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => { setShowNewInvoice(true); setNewInvType('sale'); setNewParty(''); setNewPartyId(''); setNewPaymentMethod('cash'); setNewItems([]) }}>
            <i className="fa fa-plus" /> فاتورة جديدة
          </button>
        }
      />

      <div className="stats-grid mb-6">
        <StatCard label="مبيعاتي" value={fmt(totalSales)} badge="▲" badgeType="success" dark icon="fa-dollar-sign" />
        <StatCard label="مشترياتي" value={fmt(totalPurchases)} icon="fa-shopping-cart" iconColor="var(--blue)" />
        <StatCard label="الآجل الخارجي" value={fmt(externalCredit)} badge={externalCredit > 0 ? '!' : '✓'} badgeType={externalCredit > 0 ? 'warn' : 'success'} icon="fa-clock" iconColor="var(--warn)" />
        <StatCard label="فواتير معلقة" value={String(pendingCount)} badge={pendingCount > 0 ? '!' : '✓'} badgeType={pendingCount > 0 ? 'warn' : 'success'} icon="fa-clock" iconColor="var(--danger)" />
        <StatCard label="قيمة المستودع" value={fmt(whTotal)} icon="fa-warehouse" iconColor="var(--success)" />
      </div>

      <div className="tabs mb-4">
        {[
          { key: 'overview' as const, label: 'نظرة عامة', icon: 'fa-chart-pie' },
          { key: 'invoices' as const, label: 'فواتيري', icon: 'fa-file-invoice' },
          { key: 'warehouse' as const, label: 'مستودعي', icon: 'fa-warehouse' },
          { key: 'finance' as const, label: 'الحركة المالية', icon: 'fa-money-bill-transfer' },
        ].map(t => (
          <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            <i className={`fa ${t.icon}`} style={{ marginLeft: 6 }} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className={isMobile ? 'grid-1' : 'grid-2'}>
          <Card title="آخر الفواتير" action={<button className="btn btn-sm btn-outline" onClick={() => setTab('invoices')}>عرض الكل</button>}>
            {/* Desktop */}
            <div className="desktop-only">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>الرقم</th><th>النوع</th><th>الطرف</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                  <tbody>
                    {delegateInvoices.slice(0, 5).map((inv: any) => {
                      const st = INV_STATUS[inv.status] || { label: inv.status, css: '' }
                      return (
                        <tr key={inv.id}>
                          <td><button onClick={() => navigate(`/delegate/invoices/${inv.id}`)} style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>{inv.number}</button></td>
                          <td><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: inv.type === 'sale' ? 'var(--success-bg)' : 'var(--blue-light)', color: inv.type === 'sale' ? 'var(--success)' : 'var(--blue)' }}>{inv.type === 'sale' ? 'بيع' : 'شراء'}</span></td>
                          <td style={{ fontWeight: 600, fontSize: 13 }}>{inv.party}</td>
                          <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                          <td><span className={`status ${st.css}`}>{st.label}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Mobile */}
            <div className="mobile-card-list">
              {delegateInvoices.slice(0, 5).map((inv: any) => {
                const st = INV_STATUS[inv.status] || { label: inv.status, css: '' }
                return (
                  <div key={inv.id} className="mobile-card" onClick={() => navigate(`/delegate/invoices/${inv.id}`)}>
                    <div className="mobile-card-row">
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--blue)' }}>{inv.number}</span>
                      <span className={`status ${st.css}`}>{st.label}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{inv.party}</span>
                      <span className="mobile-card-value">{fmt(inv.total)}</span>
                    </div>
                  </div>
                )
              })}
              {delegateInvoices.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد فواتير</div>}
            </div>
          </Card>
          <Card title="مستودعي" action={<button className="btn btn-sm btn-outline" onClick={() => setTab('warehouse')}>عرض الكل</button>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {delegateWarehouse.slice(0, 5).map((w: any, i: number) => (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < delegateWarehouse.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa fa-box" style={{ fontSize: 12, color: 'var(--primary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{w.productName}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{w.productSku}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{fmtNum(w.qty)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>قطعة</div>
                  </div>
                </div>
              ))}
              {delegateWarehouse.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>المستودع فارغ</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === 'invoices' && (
        <>
          <div className="card mb-4">
            <div className="card-body" style={{ padding: '14px 20px' }}>
              <div className="filter-bar" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ key: 'all' as const, label: 'الكل' }, { key: 'sale' as const, label: 'مبيعات' }, { key: 'purchase' as const, label: 'مشتريات' }].map(f => (
                    <button key={f.key} className={`btn btn-sm ${invFilter === f.key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setInvFilter(f.key)}>{f.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Card title="فواتيري">
            {/* Desktop */}
            <div className="desktop-only">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>الرقم</th><th>التاريخ</th><th>النوع</th><th>الطرف</th><th>الإجمالي</th><th>الحالة</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {filteredInvoices.map((inv: any) => {
                      const st = INV_STATUS[inv.status] || { label: inv.status, css: '' }
                      return (
                        <tr key={inv.id}>
                          <td><button onClick={() => navigate(`/delegate/invoices/${inv.id}`)} style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>{inv.number}</button></td>
                          <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(inv.date)}</td>
                          <td><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: inv.type === 'sale' ? 'var(--success-bg)' : 'var(--blue-light)', color: inv.type === 'sale' ? 'var(--success)' : 'var(--blue)' }}>{inv.type === 'sale' ? 'بيع' : 'شراء'}</span></td>
                          <td style={{ fontWeight: 600, fontSize: 13 }}>{inv.party}</td>
                          <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                          <td><span className={`status ${st.css}`}>{st.label}</span></td>
                          <td>{inv.status === 'pending' && <button className="btn btn-sm btn-primary" onClick={() => handleConfirmInvoice(inv.id)}><i className="fa fa-check" /> تأكيد</button>}</td>
                        </tr>
                      )
                    })}
                    {filteredInvoices.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد فواتير</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Mobile */}
            <div className="mobile-card-list">
              {filteredInvoices.map((inv: any) => {
                const st = INV_STATUS[inv.status] || { label: inv.status, css: '' }
                return (
                  <div key={inv.id} className="mobile-card">
                    <div className="mobile-card-row">
                      <button onClick={() => navigate(`/delegate/invoices/${inv.id}`)} style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13 }}>{inv.number}</button>
                      <span className={`status ${st.css}`}>{st.label}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{inv.party}</span>
                      <span className="mobile-card-value">{fmt(inv.total)}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDate(inv.date)}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: inv.type === 'sale' ? 'var(--success-bg)' : 'var(--blue-light)', color: inv.type === 'sale' ? 'var(--success)' : 'var(--blue)' }}>{inv.type === 'sale' ? 'بيع' : 'شراء'}</span>
                    </div>
                    {inv.status === 'pending' && (
                      <button className="btn btn-sm btn-primary w-full" style={{ marginTop: 8, justifyContent: 'center' }} onClick={() => handleConfirmInvoice(inv.id)}>
                        <i className="fa fa-check" /> تأكيد التسليم
                      </button>
                    )}
                  </div>
                )
              })}
              {filteredInvoices.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد فواتير</div>}
            </div>
          </Card>
        </>
      )}

      {tab === 'warehouse' && (() => {
        // Aggregate warehouse: total received per product
        const receivedByProduct: Record<string, { name: string; sku: string; cost: number; total: number }> = {}
        delegateWarehouse.forEach((w: any) => {
          const key = w.productId || w.productName
          if (!receivedByProduct[key]) receivedByProduct[key] = { name: w.productName, sku: w.productSku || '', cost: w.costPrice, total: 0 }
          receivedByProduct[key].total += w.qty
        })
        // Sold quantities from confirmed/paid sale invoices
        const soldByProduct: Record<string, number> = {}
        delegateInvoices.filter((inv: any) => inv.type === 'sale' && (inv.status === 'confirmed' || inv.status === 'paid')).forEach((inv: any) => {
          (inv.items || []).forEach((it: any) => {
            if (it.productId) soldByProduct[it.productId] = (soldByProduct[it.productId] || 0) + (it.qty || 0)
          })
        })
        const rows = Object.entries(receivedByProduct).map(([key, data]) => ({
          key, ...data,
          sold: soldByProduct[key] || 0,
          available: Math.max(0, data.total - (soldByProduct[key] || 0)),
        }))

        return (
          <Card title="مستودعي">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الصنف</th>
                    <th style={{ textAlign: 'center' }}>المستلم</th>
                    <th style={{ textAlign: 'center', color: 'var(--danger)' }}>المباع</th>
                    <th style={{ textAlign: 'center', color: 'var(--success)' }}>المتوفر</th>
                    <th>سعر التكلفة</th>
                    <th>قيمة المتوفر</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.key}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{fmtNum(r.total)}</td>
                      <td style={{ textAlign: 'center', color: 'var(--danger)', fontWeight: 700 }}>{r.sold > 0 ? fmtNum(r.sold) : '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: r.available === 0 ? 'var(--danger)' : 'var(--success)' }}>{fmtNum(r.available)}</td>
                      <td>{fmt(r.cost)}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(r.available * r.cost)}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>المستودع فارغ</td></tr>}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg)', fontWeight: 800 }}>
                    <td>الإجمالي</td>
                    <td style={{ textAlign: 'center' }}>{fmtNum(rows.reduce((s, r) => s + r.total, 0))}</td>
                    <td style={{ textAlign: 'center', color: 'var(--danger)' }}>{fmtNum(rows.reduce((s, r) => s + r.sold, 0))}</td>
                    <td style={{ textAlign: 'center', color: 'var(--success)' }}>{fmtNum(rows.reduce((s, r) => s + r.available, 0))}</td>
                    <td></td>
                    <td>{fmt(rows.reduce((s, r) => s + r.available * r.cost, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )
      })()}

      {/* Finance Tab */}
      {tab === 'finance' && (() => {
        const totalSales = delegateInvoices.filter((i: any) => i.type === 'sale').reduce((s: number, i: any) => s + i.total, 0)
        const totalPurchases = delegateInvoices.filter((i: any) => i.type === 'purchase').reduce((s: number, i: any) => s + i.total, 0)
        const totalPaid = delegateInvoices.filter((i: any) => i.type === 'sale').reduce((s: number, i: any) => s + (i.paidAmount ?? (i.status === 'paid' ? i.total : 0)), 0)
        const custody = totalSales - totalPurchases
        const netBalance = d.stats?.balance ?? 0
        const transactions: any[] = (d as any).transactions ?? []
        return (
          <>
            {/* العهدة المالية */}
            <div className="stats-grid mb-6">
              <div className="stat-card dark">
                <div className="stat-label">العهدة المالية</div>
                <div className="stat-value">{fmt(custody)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>صافي المبيعات - المشتريات</div>
              </div>
              <div className="stat-card" style={{ borderRight: '4px solid var(--success)' }}>
                <div className="stat-label">إجمالي المحصّل</div>
                <div className="stat-value">{fmt(totalPaid)}</div>
              </div>
              <div className="stat-card" style={{ borderRight: '4px solid var(--warn)' }}>
                <div className="stat-label">الذمم المعلقة</div>
                <div className="stat-value">{fmt(totalSales - totalPaid)}</div>
              </div>
              <div className="stat-card" style={{ borderRight: '4px solid var(--blue)' }}>
                <div className="stat-label">الرصيد الحالي</div>
                <div className="stat-value">{fmt(netBalance)}</div>
              </div>
            </div>

            <div className={isMobile ? 'grid-1' : 'grid-2'}>
              {/* Custody breakdown */}
              <Card title="تحليل العهدة المالية">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>
                  {[
                    { label: 'إجمالي المبيعات', value: totalSales, color: 'var(--success)', icon: 'fa-arrow-up' },
                    { label: 'إجمالي المشتريات', value: totalPurchases, color: 'var(--danger)', icon: 'fa-arrow-down' },
                    { label: 'صافي العهدة', value: custody, color: custody >= 0 ? 'var(--primary)' : 'var(--danger)', icon: 'fa-balance-scale', bold: true },
                    { label: 'بضاعة الشركة (تكلفة)', value: d.stats?.companyEntrusted ?? 0, color: 'var(--blue)', icon: 'fa-box' },
                    { label: 'الذمم غير المحصلة', value: d.stats?.externalCredit ?? 0, color: 'var(--warn)', icon: 'fa-clock' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: 'var(--bg)', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                        <i className={`fa ${r.icon}`} style={{ marginLeft: 8, color: r.color }} />{r.label}
                      </span>
                      <span style={{ fontWeight: r.bold ? 900 : 700, fontSize: r.bold ? 15 : 13, color: r.color }}>{fmt(r.value)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Transaction list */}
              <Card title={`سجل الحركات (${transactions.length})`}>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {transactions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 13 }}>لا توجد حركات مالية</div>
                  )}
                  {transactions.map((tx: any) => {
                    const typeMap: Record<string, { label: string; color: string; icon: string }> = {
                      collection: { label: 'تحصيل', color: 'var(--success)', icon: 'fa-arrow-down' },
                      withdrawal: { label: 'سحب', color: 'var(--danger)', icon: 'fa-arrow-up' },
                      expense: { label: 'مصروف', color: 'var(--warn)', icon: 'fa-receipt' },
                      remittance: { label: 'توريد', color: 'var(--blue)', icon: 'fa-money-bill-transfer' },
                      commission: { label: 'عمولة', color: 'var(--primary)', icon: 'fa-percentage' },
                    }
                    const t = typeMap[tx.type] ?? { label: tx.type, color: 'var(--muted)', icon: 'fa-circle' }
                    return (
                      <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`fa ${t.icon}`} style={{ color: t.color, fontSize: 12 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.description}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{tx.date} · {t.label}</div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 800, fontSize: 13, color: tx.amount >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>رصيد: {fmt(tx.balanceAfter)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          </>
        )
      })()}

      {/* New Invoice Modal */}
      {showNewInvoice && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', padding: 0 }}
          className="modal-overlay-mobile">
          <div style={{ background: 'var(--card)', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 700, maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,.2)', border: '1px solid var(--border)' }}
            className="modal-sheet-mobile">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>فاتورة جديدة</div>
              <button className="btn btn-sm btn-outline" onClick={() => setShowNewInvoice(false)}><i className="fa fa-times" /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['sale', 'purchase'] as const).map(t => (
                  <button key={t} onClick={() => { setNewInvType(t); setNewParty(''); setNewItems([]) }}
                    className={`btn btn-sm ${newInvType === t ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>
                    <i className={`fa ${t === 'sale' ? 'fa-arrow-up' : 'fa-arrow-down'}`} />
                    {t === 'sale' ? 'فاتورة بيع' : 'فاتورة شراء'}
                  </button>
                ))}
              </div>

              {/* Party picker */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">{newInvType === 'sale' ? 'العميل' : 'المورد'}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-control" placeholder={newInvType === 'sale' ? 'اختر العميل...' : 'اختر المورد...'} value={newParty} readOnly style={{ flex: 1, background: newParty ? 'var(--success-bg)' : undefined }} />
                  <button className="btn btn-outline btn-sm" onClick={() => { setShowPartyPicker(true); setPartySearch(''); setShowAddParty(false) }}>
                    <i className="fa fa-search" /> {newInvType === 'sale' ? 'العملاء' : 'الموردين'}
                  </button>
                </div>
              </div>

              {/* Payment method — only for sales */}
              {newInvType === 'sale' && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button type="button" onClick={() => setNewPaymentMethod('cash')}
                    className={`btn btn-sm ${newPaymentMethod === 'cash' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>
                    <i className="fa fa-money-bill-wave" /> نقدي — مدفوع فوراً
                  </button>
                  <button type="button" onClick={() => setNewPaymentMethod('credit')}
                    className={`btn btn-sm ${newPaymentMethod === 'credit' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>
                    <i className="fa fa-clock" /> آجل — مؤجل الدفع
                  </button>
                </div>
              )}

              {/* Items */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label className="form-label" style={{ margin: 0 }}>الأصناف</label>
                  <button className="btn btn-sm btn-outline" onClick={handleAddItem}><i className="fa fa-plus" /> إضافة صنف</button>
                </div>
                {newItems.map((it, idx) => (
                  <div key={idx} style={{ marginBottom: 10, padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <input className="form-control" value={it.desc} placeholder="اضغط لاختيار المنتج..." readOnly onClick={() => { setActiveItemIdx(idx); setProductSearch(''); setShowProductPicker(true) }} style={{ cursor: 'pointer', paddingLeft: 36 }} />
                      <i className="fa fa-box" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 3 }}>الكمية</label>
                        <input className="form-control" type="text" inputMode="decimal" value={it.qty} onChange={e => handleUpdateItem(idx, 'qty', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="الكمية" />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 3 }}>السعر</label>
                        <input className="form-control" type="text" inputMode="decimal" value={it.price} onChange={e => handleUpdateItem(idx, 'price', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="السعر" />
                      </div>
                      <button className="btn btn-sm btn-outline" style={{ marginTop: 18, padding: '8px 12px' }} onClick={() => handleRemoveItem(idx)}><i className="fa fa-trash" style={{ color: 'var(--danger)' }} /></button>
                    </div>
                  </div>
                ))}
                {newItems.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 16, color: 'var(--muted)', fontSize: 13 }}>اضغط "إضافة صنف" لاختيار منتج</div>
                )}
              </div>

              {/* Totals - VAT inclusive */}
              {(() => {
                const _total = newItems.reduce((s, it) => s + (parseFloat(it.qty)||0) * (parseFloat(it.price)||0), 0)
                const _tax = Math.round(_total * 15 / 115 * 100) / 100
                const _net = Math.round((_total - _tax) * 100) / 100
                return (
                  <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--muted)' }}>الإجمالي شامل الضريبة</span>
                      <span style={{ fontWeight: 700 }}>{fmt(_total)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--muted)' }}>ضريبة القيمة المضافة المستخرجة (15%)</span>
                      <span style={{ fontWeight: 700, color: 'var(--warn)' }}>- {fmt(_tax)}</span>
                    </div>
                    <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                      <span>صافي قبل الضريبة</span>
                      <span style={{ color: 'var(--primary)' }}>{fmt(_net)}</span>
                    </div>
                  </div>
                )
              })()}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateInvoice}>
                  <i className="fa fa-save" /> حفظ الفاتورة
                </button>
                <button className="btn btn-outline" onClick={() => setShowNewInvoice(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Party Picker Modal */}
      {showPartyPicker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', padding: 20 }}>
          <div style={{ background: 'var(--card)', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.2)', border: '1px solid var(--border)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{newInvType === 'sale' ? 'اختيار العميل' : 'اختيار المورد'}</div>
              <button className="btn btn-sm btn-outline" onClick={() => setShowPartyPicker(false)}><i className="fa fa-times" /></button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input className="form-control" placeholder={newInvType === 'sale' ? 'ابحث عن عميل...' : 'ابحث عن مورد...'} value={partySearch} onChange={e => setPartySearch(e.target.value)} style={{ paddingLeft: 36 }} />
                  <i className="fa fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddParty(true)}><i className="fa fa-plus" /> {newInvType === 'sale' ? 'عميل جديد' : 'مورد جديد'}</button>
              </div>

              {showAddParty && (
                <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{newInvType === 'sale' ? 'عميل جديد' : 'مورد جديد'}</div>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <input className="form-control" placeholder="الاسم *" value={newPartyName} onChange={e => setNewPartyName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <input className="form-control" placeholder="رقم الهاتف *" value={newPartyPhone} onChange={e => setNewPartyPhone(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <input className="form-control" placeholder="الرقم الضريبي (اختياري)" id="delegate-party-vat" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <input className="form-control" placeholder="السجل التجاري (اختياري)" id="delegate-party-cr" />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleAddPartySubmit}><i className="fa fa-save" /> حفظ</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowAddParty(false)}>إلغاء</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {filteredParties.length === 0 && !showAddParty && (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا يوجد نتائج</div>
                )}
                {filteredParties.map((p: any) => (
                  <button key={p.id} type="button"
                    onClick={() => { setNewParty(p.name); setNewPartyId(p.id); setShowPartyPicker(false) }}
                    style={{ width: '100%', textAlign: 'right', background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', fontWeight: 800, fontSize: 12 }}>{p.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.phone} · {p.address || 'لا يوجد عنوان'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Picker Modal */}
      {showProductPicker && activeItemIdx !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', padding: 20 }}>
          <div style={{ background: 'var(--card)', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.2)', border: '1px solid var(--border)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{newInvType === 'sale' ? 'اختيار من المستودع' : 'اختيار المنتج'}</div>
              <button className="btn btn-sm btn-outline" onClick={() => setShowProductPicker(false)}><i className="fa fa-times" /></button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <input className="form-control" placeholder="ابحث عن منتج..." value={productSearch} onChange={e => setProductSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                <i className="fa fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {filteredProducts.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا يوجد منتجات مطابقة</div>
                )}
                {filteredProducts.map((p: any) => (
                  <button key={p.id} type="button"
                    onClick={() => handleSelectProduct(activeItemIdx, p)}
                    style={{ width: '100%', textAlign: 'right', background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa fa-box" style={{ fontSize: 14, color: 'var(--primary)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.sku} · {p.category}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--success)' }}>{fmt(newInvType === 'sale' ? p.sellPrice : p.costPrice)}</div>
                      {newInvType === 'sale' && p.whQty !== undefined && (
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>متوفر: {p.whQty}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
