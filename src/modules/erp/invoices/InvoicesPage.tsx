import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { fmt, fmtDate } from '@/lib/format'
import { useInvoiceStore } from '@/store/invoice.store'
import { useDelegateStore } from '@/store/delegate.store'
import { useCustomerStore } from '@/store/customer.store'
import { exportExcel } from '@/lib/excel'
import { toast } from '@/lib/toast'

// Unified invoice shape for display
interface UnifiedInvoice {
  id: string
  number: string
  customer: string
  date: string
  dueDate?: string
  amount: number
  tax: number
  total: number
  paidAmount: number
  status: string
  paymentMethod?: string
  source: 'admin' | 'delegate'
  delegateName?: string
  invoiceType?: 'sale' | 'purchase'
  customerId?: string
}

const STATUS_LABELS: Record<string, string> = {
  all: 'الكل', paid: 'مدفوع', pending: 'معلق', overdue: 'متأخر',
  draft: 'مسودة', confirmed: 'مؤكد', partial: 'جزئي',
}

export default function InvoicesPage() {
  const { invoices: adminInvoices } = useInvoiceStore()
  const delegates = useDelegateStore(s => s.delegates)
  const customers = useCustomerStore(s => s.customers)
  const [searchParams] = useSearchParams()
  const customerFilter = searchParams.get('customer')

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState<'all' | 'admin' | 'delegate'>('all')
  const [selected, setSelected] = useState<string[]>([])

  // Get customer name for display
  const filteredCustomer = customerFilter ? customers.find(c => c.id === customerFilter) : null

  // Normalize admin invoices
  const normalizedAdmin = useMemo<UnifiedInvoice[]>(() =>
    adminInvoices.map(inv => ({
      id: inv.id,
      number: inv.number,
      customer: inv.customer,
      customerId: inv.customerId,
      date: inv.date,
      dueDate: inv.dueDate,
      amount: inv.amount,
      tax: inv.tax,
      total: inv.total,
      paidAmount: inv.paidAmount ?? (inv.status === 'paid' ? inv.total : 0),
      status: inv.status,
      paymentMethod: inv.paymentMethod,
      source: 'admin' as const,
      invoiceType: 'sale' as const,
    })),
  [adminInvoices])

  // Normalize delegate invoices
  const normalizedDelegate = useMemo<UnifiedInvoice[]>(() => {
    const all: UnifiedInvoice[] = []
    delegates.forEach(del => {
      del.invoices.forEach(inv => {
        all.push({
          id: `${del.id}::${inv.id}`,
          number: inv.number,
          customer: inv.party,
          date: inv.date,
          dueDate: inv.date,
          amount: inv.subtotal,
          tax: inv.tax,
          total: inv.total,
          paidAmount: inv.paidAmount ?? (inv.status === 'paid' ? inv.total : 0),
          status: inv.status,
          paymentMethod: inv.paymentMethod,
          source: 'delegate' as const,
          delegateName: del.name,
          invoiceType: inv.type as 'sale' | 'purchase',
        })
      })
    })
    return all.sort((a, b) => b.date.localeCompare(a.date))
  }, [delegates])

  // All combined
  const allInvoices = useMemo(() =>
    [...normalizedAdmin, ...normalizedDelegate]
      .sort((a, b) => b.date.localeCompare(a.date)),
  [normalizedAdmin, normalizedDelegate])

  const filtered = useMemo(() => allInvoices.filter(inv => {
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    const matchSource = filterSource === 'all' || inv.source === filterSource
    const q = search.trim()
    const matchSearch = !q || inv.customer.includes(q) || inv.number.includes(q) || (inv.delegateName ?? '').includes(q)
    // Filter by customer if coming from customer profile
    const matchCustomer = !customerFilter || inv.customer === filteredCustomer?.name || inv.customerId === customerFilter
    return matchStatus && matchSource && matchSearch && matchCustomer
  }), [allInvoices, filterStatus, filterSource, search, customerFilter, filteredCustomer])

  const stats = useMemo(() => ({
    total: allInvoices.reduce((s, i) => s + i.total, 0),
    paid: allInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    pending: allInvoices.filter(i => i.status === 'pending' || i.status === 'confirmed').reduce((s, i) => s + i.total, 0),
    overdue: allInvoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0),
  }), [allInvoices])

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  function handlePrintSelected() {
    const sel = filtered.filter(i => selected.includes(i.id))
    if (!sel.length) return
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { toast('يرجى السماح بالنوافذ المنبثقة', 'warn'); return }
    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar">
    <head><meta charset="UTF-8"><title>طباعة الفواتير</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Tajawal',Arial,sans-serif;font-size:13px;color:#111}
    .page{max-width:780px;margin:0 auto;padding:32px;page-break-after:always}
    .hdr{background:#0D1117;color:#fff;padding:20px 28px;display:flex;justify-content:space-between;border-radius:8px 8px 0 0}
    .body{border:1px solid #E5E7EB;border-top:none;padding:20px 28px;border-radius:0 0 8px 8px}
    .tot-row{display:flex;justify-content:space-between;padding:5px 0;font-size:12px}
    .grand{border-top:2px solid #0D1117;padding-top:8px;font-size:14px;font-weight:800}
    @media print{@page{margin:8mm}body{-webkit-print-color-adjust:exact}}</style></head><body>
    ${sel.map(inv => `
      <div class="page">
        <div class="hdr">
          <div><div style="font-size:16px;font-weight:800">شركة سهل التقنية</div>
          <div style="font-size:11px;opacity:.7">الرقم الضريبي: 310123456700003</div>
          ${inv.source === 'delegate' ? `<div style="font-size:11px;opacity:.6">المندوب: ${inv.delegateName}</div>` : ''}</div>
          <div style="text-align:left"><div style="font-size:18px;font-weight:800">فاتورة ضريبية</div>
          <div style="font-size:11px;opacity:.7">${inv.number} | ${inv.date}</div></div>
        </div>
        <div class="body">
          <div style="margin-bottom:16px"><div style="font-weight:700">${inv.customer}</div></div>
          <div style="width:240px;margin-right:auto">
            <div class="tot-row"><span style="color:#6B7280">قبل الضريبة</span><span>${inv.amount.toLocaleString('ar-SA')}</span></div>
            <div class="tot-row"><span style="color:#F59E0B">ضريبة 15%</span><span>${inv.tax.toLocaleString('ar-SA')}</span></div>
            <div class="tot-row grand"><span>الإجمالي</span><span>${inv.total.toLocaleString('ar-SA')}</span></div>
          </div>
        </div>
      </div>`).join('')}
    <script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
    win.document.close()
    toast(`جارٍ طباعة ${sel.length} فاتورة...`, 'success')
    setSelected([])
  }

  return (
    <>
      <PageHeader
        title={filteredCustomer ? `فواتير ${filteredCustomer.name}` : 'الفواتير'}
        subtitle={filteredCustomer ? `${filtered.length} فاتورة` : `${allInvoices.length} فاتورة — ${normalizedAdmin.length} مباشرة + ${normalizedDelegate.length} مناديب`}
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => {
              exportExcel({
                title: 'تقرير الفواتير الموحد',
                filename: `فواتير-${new Date().toISOString().slice(0, 10)}`,
                columns: [
                  { header: 'رقم الفاتورة', key: 'number', width: 18, type: 'text', align: 'center' },
                  { header: 'المصدر', key: 'src', width: 14, type: 'text', align: 'center' },
                  { header: 'المندوب', key: 'delegateName', width: 20, type: 'text' },
                  { header: 'العميل', key: 'customer', width: 28, type: 'text' },
                  { header: 'التاريخ', key: 'date', width: 16, type: 'date', align: 'center' },
                  { header: 'قبل الضريبة', key: 'amount', width: 18, type: 'currency' },
                  { header: 'الضريبة', key: 'tax', width: 14, type: 'currency' },
                  { header: 'الإجمالي', key: 'total', width: 18, type: 'currency' },
                  { header: 'المدفوع', key: 'paidAmount', width: 16, type: 'currency' },
                  { header: 'الحالة', key: 'status', width: 14, type: 'status', align: 'center' },
                ],
                rows: filtered.map(i => ({ ...i, src: i.source === 'admin' ? 'مباشر' : 'مندوب', delegateName: i.delegateName ?? '—' })) as unknown as Record<string, unknown>[],
                totals: { number: '', src: '', delegateName: '', customer: `${filtered.length} فاتورة`, amount: filtered.reduce((s, i) => s + i.amount, 0), tax: filtered.reduce((s, i) => s + i.tax, 0), total: filtered.reduce((s, i) => s + i.total, 0), paidAmount: filtered.reduce((s, i) => s + i.paidAmount, 0) },
              })
              toast('تم تصدير الفواتير بنجاح', 'success')
            }}>
              <i className="fa fa-file-excel" /> تصدير Excel
            </button>
            <Link to="/erp/invoices/new" className="btn btn-primary btn-sm">
              <i className="fa fa-plus" /> فاتورة جديدة
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي الفواتير" value={fmt(stats.total)} dark icon="fa-clipboard-list" />
        <StatCard label="مدفوع" value={fmt(stats.paid)} badge="✓" badgeType="success" icon="fa-check-circle" iconColor="var(--success)" />
        <StatCard label="معلق / مؤكد" value={fmt(stats.pending)} badge="!" badgeType="warn" icon="fa-clock" iconColor="var(--warn)" />
        <StatCard label="متأخر" value={fmt(stats.overdue)} badge="✕" badgeType="danger" icon="fa-exclamation-circle" iconColor="var(--danger)" />
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filter-bar" style={{ marginBottom: 0, flexWrap: 'wrap', gap: 8 }}>
            <div className="search-box" style={{ flex: 1, minWidth: 240 }}>
              <i className="fa fa-search icon" />
              <input placeholder="ابحث برقم الفاتورة أو العميل أو المندوب..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              {([['all','الكل'],['admin','مباشرة'],['delegate','مناديب']] as const).map(([k, v]) => (
                <button key={k} onClick={() => setFilterSource(k)}
                  className={`btn btn-sm ${filterSource === k ? 'btn-primary' : 'btn-outline'}`}>{v}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(['all','paid','pending','confirmed','overdue','draft'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`}>
                  {STATUS_LABELS[s] ?? s}
                </button>
              ))}
            </div>

            {selected.length > 0 && (
              <button className="btn btn-sm" style={{ background: 'var(--blue)', color: '#fff', border: 'none' }} onClick={handlePrintSelected}>
                <i className="fa fa-print" /> طباعة ({selected.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" onChange={e => setSelected(e.target.checked ? filtered.map(i => i.id) : [])} />
                </th>
                <th>رقم الفاتورة</th>
                <th>المصدر</th>
                <th>العميل / الطرف</th>
                <th>التاريخ</th>
                <th>الإجمالي</th>
                <th>المدفوع</th>
                <th>الحالة</th>
                <th>طريقة الدفع</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const remaining = Math.max(0, inv.total - inv.paidAmount)
                return (
                  <tr key={inv.id}>
                    <td><input type="checkbox" checked={selected.includes(inv.id)} onChange={() => toggleSelect(inv.id)} /></td>
                    <td>
                      {inv.source === 'admin' ? (
                        <Link to={`/erp/invoices/${inv.id}`} style={{ color: 'var(--blue)', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>
                          {inv.number}
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--blue)', fontSize: 13 }}>{inv.number}</span>
                      )}
                    </td>
                    <td>
                      {inv.source === 'admin' ? (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'var(--blue-light)', color: 'var(--blue)' }}>
                          <i className="fa fa-building" style={{ marginLeft: 4, fontSize: 10 }} />مباشر
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'var(--success-bg)', color: 'var(--success)' }}>
                          <i className="fa fa-user-tie" style={{ marginLeft: 4, fontSize: 10 }} />{inv.delegateName}
                        </span>
                      )}
                      {inv.invoiceType === 'purchase' && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: 'var(--warn-bg)', color: 'var(--warn)', marginRight: 4 }}>شراء</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{inv.customer}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(inv.date)}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                    <td>
                      <div>
                        <span style={{ fontWeight: 700, color: inv.paidAmount >= inv.total ? 'var(--success)' : inv.paidAmount > 0 ? 'var(--warn)' : 'var(--muted)', fontSize: 13 }}>
                          {fmt(inv.paidAmount)}
                        </span>
                        {remaining > 0 && <div style={{ fontSize: 10, color: 'var(--danger)' }}>متبقي {fmt(remaining)}</div>}
                      </div>
                    </td>
                    <td><StatusBadge status={inv.status as any} /></td>
                    <td>
                      {inv.paymentMethod === 'cash' && <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>نقدي</span>}
                      {inv.paymentMethod === 'credit' && <span style={{ fontSize: 11, color: 'var(--warn)', fontWeight: 700 }}>آجل</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {inv.source === 'admin' && (
                          <Link to={`/erp/invoices/${inv.id}`} className="btn btn-icon btn-outline" title="عرض"><i className="fa fa-eye" /></Link>
                        )}
                        <button className="btn btn-icon btn-outline" title="طباعة" onClick={() => {
                          setSelected([inv.id])
                          setTimeout(handlePrintSelected, 50)
                        }}><i className="fa fa-print" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><i className="fa fa-file-invoice" /></div>
              <div className="empty-state-title">لا توجد فواتير</div>
              <div className="empty-state-sub">
                {search ? `لا توجد نتائج للبحث عن "${search}"` : 'لا توجد فواتير تطابق الفلتر المحدد'}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            عرض {filtered.length} من {allInvoices.length} فاتورة
          </span>
          <div className="pagination">
            <button className="page-btn">‹</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">›</button>
          </div>
        </div>
      </div>
    </>
  )
}
