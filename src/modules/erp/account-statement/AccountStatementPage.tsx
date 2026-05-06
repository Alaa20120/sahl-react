import { useState, useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { fmt, fmtDate } from '@/lib/format'
import { toast } from '@/lib/toast'
import { useCustomerStore } from '@/store/customer.store'
import { useInvoiceStore } from '@/store/invoice.store'
import { usePurchaseStore } from '@/store/purchase.store'

type StmtTpl = 'formal' | 'compact' | 'detailed'

const STMT_TEMPLATES: { id: StmtTpl; name: string; desc: string; headerBg: string; headerColor: string; accent: string }[] = [
  { id: 'formal',   name: 'رسمي',    desc: 'خلفية داكنة — مناسب للمراسلات الرسمية',  headerBg: '#0D1117',                                headerColor: '#fff',    accent: '#0D1117' },
  { id: 'compact',  name: 'مضغوط',   desc: 'تدرج أزرق — واضح ومختصر',              headerBg: 'linear-gradient(135deg,#1a2035,#2563EB)', headerColor: '#fff',    accent: '#2563EB' },
  { id: 'detailed', name: 'تفصيلي',  desc: 'أبيض مع حدود ملونة — احترافي',         headerBg: '#fff',                                   headerColor: '#111827', accent: '#10B981' },
]

export default function AccountStatementPage() {
  const { customers } = useCustomerStore()
  const { invoices } = useInvoiceStore()
  const { purchases } = usePurchaseStore()

  const defaultTo   = new Date().toISOString().split('T')[0]
  const defaultFrom = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]

  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo]     = useState(defaultTo)
  const [stmtTpl, setStmtTpl] = useState<StmtTpl>('formal')

  const customer = customers.find(c => c.id === customerId)
  const activeTpl = STMT_TEMPLATES.find(t => t.id === stmtTpl) ?? STMT_TEMPLATES[0]

  // Build statement items from real invoices
  const statementItems = useMemo(() => {
    if (!customerId) return []
    const isSupplier = customer?.type === 'supplier'
    const items: { date: string; desc: string; debit: number; credit: number; balance: number; ref: string }[] = []
    let running = 0

    if (isSupplier) {
      // For suppliers: purchases from them
      const supplierPurchases = purchases
        .filter(p => {
          const matchVendor = (p as any).vendor?.toLowerCase().includes(customer?.name.toLowerCase() ?? '') ||
            (p as any).vendorId === customerId
          return matchVendor && p.date >= from && p.date <= to
        })
        .sort((a, b) => a.date.localeCompare(b.date))

      for (const po of supplierPurchases) {
        running += po.total
        items.push({ date: po.date, desc: `فاتورة شراء ${(po as any).number ?? po.id}`, debit: 0, credit: po.total, balance: running, ref: (po as any).number ?? po.id })
        if (po.paid && po.paid > 0) {
          running -= po.paid
          items.push({ date: po.date, desc: `دفعة للمورد — ${(po as any).number ?? po.id}`, debit: po.paid, credit: 0, balance: running, ref: `PMT-${po.id}` })
        }
      }
    } else {
      // For customers: their invoices
      const customerInvoices = invoices
        .filter(inv => inv.customerId === customerId && inv.date >= from && inv.date <= to && inv.status !== 'draft')
        .sort((a, b) => a.date.localeCompare(b.date))

      for (const inv of customerInvoices) {
        running += inv.total
        items.push({ date: inv.date, desc: `فاتورة ${inv.number}`, debit: inv.total, credit: 0, balance: running, ref: inv.number })
        const paid = inv.paidAmount ?? (inv.status === 'paid' ? inv.total : 0)
        if (paid > 0) {
          running -= paid
          items.push({ date: inv.date, desc: `دفعة مستلمة — ${inv.number}`, debit: 0, credit: paid, balance: running, ref: `PMT-${inv.id.slice(-6)}` })
        }
      }
    }

    return items
  }, [customerId, customer, invoices, purchases, from, to])

  const totalDebit  = statementItems.reduce((s, i) => s + i.debit, 0)
  const totalCredit = statementItems.reduce((s, i) => s + i.credit, 0)
  const balance     = statementItems.length > 0 ? statementItems[statementItems.length - 1].balance : 0

  function handlePrint() {
    if (!customer) { toast('يرجى اختيار العميل', 'warn'); return }
    const win = window.open('', '_blank', 'width=860,height=700')
    if (!win) { toast('يرجى السماح بالنوافذ المنبثقة', 'warn'); return }
    const hdrBg = activeTpl.headerBg
    const hdrClr = activeTpl.headerColor
    const isLight = activeTpl.id === 'detailed'
    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar">
    <head><meta charset="UTF-8"><title>كشف حساب — ${customer.name}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Tajawal',Arial,sans-serif;font-size:13px;background:#fff;color:#111827}
      .page{max-width:820px;margin:0 auto}
      .hdr{background:${hdrBg};color:${hdrClr};padding:28px 36px;${isLight?'border-bottom:4px solid '+activeTpl.accent:''}}
      .hdr-inner{display:flex;justify-content:space-between;align-items:flex-start}
      .body{padding:24px 36px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
      .info-box{background:#F4F6FA;border-radius:8px;padding:12px 14px}
      .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
      .sum-box{border-radius:8px;padding:12px 14px;text-align:center}
      table{width:100%;border-collapse:collapse;margin-bottom:16px}
      thead tr{background:#F4F6FA}
      th{padding:9px 12px;font-size:11px;font-weight:700;text-align:right;border-bottom:2px solid #E5E7EB}
      td{padding:9px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;text-align:right}
      tr.total{background:#F4F6FA;font-weight:800}
      .footer{margin-top:28px;padding-top:14px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF}
      @media print{@page{margin:10mm;size:A4}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
    <div class="page">
      <div class="hdr">
        <div class="hdr-inner">
          <div>
            <div style="font-size:20px;font-weight:800">شركة سهل التقنية</div>
            <div style="font-size:11px;opacity:.7;margin-top:4px">الرياض | الرقم الضريبي: 310123456700003</div>
          </div>
          <div style="text-align:left">
            <div style="font-size:22px;font-weight:900">كشف حساب</div>
            <div style="font-size:11px;opacity:.65;margin-top:8px">الفترة: ${from} — ${to}</div>
          </div>
        </div>
      </div>
      <div class="body">
        <div class="info-grid">
          <div class="info-box">
            <div style="font-size:10px;font-weight:700;color:${activeTpl.accent};margin-bottom:6px">العميل</div>
            <div style="font-size:14px;font-weight:700">${customer.name}</div>
            <div style="font-size:11px;color:#6B7280">${customer.phone} | ${customer.email}</div>
          </div>
          <div class="info-box">
            <div style="font-size:10px;font-weight:700;color:${activeTpl.accent};margin-bottom:6px">تفاصيل الكشف</div>
            <div style="font-size:14px;font-weight:700">${from} إلى ${to}</div>
            <div style="font-size:11px;color:#6B7280">${statementItems.length} حركة مالية</div>
          </div>
        </div>
        <div class="summary">
          <div class="sum-box" style="background:#FEF2F2"><div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:4px">إجمالي المدين</div><div style="font-size:16px;font-weight:800;color:#EF4444">${totalDebit.toLocaleString('ar-SA')}</div></div>
          <div class="sum-box" style="background:#ECFDF5"><div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:4px">إجمالي الدائن</div><div style="font-size:16px;font-weight:800;color:#10B981">${totalCredit.toLocaleString('ar-SA')}</div></div>
          <div class="sum-box" style="background:${balance>0?'#FFFBEB':'#ECFDF5'}"><div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:4px">الرصيد الختامي</div><div style="font-size:16px;font-weight:800;color:${balance>0?'#F59E0B':'#10B981'}">${Math.abs(balance).toLocaleString('ar-SA')} ${balance>0?'مدين':'دائن'}</div></div>
        </div>
        <table>
          <thead><tr><th style="width:90px">التاريخ</th><th>البيان</th><th style="width:80px">المرجع</th><th style="width:110px">مدين</th><th style="width:110px">دائن</th><th style="width:110px">الرصيد</th></tr></thead>
          <tbody>
            ${statementItems.map(item => `<tr>
              <td style="font-size:11px;color:#6B7280">${item.date}</td>
              <td>${item.desc}</td>
              <td style="font-size:11px;color:#2563EB">${item.ref}</td>
              <td style="font-weight:700;color:${item.debit>0?'#EF4444':'#9CA3AF'}">${item.debit>0?item.debit.toLocaleString('ar-SA'):'—'}</td>
              <td style="font-weight:700;color:${item.credit>0?'#10B981':'#9CA3AF'}">${item.credit>0?item.credit.toLocaleString('ar-SA'):'—'}</td>
              <td style="font-weight:700;color:${item.balance>0?'#F59E0B':'#10B981'}">${item.balance.toLocaleString('ar-SA')}</td>
            </tr>`).join('')}
            <tr class="total"><td colspan="3">الإجمالي الختامي</td><td style="color:#EF4444">${totalDebit.toLocaleString('ar-SA')}</td><td style="color:#10B981">${totalCredit.toLocaleString('ar-SA')}</td><td style="color:${balance>0?'#F59E0B':'#10B981'}">${Math.abs(balance).toLocaleString('ar-SA')} ${balance>0?'مدين':'دائن'}</td></tr>
          </tbody>
        </table>
        <div class="footer"><div>شركة سهل التقنية — تم الإصدار بنظام سهل ERP</div><div>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</div></div>
      </div>
    </div>
    <script>window.onload=()=>{window.print();}<\/script>
    </body></html>`)
    win.document.close()
    toast(`جارٍ طباعة كشف حساب "${customer.name}"...`, 'info')
  }

  function handleExportCSV() {
    const rows = [['التاريخ','البيان','المرجع','مدين','دائن','الرصيد'],
      ...statementItems.map(i => [i.date, i.desc, i.ref, i.debit, i.credit, i.balance])]
    const csv = '﻿' + rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `كشف-حساب-${customer?.name ?? 'export'}-${from}-${to}.csv`
    a.click()
    toast('تم تصدير الكشف بصيغة CSV', 'success')
  }

  return (
    <>
      <PageHeader
        title="كشف الحساب"
        subtitle="تقرير حركات العميل أو المورد — بيانات حقيقية من الفواتير"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={handleExportCSV}><i className="fa fa-file-csv" /> CSV</button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}><i className="fa fa-print" /> طباعة / PDF</button>
          </div>
        }
      />

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px auto', gap: 14, alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>العميل / المورد</label>
              <select className="form-control" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">اختر...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type === 'customer' ? 'عميل' : c.type === 'supplier' ? 'مورد' : 'عميل/مورد'})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>من تاريخ</label>
              <input className="form-control" type="date" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>إلى تاريخ</label>
              <input className="form-control" type="date" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => {}}>
              <i className="fa fa-search" /> عرض
            </button>
          </div>
        </div>
      </div>

      {/* Template picker */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>
          <i className="fa fa-palette" style={{ marginLeft: 6 }} />قالب الطباعة:
        </span>
        {STMT_TEMPLATES.map(t => (
          <button key={t.id} onClick={() => setStmtTpl(t.id)}
            style={{ padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: `2px solid ${stmtTpl === t.id ? t.accent : 'var(--border)'}`, background: stmtTpl === t.id ? t.accent + '12' : 'var(--card)', color: stmtTpl === t.id ? t.accent : 'var(--muted)', transition: '.15s' }}>
            {stmtTpl === t.id && <i className="fa fa-check" style={{ marginLeft: 6, fontSize: 10 }} />}
            {t.name}
          </button>
        ))}
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>— {activeTpl.desc}</span>
      </div>

      {/* Customer summary */}
      {customer && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 24, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}><i className="fa fa-user" style={{ marginLeft: 4 }} />العميل / المورد</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{customer.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{customer.phone} · {customer.type === 'customer' ? 'عميل' : customer.type === 'supplier' ? 'مورد' : 'عميل ومورد'}</div>
          </div>
          {[
            { label: 'إجمالي المدين', value: fmt(totalDebit), color: 'var(--danger)' },
            { label: 'إجمالي الدائن', value: fmt(totalCredit), color: 'var(--success)' },
            { label: 'الرصيد الختامي', value: fmt(Math.abs(balance)), color: balance > 0 ? 'var(--warn)' : 'var(--success)' },
            { label: 'عدد الحركات', value: String(statementItems.length), color: 'var(--blue)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Statement table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{customer ? `كشف حساب — ${customer.name}` : 'كشف الحساب'}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{from} إلى {to}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 100 }}>التاريخ</th>
                <th>البيان</th>
                <th style={{ width: 120 }}>المرجع</th>
                <th style={{ width: 120 }}>مدين</th>
                <th style={{ width: 120 }}>دائن</th>
                <th style={{ width: 130 }}>الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {statementItems.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                  <i className="fa fa-file-circle-xmark" style={{ fontSize: 24, display: 'block', marginBottom: 8, opacity: .3 }} />
                  لا توجد حركات في هذه الفترة
                </td></tr>
              )}
              {statementItems.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(item.date)}</td>
                  <td style={{ fontSize: 13 }}>{item.desc}</td>
                  <td style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>{item.ref}</td>
                  <td style={{ fontWeight: 700, color: item.debit > 0 ? 'var(--danger)' : 'var(--muted)' }}>
                    {item.debit > 0 ? fmt(item.debit) : '—'}
                  </td>
                  <td style={{ fontWeight: 700, color: item.credit > 0 ? 'var(--success)' : 'var(--muted)' }}>
                    {item.credit > 0 ? fmt(item.credit) : '—'}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: item.balance > 0 ? 'var(--warn)' : item.balance < 0 ? 'var(--success)' : 'var(--muted)' }}>
                      {fmt(Math.abs(item.balance))}
                    </span>
                    {item.balance !== 0 && (
                      <span style={{ fontSize: 10, color: 'var(--muted)', marginRight: 4 }}>
                        {item.balance > 0 ? 'مدين' : 'دائن'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {statementItems.length > 0 && (
                <tr style={{ background: 'var(--bg)', fontWeight: 800 }}>
                  <td colSpan={3} style={{ fontWeight: 800, fontSize: 13 }}>الإجمالي الختامي</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 800 }}>{fmt(totalDebit)}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 800 }}>{fmt(totalCredit)}</td>
                  <td>
                    <span style={{ fontWeight: 800, color: balance > 0 ? 'var(--warn)' : 'var(--success)' }}>
                      {fmt(Math.abs(balance))}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', marginRight: 6 }}>{balance > 0 ? 'مدين' : 'دائن'}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}><i className="fa fa-download" /> تصدير CSV</button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}><i className="fa fa-print" /> طباعة الكشف</button>
        </div>
      </div>
    </>
  )
}
