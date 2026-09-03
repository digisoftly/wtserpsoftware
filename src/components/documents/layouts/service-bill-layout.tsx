"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Service Bill Layout - Optimized for 13 Points on a single A4 page
 * Widen Service Name column and tighter vertical spacing
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
    <div className="flex items-center gap-6 px-4 pt-1 mb-1">
      <div className="w-[75px] h-[75px] shrink-0">
        {settings?.companyLogo ? (
          <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-md">W</div>
        )}
      </div>
      <div className="flex-1 flex flex-col items-center text-center space-y-0.5">
        <h1 className="text-[30px] font-black tracking-tighter flex items-center justify-center leading-none">
          <span className="text-[#00D4AA]">WARRIOR</span>
          <span className="text-[#0056B3] ml-2">TECH</span>
          <span className="text-[#F57C00] ml-2">SYSTEM</span>
        </h1>
        <p className="text-[12px] font-bold text-[#F57C00] uppercase tracking-[0.1em] italic leading-none">
          {settings?.companySlogan || "Innovative Security Reliable Communication"}
        </p>
        <div className="flex items-center justify-center gap-6 text-[9px] font-bold text-[#444444] mt-1.5">
          <span className="flex items-center gap-1.5"><span className="text-[#0056B3]">📞</span> {settings?.phone || "+8801753646372"}</span>
          <span className="flex items-center gap-1.5"><span className="text-[#F57C00]">📧</span> {settings?.email || "warriortechsystem@gmail.com"}</span>
          <span className="flex items-center gap-1.5"><span className="text-[#0056B3]">🌐</span> {settings?.website || "www.warriortechsystem.com"}</span>
        </div>
        <p className="text-[9px] font-bold text-[#444444] flex items-center justify-center gap-1.5 mt-0.5 max-w-xl">
          <span className="text-[#0056B3]">📍</span> {settings?.address || "GP Ja-66/2 Gojnabi Rd Wireless Gate Mohakhali Gulshan Dhaka-1212"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[297mm] bg-white text-[#222222] font-sans p-0 select-none border-none leading-tight document-body">
      {renderHeader()}
      <div className="border-t-[1.2px] border-red-500 border-dashed w-full mb-3" />

      <div className="text-center mb-3">
        <h2 className="text-[17px] font-black uppercase text-slate-900 underline underline-offset-4 decoration-2 decoration-blue-600">
          {(props as any).serviceName ? `${(props as any).serviceName} Bill` : title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-3 px-4">
        <div className="space-y-0.5">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 w-fit">Bill To:</p>
          <div className="space-y-0.5 mt-1">
            <p className="text-[12px] font-black uppercase text-slate-900">{customerName || "---"}</p>
            <p className="text-[9px] font-medium text-slate-700">Contact: {cInfo.phoneNumber || "N/A"}</p>
            <p className="text-[9px] leading-snug text-slate-600 whitespace-pre-wrap">{cInfo.address || "Address Not Available"}</p>
          </div>
        </div>
        <div className="space-y-0.5 flex flex-col justify-end text-right">
          <div className="grid grid-cols-[1fr_10px_120px] text-[9px] leading-relaxed justify-items-end">
            <span className="font-bold uppercase text-slate-500">{settings?.pdfLabel_billNo || "Bill No"}</span> <span className="px-1">:</span> <span className="font-black text-blue-800 text-left w-full">{docNumber}</span>
            <span className="font-bold uppercase text-slate-500">{settings?.pdfLabel_billDate || "Bill Date"}</span> <span className="px-1">:</span> <span className="text-left w-full font-bold">{formatDate(date)}</span>
            <span className="font-bold uppercase text-slate-500">Project</span> <span className="px-1">:</span> <span className="text-left w-full truncate">{projectName || "General Service"}</span>
            <span className="font-bold uppercase text-slate-500">Status</span> <span className="px-1">:</span> 
            <span className={cn("font-black uppercase text-left w-full", status === 'paid' ? "text-green-700" : "text-red-600")}>
              {status || "Authenticated"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4">
        <table className="w-full border-collapse border border-black table-fixed">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '32%' }} /> {/* Widen Service Name column to 32% */}
            <col style={{ width: '37%' }} /> 
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-100">
              <th colSpan={5} className="border border-black h-7 text-center text-[10px] font-black uppercase tracking-wider text-blue-900">
                Billing Cycle: {billingMonth}
              </th>
            </tr>
            <tr className="bg-[#F57C00] text-white h-7">
              <th className="border border-black text-[9px] font-black uppercase text-center">SL</th>
              <th className="border border-black text-center text-[9px] font-black uppercase">Service Name</th>
              <th className="border border-black text-center text-[9px] font-black uppercase">Description / Location</th>
              <th className="border border-black text-center text-[9px] font-black uppercase">Rate</th>
              <th className="border border-black text-center text-[9px] font-black uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr className="h-16"><td colSpan={5} className="text-center italic opacity-20 font-black uppercase border border-black text-[10px]">No service data</td></tr>
            ) : groups.map((group: any, gIdx: number) => (
              <React.Fragment key={group.id || gIdx}>
                {group.points.map((point: any, pIdx: number) => {
                  const globalSl = groups.slice(0, gIdx).reduce((acc: number, prevG: any) => acc + prevG.points.length, 0) + pIdx + 1;
                  return (
                    <tr key={point.id || pIdx} className="border-b border-black hover:bg-slate-50">
                      <td className="border border-black text-center text-[10px] font-bold py-1">
                        {globalSl.toString().padStart(2, '0')}
                      </td>
                      <td className="border border-black px-2 text-[10px] font-black text-slate-900 text-center uppercase py-1 whitespace-nowrap overflow-hidden">
                        {group.serviceName}
                      </td>
                      <td className="border border-black px-2 text-[10px] text-slate-700 font-bold text-left uppercase py-1 leading-tight">
                        {point.location} 
                      </td>
                      {pIdx === 0 ? (
                        <td rowSpan={group.points.length} className="border border-black px-1.5 text-right text-[10px] font-black text-slate-800 align-middle tabular-nums">
                          {Number(group.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      ) : null}
                      {pIdx === 0 ? (
                        <td rowSpan={group.points.length} className="border border-black px-1.5 text-right text-[11px] font-black text-blue-900 align-middle tabular-nums">
                          {Number(group.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            
            <tr className="bg-[#f8f9fa] border-t border-black h-8">
              <td colSpan={3} className="border border-black px-3 py-1">
                 <div className="flex flex-col">
                    <p className="text-[7px] font-black uppercase text-slate-400">Amount in Words</p>
                    <p className="text-[10px] font-bold text-blue-800 italic uppercase leading-none">
                       {amountToWords(grandTotal || 0)}
                    </p>
                 </div>
              </td>
              <td className="border border-black px-1 text-right text-[9px] uppercase font-black bg-blue-50">Total Payable</td>
              <td className="border border-black px-1.5 text-right text-[13px] font-black text-blue-900 tabular-nums bg-blue-100">
                {Number(grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 px-4 grid grid-cols-2 gap-8">
        <div className="space-y-0.5">
          <h4 className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Compliance</h4>
          <div className="text-[9px] text-slate-600 leading-tight border border-slate-50 p-2 rounded-lg bg-slate-50/50">
            {settings?.pdfTerms || "1. Payments due by the 10th of each month.\n2. Late payment may attract suspension."}
          </div>
        </div>
        {notes && (
          <div className="bg-blue-50/30 p-2 rounded-lg border-l-4 border-blue-600 h-fit">
             <p className="text-[8px] font-black text-blue-600 uppercase mb-0.5">Remarks</p>
             <p className="text-[10px] font-medium text-slate-700 leading-tight">{notes}</p>
          </div>
        )}
      </div>

      {/* Signature section with reduced top padding */}
      <div className="mt-auto pt-1 pb-3 text-center border-t-2 border-[#F57C00] mx-4">
        <div className="grid grid-cols-4 gap-4 px-4 pt-8 mb-3 relative">
          <div className="text-center border-t border-black pt-0.5 text-[8px] font-black uppercase">Customer Signature</div>
          <div className="text-center border-t border-black pt-0.5 text-[8px] font-black uppercase">Prepared By</div>
          <div className="text-center border-t border-black pt-0.5 text-[8px] font-black uppercase">Checked By</div>
          <div className="text-center relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-12 w-28">
               {settings?.authorizedSignature && <img src={settings.authorizedSignature} className="h-full w-full object-contain" alt="Signature" />}
            </div>
            <div className="border-t-2 border-blue-700 pt-0.5 text-[9px] font-black uppercase text-blue-800">Authorized Signature</div>
          </div>
        </div>
        <p className="text-[9px] font-black text-slate-500 flex items-center justify-center gap-1.5">
          <span className="text-red-600">❤</span> {settings?.footerHeartMsg || "Thank You For Your Business"} <span className="text-red-600">❤</span>
        </p>
        <h4 className="text-[18px] font-black text-slate-900 uppercase tracking-tight leading-none mt-0.5">{settings?.companyName || "Warrior Tech System"}</h4>
      </div>
    </div>
  )
}
