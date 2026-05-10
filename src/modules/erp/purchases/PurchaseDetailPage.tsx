import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Modal from '@/components/ui/Modal'
import { fmt, fmtDate } from '@/lib/format'
import { type PurchaseStatus, type Purchase } from '@/lib/mock-data/purchases'
import { usePurchaseStore } from '@/store/purchase.store'
import { useInventoryStore } from '@/store/inventory.store'
import { useAppStore } from '@/store/app.store'
import { toast } from '@/lib/toast'

type TplId = 'classic' | 'modern' | 'clean' | 'minimal' | 'bold'
const TEMPLATE_KEY = 'sahl-po-template'
const getTemplate = () => (localStorage.getItem(TEMPLATE_KEY) as TplId) ?? 'classic'

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

const TEMPLATES: { id: TplId; name: string; headerBg: string; headerColor: string; accentColor: string; borderTop?: string }[] = [
  { id: 'classic',  name: 'كلاسيكي',  headerBg: '#0D1117',                                headerColor: '#fff',    accentColor: '#0D1117' },
  { id: 'modern',   name: 'عصري',     headerBg: 'linear-gradient(135deg,#1a2035,#2563EB)', headerColor: '#fff',    accentColor: '#2563EB' },
  { id: 'clean',    name: 'نظيف',     headerBg: '#ffffff',                                headerColor: '#111827', accentColor: '#0D1117', borderTop: '4px solid #0D1117' },
  { id: 'minimal',  name: 'بسيط',     headerBg: '#F4F6FA',                                headerColor: '#111827', accentColor: '#7C3AED', borderTop: '3px solid #7C3AED' },
  { id: 'bold',     name: 'جريء',     headerBg: 'linear-gradient(135deg,#065f46,#10B981)', headerColor: '#fff',    accentColor: '#10B981' },
]

