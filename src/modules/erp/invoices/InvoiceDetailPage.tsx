import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Modal from '@/components/ui/Modal'
import ZATCAQRCode from '@/components/ui/ZATCAQRCode'
import { fmt, fmtDate } from '@/lib/format'
import { type Invoice, type InvoiceStatus } from '@/lib/mock-data/invoices'
import { useInvoiceStore } from '@/store/invoice.store'
import { useInventoryStore } from '@/store/inventory.store'
import { useCustomerStore } from '@/store/customer.store'
import { useAppStore } from '@/store/app.store'
import { toast } from '@/lib/toast'

type TplId = 'classic' | 'modern' | 'clean' | 'minimal' | 'bold'
const TEMPLATE_KEY = 'sahl-inv-template'
const getTemplate = () => (localStorage.getItem(TEMPLATE_KEY) as TplId) ?? 'classic'

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  paid: 'var(--success)', partial: 'var(--blue)', confirmed: 'var(--primary)', pending: 'var(--warn)', overdue: 'var(--danger)', draft: 'var(--muted)', returned: 'var(--danger)',
}
const STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: 'مدفوع', partial: 'جزئي', confirmed: 'مؤكد', pending: 'معلق', overdue: 'متأخر', draft: 'مسودة', returned: 'مرتجع',
}

const TEMPLATES: { id: TplId; name: string; headerBg: string; headerColor: string; accentColor: string; borderTop?: string }[] = [
  { id: 'classic',  name: 'كلاسيكي',  headerBg: '#0D1117',                                headerColor: '#fff',    accentColor: '#0D1117' },
  { id: 'modern',   name: 'عصري',     headerBg: 'linear-gradient(135deg,#1a2035,#2563EB)', headerColor: '#fff',    accentColor: '#2563EB' },
  { id: 'clean',    name: 'نظيف',     headerBg: '#ffffff',                                headerColor: '#111827', accentColor: '#0D1117', borderTop: '4px solid #0D1117' },
  { id: 'minimal',  name: 'بسيط',     headerBg: '#F4F6FA',                                headerColor: '#111827', accentColor: '#2563EB', borderTop: '3px solid #2563EB' },
  { id: 'bold',     name: 'جريء',     headerBg: 'linear-gradient(135deg,#7C3AED,#2563EB)', headerColor: '#fff',    accentColor: '#7C3AED' },
]

