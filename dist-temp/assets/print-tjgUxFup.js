import{h as e,y as t}from"./index-QLgi7hlS.js";function n(e,n){let r=window.open(``,`_blank`,`width=800,height=600`);if(!r){t(`يرجى السماح بالنوافذ المنبثقة للطباعة`,`warn`);return}r.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${e}</title>
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
      ${n}
      <script>window.onload = () => { window.print(); };<\/script>
    </body>
    </html>
  `),r.document.close()}function r(t,r,i,a,o,s){let c=new Date().toLocaleString(`ar-SA`);n(`إيصال استلام عهدة`,`
    <div class="header">
      <div><div class="title">إيصال استلام عهدة / مخزون</div><div class="meta">${t.name||`—`}</div></div>
      <div style="text-align: left"><div>التاريخ: ${c}</div><div>اسم المندوب: <strong>${r}</strong></div></div>
    </div>
    <p>أقر أنا المندوب المذكور أعلاه باستلام المواد والكميات الموضحة أدناه لتكون في عهدتي بغرض المبيعات، وأتعهد بالمحافظة عليها وتسديد قيمتها عند البيع:</p>
    <table class="table"><thead><tr><th>الصنف</th><th>الكمية</th><th>القيمة الإجمالية (تقديرية)</th></tr></thead>
    <tbody><tr><td>${i}</td><td>${a} ${o}</td><td>${e(s)}</td></tr></tbody></table>
    <div class="footer"><div><div class="signature">توقيع المندوب (المستلم)</div></div><div><div class="signature">توقيع أمين المستودع (المُسلم)</div></div></div>
  `)}function i(t,r,i,a,o,s,c){let l=new Date().toLocaleString(`ar-SA`),u=r===`in`?`سند قبض`:`سند صرف`;n(`${u} - ${c}`,`
    <div class="header">
      <div><div class="title">${u}</div><div class="meta">${t.name||`—`}</div></div>
      <div style="text-align: left"><div>التاريخ: ${l}</div><div>رقم السند: <strong>${c}</strong></div></div>
    </div>
    <div class="amount-box"><div class="label">المبلغ</div><div class="value">${e(i)}</div></div>
    <div class="box">
      <div><strong>البيان / الوصف:</strong> ${a}</div>
      <div><strong>تصنيف الحركة:</strong> ${s}</div>
      <div><strong>عن طريق حساب:</strong> ${o}</div>
    </div>
    <div class="footer"><div><div class="signature">توقيع المستلم / المودع</div></div><div><div class="signature">توقيع المحاسب / أمين الصندوق</div></div></div>
  `)}function a(t,r,i,a,o,s,c,l,u){let d=new Date().toLocaleString(`ar-SA`),f=a===`collection`?`إيصال استلام مبلغ`:`إيصال صرف مبلغ`,p=a===`collection`?`تم استلام مبلغ من`:`تم صرف مبلغ لـ`;n(`${f} - ${l}`,`
    <div class="header">
      <div><div class="title">${f}</div><div class="meta">${t.name||`—`}</div></div>
      <div style="text-align: left"><div>التاريخ: ${d}</div><div>رقم الإيصال: <strong>${l}</strong></div></div>
    </div>
    <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f8f9ff; border-radius: 12px;">
      <div style="font-size: 14px; color: #666; margin-bottom: 8px;">${p}</div>
      <div style="font-size: 20px; font-weight: 800; color: #0D1117;">${r}</div>
    </div>
    <div class="amount-box"><div class="label">المبلغ المُسدَّد</div><div class="value">${e(i)}</div></div>
    <div class="box">
      <div><strong>طريقة الدفع:</strong> ${o}</div>
      <div><strong>الرصيد قبل:</strong> ${e(Math.abs(s))} ${s<0?`مدين`:s>0?`دائن`:``}</div>
      <div><strong>الرصيد بعد:</strong> ${e(Math.abs(c))} ${c<0?`مدين`:c>0?`دائن`:``}</div>
      ${u?`<div><strong>ملاحظات:</strong> ${u}</div>`:``}
    </div>
    <div class="footer">
      <div><div class="signature">توقيع المستلم</div></div>
      <div><div class="signature">توقيع أمين الصندوق</div></div>
    </div>
  `)}function o(t,r,i,a,o,s,c){let l=new Date().toLocaleString(`ar-SA`);n(`إيصال سحب من مندوب - ${c}`,`
    <div class="header">
      <div><div class="title">إيصال سحب مبلغ من مندوب</div><div class="meta">${t.name||`—`}</div></div>
      <div style="text-align: left"><div>التاريخ: ${l}</div><div>رقم الإيصال: <strong>${c}</strong></div></div>
    </div>
    <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f8f9ff; border-radius: 12px;">
      <div style="font-size: 14px; color: #666; margin-bottom: 8px;">تم سحب مبلغ من المندوب</div>
      <div style="font-size: 20px; font-weight: 800; color: #0D1117;">${r}</div>
    </div>
    <div class="amount-box"><div class="label">المبلغ المسحوب</div><div class="value">${e(i)}</div></div>
    <div class="box">
      <div><strong>سبب السحب:</strong> ${a}</div>
      <div><strong>الرصيد قبل السحب:</strong> ${e(o)}</div>
      <div><strong>الرصيد بعد السحب:</strong> ${e(s)}</div>
    </div>
    <div class="footer">
      <div><div class="signature">توقيع المندوب</div></div>
      <div><div class="signature">توقيع أمين الصندوق</div></div>
    </div>
  `)}function s(t,r,i,a,o,s=`customer`){let c=new Date().toLocaleString(`ar-SA`),l=i.map(t=>{let n,r;if(s===`delegate`)n=``,r=`#0D1117`;else{let e=t.balance>0,i=t.balance<0;n=e?`مدين`:i?`دائن`:`—`,r=e?`#DC2626`:i?`#10B981`:`#6B7280`}return`
    <tr>
      <td>${t.date}</td>
      <td>${t.desc}</td>
      <td>${t.ref}</td>
      <td style="text-align: left">${t.debit>0?e(t.debit):`—`}</td>
      <td style="text-align: left">${t.credit>0?e(t.credit):`—`}</td>
      <td style="text-align: left; font-weight: 700; color: ${r}">${e(Math.abs(t.balance))}${n?` `+n:``}</td>
    </tr>
  `}).join(``),u=i.length>0?i[i.length-1].balance:0,d,f;if(s===`delegate`)d=`رصيد المندوب`,f=`#0D1117`;else{let e=u>0,t=u<0;d=e?`مدين — عليه`:t?`دائن — له`:`مسوّى`,f=e?`#DC2626`:t?`#10B981`:`#0D1117`}n(`كشف حساب - ${r}`,`
    <div class="header">
      <div><div class="title">كشف حساب</div><div class="meta">${t.name||`—`}</div></div>
      <div style="text-align: left"><div>التاريخ: ${c}</div><div>من: ${a} — إلى: ${o}</div></div>
    </div>
    <div style="text-align: center; margin: 16px 0; padding: 16px; background: #f8f9ff; border-radius: 8px;">
      <div style="font-size: 14px; color: #666;">الاسم</div>
      <div style="font-size: 18px; font-weight: 800; color: #0D1117;">${r}</div>
    </div>
    <table class="table">
      <thead><tr><th>التاريخ</th><th>البيان</th><th>المرجع</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead>
      <tbody>${l}</tbody>
    </table>
    <div style="margin-top: 16px; padding: 14px 20px; background: #f8f9ff; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 13px; font-weight: 700; color: #374151;">الرصيد النهائي</div>
      <div style="font-size: 18px; font-weight: 800; color: ${f}">${e(Math.abs(u))} ${d}</div>
    </div>
    <div class="footer">
      <div><div class="signature">توقيع العميل</div></div>
      <div><div class="signature">توقيع المحاسب</div></div>
    </div>
  `)}function c(t,r,i,a=0){let o=new Date().toLocaleString(`ar-SA`),s=r.salary+r.allowances-r.deductions-a;n(`قسيمة راتب - ${r.name}`,`
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
          <div style="font-size:18px;font-weight:800">${t.name||`—`}</div>
          <div style="font-size:11px;opacity:.7;margin-top:4px">الرقم الضريبي: ${t.vat||`—`}</div>
        </div>
        <div style="text-align:left">
          <div style="font-size:16px;font-weight:800">قسيمة الراتب</div>
          <div style="font-size:11px;opacity:.7;margin-top:4px">${i}</div>
          <div style="font-size:11px;opacity:.7">تاريخ الإصدار: ${o}</div>
        </div>
      </div>
      <div class="ps-body">
        <div class="ps-grid">
          <div class="ps-field"><div class="ps-field-label">الاسم</div><div class="ps-field-value">${r.name}</div></div>
          <div class="ps-field"><div class="ps-field-label">الرقم الوظيفي</div><div class="ps-field-value">${r.id}</div></div>
          <div class="ps-field"><div class="ps-field-label">المسمى الوظيفي</div><div class="ps-field-value">${r.position}</div></div>
          <div class="ps-field"><div class="ps-field-label">القسم</div><div class="ps-field-value">${r.department}</div></div>
          ${r.iqama?`<div class="ps-field"><div class="ps-field-label">رقم الإقامة / الهوية</div><div class="ps-field-value">${r.iqama}</div></div>`:``}
          ${r.joinDate?`<div class="ps-field"><div class="ps-field-label">تاريخ الانضمام</div><div class="ps-field-value">${r.joinDate}</div></div>`:``}
        </div>

        <div class="ps-section">المستحقات</div>
        <div class="ps-row"><span>الراتب الأساسي</span><span class="green">${e(r.salary)}</span></div>
        <div class="ps-row"><span>البدلات والعلاوات</span><span class="green">+${e(r.allowances)}</span></div>

        <div class="ps-section">الاستقطاعات</div>
        <div class="ps-row"><span>الاستقطاعات</span><span class="red">-${e(r.deductions)}</span></div>
        ${a>0?`<div class="ps-row"><span>استقطاع السلف</span><span class="red">-${e(a)}</span></div>`:``}

        <div class="ps-row total">
          <span>صافي الراتب</span>
          <span class="blue" style="font-size:18px">${e(s)}</span>
        </div>
      </div>
      <div style="padding:16px 28px;background:#F9FAFB;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;">
        <div style="border-top:1px solid #9CA3AF;padding-top:8px;font-size:11px;color:#6B7280;min-width:180px;text-align:center">توقيع الموظف</div>
        <div style="border-top:1px solid #9CA3AF;padding-top:8px;font-size:11px;color:#6B7280;min-width:180px;text-align:center">توقيع مدير الموارد البشرية</div>
      </div>
    </div>
  `)}export{c as a,a as i,o as n,r as o,i as r,s as t};