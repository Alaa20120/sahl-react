import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { fmt, fmtDate } from '@/lib/format'
import { CUSTOMERS } from '@/lib/mock-data/customers'
import { toast } from '@/lib/toast'

type StmtTpl = 'formal' | 'compact' | 'detailed'

const STMT_TEMPLATES: { id: StmtTpl; name: string; desc: string; headerBg: string; headerColor: string; accent: string }[] = [
  { id: 'formal',   name: 'رسمي',    desc: 'خلفية داكنة — مناسب للمراسلات الرسمية',  headerBg: '#0D1117',                                headerColor: '#fff',    accent: '#0D1117' },
  { id: 'compact',  name: 'مضغوط',   desc: 'تدرج أزرق — واضح ومختصر',              headerBg: 'linear-gradient(135deg,#1a2035,#2563EB)', headerColor: '#fff',    accent: '#2563EB' },
  { id: 'detailed', name: 'تفصيلي',  desc: 'أبيض مع حدود ملونة — احترافي وقابل للقراءة', headerBg: '#fff',                               headerColor: '#111827', accent: '#10B981' },
]

const STATEMENT_ITEMS = [
  { date: '2025-04-01', desc: 'رصيد مرحّل من الفترة السابقة', debit: 0,     credit: 0,     balance: 54050, ref: '' },
  { date: '2025-04-03', desc: 'فاتورة رقم INV-2025-006',       debit: 11270, credit: 0,     balance: 65320, ref: 'INV-2025-006' },
  { date: '2025-04-10', desc: 'دفعة مستلمة — تحويل بنكي',      debit: 0,     credit: 25000, balance: 40320, ref: 'TXN-040' },
  { date: '2025-04-12', desc: 'فاتورة رقم INV-2025-008',       debit: 7475,  credit: 0,     balance: 47795, ref: 'INV-2025-008' },
  { date: '2025-04-16', desc: 'دفعة مستلمة — تحويل بنكي',      debit: 0,     credit: 7475,  balance: 40320, ref: 'TXN-041' },
  { date: '2025-04-20', desc: 'فاتورة رقم INV-2025-009',       debit: 14375, credit: 0,     balance: 54695, ref: 'INV-2025-009' },
]

