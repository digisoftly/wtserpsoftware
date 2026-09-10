
"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Warrior Layout - Ultra-Dynamic Version.
 * All positions, sizes, and colors are controlled via Admin settings.
 */
export function WarriorLayout(props: DocumentTemplateProps) {
  const { settings } = useSettings();
  const { t, formatDate, amountToWords } = useTranslation();
  const { 
    items = [], subtotal, taxAmount, discount, grandTotal, 
    notes, title, docNumber, date, 
    customerName, customerInfo, projectName, status 
  } = props;

  // Admin Styled Parameters
  const styles = {
    headerAlign: settings?.pdf_header_align || "center",
    headerTitleColor: settings?.pdf_header_title_color || "#0056B3",
    headerLogoSize: Number(settings?.pdf_header_logo_size || 70),
    headerTopGap: Number(settings?.pdf_header_top_gap || 5),
    tableHeaderBg: settings?.pdf_table_header_bg || "#F57C00",
    tableHeaderTextColor: "#FFFFFF",
    rowFontSize: `${settings?.pdf_table_row_size || 10.5}pt`,
    rowHeight: `${settings?.pdf_table_row_height || 7}mm`,
    termsTitle: settings?.pdf_terms_title || "Terms & Conditions",
    termsFontSize: `${settings?.pdf_terms_size || 9.5}pt`,
    termsTopGap: `${settings?.pdf_terms_top_gap || 10}mm`,
    signatureTopGap: `${settings?.pdf_signature_top_gap || 30}mm`,
    footerAccent: settings?.pdf_footer_accent || "#F57C00",
    footerBrandSize: `${settings?.pdf_footer_brand_size || 22}pt`
  };

  const renderHeader = () => (
    <div 
      className={cn("flex flex-col mb-2 w-full px-8", styles.headerAlign === 'center' ? "items-center text-center" : "items-start text-left")}
      style={{ paddingTop: `${styles.headerTopGap}mm` }}
    >
      <div style={{ width: `${styles.headerLogoSize}px`, height: `${styles.headerLogoSize}px` }} className="mb-2">
        {settings?.companyLogo ? (
          <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white text-3xl font-black shadow-sm">W</div>
        )}
      </div>
      <div className="space-y-0.5">
        <h1 className="text-[32px] font-black tracking-tighter leading-none" style={{ display: 'flex', justifyContent: styles.headerAlign === 'center' ? 'center' : 'flex-start' }}>
          <span className="text-[#00D4AA]">WARRIOR</span>
          <span className="ml-2" style={{ color: styles.headerTitleColor }}>TECH</span>
          <span className="text-[#F57C00] ml-2">SYSTEM</span>
        </h1>
        <p className="text-[12px] font-bold text-[#F57C00] uppercase tracking-[0.2em] italic leading-none mt-1">
          {settings?.companySlogan || "Innovative Security, Reliable Communication"}
        </p>
        <div className={cn("flex items-center gap-6 text-[9.5px] font-bold text-[#333333] mt-1.5", styles.headerAlign === 'center' ? "justify-center" : "justify-start")}>
          <span>📞 {settings?.phone}</span>
          <span>📧 {settings?.email}</span>
          <span>🌐 {settings?.website}</span>
        </div>
        <p className="text-[9.5px] font-bold text-[#333333] leading-none mt-1">
          📍 {settings?.address}
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative w-[210mm] h-[297mm] bg-white text-[#111111] font-sans p-0 select-none border-none leading-tight flex flex-col overflow-hidden box-border">
      <div className="flex-1">
        {renderHeader()}
        <div className="border-t-[1px] border-red-500 border-dashed w-full mb-3" />

        <div className="grid grid-cols-2 gap-10 mb-4 px-8 w-full">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 w-fit pb-0.5">Bill To:</p>
            <p className="text-[14px] font-black uppercase text-slate-900 mt-1 truncate">{customerName || "---"}</p>
            <div className="text-[9.5px] font-medium leading-snug text-slate-700 whitespace-pre-wrap max-w-full line-clamp-2 mt-0.5 uppercase">
              {customerInfo || "Address Not Available"}
            </div>
          </div>
          <div className="text-right flex flex-col justify-end">
            <div className="grid grid-cols-[1fr_8px_120px] text-[9.5px] leading-snug uppercase font-bold text-slate-500 gap-y-1">
              <span>Ref No</span> <span>:</span> <span className="font-black text-blue-800 text-left pl-1">{docNumber}</span>
              <span>Date</span> <span>:</span> <span className="font-black text-slate-900 text-left pl-1">{formatDate(date)}</span>
              <span>Project</span> <span>:</span> <span className="font-black text-slate-900 text-left pl-1 truncate uppercase">{projectName || "General"}</span>
              <span>Status</span> <span>:</span> <span className={cn("font-black text-left pl-1", status === 'paid' ? "text-green-700" : "text-red-600")}>{status || "DUE"}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#FDEBD0] border-y-[0.3mm] border-black py-1.5 text-center mb-4 mx-6">
          <h3 className="text-[16px] font-black text-[#0056B3] uppercase tracking-[0.2em] leading-none">
            {title || "OFFICIAL DOCUMENT"}
          </h3>
        </div>

        <div className="px-6 w-full mb-4">
          <table className="w-full border-collapse border-[0.3mm] border-black table-fixed">
            <colgroup><col style={{width:'5%'}}/><col style={{width:'50%'}}/><col style={{width:'10%'}}/><col style={{width:'15%'}}/><col style={{width:'20%'}}/></colgroup>
            <thead>
              <tr style={{ backgroundColor: styles.tableHeaderBg, color: styles.tableHeaderTextColor }} className="h-8">
                <th className="border border-black text-[9.5px] font-black uppercase text-center">SL</th>
                <th className="border border-black px-2 text-left text-[9.5px] font-black uppercase">Item Description</th>
                <th className="border border-black text-center text-[9.5px] font-black uppercase">Qty</th>
                <th className="border border-black text-center text-[9.5px) font-black uppercase">Price</th>
                <th className="border border-black text-right text-[9.5px] font-black uppercase pr-2">Total</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: styles.rowFontSize }}>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-black align-middle" style={{ height: styles.rowHeight }}>
                  <td className="border-x border-black text-center font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="border-x border-black px-2">
                    <p className="font-black text-slate-900 uppercase truncate">{item.name}</p>
                    {item.sn && <p className="text-[7.5px] font-black text-blue-700 leading-none">S/N: {item.sn}</p>}
                  </td>
                  <td className="border-x border-black text-center font-bold">{item.quantity} {item.unit || 'Pcs'}</td>
                  <td className="border-x border-black text-center font-bold tabular-nums">{(item.unitPrice || 0).toLocaleString()}</td>
                  <td className="border-x border-black text-right font-black tabular-nums pr-2">{(item.total || 0).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="h-7 bg-slate-50">
                <td colSpan={4} className="border border-black p-1 text-right text-[9.5px] font-black uppercase pr-2">Subtotal</td>
                <td className="border border-black p-1 text-right text-[10.5px] font-black pr-2 tabular-nums">{(subtotal || 0).toLocaleString()}</td>
              </tr>
              {discount > 0 && (
                <tr className="h-7 text-red-700">
                  <td colSpan={4} className="border border-black p-1 text-right text-[9.5px] font-black uppercase pr-2">Discount</td>
                  <td className="border border-black p-1 text-right text-[10.5px] font-black pr-2 tabular-nums">{(discount || 0).toLocaleString()}</td>
                </tr>
              )}
              <tr style={{ backgroundColor: styles.tableHeaderBg }} className="h-10 text-white">
                <td colSpan={4} className="border border-black p-1 text-right text-[11px] font-black uppercase pr-3">Grand Total Payable</td>
                <td className="border border-black p-1 text-right text-[16px] font-black pr-3 tabular-nums">{(grandTotal || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-8" style={{ marginTop: styles.termsTopGap }}>
          <div className="w-full">
            <h4 className="text-[9.5px] font-black uppercase text-slate-400 tracking-widest mb-1">{styles.termsTitle}</h4>
            <div 
              style={{ fontSize: styles.termsFontSize }}
              className="text-slate-600 font-bold leading-snug border border-slate-100 p-3 rounded-xl bg-slate-50/50 whitespace-pre-wrap w-full shadow-inner uppercase"
            >
              {settings?.pdfTerms || "1. Ownership remains with WTS until full payment.\n2. Warranty covers manufacturing defects only.\n3. Goods sold are not returnable without valid cause."}
            </div>
          </div>
          
          {notes && (
            <div className="bg-blue-50/30 p-2.5 rounded-xl border-l-4 border-blue-600 w-full mt-2">
               <p className="text-[8.5px] font-black text-blue-600 uppercase mb-0.5">Remarks</p>
               <p className="text-[10.5px] font-bold text-slate-800 leading-none truncate">{notes}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-6 relative pb-2 w-full" style={{ marginTop: styles.signatureTopGap }}>
            <div className="text-center border-t border-black pt-1 text-[9.5px] font-black uppercase">Customer Signature</div>
            <div className="text-center border-t border-black pt-1 text-[9.5px] font-black uppercase">Prepared By</div>
            <div className="text-center border-t border-black pt-1 text-[9.5px] font-black uppercase">Checked By</div>
            <div className="text-center relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-10 w-28">
                 {settings?.authorizedSignature && <img src={settings.authorizedSignature} className="h-full w-full object-contain" alt="Signature" />}
              </div>
              <div className="border-t-2 border-blue-700 pt-1 text-[10.5px] font-black uppercase text-blue-800">Authorized Sign</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pt-1.5 pb-4 text-center border-t-[1.2mm] bg-white w-full z-50" style={{ borderColor: styles.footerAccent }}>
        <p className="text-[10.5px] font-black text-slate-500 flex items-center justify-center gap-2">
          <span className="text-red-600 text-base">❤</span> {settings?.footerHeartMsg || "Thank You For Your Business"} <span className="text-red-600 text-base">❤</span>
        </p>
        <h4 className="font-black text-slate-900 uppercase tracking-tight leading-none mt-1" style={{ fontSize: styles.footerBrandSize }}>{settings?.companyName}</h4>
        <div className="flex justify-center gap-8 text-[9.5px] font-black text-blue-700 uppercase tracking-widest mt-1.5 opacity-80">
          <span>• Security System</span>
          <span>• Communication</span>
          <span>• Fire Safety</span>
          <span>• Networking</span>
        </div>
      </div>
    </div>
  );
}