function openPrintWindow(
  po: Purchase,
  status: PurchaseStatus,
  tpl: typeof TEMPLATES[0],
  isVoided: boolean,
  company: ReturnType<typeof useAppStore.getState>['company'],
) {
  const win = window.open('', '_blank', 'width=920,height=760')
  if (!win) { toast('يرجى السماح بالنوافذ المنبثقة', 'warn'); return }

  const hdrBg  = tpl.headerBg
  const hdrClr = tpl.headerColor
  const accent = tpl.accentColor
  const isLight = tpl.id === 'clean' || tpl.id === 'minimal'

  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>أمر شراء ${po.number || po.id}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Tajawal',Arial,sans-serif;font-size:13px;background:#F8FAFC;color:#111827;direction:rtl}
  .page{max-width:860px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;${tpl.borderTop ? `border-top:${tpl.borderTop}` : ''}}
  .hdr{background:${hdrBg};color:${hdrClr};padding:28px 40px;display:flex;justify-content:space-between;align-items:flex-start}
  .company-name{font-size:20px;font-weight:900}
  .company-sub{font-size:11px;opacity:.7;margin-top:3px}
  .company-info{font-size:12px;opacity:.75;line-height:1.8;margin-top:10px}
  .po-title{font-size:26px;font-weight:900;text-align:left}
  .po-title-sub{font-size:12px;opacity:.65;margin-top:2px;text-align:left}
  .po-meta{font-size:13px;line-height:2;opacity:.9;text-align:left;margin-top:14px}
  .body{padding:28px 40px}
  .bill-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:24px}
  .info-box{background:#F8FAFC;border-radius:10px;padding:14px 16px}
  .info-label{font-size:10px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  th{background:#F4F6FA;padding:10px 14px;font-size:11px;font-weight:800;text-align:right;border-bottom:2px solid #E5E7EB;color:#374151}
  td{padding:10px 14px;border-bottom:1px solid #F3F4F6;font-size:13px}
  .footer-row{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-top:8px}
  .totals-box{min-width:260px}
  .tot-row{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #F3F4F6}
  .tot-grand{border-bottom:none;border-top:2px solid ${accent};padding-top:10px;font-size:16px;font-weight:900;color:${accent}}
  .doc-footer{margin-top:32px;padding-top:12px;border-top:2px solid ${accent}20;display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF}
  .voided-stamp{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;font-weight:900;color:rgba(220,38,38,.12);border:8px solid rgba(220,38,38,.12);padding:10px 30px;border-radius:10px;pointer-events:none;white-space:nowrap}
  .sig-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:28px}
  .sig-box{border-top:1px solid #9CA3AF;padding-top:8px;font-size:11px;color:#6B7280;text-align:center}
  @media print{@page{margin:8mm;size:A4}body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{margin:0;border-radius:0}}
</style>
</head>
<body>
${isVoided ? '<div class="voided-stamp">مسترجع — VOIDED</div>' : ''}
<div class="page">
  <div class="hdr">
    <div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:44px;height:44px;border-radius:10px;background:${isLight ? accent + '18' : 'rgba(255,255,255,.15)'};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:${isLight ? accent : '#fff'};flex-shrink:0">س</div>
        <div>
          <div class="company-name">${company.name || '—'}</div>
          <div class="company-sub">${company.nameEn || ''}</div>
        </div>
      </div>
      <div class="company-info">
        <div>${[company.address, company.city, company.country].filter(Boolean).join('، ')}</div>
        <div>ج: ${company.phone || '—'} | ${company.email || '—'}</div>
        <div>الرقم الضريبي: ${company.vat || '—'}</div>
      </div>
    </div>
    <div>
      <div class="po-title">أمر شراء</div>
      <div class="po-title-sub">PURCHASE ORDER</div>
      <div class="po-meta">
        <div><strong style="opacity:.6;font-weight:600">رقم الأمر:</strong> ${po.number || po.id}</div>
        <div><strong style="opacity:.6;font-weight:600">تاريخ الإصدار:</strong> ${po.date}</div>
        ${po.dueDate ? `<div><strong style="opacity:.6;font-weight:600">تاريخ الاستحقاق:</strong> ${po.dueDate}</div>` : ''}
        <div><strong style="opacity:.6;font-weight:600">الحالة:</strong> ${STATUS_LABELS[status]}${isVoided ? ' — مسترجع' : ''}</div>
      </div>
    </div>
  </div>

  <div class="body">
    <div class="bill-grid">
      <div class="info-box">
        <div class="info-label">المورد</div>
        <div style="font-weight:800;font-size:15px">${po.supplier}</div>
        <div style="font-size:12px;color:#6B7280;margin-top:4px">المملكة العربية السعودية</div>
        ${po.supplierVat ? `<div style="font-size:12px;color:#6B7280">الرقم الضريبي: ${po.supplierVat}</div>` : ''}
      </div>
      <div class="info-box">
        <div class="info-label">بيانات الدفع</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700">المبلغ الكلي: ${po.total.toLocaleString('ar-SA')} ر.س</div>
          <div>المدفوع: ${po.paid.toLocaleString('ar-SA')} ر.س</div>
          <div style="color:${po.total - po.paid > 0 ? '#DC2626' : '#065f46'}">المتبقي: ${(po.total - po.paid).toLocaleString('ar-SA')} ر.س</div>
        </div>
        <div style="margin-top:10px">
          <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;background:${STATUS_COLORS[status]}15;color:${STATUS_COLORS[status]}">
            ${isVoided ? 'مسترجع' : STATUS_LABELS[status]}
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
        ${po.lineItems.map((it: { description: string; qty: number; price: number; total: number }, i: number) => `
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
      <div style="font-size:12px;color:#6B7280;line-height:1.8;flex:1;padding-top:4px">
        <div style="font-weight:700;color:#111827;margin-bottom:4px">ملاحظات:</div>
        <div>يُرجى التسليم في الموعد المحدد.</div>
        <div>يُرجى إرفاق الفاتورة الضريبية عند التسليم.</div>
        <div style="margin-top:6px;font-size:11px">للاستفسار: ${company.email || '—'} | ${company.phone || '—'}</div>
        ${isVoided ? '<div style="margin-top:8px;color:#DC2626;font-weight:700">⚠ هذا الأمر مسترجع وملغى</div>' : ''}
      </div>
      <div class="totals-box">
        <div class="tot-row"><span style="color:#6B7280">المجموع قبل الضريبة</span><strong>${po.amount.toLocaleString('ar-SA')} ر.س</strong></div>
        <div class="tot-row"><span style="color:#D97706">ضريبة القيمة المضافة 15%</span><strong style="color:#D97706">${po.tax.toLocaleString('ar-SA')} ر.س</strong></div>
        <div class="tot-row tot-grand"><span>إجمالي الأمر</span><strong>${po.total.toLocaleString('ar-SA')} ر.س</strong></div>
        <div class="tot-row" style="border-bottom:none"><span style="color:#6B7280">المدفوع</span><strong style="color:#065f46">${po.paid.toLocaleString('ar-SA')} ر.س</strong></div>
        <div class="tot-row" style="border-bottom:none;font-weight:700"><span style="color:${po.total - po.paid > 0 ? '#DC2626' : '#6B7280'}">المتبقي</span><strong style="color:${po.total - po.paid > 0 ? '#DC2626' : '#065f46'}">${(po.total - po.paid).toLocaleString('ar-SA')} ر.س</strong></div>
      </div>
    </div>

    <div class="sig-grid">
      <div class="sig-box">توقيع مدير المشتريات</div>
      <div class="sig-box">توقيع المورد (استلام)</div>
      <div class="sig-box">الختم الرسمي للشركة</div>
    </div>

    <div class="doc-footer">
      <div>${company.name || '—'} — السجل التجاري: ${company.cr || '—'}</div>
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

export default function PurchaseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const purchases = usePurchaseStore(s => s.purchases)
  const storeAddPayment = usePurchaseStore(s => s.addPayment)
  const confirmReceipt = usePurchaseStore(s => s.confirmReceipt)
  const addStock = useInventoryStore(s => s.addStock)
  const po = purchases.find(p => p.id === id)

  const [template, setTemplate]       = useState<TplId>(getTemplate)
  const [showPayment, setShowPayment] = useState(false)
  const [showVoid, setShowVoid]       = useState(false)
  const [payAmount, setPayAmount]     = useState('')
  const [payMethod, setPayMethod]     = useState<'cash' | 'bank' | 'card'>('bank')
  const [status, setStatus]           = useState<PurchaseStatus>(po?.status ?? 'pending')
  const [isVoided, setIsVoided]       = useState(false)
  const [voidReason, setVoidReason]   = useState('')

  if (!po) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <i className="fa fa-file-circle-xmark" style={{ fontSize: 48, color: 'var(--muted)', display: 'block', marginBottom: 16 }} />
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>أمر الشراء غير موجود</div>
        <Link to="/erp/purchases" className="btn btn-primary"><i className="fa fa-arrow-right" /> العودة للمشتريات</Link>
      </div>
    )
  }

  const company   = useAppStore(s => s.company)
  const tpl       = TEMPLATES.find(t => t.id === template) ?? TEMPLATES[0]
  const remaining = po.total - po.paid
  const paidPct   = Math.round((po.paid / po.total) * 100)

  const handlePrint = () => openPrintWindow(po, status, tpl, isVoided, company)
  const handlePDF   = () => { toast('جارٍ تحضير PDF...', 'info'); setTimeout(() => openPrintWindow(po, status, tpl, isVoided, company), 200) }

  const handlePayment = () => {
    if (!payAmount) { toast('يرجى إدخال المبلغ', 'warn'); return }
    const amt = Math.min(+payAmount, remaining)
    storeAddPayment(po.id, amt)
    const newPaid = po.paid + amt
    setStatus(newPaid >= po.total ? 'received' : 'partial')
    toast(`تم تسجيل دفعة ${fmt(amt)} بنجاح`, 'success')
    setShowPayment(false); setPayAmount('')
  }

  const handleConfirmReceipt = () => {
    confirmReceipt(po.id)
    po.lineItems.forEach(item => {
      if (item.productId) addStock(item.productId, item.qty)
    })
    setStatus('received')
    toast('تم تأكيد الاستلام وإضافة الكميات للمخزون', 'success')
  }

  const handleVoid = () => {
    if (!voidReason.trim()) { toast('يرجى إدخال سبب الاسترجاع', 'warn'); return }
    setIsVoided(true)
    setStatus('voided')
    toast(`تم استرجاع أمر الشراء ${po.number || po.id}`, 'success')
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
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/erp/purchases')}>
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
            مسترجع — ملغى
          </span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[status], background: STATUS_COLORS[status] + '18', borderRadius: 6, padding: '4px 12px' }}>
            {STATUS_LABELS[status]}
          </span>
        )}

        {status === 'pending' && !isVoided && (
          <button className="btn btn-sm btn-primary" onClick={handleConfirmReceipt}>
            <i className="fa fa-check-double" /> تأكيد الاستلام وإضافة للمخزون
          </button>
        )}
        {remaining > 0 && !isVoided && status !== 'cancelled' && (
          <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff', border: 'none' }} onClick={() => setShowPayment(true)}>
            <i className="fa fa-coins" /> تسجيل دفعة
          </button>
        )}
        {!isVoided && status !== 'cancelled' && (
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
            <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 14 }}>هذا الأمر مسترجع وملغى</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>السبب: {voidReason}</div>
          </div>
        </div>
      )}

      {/* ── Purchase Order Template ── */}
      <div className="invoice-print-wrap">
        <div className="invoice-template" style={{ borderTop: tpl.borderTop, opacity: isVoided ? 0.65 : 1, position: 'relative' }}>

          {isVoided && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%) rotate(-30deg)',
              fontSize: 64, fontWeight: 900, color: 'rgba(220,38,38,.12)',
              border: '6px solid rgba(220,38,38,.12)', padding: '8px 24px', borderRadius: 10,
              pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
            }}>
              مسترجع — VOIDED
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
                  <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{company.name || '—'}</div>
                  <div style={{ fontSize: 11, opacity: .7, marginTop: 2 }}>{company.nameEn || ''}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, opacity: .75, lineHeight: 1.8 }}>
                <div>{[company.address, company.city, company.country].filter(Boolean).join('، ')}</div>
                <div>ج: {company.phone || '—'} | {company.email || '—'}</div>
                <div>الرقم الضريبي: {company.vat || '—'}</div>
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>أمر شراء</div>
              <div style={{ fontSize: 12, opacity: .65, marginTop: 2 }}>PURCHASE ORDER</div>
              <div style={{ marginTop: 16, fontSize: 13, lineHeight: 2, opacity: .9 }}>
                <div><strong style={{ opacity: .6, fontWeight: 600 }}>رقم الأمر:</strong> {po.number || po.id}</div>
                <div><strong style={{ opacity: .6, fontWeight: 600 }}>تاريخ الإصدار:</strong> {fmtDate(new Date(po.date))}</div>
                {po.dueDate && <div><strong style={{ opacity: .6, fontWeight: 600 }}>تاريخ الاستحقاق:</strong> {fmtDate(new Date(po.dueDate))}</div>}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="inv-body">
            {/* Supplier + Payment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 24 }}>
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: tpl.accentColor, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>المورد</div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{po.supplier}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>المملكة العربية السعودية</div>
                {po.supplierVat && <div style={{ fontSize: 12, color: 'var(--muted)' }}>الرقم الضريبي: {po.supplierVat}</div>}
                {po.createdBy && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11 }}>
                    <span style={{ color: 'var(--muted)' }}>المسؤول: </span>
                    <span style={{ fontWeight: 700 }}>{po.createdBy}</span>
                  </div>
                )}
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: tpl.accentColor, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>حالة السداد</div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--muted)' }}>نسبة السداد</span>
                    <span style={{ fontWeight: 700 }}>{paidPct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${paidPct}%`, background: paidPct === 100 ? 'var(--success)' : tpl.accentColor, borderRadius: 3, transition: 'width .3s' }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>المدفوع</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(po.paid)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>المتبقي</span>
                    <span style={{ color: remaining > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{fmt(remaining)}</span>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isVoided ? 'var(--danger)' : STATUS_COLORS[status], background: (isVoided ? 'var(--danger)' : STATUS_COLORS[status]) + '18', borderRadius: 6, padding: '3px 10px' }}>
                    {isVoided ? 'مسترجع' : STATUS_LABELS[status]}
                  </span>
                </div>
              </div>
            </div>

            {/* Items */}
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
                {po.lineItems.map((item, i) => (
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

            {/* Footer: Notes | Totals */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.8, flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>ملاحظات:</div>
                <div>يُرجى التسليم في الموعد المحدد.</div>
                <div>يُرجى إرفاق الفاتورة الضريبية عند التسليم.</div>
                <div style={{ marginTop: 6, fontSize: 11 }}>للاستفسار: {company.email || '—'} | {company.phone || '—'}</div>
                {isVoided && (
                  <div style={{ marginTop: 8, color: 'var(--danger)', fontWeight: 700, fontSize: 12 }}>
                    ⚠ هذا الأمر مسترجع وملغى
                  </div>
                )}
              </div>

              <div style={{ minWidth: 260 }}>
                <div className="inv-totals" style={{ width: '100%' }}>
                  <div className="inv-totals-row">
                    <span style={{ color: 'var(--muted)' }}>المجموع قبل الضريبة</span>
                    <strong>{fmt(po.amount)}</strong>
                  </div>
                  <div className="inv-totals-row">
                    <span style={{ color: 'var(--muted)' }}>ضريبة القيمة المضافة (15%)</span>
                    <strong style={{ color: 'var(--warn)' }}>{fmt(po.tax)}</strong>
                  </div>
                  <div className="inv-totals-row grand" style={{ color: tpl.accentColor }}>
                    <span>إجمالي الأمر</span>
                    <strong>{fmt(po.total)}</strong>
                  </div>
                  <div className="inv-totals-row" style={{ borderBottom: 'none' }}>
                    <span style={{ color: 'var(--muted)' }}>المدفوع</span>
                    <strong style={{ color: 'var(--success)' }}>{fmt(po.paid)}</strong>
                  </div>
                  <div className="inv-totals-row" style={{ borderBottom: 'none', fontWeight: 700 }}>
                    <span style={{ color: remaining > 0 ? 'var(--danger)' : 'var(--muted)' }}>المتبقي</span>
                    <strong style={{ color: remaining > 0 ? 'var(--danger)' : 'var(--success)' }}>{fmt(remaining)}</strong>
                  </div>
                </div>

                {remaining === 0 && !isVoided && (
                  <div style={{ marginTop: 14, textAlign: 'center', padding: '10px 16px', background: '#ECFDF5', borderRadius: 8, border: '2px solid var(--success)', color: 'var(--success)', fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>
                    ✓ تم السداد بالكامل
                  </div>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginTop: 40 }}>
              {['توقيع مدير المشتريات', 'توقيع المورد (استلام)', 'الختم الرسمي'].map(label => (
                <div key={label} style={{ borderTop: '1px solid var(--border)', paddingTop: 8, textAlign: 'center', fontSize: 11, color: 'var(--muted)' }}>
                  {label}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 28, paddingTop: 14, borderTop: `2px solid ${tpl.accentColor}20`, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)' }}>
              <div>{company.name || '—'} — السجل التجاري: {company.cr || '—'}</div>
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
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>المبلغ المتبقي</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--danger)' }}>{fmt(remaining)}</div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>المبلغ المدفوع (ر.س)</label>
            <input className="form-control" type="number" placeholder={String(remaining)} value={payAmount} onChange={e => setPayAmount(e.target.value)} />
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

      {/* ── Void Modal ── */}
      <Modal open={showVoid} onClose={() => setShowVoid(false)} title="استرجاع أمر الشراء">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#FEF2F2', border: '1px solid var(--danger)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12 }}>
            <i className="fa fa-triangle-exclamation" style={{ color: 'var(--danger)', fontSize: 20, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>تحذير: لا يمكن التراجع عن الاسترجاع</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                سيتم إلغاء الأمر {po.number || po.id} وتصنيفه كمسترجع. لن يمكن إجراء أي تعديلات أو دفعات عليه.
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>رقم الأمر</div>
            <div style={{ fontWeight: 700 }}>{po.number || po.id}</div>
          </div>
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>الإجمالي</div>
            <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(po.total)} ر.س</div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>سبب الاسترجاع <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea
              className="form-control"
              rows={3}
              style={{ resize: 'none' }}
              placeholder="مثال: إلغاء الطلب، خطأ في البيانات، رفض المورد..."
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
