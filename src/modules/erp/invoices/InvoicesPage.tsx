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
import { useAppStore } from '@/store/app.store'

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
  const co = useAppStore(s => s.company)
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
    const win = window.open('', '_blank', 'width=960,height=800')
    if (!win) { toast('يرجى السماح بالنوافذ المنبثقة', 'warn'); return }

    // Get items for each invoice
    const getItems = (inv: typeof sel[0]) => {
      if (inv.source === 'admin') {
        const orig = adminInvoices.find(a => a.id === inv.id)
        return orig?.items || []
      } else {
        const [delId, invId] = inv.id.split('::')
        const del = delegates.find(d => d.id === delId)
        return del?.invoices.find(i => i.id === invId)?.items || []
      }
    }

    const f = (n: number) => n.toLocaleString('ar-SA', { minimumFractionDigits: 2 })

    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar">
    <head><meta charset="UTF-8"><title>فاتورة ضريبية</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Tajawal',Arial,sans-serif;font-size:13px;color:#111;background:#f4f6fa}
    .page{max-width:800px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.1);page-break-after:always}
    .hdr{background:#0D1117;color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start}
    .hdr-co{font-size:18px;font-weight:800;margin-bottom:4px}
    .hdr-sub{font-size:11px;opacity:.65;line-height:1.8}
    .hdr-right{text-align:left}
    .inv-title{font-size:22px;font-weight:900}
    .inv-meta{font-size:11px;opacity:.7;margin-top:6px;line-height:1.8}
    .body{padding:24px 32px}
    .party-box{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
    .party-card{background:#f8fafc;border-radius:8px;padding:14px 16px}
    .party-label{font-size:10px;font-weight:700;color:#2563EB;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
    .party-name{font-size:15px;font-weight:800}
    .party-info{font-size:11px;color:#6B7280;margin-top:4px;line-height:1.7}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#f4f6fa;padding:10px 14px;font-size:11px;font-weight:800;text-align:right;border-bottom:2px solid #E5E7EB;color:#374151}
    td{padding:10px 14px;border-bottom:1px solid #F3F4F6;font-size:13px}
    .totals{width:280px;margin-right:auto;margin-top:8px}
    .tot-row{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #F3F4F6}
    .tot-grand{border-bottom:none;border-top:2px solid #0D1117;padding-top:10px;font-size:16px;font-weight:900}
    .badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700}
    .paid{background:#ECFDF5;color:#065F46}.pending{background:#FFFBEB;color:#92400E}.overdue{background:#FEF2F2;color:#991B1B}
    .footer{margin-top:20px;padding-top:12px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF}
    @media print{@page{margin:8mm;size:A4}body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{margin:0;box-shadow:none;border-radius:0}}
    </style></head><body>
    ${sel.map(inv => {
      const items = getItems(inv)
      const creator = inv.source === 'delegate' ? `المندوب: ${inv.delegateName}` : 'الإدارة'
      const statusClass = inv.status === 'paid' ? 'paid' : inv.status === 'overdue' ? 'overdue' : 'pending'
      const statusLabel = inv.status === 'paid' ? 'مدفوعة' : inv.status === 'overdue' ? 'متأخرة' : inv.status === 'partial' ? 'جزئية' : inv.status === 'confirmed' ? 'مؤكدة' : 'معلقة'
      return `
      <div class="page">
        <div class="hdr">
          <div>
            <div class="hdr-co">${co.name || 'اسم الشركة'}</div>
            ${co.nameEn ? `<div style="font-size:11px;opacity:.6">${co.nameEn}</div>` : ''}
            <div class="hdr-sub">
              ${co.vat ? `الرقم الضريبي: ${co.vat}<br>` : ''}
              ${co.phone ? `ج: ${co.phone}<br>` : ''}
              ${co.address ? `${co.address}، ${co.city}` : ''}
            </div>
          </div>
          <div class="hdr-right">
            <div class="inv-title">فاتورة ضريبية</div>
            <div class="inv-meta">
              رقم الفاتورة: ${inv.number}<br>
              التاريخ: ${inv.date}<br>
              المُصدِر: ${creator}<br>
              <span class="badge ${statusClass}">${statusLabel}</span>
            </div>
          </div>
        </div>
        <div class="body">
          <div class="party-box">
            <div class="party-card">
              <div class="party-label">فاتورة إلى</div>
              <div class="party-name">${inv.customer}</div>
            </div>
            <div class="party-card">
              <div class="party-label">بيانات الدفع</div>
              <div style="font-size:12px;font-weight:700">${inv.paymentMethod === 'cash' ? '💵 نقدي — مدفوع فوراً' : '📋 آجل — مؤجل الدفع'}</div>
              <div style="font-size:11px;color:#6B7280;margin-top:4px">المدفوع: ${f(inv.paidAmount)} | المتبقي: ${f(Math.max(0, inv.total - inv.paidAmount))}</div>
            </div>
          </div>
          ${items.length > 0 ? `
          <table>
            <thead><tr><th>#</th><th>الصنف / الوصف</th><th style="text-align:center">الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
            <tbody>
              ${items.map((it: any, idx: number) => `
                <tr>
                  <td style="color:#9CA3AF;font-size:11px">${idx+1}</td>
                  <td style="font-weight:600">${it.description || it.desc || '—'}</td>
                  <td style="text-align:center;font-weight:700">${it.qty}</td>
                  <td>${f(it.price)}</td>
                  <td style="font-weight:700">${f(it.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : `<div style="text-align:center;padding:20px;color:#9CA3AF;font-size:12px">لا تتوفر بيانات الأصناف</div>`}
          <div class="totals">
            <div class="tot-row"><span style="color:#6B7280">قبل الضريبة</span><span style="font-weight:600">${f(inv.amount)}</span></div>
            <div class="tot-row"><span style="color:#F59E0B">ضريبة 15%</span><span style="color:#F59E0B;font-weight:600">${f(inv.tax)}</span></div>
            <div class="tot-row tot-grand"><span>الإجمالي</span><span style="color:#0D1117">${f(inv.total)}</span></div>
          </div>
          <div class="footer">
            <span>تم الإصدار بواسطة نظام سهل ERP</span>
            <span>${new Date().toLocaleDateString('ar-SA')}</span>
          </div>
        </div>
      </div>`
    }).join('')}
    <script>window.onload=()=>{window.print()}<\/script></body></html>`)
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
