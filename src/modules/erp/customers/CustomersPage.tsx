import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import { fmt, initials } from '@/lib/format'
import { useCustomerStore } from '@/store/customer.store'
import { useInvoiceStore } from '@/store/invoice.store'
import { useDelegateStore } from '@/store/delegate.store'
import { useTreasuryStore } from '@/store/treasury.store'
import { printPaymentReceipt, printAccountStatement } from '@/lib/print'
import { type CustomerType } from '@/lib/mock-data/customers'
import { toast } from '@/lib/toast'
import { useSaving } from '@/lib/useSaving'

const TYPE_LABELS = { all: 'الكل', customer: 'عملاء', supplier: 'موردون', both: 'عميل ومورد' }
const AVATAR_COLORS = ['#2563EB','#7C3AED','#10B981','#D97706','#DC2626','#0891B2']

const BLANK_FORM = { name: '', type: 'customer' as CustomerType, phone: '', email: '', vatNumber: '', commercialReg: '', address: '' }

export default function CustomersPage() {
  const navigate = useNavigate()
  const { customers, addCustomer, updateCustomer, deleteCustomer, addPayment, getPayments } = useCustomerStore()
  const { invoices } = useInvoiceStore()
  const { delegates } = useDelegateStore()
  const { addTransaction } = useTreasuryStore()
  const { saving, run } = useSaving()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | CustomerType>('all')
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState(BLANK_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(BLANK_FORM)
  const [profile, setProfile] = useState<string | null>(null)

  // Payment modal state
  const [showPayment, setShowPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState<'in' | 'out'>('in')
  const [paymentMethod, setPaymentMethod] = useState('نقدي')
  const [paymentDesc, setPaymentDesc] = useState('')

  const filtered = useMemo(() => customers.filter(c => {
    const matchType = typeFilter === 'all' || c.type === typeFilter
    const matchSearch = !search || c.name.includes(search) || c.phone.includes(search)
    return matchType && matchSearch
  }), [customers, typeFilter, search])

  const stats = useMemo(() => ({
    total: customers.length,
    customers: customers.filter(c => c.type === 'customer' || c.type === 'both').length,
    suppliers: customers.filter(c => c.type === 'supplier' || c.type === 'both').length,
    totalBalance: customers.reduce((s, c) => s + c.balance, 0),
  }), [customers])

  const profileCustomer = customers.find(c => c.id === profile)
  const editCustomer = customers.find(c => c.id === editId)

  function handleAdd() {
    if (!newForm.name.trim()) { toast('أدخل الاسم', 'warn'); return }
    if (!newForm.phone.trim()) { toast('أدخل رقم الهاتف', 'warn'); return }
    run(async () => {
      await addCustomer({
        name: newForm.name.trim(), type: newForm.type,
        phone: newForm.phone.trim(), email: newForm.email.trim(),
        vatNumber: newForm.vatNumber.trim() || undefined,
        commercialReg: newForm.commercialReg.trim() || undefined,
        address: newForm.address.trim(), balance: 0, status: 'active',
      })
      toast(`تم إضافة "${newForm.name}" بنجاح`, 'success')
      setShowNew(false)
      setNewForm(BLANK_FORM)
    }).catch((err: any) => toast(`خطأ: ${err?.message || 'حاول مرة أخرى'}`, 'danger'))
  }

  function openEdit(id: string) {
    const c = customers.find(x => x.id === id)
    if (!c) return
    setEditId(id)
    setEditForm({ name: c.name, type: c.type, phone: c.phone, email: c.email, vatNumber: c.vatNumber ?? '', commercialReg: c.commercialReg ?? '', address: c.address })
  }

  function handleEdit() {
    if (!editId) return
    if (!editForm.name.trim()) { toast('أدخل الاسم', 'warn'); return }
    run(async () => {
      await updateCustomer(editId, {
        name: editForm.name.trim(),
        type: editForm.type,
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        vatNumber: editForm.vatNumber.trim() || undefined,
        commercialReg: editForm.commercialReg.trim() || undefined,
        address: editForm.address.trim(),
      })
      toast('تم تحديث البيانات بنجاح', 'success')
      setEditId(null)
    }).catch((err: any) => toast(`خطأ في التحديث: ${err?.message || 'حاول مرة أخرى'}`, 'danger'))
  }

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`هل تريد حذف "${name}"؟`)) return
    run(async () => {
      await deleteCustomer(id)
      toast(`تم حذف "${name}"`, 'success')
    }).catch((err: any) => toast(`خطأ في الحذف: ${err?.message || 'حاول مرة أخرى'}`, 'danger'))
  }

  async function handlePayment() {
    if (!profileCustomer) return
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) { toast('أدخل مبلغ صحيح', 'warn'); return }

    const balanceBefore = profileCustomer.balance
    // balance < 0 = they owe us (debit), balance > 0 = we owe them (credit)
    // 'in'  = receiving money from them → their debt decreases → balance increases
    // 'out' = paying money to them  → their credit decreases OR our debt to them decreases
    const delta = paymentType === 'in' ? +amount : -amount
    const balanceAfter = balanceBefore + delta

    try {
      const payment = await addPayment({
        customerId: profileCustomer.id,
        date: new Date().toISOString().slice(0, 10),
        amount,
        type: paymentType as 'in' | 'out',
        method: paymentMethod,
        description: paymentDesc || (paymentType === 'in' ? 'استلام مبلغ' : 'صرف مبلغ'),
        balanceBefore,
        balanceAfter,
      })

      // Add to treasury
      await addTransaction({
        date: new Date().toISOString().slice(0, 10),
        description: `${paymentType === 'in' ? 'استلام' : 'صرف'} من/لـ ${profileCustomer.name} — ${paymentDesc}`,
        type: paymentType as 'in' | 'out',
        category: 'other',
        amount,
        account: 'cash',
        ref: payment.refId,
      })

      printPaymentReceipt(
        profileCustomer.name,
        amount,
        (paymentType === 'in' ? 'collection' : 'payment') as 'collection' | 'payment',
        paymentMethod,
        balanceBefore,
        balanceAfter,
        payment.refId,
        paymentDesc
      )

      toast(`تم ${paymentType === 'in' ? 'استلام' : 'صرف'} ${fmt(amount)} بنجاح`, 'success')
      setShowPayment(false)
      setPaymentAmount('')
      setPaymentDesc('')
    } catch (err: any) {
      toast(`خطأ في تسجيل الدفعة: ${err?.message || 'حاول مرة أخرى'}`, 'danger')
    }
  }

  function handlePrintStatement() {
    if (!profileCustomer) return

    // ── 1. Gather ALL transactions that affect this customer's balance ──
    // ERP invoices (credit sales to this customer)
    const customerInvoices = invoices
      .filter(inv => inv.customerId === profileCustomer.id || inv.customer === profileCustomer.name)
      .sort((a, b) => a.date.localeCompare(b.date))

    // Delegate invoices (credit sales via delegates to this customer)
    const delegateInvoices = delegates.flatMap(d =>
      d.invoices
        .filter((inv: any) =>
          inv.type === 'sale' &&
          (inv.customerId === profileCustomer.id || inv.party === profileCustomer.name)
        )
        .map((inv: any) => ({ ...inv, _source: `مندوب: ${d.name}` }))
    ).sort((a: any, b: any) => a.date.localeCompare(b.date))

    // Payments recorded in customer store
    const customerPayments = getPayments(profileCustomer.id)
      .sort((a, b) => a.date.localeCompare(b.date))

    // ── 2. Build unified transaction list ───────────────────────────────
    // Accounting convention:
    //   - مدين (debit)  = الجهة مدينة لنا = فواتير مبيعات (بيعتله ومدفعش)
    //   - دائن (credit) = الجهة دائنة = دفعات ندفعها له أو فواتير مشتريات (اشترينا منه ومدفعناش)
    //   - الرصيد = المدين - الدائن
    //     الرصيد (+) = الجهة عليها دين (مدين)
    //     الرصيد (-) = احنا مديونين للجهة (دائن)
    const allTx = [
      ...customerInvoices.map(inv => ({
        date: inv.date,
        desc: `فاتورة مبيعات ${inv.number}`,
        debit: inv.total,   // بيع = الجهة مدينة لنا
        credit: 0,
        ref: inv.number,
      })),
      ...delegateInvoices.map((inv: any) => ({
        date: inv.date,
        desc: `فاتورة مبيعات ${inv.number} (${inv._source})`,
        debit: inv.total,   // بيع = الجهة مدينة لنا
        credit: 0,
        ref: inv.number,
      })),
      ...customerPayments.map(p => ({
        date: p.date,
        desc: p.type === 'in' ? `دفعة مستلمة — ${p.method}` : `دفعة مصروفة — ${p.method}`,
        // 'in' = استلمنا منه → يقلل المدين (يقلل رصيده المدين)
        // 'out' = دفعنا له → يزيد الدائن (يقلل رصيده المدين)
        debit: 0,
        credit: p.amount,
        ref: p.refId,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date))

    // ── 3. Compute running balance ──────────────────────────────────────
    // running = المدين - الدائن
    // running (+) = مدين (عليه)  → matches customer.balance > 0 interpretation
    // running (-) = دائن (له)    → matches customer.balance < 0 interpretation
    //
    // BUT: our customer store uses balance < 0 = owes us
    // So we need to INVERT: running = credit - debit to match store convention
    // OR we change the store convention.
    //
    // Let's keep the accounting display natural (debit - credit = balance)
    // and convert to store convention at the end.
    const items: { date: string; desc: string; debit: number; credit: number; balance: number; ref: string }[] = []
    let running = 0

    for (const tx of allTx) {
      running += tx.debit - tx.credit
      items.push({
        date: tx.date,
        desc: tx.desc,
        debit: tx.debit,
        credit: tx.credit,
        balance: running,
        ref: tx.ref,
      })
    }

    // ── 4. Opening balance line ─────────────────────────────────────────
    // customer.balance < 0 means customer OWES us (debtor) in our store
    // In accounting terms: debtor = positive balance
    // So: accountingBalance = -customer.balance
    const accountingCurrentBalance = -profileCustomer.balance
    const finalFromTx = items.length > 0 ? items[items.length - 1].balance : 0
    const openingBalance = accountingCurrentBalance - finalFromTx

    const allItems = openingBalance !== 0
      ? [
          {
            date: '—',
            desc: 'الرصيد الافتتاحي',
            debit: openingBalance > 0 ? openingBalance : 0,
            credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
            balance: openingBalance,
            ref: '',
          },
          ...items,
        ]
      : items

    printAccountStatement(
      profileCustomer.name,
      allItems,
      '2024-01-01',
      new Date().toISOString().slice(0, 10)
    )
  }

  return (
    <>
      <PageHeader
        title="الموردون والعملاء"
        subtitle={`${customers.length} جهة تجارية`}
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => { setShowNew(true); setNewForm(BLANK_FORM) }}>
            <i className="fa fa-plus" /> إضافة جديد
          </button>
        }
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي الجهات" value={String(stats.total)} dark icon="fa-handshake" />
        <StatCard label="عملاء" value={String(stats.customers)} badge="نشط" badgeType="success" icon="fa-user" iconColor="var(--success)" />
        <StatCard label="موردون" value={String(stats.suppliers)} badge="نشط" badgeType="pending" icon="fa-industry" iconColor="var(--blue)" />
        <StatCard label="إجمالي الرصيد" value={fmt(Math.abs(stats.totalBalance))} icon="fa-balance-scale" iconColor="var(--primary)" />
      </div>

      <div className="card mb-6">
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-box" style={{ flex: 1, maxWidth: 320 }}>
              <i className="fa fa-search icon" />
              <input placeholder="ابحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {(Object.entries(TYPE_LABELS) as [typeof typeFilter, string][]).map(([k, v]) => (
              <button key={k} onClick={() => setTypeFilter(k)} className={`btn btn-sm ${typeFilter === k ? 'btn-primary' : 'btn-outline'}`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الاسم</th><th>النوع</th><th>الهاتف</th><th>البريد</th>
                <th>الرصيد</th><th>الفواتير</th><th>الحالة</th><th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>لا توجد نتائج</td></tr>
              )}
              {filtered.map((c, idx) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {initials(c.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                        {c.vatNumber && <div style={{ fontSize: 11, color: 'var(--muted)' }}>ض: {c.vatNumber}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status ${c.type === 'supplier' ? 'status-pending' : 'status-active'}`}>
                      {c.type === 'customer' ? 'عميل' : c.type === 'supplier' ? 'مورد' : 'عميل ومورد'}
                    </span>
                  </td>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}>{c.phone}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>{c.email}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: c.balance < 0 ? 'var(--danger)' : c.balance > 0 ? 'var(--success)' : 'var(--muted)' }}>
                      {c.balance !== 0 ? fmt(Math.abs(c.balance)) : '—'}
                    </div>
                    {c.balance < 0 && <div style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 600 }}>مدين — عليه {fmt(Math.abs(c.balance))}</div>}
                    {c.balance > 0 && <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600 }}>دائن — له {fmt(c.balance)}</div>}
                  </td>
                  <td>{c.totalInvoices}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-icon btn-outline btn-sm" title="عرض الملف" onClick={() => setProfile(c.id)}><i className="fa fa-eye" /></button>
                      <button className="btn btn-icon btn-outline btn-sm" title="عرض الفواتير" onClick={() => navigate(`/erp/invoices?customer=${c.id}`)}><i className="fa fa-file-invoice" /></button>
                      <button className="btn btn-icon btn-outline btn-sm" title="تعديل" onClick={() => openEdit(c.id)}><i className="fa fa-edit" /></button>
                      <button className="btn btn-icon btn-outline btn-sm" title="حذف" onClick={() => handleDelete(c.id, c.name)} style={{ color: 'var(--danger)' }}><i className="fa fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="إضافة عميل / مورد جديد"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? <><i className="fa fa-spinner fa-spin" /> جارٍ الحفظ...</> : <><i className="fa fa-save" /> حفظ</>}
          </button>
        </>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الاسم الكامل *</label>
            <input className="form-control" placeholder="اسم الشركة أو الشخص" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>النوع</label>
            <select className="form-control" value={newForm.type} onChange={e => setNewForm(f => ({ ...f, type: e.target.value as CustomerType }))}>
              <option value="customer">عميل</option>
              <option value="supplier">مورد</option>
              <option value="both">عميل ومورد</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الهاتف *</label>
            <input className="form-control" type="tel" placeholder="05xxxxxxxx" value={newForm.phone} onChange={e => setNewForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>البريد الإلكتروني</label>
            <input className="form-control" type="email" value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الرقم الضريبي <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(اختياري)</span></label>
            <input className="form-control" placeholder="3xxxxxxxxxx" value={newForm.vatNumber} onChange={e => setNewForm(f => ({ ...f, vatNumber: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>السجل التجاري <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(اختياري)</span></label>
            <input className="form-control" placeholder="10xxxxxxxxx" value={newForm.commercialReg} onChange={e => setNewForm(f => ({ ...f, commercialReg: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>العنوان</label>
            <input className="form-control" placeholder="المدينة، الحي" value={newForm.address} onChange={e => setNewForm(f => ({ ...f, address: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editId} onClose={() => setEditId(null)} title="تعديل بيانات العميل / المورد"
        footer={<>
          <button className="btn btn-outline" onClick={() => setEditId(null)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleEdit}><i className="fa fa-save" /> حفظ التغييرات</button>
        </>}
      >
        {editCustomer && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الاسم</label>
              <input className="form-control" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>النوع</label>
              <select className="form-control" value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value as CustomerType }))}>
                <option value="customer">عميل</option>
                <option value="supplier">مورد</option>
                <option value="both">عميل ومورد</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الهاتف</label>
              <input className="form-control" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>البريد</label>
              <input className="form-control" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الرقم الضريبي <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(اختياري)</span></label>
              <input className="form-control" value={editForm.vatNumber} onChange={e => setEditForm(f => ({ ...f, vatNumber: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>السجل التجاري <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(اختياري)</span></label>
              <input className="form-control" value={editForm.commercialReg} onChange={e => setEditForm(f => ({ ...f, commercialReg: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>العنوان</label>
              <input className="form-control" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
            </div>
          </div>
        )}
      </Modal>

      {/* Profile Modal */}
      <Modal open={!!profile} onClose={() => setProfile(null)} title="ملف العميل / المورد">
        {profileCustomer && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: AVATAR_COLORS[customers.indexOf(profileCustomer) % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                {initials(profileCustomer.name)}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{profileCustomer.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {profileCustomer.type === 'customer' ? 'عميل' : profileCustomer.type === 'supplier' ? 'مورد' : 'عميل ومورد'} — منذ {profileCustomer.since}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              {[
                { label: 'الهاتف', value: profileCustomer.phone, icon: 'fa-phone' },
                { label: 'البريد', value: profileCustomer.email, icon: 'fa-envelope' },
                { label: 'العنوان', value: profileCustomer.address || '—', icon: 'fa-location-dot' },
                { label: 'الرقم الضريبي', value: profileCustomer.vatNumber ?? 'غير مسجل', icon: 'fa-percent' },
                { label: 'السجل التجاري', value: profileCustomer.commercialReg ?? 'غير مسجل', icon: 'fa-building' },
              ].map(f => (
                <div key={f.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>
                    <i className={`fa ${f.icon}`} style={{ marginLeft: 4 }} />{f.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: profileCustomer.balance < 0 ? 'var(--danger-bg)' : profileCustomer.balance > 0 ? 'var(--success-bg)' : 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>الرصيد الحالي</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: profileCustomer.balance < 0 ? 'var(--danger)' : profileCustomer.balance > 0 ? 'var(--success)' : 'var(--primary)' }}>
                  {fmt(Math.abs(profileCustomer.balance))}
                  <span style={{ fontSize: 12, fontWeight: 500, marginRight: 4 }}>
                    {profileCustomer.balance < 0 ? '— مدين (عليه دين)' : profileCustomer.balance > 0 ? '— دائن (له رصيد)' : ''}
                  </span>
                </div>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>إجمالي الفواتير</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{profileCustomer.totalInvoices} فاتورة</div>
              </div>
            </div>
            {/* Payment history */}
            {getPayments(profileCustomer.id).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>سجل المدفوعات</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {getPayments(profileCustomer.id).slice(0, 5).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg)', borderRadius: 6, fontSize: 12 }}>
                      <span>{p.date} — {p.description}</span>
                      <span style={{ fontWeight: 700, color: p.type === 'in' ? 'var(--success)' : 'var(--danger)' }}>
                        {p.type === 'in' ? '+' : '-'}{fmt(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" style={{ flex: 1, minWidth: 120 }} onClick={() => setShowPayment(true)}>
                <i className="fa fa-coins" /> تسجيل دفعة
              </button>
              <button className="btn btn-outline" style={{ flex: 1, minWidth: 120 }} onClick={handlePrintStatement}>
                <i className="fa fa-print" /> طباعة كشف حساب
              </button>
              <button className="btn btn-outline" onClick={() => { openEdit(profileCustomer.id); setProfile(null) }}>
                <i className="fa fa-edit" /> تعديل
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="تسجيل دفعة مالية"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowPayment(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handlePayment}><i className="fa fa-save" /> حفظ وطباعة إيصال</button>
        </>}
      >
        {profileCustomer && (
          <div>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>الجهة</div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{profileCustomer.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                الرصيد الحالي: {fmt(Math.abs(profileCustomer.balance))} {profileCustomer.balance < 0 ? '— مدين' : profileCustomer.balance > 0 ? '— دائن' : '— مسوّى'}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>نوع العملية</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setPaymentType('in')}
                    className={`btn btn-sm ${paymentType === 'in' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                  >
                    <i className="fa fa-arrow-down" /> استلام
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('out')}
                    className={`btn btn-sm ${paymentType === 'out' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                  >
                    <i className="fa fa-arrow-up" /> صرف
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>المبلغ *</label>
                <input
                  className="form-control"
                  type="number"
                  min={0}
                  step={0.01}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>طريقة الدفع</label>
                <select className="form-control" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="نقدي">نقدي</option>
                  <option value="بطاقة">بطاقة</option>
                  <option value="تحويل بنكي">تحويل بنكي</option>
                  <option value="شيك">شيك</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الوصف / البيان</label>
                <input
                  className="form-control"
                  value={paymentDesc}
                  onChange={e => setPaymentDesc(e.target.value)}
                  placeholder="وصف العملية..."
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
