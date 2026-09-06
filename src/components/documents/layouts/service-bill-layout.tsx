"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Service Bill Layout - Strictly optimized for A4 single page.
 * Guaranteed to fit Header, Table, Terms, and Signature in 297mm height.
 * Column Ratios: Category (40%), Location (35%).
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
    <div className="flex items-center gap-4 pt-4 mb-2 w-full px-6">
      <div className="w-[80px] h-[80px] shrink-0">
        {settings?.companyLogo ? (
          <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white text-3xl font-black shadow-sm">W</div>
        )}
      </div>
      <div className="flex-1 flex flex-col items-center text-center space-y-0.5">
        <h1 className="text-[34px] font-black tracking-tighter flex items-center justify-center leading-none">
          <span className="text-[#00D4AA]">WARRIOR</span>
          <span className="text-[#0056B3] ml-2">TECH</span>
          <span className="text-[#F57C00] ml-2">SYSTEM</span>
        </h1>
        <p className="text-[13px] font-bold text-[#F57C00] uppercase tracking-[0.15em] italic leading-none">
          {settings?.companySlogan || "Innovative Security, Reliable Communication"}
        </p>
        <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-[#333333] mt-1">
          <span>📞 {settings?.phone || "+8801753646372"}</span>
          <span>📧 {settings?.email || "warriortechsystem@gmail.com"}</span>
          <span>🌐 {settings?.website || "www.warriortechsystem.com"}</span>
        </div>
        <p className="text-[10px] font-bold text-[#333333] leading-none mt-0.5">
          📍 {settings?.address || "GP Ja-66/2 Gojnabi Rd Wireless Gate Mohakhali Gulshan Dhaka-1212"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative w-[210mm] h-[297mm] bg-white text-[#111111] font-sans p-0 select-none border-none leading-tight flex flex-col overflow-hidden box-border">
      <div className="flex-1">
        {renderHeader()}
        <div className="border-t-[1px] border-red-500 border-dashed w-full mb-3" />

        <div className="text-center mb-4">
          <h2 className="text-[20px] font-black uppercase text-slate-900 underline underline-offset-4 decoration-2 decoration-blue-600 leading-none">
            {(props as any).serviceName ? `${(props as any).serviceName} Bill` : title}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-4 px-8 w-full">
          <div className="space-y-1">
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 w-fit pb-0.5">Bill To:</p>
            <div className="space-y-1 mt-1.5">
              <p className="text-[14px] font-black uppercase text-slate-900 leading-none truncate">{customerName || "---"}</p>
              <p className="text-[10px] font-bold text-slate-700 uppercase">Contact: {cInfo.phoneNumber || "N/A"}</p>
              <p className="text-[10px] font-medium leading-tight text-slate-600 uppercase max-w-full line-clamp-1">{cInfo.address || "Address Not Available"}</p>
            </div>
          </div>
          <div className="text-right flex flex-col justify-end">
            <div className="grid grid-cols-[1fr_8px_110px] text-[10px] leading-snug uppercase font-bold text-slate-500 gap-y-1">
              <span>Bill No</span> <span>:</span> <span className="font-black text-blue-800 text-left pl-1">{docNumber}</span>
              <span>Date</span> <span>:</span> <span className="font-black text-slate-900 text-left pl-1">{formatDate(date)}</span>
              <span>Project</span> <span>:</span> <span className="font-black text-slate-900 text-left pl-1 truncate uppercase">{projectName || "General"}</span>
              <span>Status</span> <span>:</span> <span className={cn("font-black text-left pl-1", status === 'paid' ? "text-green-700" : "text-red-600")}>{status || "DUE"}</span>
            </div>
          </div>
        </div>

        <div className="px-6 mb-4 w-full">
          <table className="w-full border-collapse border-[0.3mm] border-black table-fixed">
            <colgroup><col style={{width:'5%'}}/><col style={{width:'40%'}}/><col style={{width:'35%'}}/><col style={{width:'10%'}}/><col style={{width:'10%'}}/></colgroup>
            <thead>
              <tr className="bg-blue-50 h-8">
                <th colSpan={5} className="border border-black text-center text-[12px] font-black uppercase tracking-widest text-blue-900">
                  Billing Cycle: {billingMonth}
                </th>
              </tr>
              <tr className="bg-[#F57C00] text-white h-9">
                <th className="border border-black text-[10px] font-black uppercase text-center">SL</th>
                <th className="border border-black text-center text-[10px] font-black uppercase">Service Category</th>
                <th className="border border-black text-center text-[10px] font-black uppercase">Location / Point</th>
                <th className="border border-black text-center text-[10px] font-black uppercase">Rate</th>
                <th className="border border-black text-center text-[10px] font-black uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr className="h-20"><td colSpan={5} className="text-center italic opacity-30 font-black uppercase border border-black text-[11px]">No data found</td></tr>
              ) : groups.map((group: any, gIdx: number) => (
                <React.Fragment key={gIdx}>
                  {group.points.map((point: any, pIdx: number) => {
                    const globalSl = groups.slice(0, gIdx).reduce((acc: number, prevG: any) => acc + prevG.points.length, 0) + pIdx + 1;
                    return (
                      <tr key={pIdx} className="border-b border-black h-7">
                        <td className="border border-black text-center text-[11px] font-black">{globalSl.toString().padStart(2, '0')}</td>
                        <td className="border border-black px-2 text-[10.5px] font-black text-slate-900 text-center uppercase truncate">{group.serviceName}</td>
                        <td className="border border-black px-2 text-[10.5px] text-slate-800 font-bold text-left uppercase truncate">{point.location}</td>
                        {pIdx === 0 ? (<td rowSpan={group.points.length} className="border border-black px-1.5 text-right text-[11px] font-black text-slate-900 align-middle tabular-nums">{Number(group.amount || 0).toLocaleString()}</td>) : null}
                        {pIdx === 0 ? (<td rowSpan={group.points.length} className="border border-black px-1.5 text-right text-[11px] font-black text-blue-900 align-middle tabular-nums">{Number(group.amount || 0).toLocaleString()}</td>) : null}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              <tr className="bg-slate-50 border-t-[0.3mm] border-black h-12">
                <td colSpan={3} className="border border-black px-4 py-1.5">
                   <div className="flex flex-col">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-0.5">Amount in Words</p>
                      <p className="text-[11.5px] font-black text-blue-900 italic uppercase leading-none truncate">{amountToWords(grandTotal || 0)}</p>
                   </div>
                </td>
                <td className="border border-black px-1 text-right text-[10px] uppercase font-black bg-blue-100/50">Payable</td>
                <td className="border border-black px-1.5 text-right text-[16px] font-black text-blue-900 tabular-nums bg-blue-100">{Number(grandTotal || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-8 space-y-4">
          <div className="w-full">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Terms & Conditions</h4>
            <div className="text-[10.5px] text-slate-600 font-bold leading-snug border border-slate-100 p-4 rounded-xl bg-slate-50/50 whitespace-pre-wrap w-full shadow-inner uppercase">
              {settings?.pdfTerms || "1. Monthly service charges are payable by the 10th of each month.\n2. Delayed payments incur a 5% late fee penalty.\n3. Non-payment for 2 months leads to immediate suspension."}
            </div>
          </div>
          
          {notes && (
            <div className="bg-blue-50/30 p-3 rounded-xl border-l-4 border-blue-600 w-full">
               <p className="text-[9px] font-black text-blue-600 uppercase mb-0.5">Remarks</p>
               <p className="text-[11px] font-bold text-slate-800 leading-none truncate">{notes}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-6 pt-12 relative pb-4 w-full">
            <div className="text-center border-t border-black pt-1.5 text-[10px] font-black uppercase">Customer Signature</div>
            <div className="text-center border-t border-black pt-1.5 text-[10px] font-black uppercase">Prepared By</div>
            <div className="text-center border-t border-black pt-1.5 text-[10px] font-black uppercase">Checked By</div>
            <div className="text-center relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-12 w-32">
                 {settings?.authorizedSignature && <img src={settings.authorizedSignature} className="h-full w-full object-contain" alt="Signature" />}
              </div>
              <div className="border-t-2 border-blue-700 pt-1.5 text-[11px] font-black uppercase text-blue-800">Authorized Sign</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pt-2 pb-6 text-center border-t-[1.5mm] border-[#F57C00] bg-white w-full z-50">
        <p className="text-[11px] font-black text-slate-500 flex items-center justify-center gap-2">
          <span className="text-red-600 text-lg">❤</span> {settings?.footerHeartMsg || "Thank You For Your Business"} <span className="text-red-600 text-lg">❤</span>
        </p>
        <h4 className="text-[24px] font-black text-slate-900 uppercase tracking-tight leading-none mt-1">{settings?.companyName || "Warrior Tech System"}</h4>
        <div className="flex justify-center gap-8 text-[10px] font-black text-blue-700 uppercase tracking-widest mt-2 opacity-80">
          <span>• Security System</span>
          <span>• Communication</span>
          <span>• Fire Safety</span>
          <span>• Networking</span>
        </div>
      </div>
    </div>
  )
}