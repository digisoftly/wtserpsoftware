"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Warrior Official Premium Layout - Fully Localized & Comprehensive Summary
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
      {/* 1. CORPORATE BRAND HEADER */}
      <div className="flex items-start justify-between px-2 pt-2 mb-2">
        <div className="flex items-center gap-6">
          <div className="w-[85px] h-[85px] shrink-0">
             {settings?.companyLogo ? (
               <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
             ) : (
               <div className="w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black">W</div>
             )}
          </div>
          
          <div className="text-left space-y-0.5">
            <h1 className="text-[38px] font-black tracking-tighter flex items-center leading-none">
              <span className="text-[#00D4AA]">WARRIOR</span>
              <span className="text-[#0056B3] ml-2">TECH</span>
              <span className="text-[#F57C00] ml-2">SYSTEM</span>
            </h1>
            <p className="text-[14px] font-bold text-[#F57C00] uppercase tracking-[0.1em] italic leading-none mt-1">
              {settings?.companySlogan || "Innovative Security, Reliable Communication"}
            </p>
            <div className="flex items-center gap-4 text-[10.5px] font-bold text-[#555555] mt-2">
              <span className="flex items-center gap-1"><span className="text-[#F57C00]">📞</span> {settings?.phone || "+8801753646372"}</span>
              <span className="flex items-center gap-1"><span className="text-[#0056B3]">📧</span> {settings?.email || "warriortechsystem@gmail.com"}</span>
            </div>
            <p className="text-[10.5px] font-bold text-[#555555] flex items-center gap-1">
              <span className="text-[#0056B3]">📍</span> {settings?.address || "GP.Ja-66/2, Gojnabi Rd, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212."}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t-[1.5px] border-red-500 border-dashed w-full mb-6" />

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

      <div className="px-0 space-y-[1px]">
        <div className="bg-[#FDEBD0] border border-black p-1.5 text-center flex items-center justify-center">
          <span className="text-[12px] font-black text-blue-800 mr-2 border-r border-black pr-2">{t('common.partA')}</span>
          <h3 className="text-[15px] font-black text-[#0056B3] uppercase tracking-tight">
            {title || "IMPLEMENTATION AND COST SUMMARY"}
          </h3>
        </div>
      </div>

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
                <td className="border-x border-black p-2 text-center text-[11px] font-normal">{formatCurrency(item.unitPrice || 0)}</td>
                <td className="border-x border-black p-2 text-right text-[11px] font-normal pr-4">{formatCurrency(item.total || 0)}</td>
              </tr>
            ))}
            {/* Filler rows for A4 height stability */}
            <tr className="h-10"><td className="border-x border-black"></td><td className="border-x border-black"></td><td className="border-x border-black"></td><td className="border-x border-black"></td><td className="border-x border-black"></td><td className="border-x border-black"></td></tr>
            
            {/* SUMMARY MATRIX */}
            <tr className="h-8">
               <td colSpan={5} className="bg-[#f8f9fa] border border-black p-1 text-right text-[11px] font-black uppercase pr-4">{t('forms.subtotal')}</td>
               <td className="border border-black p-1 text-right text-[11px] font-black pr-4">{formatCurrency(subtotal || 0)}</td>
            </tr>
            { (discount || 0) > 0 ? (
              <tr className="h-8">
                 <td colSpan={5} className="bg-red-50 border border-black p-1 text-right text-[11px] font-black uppercase pr-4 text-red-700">{t('forms.discount')}</td>
                 <td className="border border-black p-1 text-right text-[11px] font-black pr-4 text-red-700">-{formatCurrency(discount || 0)}</td>
              </tr>
            ) : null }
            { (taxAmount || 0) > 0 ? (
              <tr className="h-8">
                 <td colSpan={5} className="bg-[#f8f9fa] border border-black p-1 text-right text-[11px] font-black uppercase pr-4">{t('forms.tax')}</td>
                 <td className="border border-black p-1 text-right text-[11px] font-black pr-4">+{formatCurrency(taxAmount || 0)}</td>
              </tr>
            ) : null }
            <tr className="h-10">
               <td colSpan={5} className="bg-[#F57C00] border border-black p-1 text-right text-[12px] font-black uppercase pr-4 text-white">{t('forms.grandTotal')}</td>
               <td className="bg-[#F57C00] border border-black p-1 text-right text-[14px] font-black pr-4 text-white">{formatCurrency(grandTotal || 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="px-4 mt-6">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{t('common.amountInWords')}:</p>
        <p className="text-[11px] font-bold text-slate-800 italic border-l-2 border-slate-200 pl-3">
          {amountToWords(grandTotal || 0)}
        </p>
      </div>

      <div className="mt-auto pt-4 pb-6 text-center space-y-1.5 border-t-2 border-[#F57C00] mx-2">
        <p className="text-[11.5px] font-black text-slate-500 flex items-center justify-center gap-2">
          <span className="text-red-600">❤</span> {settings?.footerHeartMsg || "Thank You For Your Business"} <span className="text-red-600">❤</span>
        </p>
        <h4 className="text-[22px] font-black text-slate-900 uppercase tracking-tight leading-none">Warrior Tech System</h4>
      </div>
    </div>
  );
}
