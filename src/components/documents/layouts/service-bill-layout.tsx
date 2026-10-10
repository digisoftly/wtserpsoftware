
"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Optimized Monthly Service Bill Layout.
 * Features: A4 Pagination, Hind Siliguri font for Bengali, Dynamic rowSpan Price/Amount.
 */
export function ServiceBillLayout(props: DocumentTemplateProps) {
  const { 
    title, docNumber, date, customerName, grandTotal, notes, status, projectName
  } = props;
  
  const { settings } = useSettings()
  const { formatDate, amountToWords, t, language } = useTranslation()

  // Process data for grouping and rowSpan
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
    custNameSize: `${settings?.pdf_cust_name_size || 14}px`,
    custInfoColor: settings?.pdf_cust_info_color || "#475569",
    custInfoSize: `${settings?.pdf_cust_info_size || 9.5}px`,

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
    footerBrandSize: `${settings?.pdf_footer_brand_size || 22}pt`,
    fontFamily: language === 'BN' ? 'Hind Siliguri, sans-serif' : 'Inter, sans-serif'
  };

  const renderHeader = () => {
    const isLogoLeft = styles.headerAlign === 'left';
    return (
      <div 
        className={cn(
          "flex w-full px-8 mb-4", 
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
          <p className="leading-none mt-1 font-bold" style={{ color: styles.headerContactColor, fontSize: styles.headerContactSize }}>
            📍 {settings?.address}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full min-h-full bg-white text-[#111111] p-0 select-none border-none leading-tight flex flex-col overflow-visible box-border" style={{ fontFamily: styles.fontFamily }}>
      <div className="flex-1 relative pb-24">
        {renderHeader()}
        <div className="border-t-[1px] border-red-500 border-dashed w-full mb-4" />

        <div className="text-center mb-6">
          <h2 className="text-[20px] font-black uppercase text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600 leading-none">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-6 px-8 w-full">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 w-fit pb-0.5">{t('billTo')}:</p>
            <div className="space-y-1 mt-2">
              <p className="font-black uppercase leading-none truncate" style={{ color: styles.custNameColor, fontSize: styles.custNameSize }}>{customerName || "---"}</p>
              <p className="font-bold" style={{ color: styles.custInfoColor, fontSize: styles.custInfoSize }}>{t('phoneNumber')}: {cInfo.phoneNumber || "N/A"}</p>
              <p className="font-medium leading-relaxed uppercase" style={{ color: styles.custInfoColor, fontSize: styles.custInfoSize }}>{cInfo.address || "Address Not Available"}</p>
            </div>
          </div>
          <div className="text-right flex flex-col justify-end">
            <div className="grid grid-cols-[1fr_8px_130px] text-[10px] leading-snug uppercase font-bold text-slate-500 gap-y-1.5">
              <span>{t('docNo')}</span> <span>:</span> <span className="font-black text-blue-800 text-left pl-2">{docNumber}</span>
              <span>{t('date')}</span> <span>:</span> <span className="font-black text-slate-900 text-left pl-2">{formatDate(date)}</span>
              <span>{t('projectName')}</span> <span>:</span> <span className="font-black text-slate-900 text-left pl-2 truncate">{projectName || "General"}</span>
              <span>{t('status')}</span> <span>:</span> <span className={cn("font-black text-left pl-2", status === 'paid' ? "text-green-700" : "text-red-600")}>{status || "DUE"}</span>
            </div>
          </div>
        </div>

        <div className="px-8 mb-6 w-full">
          <table className="w-full border-collapse border-[0.3mm]" style={{ borderColor: styles.tableBorderColor }}>
            <colgroup>
              <col style={{width: '6%'}}/><col style={{width: '30%'}}/><col style={{width: '44%'}}/><col style={{width: '10%'}}/><col style={{width: '10%'}}/>
            </colgroup>
            <thead>
              <tr className="bg-blue-50 h-8">
                <th colSpan={5} className="border border-black text-center text-[12px] font-black uppercase tracking-widest text-blue-900" style={{ borderColor: styles.tableBorderColor }}>
                  {t('billingMonth')}: {billingMonth}
                </th>
              </tr>
              <tr style={{ backgroundColor: styles.tableHeaderBg, color: '#FFFFFF' }} className="h-10">
                <th className="border border-black text-[10px] font-black uppercase text-center" style={{ borderColor: styles.tableBorderColor }}>{t('sl')}</th>
                <th className="border border-black text-center text-[10px] font-black uppercase" style={{ borderColor: styles.tableBorderColor }}>{t('itemName')}</th>
                <th className="border border-black text-center text-[10px] font-black uppercase" style={{ borderColor: styles.tableBorderColor }}>{t('details')}</th>
                <th className="border border-black text-center text-[10px] font-black uppercase" style={{ borderColor: styles.tableBorderColor }}>{t('price')}</th>
                <th className="border border-black text-center text-[10px] font-black uppercase" style={{ borderColor: styles.tableBorderColor }}>{t('amount')}</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: styles.rowFontSize }}>
              {groups.map((group: any, gIdx: number) => (
                <React.Fragment key={gIdx}>
                  {group.points.map((point: any, pIdx: number) => {
                    const globalSl = groups.slice(0, gIdx).reduce((acc: number, prevG: any) => acc + prevG.points.length, 0) + pIdx + 1;
                    return (
                      <tr key={pIdx} className="border-b page-break-inside-avoid" style={{ height: styles.rowHeight, borderColor: styles.tableBorderColor }}>
                        <td className="border-x border-black text-center font-black" style={{ borderColor: styles.tableBorderColor }}>{globalSl.toString().padStart(2, '0')}</td>
                        <td className="border-x border-black px-3 font-black text-slate-900 text-center uppercase" style={{ borderColor: styles.tableBorderColor }}>{group.serviceName}</td>
                        <td className="border-x border-black px-3 text-slate-800 font-bold text-left uppercase" style={{ borderColor: styles.tableBorderColor }}>{point.location}</td>
                        {pIdx === 0 ? (
                          <td rowSpan={group.points.length} className="border border-black px-2 text-right font-black text-slate-900 align-middle tabular-nums" style={{ borderColor: styles.tableBorderColor }}>
                            {Number(group.amount || 0).toLocaleString()}
                          </td>
                        ) : null}
                        {pIdx === 0 ? (
                          <td rowSpan={group.points.length} className="border border-black px-2 text-right font-black text-blue-900 align-middle tabular-nums bg-slate-50/30" style={{ borderColor: styles.tableBorderColor }}>
                            {Number(group.amount || 0).toLocaleString()}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              <tr className="bg-slate-50 border-t-[0.4mm] h-12" style={{ borderColor: styles.tableBorderColor }}>
                <td colSpan={3} className="border border-black px-6 py-2" style={{ borderColor: styles.tableBorderColor }}>
                   <div className="flex flex-col">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{t('amountInWords')}</p>
                      <p className="text-[12px] font-black text-blue-900 italic uppercase leading-tight">{amountToWords(grandTotal || 0)}</p>
                   </div>
                </td>
                <td className="border border-black px-2 text-right text-[10px] uppercase font-black bg-blue-100/50" style={{ borderColor: styles.tableBorderColor }}>{t('total')}</td>
                <td className="border border-black px-2 text-right text-[18px] font-black text-blue-900 tabular-nums bg-blue-100" style={{ borderColor: styles.tableBorderColor }}>{Number(grandTotal || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-8" style={{ marginTop: styles.termsTopGap }}>
          <div className="w-full">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: styles.termsTitleColor }}>{styles.termsTitle}</h4>
            <div className="text-slate-600 font-bold leading-snug border border-slate-100 p-5 rounded-2xl bg-slate-50/50 whitespace-pre-wrap w-full shadow-inner uppercase text-[10px]">
              {settings?.pdfTerms || "1. Monthly service charges are payable by the 10th of each month.\n2. Delayed payments incur a late fee penalty.\n3. Ownership of equipment remains with WTS until full payment."}
            </div>
          </div>
          
          {notes && (
            <div className="bg-blue-50/30 p-4 rounded-xl border-l-4 border-blue-600 w-full mt-3">
               <p className="text-[9px] font-black text-blue-600 uppercase mb-1">{t('details')}</p>
               <p className="text-[11px] font-bold text-slate-800 leading-normal">{notes}</p>
            </div>
          )}

          <div 
            className="grid grid-cols-4 gap-8 relative pb-4 w-full"
            style={{ 
              marginTop: styles.signatureTopGap,
              justifyItems: styles.signatureAlign === 'center' ? 'center' : styles.signatureAlign === 'right' ? 'end' : 'start'
            }}
          >
            <div className="text-center border-t border-black pt-2 text-[10px] font-black uppercase w-full">Customer Sign</div>
            <div className="text-center border-t border-black pt-2 text-[10px] font-black uppercase w-full">Prepared By</div>
            <div className="text-center border-t border-black pt-2 text-[10px] font-black uppercase w-full">Checked By</div>
            <div className="text-center relative w-full">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-12 w-32">
                 {settings?.authorizedSignature && <img src={settings.authorizedSignature} className="h-full w-full object-contain" alt="Signature" />}
              </div>
              <div className="border-t-2 border-blue-700 pt-2 text-[11px] font-black uppercase text-blue-800">Authorized Sign</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pt-2 pb-6 text-center border-t-[1.5mm] bg-white w-full z-50 no-print-absolute" style={{ borderColor: styles.footerAccent }}>
        <p className="text-[11px] font-black text-slate-500 flex items-center justify-center gap-2 mb-1">
          <span className="text-red-600 text-lg">❤</span> {settings?.footerHeartMsg || "Thank You For Your Business"} <span className="text-red-600 text-lg">❤</span>
        </p>
        <h4 className="font-black uppercase tracking-tight leading-none" style={{ fontSize: styles.footerBrandSize, color: styles.footerTextColor }}>{settings?.companyName || "Warrior Tech System"}</h4>
        <div className="flex justify-center gap-10 text-[10px] font-black text-blue-700 uppercase tracking-widest mt-2.5 opacity-80">
          <span>• SECURITY SYSTEM</span>
          <span>• COMMUNICATION</span>
          <span>• FIRE SAFETY</span>
          <span>• NETWORKING</span>
        </div>
      </div>
    </div>
  )
}
