import { useState, useMemo, useRef, useEffect } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt } from '@/lib/format'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/store/auth.store'
import { useDelegateStore } from '@/store/delegate.store'
import { useCustomerStore } from '@/store/customer.store'
import { useInventoryStore } from '@/store/inventory.store'
import { PRODUCTS } from '@/lib/mock-data/inventory'

interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  qty: number
  isInMainCatalog: boolean
}

export default function DelegatePOSPage() {
  const user = useAuthStore(s => s.user)
  const delegateId = user?.delegateId || ''
  const delegates = useDelegateStore(s => s.delegates)
  const delegate = useMemo(() => delegates.find(x => x.id === delegateId), [delegates, delegateId])
  const addInvoice = useDelegateStore(s => s.addInvoice)
  const deductFromWarehouse = useDelegateStore(s => s.deductFromWarehouse)

  const d = delegate || {
    id: delegateId,
    warehouse: [] as any[],
    stats: { totalSales: 0, totalPurchases: 0, balance: 0, externalCredit: 0, companyEntrusted: 0 },
  }
  const delegateWarehouse = d.warehouse

  const customers = useCustomerStore(s => s.customers)
  const addCustomer = useCustomerStore(s => s.addCustomer)
  const updateBalance = useCustomerStore(s => s.updateBalance)
  const deductFromInventory = useInventoryStore(s => s.deductFromInventory)

  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash')
  const searchRef = useRef<HTMLDivElement>(null)

  // Customer picker
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')

  const customerList = customers.filter((c: any) => c.type === 'customer' || c.type === 'both')
  const filteredCustomers = customerSearch.trim()
    ? customerList.filter((c: any) => c.name.includes(customerSearch) || c.phone.includes(customerSearch))
    : customerList

  // Products from delegate warehouse — works even for items not in main catalog
  const warehouseProducts = useMemo(() =>
    delegateWarehouse
      .filter((w: any) => w.status === 'in-stock' && w.qty > 0)
      .map((w: any) => {
        const catalog = PRODUCTS.find((pr: any) => pr.id === w.productId)
        return {
          id: w.productId,
          name: catalog?.name || w.productName,
          sku: catalog?.sku || w.productSku,
          category: catalog?.category || 'أخرى',
          sellPrice: catalog?.sellPrice ?? Math.round(w.costPrice * 1.3),
          whQty: w.qty,
          isInMainCatalog: !!catalog,
        }
      }),
  [delegateWarehouse])

  const matches = search.trim()
    ? warehouseProducts.filter(p =>
        p.name.includes(search) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category.includes(search)
      )
    : warehouseProducts

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function addToCart(product: { id: string; name: string; sku: string; sellPrice: number; whQty: number; isInMainCatalog: boolean }) {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        if (existing.qty + 1 > product.whQty) {
          toast('الكمية غير متوفرة في المستودع', 'warn')
          return prev
        }
        return prev.map(item =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, { productId: product.id, name: product.name, sku: product.sku, price: product.sellPrice, qty: 1, isInMainCatalog: product.isInMainCatalog }]
    })
    setSearch('')
    setShowSearch(false)
  }

  function updateQty(productId: string, delta: number) {
    setCart(prev =>
      prev.map(item => {
        if (item.productId !== productId) return item
        const whItem = warehouseProducts.find(w => w.id === productId)
        const maxQty = whItem?.whQty ?? Infinity
        const newQty = Math.max(1, Math.min(maxQty, item.qty + delta))
        if (newQty === item.qty && delta > 0) toast('الكمية غير متوفرة في المستودع', 'warn')
        return { ...item, qty: newQty }
      })
    )
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(item => item.productId !== productId))
  }

  const subtotal = cart.reduce((s, item) => s + item.price * item.qty, 0)
  const tax = subtotal * 0.15
  const total = subtotal + tax

  async function handleAddCustomerSubmit() {
    if (!newCustomerName.trim()) { toast('أدخل اسم العميل', 'warn'); return }
    const created = await addCustomer({
      name: newCustomerName,
      type: 'customer',
      phone: newCustomerPhone || 'غير محدد',
      email: '',
      address: '',
      balance: 0,
      status: 'active',
    })
    toast(`تم إضافة العميل "${created.name}" — سيظهر للإدارة`, 'success')
    setCustomerId(created.id)
    setCustomerName(created.name)
    setShowAddCustomer(false)
    setShowCustomerPicker(false)
    setNewCustomerName('')
    setNewCustomerPhone('')
  }

  async function handleCheckout() {
    if (cart.length === 0) { toast('سلة المشتريات فارغة', 'warn'); return }
    if (!customerName.trim()) { toast('أدخل اسم العميل', 'warn'); return }

    // Deduct from delegate warehouse
    for (const item of cart) {
      const ok = deductFromWarehouse(delegateId, item.productId, item.qty)
      if (!ok) {
        toast(`الكمية غير متوفرة في المستودع لـ "${item.name}"`, 'danger')
        return
      }
    }

    // Sync main inventory for catalog items
    const catalogItems = cart.filter(i => i.isInMainCatalog)
    if (catalogItems.length > 0) {
      deductFromInventory(catalogItems.map(i => ({ productId: i.productId, qty: i.qty })))
    }

    // Create invoice in delegate store
    const inv = await addInvoice(delegateId, {
      date: new Date().toISOString().slice(0, 10),
      type: 'sale',
      party: customerName,
      customerId: customerId || undefined,
      items: cart.map(it => ({ description: it.name, qty: it.qty, price: it.price, total: it.qty * it.price })),
      subtotal,
      tax,
      total,
      status: paymentMethod === 'cash' ? 'paid' : 'pending',
      paymentMethod,
      paidAmount: paymentMethod === 'cash' ? total : 0,
    })

    // Credit invoice → customer owes us more → balance decreases
    if (paymentMethod === 'credit' && customerId) {
      updateBalance(customerId, -total)
    }

    toast(`تم البيع! الفاتورة ${inv.number} بقيمة ${fmt(total)}`, 'success')
    setCart([])
    setCustomerId('')
    setCustomerName('')
    setPaymentMethod('cash')
  }

  return (
    <>
      <PageHeader title="نقطة البيع" subtitle="بيع سريع للعملاء" />

      {/* Mobile: tabs to switch between products and cart */}
      <div className="mobile-only" style={{ display: 'none', gap: 0, marginBottom: 16, background: 'var(--card)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }} id="pos-mobile-tabs">
        <button id="pos-tab-products" onClick={() => { document.getElementById('pos-products')!.style.display='block'; document.getElementById('pos-cart')!.style.display='none'; document.getElementById('pos-tab-products')!.style.background='var(--primary)'; document.getElementById('pos-tab-products')!.style.color='#fff'; document.getElementById('pos-tab-cart')!.style.background='var(--card)'; document.getElementById('pos-tab-cart')!.style.color='var(--text)' }}
          style={{ flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: 'var(--primary)', color: '#fff' }}>
          <i className="fa fa-box" style={{ marginLeft: 6 }} />المنتجات
        </button>
        <button id="pos-tab-cart" onClick={() => { document.getElementById('pos-products')!.style.display='none'; document.getElementById('pos-cart')!.style.display='block'; document.getElementById('pos-tab-cart')!.style.background='var(--primary)'; document.getElementById('pos-tab-cart')!.style.color='#fff'; document.getElementById('pos-tab-products')!.style.background='var(--card)'; document.getElementById('pos-tab-products')!.style.color='var(--text)' }}
          style={{ flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: 'var(--card)', color: 'var(--text)', borderRight: '1px solid var(--border)' }}>
          <i className="fa fa-cart-shopping" style={{ marginLeft: 6 }} />السلة {cart.length > 0 && <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: '50%', padding: '2px 7px', fontSize: 11, marginRight: 4 }}>{cart.reduce((s,i)=>s+i.qty,0)}</span>}
        </button>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Product search + catalog */}
        <div id="pos-products">
          <Card title="المنتجات" style={{ marginBottom: 16 }}>
            <div ref={searchRef} style={{ position: 'relative', marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  placeholder="ابحث باسم المنتج أو الكود..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowSearch(true) }}
                  onFocus={() => setShowSearch(true)}
                  style={{ paddingLeft: 40 }}
                />
                <i className="fa fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              </div>

              {showSearch && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 1000,
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,.15)',
                  maxHeight: 320, overflowY: 'auto', marginTop: 4,
                }}>
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', borderRadius: '12px 12px 0 0' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>{matches.length} منتج</div>
                  </div>
                  {matches.length === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>لا توجد منتجات مطابقة</div>
                  )}
                  {matches.map(p => (
                    <button key={p.id} type="button" onClick={() => addToCart(p)}
                      style={{
                        width: '100%', textAlign: 'right', background: 'none', border: 'none',
                        padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa fa-box" style={{ color: 'var(--primary)', fontSize: 14 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.sku} · {p.category}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--success)' }}>{fmt(p.sellPrice)}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>متوفر: {p.whQty}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick product grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
              {warehouseProducts.slice(0, 8).map(p => (
                <button key={p.id} type="button" onClick={() => addToCart(p)}
                  style={{
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
                    padding: 12, cursor: 'pointer', textAlign: 'center', transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--card)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)10', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <i className="fa fa-box" style={{ color: 'var(--primary)', fontSize: 16 }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--success)' }}>{fmt(p.sellPrice)}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>متوفر: {p.whQty}</div>
                </button>
              ))}
              {warehouseProducts.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20, color: 'var(--muted)' }}>المستودع فارغ</div>
              )}
            </div>
          </Card>
        </div>

        {/* Cart */}
        <div id="pos-cart">
          <Card title="سلة المشتريات" action={<span style={{ fontSize: 12, color: 'var(--muted)' }}>{cart.length} صنف</span>}>
            {cart.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                <i className="fa fa-shopping-cart" style={{ fontSize: 40, opacity: 0.3, display: 'block', marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>السلة فارغة</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>اختر منتجاً لإضافته</div>
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 16 }}>
                  {cart.map(item => (
                    <div key={item.productId} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      {/* Row 1: Name + total + delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)', flexShrink: 0 }}>{fmt(item.price * item.qty)}</div>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px 8px', fontSize: 16, flexShrink: 0 }} onClick={() => removeFromCart(item.productId)}>
                          <i className="fa fa-trash" />
                        </button>
                      </div>
                      {/* Row 2: Price + qty controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                          <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>السعر:</span>
                          <input type="text" inputMode="decimal" value={item.price}
                            onChange={e => { const n = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0; setCart(prev => prev.map(ci => ci.productId === item.productId ? { ...ci, price: n } : ci)) }}
                            style={{ flex: 1, maxWidth: 80, textAlign: 'center', fontSize: 13, fontWeight: 700, border: '1px solid var(--border)', borderRadius: 6, padding: '6px 4px', background: 'var(--bg)' }}
                          />
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>ر.س</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <button style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => updateQty(item.productId, -1)}>−</button>
                          <input type="text" inputMode="decimal" value={item.qty}
                            onChange={e => { const n = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 1; const maxQty = warehouseProducts.find(w => w.id === item.productId)?.whQty ?? Infinity; setCart(prev => prev.map(ci => ci.productId === item.productId ? { ...ci, qty: Math.max(1, Math.min(maxQty, n)) } : ci)) }}
                            style={{ width: 44, textAlign: 'center', fontSize: 15, fontWeight: 800, border: '1px solid var(--border)', borderRadius: 6, padding: '6px 4px', background: 'var(--bg)' }}
                          />
                          <button style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => updateQty(item.productId, +1)}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer info */}
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">العميل</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-control" placeholder="اختر العميل..." value={customerName} readOnly style={{ flex: 1 }} />
                    <button className="btn btn-outline btn-sm" onClick={() => { setShowCustomerPicker(true); setCustomerSearch(''); setShowAddCustomer(false) }}>
                      <i className="fa fa-search" /> العملاء
                    </button>
                  </div>
                </div>

                {/* Payment method */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button type="button" onClick={() => setPaymentMethod('cash')}
                    className={`btn btn-sm ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>
                    <i className="fa fa-money-bill-wave" /> نقدي
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('credit')}
                    className={`btn btn-sm ${paymentMethod === 'credit' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>
                    <i className="fa fa-credit-card" /> آجل
                  </button>
                </div>

                {/* Totals */}
                <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--muted)' }}>الإجمالي</span>
                    <span style={{ fontWeight: 700 }}>{fmt(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--muted)' }}>الضريبة (15%)</span>
                    <span style={{ fontWeight: 700 }}>{fmt(tax)}</span>
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}>
                    <span>الصافي</span>
                    <span style={{ color: 'var(--primary)' }}>{fmt(total)}</span>
                  </div>
                </div>

                <button className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: '14px 0', fontSize: 16, minHeight: 48 }} onClick={handleCheckout}>
                  <i className="fa fa-check-circle" /> إتمام البيع
                </button>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Customer Picker Modal */}
      {showCustomerPicker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', padding: 20 }}>
          <div style={{ background: 'var(--card)', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.2)', border: '1px solid var(--border)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>اختيار العميل</div>
              <button className="btn btn-sm btn-outline" onClick={() => setShowCustomerPicker(false)}><i className="fa fa-times" /></button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input className="form-control" placeholder="ابحث عن عميل..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                  <i className="fa fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddCustomer(true)}><i className="fa fa-plus" /> عميل جديد</button>
              </div>

              {showAddCustomer && (
                <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>عميل جديد</div>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <input className="form-control" placeholder="اسم العميل" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <input className="form-control" placeholder="رقم الهاتف" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleAddCustomerSubmit}><i className="fa fa-save" /> حفظ</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowAddCustomer(false)}>إلغاء</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {filteredCustomers.length === 0 && !showAddCustomer && (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا يوجد عملاء</div>
                )}
                {filteredCustomers.map((c: any) => (
                  <button key={c.id} type="button"
                    onClick={() => { setCustomerId(c.id); setCustomerName(c.name); setShowCustomerPicker(false) }}
                    style={{ width: '100%', textAlign: 'right', background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', fontWeight: 800, fontSize: 12 }}>{c.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.phone} · {c.address || 'لا يوجد عنوان'}</div>
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
