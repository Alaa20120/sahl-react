import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import { fmt, fmtNum, fmtDate } from '@/lib/format'
import { useDelegateStore } from '@/store/delegate.store'
import { useTreasuryStore } from '@/store/treasury.store'
import { useCustomerStore } from '@/store/customer.store'
import { printDelegateWithdrawalReceipt, printStockReceipt, printAccountStatement, printFinancialReceipt } from '@/lib/print'
import { toast } from '@/lib/toast'

type Tab = 'overview' | 'warehouse' | 'invoices' | 'finance' | 'location'

const INV_STATUS: Record<string, { label: string; css: string }> = {
  paid:      { label: 'مدفوعة',  css: 'status-active' },
  confirmed: { label: 'مؤكدة',   css: 'status-active' },
  pending:   { label: 'معلقة',   css: 'status-pending' },
  overdue:   { label: 'متأخرة',  css: 'status-inactive' },
}

const TX_TYPE: Record<string, { label: string; color: string; icon: string }> = {
  collection: { label: 'تحصيل', color: 'var(--success)', icon: 'fa-arrow-down' },
  withdrawal: { label: 'سحب', color: 'var(--danger)', icon: 'fa-arrow-up' },
  expense: { label: 'مصروف', color: 'var(--warn)', icon: 'fa-receipt' },
  commission: { label: 'عمولة', color: 'var(--blue)', icon: 'fa-percent' },
  remittance: { label: 'توريد للشركة', color: 'var(--primary)', icon: 'fa-building' },
}

