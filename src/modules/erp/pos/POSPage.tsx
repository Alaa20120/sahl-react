import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { fmt } from '@/lib/format'
import { POS_PRODUCTS, POS_CATEGORIES, RECENT_SALES, POS_STATS } from '@/lib/mock-data/pos'
import { toast } from '@/lib/toast'

interface CartItem { id: string; name: string; price: number; qty: number }

const PAYMENT_LABELS = { cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل' }
const PAYMENT_ICONS  = { cash: 'fa-money-bill-wave', card: 'fa-credit-card', transfer: 'fa-mobile-screen-button' }

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [catFilter, setCatFilter] = useState('الكل')
  const [search, setSearch] = useState('')
  const [payment, setPayment] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [barcode, setBarcode] = useState('')

  const filtered = POS_PRODUCTS.filter(p => {
    const matchCat  = catFilter === 'الكل' || p.category === catFilter
    const matchSearch = !search || p.name.includes(search)
    return matchCat && matchSearch
  })

  const addToCart = (product: typeof POS_PRODUCTS[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id))
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const vat = subtotal * 0.15
  const total = subtotal + vat

  const handleCheckout = () => {
    if (cart.length === 0) { toast('السلة فارغة', 'warn'); return }
    toast(`تمت عملية البيع بنجاح — ${fmt(total)} ر.س`, 'success')
    setCart([])
  }

  const handleBarcode = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    const product = POS_PRODUCTS.find(p => p.barcode === barcode)
    if (product) { addToCart(product); setBarcode('') }
    else toast('لم يتم العثور على المنتج', 'warn')
  }

  return (
    <>
      <PageHeader title="نقطة البيع" subtitle="POS — إدارة المبيعات النقدية" />

      <div className="stats-grid mb-4" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="مبيعات اليوم" value={fmt(POS_STATS.todaySales)} dark icon="fa-cash-register" />
        <StatCard label="عدد الفواتير" value={String(POS_STATS.todayTransactions)} icon="fa-receipt" iconColor="var(--blue)" />
        <StatCard label="مبيعات الشهر" value={fmt(POS_STATS.monthSales)} badge="▲" badgeType="success" icon="fa-chart-line" iconColor="var(--success)" />
        <StatCard label="متوسط الفاتورة" value={fmt(POS_STATS.avgTicket)} icon="fa-calculator" iconColor="var(--warn)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
        {/* Products grid */}
        <div>
          {/* Search + barcode */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div className="search-box" style={{ flex: 1 }}>
              <i className="fa fa-search icon" />
              <input placeholder="ابحث عن منتج..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <input
              className="form-control" style={{ width: 200 }}
              placeholder="مسح باركود..."
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              onKeyDown={handleBarcode}
            />
          </div>

          {/* Category tabs */}
          <div className="tabs" style={{ marginBottom: 14 }}>
            {POS_CATEGORIES.map(c => (
              <button key={c} className={`tab-btn${catFilter === c ? ' active' : ''}`} onClick={() => setCatFilter(c)}>{c}</button>
            ))}
          </div>

          {/* Products */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
                  padding: 14, cursor: 'pointer', textAlign: 'right', transition: '.15s',
                  opacity: p.stock === 0 ? .4 : 1,
                }}
                disabled={p.stock === 0}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <i className="fa fa-box" style={{ fontSize: 18, color: 'var(--muted)' }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 4, lineHeight: 1.4 }}>{p.name}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{fmt(p.price)}</div>
                <div style={{ fontSize: 11, color: p.stock < 5 ? 'var(--danger)' : 'var(--muted)', marginTop: 4 }}>
                  {p.stock === 0 ? 'نفذ المخزون' : `متوفر: ${p.stock}`}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 80 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              <i className="fa fa-cart-shopping" style={{ color: 'var(--primary)', marginLeft: 8 }} />
              السلة ({cart.reduce((s, i) => s + i.qty, 0)} صنف)
            </div>
            {cart.length > 0 && (
              <button className="btn btn-sm btn-outline" style={{ fontSize: 11, color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setCart([])}>
                <i className="fa fa-trash" /> مسح
              </button>
            )}
          </div>

          <div style={{ minHeight: 200, maxHeight: 320, overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 13 }}>
                <i className="fa fa-cart-shopping" style={{ fontSize: 28, marginBottom: 10, display: 'block', opacity: .3 }} />
                لم يتم اختيار أي منتج
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmt(item.price)} × {item.qty}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 14 }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 14 }}>+</button>
                  </div>
                  <div style={{ fontWeight: 700, minWidth: 60, textAlign: 'left', fontSize: 13 }}>{fmt(item.price * item.qty)}</div>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 13 }}>
                    <i className="fa fa-xmark" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--muted)' }}>المجموع قبل الضريبة</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
              <span style={{ color: 'var(--muted)' }}>ضريبة القيمة المضافة (15%)</span>
              <span>{fmt(vat)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, marginBottom: 16, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <span>الإجمالي</span>
              <span style={{ color: 'var(--primary)' }}>{fmt(total)}</span>
            </div>

            {/* Payment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
              {(['cash', 'card', 'transfer'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPayment(p)}
                  style={{
                    background: payment === p ? 'var(--primary)' : 'var(--card)',
                    color: payment === p ? '#fff' : 'var(--muted)',
                    border: `1px solid ${payment === p ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 8, padding: '8px 4px', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: '.15s',
                  }}
                >
                  <i className={`fa ${PAYMENT_ICONS[p]}`} style={{ display: 'block', fontSize: 16, marginBottom: 4 }} />
                  {PAYMENT_LABELS[p]}
                </button>
              ))}
            </div>

            <button className="btn btn-primary w-full" style={{ justifyContent: 'center', fontSize: 15, fontWeight: 800, padding: '12px' }} onClick={handleCheckout}>
              <i className="fa fa-check" /> تأكيد البيع — {fmt(total)}
            </button>
          </div>

          {/* Recent Sales */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 10 }}>آخر المبيعات</div>
            {RECENT_SALES.slice(0, 3).map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--blue)' }}>{s.id}</span>
                  <span style={{ color: 'var(--muted)', marginRight: 8 }}>{s.items} أصناف</span>
                </div>
                <span style={{ fontWeight: 700 }}>{fmt(s.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
