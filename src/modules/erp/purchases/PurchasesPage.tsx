import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { fmt, fmtDate } from '@/lib/format'
import { PURCHASES, PURCHASE_STATS, type PurchaseStatus } from '@/lib/mock-data/purchases'
import { toast } from '@/lib/toast'

const STATUS_COLORS: Record<PurchaseStatus, string> = {
  received:  'var(--success)',
  pending:   'var(--warn)',
  partial:   'var(--blue)',
  cancelled: 'var(--danger)',
  voided:    'var(--danger)',
}
const STATUS_LABELS: Record<PurchaseStatus, string> = {
  received:  'مستلمة',
  pending:   'معلقة',
  partial:   'جزئية',
  cancelled: 'ملغاة',
  voided:    'مسترجعة',
}

const exportCSV = (data: typeof PURCHASES) => {
  const rows = [
    ['رقم الأمر','التاريخ','المورد','الأصناف','قبل الضريبة','الضريبة','الإجمالي','المدفوع','المتبقي','الحالة'],
    ...data.map(p => [p.id, p.date, p.supplier, p.itemCount, p.amount, p.tax, p.total, p.paid, p.total - p.paid, p.status]),
  ]
  const csv = '﻿' + rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'purchases.csv'; a.click()
  URL.revokeObjectURL(url)
}

