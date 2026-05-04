import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { fmt, fmtDate } from '@/lib/format'
import { TRANSACTIONS, ACCOUNTS, TREASURY_STATS, type TxType, type TxCategory } from '@/lib/mock-data/treasury'
import { toast } from '@/lib/toast'

const TYPE_COLORS: Record<TxType, string> = { in: 'var(--success)', out: 'var(--danger)' }
const CAT_ICONS: Record<TxCategory, string> = {
  invoice: 'fa-file-invoice',
  expense: 'fa-receipt',
  salary:  'fa-users',
  purchase:'fa-shopping-cart',
  transfer:'fa-arrows-left-right',
  other:   'fa-circle-dot',
}

export default function TreasuryPage() {
  const [activeAccount, setActiveAccount] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [txType, setTxType] = useState<'in' | 'out'>('in')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')

  const filtered = activeAccount === 'all'
    ? TRANSACTIONS
    : TRANSACTIONS.filter(t => t.account === activeAccount)

  const handleSave = () => {
    if (!amount || !desc) { toast('يرجى ملء جميع الحقول', 'warn'); return }
    toast(`تم تسجيل ${txType === 'in' ? 'إيراد' : 'مصروف'} بقيمة ${fmt(+amount)}`, 'success')
    setShowNew(false)
    setAmount('')
    setDesc('')
  }

  return (
    <>
      <PageHeader
        title="الخزينة والحسابات"
        subtitle="إدارة الحركات المالية والأرصدة"
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => toast('جارٍ تصدير كشف الحساب...', 'info')}>
              <i className="fa fa-download" /> تصدير
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
              <i className="fa fa-plus" /> حركة جديدة
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="الرصيد الإجمالي" value={fmt(TREASURY_STATS.totalBalance)} dark icon="fa-wallet" />
        <StatCard label="إجمالي الوارد" value={fmt(TREASURY_STATS.totalIn)} badge="▲" badgeType="success" icon="fa-arrow-down-to-line" iconColor="var(--success)" />
        <StatCard label="إجمالي الصادر" value={fmt(TREASURY_STATS.totalOut)} badge="▼" badgeType="danger" icon="fa-arrow-up-from-line" iconColor="var(--danger)" />
        <StatCard label="رصيد نقدي" value={fmt(TREASURY_STATS.cashBalance)} icon="fa-money-bill-wave" iconColor="var(--blue)" />
      </div>

      {/* Accounts */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ACCOUNTS.length + 1}, 1fr)`, gap: 12, marginBottom: 24 }}>
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
          <div style={{ fontWeight: 800, fontSize: 18 }}>{fmt(TREASURY_STATS.totalBalance)}</div>
        </button>
        {ACCOUNTS.map(acc => (
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
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>الحساب</label>
            <select className="form-control">
              {ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>حفظ</button>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
