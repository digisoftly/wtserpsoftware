
"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Service Bill Layout - Warrior Official Edition
 * Optimized Table structure: SL, Service Name, Description/Location, Unit Price, Amount.
 * Matches corporate Pad design with vertical price/amount merging.
 */
export function ServiceBillLayout(props: DocumentTemplateProps) {
  const { 
    title, 
    docNumber, 
    date, 
    customerName, 
    customerInfo, 
    grandTotal, 
    notes
  } = props;
  
  const { settings } = useSettings()
  const { formatDate, amountToWords } = useTranslation()

  const groups = (props as any).groups || [];

  const renderHeader = () => (
    <div className="flex items-center gap-6 px-4 pt-4 mb-4">
      <div className="w-[100px] h-[100px] shrink-0">
        {settings?.companyLogo ? (
          <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center text-white text-5xl font-black shadow-lg">W</div>
        )}
      </div>
      <div className="flex-1 flex flex-col items-center text-center space-y-1">
        <h1 className="text-[42px] font-black tracking-tighter flex items-center justify-center leading-none">
          <span className="text-[#00D4AA]">WARRIOR</span>
          <span className="text-[#0056B3] ml-2">TECH</span>
          <span className="text-[#F57C00] ml-2">SYSTEM</span>
        </h1>
        <p className="text-[16px] font-bold text-[#F57C00] uppercase tracking-[0.2em] italic leading-none mt-1">
          {settings?.companySlogan || "Innovative Security Reliable Communication"}
        </p>
        <div className="flex items-center justify-center gap-8 text-[11px] font-bold text-[#444444] mt-3">
          <span className="flex items-center gap-2"><span className="text-[#0056B3]">📞</span> {settings?.phone || "+8801753646372"}</span>
          <span className="flex items-center gap-2"><span className="text-[#F57C00]">📧</span> {settings?.email || "warriortechsystem@gmail.com"}</span>
          <span className="flex items-center gap-2"><span className="text-[#0056B3]">🌐</span> {settings?.website || "www.warriortechsystem.com"}</span>
        </div>
        <p className="text-[11px] font-bold text-[#444444] flex items-center justify-center gap-2 mt-1 max-w-2xl">
          <span className="text-[#0056B3]">📍</span> {settings?.address || "GP Ja-66/2 Gojnabi Rd Wireless Gate Mohakhali Gulshan Dhaka-1212"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full bg-white text-[#222222] font-sans p-0 select-none border-none leading-tight document-body">
      {renderHeader()}
      <div className="border-t-[1.5px] border-red-500 border-dashed w-full mb-8" />

      <div className="text-center mb-8">
        <h2 className="text-[22px] font-black uppercase text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600">
          {(props as any).serviceName ? `${(props as any).serviceName} Bill` : title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-10 mb-8 px-4">
        <div className="space-y-1">
          <p className="text-[12px] font-bold">To,</p>
          <p className="text-[13px] font-black uppercase">{customerName || "---"}</p>
          <div className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap mt-1">
            {customerInfo || "Address Not Available"}
          </div>
        </div>
        <div className="space-y-1 flex flex-col justify-end">
          <div className="grid grid-cols-[120px_10px_1fr] text-[11px] leading-relaxed">
            <span className="font-bold uppercase">Bill Number</span> <span>:</span> <span className="font-black text-blue-800">{docNumber}</span>
            <span className="font-bold uppercase">Bill Date</span> <span>:</span> <span>{formatDate(date)}</span>
            <span className="font-bold uppercase">SLA Ref</span> <span>:</span> <span>{(props as any).agreementNo || '---'}</span>
            <span className="font-bold uppercase">Status</span> <span>:</span> <span className="font-black text-green-700 uppercase">Authenticated</span>
          </div>
        </div>
      </div>

      <div className="bg-[#FDEBD0] border border-black p-2 text-center mb-[1px]">
        <h3 className="text-[14px] font-black text-[#0056B3] uppercase tracking-tight">
          SERVICE AND LOCATION MATRIX
        </h3>
      </div>

      <div className="flex-1">
        <table className="w-full border-collapse border border-black table-fixed">
          <colgroup>
            <col style={{ width: '6%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '43%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>
          <thead>
            <tr className="bg-[#F57C00] text-white h-10">
              <th className="border border-black text-[10px] font-black uppercase text-center">SL</th>
              <th className="border border-black px-4 text-left text-[10px] font-black uppercase">Service Name</th>
              <th className="border border-black px-4 text-left text-[10px] font-black uppercase">Description / Location</th>
              <th className="border border-black px-3 text-right text-[10px] font-black uppercase">Unit Price</th>
              <th className="border border-black px-4 text-right text-[10px] font-black uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr className="h-64"><td colSpan={5} className="text-center italic opacity-20 font-black uppercase border border-black">Service detail records not mapped</td></tr>
            ) : groups.map((group: any, gIdx: number) => (
              <React.Fragment key={group.id || gIdx}>
                {group.points.map((point: any, pIdx: number) => {
                  const globalSl = groups.slice(0, gIdx).reduce((acc: number, prevG: any) => acc + prevG.points.length, 0) + pIdx + 1;
                  return (
                    <tr key={point.id || pIdx} className="border-b border-black min-h-[40px] hover:bg-slate-50 transition-colors">
                      <td className="border border-black text-center text-[11px] font-bold py-2">
                        {globalSl.toString().padStart(2, '0')}
                      </td>
                      <td className="border border-black px-4 text-[10px] font-black text-slate-900 text-left uppercase">
                        {pIdx === 0 ? group.serviceName : ''}
                      </td>
                      <td className="border border-black px-4 text-[10px] text-slate-700 font-bold text-left uppercase py-2 leading-normal">
                        {point.location} 
                        {point.description && <p className="text-slate-400 font-normal normal-case italic mt-0.5">{point.description}</p>}
                      </td>
                      {pIdx === 0 && (
                        <td rowSpan={group.points.length} className="border border-black px-3 text-right text-[11px] font-black text-slate-800 align-middle tabular-nums">
                          {Number(group.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      {pIdx === 0 && (
                        <td rowSpan={group.points.length} className="border border-black px-4 text-right text-[11px] font-black text-blue-900 align-middle tabular-nums">
                          {Number(group.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            
            <tr className="bg-[#f8f9fa] border-t-2 border-black h-12">
              <td colSpan={3} className="border border-black px-5 py-3">
                 <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount in Words</p>
                    <p className="text-[11px] font-bold text-blue-800 italic uppercase">
                       {amountToWords(grandTotal || 0)}
                    </p>
                 </div>
              </td>
              <td className="border border-black px-3 text-right text-[11px] uppercase tracking-wider font-black bg-blue-50 text-blue-900">Total (BDT)</td>
              <td className="border border-black px-4 text-right text-[16px] font-black text-blue-900 tabular-nums bg-blue-100">
                {Number(grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8 px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Compliance & Terms</h4>
          <div className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap border border-slate-100 p-4 rounded-xl bg-slate-50/50">
            {settings?.pdfTerms || "1. Monthly service charges are payable in advance by the 10th of each billing month.\n2. Late payments may attract service suspension.\n3. This document is a computer-generated transaction record."}
          </div>
        </div>
        {notes && (
          <div className="bg-blue-50/30 p-4 rounded-xl border-l-4 border-blue-600">
             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Administrative Remarks</p>
             <p className="text-[10px] font-bold text-slate-700 leading-relaxed">{notes}</p>
          </div>
        )}
      </div>

      <div className="mt-auto pt-12 pb-6 text-center space-y-2 border-t-2 border-[#F57C00] mx-4">
        <div className="grid grid-cols-4 gap-4 pt-12 mb-8 relative">
          <div className="text-center"><div className="border-t border-black pt-1 text-[9px] font-black uppercase">Customer Signature</div></div>
          <div className="text-center"><div className="border-t border-black pt-1 text-[9px] font-black uppercase">Prepared By</div></div>
          <div className="text-center"><div className="border-t border-black pt-1 text-[9px] font-black uppercase">Finance Checked</div></div>
          <div className="text-center relative">
            <div className="border-t-2 border-blue-700 pt-1 text-[10px] font-black uppercase text-blue-800">Authorized Signature</div>
          </div>
        </div>
        <p className="text-[11.5px] font-black text-slate-500 flex items-center justify-center gap-2">
          Thank You For Your Business
        </p>
        <h4 className="text-[24px] font-black text-slate-900 uppercase tracking-tight leading-none">Warrior Tech System</h4>
      </div>
    </div>
  )
}
