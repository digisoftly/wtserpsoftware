
"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Service Bill Layout - Clean Corporate Edition
 * Specialized for Multi-Location Monthly Service Charge Bills
 * Supports Row-merging for Price and Amount cells per group.
 */
export function ServiceBillLayout({
  title,
  docNumber,
  date,
  customerName,
  customerInfo,
  grandTotal,
  notes,
  ...props
}: DocumentTemplateProps) {
  const { settings, currencySymbol } = useSettings()
  const { amountToWords } = useTranslation()

  // Extract groups from the document (provided by billing service)
  const groups = (props as any).groups || [];

  return (
    <div className="flex flex-col min-h-full bg-white text-[#111827] font-sans p-0 leading-tight select-none">
      {/* 1. BRANDING HEADER */}
      <header className="flex justify-between items-start mb-8 pb-6 border-b-2 border-blue-600">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center text-white text-4xl font-black shadow-lg">
            {settings?.companyLogo ? (
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain p-1.5 bg-white rounded-lg" />
            ) : (
              <span>W</span>
            )}
          </div>
          <div>
            <h1 className="text-[32px] font-black uppercase tracking-tighter text-slate-900 leading-none mb-1">
              {settings?.companyName || "Warrior Tech System"}
            </h1>
            <p className="text-[11px] font-black text-[#F57C00] uppercase tracking-[0.2em] italic">
              {settings?.companySlogan || "Innovative Security, Reliable Communication"}
            </p>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 mt-2">
               <span>📞 {settings?.phone}</span>
               <span>🌐 {settings?.website}</span>
            </div>
          </div>
        </div>
        <div className="text-right text-[10px] font-bold text-slate-400 space-y-1 max-w-[250px]">
          <p className="text-slate-700 leading-relaxed uppercase">{settings?.address}</p>
          <p className="text-blue-600">{settings?.email}</p>
        </div>
      </header>

      {/* 2. STATEMENT TITLE */}
      <div className="text-center mb-8">
        <div className="inline-block px-10 py-2 border-2 border-blue-600 rounded-full bg-blue-50">
           <h2 className="text-[18px] font-black uppercase tracking-[0.1em] text-blue-800">
             {title || "Monthly Maintenance Statement"}
           </h2>
        </div>
      </div>

      {/* 3. INFO MATRIX */}
      <div className="grid grid-cols-2 gap-10 mb-8 px-2">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-b border-blue-100 pb-1 w-fit pr-8">
            Customer Identification
          </h3>
          <div className="space-y-1">
            <p className="text-sm font-black uppercase text-slate-900 leading-none">{customerName || "Organization Client"}</p>
            <p className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-wrap mt-2 max-w-sm">
              {customerInfo}
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-end items-end space-y-1">
          <div className="grid grid-cols-[100px_10px_1fr] text-[11px] gap-y-0.5">
            <span className="font-bold text-slate-400 uppercase tracking-tighter">Bill Number</span> <span className="text-slate-300">:</span> <span className="font-black text-blue-900 uppercase">{docNumber}</span>
            <span className="font-bold text-slate-400 uppercase tracking-tighter">Bill Date</span> <span className="text-slate-300">:</span> <span className="font-bold text-slate-700">{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span className="font-bold text-slate-400 uppercase tracking-tighter">SLA Ref</span> <span className="text-slate-300">:</span> <span className="font-bold text-slate-700">{(props as any).agreementNo || '---'}</span>
            <span className="font-bold text-slate-400 uppercase tracking-tighter">Status</span> <span className="text-slate-300">:</span> <span className="font-black text-green-700 uppercase">Authenticated</span>
          </div>
        </div>
      </div>

      {/* 4. SERVICE MATRIX - VERTICALLY MERGED TABLE */}
      <div className="flex-1 px-1">
        <table className="w-full border-collapse border border-black table-fixed">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '45%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>
          <thead>
            <tr className="bg-[#F57C00] text-white">
              <th className="border border-black py-3 text-[10px] font-black uppercase text-center">SL</th>
              <th className="border border-black px-4 text-left text-[10px] font-black uppercase">Item / Service</th>
              <th className="border border-black px-4 text-left text-[10px] font-black uppercase">Description / Locations</th>
              <th className="border border-black px-3 text-right text-[10px] font-black uppercase">Price</th>
              <th className="border border-black px-4 text-right text-[10px] font-black uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr className="h-64"><td colSpan={5} className="text-center italic opacity-20 font-black uppercase">Service detail record not mapped</td></tr>
            ) : groups.map((group: any, gIdx: number) => (
              <React.Fragment key={group.id || gIdx}>
                {group.points.map((point: any, pIdx: number) => {
                  const globalSl = groups.slice(0, gIdx).reduce((acc: number, prevG: any) => acc + prevG.points.length, 0) + pIdx + 1;
                  return (
                    <tr key={point.id || pIdx} className={cn("border-b border-black h-[38px] transition-colors hover:bg-slate-50")}>
                      <td className="border border-black text-center text-[10px] font-bold text-slate-700">
                        {globalSl.toString().padStart(2, '0')}
                      </td>
                      <td className="border border-black px-4 text-[10px] font-black text-slate-800 text-left uppercase">
                        {pIdx === 0 ? group.serviceName : ''}
                      </td>
                      <td className="border border-black px-4 text-[10px] text-slate-600 font-bold text-left uppercase">
                        {point.location} <span className="text-slate-400 font-normal">({point.description})</span>
                      </td>
                      
                      {/* PRICE COLUMN: Rowspan applied to the first point of each group */}
                      {pIdx === 0 && (
                        <td 
                          rowSpan={group.points.length} 
                          className="border border-black px-3 text-right text-[11px] font-black text-slate-800 align-middle tabular-nums"
                        >
                          {Number(group.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      
                      {/* AMOUNT COLUMN: Rowspan applied to the first point of each group */}
                      {pIdx === 0 && (
                        <td 
                          rowSpan={group.points.length} 
                          className="border border-black px-4 text-right text-[11px] font-black text-blue-900 align-middle tabular-nums"
                        >
                          {Number(group.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            
            {/* 5. SUMMARY ROWS */}
            <tr className="bg-[#F8FAFC] font-black border-t-2 border-black">
              <td colSpan={3} className="border border-black px-5 py-3">
                 <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount in Words</p>
                    <p className="text-[11px] font-black text-blue-800 italic uppercase">
                       {amountToWords(grandTotal || 0)}
                    </p>
                 </div>
              </td>
              <td className="border border-black px-3 text-right text-[11px] uppercase tracking-wider font-black bg-blue-50 text-blue-900">
                Total (BDT)
              </td>
              <td className="border border-black px-4 text-right text-[14px] font-black text-blue-900 tabular-nums bg-blue-100 shadow-inner">
                {Number(grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. REMARKS & TERMS */}
      <div className="mt-8 space-y-4 px-2">
        <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dotted border-slate-200">
          <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Compliance & Terms</h4>
          <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap">
            {notes || "1. Monthly service charges are payable in advance by the 10th of each billing month.\n2. Equipment remains property of Warrior Tech System unless specified in agreement.\n3. Late payments may attract a penalty or service suspension.\n4. This statement is a computer-generated transaction record authenticated by the ERP terminal."}
          </p>
        </div>
      </div>

      {/* 7. SIGNATURES */}
      <div className="mt-20 mb-8 px-2">
        <div className="grid grid-cols-3 gap-12 text-center items-end">
          <div className="space-y-3">
            <div className="border-t-[1.5px] border-slate-900 pt-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Customer Acceptance</p>
          </div>
          <div className="space-y-3">
            <div className="border-t-[1.5px] border-slate-900 pt-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Finance Analyst</p>
          </div>
          <div className="text-center relative">
            {settings?.authorizedSeal && (
               <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-20 w-20 opacity-20">
                  <img src={settings.authorizedSeal} className="w-full h-full object-contain" alt="Seal" />
               </div>
            )}
            <div className="border-t-2 border-blue-600 pt-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Authorized Terminal Authorization</p>
          </div>
        </div>
      </div>

      {/* 8. FOOTER */}
      <footer className="mt-auto pt-6 pb-6 text-center border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
          Warrior Tech System &copy; {new Date().getFullYear()} • Enterprise Grade Security Solutions
        </p>
      </footer>
    </div>
  )
}
