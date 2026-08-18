"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Warrior Official Premium Layout - Centered Corporate Edition
 */
export function WarriorLayout({
  title,
  docNumber,
  date,
  customerName,
  customerInfo,
  projectName,
  projectLocation,
  items,
  subtotal,
  taxAmount,
  discount,
  grandTotal,
  notes,
}: DocumentTemplateProps) {
  const { settings } = useSettings();
  const { t, formatCurrency, formatDate, amountToWords } = useTranslation();

  return (
    <div className="flex flex-col min-h-full bg-white text-[#222222] font-sans p-0 select-none border-none leading-tight document-body">
      {/* 1. CORPORATE BRAND HEADER - FULLY CENTERED */}
      <div className="flex flex-col items-center text-center px-4 pt-4 mb-4">
        {/* Logo */}
        <div className="w-[90px] h-[90px] mb-4">
           {settings?.companyLogo ? (
             <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
           ) : (
             <div className="w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center text-white text-5xl font-black shadow-lg">W</div>
           )}
        </div>
        
        {/* Company Identity */}
        <div className="space-y-1">
          <h1 className="text-[42px] font-black tracking-tighter flex items-center justify-center leading-none">
            <span className="text-[#00D4AA]">WARRIOR</span>
            <span className="text-[#0056B3] ml-2">TECH</span>
            <span className="text-[#F57C00] ml-2">SYSTEM</span>
          </h1>
          <p className="text-[16px] font-bold text-[#F57C00] uppercase tracking-[0.2em] italic leading-none mt-1">
            {settings?.companySlogan || "Innovative Security, Reliable Communication"}
          </p>
          
          {/* Contact Details Grid */}
          <div className="flex items-center justify-center gap-8 text-[11px] font-bold text-[#444444] mt-3">
            <span className="flex items-center gap-2">
              <span className="text-[#F57C00]">📞</span> {settings?.phone || "+8801753646372"}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[#0056B3]">📧</span> {settings?.email || "warriortechsystem@gmail.com"}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[#0056B3]">🌐</span> {settings?.website || "www.warriortechsystem.com"}
            </span>
          </div>
          
          {/* Address */}
          <p className="text-[11px] font-bold text-[#444444] flex items-center justify-center gap-2 mt-1 max-w-2xl">
            <span className="text-[#0056B3]">📍</span> {settings?.address || "GP.Ja-66/2, Gojnabi Rd, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212."}
          </p>
        </div>
      </div>

      {/* 2. SIGNATURE RED DASHED LINE */}
      <div className="border-t-[1.5px] border-red-500 border-dashed w-full mb-8" />

      {/* 3. INFORMATION MATRIX */}
      <div className="grid grid-cols-2 gap-10 mb-6 px-4">
        <div className="space-y-1">
          <p className="text-[12px] font-bold">{t('common.view')},</p>
          <p className="text-[13px] font-black uppercase">{customerName || "---"}</p>
          <div className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
            {customerInfo || "Address Not Available"}
          </div>
        </div>
        <div className="space-y-1 flex flex-col justify-end">
          <div className="grid grid-cols-[120px_10px_1fr] text-[11px] leading-relaxed">
            <span className="font-bold uppercase">{t('common.docNo')}</span> <span>:</span> <span className="font-black text-blue-800">{docNumber}</span>
            <span className="font-bold uppercase">{t('common.date')}</span> <span>:</span> <span>{formatDate(date)}</span>
            <span className="font-bold uppercase">{t('forms.project')}</span> <span>:</span> <span>{projectName || "---"}</span>
            <span className="font-bold uppercase">{t('forms.location')}</span> <span>:</span> <span>{projectLocation || "---"}</span>
          </div>
        </div>
      </div>

      {/* 4. SECTION BANNER */}
      <div className="px-0 space-y-[1px]">
        <div className="bg-[#FDEBD0] border border-black p-1.5 text-center flex items-center justify-center">
          <span className="text-[12px] font-black text-blue-800 mr-2 border-r border-black pr-2">{t('common.partA')}</span>
          <h3 className="text-[15px] font-black text-[#0056B3] uppercase tracking-tight">
            {title || "IMPLEMENTATION AND COST SUMMARY"}
          </h3>
        </div>
      </div>

      {/* 5. PRODUCT TABLE */}
      <div className="px-0 flex-1 mt-[1px]">
        <table className="w-full border-collapse border border-black table-fixed">
          <thead>
            <tr className="bg-[#F57C00] text-white h-10">
              <th className="border border-black w-[45px] text-[10px] font-black uppercase">{t('forms.sl')}</th>
              <th className="border border-black px-4 text-left text-[10px] font-black uppercase">{t('forms.itemName')}</th>
              <th className="border border-black w-[100px] text-center text-[10px] font-black uppercase">{t('forms.brand')}</th>
              <th className="border border-black w-[80px] text-center text-[10px] font-black uppercase">{t('forms.qty')}</th>
              <th className="border border-black w-[100px] text-center text-[10px] font-black uppercase">{t('forms.price')}</th>
              <th className="border border-black w-[120px] text-right text-[10px] font-black uppercase pr-4">{t('common.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((item, idx) => (
              <tr key={idx} className="border-b border-black align-top">
                <td className="border-x border-black p-2 text-center text-[11px] font-bold">{(idx + 1).toString().padStart(2, '0')}</td>
                <td className="border-x border-black p-2">
                  <div className="text-[11px] space-y-1 leading-normal">
                    <p className="font-bold text-slate-900 uppercase">{item.name}</p>
                    { item.brand && <p className="text-[10px] font-normal text-slate-700">{t('forms.brand')}: <span className="font-bold">{item.brand}</span></p> }
                    { item.model && <p className="text-[10px] font-normal text-slate-700">{t('forms.model')}: <span className="font-bold">{item.model}</span></p> }
                    { item.sn && <p className="text-[10px] font-normal text-slate-700 mt-1">{t('forms.sn')}: <span className="font-black text-blue-700">{item.sn}</span></p> }
                    { item.warranty && <p className="text-[10px] font-normal text-slate-700 mt-1"><span className="font-bold">{t('forms.warranty')}:</span> {item.warranty}</p> }
                    { item.specs && <p className="text-[9px] font-normal text-slate-500 mt-1 italic whitespace-pre-wrap">{item.specs}</p> }
                  </div>
                </td>
                <td className="border-x border-black p-2 text-center text-[11px] font-normal uppercase">{item.brand || '---'}</td>
                <td className="border-x border-black p-2 text-center text-[11px] font-normal">{(item.quantity || 0)} ({item.unit || 'Pcs'})</td>
                <td className="border-x border-black p-2 text-center text-[11px] font-normal">{(item.unitPrice || 0).toLocaleString()}</td>
                <td className="border-x border-black p-2 text-right text-[11px] font-normal pr-4">{(item.total || 0).toLocaleString()}</td>
              </tr>
            ))}
            {/* Filler for layout height stability */}
            <tr className="h-12">
               <td className="border-x border-black"></td>
               <td className="border-x border-black"></td>
               <td className="border-x border-black"></td>
               <td className="border-x border-black"></td>
               <td className="border-x border-black"></td>
               <td className="border-x border-black"></td>
            </tr>
            
            {/* SUMMARY MATRIX */}
            <tr className="h-8">
               <td colSpan={5} className="bg-[#f8f9fa] border border-black p-1 text-right text-[11px] font-black uppercase pr-4">{t('forms.subtotal')}</td>
               <td className="border border-black p-1 text-right text-[11px] font-black pr-4">{(subtotal || 0).toLocaleString()}</td>
            </tr>
            { (discount || 0) > 0 ? (
              <tr className="h-8">
                 <td colSpan={5} className="bg-red-50 border border-black p-1 text-right text-[11px] font-black uppercase pr-4 text-red-700">{t('forms.discount')}</td>
                 <td className="border border-black p-1 text-right text-[11px] font-black pr-4 text-red-700">-{(discount || 0).toLocaleString()}</td>
              </tr>
            ) : null }
            { (taxAmount || 0) > 0 ? (
              <tr className="h-8">
                 <td colSpan={5} className="bg-[#f8f9fa] border border-black p-1 text-right text-[11px] font-black uppercase pr-4">{t('forms.tax')}</td>
                 <td className="border border-black p-1 text-right text-[11px] font-black pr-4">+{(taxAmount || 0).toLocaleString()}</td>
              </tr>
            ) : null }
            <tr className="h-10">
               <td colSpan={5} className="bg-[#F57C00] border border-black p-1 text-right text-[12px] font-black uppercase pr-4 text-white">{t('forms.grandTotal')}</td>
               <td className="bg-[#F57C00] border border-black p-1 text-right text-[14px] font-black pr-4 text-white">{(grandTotal || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. IN WORD AMOUNT */}
      <div className="px-4 mt-6">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{t('common.amountInWords')}:</p>
        <p className="text-[11px] font-bold text-slate-800 italic border-l-2 border-slate-200 pl-3">
          {amountToWords(grandTotal || 0)}
        </p>
      </div>

      {/* 7. CORPORATE FOOTER & SIGNATURES */}
      <div className="mt-auto pt-4 pb-6 text-center space-y-2 border-t-2 border-[#F57C00] mx-2">
        {/* Signatures */}
        <div className="grid grid-cols-4 gap-4 px-4 pt-12 mb-8">
           <div className="text-center">
              <div className="border-t border-black pt-1 text-[9px] font-black uppercase">Customer Signature</div>
           </div>
           <div className="text-center">
              <div className="border-t border-black pt-1 text-[9px] font-black uppercase">Prepared By</div>
           </div>
           <div className="text-center">
              <div className="border-t border-black pt-1 text-[9px] font-black uppercase">Checked By</div>
           </div>
           <div className="text-center relative">
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-20 rotate-12">
                 <div className="w-16 h-16 border-2 border-blue-600 rounded-full flex items-center justify-center text-[8px] font-black text-blue-600 uppercase text-center">
                   Proprietor<br/>WTS
                 </div>
              </div>
              <div className="border-t-2 border-blue-700 pt-1 text-[10px] font-black uppercase text-blue-800">Authorized Signature</div>
           </div>
        </div>

        <p className="text-[11.5px] font-black text-slate-500 flex items-center justify-center gap-2">
          <span className="text-red-600">❤</span> {settings?.footerHeartMsg || "Thank You For Your Business"} <span className="text-red-600">❤</span>
        </p>
        <h4 className="text-[24px] font-black text-slate-900 uppercase tracking-tight leading-none">Warrior Tech System</h4>
        <div className="flex justify-center gap-6 text-[9px] font-black text-blue-700 uppercase tracking-widest mt-2">
           <span>• Security System</span>
           <span>• Communication System</span>
           <span>• Fire Safety</span>
           <span>• Network & IT Solutions</span>
        </div>
      </div>
    </div>
  );
}
