import { useState, useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import RevenueChart from '@/components/charts/RevenueChart'
import LineAreaChart from '@/components/charts/LineAreaChart'
import { toast } from '@/lib/toast'
import { useInvoiceStore } from '@/store/invoice.store'
import { useExpenseStore } from '@/store/expense.store'
import { usePurchaseStore } from '@/store/purchase.store'
import { useInventoryStore } from '@/store/inventory.store'
import { useTreasuryStore } from '@/store/treasury.store'
import { useDelegateStore } from '@/store/delegate.store'
import { useHRStore } from '@/store/hr.store'

type RptTpl = 'formal' | 'modern' | 'clean' | 'compact' | 'bold'

const RPT_TEMPLATES: { id: RptTpl; name: string; desc: string; headerBg: string; headerColor: string; accent: string; border: string }[] = [
  {
    id: 'formal', name: 'رسمي',
    desc: 'خلفية داكنة — للمراسلات الرسمية',
    headerBg: '#0D1117', headerColor: '#fff', accent: '#2563EB', border: '2px solid #0D1117',
  },
  {
    id: 'modern', name: 'عصري',
    desc: 'تدرج أزرق داكن — احترافي وأنيق',
    headerBg: 'linear-gradient(135deg,#1a2035 0%,#2563EB 100%)', headerColor: '#fff', accent: '#2563EB', border: '2px solid #2563EB',
  },
  {
    id: 'clean', name: 'نظيف',
    desc: 'أبيض مع خط علوي — بسيط وقابل للقراءة',
    headerBg: '#ffffff', headerColor: '#111827', accent: '#0D1117', border: '4px solid #0D1117',
  },
  {
    id: 'compact', name: 'مضغوط',
    desc: 'أخضر مؤسسي — مناسب للتقارير المالية',
    headerBg: 'linear-gradient(135deg,#065f46,#10B981)', headerColor: '#fff', accent: '#10B981', border: '2px solid #10B981',
  },
  {
    id: 'bold', name: 'جريء',
    desc: 'بنفسجي غامق — بارز ومميز',
    headerBg: 'linear-gradient(135deg,#4C1D95,#7C3AED)', headerColor: '#fff', accent: '#7C3AED', border: '2px solid #7C3AED',
  },
]

const REPORT_GROUPS = [
  {
    title: 'التقارير المالية',
    icon: 'fa-chart-line',
    color: '#2563EB',
    reports: [
      {
        icon: 'fa-file-invoice-dollar', label: 'قائمة الدخل', desc: 'الإيرادات والمصروفات وصافي الربح',
        data: [
          { label: 'إجمالي الإيرادات',  value: 284500, type: 'credit' },
          { label: 'تكلفة المبيعات',    value: 98200,  type: 'debit' },
          { label: 'إجمالي الربح',      value: 186300, type: 'total' },
          { label: 'مصروفات التشغيل',   value: 42100,  type: 'debit' },
          { label: 'الربح التشغيلي',    value: 144200, type: 'total' },
          { label: 'مصروفات أخرى',      value: 8500,   type: 'debit' },
          { label: 'صافي الربح',        value: 135700, type: 'grand' },
        ],
      },
      {
        icon: 'fa-scale-balanced', label: 'الميزانية العمومية', desc: 'الأصول والخصوم وحقوق الملكية',
        data: [
          { label: 'الأصول المتداولة',   value: 312000, type: 'credit' },
          { label: 'الأصول الثابتة',     value: 185000, type: 'credit' },
          { label: 'إجمالي الأصول',      value: 497000, type: 'total' },
          { label: 'الخصوم المتداولة',   value: 88000,  type: 'debit' },
          { label: 'الخصوم طويلة الأمد', value: 65000,  type: 'debit' },
          { label: 'حقوق الملكية',       value: 344000, type: 'grand' },
        ],
      },
      {
        icon: 'fa-money-bill-transfer', label: 'التدفق النقدي', desc: 'حركة الأموال الواردة والصادرة',
        data: [
          { label: 'تدفق نقدي من العمليات', value: 155000, type: 'credit' },
          { label: 'تدفق نقدي من الاستثمار', value: 32000, type: 'debit' },
          { label: 'تدفق نقدي من التمويل', value: 18500, type: 'debit' },
          { label: 'صافي التدفق النقدي', value: 104500, type: 'grand' },
        ],
      },
      {
        icon: 'fa-chart-pie', label: 'تحليل الإيرادات', desc: 'توزيع الإيرادات حسب المصدر',
        data: [
          { label: 'مبيعات المنتجات',  value: 162000, type: 'credit' },
          { label: 'مبيعات الخدمات',  value: 78500,  type: 'credit' },
          { label: 'عمولات',           value: 28000,  type: 'credit' },
          { label: 'إيرادات أخرى',    value: 16000,  type: 'credit' },
          { label: 'الإجمالي',         value: 284500, type: 'grand' },
        ],
      },
    ],
  },
  {
    title: 'تقارير المبيعات',
    icon: 'fa-cart-shopping',
    color: '#10B981',
    reports: [
      {
        icon: 'fa-file-invoice', label: 'ملخص الفواتير', desc: 'إجمالي الفواتير حسب الفترة والحالة',
        data: [
          { label: 'فواتير مدفوعة',  value: 198500, type: 'credit' },
          { label: 'فواتير معلقة',   value: 54200,  type: 'debit' },
          { label: 'فواتير متأخرة',  value: 31800,  type: 'debit' },
          { label: 'مسودات',          value: 0,      type: 'neutral' },
          { label: 'الإجمالي',       value: 284500, type: 'grand' },
        ],
      },
      {
        icon: 'fa-users', label: 'مبيعات العملاء', desc: 'أداء المبيعات لكل عميل',
        data: [
          { label: 'شركة الرياض للتجارة',    value: 82400, type: 'credit' },
          { label: 'مجموعة النور',            value: 65100, type: 'credit' },
          { label: 'شركة التميز',             value: 48300, type: 'credit' },
          { label: 'ترست للاستشارات',         value: 37200, type: 'credit' },
          { label: 'عملاء آخرون',             value: 51500, type: 'credit' },
          { label: 'الإجمالي',               value: 284500, type: 'grand' },
        ],
      },
      {
        icon: 'fa-box', label: 'مبيعات المنتجات', desc: 'الأصناف الأكثر والأقل مبيعاً',
        data: [
          { label: 'جهاز لابتوب Dell XPS',    value: 62500, type: 'credit' },
          { label: 'طابعة HP LaserJet',       value: 48200, type: 'credit' },
          { label: 'شاشة LG 27"',             value: 35800, type: 'credit' },
          { label: 'قرص SSD 1TB',             value: 28100, type: 'credit' },
          { label: 'منتجات أخرى',             value: 109900, type: 'credit' },
          { label: 'الإجمالي',               value: 284500, type: 'grand' },
        ],
      },
      {
        icon: 'fa-map-pin', label: 'مبيعات الفروع', desc: 'مقارنة أداء الفروع',
        data: [
          { label: 'الفرع الرئيسي — الرياض', value: 142000, type: 'credit' },
          { label: 'فرع جدة',                value: 85500,  type: 'credit' },
          { label: 'فرع الدمام',             value: 57000,  type: 'credit' },
          { label: 'الإجمالي',              value: 284500, type: 'grand' },
        ],
      },
    ],
  },
  {
    title: 'تقارير المشتريات',
    icon: 'fa-shopping-cart',
    color: '#7C3AED',
    reports: [
      {
        icon: 'fa-industry', label: 'ملخص الموردين', desc: 'إجمالي المشتريات لكل مورد',
        data: [
          { label: 'شركة البيان للأجهزة',   value: 45200, type: 'debit' },
          { label: 'موردون الإلكترونيات',   value: 32800, type: 'debit' },
          { label: 'المتحدة للتوريدات',     value: 20100, type: 'debit' },
          { label: 'الإجمالي',             value: 98100, type: 'grand' },
        ],
      },
      {
        icon: 'fa-receipt', label: 'تقرير المصروفات', desc: 'تصنيف وتحليل المصروفات',
        data: [
          { label: 'رواتب وأجور',         value: 28500, type: 'debit' },
          { label: 'إيجارات',             value: 8200,  type: 'debit' },
          { label: 'مصروفات إدارية',     value: 3600,  type: 'debit' },
          { label: 'مصروفات تسويق',      value: 1800,  type: 'debit' },
          { label: 'الإجمالي',           value: 42100, type: 'grand' },
        ],
      },
      {
        icon: 'fa-warehouse', label: 'حركة المخزون', desc: 'الوارد والصادر والرصيد',
        data: [
          { label: 'رصيد أول المدة',   value: 185000, type: 'credit' },
          { label: 'مشتريات الفترة',   value: 98100,  type: 'credit' },
          { label: 'مبيعات الفترة',    value: 162000, type: 'debit' },
          { label: 'رصيد آخر المدة',   value: 121100, type: 'grand' },
        ],
      },
      {
        icon: 'fa-truck', label: 'أوامر الشراء', desc: 'حالة وتتبع أوامر الشراء',
        data: [
          { label: 'أوامر منفذة',    value: 62000, type: 'credit' },
          { label: 'أوامر معلقة',    value: 24000, type: 'debit' },
          { label: 'أوامر ملغاة',    value: 12100, type: 'debit' },
          { label: 'الإجمالي',      value: 98100, type: 'grand' },
        ],
      },
    ],
  },
  {
    title: 'تقارير الموارد البشرية',
    icon: 'fa-users-cog',
    color: '#D97706',
    reports: [
      {
        icon: 'fa-money-bill-wave', label: 'مسير الرواتب', desc: 'تفاصيل رواتب الموظفين',
        data: [
          { label: 'الراتب الأساسي',      value: 22000, type: 'debit' },
          { label: 'بدل السكن',           value: 4000,  type: 'debit' },
          { label: 'بدل النقل',           value: 1500,  type: 'debit' },
          { label: 'استقطاع GOSI',        value: 1100,  type: 'credit' },
          { label: 'صافي المرتبات',       value: 26400, type: 'grand' },
        ],
      },
      {
        icon: 'fa-calendar-check', label: 'الحضور والغياب', desc: 'سجل الحضور لكل موظف',
        data: [
          { label: 'أيام العمل',       value: 22,  type: 'neutral' },
          { label: 'أيام الحضور',      value: 20,  type: 'credit' },
          { label: 'أيام الغياب',      value: 2,   type: 'debit' },
          { label: 'أيام الإجازة',     value: 0,   type: 'neutral' },
        ],
      },
      {
        icon: 'fa-umbrella-beach', label: 'الإجازات', desc: 'رصيد واستخدام الإجازات',
        data: [
          { label: 'رصيد مرحّل',       value: 18,  type: 'credit' },
          { label: 'مستحقات جديدة',    value: 6,   type: 'credit' },
          { label: 'إجازات مأخوذة',    value: 8,   type: 'debit' },
          { label: 'الرصيد المتبقي',   value: 16,  type: 'grand' },
        ],
      },
      {
        icon: 'fa-hand-holding-dollar', label: 'السلف والاستحقاقات', desc: 'سلف الموظفين والمستحقات',
        data: [
          { label: 'سلف مديونة',       value: 8500,  type: 'debit' },
          { label: 'سلف مسددة',        value: 3200,  type: 'credit' },
          { label: 'مكافآت مستحقة',    value: 5000,  type: 'credit' },
          { label: 'صافي الاستحقاقات', value: 8300,  type: 'grand' },
        ],
      },
    ],
  },
  {
    title: 'تقارير الضريبة والزكاة',
    icon: 'fa-shield-halved',
    color: '#DC2626',
    reports: [
      {
        icon: 'fa-percent', label: 'تقرير ضريبة القيمة المضافة', desc: 'الضريبة المحصلة والمدفوعة',
        data: [
          { label: 'ضريبة المبيعات المحصلة', value: 42675, type: 'credit' },
          { label: 'ضريبة المشتريات',         value: 14715, type: 'debit' },
          { label: 'صافي الضريبة المستحقة',   value: 27960, type: 'grand' },
        ],
      },
      {
        icon: 'fa-file-shield', label: 'إقرار ZATCA', desc: 'إعداد الإقرار الضريبي',
        data: [
          { label: 'إيرادات خاضعة للضريبة', value: 284500, type: 'credit' },
          { label: 'إيرادات معفاة',          value: 0,      type: 'neutral' },
          { label: 'مشتريات خاضعة للضريبة', value: 98100,  type: 'debit' },
          { label: 'ضريبة المبيعات 15%',     value: 42675,  type: 'credit' },
          { label: 'ضريبة المشتريات 15%',    value: 14715,  type: 'debit' },
          { label: 'الضريبة المستحقة',       value: 27960,  type: 'grand' },
        ],
      },
      {
        icon: 'fa-building-columns', label: 'كشف الضرائب', desc: 'ملخص الالتزامات الضريبية',
        data: [
          { label: 'ضريبة الدخل',   value: 8200,  type: 'debit' },
          { label: 'ضريبة القيمة المضافة', value: 27960, type: 'debit' },
          { label: 'رسوم GOSI',     value: 3300,  type: 'debit' },
          { label: 'الإجمالي',      value: 39460, type: 'grand' },
        ],
      },
      {
        icon: 'fa-clipboard-check', label: 'فاتورة إلكترونية', desc: 'تقرير الفواتير الإلكترونية',
        data: [
          { label: 'فواتير B2B مرسلة',  value: 24,  type: 'credit' },
          { label: 'فواتير B2C مرسلة',  value: 86,  type: 'credit' },
          { label: 'فواتير مرفوضة',      value: 2,   type: 'debit' },
          { label: 'فواتير معلقة ZATCA', value: 3,   type: 'debit' },
          { label: 'الإجمالي',          value: 115, type: 'grand' },
        ],
      },
    ],
  },
]

const PERIOD_LABEL: Record<string, string> = {
  'هذا الشهر': 'أبريل 2025',
  'ربع السنة': 'الربع الثاني 2025',
  'هذا العام': 'عام 2025',
}

function printReport(
  report: typeof REPORT_GROUPS[0]['reports'][0],
  period: string,
  tpl: typeof RPT_TEMPLATES[0],
) {
  const win = window.open('', '_blank', 'width=860,height=720')
  if (!win) { toast('يرجى السماح بالنوافذ المنبثقة', 'warn'); return }

  const isLight = tpl.id === 'clean'
  const periodLabel = PERIOD_LABEL[period] ?? period
  const isCurrencyReport = report.data.some(d => d.value > 100)
  const unit = isCurrencyReport ? 'ر.س' : ''

  const rowColor = (type: string) => {
    if (type === 'grand')  return '#1d4ed8'
    if (type === 'total')  return '#374151'
    if (type === 'credit') return '#065f46'
    if (type === 'debit')  return '#991b1b'
    return '#374151'
  }

  const rowBg = (type: string) => {
    if (type === 'grand')  return '#EFF6FF'
    if (type === 'total')  return '#F9FAFB'
    if (type === 'credit') return '#F0FDF4'
    if (type === 'debit')  return '#FEF2F2'
    return '#fff'
  }

  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${report.label}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Tajawal',Arial,sans-serif;font-size:13px;background:#F8FAFC;color:#111827;direction:rtl}
  .page{max-width:820px;margin:0 auto;padding:36px 32px;background:#fff}
  .hdr{background:${tpl.headerBg};color:${tpl.headerColor};padding:28px 32px;border-radius:10px 10px 0 0;margin-bottom:0}
  .hdr-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
  .company-name{font-size:20px;font-weight:900}
  .company-sub{font-size:11px;opacity:.75;margin-top:4px}
  .report-title-box{text-align:left}
  .report-title{font-size:22px;font-weight:900}
  .report-sub{font-size:12px;opacity:.75;margin-top:4px}
  .hdr-meta{display:flex;gap:24px;padding-top:14px;border-top:1px solid ${isLight ? '#E5E7EB' : 'rgba(255,255,255,.15)'}}
  .meta-item{font-size:11px;opacity:.8}
  .meta-label{font-weight:700;margin-left:4px}
  .body{border:1px solid #E5E7EB;border-top:none;border-radius:0 0 10px 10px;padding:0;overflow:hidden}
  .section{padding:20px 28px}
  .section-title{font-size:13px;font-weight:800;color:${tpl.accent};margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${tpl.accent}30}
  table{width:100%;border-collapse:collapse}
  th{background:#F4F6FA;padding:10px 14px;font-size:11px;font-weight:800;text-align:right;color:#374151;border-bottom:2px solid #E5E7EB}
  td{padding:10px 14px;font-size:13px;border-bottom:1px solid #F3F4F6}
  .row-grand td{font-weight:900;font-size:14px;border-top:2px solid #D1D5DB;border-bottom:none}
  .row-total td{font-weight:700;background:#F9FAFB}
  .row-credit td{background:#F0FDF4}
  .row-debit td{background:#FEF2F2}
  .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:20px 28px;background:#F8FAFC;border-bottom:1px solid #E5E7EB}
  .sum-card{background:#fff;border:1px solid #E5E7EB;border-radius:8px;padding:14px 16px}
  .sum-label{font-size:11px;color:#6B7280;margin-bottom:6px}
  .sum-value{font-size:18px;font-weight:900}
  .footer{padding:18px 28px;background:#F8FAFC;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;align-items:center}
  .footer-note{font-size:11px;color:#6B7280}
  .sig-box{border-top:1px solid #9CA3AF;padding-top:6px;font-size:11px;color:#6B7280;min-width:180px;text-align:center}
  @media print{@page{margin:8mm;size:A4}body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div class="hdr-top">
      <div>
        <div class="company-name">شركة سهل التقنية</div>
        <div class="company-sub">الرقم الضريبي: 310123456700003 &nbsp;|&nbsp; الرياض، المملكة العربية السعودية</div>
      </div>
      <div class="report-title-box">
        <div class="report-title">${report.label}</div>
        <div class="report-sub">${report.desc}</div>
      </div>
    </div>
    <div class="hdr-meta">
      <div class="meta-item"><span class="meta-label">الفترة:</span>${periodLabel}</div>
      <div class="meta-item"><span class="meta-label">تاريخ الإصدار:</span>${new Date().toLocaleDateString('ar-SA')}</div>
      <div class="meta-item"><span class="meta-label">أعدّه:</span>قسم المحاسبة</div>
      <div class="meta-item"><span class="meta-label">القالب:</span>${tpl.name}</div>
    </div>
  </div>

  <div class="body">
    <div class="summary">
      ${report.data.filter(d => d.type === 'grand').map(d => `
        <div class="sum-card" style="border-top:3px solid ${tpl.accent};grid-column:span 3">
          <div class="sum-label">${d.label}</div>
          <div class="sum-value" style="color:${tpl.accent}">${isCurrencyReport ? d.value.toLocaleString('ar-SA') + ' ' + unit : d.value}</div>
        </div>
      `).join('')}
      ${report.data.filter(d => d.type === 'credit').slice(0, 3).map(d => `
        <div class="sum-card">
          <div class="sum-label" style="color:#065f46">${d.label}</div>
          <div class="sum-value" style="color:#065f46">${isCurrencyReport ? d.value.toLocaleString('ar-SA') + ' ' + unit : d.value}</div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <div class="section-title">تفاصيل ${report.label}</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>البيان</th>
            <th style="text-align:left">${isCurrencyReport ? 'المبلغ (ر.س)' : 'القيمة'}</th>
            <th style="text-align:center">النوع</th>
          </tr>
        </thead>
        <tbody>
          ${report.data.map((row, i) => `
            <tr class="row-${row.type}">
              <td style="color:#9CA3AF;font-size:11px;text-align:center">${i + 1}</td>
              <td style="font-weight:${row.type === 'grand' ? '900' : row.type === 'total' ? '700' : '500'};color:${rowColor(row.type)}">${row.label}</td>
              <td style="text-align:left;font-weight:${row.type === 'grand' ? '900' : '600'};color:${rowColor(row.type)};direction:ltr">
                ${row.value === 0 ? '—' : isCurrencyReport ? row.value.toLocaleString('ar-SA') : row.value}
              </td>
              <td style="text-align:center">
                <span style="background:${rowBg(row.type)};color:${rowColor(row.type)};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid ${rowColor(row.type)}30">
                  ${row.type === 'grand' ? 'إجمالي' : row.type === 'total' ? 'مجموع' : row.type === 'credit' ? 'دائن' : row.type === 'debit' ? 'مدين' : 'محايد'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div class="footer-note">
        <div>تقرير آلي — سهل نظام المحاسبة</div>
        <div style="margin-top:2px">جميع المبالغ بالريال السعودي (SAR)</div>
      </div>
      <div style="display:flex;gap:48px">
        <div class="sig-box">توقيع مدير الحسابات</div>
        <div class="sig-box">الختم الرسمي للشركة</div>
      </div>
    </div>
  </div>
</div>
<script>window.onload=()=>{window.print();}<\/script>
</body>
</html>`)
  win.document.close()
}

export default function ReportsPage() {
  const [period, setPeriod]   = useState('هذا الشهر')
  const [rptTpl, setRptTpl]   = useState<RptTpl>('formal')
  const [showTplPicker, setShowTplPicker] = useState(false)

  const invoices = useInvoiceStore(s => s.invoices)
  const expenses = useExpenseStore(s => s.expenses)
  const purchases = usePurchaseStore(s => s.purchases)
  const products = useInventoryStore(s => s.products)
  const accounts = useTreasuryStore(s => s.accounts)
  const delegates = useDelegateStore(s => s.delegates)
  const employees = useHRStore(s => s.employees)

  // ── Real computed data ────────────────────────────────────────────────────
  const d = useMemo(() => {
    const paid = invoices.filter(i => i.status !== 'draft')
    const totalRevenue = paid.reduce((s, i) => s + i.total, 0)
    const paidRevenue = paid.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
    const pendingRevenue = paid.filter(i => i.status === 'pending').reduce((s, i) => s + i.total, 0)
    const overdueRevenue = paid.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0)
    const totalTax = paid.reduce((s, i) => s + i.tax, 0)
    const delegateRevenue = delegates.reduce((s, del) => s + del.invoices.filter(i => i.type === 'sale').reduce((ss, i) => ss + i.subtotal, 0), 0)
    const delegateTax = delegates.reduce((s, del) => s + del.invoices.filter(i => i.type === 'sale').reduce((ss, i) => ss + i.tax, 0), 0)
    const totalPurchases = purchases.reduce((s, p) => s + p.amount, 0)
    const purchaseTax = purchases.reduce((s, p) => s + (p.tax ?? Math.round((p.total - p.amount) * 10) / 10), 0)
    const approvedExp = expenses.filter(e => e.status === 'approved')
    const totalExpenses = approvedExp.reduce((s, e) => s + e.amount, 0)
    const inventoryValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0)
    const cashBalance = accounts.reduce((s, a) => s + a.balance, 0)
    const grossProfit = totalRevenue + delegateRevenue - totalPurchases
    const operatingProfit = grossProfit - totalExpenses
    const vatOut = totalTax + delegateTax
    const vatNet = Math.max(0, vatOut - purchaseTax)
    // Top customers
    const custMap: Record<string, { name: string; total: number }> = {}
    paid.forEach(inv => {
      const k = inv.customerId || inv.customer
      if (!custMap[k]) custMap[k] = { name: inv.customer, total: 0 }
      custMap[k].total += inv.total
    })
    const topCust = Object.values(custMap).sort((a, b) => b.total - a.total).slice(0, 5)
    // Top products
    const prodMap: Record<string, { name: string; total: number }> = {}
    paid.forEach(inv => inv.items.forEach(it => {
      const k = it.productId || it.description
      if (!prodMap[k]) prodMap[k] = { name: it.description, total: 0 }
      prodMap[k].total += it.total
    }))
    const topProd = Object.values(prodMap).sort((a, b) => b.total - a.total).slice(0, 5)
    // Top vendors
    const vendMap: Record<string, number> = {}
    purchases.forEach(p => { vendMap[(p as any).vendor ?? p.supplier ?? 'غير محدد'] = (vendMap[(p as any).vendor ?? p.supplier ?? 'غير محدد'] ?? 0) + p.amount })
    const topVend = Object.entries(vendMap).sort((a, b) => b[1] - a[1]).slice(0, 3)
    // Expense categories
    const expCat: Record<string, number> = {}
    approvedExp.forEach(e => { expCat[e.category ?? e.description] = (expCat[e.category ?? e.description] ?? 0) + e.amount })
    const topExpCat = Object.entries(expCat).sort((a, b) => b[1] - a[1]).slice(0, 5)
    // Purchases by status
    const poReceived = purchases.filter(p => p.status === 'received').reduce((s, p) => s + p.total, 0)
    const poPending = purchases.filter(p => p.status === 'pending' || p.status === 'partial').reduce((s, p) => s + p.total, 0)
    // Salaries
    const totalSalaries = employees.filter(e => e.status === 'active').reduce((s, e) => s + ((e as any).salary ?? 0), 0)
    const activeEmp = employees.filter(e => e.status === 'active').length
    return {
      totalRevenue, delegateRevenue, paidRevenue, pendingRevenue, overdueRevenue,
      totalTax, delegateTax, vatOut, vatNet,
      totalPurchases, purchaseTax, poReceived, poPending,
      totalExpenses, inventoryValue, cashBalance,
      grossProfit, operatingProfit,
      topCust, topProd, topVend, topExpCat,
      totalSalaries, activeEmp,
    }
  }, [invoices, expenses, purchases, products, accounts, delegates, employees])

  // ── Real monthly chart data ───────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; revenue: number; expenses: number }> = {}
    invoices.filter(i => i.status !== 'draft').forEach(i => {
      const k = i.date.slice(0, 7)
      if (!months[k]) months[k] = { month: k, revenue: 0, expenses: 0 }
      months[k].revenue += i.amount
    })
    delegates.forEach(del => del.invoices.filter(i => i.type === 'sale').forEach(i => {
      const k = i.date.slice(0, 7)
      if (!months[k]) months[k] = { month: k, revenue: 0, expenses: 0 }
      months[k].revenue += i.subtotal
    }))
    expenses.filter(e => e.status === 'approved').forEach(e => {
      const k = e.date.slice(0, 7)
      if (!months[k]) months[k] = { month: k, revenue: 0, expenses: 0 }
      months[k].expenses += e.amount
    })
    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(r => ({ ...r, month: new Date(r.month + '-01').toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }) }))
      .slice(-12)
  }, [invoices, expenses, delegates])

  // ── Real REPORT_GROUPS ────────────────────────────────────────────────────
  const reportGroups = useMemo(() => [
    {
      title: 'التقارير المالية', icon: 'fa-chart-line', color: '#2563EB',
      reports: [
        { icon: 'fa-file-invoice-dollar', label: 'قائمة الدخل', desc: 'الإيرادات والمصروفات وصافي الربح',
          data: [
            { label: 'إجمالي الإيرادات',  value: d.totalRevenue + d.delegateRevenue, type: 'credit' },
            { label: 'تكلفة المبيعات',    value: d.totalPurchases, type: 'debit' },
            { label: 'إجمالي الربح',      value: d.grossProfit, type: 'total' },
            { label: 'مصروفات التشغيل',   value: d.totalExpenses, type: 'debit' },
            { label: 'صافي الربح',        value: d.operatingProfit, type: 'grand' },
          ] },
        { icon: 'fa-scale-balanced', label: 'الميزانية العمومية', desc: 'الأصول والخصوم وحقوق الملكية',
          data: [
            { label: 'النقد والخزينة',     value: d.cashBalance, type: 'credit' },
            { label: 'المخزون',            value: d.inventoryValue, type: 'credit' },
            { label: 'إجمالي الأصول',      value: d.cashBalance + d.inventoryValue, type: 'total' },
            { label: 'الخصوم المتداولة',   value: Math.max(0, d.vatNet), type: 'debit' },
            { label: 'حقوق الملكية',       value: d.cashBalance + d.inventoryValue - Math.max(0, d.vatNet), type: 'grand' },
          ] },
        { icon: 'fa-money-bill-transfer', label: 'التدفق النقدي', desc: 'حركة الأموال الواردة والصادرة',
          data: [
            { label: 'إيرادات محصّلة', value: d.paidRevenue, type: 'credit' },
            { label: 'مدفوعات مصروفات', value: d.totalExpenses, type: 'debit' },
            { label: 'مدفوعات مشتريات', value: d.totalPurchases, type: 'debit' },
            { label: 'رصيد الخزينة', value: d.cashBalance, type: 'grand' },
          ] },
        { icon: 'fa-chart-pie', label: 'تحليل الإيرادات', desc: 'توزيع الإيرادات حسب المصدر',
          data: [
            { label: 'مبيعات مباشرة',    value: d.totalRevenue, type: 'credit' },
            { label: 'مبيعات المناديب',  value: d.delegateRevenue, type: 'credit' },
            { label: 'الإجمالي',         value: d.totalRevenue + d.delegateRevenue, type: 'grand' },
          ] },
      ],
    },
    {
      title: 'تقارير المبيعات', icon: 'fa-cart-shopping', color: '#10B981',
      reports: [
        { icon: 'fa-file-invoice', label: 'ملخص الفواتير', desc: 'إجمالي الفواتير حسب الفترة والحالة',
          data: [
            { label: 'فواتير مدفوعة',  value: d.paidRevenue, type: 'credit' },
            { label: 'فواتير معلقة',   value: d.pendingRevenue, type: 'debit' },
            { label: 'فواتير متأخرة',  value: d.overdueRevenue, type: 'debit' },
            { label: 'الإجمالي',       value: d.totalRevenue, type: 'grand' },
          ] },
        { icon: 'fa-users', label: 'مبيعات العملاء', desc: 'أداء المبيعات لكل عميل',
          data: [
            ...d.topCust.map(c => ({ label: c.name, value: c.total, type: 'credit' as const })),
            { label: 'الإجمالي', value: d.totalRevenue + d.delegateRevenue, type: 'grand' as const },
          ] },
        { icon: 'fa-box', label: 'مبيعات المنتجات', desc: 'الأصناف الأكثر والأقل مبيعاً',
          data: [
            ...d.topProd.map(p => ({ label: p.name, value: p.total, type: 'credit' as const })),
            { label: 'الإجمالي', value: d.totalRevenue, type: 'grand' as const },
          ] },
        { icon: 'fa-users-between-lines', label: 'مبيعات المناديب', desc: 'مقارنة أداء المناديب',
          data: [
            ...delegates.map(del => ({ label: del.name, value: del.stats.totalSales, type: 'credit' as const })),
            { label: 'الإجمالي', value: d.delegateRevenue, type: 'grand' as const },
          ] },
      ],
    },
    {
      title: 'تقارير المشتريات', icon: 'fa-shopping-cart', color: '#7C3AED',
      reports: [
        { icon: 'fa-industry', label: 'ملخص الموردين', desc: 'إجمالي المشتريات لكل مورد',
          data: [
            ...d.topVend.map(([name, val]) => ({ label: name, value: val, type: 'debit' as const })),
            { label: 'الإجمالي', value: d.totalPurchases, type: 'grand' as const },
          ] },
        { icon: 'fa-receipt', label: 'تقرير المصروفات', desc: 'تصنيف وتحليل المصروفات',
          data: [
            ...d.topExpCat.map(([name, val]) => ({ label: name, value: val, type: 'debit' as const })),
            { label: 'الإجمالي', value: d.totalExpenses, type: 'grand' as const },
          ] },
        { icon: 'fa-warehouse', label: 'حركة المخزون', desc: 'الوارد والصادر والرصيد',
          data: [
            { label: 'مشتريات الفترة', value: d.totalPurchases, type: 'credit' as const },
            { label: 'قيمة المخزون الحالي', value: d.inventoryValue, type: 'grand' as const },
          ] },
        { icon: 'fa-truck', label: 'أوامر الشراء', desc: 'حالة وتتبع أوامر الشراء',
          data: [
            { label: 'أوامر منفذة',  value: d.poReceived, type: 'credit' as const },
            { label: 'أوامر معلقة', value: d.poPending, type: 'debit' as const },
            { label: 'الإجمالي',    value: d.totalPurchases + d.poPending, type: 'grand' as const },
          ] },
      ],
    },
    {
      title: 'تقارير الضريبة والزكاة', icon: 'fa-shield-halved', color: '#DC2626',
      reports: [
        { icon: 'fa-percent', label: 'تقرير ضريبة القيمة المضافة', desc: 'الضريبة المحصلة والمدفوعة',
          data: [
            { label: 'ضريبة المبيعات المحصلة', value: d.vatOut, type: 'credit' as const },
            { label: 'ضريبة المشتريات',         value: d.purchaseTax, type: 'debit' as const },
            { label: 'صافي الضريبة المستحقة',   value: d.vatNet, type: 'grand' as const },
          ] },
        { icon: 'fa-file-shield', label: 'إقرار ZATCA', desc: 'إعداد الإقرار الضريبي',
          data: [
            { label: 'إيرادات خاضعة للضريبة', value: d.totalRevenue + d.delegateRevenue, type: 'credit' as const },
            { label: 'مشتريات خاضعة للضريبة', value: d.totalPurchases, type: 'debit' as const },
            { label: 'ضريبة المبيعات 15%',     value: d.vatOut, type: 'credit' as const },
            { label: 'ضريبة المشتريات 15%',    value: d.purchaseTax, type: 'debit' as const },
            { label: 'الضريبة المستحقة',       value: d.vatNet, type: 'grand' as const },
          ] },
        { icon: 'fa-clipboard-check', label: 'فاتورة إلكترونية', desc: 'تقرير الفواتير الإلكترونية',
          data: [
            { label: 'إجمالي الفواتير',   value: invoices.filter(i => i.status !== 'draft').length, type: 'credit' as const },
            { label: 'فواتير مدفوعة',     value: invoices.filter(i => i.status === 'paid').length, type: 'credit' as const },
            { label: 'فواتير معلقة',      value: invoices.filter(i => i.status === 'pending').length, type: 'debit' as const },
          ] },
      ],
    },
  ], [d, delegates, invoices])

  // ── Real KPI Data ─────────────────────────────────────────────────────────
  const kpiData = useMemo(() => {
    const totalRev = d.totalRevenue + d.delegateRevenue
    const grossMargin = totalRev > 0 ? Math.round(d.grossProfit / totalRev * 1000) / 10 : 0
    const avgInvoice = invoices.filter(i => i.status !== 'draft').length > 0
      ? Math.round(totalRev / invoices.filter(i => i.status !== 'draft').length) : 0
    const collectionRate = d.totalRevenue > 0 ? Math.round(d.paidRevenue / (d.totalRevenue * 1.15) * 100) : 0
    const expenseRatio = totalRev > 0 ? Math.round(d.totalExpenses / totalRev * 100) : 0
    return [
      { label: 'هامش الربح الإجمالي', value: `${grossMargin}%`, icon: 'fa-percent', color: '#10B981' },
      { label: 'متوسط قيمة الفاتورة', value: avgInvoice.toLocaleString('ar-SA'), icon: 'fa-file-invoice', color: '#2563EB' },
      { label: 'نسبة الفواتير المدفوعة', value: `${collectionRate}%`, icon: 'fa-hand-holding-dollar', color: '#D97706' },
      { label: 'نسبة المصروفات', value: `${expenseRatio}%`, icon: 'fa-receipt', color: '#7C3AED' },
    ]
  }, [d, invoices])

  const activeTpl = RPT_TEMPLATES.find(t => t.id === rptTpl) ?? RPT_TEMPLATES[0]

  const handleReport = (report: { label: string; desc: string; icon: string; data: { label: string; value: number; type: string }[] }) => {
    printReport(report as any, period, activeTpl)
    toast(`جارٍ تحضير تقرير: ${report.label}...`, 'info')
  }

  return (
    <>
      <PageHeader
        title="مركز التقارير"
        subtitle="تقارير شاملة لكل جوانب العمل"
        actions={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setShowTplPicker(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span style={{ width: 12, height: 12, borderRadius: 3, background: activeTpl.accent, display: 'inline-block' }} />
              قالب: {activeTpl.name}
              <i className="fa fa-chevron-down" style={{ fontSize: 10 }} />
            </button>
            {['هذا الشهر', 'ربع السنة', 'هذا العام'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`}>{p}</button>
            ))}
          </div>
        }
      />

      {/* Template Picker Dropdown */}
      {showTplPicker && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
          <div style={{ gridColumn: '1 / -1', fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>اختر قالب طباعة التقارير</span>
            <button className="btn btn-sm btn-outline" style={{ fontSize: 11 }} onClick={() => setShowTplPicker(false)}>إغلاق</button>
          </div>
          {RPT_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => { setRptTpl(tpl.id); setShowTplPicker(false); toast(`تم اختيار قالب: ${tpl.name}`, 'success') }}
              style={{
                border: rptTpl === tpl.id ? `2px solid ${tpl.accent}` : '2px solid var(--border)',
                borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: 'none',
                transition: '.15s', padding: 0,
              }}
            >
              <div style={{ height: 52, background: tpl.headerBg }} />
              <div style={{ padding: '8px 10px', textAlign: 'right', background: rptTpl === tpl.id ? tpl.accent + '10' : 'var(--bg)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{tpl.name}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.4, marginTop: 2 }}>{tpl.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {kpiData.map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: kpi.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fa ${kpi.icon}`} style={{ fontSize: 16, color: kpi.color }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--muted)', flex: 1 }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{kpi.value}</div>
            <div style={{ fontSize: 12, marginTop: 4, color: 'var(--muted)', fontWeight: 600 }}>
              مقارنة بالفترة السابقة
            </div>
          </div>
        ))}
      </div>

      {/* Charts overview */}
      <div className="grid-2 mb-6">
        <Card title="الإيراد والمصروفات" action={<span style={{ fontSize: 12, color: 'var(--success)' }}>بيانات حقيقية</span>}>
          <RevenueChart data={monthlyData} />
        </Card>
        <Card title="نمو الإيراد" action={<span style={{ fontSize: 12, color: 'var(--success)' }}>بيانات حقيقية</span>}>
          <LineAreaChart data={monthlyData} dataKey="revenue" label="الإيراد" color="var(--blue)" />
        </Card>
      </div>

      {/* Report groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {reportGroups.map(group => (
          <div key={group.title}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: group.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fa ${group.icon}`} style={{ color: group.color, fontSize: 14 }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{group.title}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {group.reports.map(r => (
                <button
                  key={r.label}
                  onClick={() => handleReport(r)}
                  style={{
                    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
                    padding: '14px 16px', cursor: 'pointer', textAlign: 'right', transition: '.15s',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = group.color
                    ;(e.currentTarget as HTMLElement).style.background = group.color + '07'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--card)'
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: group.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fa ${r.icon}`} style={{ fontSize: 14, color: group.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{r.desc}</div>
                  </div>
                  <i className="fa fa-print" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Active template indicator */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: activeTpl.headerBg, flexShrink: 0, border: '1px solid var(--border)' }} />
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          قالب الطباعة الحالي: <strong style={{ color: 'var(--text)' }}>{activeTpl.name}</strong> — {activeTpl.desc}
        </span>
        <button className="btn btn-sm btn-outline" style={{ marginRight: 'auto', fontSize: 11 }} onClick={() => setShowTplPicker(true)}>
          <i className="fa fa-palette" /> تغيير القالب
        </button>
      </div>
    </>
  )
}