function openPrintWindow(
  invoice: Invoice,
  status: InvoiceStatus,
  tpl: typeof TEMPLATES[0],
  isVoided: boolean,
  co?: { name: string; nameEn: string; vat: string; cr: string; phone: string; email: string; address: string; city: string },
) {
  const win = window.open('', '_blank', 'width=920,height=760')
  if (!win) { toast('يرجى السماح بالنوافذ المنبثقة', 'warn'); return }

  const hdrBg   = tpl.headerBg
  const hdrClr  = tpl.headerColor
  const accent  = tpl.accentColor
  const isLight = tpl.id === 'clean' || tpl.id === 'minimal'

  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>فاتورة ${invoice.number}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Tajawal',Arial,sans-serif;font-size:13px;background:#F8FAFC;color:#111827;direction:rtl}
  .page{max-width:860px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;${tpl.borderTop ? `border-top:${tpl.borderTop}` : ''}}
  .hdr{background:${hdrBg};color:${hdrClr};padding:28px 40px;display:flex;justify-content:space-between;align-items:flex-start}
  .company-name{font-size:20px;font-weight:900}
  .company-sub{font-size:11px;opacity:.7;margin-top:3px}
  .company-info{font-size:12px;opacity:.75;line-height:1.8;margin-top:10px}
  .inv-title{font-size:26px;font-weight:900;text-align:left}
  .inv-title-sub{font-size:12px;opacity:.65;margin-top:2px;text-align:left}
  .inv-meta{font-size:13px;line-height:2;opacity:.9;text-align:left;margin-top:14px}
  .body{padding:28px 40px}
  .bill-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:24px}
  .info-box{background:#F8FAFC;border-radius:10px;padding:14px 16px}
  .info-label{font-size:10px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  th{background:#F4F6FA;padding:10px 14px;font-size:11px;font-weight:800;text-align:right;border-bottom:2px solid #E5E7EB;color:#374151}
  td{padding:10px 14px;border-bottom:1px solid #F3F4F6;font-size:13px}
  .footer-row{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-top:20px}
  .totals-box{min-width:260px}
  .tot-row{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #F3F4F6}
  .tot-grand{border-bottom:none;border-top:2px solid ${accent};padding-top:10px;font-size:16px;font-weight:900;color:${accent}}
  .doc-footer{margin-top:32px;padding-top:12px;border-top:2px solid ${accent}20;display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF}
  .voided-stamp{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;font-weight:900;color:rgba(220,38,38,.15);border:8px solid rgba(220,38,38,.15);padding:10px 30px;border-radius:10px;pointer-events:none;white-space:nowrap}
  @media print{@page{margin:8mm;size:A4}body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{margin:0;border-radius:0}}
</style>
</head>
<body>
${isVoided ? '<div class="voided-stamp">ملغاة — VOIDED</div>' : ''}
<div class="page">
  <div class="hdr">
    <div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:44px;height:44px;border-radius:10px;background:${isLight ? accent + '18' : 'rgba(255,255,255,.15)'};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:${isLight ? accent : '#fff'};flex-shrink:0">س</div>
        <div>
          <div class="company-name">${co?.name || 'اسم الشركة'}</div>
          <div class="company-sub">${co?.nameEn || ''}</div>
        </div>
      </div>
      <div class="company-info">
        ${co?.address ? `<div>${co.address}، ${co.city}</div>` : ''}
        ${(co?.phone || co?.email) ? `<div>${co?.phone ? `ج: ${co.phone}` : ''}${co?.phone && co?.email ? ' | ' : ''}${co?.email || ''}</div>` : ''}
        ${co?.vat ? `<div>الرقم الضريبي: ${co.vat}</div>` : ''}
        ${co?.cr ? `<div>السجل التجاري: ${co.cr}</div>` : ''}
      </div>
    </div>
    <div>
      <div class="inv-title">فاتورة ضريبية</div>
      <div class="inv-title-sub">TAX INVOICE</div>
      <div class="inv-meta">
        <div><strong style="opacity:.6;font-weight:600">رقم الفاتورة:</strong> ${invoice.number}</div>
        <div><strong style="opacity:.6;font-weight:600">تاريخ الإصدار:</strong> ${invoice.date}</div>
        ${invoice.dueDate ? `<div><strong style="opacity:.6;font-weight:600">تاريخ الاستحقاق:</strong> ${invoice.dueDate}</div>` : ''}
        <div><strong style="opacity:.6;font-weight:600">الحالة:</strong> ${STATUS_LABELS[status]}${isVoided ? ' — ملغاة' : ''}</div>
      </div>
    </div>
  </div>

  <div class="body">
    <div class="bill-grid">
      <div class="info-box">
        <div class="info-label">فاتورة إلى</div>
        <div style="font-weight:800;font-size:15px">${invoice.customer}</div>
        <div style="font-size:12px;color:#6B7280;margin-top:4px">الرياض، المملكة العربية السعودية</div>
        <div style="font-size:12px;color:#6B7280">الرقم الضريبي: 300000000000000</div>
      </div>
      <div class="info-box">
        <div class="info-label">بيانات الدفع</div>
        <div style="font-size:12px;line-height:1.8">
          <div>البنك الأهلي السعودي</div>
          <div style="color:#6B7280;font-size:11px">IBAN: SA12 2000 0000 0000 0000 0000</div>
        </div>
        <div style="margin-top:10px">
          <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;background:${status === 'paid' ? '#ECFDF5' : status === 'overdue' ? '#FEF2F2' : '#FFFBEB'};color:${status === 'paid' ? '#065f46' : status === 'overdue' ? '#991b1b' : '#92400e'}">
            ${isVoided ? 'ملغاة' : STATUS_LABELS[status]}
          </span>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:36px;text-align:center">#</th>
          <th>الوصف / البيان</th>
          <th style="width:72px;text-align:center">الكمية</th>
          <th style="width:120px;text-align:left">سعر الوحدة</th>
          <th style="width:120px;text-align:left">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((it, i) => `
          <tr>
            <td style="color:#9CA3AF;font-size:11px;text-align:center">${i + 1}</td>
            <td style="font-weight:600">${it.description}</td>
            <td style="text-align:center">${it.qty}</td>
            <td style="text-align:left">${it.price.toLocaleString('ar-SA')}</td>
            <td style="text-align:left;font-weight:700">${it.total.toLocaleString('ar-SA')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer-row">
      <div style="display:flex;gap:16px;align-items:flex-start;flex:1">
        <div style="flex-shrink:0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
            <rect width="80" height="80" fill="#fff" rx="4"/>
            <text x="40" y="44" text-anchor="middle" font-size="10" fill="#6B7280">QR ZATCA</text>
            <rect x="4" y="4" width="22" height="22" fill="none" stroke="#111" stroke-width="2"/>
            <rect x="8" y="8" width="14" height="14" fill="#111"/>
            <rect x="54" y="4" width="22" height="22" fill="none" stroke="#111" stroke-width="2"/>
            <rect x="58" y="8" width="14" height="14" fill="#111"/>
            <rect x="4" y="54" width="22" height="22" fill="none" stroke="#111" stroke-width="2"/>
            <rect x="8" y="58" width="14" height="14" fill="#111"/>
            <rect x="30" y="8" width="4" height="4" fill="#111"/><rect x="36" y="8" width="4" height="4" fill="#111"/>
            <rect x="30" y="14" width="4" height="4" fill="#111"/><rect x="38" y="16" width="4" height="4" fill="#111"/>
            <rect x="54" y="30" width="4" height="4" fill="#111"/><rect x="60" y="36" width="4" height="4" fill="#111"/>
            <rect x="30" y="54" width="4" height="4" fill="#111"/><rect x="36" y="60" width="4" height="4" fill="#111"/>
            <rect x="42" y="54" width="4" height="4" fill="#111"/><rect x="48" y="60" width="4" height="4" fill="#111"/>
            <rect x="54" y="54" width="4" height="4" fill="#111"/><rect x="60" y="60" width="4" height="4" fill="#111"/>
          </svg>
          <div style="font-size:9px;color:#9CA3AF;text-align:center;margin-top:4px">ZATCA QR</div>
        </div>
        <div style="font-size:12px;color:#6B7280;line-height:1.8;padding-top:4px">
          <div style="font-weight:700;color:#111827;margin-bottom:4px">ملاحظات:</div>
          <div>شكراً لتعاملكم معنا.</div>
          <div>يُرجى الدفع خلال 30 يوماً من تاريخ الفاتورة.</div>
          <div style="margin-top:6px;font-size:11px">للاستفسار: ${co?.email || '—'} | ${co?.phone || '—'}</div>
          ${isVoided ? '<div style="margin-top:8px;color:#DC2626;font-weight:700">⚠ هذه الفاتورة مسترجعة وملغاة</div>' : ''}
        </div>
      </div>
      <div class="totals-box">
        <div class="tot-row"><span style="color:#6B7280">المجموع قبل الضريبة</span><strong>${invoice.amount.toLocaleString('ar-SA')} ر.س</strong></div>
        <div class="tot-row"><span style="color:#D97706">ضريبة القيمة المضافة 15%</span><strong style="color:#D97706">${invoice.tax.toLocaleString('ar-SA')} ر.س</strong></div>
        <div class="tot-row tot-grand"><span>الإجمالي المستحق</span><strong>${invoice.total.toLocaleString('ar-SA')} ر.س</strong></div>
        ${status === 'paid' && !isVoided ? '<div style="margin-top:12px;text-align:center;padding:10px;background:#ECFDF5;border-radius:8px;border:2px solid #10B981;color:#065f46;font-weight:800;font-size:14px">✓ تم السداد بالكامل</div>' : ''}
      </div>
    </div>

    <div class="doc-footer">
      <div>${co?.name || '—'} — السجل التجاري: ${co?.cr || '—'}</div>
      <div>صفحة 1 من 1</div>
      <div>تم الإصدار بنظام سهل ERP</div>
    </div>
  </div>
</div>
<script>window.onload=()=>{window.print();}<\/script>
</body>
</html>`)
  win.document.close()
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { invoices, addPayment, updateStatus, confirmInvoice, createReturn } = useInvoiceStore()
  const deductFromInventory = useInventoryStore(s => s.deductFromInventory)
  const { updateBalance: updateCustomerBalance } = useCustomerStore()
  const co = useAppStore(s => s.company)
  const invoice = invoices.find(i => i.id === id)

  const [template, setTemplate]         = useState<TplId>(getTemplate)
  const [showPayment, setShowPayment] = useState(false)
  const [showSend, setShowSend]       = useState(false)
  const [showVoid, setShowVoid]       = useState(false)
  const [payAmount, setPayAmount]     = useState('')
  const [payMethod, setPayMethod]     = useState<'cash' | 'bank' | 'card'>('bank')
  const status = invoice?.status ?? 'pending'
  const [isVoided, setIsVoided]       = useState(false)
  const [voidReason, setVoidReason]   = useState('')
  const [sendEmail, setSendEmail]     = useState('client@company.sa')

  if (!invoice) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <i className="fa fa-file-circle-xmark" style={{ fontSize: 48, color: 'var(--muted)', display: 'block', marginBottom: 16 }} />
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>الفاتورة غير موجودة</div>
        <Link to="/erp/invoices" className="btn btn-primary"><i className="fa fa-arrow-right" /> العودة للفواتير</Link>
      </div>
    )
  }

  const tpl = TEMPLATES.find(t => t.id === template) ?? TEMPLATES[0]

  const handlePrint = () => openPrintWindow(invoice, status, tpl, isVoided, co)
  const handlePDF   = () => { toast('جارٍ تحضير PDF...', 'info'); setTimeout(() => openPrintWindow(invoice, status, tpl, isVoided, co), 200) }

  const handlePayment = async () => {
    if (!payAmount) { toast('يرجى إدخال المبلغ', 'warn'); return }
    const amt = parseFloat(payAmount)
    if (amt > (invoice.total - (invoice.paidAmount || 0))) {
      toast('المبلغ المدفوع أكبر من المتبقي!', 'warn'); return
    }
    // Record payment (includes treasury transaction internally)
    await addPayment(invoice.id, amt)
    // Update customer balance — payment received reduces what they owe
    if (invoice.customerId) {
      await updateCustomerBalance(invoice.customerId, -amt)
    }
    toast(`تم تسجيل دفعة ${fmt(amt)} وتحديث رصيد العميل والخزينة ✅`, 'success')
    setShowPayment(false); setPayAmount('')
  }

  const handleConfirm = () => {
    confirmInvoice(invoice.id)
    deductFromInventory(invoice.items.map(it => ({ productId: it.productId, qty: it.qty })))
    toast('تم تأكيد الفاتورة وخصم الكميات من المخزون', 'success')
  }

  const handleSend = () => {
    toast(`تم إرسال الفاتورة إلى ${sendEmail}`, 'success')
    setShowSend(false)
  }

  const handleVoid = async () => {
    if (!voidReason.trim()) { toast('يرجى إدخال سبب الاسترجاع', 'warn'); return }
    await createReturn(invoice.id, invoice.items, voidReason)
    setIsVoided(true)
    toast(`تم استرجاع الفاتورة ${invoice.number} وإعادة الكميات للمخزون وتحديث رصيد العميل`, 'success')
    setShowVoid(false)
  }

  const changeTemplate = (t: TplId) => {
    setTemplate(t)
    localStorage.setItem(TEMPLATE_KEY, t)
    toast('تم تغيير القالب', 'success')
  }

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/erp/invoices')}>
          <i className="fa fa-arrow-right" /> رجوع
        </button>
        <div style={{ flex: 1 }} />

        {/* Template switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => changeTemplate(t.id)}
              title={t.name}
              style={{
                padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, transition: '.15s',
                background: template === t.id ? 'var(--card)' : 'transparent',
                color: template === t.id ? 'var(--text)' : 'var(--muted)',
                boxShadow: template === t.id ? 'var(--shadow)' : 'none',
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {isVoided ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', background: 'var(--danger)' + '18', borderRadius: 6, padding: '4px 12px' }}>
            مسترجعة — ملغاة
          </span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[status], background: STATUS_COLORS[status] + '18', borderRadius: 6, padding: '4px 12px' }}>
            {STATUS_LABELS[status]}
          </span>
        )}

        {(status === 'draft' || status === 'pending') && !isVoided && (
          <button className="btn btn-sm btn-primary" onClick={handleConfirm}>
            <i className="fa fa-check" /> تأكيد الفاتورة وخصم المخزون
          </button>
        )}
        {status !== 'paid' && status !== 'draft' && status !== 'pending' && !isVoided && (
          <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff', border: 'none' }} onClick={() => setShowPayment(true)}>
            <i className="fa fa-coins" /> تسجيل دفعة
          </button>
        )}
        {!isVoided && (
          <button className="btn btn-outline btn-sm" onClick={() => setShowSend(true)}>
            <i className="fa fa-paper-plane" /> إرسال
          </button>
        )}
        {!isVoided && (
          <button
            className="btn btn-sm btn-outline"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            onClick={() => setShowVoid(true)}
          >
            <i className="fa fa-rotate-left" /> استرجاع
          </button>
        )}
        <button className="btn btn-outline btn-sm" onClick={handlePrint}>
          <i className="fa fa-print" /> طباعة
        </button>
        <button className="btn btn-outline btn-sm" onClick={handlePDF}>
          <i className="fa fa-file-pdf" /> PDF
        </button>
      </div>

      {/* ── Void banner ── */}
      {isVoided && (
        <div style={{
          background: '#FEF2F2', border: '1px solid var(--danger)', borderRadius: 10,
          padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <i className="fa fa-triangle-exclamation" style={{ color: 'var(--danger)', fontSize: 18 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 14 }}>هذه الفاتورة مسترجعة وملغاة</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>السبب: {voidReason}</div>
          </div>
        </div>
      )}

      {/* ── Invoice Template ── */}
      <div className="invoice-print-wrap">
        <div className="invoice-template" style={{ borderTop: tpl.borderTop, opacity: isVoided ? 0.65 : 1 }}>

          {/* Void watermark */}
          {isVoided && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%) rotate(-30deg)',
              fontSize: 64, fontWeight: 900, color: 'rgba(220,38,38,.12)',
              border: '6px solid rgba(220,38,38,.12)', padding: '8px 24px', borderRadius: 10,
              pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
            }}>
              ملغاة — VOIDED
            </div>
          )}

          {/* Header */}
          <div style={{ background: tpl.headerBg, color: tpl.headerColor, padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: tpl.headerColor === '#fff' ? 'rgba(255,255,255,.15)' : tpl.accentColor + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: tpl.headerColor === '#fff' ? '#fff' : tpl.accentColor }}>س</span>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{co.name || 'اسم الشركة'}</div>
                  <div style={{ fontSize: 11, opacity: .7, marginTop: 2 }}>{co.nameEn}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, opacity: .75, lineHeight: 1.8 }}>
                {co.address && <div>{co.address}، {co.city}</div>}
                {(co.phone || co.email) && <div>{co.phone && `ج: ${co.phone}`}{co.phone && co.email ? ' | ' : ''}{co.email}</div>}
                {co.vat && <div>الرقم الضريبي: {co.vat}</div>}
                {co.cr && <div>السجل التجاري: {co.cr}</div>}
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>فاتورة ضريبية</div>
              <div style={{ fontSize: 12, opacity: .65, marginTop: 2 }}>TAX INVOICE</div>
              <div style={{ marginTop: 16, fontSize: 13, lineHeight: 2, opacity: .9 }}>
                <div><strong style={{ opacity: .6, fontWeight: 600 }}>رقم الفاتورة:</strong> {invoice.number}</div>
                <div><strong style={{ opacity: .6, fontWeight: 600 }}>تاريخ الإصدار:</strong> {fmtDate(new Date(invoice.date))}</div>
                {invoice.dueDate && <div><strong style={{ opacity: .6, fontWeight: 600 }}>تاريخ الاستحقاق:</strong> {fmtDate(new Date(invoice.dueDate))}</div>}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="inv-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 24 }}>
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: tpl.accentColor, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>فاتورة إلى</div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{invoice.customer}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>الرياض، المملكة العربية السعودية</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>الرقم الضريبي: 300000000000000</div>
                {invoice.createdBy && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11 }}>
                    <span style={{ color: 'var(--muted)' }}>أعدّها: </span>
                    <span style={{ fontWeight: 700 }}>{invoice.createdBy}</span>
                  </div>
                )}
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: tpl.accentColor, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>بيانات الدفع</div>
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  <div>البنك الأهلي السعودي</div>
                  <div style={{ color: 'var(--muted)', fontSize: 11 }}>IBAN: SA12 2000 0000 0000 0000 0000</div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isVoided ? 'var(--danger)' : STATUS_COLORS[status], background: (isVoided ? 'var(--danger)' : STATUS_COLORS[status]) + '18', borderRadius: 6, padding: '3px 10px' }}>
                    {isVoided ? 'ملغاة' : STATUS_LABELS[status]}
                  </span>
                </div>
              </div>
            </div>

            <table className="inv-table">
              <thead>
                <tr style={{ '--accent': tpl.accentColor } as React.CSSProperties}>
                  <th style={{ width: 36 }}>#</th>
                  <th>الوصف / البيان</th>
                  <th style={{ width: 72, textAlign: 'center' }}>الكمية</th>
                  <th style={{ width: 115, textAlign: 'left' }}>سعر الوحدة</th>
                  <th style={{ width: 115, textAlign: 'left' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.description}</td>
                    <td style={{ textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ textAlign: 'left' }}>{fmt(item.price)}</td>
                    <td style={{ textAlign: 'left', fontWeight: 700 }}>{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer section: QR + Notes | Totals */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 28, gap: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1 }}>
                <div style={{ flexShrink: 0 }}>
                  <ZATCAQRCode
                    sellerName={co.name || 'الشركة'}
                    vatNumber={co.vat || ''}
                    invoiceDate={invoice.date + 'T00:00:00Z'}
                    totalWithVat={invoice.total}
                    vatAmount={invoice.tax}
                    invoiceNumber={invoice.number}
                    size={90}
                  />
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 5, textAlign: 'center', maxWidth: 90 }}>ZATCA QR</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.8, paddingTop: 4 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>ملاحظات:</div>
                  <div>شكراً لتعاملكم معنا.</div>
                  <div>يُرجى الدفع خلال 30 يوماً من تاريخ الفاتورة.</div>
                  <div style={{ marginTop: 6, fontSize: 11 }}>للاستفسار: {co.email || '—'} | {co.phone || '—'}</div>
                  {isVoided && (
                    <div style={{ marginTop: 8, color: 'var(--danger)', fontWeight: 700, fontSize: 12 }}>
                      ⚠ هذه الفاتورة مسترجعة وملغاة
                    </div>
                  )}
                </div>
              </div>

              <div style={{ minWidth: 260 }}>
                <div className="inv-totals" style={{ width: '100%' }}>
                  <div className="inv-totals-row">
                    <span style={{ color: 'var(--muted)' }}>المجموع قبل الضريبة</span>
                    <strong>{fmt(invoice.amount)}</strong>
                  </div>
                  <div className="inv-totals-row">
                    <span style={{ color: 'var(--muted)' }}>ضريبة القيمة المضافة (15%)</span>
                    <strong style={{ color: 'var(--warn)' }}>{fmt(invoice.tax)}</strong>
                  </div>
                  <div className="inv-totals-row grand" style={{ color: tpl.accentColor }}>
                    <span>الإجمالي المستحق</span>
                    <strong>{fmt(invoice.total)}</strong>
                  </div>
                  <div className="inv-totals-row" style={{ marginTop: 8 }}>
                    <span style={{ color: 'var(--success)' }}>المدفوع</span>
                    <strong style={{ color: 'var(--success)' }}>{fmt(invoice.paidAmount || 0)}</strong>
                  </div>
                  <div className="inv-totals-row">
                    <span>المتبقي</span>
                    <strong>{fmt(invoice.total - (invoice.paidAmount || 0))}</strong>
                  </div>
                </div>

                {status === 'paid' && !isVoided && (
                  <div style={{ marginTop: 14, textAlign: 'center', padding: '10px 16px', background: '#ECFDF5', borderRadius: 8, border: '2px solid var(--success)', color: 'var(--success)', fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>
                    ✓ تم السداد بالكامل
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 36, paddingTop: 14, borderTop: `2px solid ${tpl.accentColor}20`, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)' }}>
              <div>{co.name || '—'} — السجل التجاري: {co.cr || '—'}</div>
              <div style={{ textAlign: 'center' }}>صفحة 1 من 1</div>
              <div>تم الإصدار بنظام سهل ERP</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="تسجيل دفعة">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>المبلغ المستحق (المتبقي)</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>{fmt(invoice.total - (invoice.paidAmount || 0))}</div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>المبلغ المدفوع (ر.س)</label>
            <input className="form-control" type="number" placeholder={String(invoice.total - (invoice.paidAmount || 0))} value={payAmount} onChange={e => setPayAmount(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>طريقة الدفع</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {([['bank','تحويل','fa-university'],['cash','نقدي','fa-money-bill-wave'],['card','بطاقة','fa-credit-card']] as const).map(([k,l,ic]) => (
                <button key={k} onClick={() => setPayMethod(k as typeof payMethod)} style={{
                  background: payMethod === k ? 'var(--primary)' : 'var(--bg)',
                  color: payMethod === k ? '#fff' : 'var(--muted)',
                  border: `1px solid ${payMethod === k ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '10px 4px', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: '.15s',
                }}>
                  <i className={`fa ${ic}`} style={{ display: 'block', fontSize: 16, marginBottom: 4 }} />{l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>ملاحظة</label>
            <input className="form-control" placeholder="رقم الحوالة أو تفاصيل الدفع..." />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePayment}><i className="fa fa-check" /> تأكيد الدفع</button>
            <button className="btn btn-outline" onClick={() => setShowPayment(false)}>إلغاء</button>
          </div>
        </div>
      </Modal>

      {/* ── Send Modal ── */}
      <Modal open={showSend} onClose={() => setShowSend(false)} title="إرسال الفاتورة">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>البريد الإلكتروني للعميل</label>
            <input className="form-control" type="email" value={sendEmail} onChange={e => setSendEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>نص الرسالة</label>
            <textarea className="form-control" rows={4} style={{ resize: 'none' }}
              defaultValue={`مرحباً،\n\nيرجى الاطلاع على الفاتورة رقم ${invoice.number} بقيمة ${fmt(invoice.total)} ر.س.\n\nشكراً لتعاملكم معنا.`} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input type="checkbox" id="attach" defaultChecked />
            <label htmlFor="attach">إرفاق نسخة PDF للفاتورة</label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSend}><i className="fa fa-paper-plane" /> إرسال</button>
            <button className="btn btn-outline" onClick={() => setShowSend(false)}>إلغاء</button>
          </div>
        </div>
      </Modal>

      {/* ── Void Modal ── */}
      <Modal open={showVoid} onClose={() => setShowVoid(false)} title="استرجاع الفاتورة">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#FEF2F2', border: '1px solid var(--danger)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12 }}>
            <i className="fa fa-triangle-exclamation" style={{ color: 'var(--danger)', fontSize: 20, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>تحذير: لا يمكن التراجع عن الاسترجاع</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                سيتم إلغاء الفاتورة {invoice.number} وتصنيفها كمسترجعة. لن يمكن تحريرها أو قبول دفعات عليها لاحقاً.
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>رقم الفاتورة</div>
            <div style={{ fontWeight: 700 }}>{invoice.number}</div>
          </div>
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>المبلغ</div>
            <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(invoice.total)} ر.س</div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>سبب الاسترجاع <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea
              className="form-control"
              rows={3}
              style={{ resize: 'none' }}
              placeholder="مثال: طلب العميل الإلغاء، خطأ في البيانات، تكرار الفاتورة..."
              value={voidReason}
              onChange={e => setVoidReason(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>تاريخ الاسترجاع</label>
            <input className="form-control" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              className="btn btn-sm"
              style={{ flex: 1, background: 'var(--danger)', color: '#fff', border: 'none' }}
              onClick={handleVoid}
            >
              <i className="fa fa-rotate-left" /> تأكيد الاسترجاع
            </button>
            <button className="btn btn-outline" onClick={() => { setShowVoid(false); setVoidReason('') }}>إلغاء</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
