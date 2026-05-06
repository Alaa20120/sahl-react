import { toast } from './toast'
import { fmt } from './format'

function openPrintWindow(title: string, html: string) {
  const win = window.open('', '_blank', 'width=800,height=600')
  if (!win) { toast('يرجى السماح بالنوافذ المنبثقة للطباعة', 'warn'); return }
  win.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        body { font-family: 'Tajawal', Arial, sans-serif; padding: 40px; color: #111; font-size: 14px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; }
        .meta { font-size: 14px; color: #555; }
        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .table th, .table td { border: 1px solid #ccc; padding: 12px; text-align: right; }
        .table th { background: #f9f9f9; }
        .footer { display: flex; justify-content: space-between; margin-top: 60px; text-align: center; }
        .signature { border-top: 1px solid #000; padding-top: 10px; width: 250px; font-weight: bold; }
        .box { border: 1px solid #ccc; padding: 20px; border-radius: 8px; margin-top: 20px; font-size: 16px; line-height: 2; }
        .amount-box { background: #f8f9ff; border: 2px solid #0D1117; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }
        .amount-box .label { font-size: 12px; color: #666; margin-bottom: 4px; }
        .amount-box .value { font-size: 28px; font-weight: 800; color: #0D1117; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      ${html}
      <script>window.onload = () => { window.print(); };</script>
    </body>
    </html>
  `)
  win.document.close()
}

export function printStockReceipt(delegateName: string, productName: string, qty: number, unit: string, costValue: number) {
  const dateStr = new Date().toLocaleString('ar-SA')
  openPrintWindow('إيصال استلام عهدة', `
    <div class="header">
      <div><div class="title">إيصال استلام عهدة / مخزون</div><div class="meta">شركة سهل التقنية</div></div>
      <div style="text-align: left"><div>التاريخ: ${dateStr}</div><div>اسم المندوب: <strong>${delegateName}</strong></div></div>
    </div>
    <p>أقر أنا المندوب المذكور أعلاه باستلام المواد والكميات الموضحة أدناه لتكون في عهدتي بغرض المبيعات، وأتعهد بالمحافظة عليها وتسديد قيمتها عند البيع:</p>
    <table class="table"><thead><tr><th>الصنف</th><th>الكمية</th><th>القيمة الإجمالية (تقديرية)</th></tr></thead>
    <tbody><tr><td>${productName}</td><td>${qty} ${unit}</td><td>${fmt(costValue)}</td></tr></tbody></table>
    <div class="footer"><div><div class="signature">توقيع المندوب (المستلم)</div></div><div><div class="signature">توقيع أمين المستودع (المُسلم)</div></div></div>
  `)
}

export function printFinancialReceipt(type: 'in' | 'out', amount: number, desc: string, accountName: string, category: string, refId: string) {
  const dateStr = new Date().toLocaleString('ar-SA')
  const title = type === 'in' ? 'سند قبض' : 'سند صرف'
  openPrintWindow(`${title} - ${refId}`, `
    <div class="header">
      <div><div class="title">${title}</div><div class="meta">شركة سهل التقنية</div></div>
      <div style="text-align: left"><div>التاريخ: ${dateStr}</div><div>رقم السند: <strong>${refId}</strong></div></div>
    </div>
    <div class="amount-box"><div class="label">المبلغ</div><div class="value">${fmt(amount)}</div></div>
    <div class="box">
      <div><strong>البيان / الوصف:</strong> ${desc}</div>
      <div><strong>تصنيف الحركة:</strong> ${category}</div>
      <div><strong>عن طريق حساب:</strong> ${accountName}</div>
    </div>
    <div class="footer"><div><div class="signature">توقيع المستلم / المودع</div></div><div><div class="signature">توقيع المحاسب / أمين الصندوق</div></div></div>
  `)
}

/** إيصال دفعة من عميل أو مورد */
export function printPaymentReceipt(
  payerName: string,
  amount: number,
  paymentType: 'collection' | 'payment',
  method: string,
  balanceBefore: number,
  balanceAfter: number,
  refId: string,
  notes?: string
) {
  const dateStr = new Date().toLocaleString('ar-SA')
  const title = paymentType === 'collection' ? 'إيصال استلام مبلغ' : 'إيصال صرف مبلغ'
  const direction = paymentType === 'collection' ? 'تم استلام مبلغ من' : 'تم صرف مبلغ لـ'

  openPrintWindow(`${title} - ${refId}`, `
    <div class="header">
      <div><div class="title">${title}</div><div class="meta">شركة سهل التقنية</div></div>
      <div style="text-align: left"><div>التاريخ: ${dateStr}</div><div>رقم الإيصال: <strong>${refId}</strong></div></div>
    </div>
    <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f8f9ff; border-radius: 12px;">
      <div style="font-size: 14px; color: #666; margin-bottom: 8px;">${direction}</div>
      <div style="font-size: 20px; font-weight: 800; color: #0D1117;">${payerName}</div>
    </div>
    <div class="amount-box"><div class="label">المبلغ المُسدَّد</div><div class="value">${fmt(amount)}</div></div>
    <div class="box">
      <div><strong>طريقة الدفع:</strong> ${method}</div>
      <div><strong>الرصيد قبل:</strong> ${fmt(Math.abs(balanceBefore))} ${balanceBefore < 0 ? 'مدين' : balanceBefore > 0 ? 'دائن' : ''}</div>
      <div><strong>الرصيد بعد:</strong> ${fmt(Math.abs(balanceAfter))} ${balanceAfter < 0 ? 'مدين' : balanceAfter > 0 ? 'دائن' : ''}</div>
      ${notes ? `<div><strong>ملاحظات:</strong> ${notes}</div>` : ''}
    </div>
    <div class="footer">
      <div><div class="signature">توقيع المستلم</div></div>
      <div><div class="signature">توقيع أمين الصندوق</div></div>
    </div>
  `)
}

/** إيصال سحب فلوس من مندوب */
export function printDelegateWithdrawalReceipt(
  delegateName: string,
  amount: number,
  description: string,
  balanceBefore: number,
  balanceAfter: number,
  refId: string
) {
  const dateStr = new Date().toLocaleString('ar-SA')
  openPrintWindow(`إيصال سحب من مندوب - ${refId}`, `
    <div class="header">
      <div><div class="title">إيصال سحب مبلغ من مندوب</div><div class="meta">شركة سهل التقنية</div></div>
      <div style="text-align: left"><div>التاريخ: ${dateStr}</div><div>رقم الإيصال: <strong>${refId}</strong></div></div>
    </div>
    <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f8f9ff; border-radius: 12px;">
      <div style="font-size: 14px; color: #666; margin-bottom: 8px;">تم سحب مبلغ من المندوب</div>
      <div style="font-size: 20px; font-weight: 800; color: #0D1117;">${delegateName}</div>
    </div>
    <div class="amount-box"><div class="label">المبلغ المسحوب</div><div class="value">${fmt(amount)}</div></div>
    <div class="box">
      <div><strong>سبب السحب:</strong> ${description}</div>
      <div><strong>الرصيد قبل السحب:</strong> ${fmt(balanceBefore)}</div>
      <div><strong>الرصيد بعد السحب:</strong> ${fmt(balanceAfter)}</div>
    </div>
    <div class="footer">
      <div><div class="signature">توقيع المندوب</div></div>
      <div><div class="signature">توقيع أمين الصندوق</div></div>
    </div>
  `)
}

/** طباعة كشف حساب */
export function printAccountStatement(
  name: string,
  items: { date: string; desc: string; debit: number; credit: number; balance: number; ref: string }[],
  fromDate: string,
  toDate: string,
  mode: 'customer' | 'delegate' = 'customer'
) {
  const dateStr = new Date().toLocaleString('ar-SA')

  // Accounting convention:
  //   balance > 0 = مدين (الجهة عليها دين = لينا فلوس عندها)
  //   balance < 0 = دائن (الجهة لها فلوس عندنا = احنا مديونين لها)
  //   balance = 0 = مسوّى
  //
  // mode='delegate': balance is money the delegate holds (always shown as positive)
  const rows = items.map(item => {
    let balanceLabel: string
    let balanceColor: string
    if (mode === 'delegate') {
      balanceLabel = ''
      balanceColor = '#0D1117'
    } else {
      const isDebtor = item.balance > 0
      const isCreditor = item.balance < 0
      balanceLabel = isDebtor ? 'مدين' : isCreditor ? 'دائن' : '—'
      balanceColor = isDebtor ? '#DC2626' : isCreditor ? '#10B981' : '#6B7280'
    }
    return `
    <tr>
      <td>${item.date}</td>
      <td>${item.desc}</td>
      <td>${item.ref}</td>
      <td style="text-align: left">${item.debit > 0 ? fmt(item.debit) : '—'}</td>
      <td style="text-align: left">${item.credit > 0 ? fmt(item.credit) : '—'}</td>
      <td style="text-align: left; font-weight: 700; color: ${balanceColor}">${fmt(Math.abs(item.balance))}${balanceLabel ? ' ' + balanceLabel : ''}</td>
    </tr>
  `}).join('')

  const finalBalance = items.length > 0 ? items[items.length - 1].balance : 0
  let finalLabel: string
  let finalColor: string
  if (mode === 'delegate') {
    finalLabel = 'رصيد المندوب'
    finalColor = '#0D1117'
  } else {
    const finalIsDebtor = finalBalance > 0
    const finalIsCreditor = finalBalance < 0
    finalLabel = finalIsDebtor ? 'مدين — عليه' : finalIsCreditor ? 'دائن — له' : 'مسوّى'
    finalColor = finalIsDebtor ? '#DC2626' : finalIsCreditor ? '#10B981' : '#0D1117'
  }

  openPrintWindow(`كشف حساب - ${name}`, `
    <div class="header">
      <div><div class="title">كشف حساب</div><div class="meta">شركة سهل التقنية</div></div>
      <div style="text-align: left"><div>التاريخ: ${dateStr}</div><div>من: ${fromDate} — إلى: ${toDate}</div></div>
    </div>
    <div style="text-align: center; margin: 16px 0; padding: 16px; background: #f8f9ff; border-radius: 8px;">
      <div style="font-size: 14px; color: #666;">الاسم</div>
      <div style="font-size: 18px; font-weight: 800; color: #0D1117;">${name}</div>
    </div>
    <table class="table">
      <thead><tr><th>التاريخ</th><th>البيان</th><th>المرجع</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top: 16px; padding: 14px 20px; background: #f8f9ff; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 13px; font-weight: 700; color: #374151;">الرصيد النهائي</div>
      <div style="font-size: 18px; font-weight: 800; color: ${finalColor}">${fmt(Math.abs(finalBalance))} ${finalLabel}</div>
    </div>
    <div class="footer">
      <div><div class="signature">توقيع العميل</div></div>
      <div><div class="signature">توقيع المحاسب</div></div>
    </div>
  `)
}

/** قسيمة راتب موظف */
export function printPayslip(emp: {
  id: string; name: string; position: string; department: string;
  salary: number; allowances: number; deductions: number; netSalary: number;
  phone?: string; email?: string; iqama?: string; joinDate?: string;
}, month: string, advances = 0) {
  const dateStr = new Date().toLocaleString('ar-SA')
  const net = emp.salary + emp.allowances - emp.deductions - advances
  openPrintWindow(`قسيمة راتب - ${emp.name}`, `
    <style>
      .payslip { max-width: 680px; margin: 0 auto; border: 2px solid #0D1117; border-radius: 8px; overflow: hidden; }
      .ps-header { background: #0D1117; color: #fff; padding: 20px 28px; display: flex; justify-content: space-between; align-items: flex-start; }
      .ps-body { padding: 24px 28px; }
      .ps-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px; }
      .ps-row.total { font-weight: 800; font-size: 15px; border-top: 2px solid #0D1117; border-bottom: none; padding-top: 12px; margin-top: 4px; }
      .ps-section { font-weight: 700; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 6px; }
      .ps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      .ps-field { background: #F9FAFB; border-radius: 6px; padding: 10px 12px; }
      .ps-field-label { font-size: 10px; color: #9CA3AF; margin-bottom: 3px; }
      .ps-field-value { font-size: 13px; font-weight: 600; }
      .green { color: #10B981; } .red { color: #EF4444; } .blue { color: #2563EB; }
    </style>
    <div class="payslip">
      <div class="ps-header">
        <div>
          <div style="font-size:18px;font-weight:800">شركة سهل التقنية</div>
          <div style="font-size:11px;opacity:.7;margin-top:4px">الرقم الضريبي: 310123456700003</div>
        </div>
        <div style="text-align:left">
          <div style="font-size:16px;font-weight:800">قسيمة الراتب</div>
          <div style="font-size:11px;opacity:.7;margin-top:4px">${month}</div>
          <div style="font-size:11px;opacity:.7">تاريخ الإصدار: ${dateStr}</div>
        </div>
      </div>
      <div class="ps-body">
        <div class="ps-grid">
          <div class="ps-field"><div class="ps-field-label">الاسم</div><div class="ps-field-value">${emp.name}</div></div>
          <div class="ps-field"><div class="ps-field-label">الرقم الوظيفي</div><div class="ps-field-value">${emp.id}</div></div>
          <div class="ps-field"><div class="ps-field-label">المسمى الوظيفي</div><div class="ps-field-value">${emp.position}</div></div>
          <div class="ps-field"><div class="ps-field-label">القسم</div><div class="ps-field-value">${emp.department}</div></div>
          ${emp.iqama ? `<div class="ps-field"><div class="ps-field-label">رقم الإقامة / الهوية</div><div class="ps-field-value">${emp.iqama}</div></div>` : ''}
          ${emp.joinDate ? `<div class="ps-field"><div class="ps-field-label">تاريخ الانضمام</div><div class="ps-field-value">${emp.joinDate}</div></div>` : ''}
        </div>

        <div class="ps-section">المستحقات</div>
        <div class="ps-row"><span>الراتب الأساسي</span><span class="green">${fmt(emp.salary)}</span></div>
        <div class="ps-row"><span>البدلات والعلاوات</span><span class="green">+${fmt(emp.allowances)}</span></div>

        <div class="ps-section">الاستقطاعات</div>
        <div class="ps-row"><span>الاستقطاعات</span><span class="red">-${fmt(emp.deductions)}</span></div>
        ${advances > 0 ? `<div class="ps-row"><span>استقطاع السلف</span><span class="red">-${fmt(advances)}</span></div>` : ''}

        <div class="ps-row total">
          <span>صافي الراتب</span>
          <span class="blue" style="font-size:18px">${fmt(net)}</span>
        </div>
      </div>
      <div style="padding:16px 28px;background:#F9FAFB;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;">
        <div style="border-top:1px solid #9CA3AF;padding-top:8px;font-size:11px;color:#6B7280;min-width:180px;text-align:center">توقيع الموظف</div>
        <div style="border-top:1px solid #9CA3AF;padding-top:8px;font-size:11px;color:#6B7280;min-width:180px;text-align:center">توقيع مدير الموارد البشرية</div>
      </div>
    </div>
  `)
}