export default function DelegateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const delegates = useDelegateStore(s => s.delegates)
  const withdrawFromDelegate = useDelegateStore(s => s.withdrawFromDelegate)
  const transferToMainWarehouse = useDelegateStore(s => s.transferToMainWarehouse)
  const addTreasuryTransaction = useTreasuryStore(s => s.addTransaction)
  const accounts = useTreasuryStore(s => s.accounts)
  const customers = useCustomerStore(s => s.customers)

  const d = delegates.find(x => x.id === id)
  const [tab, setTab] = useState<Tab>('overview')
  const [wdAmount, setWdAmount] = useState('')
  const [wdDesc, setWdDesc] = useState('')
  const [invFilter, setInvFilter] = useState<'all' | 'sale' | 'purchase'>('all')
  const [showCollectModal, setShowCollectModal] = useState(false)
  const [collectAmount, setCollectAmount] = useState('')
  const [collectDesc, setCollectDesc] = useState('')
  const [collectFromCustomer, setCollectFromCustomer] = useState<string | null>(null)

  if (!d) {
    return (
      <div className="empty-state">
        <i className="fa fa-user-slash empty-state-icon" />
        <div className="empty-state-title">المندوب غير موجود</div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/erp/delegates')}>
          <i className="fa fa-arrow-right" /> العودة للمندوبين
        </button>
      </div>
    )
  }

  const filteredInvoices = d.invoices.filter(inv => invFilter === 'all' || inv.type === invFilter)
  const whTotal = d.warehouse.reduce((s, w) => s + w.qty * w.costPrice, 0)

  // Finance calculations from invoices (real-time)
  const saleInvoices = d.invoices.filter(i => i.type === 'sale')
  const purchaseInvoices = d.invoices.filter(i => i.type === 'purchase')
  const totalSales = saleInvoices.reduce((s, i) => s + i.total, 0)
  const totalPurchases = purchaseInvoices.reduce((s, i) => s + i.total, 0)
  // Collected = sum of paid amounts from sale invoices
  const totalCollected = saleInvoices.reduce((s, i) => s + (i.paidAmount ?? 0), 0)
  // External credit = remaining from sale invoices
  const totalExternalCredit = saleInvoices.reduce((s, i) => s + (i.total - (i.paidAmount ?? 0)), 0)
  // Expenses from transactions
  const totalExpenses = d.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)
  // Available for withdrawal = collected - expenses - already withdrawn
  const totalWithdrawn = d.transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.amount), 0)
  const availableForWithdrawal = Math.max(0, totalCollected - totalExpenses - totalWithdrawn)

  function handleWithdraw() {
    const amt = parseFloat(wdAmount)
    if (!amt || amt <= 0) { toast('أدخل مبلغ صحيح', 'danger'); return }
    if (amt > availableForWithdrawal) { toast('المبلغ أكبر من الفلوس المتاحة للسحب', 'danger'); return }
    const desc = wdDesc || `توريد من المندوب ${d!.name}`
    const ref = `WD-${d!.id}-${Date.now()}`
    const balanceBefore = d!.stats.balance
    // Deduct from delegate
    withdrawFromDelegate(d!.id, amt, desc)
    // Record in treasury as incoming transfer
    addTreasuryTransaction({
      date: new Date().toISOString().slice(0, 10),
      description: desc,
      type: 'in',
      category: 'transfer',
      amount: amt,
      account: 'cash',
      ref,
    })
    // Print receipt
    printDelegateWithdrawalReceipt(
      d!.name,
      amt,
      desc,
      balanceBefore,
      balanceBefore - amt,
      ref
    )
    toast(`تم سحب ${fmt(amt)} من ${d!.name} وتسجيله في الخزنة`, 'success')
    setWdAmount(''); setWdDesc('')
  }

  function handleCollectFromCustomer() {
    const amt = parseFloat(collectAmount)
    if (!amt || amt <= 0) { toast('أدخل مبلغ صحيح', 'danger'); return }
    const customer = collectFromCustomer ? customers.find(c => c.id === collectFromCustomer) : null
    const desc = collectDesc || (customer ? `تحصيل من ${customer.name}` : 'تحصيل آجل من عميل')
    const ref = `COL-${d!.id}-${Date.now()}`

    // Record collection transaction in delegate
    // This increases delegate's balance (money they hold)
    // And reduces external credit
    // We use a special transaction type

    // Add to treasury
    addTreasuryTransaction({
      date: new Date().toISOString().slice(0, 10),
      description: `${desc} — عبر المندوب ${d!.name}`,
      type: 'in',
      category: 'collection',
      amount: amt,
      account: 'cash',
      ref,
    })

    // Print receipt
    printFinancialReceipt('in', amt, `${desc} — عبر المندوب ${d!.name}`, 'نقدي', 'تحصيل', ref)

    toast(`تم تحصيل ${fmt(amt)} وتسجيله في الخزنة`, 'success')
    setCollectAmount('')
    setCollectDesc('')
    setCollectFromCustomer(null)
    setShowCollectModal(false)
  }

  function handleTransfer(whItemId: string, qty: number, name: string, costPrice: number) {
    transferToMainWarehouse(d!.id, whItemId, qty)
    printStockReceipt(d!.name, name, qty, 'وحدة', qty * costPrice)
    toast(`تم تحويل ${qty} من "${name}" للمخزن الرئيسي`, 'success')
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'نظرة عامة', icon: 'fa-chart-pie' },
    { key: 'warehouse', label: 'المستودع', icon: 'fa-warehouse' },
    { key: 'invoices', label: 'الفواتير', icon: 'fa-file-invoice' },
    { key: 'finance', label: 'الحركة المالية', icon: 'fa-money-bill-wave' },
    { key: 'location', label: 'التتبع', icon: 'fa-map-marker-alt' },
  ]

  return (
    <>
      <PageHeader
        title={d.name}
        subtitle={`${d.id} · ${d.zone} · ${d.phone}`}
        actions={
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/erp/delegates')}>
            <i className="fa fa-arrow-right" /> رجوع للمندوبين
          </button>
        }
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'إجمالي المبيعات', value: fmt(totalSales), color: 'var(--success)', icon: 'fa-chart-line' },
          { label: 'إجمالي المشتريات', value: fmt(totalPurchases), color: 'var(--blue)', icon: 'fa-shopping-cart' },
          { label: 'إجمالي المحصّل', value: fmt(totalCollected), color: 'var(--success)', icon: 'fa-hand-holding-dollar' },
          { label: 'الآجل الخارجي', value: fmt(totalExternalCredit), color: 'var(--warn)', icon: 'fa-clock' },
          { label: 'المصروفات', value: fmt(totalExpenses), color: 'var(--danger)', icon: 'fa-receipt' },
          { label: 'المتاح للسحب', value: fmt(availableForWithdrawal), color: availableForWithdrawal > 0 ? 'var(--primary)' : 'var(--muted)', icon: 'fa-wallet' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <i className={`fa ${s.icon}`} style={{ color: s.color, fontSize: 14 }} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <i className={`fa ${t.icon}`} style={{ marginLeft: 6 }} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Info card */}
          <div className="card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
              <i className="fa fa-id-card" style={{ marginLeft: 8, color: 'var(--blue)' }} /> بيانات المندوب
            </div>
            <div className="card-body">
              {[
                { label: 'الاسم', value: d.name },
                { label: 'الهاتف', value: d.phone },
                { label: 'البريد', value: d.email },
                { label: 'المنطقة', value: d.zone },
                { label: 'الحالة', value: d.status === 'active' ? 'نشط' : 'غير نشط' },
                { label: 'الموقع الحالي', value: d.location.address },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
              <i className="fa fa-history" style={{ marginLeft: 8, color: 'var(--accent)' }} /> آخر الحركات المالية
            </div>
            <div style={{ padding: 0 }}>
              {d.transactions.slice(0, 5).map(tx => {
                const t = TX_TYPE[tx.type]
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`fa ${t.icon}`} style={{ color: t.color, fontSize: 12 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{tx.description}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{fmtDate(tx.date)}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: tx.amount >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Customers list */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
              <i className="fa fa-users" style={{ marginLeft: 8, color: 'var(--success)' }} /> العملاء والموردون
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>الطرف</th><th>النوع</th><th>الفواتير</th><th>الإجمالي</th><th>الحالة</th></tr>
                </thead>
                <tbody>
                  {(() => {
                    const parties: Record<string, { type: string; count: number; total: number; hasPending: boolean }> = {}
                    d.invoices.forEach(inv => {
                      if (!parties[inv.party]) parties[inv.party] = { type: inv.type === 'sale' ? 'عميل' : 'مورد', count: 0, total: 0, hasPending: false }
                      parties[inv.party].count++
                      parties[inv.party].total += inv.total
                      if (inv.status !== 'paid') parties[inv.party].hasPending = true
                    })
                    return Object.entries(parties).map(([name, p]) => (
                      <tr key={name}>
                        <td style={{ fontWeight: 600 }}>{name}</td>
                        <td><span style={{ background: p.type === 'عميل' ? 'var(--success-bg)' : 'var(--blue-light)', color: p.type === 'عميل' ? 'var(--success)' : 'var(--blue)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{p.type}</span></td>
                        <td>{p.count}</td>
                        <td style={{ fontWeight: 700 }}>{fmt(p.total)}</td>
                        <td>{p.hasPending ? <span className="status status-pending">مستحق</span> : <span className="status status-active">مسدد</span>}</td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Warehouse Tab ── */}
      {tab === 'warehouse' && (
        <div className="card">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span><i className="fa fa-warehouse" style={{ marginLeft: 8, color: 'var(--blue)' }} /> مستودع المندوب</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>إجمالي القيمة: <strong style={{ color: 'var(--text)' }}>{fmt(whTotal)}</strong></span>
          </div>
          {d.warehouse.length === 0 ? (
            <div className="empty-state">
              <i className="fa fa-box-open empty-state-icon" />
              <div className="empty-state-title">المستودع فارغ</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>الصنف</th><th>الكود</th><th>الكمية</th><th>سعر التكلفة</th><th>الإجمالي</th><th>تاريخ الاستلام</th><th>المصدر</th><th>إجراء</th></tr>
                </thead>
                <tbody>
                  {d.warehouse.map(w => (
                    <tr key={w.id}>
                      <td style={{ fontWeight: 600 }}>{w.productName}</td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--blue)' }}>{w.productSku}</span></td>
                      <td style={{ fontWeight: 700 }}>{fmtNum(w.qty)}</td>
                      <td>{fmt(w.costPrice)}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(w.qty * w.costPrice)}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(w.receivedDate)}</td>
                      <td>
                        {w.source === 'company'
                          ? <span style={{ background: '#FFF7ED', color: 'var(--warn)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>عهدة شركة</span>
                          : <span style={{ background: 'var(--bg)', color: 'var(--muted)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>مشتريات</span>
                        }
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => handleTransfer(w.id, w.qty, w.productName, w.costPrice)}>
                          <i className="fa fa-exchange-alt" /> تحويل للمخزن
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Invoices Tab ── */}
      {tab === 'invoices' && (
        <div className="card">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}><i className="fa fa-file-invoice" style={{ marginLeft: 8, color: 'var(--accent)' }} /> فواتير المندوب</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ key: 'all' as const, label: 'الكل' }, { key: 'sale' as const, label: 'مبيعات' }, { key: 'purchase' as const, label: 'مشتريات' }].map(f => (
                <button key={f.key} className={`btn btn-sm ${invFilter === f.key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setInvFilter(f.key)}>{f.label}</button>
              ))}
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>رقم الفاتورة</th><th>التاريخ</th><th>النوع</th><th>الطرف</th><th>قبل الضريبة</th><th>الضريبة</th><th>الإجمالي</th><th>المدفوع</th><th>الدفع</th><th>الحالة</th></tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => {
                  const st = INV_STATUS[inv.status]
                  const paidAmount = inv.paidAmount ?? (inv.status === 'paid' ? inv.total : 0)
                  return (
                    <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/delegate/invoices/${inv.id}`)}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12, color: 'var(--blue)' }}>{inv.number}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(inv.date)}</td>
                      <td><span style={{ background: inv.type === 'sale' ? 'var(--success-bg)' : 'var(--blue-light)', color: inv.type === 'sale' ? 'var(--success)' : 'var(--blue)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{inv.type === 'sale' ? 'بيع' : 'شراء'}</span></td>
                      <td style={{ fontWeight: 500 }}>{inv.party}</td>
                      <td>{fmt(inv.subtotal)}</td>
                      <td style={{ color: 'var(--muted)' }}>{fmt(inv.tax)}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                      <td style={{ fontWeight: 700, color: paidAmount >= inv.total ? 'var(--success)' : 'var(--warn)' }}>{fmt(paidAmount)}</td>
                      <td><span style={{ fontSize: 11, fontWeight: 700, color: inv.paymentMethod === 'cash' ? 'var(--success)' : 'var(--warn)', background: inv.paymentMethod === 'cash' ? 'var(--success-bg)' : 'var(--warn-bg)', padding: '2px 8px', borderRadius: 6 }}>{inv.paymentMethod === 'cash' ? 'نقدي' : 'آجل'}</span></td>
                      <td><span className={`status ${st.css}`}>{st.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Finance Tab ── */}
      {tab === 'finance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
          {/* Left — Transactions + Unpaid Invoices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Unpaid invoices — actionable */}
            <div className="card">
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><i className="fa fa-clock" style={{ marginLeft: 8, color: 'var(--warn)' }} /> فواتير الآجل الغير مسددة</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{d.invoices.filter(i => i.type === 'sale' && i.status !== 'paid').length} فاتورة</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>الفاتورة</th><th>العميل</th><th>الإجمالي</th><th>المتبقي</th><th>إجراء</th></tr>
                  </thead>
                  <tbody>
                    {d.invoices.filter(i => i.type === 'sale' && i.status !== 'paid').map(inv => {
                      const remaining = inv.total - (inv.paidAmount ?? 0)
                      const customer = inv.customerId ? customers.find(c => c.id === inv.customerId) : null
                      return (
                        <tr key={inv.id}>
                          <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--blue)' }}>{inv.number}</span></td>
                          <td>
                            <button className="btn btn-sm btn-link" style={{ padding: 0, fontWeight: 600 }}
                              onClick={() => customer && navigate('/erp/customers', { state: { openProfile: customer.id } })}>
                              {inv.party}
                            </button>
                          </td>
                          <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                          <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{fmt(remaining)}</td>
                          <td>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/delegate/invoices/${inv.id}`)}>
                              <i className="fa fa-money-bill-wave" /> سداد
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {d.invoices.filter(i => i.type === 'sale' && i.status !== 'paid').length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>لا توجد فواتير معلقة</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transactions */}
            <div className="card">
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><i className="fa fa-exchange-alt" style={{ marginLeft: 8, color: 'var(--accent)' }} /> كشف الحساب</span>
                <button className="btn btn-outline btn-sm" onClick={() => {
                  const items = d.transactions.map(tx => ({
                    date: tx.date, desc: tx.description,
                    debit: tx.amount > 0 ? tx.amount : 0, credit: tx.amount < 0 ? Math.abs(tx.amount) : 0,
                    balance: tx.balanceAfter, ref: tx.reference ?? tx.id,
                  }))
                  printAccountStatement(d.name, items, '2024-01-01', new Date().toISOString().slice(0, 10), 'delegate')
                }}><i className="fa fa-print" /> طباعة</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>التاريخ</th><th>النوع</th><th>الوصف</th><th>المرجع</th><th>المبلغ</th><th>الرصيد بعد</th></tr>
                  </thead>
                  <tbody>
                    {d.transactions.map(tx => {
                      const t = TX_TYPE[tx.type]
                      return (
                        <tr key={tx.id}>
                          <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(tx.date)}</td>
                          <td><span style={{ background: t.color + '18', color: t.color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}><i className={`fa ${t.icon}`} style={{ marginLeft: 4 }} />{t.label}</span></td>
                          <td style={{ fontSize: 12 }}>{tx.description}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)' }}>{tx.reference ?? '—'}</td>
                          <td style={{ fontWeight: 700, color: tx.amount >= 0 ? 'var(--success)' : 'var(--danger)' }}>{tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}</td>
                          <td style={{ fontWeight: 700 }}>{fmt(tx.balanceAfter)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right — Actions Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Withdrawal form */}
            <div className="card" style={{ alignSelf: 'start', width: '100%' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
                <i className="fa fa-hand-holding-usd" style={{ marginLeft: 8, color: 'var(--danger)' }} /> سحب مبلغ من المندوب
              </div>
              <div className="card-body">
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: 'var(--muted)' }}>إجمالي المحصّل</span>
                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(totalCollected)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: 'var(--muted)' }}>المصروفات</span>
                    <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(totalExpenses)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: 'var(--muted)' }}>السحوبات السابقة</span>
                    <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{fmt(totalWithdrawn)}</span>
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>المتاح للسحب</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: availableForWithdrawal >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {fmt(availableForWithdrawal)}
                    </div>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">المبلغ</label>
                  <input className="form-control" type="number" placeholder="0.00" value={wdAmount} onChange={e => setWdAmount(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">الوصف</label>
                  <input className="form-control" placeholder="سحب نقدي — توريد للخزينة" value={wdDesc} onChange={e => setWdDesc(e.target.value)} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleWithdraw} disabled={availableForWithdrawal <= 0}>
                  <i className="fa fa-money-bill-wave" /> تنفيذ السحب
                </button>
              </div>
            </div>

            {/* Collect from customer */}
            <div className="card" style={{ alignSelf: 'start', width: '100%' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
                <i className="fa fa-arrow-down" style={{ marginLeft: 8, color: 'var(--success)' }} /> تحصيل آجل من عميل
              </div>
              <div className="card-body">
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>عندما يدفع العميل مبلغاً نقدياً للمندوب، قم بتسجيله هنا لتحديث الخزنة تلقائياً.</div>
                </div>
                <button className="btn btn-success" style={{ width: '100%' }} onClick={() => setShowCollectModal(true)}>
                  <i className="fa fa-plus" /> تسجيل تحصيل جديد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Location Tab ── */}
      {tab === 'location' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
              <i className="fa fa-map-marker-alt" style={{ marginLeft: 8, color: 'var(--danger)' }} /> الموقع الحالي
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 20, textAlign: 'center', marginBottom: 16 }}>
                <i className="fa fa-location-dot" style={{ fontSize: 32, color: 'var(--danger)', marginBottom: 12 }} />
                <div style={{ fontSize: 16, fontWeight: 700 }}>{d.location.address}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {d.location.lat.toFixed(4)}, {d.location.lng.toFixed(4)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                  آخر تحديث: {fmtDate(d.location.timestamp)}
                </div>
              </div>
              <a href={`https://www.google.com/maps?q=${d.location.lat},${d.location.lng}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ width: '100%', textAlign: 'center' }}>
                <i className="fa fa-external-link-alt" /> فتح في خرائط جوجل
              </a>
            </div>
          </div>

          <div className="card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
              <i className="fa fa-route" style={{ marginLeft: 8, color: 'var(--blue)' }} /> سجل التنقلات
            </div>
            <div style={{ padding: 0 }}>
              {d.locationHistory.map((loc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? 'var(--success)' : 'var(--muted)', border: i === 0 ? '2px solid var(--success)' : '2px solid var(--border)' }} />
                    {i < d.locationHistory.length - 1 && <div style={{ width: 2, height: 24, background: 'var(--border)' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{loc.address}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDate(loc.timestamp)} — {new Date(loc.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Collect from Customer Modal */}
      <Modal open={showCollectModal} onClose={() => setShowCollectModal(false)} title="تحصيل آجل من عميل"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowCollectModal(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleCollectFromCustomer}><i className="fa fa-save" /> تسجيل وطباعة إيصال</button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', marginBottom: 4 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>المندوب</div>
            <div style={{ fontWeight: 700 }}>{d.name}</div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>العميل (اختياري)</label>
            <select className="form-control" value={collectFromCustomer ?? ''} onChange={e => setCollectFromCustomer(e.target.value || null)}>
              <option value="">عميل عام...</option>
              {customers.filter(c => c.type === 'customer' || c.type === 'both').map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>المبلغ المحصّل *</label>
            <input className="form-control" type="number" placeholder="0.00" value={collectAmount} onChange={e => setCollectAmount(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>البيان / الوصف</label>
            <input className="form-control" placeholder="تحصيل آجل..." value={collectDesc} onChange={e => setCollectDesc(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الحساب</label>
            <select className="form-control">
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.label}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </>
  )
}
