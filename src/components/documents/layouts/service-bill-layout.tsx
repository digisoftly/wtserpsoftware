
"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Service Bill Layout - Ultra-Dynamic Version.
 * Every text property is linked to Admin Settings.
 */
export function ServiceBillLayout(props: DocumentTemplateProps) {
  const { 
    title, docNumber, date, customerName, grandTotal, notes, status, projectName
  } = props;
  
  const { settings } = useSettings()
  const { formatDate, amountToWords } = useTranslation()

  const rawGroups = (props as any).groups || [];
  const groups = rawGroups.map((g: any) => ({
    ...g,
    points: (g.points || []).filter((p: any) => p.location && p.location.trim() !== "")
  })).filter((g: any) => g.serviceName || g.points.length > 0);

  const billingMonth = (props as any).billingMonth || "N/A";
  const cInfo = (props as any).customerData || {};

  // Comprehensive Style Mapping from Admin
  const styles = {
    headerAlign: settings?.pdf_header_align || "left", 
    headerTitleColor: settings?.pdf_header_title_color || "#0056B3",
    headerTitleSize: `${settings?.pdf_header_title_size || 32}px`,
    headerSloganColor: settings?.pdf_header_slogan_color || "#F57C00",
    headerSloganSize: `${settings?.pdf_header_slogan_size || 12}px`,
    headerContactColor: settings?.pdf_header_contact_color || "#333333",
    headerContactSize: `${settings?.pdf_header_contact_size || 9.5}px`,
    headerLogoSize: Number(settings?.pdf_header_logo_size || 80),
    headerTopGap: Number(settings?.pdf_header_top_gap || 5),
    headerContentGap: Number(settings?.pdf_header_content_gap || 6),
    
    custNameColor: settings?.pdf_cust_name_color || "#0F172A",
    custNameSize: `${settings?.pdf_cust_name_size || 13}px`,
    custInfoColor: settings?.pdf_cust_info_color || "#475569",
    custInfoSize: `${settings?.pdf_cust_info_size || 9}px`,

    tableHeaderBg: settings?.pdf_table_header_bg || "#F57C00",
    rowFontSize: `${settings?.pdf_table_row_size || 10.5}pt`,
    rowHeight: `${settings?.pdf_table_row_height || 7}mm`,
    tableBorderColor: settings?.pdf_table_border_color || "#000000",
    
    termsTitle: settings?.pdf_terms_title || "Terms & Conditions",
    termsTitleColor: settings?.pdf_terms_title_color || "#94A3B8",
    termsTopGap: `${settings?.pdf_terms_top_gap || 8}mm`,
    
    signatureTopGap: `${settings?.pdf_signature_top_gap || 20}mm`,
    signatureAlign: settings?.pdf_sig_align || "center",
    
    footerAccent: settings?.pdf_footer_accent || "#F57C00",
    footerTextColor: settings?.pdf_footer_text_color || "#0F172A",
    footerBrandSize: `${settings?.pdf_footer_brand_size || 22}pt`
  };

  const renderHeader = () => {
    const isLogoLeft = styles.headerAlign === 'left';
    
    return (
      <div 
        className={cn(
          "flex w-full px-8 mb-2", 
          isLogoLeft ? "flex-row items-center" : "flex-col items-center text-center"
        )}
        style={{ 
          paddingTop: `${styles.headerTopGap}mm`,
          gap: isLogoLeft ? `${styles.headerContentGap}mm` : '2mm'
        }}
      >
        <div style={{ width: `${styles.headerLogoSize}px`, height: `${styles.headerLogoSize}px` }} className="shrink-0 flex items-center justify-center">
          {settings?.companyLogo ? (
            <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white text-3xl font-black shadow-sm">W</div>
          )}
        </div>

        <div className="flex-1 space-y-0.5 min-w-0">
          <h1 
            className="font-black tracking-tighter leading-none" 
            style={{ 
              display: 'flex', 
              justifyContent: isLogoLeft ? 'flex-start' : 'center',
              fontSize: styles.headerTitleSize,
              color: styles.headerTitleColor
            }}
          >
            <span className="text-[#00D4AA]">WARRIOR</span>
            <span className="ml-2">TECH</span>
            <span className="text-[#F57C00] ml-2">SYSTEM</span>
          </h1>
          <p 
            className="font-bold uppercase tracking-[0.2em] italic leading-none mt-1"
            style={{ color: styles.headerSloganColor, fontSize: styles.headerSloganSize }}
          >
            {settings?.companySlogan || "Innovative Security, Reliable Communication"}
          </p>
          <div 
            className={cn("flex items-center gap-6 mt-1.5", !isLogoLeft && "justify-center")}
            style={{ color: styles.headerContactColor, fontSize: styles.headerContactSize, fontWeight: 'bold' }}
          >
            <span>📞 {settings?.phone}</span>
            <span>📧 {settings?.email}</span>
            <span>🌐 {settings?.website}</span>
          </div>
          <p 
            className="leading-none mt-1 font-bold"
            style={{ color: styles.headerContactColor, fontSize: styles.headerContactSize }}
          >
            📍 {settings?.address}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-[210mm] h-[297mm] bg-white text-[#111111] font-sans p-0 select-none border-none leading-tight flex flex-col overflow-hidden box-border">
      <div className="flex-1 relative">
        {renderHeader()}
        <div className="border-t-[1px] border-red-500 border-dashed w-full mb-3" />

        <div className="text-center mb-3">
          <h2 className="text-[18px] font-black uppercase text-slate-900 underline underline-offset-4 decoration-2 decoration-blue-600 leading-none">
            {(props as any).serviceName ? `${(props as any).serviceName} Bill` : title}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-4 px-8 w-full">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 w-fit pb-0.5">Bill To:</p>
            <div className="space-y-0.5 mt-1">
              <p className="font-black uppercase leading-none truncate" style={{ color: styles.custNameColor, fontSize: styles.custNameSize }}>{customerName || "---"}</p>
              <p className="font-bold uppercase" style={{ color: styles.custInfoColor, fontSize: styles.custInfoSize }}>Contact: {cInfo.phoneNumber || "N/A"}</p>
              <p className="font-medium leading-snug uppercase max-w-full line-clamp-1" style={{ color: styles.custInfoColor, fontSize: styles.custInfoSize }}>{cInfo.address || "Address Not Available"}</p>
            </div>
          </div>
          <div className="text-right flex flex-col justify-end">
            <div className="grid grid-cols-[1fr_8px_110px] text-[9.5px] leading-snug uppercase font-bold text-slate-500 gap-y-0.5">
              <span>Bill No</span> <span>:</span> <span className="font-black text-blue-800 text-left pl-1">{docNumber}</span>
              <span>Date</span> <span>:</span> <span className="font-black text-slate-900 text-left pl-1">{formatDate(date)}</span>
              <span>Project</span> <span>:</span> <span className="font-black text-slate-900 text-left pl-1 truncate uppercase">{projectName || "General"}</span>
              <span>Status</span> <span>:</span> <span className={cn("font-black text-left pl-1", status === 'paid' ? "text-green-700" : "text-red-600")}>{status || "DUE"}</span>
            </div>
          </div>
        </div>

        <div className="px-6 mb-4 w-full">
          <table className="w-full border-collapse border-[0.3mm]" style={{ borderColor: styles.tableBorderColor }}>
            <colgroup>
              <col style={{width: '5%'}}/><col style={{width: '35%'}}/><col style={{width: '40%'}}/><col style={{width: '10%'}}/><col style={{width: '10%'}}/>
            </colgroup>
            <thead>
              <tr className="bg-blue-50 h-7">
                <th colSpan={5} className="border border-black text-center text-[11px] font-black uppercase tracking-widest text-blue-900" style={{ borderColor: styles.tableBorderColor }}>
                  Billing Cycle: {billingMonth}
                </th>
              </tr>
              <tr style={{ backgroundColor: styles.tableHeaderBg, color: '#FFFFFF' }} className="h-8">
                <th className="border border-black text-[9.5px] font-black uppercase text-center" style={{ borderColor: styles.tableBorderColor }}>SL</th>
                <th className="border border-black text-center text-[9.5px] font-black uppercase" style={{ borderColor: styles.tableBorderColor }}>Service Category</th>
                <th className="border border-black text-center text-[9.5px] font-black uppercase" style={{ borderColor: styles.tableBorderColor }}>Location / Point</th>
                <th className="border border-black text-center text-[9.5px] font-black uppercase" style={{ borderColor: styles.tableBorderColor }}>Rate</th>
                <th className="border border-black text-center text-[9.5px] font-black uppercase" style={{ borderColor: styles.tableBorderColor }}>Amount</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: styles.rowFontSize }}>
              {groups.map((group: any, gIdx: number) => (
                <React.Fragment key={gIdx}>
                  {group.points.map((point: any, pIdx: number) => {
                    const globalSl = groups.slice(0, gIdx).reduce((acc: number, prevG: any) => acc + prevG.points.length, 0) + pIdx + 1;
                    return (
                      <tr key={pIdx} className="border-b" style={{ height: styles.rowHeight, borderColor: styles.tableBorderColor }}>
                        <td className="border-x border-black text-center font-black" style={{ borderColor: styles.tableBorderColor }}>{globalSl.toString().padStart(2, '0')}</td>
                        <td className="border-x border-black px-2 font-black text-slate-900 text-center uppercase truncate" style={{ borderColor: styles.tableBorderColor }}>{group.serviceName}</td>
                        <td className="border-x border-black px-2 text-slate-800 font-bold text-left uppercase truncate" style={{ borderColor: styles.tableBorderColor }}>{point.location}</td>
                        {pIdx === 0 ? (<td rowSpan={group.points.length} className="border border-black px-1 text-right font-black text-slate-900 align-middle tabular-nums" style={{ borderColor: styles.tableBorderColor }}>{Number(group.amount || 0).toLocaleString()}</td>) : null}
                        {pIdx === 0 ? (<td rowSpan={group.points.length} className="border border-black px-1 text-right font-black text-blue-900 align-middle tabular-nums" style={{ borderColor: styles.tableBorderColor }}>{Number(group.amount || 0).toLocaleString()}</td>) : null}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              <tr className="bg-slate-50 border-t-[0.3mm] h-10" style={{ borderColor: styles.tableBorderColor }}>
                <td colSpan={3} className="border border-black px-4 py-1" style={{ borderColor: styles.tableBorderColor }}>
                   <div className="flex flex-col">
                      <p className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest leading-none mb-0.5">Amount in Words</p>
                      <p className="text-[11px] font-black text-blue-900 italic uppercase leading-none truncate">{amountToWords(grandTotal || 0)}</p>
                   </div>
                </td>
                <td className="border border-black px-1 text-right text-[9.5px] uppercase font-black bg-blue-100/50" style={{ borderColor: styles.tableBorderColor }}>Payable</td>
                <td className="border border-black px-1 text-right text-[15px] font-black text-blue-900 tabular-nums bg-blue-100" style={{ borderColor: styles.tableBorderColor }}>{Number(grandTotal || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-8" style={{ marginTop: styles.termsTopGap }}>
          <div className="w-full">
            <h4 className="text-[9.5px] font-black uppercase tracking-widest mb-1" style={{ color: styles.termsTitleColor }}>{styles.termsTitle}</h4>
            <div className="text-slate-600 font-bold leading-snug border border-slate-100 p-3 rounded-xl bg-slate-50/50 whitespace-pre-wrap w-full shadow-inner uppercase text-[9pt]">
              {settings?.pdfTerms || "1. Monthly service charges are payable by the 10th of each month.\n2. Delayed payments incur a 5% late fee penalty.\n3. Non-payment for 2 months leads to immediate suspension."}
            </div>
          </div>
          
          {notes && (
            <div className="bg-blue-50/30 p-2.5 rounded-xl border-l-4 border-blue-600 w-full mt-2">
               <p className="text-[8.5px] font-black text-blue-600 uppercase mb-0.5">Remarks</p>
               <p className="text-[10.5px] font-bold text-slate-800 leading-none truncate">{notes}</p>
            </div>
          )}

          <div 
            className={cn("grid grid-cols-4 gap-6 relative pb-2 w-full")}
            style={{ 
              marginTop: styles.signatureTopGap,
              justifyItems: styles.signatureAlign === 'center' ? 'center' : styles.signatureAlign === 'right' ? 'end' : 'start'
            }}
          >
            <div className="text-center border-t border-black pt-1 text-[9.5px] font-black uppercase w-full">Customer Signature</div>
            <div className="text-center border-t border-black pt-1 text-[9.5px] font-black uppercase w-full">Prepared By</div>
            <div className="text-center border-t border-black pt-1 text-[9.5px] font-black uppercase w-full">Checked By</div>
            <div className="text-center relative w-full">
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
        <h4 className="font-black uppercase tracking-tight leading-none mt-1" style={{ fontSize: styles.footerBrandSize, color: styles.footerTextColor }}>{settings?.companyName || "Warrior Tech System"}</h4>
        <div className="flex justify-center gap-8 text-[9.5px] font-black text-blue-700 uppercase tracking-widest mt-1.5 opacity-80">
          <span>• Security System</span>
          <span>• Communication</span>
          <span>• Fire Safety</span>
          <span>• Networking</span>
        </div>
      </div>
    </div>
  )
}
