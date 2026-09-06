"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Service Bill Layout - Optimized to match the user-provided image precisely.
 * Fits 13+ points on a single A4 page at 100% scale.
 */
export function ServiceBillLayout(props: DocumentTemplateProps) {
  const { 
    title, 
    docNumber, 
    date, 
    customerName, 
    grandTotal, 
    notes,
    status,
    projectName
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

  const renderHeader = () => (
    <div className="flex items-center gap-6 pt-0 mb-4 w-full">
      <div className="w-[90px] h-[90px] shrink-0">
        {settings?.companyLogo ? (
          <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-md">W</div>
        )}
      </div>
      <div className="flex-1 flex flex-col items-center text-center space-y-0.5">
        <h1 className="text-[40px] font-black tracking-tighter flex items-center justify-center leading-none">
          <span className="text-[#00D4AA]">WARRIOR</span>
          <span className="text-[#0056B3] ml-2">TECH</span>
          <span className="text-[#F57C00] ml-2">SYSTEM</span>
        </h1>
        <p className="text-[15px] font-bold text-[#F57C00] uppercase tracking-[0.2em] italic leading-none mt-1">
          {settings?.companySlogan || "Innovative Security, Reliable Communication"}
        </p>
        <div className="flex items-center justify-center gap-5 text-[11px] font-bold text-[#333333] mt-2">
          <span><span className="text-[#0056B3]">📞</span> {settings?.phone || "+8801753646372"}</span>
          <span><span className="text-[#F57C00]">📧</span> {settings?.email || "warriortechsystem@gmail.com"}</span>
          <span><span className="text-[#0056B3]">🌐</span> {settings?.website || "www.warriortechsystem.com"}</span>
        </div>
        <p className="text-[11px] font-bold text-[#333333] flex items-center justify-center gap-1 mt-1 leading-none">
          <span className="text-[#0056B3]">📍</span> {settings?.address || "GP Ja-66/2 Gojnabi Rd Wireless Gate Mohakhali Gulshan Dhaka-1212"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative h-full w-full bg-white text-[#111111] font-sans p-0 select-none border-none leading-tight flex flex-col overflow-hidden">
      <div className="flex-1 px-1">
        {renderHeader()}
        <div className="border-t-[1.5px] border-red-500 border-dashed w-full mb-4" />

        <div className="text-center mb-6">
          <h2 className="text-[22px] font-black uppercase text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600 leading-none">
            {(props as any).serviceName ? `${(props as any).serviceName} Bill` : title}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-8 px-2">
          <div className="space-y-1">
            <p className="text-[12px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 w-fit pb-0.5">Bill To:</p>
            <div className="space-y-1.5 mt-2">
              <p className="text-[16px] font-black uppercase text-slate-900 leading-none truncate">{customerName || "---"}</p>
              <p className="text-[11px] font-bold text-slate-800 uppercase">Contact: {cInfo.phoneNumber || "N/A"}</p>
              <p className="text-[11px] font-medium leading-relaxed text-slate-600 whitespace-pre-wrap max-w-full line-clamp-2 uppercase">{cInfo.address || "Address Not Available"}</p>
            </div>
          </div>
          <div className="space-y-1 flex flex-col justify-end text-right">
            <div className="grid grid-cols-[1fr_8px_140px] text-[11px] leading-snug justify-items-end gap-y-1.5 uppercase font-bold text-slate-500">
              <span>{settings?.pdfLabel_billNo || "Bill No"}</span> <span>:</span> <span className="font-black text-blue-800 text-left w-full truncate">{docNumber}</span>
              <span>{settings?.pdfLabel_billDate || "Bill Date"}</span> <span>:</span> <span className="text-left w-full font-black text-slate-900">{formatDate(date)}</span>
              <span>Project</span> <span>:</span> <span className="text-left w-full truncate font-black text-slate-900">{projectName || "General Service"}</span>
              <span>Status</span> <span>:</span> <span className={cn("font-black text-left w-full", status === 'paid' ? "text-green-700" : "text-red-600")}>{status || "Authenticated"}</span>
            </div>
          </div>
        </div>

        <div className="px-1 mb-8">
          <table className="w-full border-collapse border-[0.4mm] border-black table-fixed">
            <colgroup><col style={{width:'5%'}}/><col style={{width:'36%'}}/><col style={{width:'39%'}}/><col style={{width:'10%'}}/><col style={{width:'10%'}}/></colgroup>
            <thead>
              <tr className="bg-blue-50 h-9">
                <th colSpan={5} className="border border-black text-center text-[13px] font-black uppercase tracking-[0.2em] text-blue-900">
                  Billing Cycle: {billingMonth}
                </th>
              </tr>
              <tr className="bg-[#F57C00] text-white h-10">
                <th className="border border-black text-[11px] font-black uppercase text-center">SL</th>
                <th className="border border-black text-center text-[11px] font-black uppercase">Service Category</th>
                <th className="border border-black text-center text-[11px] font-black uppercase">Location / Point</th>
                <th className="border border-black text-center text-[11px] font-black uppercase">Rate</th>
                <th className="border border-black text-center text-[11px] font-black uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr className="h-24"><td colSpan={5} className="text-center italic opacity-30 font-black uppercase border border-black text-[13px]">No service data synchronized</td></tr>
              ) : groups.map((group: any, gIdx: number) => (
                <React.Fragment key={group.id || gIdx}>
                  {group.points.map((point: any, pIdx: number) => {
                    const globalSl = groups.slice(0, gIdx).reduce((acc: number, prevG: any) => acc + prevG.points.length, 0) + pIdx + 1;
                    return (
                      <tr key={point.id || pIdx} className="border-b border-black hover:bg-slate-50 min-h-[30px]">
                        <td className="border border-black text-center text-[12px] font-black py-1.5">{globalSl.toString().padStart(2, '0')}</td>
                        <td className="border border-black px-3 text-[11.5px] font-black text-slate-900 text-center uppercase py-1.5 truncate">{group.serviceName}</td>
                        <td className="border border-black px-3 text-[11.5px] text-slate-800 font-bold text-left uppercase py-1.5 leading-tight truncate">{point.location}</td>
                        {pIdx === 0 ? (<td rowSpan={group.points.length} className="border border-black px-2 text-right text-[12px] font-black text-slate-900 align-middle tabular-nums">{Number(group.amount || 0).toLocaleString()}</td>) : null}
                        {pIdx === 0 ? (<td rowSpan={group.points.length} className="border border-black px-2 text-right text-[12px] font-black text-blue-900 align-middle tabular-nums">{Number(group.amount || 0).toLocaleString()}</td>) : null}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              <tr className="bg-slate-50 border-t-[0.4mm] border-black h-14">
                <td colSpan={3} className="border border-black px-5 py-2">
                   <div className="flex flex-col">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Amount in Words</p>
                      <p className="text-[13px] font-black text-blue-900 italic uppercase leading-tight truncate">{amountToWords(grandTotal || 0)}</p>
                   </div>
                </td>
                <td className="border border-black px-2 text-right text-[11px] uppercase font-black bg-blue-100/50">Total Payable</td>
                <td className="border border-black px-2 text-right text-[18px] font-black text-blue-900 tabular-nums bg-blue-100">{Number(grandTotal || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-2 space-y-5">
          <div className="w-full">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Terms & Conditions</h4>
            <div className="text-[11.5px] text-slate-600 font-bold leading-relaxed border border-slate-100 p-5 rounded-2xl bg-slate-50/50 whitespace-pre-wrap w-full shadow-inner">
              {settings?.pdfTerms || "1. Monthly service charges are payable by the 10th of each month.\n2. Invoices are subject to late payment penalties if delayed.\n3. Continuous non-payment results in immediate suspension of services."}
            </div>
          </div>
          
          {notes && (
            <div className="bg-blue-50/30 p-4 rounded-2xl border-l-4 border-blue-600 w-full">
               <p className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Internal Memo</p>
               <p className="text-[12px] font-bold text-slate-800 leading-snug">{notes}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-8 pt-20 relative pb-6 w-full">
            <div className="text-center border-t border-black pt-2 text-[11px] font-black uppercase">Customer Signature</div>
            <div className="text-center border-t border-black pt-2 text-[11px] font-black uppercase">Prepared By</div>
            <div className="text-center border-t border-black pt-2 text-[11px] font-black uppercase">Checked By</div>
            <div className="text-center relative">
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-16 w-36">
                 {settings?.authorizedSignature && <img src={settings.authorizedSignature} className="h-full w-full object-contain" alt="Signature" />}
              </div>
              <div className="border-t-2 border-blue-700 pt-2 text-[12px] font-black uppercase text-blue-800">Authorized Signature</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pt-3 pb-8 text-center border-t-[2mm] border-[#F57C00] bg-white z-50">
        <p className="text-[13px] font-black text-slate-500 flex items-center justify-center gap-3">
          <span className="text-red-600 text-xl">❤</span> {settings?.footerHeartMsg || "Thank You For Your Business"} <span className="text-red-600 text-xl">❤</span>
        </p>
        <h4 className="text-[28px] font-black text-slate-900 uppercase tracking-tight leading-none mt-1.5">{settings?.companyName || "Warrior Tech System"}</h4>
        <div className="flex justify-center gap-10 text-[11px] font-black text-blue-700 uppercase tracking-[0.25em] mt-3">
          <span>• Security</span>
          <span>• Communication</span>
          <span>• Fire Safety</span>
          <span>• Network</span>
        </div>
      </div>
    </div>
  )
}