const handlePrintSelected = (selected: string[]) => {
  if (selected.length === 0) return
  const selectedPOs = PURCHASES.filter(p => selected.includes(p.id))
  const win = window.open('', '_blank', 'width=920,height=760')
  if (!win) { toast('يرجى السماح بالنوافذ المنبثقة', 'warn'); return }
  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"><title>طباعة أوامر الشراء</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Tajawal',Arial,sans-serif;font-size:13px;background:#fff;color:#111}
  .page{max-width:800px;margin:0 auto;padding:32px;page-break-after:always}
  .page:last-child{page-break-after:auto}
  .hdr{background:#0D1117;color:#fff;padding:20px 28px;display:flex;justify-content:space-between;border-radius:8px 8px 0 0}
  .body{border:1px solid #E5E7EB;border-top:none;padding:20px 28px;border-radius:0 0 8px 8px}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  th{background:#F4F6FA;padding:8px 12px;font-size:11px;text-align:right;border-bottom:2px solid #E5E7EB}
  td{padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;text-align:right}
  .totals{width:260px;margin-right:auto;margin-top:12px}
  .tot-row{display:flex;justify-content:space-between;padding:5px 0;font-size:12px}
  .grand{border-top:2px solid #0D1117;padding-top:8px;font-size:14px;font-weight:800}
  @media print{@page{margin:8mm}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
${selectedPOs.map(po => `
  <div class="page">
    <div class="hdr">
      <div><div style="font-size:16px;font-weight:800">شركة سهل التقنية</div><div style="font-size:11px;opacity:.7;margin-top:4px">الرقم الضريبي: 310123456700003</div></div>
      <div style="text-align:left"><div style="font-size:18px;font-weight:800">أمر شراء</div><div style="font-size:11px;opacity:.7">${po.id} | ${po.date}</div></div>
    </div>
    <div class="body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px">
        <div><div style="font-size:10px;color:#6B7280;font-weight:700;margin-bottom:4px">المورد</div><div style="font-weight:700">${po.supplier}</div><div style="font-size:11px;color:#6B7280">الاستحقاق: ${po.dueDate}</div></div>
        <div><div style="font-size:10px;color:#6B7280;font-weight:700;margin-bottom:4px">الحالة</div><div style="font-weight:700">${STATUS_LABELS[po.status]}</div></div>
      </div>
      <table><thead><tr><th>#</th><th>الوصف</th><th style="text-align:center">الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
      <tbody>${po.lineItems.map((it, i) => `<tr><td style="text-align:center;color:#6B7280">${i + 1}</td><td>${it.description}</td><td style="text-align:center">${it.qty}</td><td>${it.price.toLocaleString('ar-SA')}</td><td style="font-weight:700">${it.total.toLocaleString('ar-SA')}</td></tr>`).join('')}</tbody></table>
      <div class="totals">
        <div class="tot-row"><span style="color:#6B7280">قبل الضريبة</span><span>${po.amount.toLocaleString('ar-SA')}</span></div>
        <div class="tot-row"><span style="color:#F59E0B">ضريبة 15%</span><span>${po.tax.toLocaleString('ar-SA')}</span></div>
        <div class="tot-row grand"><span>الإجمالي</span><span>${po.total.toLocaleString('ar-SA')}</span></div>
      </div>
    </div>
  </div>
`).join('')}
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`)
  win.document.close()
  toast(`جارٍ طباعة ${selected.length} أمر شراء...`, 'success')
}

export default function PurchasesPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | PurchaseStatus>('all')
  const [search, setSearch]             = useState('')
  const [showNew, setShowNew]           = useState(false)
  const [selected, setSelected]         = useState<string[]>([])

  const filtered = PURCHASES.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchSearch = !search || p.supplier.includes(search) || p.id.includes(search)
    return matchStatus && matchSearch
  })

  const remaining  = (p: typeof PURCHASES[0]) => p.total - p.paid
  const paidPct    = (p: typeof PURCHASES[0]) => Math.round((p.paid / p.total) * 100)
  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <>
      <PageHeader
        title="أوامر الشراء"
        subtitle="متابعة المشتريات والموردين"
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => { exportCSV(filtered); toast('تم تصدير الأوامر كـ CSV', 'success') }}>
              <i className="fa fa-download" /> تصدير CSV
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
              <i className="fa fa-plus" /> أمر شراء جديد
            </button>
          </>
        }
      />

      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="إجمالي المشتريات" value={fmt(PURCHASE_STATS.total)} dark icon="fa-shopping-cart" />
        <StatCard label="المدفوع" value={fmt(PURCHASE_STATS.paid)} badge="✓" badgeType="success" icon="fa-check-circle" iconColor="var(--success)" />
        <StatCard label="المتبقي" value={fmt(PURCHASE_STATS.pending)} badge="!" badgeType="warn" icon="fa-clock" iconColor="var(--warn)" />
        <StatCard label="عدد الموردين" value={String(PURCHASE_STATS.suppliersCount)} icon="fa-industry" iconColor="var(--blue)" />
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body" style={{ padding: '12px 20px' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-box" style={{ flex: 1, maxWidth: 300 }}>
              <i className="fa fa-search icon" />
              <input
                placeholder="ابحث برقم الأمر أو المورد..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {(['all','received','pending','partial','cancelled'] as (typeof statusFilter)[]).map(k => (
              <button key={k} onClick={() => setStatusFilter(k)} className={`btn btn-sm ${statusFilter === k ? 'btn-primary' : 'btn-outline'}`}>
                {k === 'all' ? 'الكل' : STATUS_LABELS[k]}
              </button>
            ))}
            {selected.length > 0 && (
              <button
                className="btn btn-sm"
                style={{ background: 'var(--blue)', color: '#fff', border: 'none' }}
                onClick={() => { handlePrintSelected(selected); setSelected([]) }}
              >
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
                  <input
                    type="checkbox"
                    onChange={e => setSelected(e.target.checked ? PURCHASES.map(p => p.id) : [])}
                    checked={selected.length === PURCHASES.length && PURCHASES.length > 0}
                  />
                </th>
                <th>رقم الأمر</th>
                <th>التاريخ</th>
                <th>المورد</th>
                <th>الأصناف</th>
                <th>الإجمالي</th>
                <th>المدفوع</th>
                <th>المتبقي</th>
                <th>نسبة السداد</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(po => (
                <tr key={po.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(po.id)}
                      onChange={() => toggleSelect(po.id)}
                    />
                  </td>
                  <td>
                    <Link to={`/erp/purchases/${po.id}`} style={{ color: 'var(--blue)', fontWeight: 700 }}>
                      {po.id}
                    </Link>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(new Date(po.date))}</td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{po.supplier}</td>
                  <td style={{ textAlign: 'center' }}>{po.itemCount}</td>
                  <td style={{ fontWeight: 700 }}>{fmt(po.total)}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(po.paid)}</td>
                  <td style={{ color: remaining(po) > 0 ? 'var(--danger)' : 'var(--muted)', fontWeight: 600 }}>
                    {fmt(remaining(po))}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${paidPct(po)}%`, background: paidPct(po) === 100 ? 'var(--success)' : 'var(--blue)', borderRadius: 3, transition: 'width .3s' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', minWidth: 30 }}>{paidPct(po)}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[po.status], background: STATUS_COLORS[po.status] + '15', padding: '2px 8px', borderRadius: 6 }}>
                      {STATUS_LABELS[po.status]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link to={`/erp/purchases/${po.id}`} className="btn btn-icon btn-outline" title="عرض">
                        <i className="fa fa-eye" />
                      </Link>
                      <button
                        className="btn btn-icon btn-outline"
                        title="طباعة"
                        onClick={() => { handlePrintSelected([po.id]) }}
                      >
                        <i className="fa fa-print" />
                      </button>
                      <button
                        className="btn btn-icon btn-outline"
                        title="تصدير PDF"
                        onClick={() => toast('افتح الأمر ثم اضغط PDF', 'info')}
                      >
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
              <div className="empty-state-icon"><i className="fa fa-shopping-cart" /></div>
              <div className="empty-state-title">لا توجد أوامر شراء</div>
              <div className="empty-state-sub">لم يتم العثور على أوامر تطابق بحثك</div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>عرض {filtered.length} من {PURCHASES.length} أمر</span>
          <div className="pagination">
            <button className="page-btn">‹</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">›</button>
          </div>
        </div>
      </div>

      {/* New PO Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="أمر شراء جديد">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>المورد</label>
            <input className="form-control" placeholder="اسم المورد أو اختر من القائمة..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>تاريخ الأمر</label>
              <input className="form-control" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>تاريخ الاستلام المتوقع</label>
              <input className="form-control" type="date" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>ملاحظات</label>
            <textarea className="form-control" rows={3} placeholder="ملاحظات الأمر..." style={{ resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { toast('تم إنشاء أمر الشراء', 'success'); setShowNew(false) }}>إنشاء</button>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
