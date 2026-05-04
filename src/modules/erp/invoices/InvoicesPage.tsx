import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { fmt, fmtDate } from '@/lib/format'
import { INVOICES, INVOICE_STATS } from '@/lib/mock-data/invoices'
import { toast } from '@/lib/toast'

const STATUS_LABELS = { all: 'الكل', paid: 'مدفوع', pending: 'معلق', overdue: 'متأخر', draft: 'مسودة' }

const exportCSV = (data: typeof INVOICES) => {
  const rows = [
    ['رقم الفاتورة','العميل','التاريخ','الاستحقاق','المبلغ','الضريبة','الإجمالي','الحالة'],
    ...data.map(i => [i.number,i.customer,i.date,i.dueDate,i.amount,i.tax,i.total,i.status])
  ]
  const csv = '﻿' + rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'invoices.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<keyof typeof STATUS_LABELS>('all')
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const filtered = INVOICES.filter(inv => {
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    const matchSearch = !search || inv.customer.includes(search) || inv.number.includes(search)
    return matchStatus && matchSearch
  })

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handlePrintSelected = () => {
    if (selected.length === 0) return
    // فتح صفحة طباعة مجمعة
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { toast('يرجى السماح بالنوافذ المنبثقة', 'warn'); return }
    const selectedInvoices = INVOICES.filter(i => selected.includes(i.id))
    win.document.write(`
      <!DOCTYPE html><html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"><title>طباعة الفواتير</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Tajawal',Arial,sans-serif;font-size:13px;background:#fff;color:#111}
        .page{max-width:780px;margin:0 auto;padding:32px;page-break-after:always}
        .page:last-child{page-break-after:auto}
        .hdr{background:#0D1117;color:#fff;padding:20px 28px;display:flex;justify-content:space-between;border-radius:8px 8px 0 0}
        .body{border:1px solid #E5E7EB;border-top:none;padding:20px 28px;border-radius:0 0 8px 8px}
        table{width:100%;border-collapse:collapse;margin:16px 0}
        th{background:#F4F6FA;padding:8px 12px;font-size:11px;text-align:right;border-bottom:2px solid #E5E7EB}
        td{padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;text-align:right}
        .totals{width:240px;margin-right:auto;margin-top:12px}
        .tot-row{display:flex;justify-content:space-between;padding:5px 0;font-size:12px}
        .grand{border-top:2px solid #0D1117;padding-top:8px;font-size:14px;font-weight:800}
        @media print{@page{margin:8mm}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style></head><body>
      ${selectedInvoices.map(inv => `
        <div class="page">
          <div class="hdr">
            <div><div style="font-size:16px;font-weight:800">شركة سهل التقنية</div><div style="font-size:11px;opacity:.7;margin-top:4px">الرقم الضريبي: 310123456700003</div></div>
            <div style="text-align:left"><div style="font-size:18px;font-weight:800">فاتورة ضريبية</div><div style="font-size:11px;opacity:.7">${inv.number} | ${inv.date}</div></div>
          </div>
          <div class="body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px">
              <div><div style="font-size:10px;color:#6B7280;font-weight:700;margin-bottom:4px">فاتورة إلى</div><div style="font-weight:700">${inv.customer}</div><div style="font-size:11px;color:#6B7280">الاستحقاق: ${inv.dueDate}</div></div>
            </div>
            <table><thead><tr><th>#</th><th>الوصف</th><th style="text-align:center">الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
            <tbody>${inv.items.map((it, i) => `<tr><td style="text-align:center;color:#6B7280">${i+1}</td><td>${it.description}</td><td style="text-align:center">${it.qty}</td><td>${it.price.toLocaleString('ar-SA')}</td><td style="font-weight:700">${it.total.toLocaleString('ar-SA')}</td></tr>`).join('')}</tbody></table>
            <div class="totals">
              <div class="tot-row"><span style="color:#6B7280">قبل الضريبة</span><span>${inv.amount.toLocaleString('ar-SA')}</span></div>
              <div class="tot-row"><span style="color:#F59E0B">ضريبة 15%</span><span>${inv.tax.toLocaleString('ar-SA')}</span></div>
              <div class="tot-row grand"><span>الإجمالي</span><span>${inv.total.toLocaleString('ar-SA')}</span></div>
            </div>
          </div>
        </div>
      `).join('')}
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>
    `)
    win.document.close()
    toast(`جارٍ طباعة ${selected.length} فاتورة...`, 'success')
    setSelected([])
  }

  return (
    <>
      <PageHeader
        title="الفواتير"
        subtitle={`${INVOICES.length} فاتورة إجمالية`}
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => { exportCSV(filtered); toast('تم تصدير الفواتير كـ CSV', 'success') }}>
              <i className="fa fa-download" /> تصدير CSV
            </button>
            <Link to="/erp/invoices/new" className="btn btn-primary btn-sm">
              <i className="fa fa-plus" /> فاتورة جديدة
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي الفواتير" value={fmt(INVOICE_STATS.total)} dark icon="fa-clipboard-list" />
        <StatCard label="مدفوع" value={fmt(INVOICE_STATS.paid)} badge="✓" badgeType="success" icon="fa-check-circle" iconColor="var(--success)" />
        <StatCard label="معلق" value={fmt(INVOICE_STATS.pending)} badge="!" badgeType="warn" icon="fa-clock" iconColor="var(--warn)" />
        <StatCard label="متأخر" value={fmt(INVOICE_STATS.overdue)} badge="✕" badgeType="danger" icon="fa-exclamation-circle" iconColor="var(--danger)" />
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-box" style={{ flex: 1, maxWidth: 320 }}>
              <i className="fa fa-search icon" />
              <input
                placeholder="ابحث برقم الفاتورة أو العميل..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              {(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <select className="form-control" style={{ width: 'auto' }}>
              <option>كل الفترات</option>
              <option>هذا الشهر</option>
              <option>الشهر الماضي</option>
              <option>هذا الربع</option>
              <option>هذا العام</option>
            </select>

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
                  <input type="checkbox" onChange={e => setSelected(e.target.checked ? INVOICES.map(i => i.id) : [])} />
                </th>
                <th>رقم الفاتورة</th>
                <th>العميل</th>
                <th>تاريخ الإصدار</th>
                <th>تاريخ الاستحقاق</th>
                <th>المبلغ</th>
                <th>الضريبة</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id}>
                  <td><input type="checkbox" checked={selected.includes(inv.id)} onChange={() => toggleSelect(inv.id)} /></td>
                  <td>
                    <Link to={`/erp/invoices/${inv.id}`} style={{ color: 'var(--blue)', fontWeight: 700 }}>
                      {inv.number}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 600 }}>{inv.customer}</td>
                  <td>{fmtDate(inv.date)}</td>
                  <td style={{ color: inv.status === 'overdue' ? 'var(--danger)' : 'inherit' }}>{fmtDate(inv.dueDate)}</td>
                  <td>{fmt(inv.amount)}</td>
                  <td style={{ color: 'var(--muted)' }}>{fmt(inv.tax)}</td>
                  <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link to={`/erp/invoices/${inv.id}`} className="btn btn-icon btn-outline" title="عرض">
                        <i className="fa fa-eye" />
                      </Link>
                      <button className="btn btn-icon btn-outline" title="طباعة" onClick={() => {
                        window.open(`/erp/invoices/${inv.id}`, '_blank')
                        setTimeout(() => toast('افتح الفاتورة ثم اضغط طباعة', 'info'), 300)
                      }}>
                        <i className="fa fa-print" />
                      </button>
                      <button className="btn btn-icon btn-outline" title="تصدير PDF" onClick={() => toast('افتح الفاتورة ثم اضغط PDF', 'info')}>
                        <i className="fa fa-file-pdf" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><i className="fa fa-file-invoice" /></div>
              <div className="empty-state-title">لا توجد فواتير</div>
              <div className="empty-state-sub">لم يتم العثور على فواتير تطابق بحثك</div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>عرض {filtered.length} من {INVOICES.length} فاتورة</span>
          <div className="pagination">
            <button className="page-btn">‹</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">›</button>
          </div>
        </div>
      </div>

      {/* New Invoice Modal */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="فاتورة جديدة"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
            <button className="btn btn-primary" onClick={() => { toast('تم إنشاء الفاتورة', 'success'); setShowNew(false) }}>حفظ الفاتورة</button>
          </>
        }
      >
        <div className="form-grid-2">
          <div className="form-group"><label className="form-label">العميل</label><select className="form-control"><option>شركة الرياض للتجارة</option></select></div>
          <div className="form-group"><label className="form-label">تاريخ الإصدار</label><input className="form-control" type="date" defaultValue="2025-04-26" /></div>
          <div className="form-group"><label className="form-label">تاريخ الاستحقاق</label><input className="form-control" type="date" /></div>
          <div className="form-group"><label className="form-label">العملة</label><select className="form-control"><option>ريال سعودي (SAR)</option></select></div>
        </div>
        <div className="form-group"><label className="form-label">ملاحظات</label><textarea className="form-control" rows={3} placeholder="ملاحظات الفاتورة..." /></div>
      </Modal>
    </>
  )
}
