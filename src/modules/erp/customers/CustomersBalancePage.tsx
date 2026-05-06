import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { fmt, fmtDate } from '@/lib/format'
import { type Customer } from '@/lib/mock-data/customers'
import { useCustomerStore } from '@/store/customer.store'
import { exportExcel } from '@/lib/excel'
import { toast } from '@/lib/toast'

type View = 'customers' | 'suppliers'

function BalanceBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(Math.abs(value) / max * 100, 100)
  const color = value > 0 ? 'var(--success)' : value < 0 ? 'var(--danger)' : 'var(--muted)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 90, textAlign: 'left' }}>
        {value > 0 ? '+' : ''}{fmt(value)}
      </span>
    </div>
  )
}

function BalanceSection({ data, type }: { data: Customer[]; type: View }) {
  const isCustomer = type === 'customers'
  const positive  = data.filter(c => c.balance > 0)
  const negative  = data.filter(c => c.balance < 0)
  const zero      = data.filter(c => c.balance === 0)
  const maxAbs    = Math.max(...data.map(c => Math.abs(c.balance)), 1)
  const totalOwed = positive.reduce((s, c) => s + c.balance, 0)
  const totalDue  = negative.reduce((s, c) => s + Math.abs(c.balance), 0)

  function doExport() {
    exportExcel({
      title: isCustomer ? 'أرصدة العملاء' : 'أرصدة الموردين',
      filename: isCustomer ? `أرصدة-عملاء-${new Date().toISOString().slice(0,10)}` : `أرصدة-موردين-${new Date().toISOString().slice(0,10)}`,
      columns: [
        { header: 'الاسم',    key: 'name',          width: 30, type: 'text' },
        { header: 'الهاتف',   key: 'phone',         width: 16, type: 'text', align: 'center' },
        { header: 'الرصيد',   key: 'balance',       width: 18, type: 'currency' },
        { header: 'الفواتير', key: 'totalInvoices', width: 12, type: 'number', align: 'center' },
        { header: 'الحالة',   key: 'status',        width: 12, type: 'status', align: 'center' },
        { header: 'منذ',      key: 'since',         width: 14, type: 'date',   align: 'center' },
      ],
      rows: data as unknown as Record<string, unknown>[],
      totals: {
        name: `${data.length} ${isCustomer ? 'عميل' : 'مورد'}`,
        balance: data.reduce((s, c) => s + c.balance, 0),
        totalInvoices: data.reduce((s, c) => s + c.totalInvoices, 0),
      },
    })
    toast('تم تصدير الأرصدة بنجاح', 'success')
  }

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px', borderRight: '4px solid var(--success)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
            {isCustomer ? 'رصيد دائن — له عندنا' : 'رصيد دائن — له عندنا'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{fmt(totalOwed)}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{positive.length} {isCustomer ? 'عميل دائن' : 'مورد دائن'}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px', borderRight: '4px solid var(--danger)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
            {isCustomer ? 'مدين — عليه دين لنا' : 'مدين — عليه دين لنا'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)' }}>{fmt(totalDue)}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{negative.length} {isCustomer ? 'عميل مدين' : 'مورد مدين'}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px', borderRight: '4px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>صافي المركز</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: totalOwed - totalDue >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {fmt(totalOwed - totalDue)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{zero.length} صفري الرصيد</div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            <i className="fa fa-balance-scale" style={{ marginLeft: 8, color: 'var(--blue)' }} />
            {isCustomer ? 'أرصدة العملاء' : 'أرصدة الموردين'}
          </span>
          <button className="btn btn-outline btn-sm" onClick={doExport}>
            <i className="fa fa-file-excel" /> تصدير
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{isCustomer ? 'العميل' : 'المورد'}</th>
                <th>الهاتف</th>
                <th>الفواتير</th>
                <th>الرصيد</th>
                <th style={{ minWidth: 200 }}>مؤشر الرصيد</th>
                <th>الحالة</th>
                <th>منذ</th>
              </tr>
            </thead>
            <tbody>
              {[...data].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.email}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.phone}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.totalInvoices}</td>
                  <td>
                    <span style={{
                      fontWeight: 800, fontSize: 13,
                      color: c.balance < 0 ? 'var(--danger)' : c.balance > 0 ? 'var(--success)' : 'var(--muted)',
                    }}>
                      {fmt(Math.abs(c.balance))}
                    </span>
                    {c.balance !== 0 && (
                      <div style={{ fontSize: 10, color: c.balance < 0 ? 'var(--danger)' : 'var(--success)', marginTop: 2, fontWeight: 700 }}>
                        {c.balance < 0 ? 'مدين — عليه دين' : 'دائن — له رصيد'}
                      </div>
                    )}
                  </td>
                  <td style={{ minWidth: 200 }}>
                    <BalanceBar value={c.balance} max={maxAbs} />
                  </td>
                  <td>
                    <span className={`status ${c.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {c.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(c.since)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function CustomersBalancePage() {
  const [view, setView] = useState<View>('customers')
  const { customers: allCustomers } = useCustomerStore()

  const customers = allCustomers.filter(c => c.type === 'customer' || c.type === 'both')
  const suppliers  = allCustomers.filter(c => c.type === 'supplier' || c.type === 'both')

  return (
    <>
      <PageHeader
        title="أرصدة العملاء والموردين"
        subtitle="كشف المستحقات والذمم المدينة والدائنة"
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          className={`btn btn-sm ${view === 'customers' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setView('customers')}
        >
          <i className="fa fa-user" style={{ marginLeft: 6 }} />
          العملاء ({customers.length})
        </button>
        <button
          className={`btn btn-sm ${view === 'suppliers' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setView('suppliers')}
        >
          <i className="fa fa-truck" style={{ marginLeft: 6 }} />
          الموردون ({suppliers.length})
        </button>
      </div>

      {view === 'customers' && <BalanceSection data={customers} type="customers" />}
      {view === 'suppliers' && <BalanceSection data={suppliers} type="suppliers" />}
    </>
  )
}
