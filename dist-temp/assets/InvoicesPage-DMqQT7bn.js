import{i as e,t}from"./jsx-runtime-BE_tW6Ee.js";import{D as n,S as r,T as i,b as a,c as o,g as s,h as c,m as l,n as u,s as d,y as f}from"./index-QLgi7hlS.js";import{t as p}from"./PageHeader-BOBri-Cr.js";import{t as m}from"./StatCard-C__Q-5nZ.js";import{t as h}from"./excel-CcmS5YHA.js";import{t as g}from"./Badge-C3xqJY2j.js";var _=e(n(),1),v=t(),y={all:`الكل`,paid:`مدفوع`,pending:`معلق`,overdue:`متأخر`,draft:`مسودة`,confirmed:`مؤكد`,partial:`جزئي`};function b(){let{invoices:e}=o(),{purchases:t}=d(),n=u(e=>e.delegates),b=l(e=>e.customers),x=a(e=>e.company),[S]=i(),C=S.get(`customer`),[w,T]=(0,_.useState)(``),[E,D]=(0,_.useState)(`all`),[O,k]=(0,_.useState)(`all`),[A,j]=(0,_.useState)([]),M=C?b.find(e=>e.id===C):null,N=(0,_.useMemo)(()=>e.map(e=>({id:e.id,number:e.number,customer:e.customer,customerId:e.customerId,date:e.date,dueDate:e.dueDate,amount:e.amount,tax:e.tax,total:e.total,paidAmount:e.paidAmount??(e.status===`paid`?e.total:0),status:e.status,paymentMethod:e.paymentMethod,source:`admin`,invoiceType:`sale`})),[e]),P=(0,_.useMemo)(()=>{let e=[];return n.forEach(t=>{t.invoices.forEach(n=>{e.push({id:`${t.id}::${n.id}`,number:n.number,customer:n.party,date:n.date,dueDate:n.date,amount:n.subtotal,tax:n.tax,total:n.total,paidAmount:n.paidAmount??(n.status===`paid`?n.total:0),status:n.status,paymentMethod:n.paymentMethod,source:`delegate`,delegateName:t.name,invoiceType:n.type})})}),e.sort((e,t)=>t.date.localeCompare(e.date))},[n]),F=(0,_.useMemo)(()=>[...N,...P].sort((e,t)=>t.date.localeCompare(e.date)),[N,P]),I=(0,_.useMemo)(()=>F.filter(e=>{let t=E===`all`||e.status===E,n=O===`all`||e.source===O,r=w.trim(),i=!r||e.customer.includes(r)||e.number.includes(r)||(e.delegateName??``).includes(r),a=!C||e.customerId===C||M&&(e.customer===M.name||e.customer?.includes(M.name)||M.name?.includes(e.customer||``));return t&&n&&i&&a}),[F,E,O,w,C,M]),L=(0,_.useMemo)(()=>({total:F.reduce((e,t)=>e+t.total,0),paid:F.filter(e=>e.status===`paid`).reduce((e,t)=>e+t.total,0),pending:F.filter(e=>e.status===`pending`||e.status===`confirmed`).reduce((e,t)=>e+t.total,0),overdue:F.filter(e=>e.status===`overdue`).reduce((e,t)=>e+t.total,0)}),[F]),R=e=>j(t=>t.includes(e)?t.filter(t=>t!==e):[...t,e]);function z(){let t=I.filter(e=>A.includes(e.id));if(!t.length)return;let r=window.open(``,`_blank`,`width=960,height=800`);if(!r){f(`يرجى السماح بالنوافذ المنبثقة`,`warn`);return}let i=t=>{if(t.source===`admin`)return e.find(e=>e.id===t.id)?.items||[];{let[e,r]=t.id.split(`::`);return n.find(t=>t.id===e)?.invoices.find(e=>e.id===r)?.items||[]}},a=e=>e.toLocaleString(`ar-SA`,{minimumFractionDigits:2});r.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar">
    <head><meta charset="UTF-8"><title>فاتورة ضريبية</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Tajawal',Arial,sans-serif;font-size:13px;color:#111;background:#f4f6fa}
    .page{max-width:800px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.1);page-break-after:always}
    .hdr{background:#0D1117;color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start}
    .hdr-co{font-size:18px;font-weight:800;margin-bottom:4px}
    .hdr-sub{font-size:11px;opacity:.65;line-height:1.8}
    .hdr-right{text-align:left}
    .inv-title{font-size:22px;font-weight:900}
    .inv-meta{font-size:11px;opacity:.7;margin-top:6px;line-height:1.8}
    .body{padding:24px 32px}
    .party-box{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
    .party-card{background:#f8fafc;border-radius:8px;padding:14px 16px}
    .party-label{font-size:10px;font-weight:700;color:#2563EB;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
    .party-name{font-size:15px;font-weight:800}
    .party-info{font-size:11px;color:#6B7280;margin-top:4px;line-height:1.7}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#f4f6fa;padding:10px 14px;font-size:11px;font-weight:800;text-align:right;border-bottom:2px solid #E5E7EB;color:#374151}
    td{padding:10px 14px;border-bottom:1px solid #F3F4F6;font-size:13px}
    .totals{width:280px;margin-right:auto;margin-top:8px}
    .tot-row{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #F3F4F6}
    .tot-grand{border-bottom:none;border-top:2px solid #0D1117;padding-top:10px;font-size:16px;font-weight:900}
    .badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700}
    .paid{background:#ECFDF5;color:#065F46}.pending{background:#FFFBEB;color:#92400E}.overdue{background:#FEF2F2;color:#991B1B}
    .footer{margin-top:20px;padding-top:12px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF}
    @media print{@page{margin:8mm;size:A4}body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{margin:0;box-shadow:none;border-radius:0}}
    </style></head><body>
    ${t.map(e=>{let t=i(e),n=e.source===`delegate`?`المندوب: ${e.delegateName}`:`الإدارة`,r=e.status===`paid`?`paid`:e.status===`overdue`?`overdue`:`pending`,o=e.status===`paid`?`مدفوعة`:e.status===`overdue`?`متأخرة`:e.status===`partial`?`جزئية`:e.status===`confirmed`?`مؤكدة`:`معلقة`;return`
      <div class="page">
        <div class="hdr">
          <div>
            <div class="hdr-co">${x.name||`اسم الشركة`}</div>
            ${x.nameEn?`<div style="font-size:11px;opacity:.6">${x.nameEn}</div>`:``}
            <div class="hdr-sub">
              ${x.vat?`الرقم الضريبي: ${x.vat}<br>`:``}
              ${x.phone?`ج: ${x.phone}<br>`:``}
              ${x.address?`${x.address}، ${x.city}`:``}
            </div>
          </div>
          <div class="hdr-right">
            <div class="inv-title">فاتورة ضريبية</div>
            <div class="inv-meta">
              رقم الفاتورة: ${e.number}<br>
              التاريخ: ${e.date}<br>
              المُصدِر: ${n}<br>
              <span class="badge ${r}">${o}</span>
            </div>
          </div>
        </div>
        <div class="body">
          <div class="party-box">
            <div class="party-card">
              <div class="party-label">فاتورة إلى</div>
              <div class="party-name">${e.customer}</div>
            </div>
            <div class="party-card">
              <div class="party-label">بيانات الدفع</div>
              <div style="font-size:12px;font-weight:700">${e.paymentMethod===`cash`?`💵 نقدي — مدفوع فوراً`:`📋 آجل — مؤجل الدفع`}</div>
              <div style="font-size:11px;color:#6B7280;margin-top:4px">المدفوع: ${a(e.paidAmount)} | المتبقي: ${a(Math.max(0,e.total-e.paidAmount))}</div>
            </div>
          </div>
          ${t.length>0?`
          <table>
            <thead><tr><th>#</th><th>الصنف / الوصف</th><th style="text-align:center">الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
            <tbody>
              ${t.map((e,t)=>`
                <tr>
                  <td style="color:#9CA3AF;font-size:11px">${t+1}</td>
                  <td style="font-weight:600">${e.description||e.desc||`—`}</td>
                  <td style="text-align:center;font-weight:700">${e.qty}</td>
                  <td>${a(e.price)}</td>
                  <td style="font-weight:700">${a(e.total)}</td>
                </tr>
              `).join(``)}
            </tbody>
          </table>
          `:`<div style="text-align:center;padding:20px;color:#9CA3AF;font-size:12px">لا تتوفر بيانات الأصناف</div>`}
          <div class="totals">
            <div class="tot-row"><span style="color:#6B7280">قبل الضريبة</span><span style="font-weight:600">${a(e.amount)}</span></div>
            <div class="tot-row"><span style="color:#F59E0B">ضريبة 15%</span><span style="color:#F59E0B;font-weight:600">${a(e.tax)}</span></div>
            <div class="tot-row tot-grand"><span>الإجمالي</span><span style="color:#0D1117">${a(e.total)}</span></div>
          </div>
          <div class="footer">
            <span>تم الإصدار بواسطة نظام سهل ERP</span>
            <span>${new Date().toLocaleDateString(`ar-SA`)}</span>
          </div>
        </div>
      </div>`}).join(``)}
    <script>window.onload=()=>{window.print()}<\/script></body></html>`),r.document.close(),f(`جارٍ طباعة ${t.length} فاتورة...`,`success`),j([])}return(0,v.jsxs)(v.Fragment,{children:[(0,v.jsx)(p,{title:M?`فواتير ${M.name}`:`الفواتير`,subtitle:M?`${I.length} فاتورة`:`${F.length} فاتورة — ${N.length} مباشرة + ${P.length} مناديب`,actions:(0,v.jsxs)(v.Fragment,{children:[(0,v.jsxs)(`button`,{className:`btn btn-outline btn-sm`,onClick:()=>{h({title:`تقرير الفواتير الموحد`,filename:`فواتير-${new Date().toISOString().slice(0,10)}`,columns:[{header:`رقم الفاتورة`,key:`number`,width:18,type:`text`,align:`center`},{header:`المصدر`,key:`src`,width:14,type:`text`,align:`center`},{header:`المندوب`,key:`delegateName`,width:20,type:`text`},{header:`العميل`,key:`customer`,width:28,type:`text`},{header:`التاريخ`,key:`date`,width:16,type:`date`,align:`center`},{header:`قبل الضريبة`,key:`amount`,width:18,type:`currency`},{header:`الضريبة`,key:`tax`,width:14,type:`currency`},{header:`الإجمالي`,key:`total`,width:18,type:`currency`},{header:`المدفوع`,key:`paidAmount`,width:16,type:`currency`},{header:`الحالة`,key:`status`,width:14,type:`status`,align:`center`}],rows:I.map(e=>({...e,src:e.source===`admin`?`مباشر`:`مندوب`,delegateName:e.delegateName??`—`})),totals:{number:``,src:``,delegateName:``,customer:`${I.length} فاتورة`,amount:I.reduce((e,t)=>e+t.amount,0),tax:I.reduce((e,t)=>e+t.tax,0),total:I.reduce((e,t)=>e+t.total,0),paidAmount:I.reduce((e,t)=>e+t.paidAmount,0)}}),f(`تم تصدير الفواتير بنجاح`,`success`)},children:[(0,v.jsx)(`i`,{className:`fa fa-file-excel`}),` تصدير Excel`]}),(0,v.jsxs)(r,{to:`/erp/invoices/new`,className:`btn btn-primary btn-sm`,children:[(0,v.jsx)(`i`,{className:`fa fa-plus`}),` فاتورة جديدة`]})]})}),(0,v.jsxs)(`div`,{className:`stats-grid mb-6`,style:{gridTemplateColumns:`repeat(4,1fr)`},children:[(0,v.jsx)(m,{label:`إجمالي الفواتير`,value:c(L.total),dark:!0,icon:`fa-clipboard-list`}),(0,v.jsx)(m,{label:`مدفوع`,value:c(L.paid),badge:`✓`,badgeType:`success`,icon:`fa-check-circle`,iconColor:`var(--success)`}),(0,v.jsx)(m,{label:`معلق / مؤكد`,value:c(L.pending),badge:`!`,badgeType:`warn`,icon:`fa-clock`,iconColor:`var(--warn)`}),(0,v.jsx)(m,{label:`متأخر`,value:c(L.overdue),badge:`✕`,badgeType:`danger`,icon:`fa-exclamation-circle`,iconColor:`var(--danger)`})]}),(0,v.jsx)(`div`,{className:`card mb-6`,children:(0,v.jsx)(`div`,{className:`card-body`,style:{padding:`14px 20px`},children:(0,v.jsxs)(`div`,{className:`filter-bar`,style:{marginBottom:0,flexWrap:`wrap`,gap:8},children:[(0,v.jsxs)(`div`,{className:`search-box`,style:{flex:1,minWidth:240},children:[(0,v.jsx)(`i`,{className:`fa fa-search icon`}),(0,v.jsx)(`input`,{placeholder:`ابحث برقم الفاتورة أو العميل أو المندوب...`,value:w,onChange:e=>T(e.target.value)})]}),(0,v.jsx)(`div`,{style:{display:`flex`,gap:4},children:[[`all`,`الكل`],[`admin`,`مباشرة`],[`delegate`,`مناديب`]].map(([e,t])=>(0,v.jsx)(`button`,{onClick:()=>k(e),className:`btn btn-sm ${O===e?`btn-primary`:`btn-outline`}`,children:t},e))}),(0,v.jsx)(`div`,{style:{display:`flex`,gap:4,flexWrap:`wrap`},children:[`all`,`paid`,`pending`,`confirmed`,`overdue`,`draft`].map(e=>(0,v.jsx)(`button`,{onClick:()=>D(e),className:`btn btn-sm ${E===e?`btn-primary`:`btn-outline`}`,children:y[e]??e},e))}),A.length>0&&(0,v.jsxs)(`button`,{className:`btn btn-sm`,style:{background:`var(--blue)`,color:`#fff`,border:`none`},onClick:z,children:[(0,v.jsx)(`i`,{className:`fa fa-print`}),` طباعة (`,A.length,`)`]})]})})}),(0,v.jsxs)(`div`,{className:`card`,children:[(0,v.jsxs)(`div`,{className:`table-wrap`,children:[(0,v.jsxs)(`table`,{children:[(0,v.jsx)(`thead`,{children:(0,v.jsxs)(`tr`,{children:[(0,v.jsx)(`th`,{style:{width:40},children:(0,v.jsx)(`input`,{type:`checkbox`,onChange:e=>j(e.target.checked?I.map(e=>e.id):[])})}),(0,v.jsx)(`th`,{children:`رقم الفاتورة`}),(0,v.jsx)(`th`,{children:`المصدر`}),(0,v.jsx)(`th`,{children:`العميل / الطرف`}),(0,v.jsx)(`th`,{children:`التاريخ`}),(0,v.jsx)(`th`,{children:`الإجمالي`}),(0,v.jsx)(`th`,{children:`المدفوع`}),(0,v.jsx)(`th`,{children:`الحالة`}),(0,v.jsx)(`th`,{children:`طريقة الدفع`}),(0,v.jsx)(`th`,{children:`إجراءات`})]})}),(0,v.jsx)(`tbody`,{children:I.map(e=>{let t=Math.max(0,e.total-e.paidAmount);return(0,v.jsxs)(`tr`,{children:[(0,v.jsx)(`td`,{children:(0,v.jsx)(`input`,{type:`checkbox`,checked:A.includes(e.id),onChange:()=>R(e.id)})}),(0,v.jsx)(`td`,{children:e.source===`admin`?(0,v.jsx)(r,{to:`/erp/invoices/${e.id}`,style:{color:`var(--blue)`,fontWeight:700,fontFamily:`monospace`,fontSize:13},children:e.number}):(0,v.jsx)(`span`,{style:{fontWeight:700,fontFamily:`monospace`,color:`var(--blue)`,fontSize:13},children:e.number})}),(0,v.jsxs)(`td`,{children:[e.source===`admin`?(0,v.jsxs)(`span`,{style:{fontSize:11,fontWeight:700,padding:`2px 8px`,borderRadius:12,background:`var(--blue-light)`,color:`var(--blue)`},children:[(0,v.jsx)(`i`,{className:`fa fa-building`,style:{marginLeft:4,fontSize:10}}),`مباشر`]}):(0,v.jsxs)(`span`,{style:{fontSize:11,fontWeight:700,padding:`2px 8px`,borderRadius:12,background:`var(--success-bg)`,color:`var(--success)`},children:[(0,v.jsx)(`i`,{className:`fa fa-user-tie`,style:{marginLeft:4,fontSize:10}}),e.delegateName]}),e.invoiceType===`purchase`&&(0,v.jsx)(`span`,{style:{fontSize:10,fontWeight:700,padding:`1px 6px`,borderRadius:10,background:`var(--warn-bg)`,color:`var(--warn)`,marginRight:4},children:`شراء`})]}),(0,v.jsx)(`td`,{style:{fontWeight:600},children:e.customer}),(0,v.jsx)(`td`,{style:{fontSize:12,color:`var(--muted)`},children:s(e.date)}),(0,v.jsx)(`td`,{style:{fontWeight:700},children:c(e.total)}),(0,v.jsx)(`td`,{children:(0,v.jsxs)(`div`,{children:[(0,v.jsx)(`span`,{style:{fontWeight:700,color:e.paidAmount>=e.total?`var(--success)`:e.paidAmount>0?`var(--warn)`:`var(--muted)`,fontSize:13},children:c(e.paidAmount)}),t>0&&(0,v.jsxs)(`div`,{style:{fontSize:10,color:`var(--danger)`},children:[`متبقي `,c(t)]})]})}),(0,v.jsx)(`td`,{children:(0,v.jsx)(g,{status:e.status})}),(0,v.jsxs)(`td`,{children:[e.paymentMethod===`cash`&&(0,v.jsx)(`span`,{style:{fontSize:11,color:`var(--success)`,fontWeight:700},children:`نقدي`}),e.paymentMethod===`credit`&&(0,v.jsx)(`span`,{style:{fontSize:11,color:`var(--warn)`,fontWeight:700},children:`آجل`})]}),(0,v.jsx)(`td`,{children:(0,v.jsxs)(`div`,{style:{display:`flex`,gap:4},children:[e.source===`admin`&&(0,v.jsx)(r,{to:`/erp/invoices/${e.id}`,className:`btn btn-icon btn-outline`,title:`عرض`,children:(0,v.jsx)(`i`,{className:`fa fa-eye`})}),(0,v.jsx)(`button`,{className:`btn btn-icon btn-outline`,title:`طباعة`,onClick:()=>{j([e.id]),setTimeout(z,50)},children:(0,v.jsx)(`i`,{className:`fa fa-print`})})]})})]},e.id)})})]}),I.length===0&&(0,v.jsxs)(`div`,{className:`empty-state`,children:[(0,v.jsx)(`div`,{className:`empty-state-icon`,children:(0,v.jsx)(`i`,{className:`fa fa-file-invoice`})}),(0,v.jsx)(`div`,{className:`empty-state-title`,children:`لا توجد فواتير`}),(0,v.jsx)(`div`,{className:`empty-state-sub`,children:w?`لا توجد نتائج للبحث عن "${w}"`:`لا توجد فواتير تطابق الفلتر المحدد`})]})]}),(0,v.jsxs)(`div`,{style:{padding:`12px 20px`,borderTop:`1px solid var(--border)`,display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,v.jsxs)(`span`,{style:{fontSize:12,color:`var(--muted)`},children:[`عرض `,I.length,` من `,F.length,` فاتورة`]}),(0,v.jsxs)(`div`,{className:`pagination`,children:[(0,v.jsx)(`button`,{className:`page-btn`,children:`‹`}),(0,v.jsx)(`button`,{className:`page-btn active`,children:`1`}),(0,v.jsx)(`button`,{className:`page-btn`,children:`›`})]})]})]})]})}export{b as default};