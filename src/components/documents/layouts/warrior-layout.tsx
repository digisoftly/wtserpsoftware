
"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Warrior Official Premium Layout - Strictly Optimized for A4 Single Page
 * Precise vertical spacing, larger text, and wider columns.
 */
export function WarriorLayout(props: DocumentTemplateProps) {
  const { settings } = useSettings();
  const { t, formatDate, amountToWords } = useTranslation();
  const { 
    items = [], subtotal, taxAmount, discount, grandTotal, 
    notes, title, docNumber, date, 
    customerName, customerInfo, projectName, projectLocation 
  } = props;

  const renderHeader = () => (
    <div className="flex items-center gap-6 px-4 pt-0 mb-1">
      <div className="w-[80px] h-[80px] shrink-0">
        {settings?.companyLogo ? (
          <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white text-3xl font-black shadow-md">W</div>
        )}
      </div>
      <div className="flex-1 flex flex-col items-center text-center space-y-0">
        <h1 className="text-[34px] font-black tracking-tighter flex items-center justify-center leading-none">
          <span className="text-[#00D4AA]">WARRIOR</span>
          <span className="text-[#0056B3] ml-2">TECH</span>
          <span className="text-[#F57C00] ml-2">SYSTEM</span>
        </h1>
        <p className="text-[13px] font-bold text-[#F57C00] uppercase tracking-[0.15em] italic leading-none mt-1">
          {settings?.companySlogan || "Innovative Security Reliable Communication"}
        </p>
        <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-[#444444] mt-2">
          <span className="flex items-center gap-1"><span className="text-[#0056B3]">📞</span> {settings?.phone || "+8801753646372"}</span>
          <span className="flex items-center gap-1"><span className="text-[#F57C00]">📧</span> {settings?.email || "warriortechsystem@gmail.com"}</span>
          <span className="flex items-center gap-1"><span className="text-[#0056B3]">🌐</span> {settings?.website || "www.warriortechsystem.com"}</span>
        </div>
        <p className="text-[10px] font-bold text-[#444444] flex items-center justify-center gap-1 mt-1 max-w-xl leading-tight">
          <span className="text-[#0056B3]">📍</span> {settings?.address || "GP Ja-66/2 Gojnabi Rd Wireless Gate Mohakhali Gulshan Dhaka-1212"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[285mm] w-full bg-white text-[#222222] font-sans p-0 select-none border-none leading-tight document-body overflow-hidden">
      {renderHeader()}
      <div className="border-t-[1.5px] border-red-500 border-dashed w-full mb-2" />

      <div className="grid grid-cols-2 gap-10 mb-2 px-4">
        <div className="space-y-0">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 w-fit">Bill To:</p>
          <p className="text-[13px] font-black uppercase text-slate-900 mt-1">{customerName || "---"}</p>
          <div className="text-[10px] font-bold leading-snug text-slate-700 whitespace-pre-wrap max-w-[320px] mt-1">
            {customerInfo || "Address Not Available"}
          </div>
        </div>
        <div className="space-y-0 flex flex-col justify-end text-right">
          <div className="grid grid-cols-[1fr_8px_130px] text-[10px] leading-snug justify-items-end gap-y-0.5">
            <span className="font-bold uppercase text-slate-500">{t('docNo')}</span> <span className="px-0.5">:</span> <span className="font-black text-blue-800 text-left w-full">{docNumber}</span>
            <span className="font-bold uppercase text-slate-500">{t('date')}</span> <span className="px-0.5">:</span> <span className="text-left w-full font-bold">{formatDate(date)}</span>
            <span className="font-bold uppercase text-slate-500">{t('project')}</span> <span className="px-0.5">:</span> <span className="text-left w-full truncate font-bold">{projectName || "---"}</span>
            <span className="font-bold uppercase text-slate-500">{t('location')}</span> <span className="px-0.5">:</span> <span className="text-left w-full truncate font-bold">{projectLocation || "---"}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#FDEBD0] border-y-[0.5mm] border-black py-1 text-center mb-3 mx-4">
        <h3 className="text-[14px] font-black text-[#0056B3] uppercase tracking-widest">
          {title || "IMPLEMENTATION AND COST SUMMARY"}
        </h3>
      </div>

      <div className="flex-1 px-4">
        <table className="w-full border-collapse border-[0.5mm] border-black table-fixed">
          <colgroup><col style={{width:'5%'}}/><col style={{width:'50%'}}/><col style={{width:'10%'}}/><col style={{width:'17%'}}/><col style={{width:'18%'}}/></colgroup>
          <thead>
            <tr className="bg-[#F57C00] text-white h-7">
              <th className="border border-black text-[9px] font-black uppercase text-center">{settings?.pdfTable_sl || t('sl')}</th>
              <th className="border border-black px-2 text-left text-[9px] font-black uppercase">{settings?.pdfTable_item || t('itemName')}</th>
              <th className="border border-black text-center text-[9px] font-black uppercase">{settings?.pdfTable_qty || t('qty')}</th>
              <th className="border border-black text-center text-[9px] font-black uppercase">{settings?.pdfTable_unitPrice || t('price')}</th>
              <th className="border border-black text-right text-[9px] font-black uppercase pr-2">{settings?.pdfTable_amount || t('total')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-black align-top min-h-[30px]">
                <td className="border-x border-black p-1 text-center text-[10px] font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                <td className="border-x border-black p-2">
                  <div className="text-[11px] space-y-0.5 leading-tight">
                    <p className="font-black text-slate-900 uppercase">{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 italic">
                      {item.brand && `Brand: ${item.brand}`} {item.model && `| Model: ${item.model}`}
                    </p>
                    {item.sn && <p className="text-[9.5px] font-black text-blue-700 uppercase tracking-tighter">S/N: {item.sn}</p>}
                  </div>
                </td>
                <td className="border-x border-black p-1 text-center text-[10px] font-bold">{item.quantity} {item.unit || 'Pcs'}</td>
                <td className="border-x border-black p-1 text-center text-[10px] font-bold tabular-nums">{(item.unitPrice || 0).toLocaleString()}</td>
                <td className="border-x border-black p-1 text-right text-[11px] font-black tabular-nums pr-2">{(item.total || 0).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="h-6">
              <td colSpan={4} className="bg-[#f8f9fa] border border-black p-1 text-right text-[9.5px] font-black uppercase pr-2">Subtotal</td>
              <td className="border border-black p-1 text-right text-[11px] font-black pr-2 tabular-nums">{(subtotal || 0).toLocaleString()}</td>
            </tr>
            {discount > 0 && (
              <tr className="h-6">
                <td colSpan={4} className="bg-red-50 border border-black p-1 text-right text-[9.5px] font-black uppercase pr-2 text-red-700">Discount Applied</td>
                <td className="border border-black p-1 text-right text-[11px] font-black pr-2 text-red-700 tabular-nums">{(discount || 0).toLocaleString()}</td>
              </tr>
            )}
            <tr className="h-6">
              <td colSpan={4} className="bg-[#f8f9fa] border border-black p-1 text-right text-[9.5px] font-black uppercase pr-2">VAT (15%)</td>
              <td className="border border-black p-1 text-right text-[11px] font-black pr-2 tabular-nums">{(taxAmount || 0).toLocaleString()}</td>
            </tr>
            <tr className="h-9 bg-[#F57C00] text-white">
              <td colSpan={4} className="border border-black p-1 text-right text-[11px] font-black uppercase pr-2">Net Payable Amount</td>
              <td className="border border-black p-1 text-right text-[16px] font-black pr-2 tabular-nums">{(grandTotal || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="px-4 mt-2">
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Amount in Words:</p>
        <p className="text-[11px] font-black text-slate-800 italic uppercase border-l-4 border-blue-600 pl-3 py-1 bg-slate-50/50">
          {amountToWords(grandTotal || 0)}
        </p>
      </div>

      <div className="px-4 mt-3 grid grid-cols-2 gap-8">
        <div className="space-y-0">
          <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Standard Terms & Conditions</h4>
          <div className="text-[10px] text-slate-500 font-bold leading-tight whitespace-pre-wrap border border-slate-100 p-2 rounded-xl bg-slate-50/50">
            {settings?.pdfTerms || "1. Ownership of equipment remains with Warrior Tech System until full payment is received.\n2. Warranty covers manufacturing defects only; burn, physical or liquid damage is excluded.\n3. Any modifications after site installation will be charged separately."}
          </div>
        </div>
        {notes && (
          <div className="bg-blue-50/30 p-2 rounded-xl border-l-4 border-blue-600 h-fit">
             <p className="text-[9px] font-black text-blue-600 uppercase mb-1 tracking-widest">Remarks</p>
             <p className="text-[10px] font-bold text-slate-700 leading-snug">{notes}</p>
          </div>
        )}
      </div>

      <div className="mt-auto pt-2 pb-4 text-center border-t-[1.5px] border-[#F57C00] mx-4">
        <div className="grid grid-cols-4 gap-4 px-4 pt-10 mb-2 relative">
          <div className="text-center border-t border-black pt-1 text-[9px] font-black uppercase">Customer Signature</div>
          <div className="text-center border-t border-black pt-1 text-[9px] font-black uppercase">Prepared By</div>
          <div className="text-center border-t border-black pt-1 text-[9px] font-black uppercase">Checked By</div>
          <div className="text-center relative">
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 h-16 w-36">
               {settings?.authorizedSignature && <img src={settings.authorizedSignature} className="h-full w-full object-contain" alt="Signature" />}
            </div>
            <div className="border-t-2 border-blue-700 pt-1 text-[11px] font-black uppercase text-blue-800">Authorized Signature</div>
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-500 flex items-center justify-center gap-2">
          <span className="text-red-600">❤</span> {settings?.footerHeartMsg || "Thank You For Your Business"} <span className="text-red-600">❤</span>
        </p>
        <h4 className="text-[20px] font-black text-slate-900 uppercase tracking-tight leading-none mt-1">{settings?.companyName || "Warrior Tech System"}</h4>
      </div>
    </div>
  );
}
