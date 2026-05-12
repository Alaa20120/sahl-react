import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { fmt, fmtDate } from '@/lib/format'
import { type TxType, type TxCategory } from '@/lib/mock-data/treasury'
import { useTreasuryStore } from '@/store/treasury.store'
import { useInvoiceStore } from '@/store/invoice.store'
import { usePurchaseStore } from '@/store/purchase.store'
import { useAppStore } from '@/store/app.store'
import { exportExcel } from '@/lib/excel'
import { printFinancialReceipt } from '@/lib/print'
import { toast } from '@/lib/toast'
import { useSaving } from '@/lib/useSaving'

const TYPE_COLORS: Record<TxType, string> = { in: 'var(--success)', out: 'var(--danger)' }
const CAT_ICONS: Record<TxCategory, string> = {
  invoice: 'fa-file-invoice',
  expense: 'fa-receipt',
  salary: 'fa-users',
  purchase: 'fa-shopping-cart',
  transfer: 'fa-arrows-left-right',
  collection: 'fa-arrow-down',
  other: 'fa-circle-dot',
}

export default function TreasuryPage() {
  const { saving, run } = useSaving()
  const transactions = useTreasuryStore(s => s.transactions)
  const accounts = useTreasuryStore(s => s.accounts)
  const addTransaction = useTreasuryStore(s => s.addTransaction)
  const invoices = useInvoiceStore(s => s.invoices)
  const purchases = usePurchaseStore(s => s.purchases)

  const inventoryValue = purchases
    .filter(p => p.status === 'received')
    .reduce((s, p) => s + p.total, 0)
  const soldValue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const totalSalaries = transactions.filter(t => t.category === 'salary' && t.type === 'out').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.category === 'expense' && t.type === 'out').reduce((s, t) => s + t.amount, 0)

  const [activeAccount, setActiveAccount] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [txType, setTxType] = useState<'in' | 'out'>('in')
  const [txCategory, setTxCategory] = useState<TxCategory>('other')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('cash')

  const filtered = activeAccount === 'all'
    ? transactions
    : transactions.filter(t => t.account === activeAccount)

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const totalIn = transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0)

  const handleSave = () => {
    if (!amount || !desc) { toast('يرجى ملء جميع الحقول', 'warn'); return }

    run(async () => {
      const amt = parseFloat(amount)
      const ref = `TX-${Date.now()}`
      await addTransaction({
        date: new Date().toISOString().slice(0, 10),
        description: desc,
        type: txType,
        category: txCategory,
        amount: amt,
        account: selectedAccount,
        ref,
      })

      // Print receipt automatically
      const accountName = accounts.find(a => a.id === selectedAccount)?.label ?? selectedAccount
      const categoryLabel = txCategory === 'invoice' ? 'فواتير' : txCategory === 'expense' ? 'مصروفات' : txCategory === 'salary' ? 'رواتب' : txCategory === 'purchase' ? 'مشتريات' : txCategory === 'transfer' ? 'تحويل' : 'أخرى'
      printFinancialReceipt(useAppStore.getState().company, txType, amt, desc, accountName, categoryLabel, ref)

      toast(`تم تسجيل ${txType === 'in' ? 'إيراد' : 'مصروف'} بقيمة ${fmt(amt)}`, 'success')
      setShowNew(false)
      setAmount('')
      setDesc('')
      setTxCategory('other')
    }).catch((err: any) => toast(`خطأ في تسجيل الحركة: ${err?.message || 'حاول مرة أخرى'}`, 'danger'))
  }

  return (
    <>
      <PageHeader
        title="الخزينة والحسابات"
        subtitle="إدارة الحركات المالية والأرصدة"
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => {
              exportExcel({
                title: 'كشف الحركات المالية',
                filename: `خزينة-${new Date().toISOString().slice(0, 10)}`,
                columns: [
                  { header: 'رقم الحركة', key: 'id', width: 18, type: 'text', align: 'center' },
                  { header: 'التاريخ', key: 'date', width: 14, type: 'date', align: 'center' },
                  { header: 'البيان', key: 'description', width: 34, type: 'text' },
                  { header: 'الفئة', key: 'category', width: 14, type: 'text', align: 'center' },
                  { header: 'النوع', key: 'type', width: 12, type: 'status', align: 'center' },
                  { header: 'المبلغ', key: 'amount', width: 18, type: 'currency' },
                  { header: 'الرصيد', key: 'balance', width: 18, type: 'currency' },
                  { header: 'المرجع', key: 'ref', width: 16, type: 'text', align: 'center' },
                  { header: 'الحساب', key: 'account', width: 16, type: 'text', align: 'center' },
                ],
                rows: filtered.map(t => ({
                  ...t,
                  ref: t.ref ?? '—',
                  account: accounts.find(a => a.id === t.account)?.label ?? t.account,
                })),
                totals: {
                  id: '',
                  description: `${filtered.length} حركة`,
                  amount: filtered.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0),
                },
              })
              toast('تم تصدير كشف الحساب بنجاح', 'success')
            }}>
              <i className="fa fa-file-excel" /> تصدير Excel
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
              <i className="fa fa-plus" /> حركة جديدة
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="الرصيد الإجمالي" value={fmt(totalBalance)} dark icon="fa-wallet" />
        <StatCard label="إجمالي الوارد" value={fmt(totalIn)} badge="▲" badgeType="success" icon="fa-arrow-down" iconColor="var(--success)" />
        <StatCard label="إجمالي الصادر" value={fmt(totalOut)} badge="▼" badgeType="danger" icon="fa-arrow-up" iconColor="var(--danger)" />
        <StatCard label="قيمة المشتريات المستلمة" value={fmt(inventoryValue)} icon="fa-boxes-stacking" iconColor="var(--blue)" badge="مخزون" badgeType="warn" />
      </div>
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
        <StatCard label="إجمالي المبيعات المحصلة" value={fmt(soldValue)} icon="fa-chart-line" iconColor="var(--success)" badge="مدفوع" badgeType="success" />
        <StatCard label="إجمالي الرواتب المدفوعة" value={fmt(totalSalaries)} icon="fa-users" iconColor="var(--blue)" badge="رواتب" badgeType="warn" />
      </div>
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(1,1fr)' }}>
        <StatCard label="إجمالي المصروفات من الخزنة" value={fmt(totalExpenses)} icon="fa-receipt" iconColor="var(--danger)" badge="مصروفات" badgeType="danger" />
      </div>

      {/* Accounts */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${accounts.length + 1}, 1fr)`, gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setActiveAccount('all')}
          style={{
            background: activeAccount === 'all' ? 'var(--primary)' : 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px',
            cursor: 'pointer', textAlign: 'right', transition: '.15s',
            color: activeAccount === 'all' ? '#fff' : 'var(--text)',
          }}
        >
          <div style={{ fontSize: 11, opacity: .7, marginBottom: 4 }}>كل الحسابات</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{fmt(totalBalance)}</div>
        </button>
        {accounts.map(acc => (
          <button
            key={acc.id}
            onClick={() => setActiveAccount(acc.id)}
            style={{
              background: activeAccount === acc.id ? acc.color + '18' : 'var(--card)',
              border: `1px solid ${activeAccount === acc.id ? acc.color : 'var(--border)'}`,
              borderRadius: 10, padding: '14px 16px',
              cursor: 'pointer', textAlign: 'right', transition: '.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <i className={`fa ${acc.icon}`} style={{ color: acc.color, fontSize: 14 }} />
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{acc.label}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: acc.color }}>{fmt(acc.balance)}</div>
          </button>
        ))}
      </div>

      {/* Transactions */}
      <Card title="سجل الحركات المالية" action={<span style={{ fontSize: 12, color: 'var(--muted)' }}>{filtered.length} حركة</span>}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>رقم الحركة</th>
                <th>التاريخ</th>
                <th>البيان</th>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>الرصيد بعد</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: 600, color: 'var(--blue)', fontSize: 12 }}>{tx.id}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(new Date(tx.date))}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: TYPE_COLORS[tx.type] + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`fa ${CAT_ICONS[tx.category]}`} style={{ fontSize: 12, color: TYPE_COLORS[tx.type] }} />
                      </div>
                      <span style={{ fontSize: 13 }}>{tx.description}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLORS[tx.type], background: TYPE_COLORS[tx.type] + '15', padding: '2px 8px', borderRadius: 6 }}>
                      {tx.type === 'in' ? 'وارد' : 'صادر'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: TYPE_COLORS[tx.type] }}>
                    {tx.type === 'in' ? '+' : '-'}{fmt(tx.amount)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{fmt(tx.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="تسجيل حركة مالية">
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['in', 'out'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTxType(t)}
              className={`btn btn-sm ${txType === t ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, background: txType === t ? (t === 'in' ? 'var(--success)' : 'var(--danger)') : undefined, border: 'none' }}
            >
              <i className={`fa ${t === 'in' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />
              {t === 'in' ? 'وارد (إيراد)' : 'صادر (مصروف)'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>المبلغ (ر.س)</label>
            <input className="form-control" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>البيان</label>
            <input className="form-control" placeholder="وصف الحركة..." value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الفئة</label>
            <select className="form-control" value={txCategory} onChange={e => setTxCategory(e.target.value as TxCategory)}>
              <option value="invoice">فواتير</option>
              <option value="expense">مصروفات</option>
              <option value="salary">رواتب</option>
              <option value="purchase">مشتريات</option>
              <option value="transfer">تحويل</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الحساب</label>
            <select className="form-control" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>حفظ</button>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
