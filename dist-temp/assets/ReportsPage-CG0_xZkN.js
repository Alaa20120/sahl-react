import{i as e,t}from"./jsx-runtime-BE_tW6Ee.js";import{n,t as r}from"./LineAreaChart-hk5kIc9e.js";import{D as i,a,b as o,c as s,l as c,n as l,r as u,s as d,u as f,y as p}from"./index-QLgi7hlS.js";import{t as m}from"./PageHeader-BOBri-Cr.js";import{t as h}from"./Card-DQHwiKg2.js";var g=e(i(),1),_=t(),v=[{id:`formal`,name:`رسمي`,desc:`خلفية داكنة — للمراسلات الرسمية`,headerBg:`#0D1117`,headerColor:`#fff`,accent:`#2563EB`,border:`2px solid #0D1117`},{id:`modern`,name:`عصري`,desc:`تدرج أزرق داكن — احترافي وأنيق`,headerBg:`linear-gradient(135deg,#1a2035 0%,#2563EB 100%)`,headerColor:`#fff`,accent:`#2563EB`,border:`2px solid #2563EB`},{id:`clean`,name:`نظيف`,desc:`أبيض مع خط علوي — بسيط وقابل للقراءة`,headerBg:`#ffffff`,headerColor:`#111827`,accent:`#0D1117`,border:`4px solid #0D1117`},{id:`compact`,name:`مضغوط`,desc:`أخضر مؤسسي — مناسب للتقارير المالية`,headerBg:`linear-gradient(135deg,#065f46,#10B981)`,headerColor:`#fff`,accent:`#10B981`,border:`2px solid #10B981`},{id:`bold`,name:`جريء`,desc:`بنفسجي غامق — بارز ومميز`,headerBg:`linear-gradient(135deg,#4C1D95,#7C3AED)`,headerColor:`#fff`,accent:`#7C3AED`,border:`2px solid #7C3AED`}],y={"هذا الشهر":`أبريل 2025`,"ربع السنة":`الربع الثاني 2025`,"هذا العام":`عام 2025`};function b(e,t,n,r){let i=window.open(``,`_blank`,`width=860,height=720`);if(!i){p(`يرجى السماح بالنوافذ المنبثقة`,`warn`);return}let a=n.id===`clean`,o=y[t]??t,s=e.data.some(e=>e.value>100),c=s?`ر.س`:``,l=e=>e===`grand`?`#1d4ed8`:e===`total`?`#374151`:e===`credit`?`#065f46`:e===`debit`?`#991b1b`:`#374151`,u=e=>e===`grand`?`#EFF6FF`:e===`total`?`#F9FAFB`:e===`credit`?`#F0FDF4`:e===`debit`?`#FEF2F2`:`#fff`;i.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${e.label}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Tajawal',Arial,sans-serif;font-size:13px;background:#F8FAFC;color:#111827;direction:rtl}
  .page{max-width:820px;margin:0 auto;padding:36px 32px;background:#fff}
  .hdr{background:${n.headerBg};color:${n.headerColor};padding:28px 32px;border-radius:10px 10px 0 0;margin-bottom:0}
  .hdr-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
  .company-name{font-size:20px;font-weight:900}
  .company-sub{font-size:11px;opacity:.75;margin-top:4px}
  .report-title-box{text-align:left}
  .report-title{font-size:22px;font-weight:900}
  .report-sub{font-size:12px;opacity:.75;margin-top:4px}
  .hdr-meta{display:flex;gap:24px;padding-top:14px;border-top:1px solid ${a?`#E5E7EB`:`rgba(255,255,255,.15)`}}
  .meta-item{font-size:11px;opacity:.8}
  .meta-label{font-weight:700;margin-left:4px}
  .body{border:1px solid #E5E7EB;border-top:none;border-radius:0 0 10px 10px;padding:0;overflow:hidden}
  .section{padding:20px 28px}
  .section-title{font-size:13px;font-weight:800;color:${n.accent};margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${n.accent}30}
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
        <div class="company-name">${r.name||`—`}</div>
        <div class="company-sub">${r.vat?`الرقم الضريبي: `+r.vat+` &nbsp;|&nbsp; `:``}${[r.city,r.country].filter(Boolean).join(`، `)}</div>
      </div>
      <div class="report-title-box">
        <div class="report-title">${e.label}</div>
        <div class="report-sub">${e.desc}</div>
      </div>
    </div>
    <div class="hdr-meta">
      <div class="meta-item"><span class="meta-label">الفترة:</span>${o}</div>
      <div class="meta-item"><span class="meta-label">تاريخ الإصدار:</span>${new Date().toLocaleDateString(`ar-SA`)}</div>
      <div class="meta-item"><span class="meta-label">أعدّه:</span>قسم المحاسبة</div>
      <div class="meta-item"><span class="meta-label">القالب:</span>${n.name}</div>
    </div>
  </div>

  <div class="body">
    <div class="summary">
      ${e.data.filter(e=>e.type===`grand`).map(e=>`
        <div class="sum-card" style="border-top:3px solid ${n.accent};grid-column:span 3">
          <div class="sum-label">${e.label}</div>
          <div class="sum-value" style="color:${n.accent}">${s?e.value.toLocaleString(`ar-SA`)+` `+c:e.value}</div>
        </div>
      `).join(``)}
      ${e.data.filter(e=>e.type===`credit`).slice(0,3).map(e=>`
        <div class="sum-card">
          <div class="sum-label" style="color:#065f46">${e.label}</div>
          <div class="sum-value" style="color:#065f46">${s?e.value.toLocaleString(`ar-SA`)+` `+c:e.value}</div>
        </div>
      `).join(``)}
    </div>

    <div class="section">
      <div class="section-title">تفاصيل ${e.label}</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>البيان</th>
            <th style="text-align:left">${s?`المبلغ (ر.س)`:`القيمة`}</th>
            <th style="text-align:center">النوع</th>
          </tr>
        </thead>
        <tbody>
          ${e.data.map((e,t)=>`
            <tr class="row-${e.type}">
              <td style="color:#9CA3AF;font-size:11px;text-align:center">${t+1}</td>
              <td style="font-weight:${e.type===`grand`?`900`:e.type===`total`?`700`:`500`};color:${l(e.type)}">${e.label}</td>
              <td style="text-align:left;font-weight:${e.type===`grand`?`900`:`600`};color:${l(e.type)};direction:ltr">
                ${e.value===0?`—`:s?e.value.toLocaleString(`ar-SA`):e.value}
              </td>
              <td style="text-align:center">
                <span style="background:${u(e.type)};color:${l(e.type)};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid ${l(e.type)}30">
                  ${e.type===`grand`?`إجمالي`:e.type===`total`?`مجموع`:e.type===`credit`?`دائن`:e.type===`debit`?`مدين`:`محايد`}
                </span>
              </td>
            </tr>
          `).join(``)}
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
</html>`),i.document.close()}function x(){let[e,t]=(0,g.useState)(`هذا الشهر`),[i,y]=(0,g.useState)(`formal`),[x,S]=(0,g.useState)(!1),C=s(e=>e.invoices),w=a(e=>e.expenses),T=d(e=>e.purchases),E=f(e=>e.products),D=c(e=>e.accounts),O=l(e=>e.delegates),k=u(e=>e.employees),A=o(e=>e.company),j=(0,g.useMemo)(()=>{let e=C.filter(e=>e.status!==`draft`),t=e.reduce((e,t)=>e+t.total,0),n=e.filter(e=>e.status===`paid`).reduce((e,t)=>e+t.total,0),r=e.filter(e=>e.status===`pending`).reduce((e,t)=>e+t.total,0),i=e.filter(e=>e.status===`overdue`).reduce((e,t)=>e+t.total,0),a=e.reduce((e,t)=>e+t.tax,0),o=O.reduce((e,t)=>e+t.invoices.filter(e=>e.type===`sale`).reduce((e,t)=>e+t.subtotal,0),0),s=O.reduce((e,t)=>e+t.invoices.filter(e=>e.type===`sale`).reduce((e,t)=>e+t.tax,0),0),c=T.reduce((e,t)=>e+t.amount,0),l=T.reduce((e,t)=>e+(t.tax??Math.round((t.total-t.amount)*10)/10),0),u=w.filter(e=>e.status===`approved`),d=u.reduce((e,t)=>e+t.amount,0),f=E.reduce((e,t)=>e+t.stock*t.costPrice,0),p=D.reduce((e,t)=>e+t.balance,0),m=t+o-c,h=m-d,g=a+s,_=Math.max(0,g-l),v={};e.forEach(e=>{let t=e.customerId||e.customer;v[t]||(v[t]={name:e.customer,total:0}),v[t].total+=e.total});let y=Object.values(v).sort((e,t)=>t.total-e.total).slice(0,5),b={};e.forEach(e=>e.items.forEach(e=>{let t=e.productId||e.description;b[t]||(b[t]={name:e.description,total:0}),b[t].total+=e.total}));let x=Object.values(b).sort((e,t)=>t.total-e.total).slice(0,5),S={};T.forEach(e=>{S[e.vendor??e.supplier??`غير محدد`]=(S[e.vendor??e.supplier??`غير محدد`]??0)+e.amount});let A=Object.entries(S).sort((e,t)=>t[1]-e[1]).slice(0,3),j={};u.forEach(e=>{j[e.category??e.description]=(j[e.category??e.description]??0)+e.amount});let M=Object.entries(j).sort((e,t)=>t[1]-e[1]).slice(0,5);return{totalRevenue:t,delegateRevenue:o,paidRevenue:n,pendingRevenue:r,overdueRevenue:i,totalTax:a,delegateTax:s,vatOut:g,vatNet:_,totalPurchases:c,purchaseTax:l,poReceived:T.filter(e=>e.status===`received`).reduce((e,t)=>e+t.total,0),poPending:T.filter(e=>e.status===`pending`||e.status===`partial`).reduce((e,t)=>e+t.total,0),totalExpenses:d,inventoryValue:f,cashBalance:p,grossProfit:m,operatingProfit:h,topCust:y,topProd:x,topVend:A,topExpCat:M,totalSalaries:k.filter(e=>e.status===`active`).reduce((e,t)=>e+(t.salary??0),0),activeEmp:k.filter(e=>e.status===`active`).length}},[C,w,T,E,D,O,k]),M=(0,g.useMemo)(()=>{let e={};return C.filter(e=>e.status!==`draft`).forEach(t=>{let n=t.date.slice(0,7);e[n]||(e[n]={month:n,revenue:0,expenses:0}),e[n].revenue+=t.amount}),O.forEach(t=>t.invoices.filter(e=>e.type===`sale`).forEach(t=>{let n=t.date.slice(0,7);e[n]||(e[n]={month:n,revenue:0,expenses:0}),e[n].revenue+=t.subtotal})),w.filter(e=>e.status===`approved`).forEach(t=>{let n=t.date.slice(0,7);e[n]||(e[n]={month:n,revenue:0,expenses:0}),e[n].expenses+=t.amount}),Object.values(e).sort((e,t)=>e.month.localeCompare(t.month)).map(e=>({...e,month:new Date(e.month+`-01`).toLocaleDateString(`ar-SA`,{month:`short`,year:`2-digit`})})).slice(-12)},[C,w,O]),N=(0,g.useMemo)(()=>[{title:`التقارير المالية`,icon:`fa-chart-line`,color:`#2563EB`,reports:[{icon:`fa-file-invoice-dollar`,label:`قائمة الدخل`,desc:`الإيرادات والمصروفات وصافي الربح`,data:[{label:`إجمالي الإيرادات`,value:j.totalRevenue+j.delegateRevenue,type:`credit`},{label:`تكلفة المبيعات`,value:j.totalPurchases,type:`debit`},{label:`إجمالي الربح`,value:j.grossProfit,type:`total`},{label:`مصروفات التشغيل`,value:j.totalExpenses,type:`debit`},{label:`صافي الربح`,value:j.operatingProfit,type:`grand`}]},{icon:`fa-scale-balanced`,label:`الميزانية العمومية`,desc:`الأصول والخصوم وحقوق الملكية`,data:[{label:`النقد والخزينة`,value:j.cashBalance,type:`credit`},{label:`المخزون`,value:j.inventoryValue,type:`credit`},{label:`إجمالي الأصول`,value:j.cashBalance+j.inventoryValue,type:`total`},{label:`الخصوم المتداولة`,value:Math.max(0,j.vatNet),type:`debit`},{label:`حقوق الملكية`,value:j.cashBalance+j.inventoryValue-Math.max(0,j.vatNet),type:`grand`}]},{icon:`fa-money-bill-transfer`,label:`التدفق النقدي`,desc:`حركة الأموال الواردة والصادرة`,data:[{label:`إيرادات محصّلة`,value:j.paidRevenue,type:`credit`},{label:`مدفوعات مصروفات`,value:j.totalExpenses,type:`debit`},{label:`مدفوعات مشتريات`,value:j.totalPurchases,type:`debit`},{label:`رصيد الخزينة`,value:j.cashBalance,type:`grand`}]},{icon:`fa-chart-pie`,label:`تحليل الإيرادات`,desc:`توزيع الإيرادات حسب المصدر`,data:[{label:`مبيعات مباشرة`,value:j.totalRevenue,type:`credit`},{label:`مبيعات المناديب`,value:j.delegateRevenue,type:`credit`},{label:`الإجمالي`,value:j.totalRevenue+j.delegateRevenue,type:`grand`}]}]},{title:`تقارير المبيعات`,icon:`fa-cart-shopping`,color:`#10B981`,reports:[{icon:`fa-file-invoice`,label:`ملخص الفواتير`,desc:`إجمالي الفواتير حسب الفترة والحالة`,data:[{label:`فواتير مدفوعة`,value:j.paidRevenue,type:`credit`},{label:`فواتير معلقة`,value:j.pendingRevenue,type:`debit`},{label:`فواتير متأخرة`,value:j.overdueRevenue,type:`debit`},{label:`الإجمالي`,value:j.totalRevenue,type:`grand`}]},{icon:`fa-users`,label:`مبيعات العملاء`,desc:`أداء المبيعات لكل عميل`,data:[...j.topCust.map(e=>({label:e.name,value:e.total,type:`credit`})),{label:`الإجمالي`,value:j.totalRevenue+j.delegateRevenue,type:`grand`}]},{icon:`fa-box`,label:`مبيعات المنتجات`,desc:`الأصناف الأكثر والأقل مبيعاً`,data:[...j.topProd.map(e=>({label:e.name,value:e.total,type:`credit`})),{label:`الإجمالي`,value:j.totalRevenue,type:`grand`}]},{icon:`fa-users-between-lines`,label:`مبيعات المناديب`,desc:`مقارنة أداء المناديب`,data:[...O.map(e=>({label:e.name,value:e.stats.totalSales,type:`credit`})),{label:`الإجمالي`,value:j.delegateRevenue,type:`grand`}]}]},{title:`تقارير المشتريات`,icon:`fa-shopping-cart`,color:`#7C3AED`,reports:[{icon:`fa-industry`,label:`ملخص الموردين`,desc:`إجمالي المشتريات لكل مورد`,data:[...j.topVend.map(([e,t])=>({label:e,value:t,type:`debit`})),{label:`الإجمالي`,value:j.totalPurchases,type:`grand`}]},{icon:`fa-receipt`,label:`تقرير المصروفات`,desc:`تصنيف وتحليل المصروفات`,data:[...j.topExpCat.map(([e,t])=>({label:e,value:t,type:`debit`})),{label:`الإجمالي`,value:j.totalExpenses,type:`grand`}]},{icon:`fa-warehouse`,label:`حركة المخزون`,desc:`الوارد والصادر والرصيد`,data:[{label:`مشتريات الفترة`,value:j.totalPurchases,type:`credit`},{label:`قيمة المخزون الحالي`,value:j.inventoryValue,type:`grand`}]},{icon:`fa-truck`,label:`أوامر الشراء`,desc:`حالة وتتبع أوامر الشراء`,data:[{label:`أوامر منفذة`,value:j.poReceived,type:`credit`},{label:`أوامر معلقة`,value:j.poPending,type:`debit`},{label:`الإجمالي`,value:j.totalPurchases+j.poPending,type:`grand`}]}]},{title:`تقارير الضريبة والزكاة`,icon:`fa-shield-halved`,color:`#DC2626`,reports:[{icon:`fa-percent`,label:`تقرير ضريبة القيمة المضافة`,desc:`الضريبة المحصلة والمدفوعة`,data:[{label:`ضريبة المبيعات المحصلة`,value:j.vatOut,type:`credit`},{label:`ضريبة المشتريات`,value:j.purchaseTax,type:`debit`},{label:`صافي الضريبة المستحقة`,value:j.vatNet,type:`grand`}]},{icon:`fa-file-shield`,label:`إقرار ZATCA`,desc:`إعداد الإقرار الضريبي`,data:[{label:`إيرادات خاضعة للضريبة`,value:j.totalRevenue+j.delegateRevenue,type:`credit`},{label:`مشتريات خاضعة للضريبة`,value:j.totalPurchases,type:`debit`},{label:`ضريبة المبيعات 15%`,value:j.vatOut,type:`credit`},{label:`ضريبة المشتريات 15%`,value:j.purchaseTax,type:`debit`},{label:`الضريبة المستحقة`,value:j.vatNet,type:`grand`}]},{icon:`fa-clipboard-check`,label:`فاتورة إلكترونية`,desc:`تقرير الفواتير الإلكترونية`,data:[{label:`إجمالي الفواتير`,value:C.filter(e=>e.status!==`draft`).length,type:`credit`},{label:`فواتير مدفوعة`,value:C.filter(e=>e.status===`paid`).length,type:`credit`},{label:`فواتير معلقة`,value:C.filter(e=>e.status===`pending`).length,type:`debit`}]}]}],[j,O,C]),P=(0,g.useMemo)(()=>{let e=j.totalRevenue+j.delegateRevenue,t=e>0?Math.round(j.grossProfit/e*1e3)/10:0,n=C.filter(e=>e.status!==`draft`).length>0?Math.round(e/C.filter(e=>e.status!==`draft`).length):0,r=j.totalRevenue>0?Math.round(j.paidRevenue/(j.totalRevenue*1.15)*100):0,i=e>0?Math.round(j.totalExpenses/e*100):0;return[{label:`هامش الربح الإجمالي`,value:`${t}%`,icon:`fa-percent`,color:`#10B981`},{label:`متوسط قيمة الفاتورة`,value:n.toLocaleString(`ar-SA`),icon:`fa-file-invoice`,color:`#2563EB`},{label:`نسبة الفواتير المدفوعة`,value:`${r}%`,icon:`fa-hand-holding-dollar`,color:`#D97706`},{label:`نسبة المصروفات`,value:`${i}%`,icon:`fa-receipt`,color:`#7C3AED`}]},[j,C]),F=v.find(e=>e.id===i)??v[0],I=t=>{b(t,e,F,A),p(`جارٍ تحضير تقرير: ${t.label}...`,`info`)};return(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)(m,{title:`مركز التقارير`,subtitle:`تقارير شاملة لكل جوانب العمل`,actions:(0,_.jsxs)(`div`,{style:{display:`flex`,gap:6,alignItems:`center`},children:[(0,_.jsxs)(`button`,{className:`btn btn-sm btn-outline`,onClick:()=>S(e=>!e),style:{display:`flex`,alignItems:`center`,gap:6},children:[(0,_.jsx)(`span`,{style:{width:12,height:12,borderRadius:3,background:F.accent,display:`inline-block`}}),`قالب: `,F.name,(0,_.jsx)(`i`,{className:`fa fa-chevron-down`,style:{fontSize:10}})]}),[`هذا الشهر`,`ربع السنة`,`هذا العام`].map(n=>(0,_.jsx)(`button`,{onClick:()=>t(n),className:`btn btn-sm ${e===n?`btn-primary`:`btn-outline`}`,children:n},n))]})}),x&&(0,_.jsxs)(`div`,{style:{background:`var(--card)`,border:`1px solid var(--border)`,borderRadius:12,padding:`16px`,marginBottom:20,display:`grid`,gridTemplateColumns:`repeat(5,1fr)`,gap:10},children:[(0,_.jsxs)(`div`,{style:{gridColumn:`1 / -1`,fontSize:13,fontWeight:700,color:`var(--muted)`,marginBottom:4,display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,_.jsx)(`span`,{children:`اختر قالب طباعة التقارير`}),(0,_.jsx)(`button`,{className:`btn btn-sm btn-outline`,style:{fontSize:11},onClick:()=>S(!1),children:`إغلاق`})]}),v.map(e=>(0,_.jsxs)(`button`,{onClick:()=>{y(e.id),S(!1),p(`تم اختيار قالب: ${e.name}`,`success`)},style:{border:i===e.id?`2px solid ${e.accent}`:`2px solid var(--border)`,borderRadius:10,overflow:`hidden`,cursor:`pointer`,background:`none`,transition:`.15s`,padding:0},children:[(0,_.jsx)(`div`,{style:{height:52,background:e.headerBg}}),(0,_.jsxs)(`div`,{style:{padding:`8px 10px`,textAlign:`right`,background:i===e.id?e.accent+`10`:`var(--bg)`},children:[(0,_.jsx)(`div`,{style:{fontSize:12,fontWeight:700,color:`var(--text)`},children:e.name}),(0,_.jsx)(`div`,{style:{fontSize:10,color:`var(--muted)`,lineHeight:1.4,marginTop:2},children:e.desc})]})]},e.id))]}),(0,_.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(4,1fr)`,gap:12,marginBottom:24},children:P.map(e=>(0,_.jsxs)(`div`,{style:{background:`var(--card)`,border:`1px solid var(--border)`,borderRadius:12,padding:`16px 20px`},children:[(0,_.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:10,marginBottom:12},children:[(0,_.jsx)(`div`,{style:{width:36,height:36,borderRadius:8,background:e.color+`15`,display:`flex`,alignItems:`center`,justifyContent:`center`},children:(0,_.jsx)(`i`,{className:`fa ${e.icon}`,style:{fontSize:16,color:e.color}})}),(0,_.jsx)(`span`,{style:{fontSize:12,color:`var(--muted)`,flex:1},children:e.label})]}),(0,_.jsx)(`div`,{style:{fontSize:22,fontWeight:800,color:`var(--text)`},children:e.value}),(0,_.jsx)(`div`,{style:{fontSize:12,marginTop:4,color:`var(--muted)`,fontWeight:600},children:`مقارنة بالفترة السابقة`})]},e.label))}),(0,_.jsxs)(`div`,{className:`grid-2 mb-6`,children:[(0,_.jsx)(h,{title:`الإيراد والمصروفات`,action:(0,_.jsx)(`span`,{style:{fontSize:12,color:`var(--success)`},children:`بيانات حقيقية`}),children:(0,_.jsx)(n,{data:M})}),(0,_.jsx)(h,{title:`نمو الإيراد`,action:(0,_.jsx)(`span`,{style:{fontSize:12,color:`var(--success)`},children:`بيانات حقيقية`}),children:(0,_.jsx)(r,{data:M,dataKey:`revenue`,label:`الإيراد`,color:`var(--blue)`})})]}),(0,_.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:24},children:N.map(e=>(0,_.jsxs)(`div`,{children:[(0,_.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:10,marginBottom:12},children:[(0,_.jsx)(`div`,{style:{width:32,height:32,borderRadius:8,background:e.color+`15`,display:`flex`,alignItems:`center`,justifyContent:`center`},children:(0,_.jsx)(`i`,{className:`fa ${e.icon}`,style:{color:e.color,fontSize:14}})}),(0,_.jsx)(`span`,{style:{fontWeight:700,fontSize:14},children:e.title})]}),(0,_.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(4,1fr)`,gap:10},children:e.reports.map(t=>(0,_.jsxs)(`button`,{onClick:()=>I(t),style:{background:`var(--card)`,border:`1px solid var(--border)`,borderRadius:10,padding:`14px 16px`,cursor:`pointer`,textAlign:`right`,transition:`.15s`,display:`flex`,alignItems:`flex-start`,gap:12},onMouseEnter:t=>{t.currentTarget.style.borderColor=e.color,t.currentTarget.style.background=e.color+`07`},onMouseLeave:e=>{e.currentTarget.style.borderColor=`var(--border)`,e.currentTarget.style.background=`var(--card)`},children:[(0,_.jsx)(`div`,{style:{width:34,height:34,borderRadius:8,background:e.color+`15`,display:`flex`,alignItems:`center`,justifyContent:`center`,flexShrink:0},children:(0,_.jsx)(`i`,{className:`fa ${t.icon}`,style:{fontSize:14,color:e.color}})}),(0,_.jsxs)(`div`,{style:{flex:1},children:[(0,_.jsx)(`div`,{style:{fontSize:13,fontWeight:700,color:`var(--text)`,marginBottom:4},children:t.label}),(0,_.jsx)(`div`,{style:{fontSize:11,color:`var(--muted)`,lineHeight:1.5},children:t.desc})]}),(0,_.jsx)(`i`,{className:`fa fa-print`,style:{fontSize:12,color:`var(--muted)`,marginTop:2,flexShrink:0}})]},t.label))})]},e.title))}),(0,_.jsxs)(`div`,{style:{marginTop:24,padding:`12px 16px`,background:`var(--card)`,border:`1px solid var(--border)`,borderRadius:10,display:`flex`,alignItems:`center`,gap:10},children:[(0,_.jsx)(`div`,{style:{width:28,height:28,borderRadius:6,background:F.headerBg,flexShrink:0,border:`1px solid var(--border)`}}),(0,_.jsxs)(`span`,{style:{fontSize:12,color:`var(--muted)`},children:[`قالب الطباعة الحالي: `,(0,_.jsx)(`strong`,{style:{color:`var(--text)`},children:F.name}),` — `,F.desc]}),(0,_.jsxs)(`button`,{className:`btn btn-sm btn-outline`,style:{marginRight:`auto`,fontSize:11},onClick:()=>S(!0),children:[(0,_.jsx)(`i`,{className:`fa fa-palette`}),` تغيير القالب`]})]})]})}export{x as default};