function printStatement(customer: typeof CUSTOMERS[0], items: typeof STATEMENT_ITEMS, from: string, to: string, tpl: typeof STMT_TEMPLATES[0], totalDebit: number, totalCredit: number, balance: number) {
  const win = window.open('', '_blank', 'width=860,height=700')
  if (!win) { toast('يرجى السماح بالنوافذ المنبثقة', 'warn'); return }

  const isLight = tpl.id === 'detailed'
  const hdrBg   = tpl.headerBg
  const hdrClr  = tpl.headerColor

  win.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar">
  <head><meta charset="UTF-8"><title>كشف حساب — ${customer.name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Tajawal',Arial,sans-serif;font-size:13px;background:#fff;color:#111827}
    .page{max-width:820px;margin:0 auto;padding:0}
    .hdr{background:${hdrBg};color:${hdrClr};padding:28px 36px;${isLight ? 'border-bottom:4px solid '+tpl.accent : ''}}
    .hdr-inner{display:flex;justify-content:space-between;align-items:flex-start}
    .co-name{font-size:20px;font-weight:800;margin-bottom:4px}
    .co-sub{font-size:11px;opacity:.7;line-height:1.8}
    .doc-title{font-size:22px;font-weight:900;text-align:left}
    .doc-sub{font-size:11px;opacity:.65;text-align:left;margin-top:4px}
    .body{padding:24px 36px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
    .info-box{background:#F4F6FA;border-radius:8px;padding:12px 14px}
    .info-label{font-size:10px;font-weight:700;color:${tpl.accent};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
    .info-val{font-size:14px;font-weight:700}
    .info-sub{font-size:11px;color:#6B7280;margin-top:2px}
    .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
    .sum-box{border-radius:8px;padding:12px 14px;text-align:center}
    .sum-label{font-size:10px;font-weight:700;color:#6B7280;margin-bottom:4px}
    .sum-val{font-size:16px;font-weight:800}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    thead tr{background:#F4F6FA}
    th{padding:9px 12px;font-size:11px;font-weight:700;text-align:right;border-bottom:2px solid #E5E7EB}
    td{padding:9px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;text-align:right;vertical-align:middle}
    tr.opening{background:#FFFBEB}
    tr.total{background:#F4F6FA;font-weight:800}
    .footer{margin-top:28px;padding-top:14px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF}
    .stamp{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px}
    .stamp-box{border-top:1px solid #D1D5DB;padding-top:8px;text-align:center;font-size:11px;color:#6B7280}
    @media print{@page{margin:10mm;size:A4}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <div class="page">
    <div class="hdr">
      <div class="hdr-inner">
        <div>
          <div class="co-name">شركة سهل التقنية</div>
          <div class="co-sub">الرياض، حي العليا، شارع التحلية<br>ج: 0112345678 | info@sahl.sa<br>الرقم الضريبي: 310123456700003</div>
        </div>
        <div>
          <div class="doc-title">كشف حساب</div>
          <div class="doc-sub">Account Statement</div>
          <div style="margin-top:12px;font-size:12px;text-align:left;opacity:.85">
            <div>الفترة: ${from} — ${to}</div>
            <div>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="body">
      <div class="info-grid">
        <div class="info-box">
          <div class="info-label">العميل / المورد</div>
          <div class="info-val">${customer.name}</div>
          <div class="info-sub">${customer.phone} | ${customer.email}</div>
        </div>
        <div class="info-box">
          <div class="info-label">تفاصيل الكشف</div>
          <div class="info-val">${from} إلى ${to}</div>
          <div class="info-sub">عدد الحركات: ${items.length} حركة</div>
        </div>
      </div>

      <div class="summary">
        <div class="sum-box" style="background:#FEF2F2">
          <div class="sum-label">إجمالي المدين</div>
          <div class="sum-val" style="color:#EF4444">${totalDebit.toLocaleString('ar-SA')}</div>
        </div>
        <div class="sum-box" style="background:#ECFDF5">
          <div class="sum-label">إجمالي الدائن</div>
          <div class="sum-val" style="color:#10B981">${totalCredit.toLocaleString('ar-SA')}</div>
        </div>
        <div class="sum-box" style="background:${balance > 0 ? '#FFFBEB' : '#ECFDF5'}">
          <div class="sum-label">الرصيد الختامي</div>
          <div class="sum-val" style="color:${balance > 0 ? '#F59E0B' : '#10B981'}">${Math.abs(balance).toLocaleString('ar-SA')} ${balance > 0 ? 'مدين' : 'دائن'}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:90px">التاريخ</th>
            <th>البيان</th>
            <th style="width:80px">المرجع</th>
            <th style="width:110px">مدين</th>
            <th style="width:110px">دائن</th>
            <th style="width:110px">الرصيد</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, i) => `
            <tr class="${i === 0 ? 'opening' : ''}">
              <td style="font-size:11px;color:#6B7280">${item.date}</td>
              <td style="font-weight:${i === 0 ? '700' : '400'}">${item.desc}</td>
              <td style="font-size:11px;color:#2563EB">${item.ref}</td>
              <td style="font-weight:700;color:${item.debit > 0 ? '#EF4444' : '#9CA3AF'}">${item.debit > 0 ? item.debit.toLocaleString('ar-SA') : '—'}</td>
              <td style="font-weight:700;color:${item.credit > 0 ? '#10B981' : '#9CA3AF'}">${item.credit > 0 ? item.credit.toLocaleString('ar-SA') : '—'}</td>
              <td style="font-weight:700;color:${item.balance > 0 ? '#F59E0B' : '#10B981'}">${item.balance.toLocaleString('ar-SA')}</td>
            </tr>
          `).join('')}
          <tr class="total">
            <td colspan="3">الإجمالي</td>
            <td style="color:#EF4444">${totalDebit.toLocaleString('ar-SA')}</td>
            <td style="color:#10B981">${totalCredit.toLocaleString('ar-SA')}</td>
            <td style="color:${balance > 0 ? '#F59E0B' : '#10B981'}">${Math.abs(balance).toLocaleString('ar-SA')}</td>
          </tr>
        </tbody>
      </table>

      <div class="stamp">
        <div class="stamp-box">توقيع المدير المالي</div>
        <div class="stamp-box">ختم الشركة</div>
      </div>

      <div class="footer">
        <div>شركة سهل التقنية — الرقم التجاري: 1234567890</div>
        <div>تم الإصدار بنظام سهل ERP</div>
      </div>
    </div>
  </div>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`)
  win.document.close()
}

export default function AccountStatementPage() {
  const [customerId, setCustomerId] = useState(CUSTOMERS[0]?.id ?? '')
  const [from, setFrom] = useState('2025-04-01')
  const [to, setTo]     = useState(new Date().toISOString().split('T')[0])
  const [stmtTpl, setStmtTpl] = useState<StmtTpl>('formal')

  const customer     = CUSTOMERS.find(c => c.id === customerId)
  const totalDebit   = STATEMENT_ITEMS.reduce((s, i) => s + i.debit,  0)
  const totalCredit  = STATEMENT_ITEMS.reduce((s, i) => s + i.credit, 0)
  const balance      = STATEMENT_ITEMS[STATEMENT_ITEMS.length - 1]?.balance ?? 0
  const activeTpl    = STMT_TEMPLATES.find(t => t.id === stmtTpl) ?? STMT_TEMPLATES[0]

  const handlePrint = () => {
    if (!customer) { toast('يرجى اختيار العميل', 'warn'); return }
    printStatement(customer, STATEMENT_ITEMS, from, to, activeTpl, totalDebit, totalCredit, balance)
    toast(`جارٍ طباعة كشف حساب "${customer.name}"...`, 'info')
  }

  const handleExportCSV = () => {
    const rows = [['التاريخ','البيان','المرجع','مدين','دائن','الرصيد'],
      ...STATEMENT_ITEMS.map(i => [i.date, i.desc, i.ref, i.debit, i.credit, i.balance])]
    const csv = '﻿' + rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `statement-${customer?.name ?? 'export'}.csv`
    a.click()
    toast('تم تصدير الكشف بصيغة CSV', 'success')
  }

  return (
    <>
      <PageHeader
        title="كشف الحساب"
        subtitle="تقرير حركات العميل أو المورد"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
              <i className="fa fa-file-csv" /> CSV
            </button>
            <button className="btn btn-outline btn-sm" onClick={handlePrint}>
              <i className="fa fa-print" /> طباعة
            </button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <i className="fa fa-file-pdf" /> PDF
            </button>
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
                {CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            <button className="btn btn-primary" onClick={() => toast('تم تحديث الكشف', 'success')}>
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
          <button
            key={t.id}
            onClick={() => setStmtTpl(t.id)}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              border: `2px solid ${stmtTpl === t.id ? t.accent : 'var(--border)'}`,
              background: stmtTpl === t.id ? t.accent + '12' : 'var(--card)',
              color: stmtTpl === t.id ? t.accent : 'var(--muted)',
              transition: '.15s',
            }}
          >
            {stmtTpl === t.id && <i className="fa fa-check" style={{ marginLeft: 6, fontSize: 10 }} />}
            {t.name}
          </button>
        ))}
        <span style={{ fontSize: 11, color: 'var(--muted)', marginRight: 4 }}>— {activeTpl.desc}</span>
      </div>

      {/* Customer summary bar */}
      {customer && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
          padding: '16px 20px', marginBottom: 16,
          display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 24, alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>
              <i className="fa fa-user" style={{ marginLeft: 4 }} />العميل
            </div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{customer.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{customer.phone}</div>
          </div>
          {[
            { label: 'إجمالي المدين', value: fmt(totalDebit),   color: 'var(--danger)' },
            { label: 'إجمالي الدائن', value: fmt(totalCredit),  color: 'var(--success)' },
            { label: 'الرصيد الختامي', value: fmt(Math.abs(balance)), color: balance > 0 ? 'var(--warn)' : 'var(--success)' },
            { label: 'عدد الحركات', value: String(STATEMENT_ITEMS.length), color: 'var(--blue)' },
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
          <span className="card-title">
            {customer ? `كشف حساب — ${customer.name}` : 'كشف الحساب'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{from} إلى {to}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 100 }}>التاريخ</th>
                <th>البيان</th>
                <th style={{ width: 110 }}>المرجع</th>
                <th style={{ width: 120 }}>مدين</th>
                <th style={{ width: 120 }}>دائن</th>
                <th style={{ width: 120 }}>الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {STATEMENT_ITEMS.map((item, i) => (
                <tr key={i} style={{ background: i === 0 ? 'var(--warn-bg)' : undefined }}>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(new Date(item.date))}</td>
                  <td style={{ fontWeight: i === 0 ? 700 : 400, fontSize: 13 }}>{item.desc}</td>
                  <td style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>{item.ref}</td>
                  <td style={{ fontWeight: 700, color: item.debit > 0 ? 'var(--danger)' : 'var(--muted)' }}>
                    {item.debit > 0 ? fmt(item.debit) : '—'}
                  </td>
                  <td style={{ fontWeight: 700, color: item.credit > 0 ? 'var(--success)' : 'var(--muted)' }}>
                    {item.credit > 0 ? fmt(item.credit) : '—'}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: item.balance > 0 ? 'var(--warn)' : 'var(--success)' }}>
                      {fmt(Math.abs(item.balance))}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--muted)', marginRight: 4 }}>
                      {item.balance > 0 ? 'مدين' : item.balance < 0 ? 'دائن' : ''}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg)', fontWeight: 800 }}>
                <td colSpan={3} style={{ fontWeight: 800, fontSize: 13 }}>الإجمالي الختامي</td>
                <td style={{ color: 'var(--danger)', fontWeight: 800 }}>{fmt(totalDebit)}</td>
                <td style={{ color: 'var(--success)', fontWeight: 800 }}>{fmt(totalCredit)}</td>
                <td>
                  <span style={{ fontWeight: 800, color: balance > 0 ? 'var(--warn)' : 'var(--success)' }}>
                    {fmt(Math.abs(balance))}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginRight: 6 }}>
                    {balance > 0 ? 'مدين' : 'دائن'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
            <i className="fa fa-download" /> تصدير CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <i className="fa fa-print" /> طباعة الكشف
          </button>
        </div>
      </div>
    </>
  )
}
