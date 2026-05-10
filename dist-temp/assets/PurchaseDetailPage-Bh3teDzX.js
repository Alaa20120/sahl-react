import{i as e,t}from"./jsx-runtime-BE_tW6Ee.js";import{C as n,D as r,S as i,b as a,g as o,h as s,s as c,u as l,w as u,y as d}from"./index-QLgi7hlS.js";import{t as f}from"./Modal-QUe0_V8-.js";var p=e(r(),1),m=t(),h=`sahl-po-template`,g=()=>localStorage.getItem(h)??`classic`,_={received:`var(--success)`,pending:`var(--warn)`,partial:`var(--blue)`,cancelled:`var(--danger)`,voided:`var(--danger)`},v={received:`مستلمة`,pending:`معلقة`,partial:`جزئية`,cancelled:`ملغاة`,voided:`مسترجعة`},y=[{id:`classic`,name:`كلاسيكي`,headerBg:`#0D1117`,headerColor:`#fff`,accentColor:`#0D1117`},{id:`modern`,name:`عصري`,headerBg:`linear-gradient(135deg,#1a2035,#2563EB)`,headerColor:`#fff`,accentColor:`#2563EB`},{id:`clean`,name:`نظيف`,headerBg:`#ffffff`,headerColor:`#111827`,accentColor:`#0D1117`,borderTop:`4px solid #0D1117`},{id:`minimal`,name:`بسيط`,headerBg:`#F4F6FA`,headerColor:`#111827`,accentColor:`#7C3AED`,borderTop:`3px solid #7C3AED`},{id:`bold`,name:`جريء`,headerBg:`linear-gradient(135deg,#065f46,#10B981)`,headerColor:`#fff`,accentColor:`#10B981`}];function b(e,t,n,r,i){let a=window.open(``,`_blank`,`width=920,height=760`);if(!a){d(`يرجى السماح بالنوافذ المنبثقة`,`warn`);return}let o=n.headerBg,s=n.headerColor,c=n.accentColor,l=n.id===`clean`||n.id===`minimal`;a.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>أمر شراء ${e.number||e.id}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Tajawal',Arial,sans-serif;font-size:13px;background:#F8FAFC;color:#111827;direction:rtl}
  .page{max-width:860px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;${n.borderTop?`border-top:${n.borderTop}`:``}}
  .hdr{background:${o};color:${s};padding:28px 40px;display:flex;justify-content:space-between;align-items:flex-start}
  .company-name{font-size:20px;font-weight:900}
  .company-sub{font-size:11px;opacity:.7;margin-top:3px}
  .company-info{font-size:12px;opacity:.75;line-height:1.8;margin-top:10px}
  .po-title{font-size:26px;font-weight:900;text-align:left}
  .po-title-sub{font-size:12px;opacity:.65;margin-top:2px;text-align:left}
  .po-meta{font-size:13px;line-height:2;opacity:.9;text-align:left;margin-top:14px}
  .body{padding:28px 40px}
  .bill-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:24px}
  .info-box{background:#F8FAFC;border-radius:10px;padding:14px 16px}
  .info-label{font-size:10px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  th{background:#F4F6FA;padding:10px 14px;font-size:11px;font-weight:800;text-align:right;border-bottom:2px solid #E5E7EB;color:#374151}
  td{padding:10px 14px;border-bottom:1px solid #F3F4F6;font-size:13px}
  .footer-row{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-top:8px}
  .totals-box{min-width:260px}
  .tot-row{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #F3F4F6}
  .tot-grand{border-bottom:none;border-top:2px solid ${c};padding-top:10px;font-size:16px;font-weight:900;color:${c}}
  .doc-footer{margin-top:32px;padding-top:12px;border-top:2px solid ${c}20;display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF}
  .voided-stamp{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;font-weight:900;color:rgba(220,38,38,.12);border:8px solid rgba(220,38,38,.12);padding:10px 30px;border-radius:10px;pointer-events:none;white-space:nowrap}
  .sig-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:28px}
  .sig-box{border-top:1px solid #9CA3AF;padding-top:8px;font-size:11px;color:#6B7280;text-align:center}
  @media print{@page{margin:8mm;size:A4}body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{margin:0;border-radius:0}}
</style>
</head>
<body>
${r?`<div class="voided-stamp">مسترجع — VOIDED</div>`:``}
<div class="page">
  <div class="hdr">
    <div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:44px;height:44px;border-radius:10px;background:${l?c+`18`:`rgba(255,255,255,.15)`};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:${l?c:`#fff`};flex-shrink:0;overflow:hidden">
          ${i.logo?`<img src="${i.logo}" style="width:100%;height:100%;object-fit:contain" />`:i.name?i.name.charAt(0):`س`}
        </div>
        <div>
          <div class="company-name">${i.name||`—`}</div>
          <div class="company-sub">${i.nameEn||``}</div>
        </div>
      </div>
      <div class="company-info">
        <div>${[i.address,i.city,i.country].filter(Boolean).join(`، `)}</div>
        <div>ج: ${i.phone||`—`} | ${i.email||`—`}</div>
        <div>الرقم الضريبي: ${i.vat||`—`}</div>
      </div>
    </div>
    <div>
      <div class="po-title">أمر شراء</div>
      <div class="po-title-sub">PURCHASE ORDER</div>
      <div class="po-meta">
        <div><strong style="opacity:.6;font-weight:600">رقم الأمر:</strong> ${e.number||e.id}</div>
        <div><strong style="opacity:.6;font-weight:600">تاريخ الإصدار:</strong> ${e.date}</div>
        ${e.dueDate?`<div><strong style="opacity:.6;font-weight:600">تاريخ الاستحقاق:</strong> ${e.dueDate}</div>`:``}
        <div><strong style="opacity:.6;font-weight:600">الحالة:</strong> ${v[t]}${r?` — مسترجع`:``}</div>
      </div>
    </div>
  </div>

  <div class="body">
    <div class="bill-grid">
      <div class="info-box">
        <div class="info-label">المورد</div>
        <div style="font-weight:800;font-size:15px">${e.supplier}</div>
        <div style="font-size:12px;color:#6B7280;margin-top:4px">المملكة العربية السعودية</div>
        ${e.supplierVat?`<div style="font-size:12px;color:#6B7280">الرقم الضريبي: ${e.supplierVat}</div>`:``}
      </div>
      <div class="info-box">
        <div class="info-label">بيانات الدفع</div>
        <div style="font-size:12px;line-height:1.8">
          <div style="font-weight:700">المبلغ الكلي: ${e.total.toLocaleString(`ar-SA`)} ر.س</div>
          <div>المدفوع: ${e.paid.toLocaleString(`ar-SA`)} ر.س</div>
          <div style="color:${e.total-e.paid>0?`#DC2626`:`#065f46`}">المتبقي: ${(e.total-e.paid).toLocaleString(`ar-SA`)} ر.س</div>
        </div>
        <div style="margin-top:10px">
          <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;background:${_[t]}15;color:${_[t]}">
            ${r?`مسترجع`:v[t]}
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
        ${e.lineItems.map((e,t)=>`
          <tr>
            <td style="color:#9CA3AF;font-size:11px;text-align:center">${t+1}</td>
            <td style="font-weight:600">${e.description}</td>
            <td style="text-align:center">${e.qty}</td>
            <td style="text-align:left">${e.price.toLocaleString(`ar-SA`)}</td>
            <td style="text-align:left;font-weight:700">${e.total.toLocaleString(`ar-SA`)}</td>
          </tr>
        `).join(``)}
      </tbody>
    </table>

    <div class="footer-row">
      <div style="font-size:12px;color:#6B7280;line-height:1.8;flex:1;padding-top:4px">
        <div style="font-weight:700;color:#111827;margin-bottom:4px">ملاحظات:</div>
        <div>يُرجى التسليم في الموعد المحدد.</div>
        <div>يُرجى إرفاق الفاتورة الضريبية عند التسليم.</div>
        <div style="margin-top:6px;font-size:11px">للاستفسار: ${i.email||`—`} | ${i.phone||`—`}</div>
        ${r?`<div style="margin-top:8px;color:#DC2626;font-weight:700">⚠ هذا الأمر مسترجع وملغى</div>`:``}
      </div>
      <div class="totals-box">
        <div class="tot-row"><span style="color:#6B7280">المجموع قبل الضريبة</span><strong>${e.amount.toLocaleString(`ar-SA`)} ر.س</strong></div>
        <div class="tot-row"><span style="color:#D97706">ضريبة القيمة المضافة 15%</span><strong style="color:#D97706">${e.tax.toLocaleString(`ar-SA`)} ر.س</strong></div>
        <div class="tot-row tot-grand"><span>إجمالي الأمر</span><strong>${e.total.toLocaleString(`ar-SA`)} ر.س</strong></div>
        <div class="tot-row" style="border-bottom:none"><span style="color:#6B7280">المدفوع</span><strong style="color:#065f46">${e.paid.toLocaleString(`ar-SA`)} ر.س</strong></div>
        <div class="tot-row" style="border-bottom:none;font-weight:700"><span style="color:${e.total-e.paid>0?`#DC2626`:`#6B7280`}">المتبقي</span><strong style="color:${e.total-e.paid>0?`#DC2626`:`#065f46`}">${(e.total-e.paid).toLocaleString(`ar-SA`)} ر.س</strong></div>
      </div>
    </div>

    <div class="sig-grid">
      <div class="sig-box">توقيع مدير المشتريات</div>
      <div class="sig-box">توقيع المورد (استلام)</div>
      <div class="sig-box">الختم الرسمي للشركة</div>
    </div>

    <div class="doc-footer">
      <div>${i.name||`—`} — السجل التجاري: ${i.cr||`—`}</div>
      <div>صفحة 1 من 1</div>
      <div>تم الإصدار بنظام سهل ERP</div>
    </div>
  </div>
</div>
<script>window.onload=()=>{window.print();}<\/script>
</body>
</html>`),a.document.close()}function x(){let{id:e}=u(),t=n(),r=c(e=>e.purchases),x=c(e=>e.addPayment),S=c(e=>e.confirmReceipt),C=c(e=>e.updateStatus),w=l(e=>e.addStock),T=l(e=>e.deductStock),E=r.find(t=>t.id===e),[D,O]=(0,p.useState)(g),[k,A]=(0,p.useState)(!1),[j,M]=(0,p.useState)(!1),[N,P]=(0,p.useState)(``),[F,I]=(0,p.useState)(`bank`),L=E?.status??`pending`,R=L===`voided`,[,z]=(0,p.useState)(!1),[,B]=(0,p.useState)(`pending`),[V,H]=(0,p.useState)(``);if(!E)return(0,m.jsxs)(`div`,{style:{textAlign:`center`,padding:`80px 20px`},children:[(0,m.jsx)(`i`,{className:`fa fa-file-circle-xmark`,style:{fontSize:48,color:`var(--muted)`,display:`block`,marginBottom:16}}),(0,m.jsx)(`div`,{style:{fontSize:18,fontWeight:700,marginBottom:8},children:`أمر الشراء غير موجود`}),(0,m.jsxs)(i,{to:`/erp/purchases`,className:`btn btn-primary`,children:[(0,m.jsx)(`i`,{className:`fa fa-arrow-right`}),` العودة للمشتريات`]})]});let U=a(e=>e.company),W=y.find(e=>e.id===D)??y[0],G=E.total-E.paid,K=Math.round(E.paid/E.total*100),q=()=>b(E,L,W,R,U),J=()=>{d(`جارٍ تحضير PDF...`,`info`),setTimeout(()=>b(E,L,W,R,U),200)},Y=()=>{if(!N){d(`يرجى إدخال المبلغ`,`warn`);return}let e=Math.min(+N,G);x(E.id,e),B(E.paid+e>=E.total?`received`:`partial`),d(`تم تسجيل دفعة ${s(e)} بنجاح`,`success`),A(!1),P(``)},X=()=>{S(E.id),E.lineItems.forEach(e=>{e.productId&&w(e.productId,e.qty)}),B(`received`),d(`تم تأكيد الاستلام وإضافة الكميات للمخزون`,`success`)},Z=async()=>{if(!V.trim()){d(`يرجى إدخال سبب الاسترجاع`,`warn`);return}if(await C(E.id,`voided`),L===`received`||L===`partial`)for(let e of E.lineItems)e.productId&&e.qty>0&&await T(e.productId,e.qty);d(`تم استرجاع أمر الشراء ${E.number||E.id} وعكس المخزون ✅`,`success`),M(!1)},Q=e=>{O(e),localStorage.setItem(h,e),d(`تم تغيير القالب`,`success`)};return(0,m.jsxs)(m.Fragment,{children:[(0,m.jsxs)(`div`,{className:`no-print`,style:{display:`flex`,alignItems:`center`,gap:10,marginBottom:20,flexWrap:`wrap`},children:[(0,m.jsxs)(`button`,{className:`btn btn-outline btn-sm`,onClick:()=>t(`/erp/purchases`),children:[(0,m.jsx)(`i`,{className:`fa fa-arrow-right`}),` رجوع`]}),(0,m.jsx)(`div`,{style:{flex:1}}),(0,m.jsx)(`div`,{style:{display:`flex`,gap:4,background:`var(--bg)`,border:`1px solid var(--border)`,borderRadius:8,padding:3},children:y.map(e=>(0,m.jsx)(`button`,{onClick:()=>Q(e.id),title:e.name,style:{padding:`4px 10px`,borderRadius:6,border:`none`,cursor:`pointer`,fontSize:11,fontWeight:700,transition:`.15s`,background:D===e.id?`var(--card)`:`transparent`,color:D===e.id?`var(--text)`:`var(--muted)`,boxShadow:D===e.id?`var(--shadow)`:`none`},children:e.name},e.id))}),(0,m.jsx)(`div`,{style:{width:1,height:24,background:`var(--border)`}}),R?(0,m.jsx)(`span`,{style:{fontSize:11,fontWeight:700,color:`var(--danger)`,background:`var(--danger)18`,borderRadius:6,padding:`4px 12px`},children:`مسترجع — ملغى`}):(0,m.jsx)(`span`,{style:{fontSize:11,fontWeight:700,color:_[L],background:_[L]+`18`,borderRadius:6,padding:`4px 12px`},children:v[L]}),L===`pending`&&!R&&(0,m.jsxs)(`button`,{className:`btn btn-sm btn-primary`,onClick:X,children:[(0,m.jsx)(`i`,{className:`fa fa-check-double`}),` تأكيد الاستلام وإضافة للمخزون`]}),G>0&&!R&&L!==`cancelled`&&(0,m.jsxs)(`button`,{className:`btn btn-sm`,style:{background:`var(--success)`,color:`#fff`,border:`none`},onClick:()=>A(!0),children:[(0,m.jsx)(`i`,{className:`fa fa-coins`}),` تسجيل دفعة`]}),!R&&L!==`cancelled`&&(0,m.jsxs)(`button`,{className:`btn btn-sm btn-outline`,style:{color:`var(--danger)`,borderColor:`var(--danger)`},onClick:()=>M(!0),children:[(0,m.jsx)(`i`,{className:`fa fa-rotate-left`}),` استرجاع`]}),(0,m.jsxs)(`button`,{className:`btn btn-outline btn-sm`,onClick:q,children:[(0,m.jsx)(`i`,{className:`fa fa-print`}),` طباعة`]}),(0,m.jsxs)(`button`,{className:`btn btn-outline btn-sm`,onClick:J,children:[(0,m.jsx)(`i`,{className:`fa fa-file-pdf`}),` PDF`]})]}),R&&(0,m.jsxs)(`div`,{style:{background:`#FEF2F2`,border:`1px solid var(--danger)`,borderRadius:10,padding:`12px 20px`,marginBottom:16,display:`flex`,alignItems:`center`,gap:10},children:[(0,m.jsx)(`i`,{className:`fa fa-triangle-exclamation`,style:{color:`var(--danger)`,fontSize:18}}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`div`,{style:{fontWeight:700,color:`var(--danger)`,fontSize:14},children:`هذا الأمر مسترجع وملغى`}),(0,m.jsxs)(`div`,{style:{fontSize:12,color:`var(--muted)`,marginTop:2},children:[`السبب: `,V]})]})]}),(0,m.jsx)(`div`,{className:`invoice-print-wrap`,children:(0,m.jsxs)(`div`,{className:`invoice-template`,style:{borderTop:W.borderTop,opacity:R?.65:1,position:`relative`},children:[R&&(0,m.jsx)(`div`,{style:{position:`absolute`,top:`50%`,left:`50%`,transform:`translate(-50%, -50%) rotate(-30deg)`,fontSize:64,fontWeight:900,color:`rgba(220,38,38,.12)`,border:`6px solid rgba(220,38,38,.12)`,padding:`8px 24px`,borderRadius:10,pointerEvents:`none`,whiteSpace:`nowrap`,zIndex:10},children:`مسترجع — VOIDED`}),(0,m.jsxs)(`div`,{style:{background:W.headerBg,color:W.headerColor,padding:`28px 40px`,display:`flex`,justifyContent:`space-between`,alignItems:`flex-start`},children:[(0,m.jsxs)(`div`,{children:[(0,m.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:12,marginBottom:12},children:[(0,m.jsx)(`div`,{style:{width:44,height:44,borderRadius:10,background:W.headerColor===`#fff`?`rgba(255,255,255,.15)`:W.accentColor+`18`,display:`flex`,alignItems:`center`,justifyContent:`center`,flexShrink:0,overflow:`hidden`},children:U.logo?(0,m.jsx)(`img`,{src:U.logo,alt:`Logo`,style:{width:`100%`,height:`100%`,objectFit:`contain`}}):(0,m.jsx)(`span`,{style:{fontSize:18,fontWeight:900,color:W.headerColor===`#fff`?`#fff`:W.accentColor},children:U.name?U.name.charAt(0):`س`})}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`div`,{style:{fontWeight:800,fontSize:18,lineHeight:1.2},children:U.name||`—`}),(0,m.jsx)(`div`,{style:{fontSize:11,opacity:.7,marginTop:2},children:U.nameEn||``})]})]}),(0,m.jsxs)(`div`,{style:{fontSize:12,opacity:.75,lineHeight:1.8},children:[(0,m.jsx)(`div`,{children:[U.address,U.city,U.country].filter(Boolean).join(`، `)}),(0,m.jsxs)(`div`,{children:[`ج: `,U.phone||`—`,` | `,U.email||`—`]}),(0,m.jsxs)(`div`,{children:[`الرقم الضريبي: `,U.vat||`—`]})]})]}),(0,m.jsxs)(`div`,{style:{textAlign:`left`},children:[(0,m.jsx)(`div`,{style:{fontSize:26,fontWeight:900,letterSpacing:-.5},children:`أمر شراء`}),(0,m.jsx)(`div`,{style:{fontSize:12,opacity:.65,marginTop:2},children:`PURCHASE ORDER`}),(0,m.jsxs)(`div`,{style:{marginTop:16,fontSize:13,lineHeight:2,opacity:.9},children:[(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`strong`,{style:{opacity:.6,fontWeight:600},children:`رقم الأمر:`}),` `,E.number||E.id]}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`strong`,{style:{opacity:.6,fontWeight:600},children:`تاريخ الإصدار:`}),` `,o(new Date(E.date))]}),E.dueDate&&(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`strong`,{style:{opacity:.6,fontWeight:600},children:`تاريخ الاستحقاق:`}),` `,o(new Date(E.dueDate))]})]})]})]}),(0,m.jsxs)(`div`,{className:`inv-body`,children:[(0,m.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:32,marginBottom:24},children:[(0,m.jsxs)(`div`,{style:{background:`var(--bg)`,borderRadius:10,padding:`14px 16px`},children:[(0,m.jsx)(`div`,{style:{fontSize:10,fontWeight:700,color:W.accentColor,textTransform:`uppercase`,letterSpacing:1.5,marginBottom:8},children:`المورد`}),(0,m.jsx)(`div`,{style:{fontWeight:800,fontSize:15},children:E.supplier}),(0,m.jsx)(`div`,{style:{fontSize:12,color:`var(--muted)`,marginTop:4},children:`المملكة العربية السعودية`}),E.supplierVat&&(0,m.jsxs)(`div`,{style:{fontSize:12,color:`var(--muted)`},children:[`الرقم الضريبي: `,E.supplierVat]}),E.createdBy&&(0,m.jsxs)(`div`,{style:{marginTop:10,paddingTop:10,borderTop:`1px solid var(--border)`,fontSize:11},children:[(0,m.jsx)(`span`,{style:{color:`var(--muted)`},children:`المسؤول: `}),(0,m.jsx)(`span`,{style:{fontWeight:700},children:E.createdBy})]})]}),(0,m.jsxs)(`div`,{style:{background:`var(--bg)`,borderRadius:10,padding:`14px 16px`},children:[(0,m.jsx)(`div`,{style:{fontSize:10,fontWeight:700,color:W.accentColor,textTransform:`uppercase`,letterSpacing:1.5,marginBottom:8},children:`حالة السداد`}),(0,m.jsxs)(`div`,{style:{marginBottom:8},children:[(0,m.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:12,marginBottom:4},children:[(0,m.jsx)(`span`,{style:{color:`var(--muted)`},children:`نسبة السداد`}),(0,m.jsxs)(`span`,{style:{fontWeight:700},children:[K,`%`]})]}),(0,m.jsx)(`div`,{style:{height:6,background:`var(--border)`,borderRadius:3,overflow:`hidden`},children:(0,m.jsx)(`div`,{style:{height:`100%`,width:`${K}%`,background:K===100?`var(--success)`:W.accentColor,borderRadius:3,transition:`width .3s`}})})]}),(0,m.jsxs)(`div`,{style:{fontSize:12,lineHeight:1.8},children:[(0,m.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,m.jsx)(`span`,{style:{color:`var(--muted)`},children:`المدفوع`}),(0,m.jsx)(`span`,{style:{color:`var(--success)`,fontWeight:600},children:s(E.paid)})]}),(0,m.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,m.jsx)(`span`,{style:{color:`var(--muted)`},children:`المتبقي`}),(0,m.jsx)(`span`,{style:{color:G>0?`var(--danger)`:`var(--success)`,fontWeight:600},children:s(G)})]})]}),(0,m.jsx)(`div`,{style:{marginTop:10},children:(0,m.jsx)(`span`,{style:{fontSize:11,fontWeight:700,color:R?`var(--danger)`:_[L],background:(R?`var(--danger)`:_[L])+`18`,borderRadius:6,padding:`3px 10px`},children:R?`مسترجع`:v[L]})})]})]}),(0,m.jsxs)(`table`,{className:`inv-table`,children:[(0,m.jsx)(`thead`,{children:(0,m.jsxs)(`tr`,{style:{"--accent":W.accentColor},children:[(0,m.jsx)(`th`,{style:{width:36},children:`#`}),(0,m.jsx)(`th`,{children:`الوصف / البيان`}),(0,m.jsx)(`th`,{style:{width:72,textAlign:`center`},children:`الكمية`}),(0,m.jsx)(`th`,{style:{width:115,textAlign:`left`},children:`سعر الوحدة`}),(0,m.jsx)(`th`,{style:{width:115,textAlign:`left`},children:`الإجمالي`})]})}),(0,m.jsx)(`tbody`,{children:E.lineItems.map((e,t)=>(0,m.jsxs)(`tr`,{children:[(0,m.jsx)(`td`,{style:{color:`var(--muted)`,fontSize:12,textAlign:`center`},children:t+1}),(0,m.jsx)(`td`,{style:{fontWeight:600},children:e.description}),(0,m.jsx)(`td`,{style:{textAlign:`center`},children:e.qty}),(0,m.jsx)(`td`,{style:{textAlign:`left`},children:s(e.price)}),(0,m.jsx)(`td`,{style:{textAlign:`left`,fontWeight:700},children:s(e.total)})]},t))})]}),(0,m.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`flex-start`,gap:24},children:[(0,m.jsxs)(`div`,{style:{fontSize:12,color:`var(--muted)`,lineHeight:1.8,flex:1},children:[(0,m.jsx)(`div`,{style:{fontWeight:700,color:`var(--text)`,marginBottom:4},children:`ملاحظات:`}),(0,m.jsx)(`div`,{children:`يُرجى التسليم في الموعد المحدد.`}),(0,m.jsx)(`div`,{children:`يُرجى إرفاق الفاتورة الضريبية عند التسليم.`}),(0,m.jsxs)(`div`,{style:{marginTop:6,fontSize:11},children:[`للاستفسار: `,U.email||`—`,` | `,U.phone||`—`]}),R&&(0,m.jsx)(`div`,{style:{marginTop:8,color:`var(--danger)`,fontWeight:700,fontSize:12},children:`⚠ هذا الأمر مسترجع وملغى`})]}),(0,m.jsxs)(`div`,{style:{minWidth:260},children:[(0,m.jsxs)(`div`,{className:`inv-totals`,style:{width:`100%`},children:[(0,m.jsxs)(`div`,{className:`inv-totals-row`,children:[(0,m.jsx)(`span`,{style:{color:`var(--muted)`},children:`المجموع قبل الضريبة`}),(0,m.jsx)(`strong`,{children:s(E.amount)})]}),(0,m.jsxs)(`div`,{className:`inv-totals-row`,children:[(0,m.jsx)(`span`,{style:{color:`var(--muted)`},children:`ضريبة القيمة المضافة (15%)`}),(0,m.jsx)(`strong`,{style:{color:`var(--warn)`},children:s(E.tax)})]}),(0,m.jsxs)(`div`,{className:`inv-totals-row grand`,style:{color:W.accentColor},children:[(0,m.jsx)(`span`,{children:`إجمالي الأمر`}),(0,m.jsx)(`strong`,{children:s(E.total)})]}),(0,m.jsxs)(`div`,{className:`inv-totals-row`,style:{borderBottom:`none`},children:[(0,m.jsx)(`span`,{style:{color:`var(--muted)`},children:`المدفوع`}),(0,m.jsx)(`strong`,{style:{color:`var(--success)`},children:s(E.paid)})]}),(0,m.jsxs)(`div`,{className:`inv-totals-row`,style:{borderBottom:`none`,fontWeight:700},children:[(0,m.jsx)(`span`,{style:{color:G>0?`var(--danger)`:`var(--muted)`},children:`المتبقي`}),(0,m.jsx)(`strong`,{style:{color:G>0?`var(--danger)`:`var(--success)`},children:s(G)})]})]}),G===0&&!R&&(0,m.jsx)(`div`,{style:{marginTop:14,textAlign:`center`,padding:`10px 16px`,background:`#ECFDF5`,borderRadius:8,border:`2px solid var(--success)`,color:`var(--success)`,fontWeight:800,fontSize:15,letterSpacing:1},children:`✓ تم السداد بالكامل`})]})]}),(0,m.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr 1fr`,gap:24,marginTop:40},children:[`توقيع مدير المشتريات`,`توقيع المورد (استلام)`,`الختم الرسمي`].map(e=>(0,m.jsx)(`div`,{style:{borderTop:`1px solid var(--border)`,paddingTop:8,textAlign:`center`,fontSize:11,color:`var(--muted)`},children:e},e))}),(0,m.jsxs)(`div`,{style:{marginTop:28,paddingTop:14,borderTop:`2px solid ${W.accentColor}20`,display:`flex`,justifyContent:`space-between`,fontSize:10,color:`var(--muted)`},children:[(0,m.jsxs)(`div`,{children:[U.name||`—`,` — السجل التجاري: `,U.cr||`—`]}),(0,m.jsx)(`div`,{style:{textAlign:`center`},children:`صفحة 1 من 1`}),(0,m.jsx)(`div`,{children:`تم الإصدار بنظام سهل ERP`})]})]})]})}),(0,m.jsx)(f,{open:k,onClose:()=>A(!1),title:`تسجيل دفعة`,children:(0,m.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:14},children:[(0,m.jsxs)(`div`,{style:{background:`var(--bg)`,borderRadius:8,padding:`12px 14px`},children:[(0,m.jsx)(`div`,{style:{fontSize:11,color:`var(--muted)`,marginBottom:4},children:`المبلغ المتبقي`}),(0,m.jsx)(`div`,{style:{fontWeight:800,fontSize:22,color:`var(--danger)`},children:s(G)})]}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`label`,{style:{fontSize:12,fontWeight:700,display:`block`,marginBottom:6},children:`المبلغ المدفوع (ر.س)`}),(0,m.jsx)(`input`,{className:`form-control`,type:`number`,placeholder:String(G),value:N,onChange:e=>P(e.target.value)})]}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`label`,{style:{fontSize:12,fontWeight:700,display:`block`,marginBottom:8},children:`طريقة الدفع`}),(0,m.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr 1fr`,gap:8},children:[[`bank`,`تحويل`,`fa-university`],[`cash`,`نقدي`,`fa-money-bill-wave`],[`card`,`بطاقة`,`fa-credit-card`]].map(([e,t,n])=>(0,m.jsxs)(`button`,{onClick:()=>I(e),style:{background:F===e?`var(--primary)`:`var(--bg)`,color:F===e?`#fff`:`var(--muted)`,border:`1px solid ${F===e?`var(--primary)`:`var(--border)`}`,borderRadius:8,padding:`10px 4px`,cursor:`pointer`,fontSize:11,fontWeight:700,transition:`.15s`},children:[(0,m.jsx)(`i`,{className:`fa ${n}`,style:{display:`block`,fontSize:16,marginBottom:4}}),t]},e))})]}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`label`,{style:{fontSize:12,fontWeight:700,display:`block`,marginBottom:6},children:`ملاحظة`}),(0,m.jsx)(`input`,{className:`form-control`,placeholder:`رقم الحوالة أو تفاصيل الدفع...`})]}),(0,m.jsxs)(`div`,{style:{display:`flex`,gap:8,marginTop:4},children:[(0,m.jsxs)(`button`,{className:`btn btn-primary`,style:{flex:1},onClick:Y,children:[(0,m.jsx)(`i`,{className:`fa fa-check`}),` تأكيد الدفع`]}),(0,m.jsx)(`button`,{className:`btn btn-outline`,onClick:()=>A(!1),children:`إلغاء`})]})]})}),(0,m.jsx)(f,{open:j,onClose:()=>M(!1),title:`استرجاع أمر الشراء`,children:(0,m.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:16},children:[(0,m.jsxs)(`div`,{style:{background:`#FEF2F2`,border:`1px solid var(--danger)`,borderRadius:10,padding:`14px 16px`,display:`flex`,gap:12},children:[(0,m.jsx)(`i`,{className:`fa fa-triangle-exclamation`,style:{color:`var(--danger)`,fontSize:20,marginTop:2}}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`div`,{style:{fontWeight:700,color:`var(--danger)`,marginBottom:4},children:`تحذير: لا يمكن التراجع عن الاسترجاع`}),(0,m.jsxs)(`div`,{style:{fontSize:12,color:`var(--muted)`,lineHeight:1.6},children:[`سيتم إلغاء الأمر `,E.number||E.id,` وتصنيفه كمسترجع. لن يمكن إجراء أي تعديلات أو دفعات عليه.`]})]})]}),(0,m.jsxs)(`div`,{style:{background:`var(--bg)`,borderRadius:8,padding:`12px 14px`,display:`flex`,justifyContent:`space-between`},children:[(0,m.jsx)(`div`,{style:{fontSize:12,color:`var(--muted)`},children:`رقم الأمر`}),(0,m.jsx)(`div`,{style:{fontWeight:700},children:E.number||E.id})]}),(0,m.jsxs)(`div`,{style:{background:`var(--bg)`,borderRadius:8,padding:`12px 14px`,display:`flex`,justifyContent:`space-between`},children:[(0,m.jsx)(`div`,{style:{fontSize:12,color:`var(--muted)`},children:`الإجمالي`}),(0,m.jsxs)(`div`,{style:{fontWeight:700,color:`var(--danger)`},children:[s(E.total),` ر.س`]})]}),(0,m.jsxs)(`div`,{children:[(0,m.jsxs)(`label`,{style:{fontSize:12,fontWeight:700,display:`block`,marginBottom:6},children:[`سبب الاسترجاع `,(0,m.jsx)(`span`,{style:{color:`var(--danger)`},children:`*`})]}),(0,m.jsx)(`textarea`,{className:`form-control`,rows:3,style:{resize:`none`},placeholder:`مثال: إلغاء الطلب، خطأ في البيانات، رفض المورد...`,value:V,onChange:e=>H(e.target.value)})]}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`label`,{style:{fontSize:12,fontWeight:700,display:`block`,marginBottom:6},children:`تاريخ الاسترجاع`}),(0,m.jsx)(`input`,{className:`form-control`,type:`date`,defaultValue:new Date().toISOString().split(`T`)[0]})]}),(0,m.jsxs)(`div`,{style:{display:`flex`,gap:8,marginTop:4},children:[(0,m.jsxs)(`button`,{className:`btn btn-sm`,style:{flex:1,background:`var(--danger)`,color:`#fff`,border:`none`},onClick:Z,children:[(0,m.jsx)(`i`,{className:`fa fa-rotate-left`}),` تأكيد الاسترجاع`]}),(0,m.jsx)(`button`,{className:`btn btn-outline`,onClick:()=>{M(!1),H(``)},children:`إلغاء`})]})]})})]})}export{x as default};