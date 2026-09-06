"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Warrior Official Premium Layout - Optimized for strict A4 single page at 100% scale.
 * Features an absolute bottom-anchored footer for pad-style accuracy.
 */
export function WarriorLayout(props: DocumentTemplateProps) {
  const { settings } = useSettings();
  const { t, formatDate, amountToWords } = useTranslation();
  const { 
    items = [], subtotal, taxAmount, discount, grandTotal, 
    notes, title, docNumber, date, 
    customerName, customerInfo, projectName, projectLocation, paidAmount, balanceDue
  } = props;

  const renderHeader = () => (
    <div className="flex items-center gap-6 pt-0 mb-4 w-full">
      <div className="w-[85px] h-[85px] shrink-0">
        {settings?.companyLogo ? (
          <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-md">W</div>
        )}
      </div>
      <div className="flex-1 flex flex-col items-center text-center space-y-0.5 overflow-hidden">
        <h1 className="text-[38px] font-black tracking-tighter flex items-center justify-center leading-none">
          <span className="text-[#00D4AA]">WARRIOR</span>
          <span className="text-[#0056B3] ml-2">TECH</span>
          <span className="text-[#F57C00] ml-2">SYSTEM</span>
        </h1>
        <p className="text-[14px] font-bold text-[#F57C00] uppercase tracking-[0.2em] italic leading-none mt-1">
          {settings?.companySlogan || "Innovative Security Reliable Communication"}
        </p>
        <div className="flex items-center justify-center gap-6 text-[10.5px] font-bold text-[#333333] mt-2 flex-wrap">
          <span><span className="text-[#0056B3]">📞</span> {settings?.phone || "+8801753646372"}</span>
          <span><span className="text-[#F57C00]">📧</span> {settings?.email || "warriortechsystem@gmail.com"}</span>
          <span><span className="text-[#0056B3]">🌐</span> {settings?.website || "www.warriortechsystem.com"}</span>
        </div>
        <p className="text-[10.5px] font-bold text-[#333333] flex items-center justify-center gap-1 mt-1 max-w-full leading-none truncate">
          <span className="text-[#0056B3]">📍</span> {settings?.address || "GP Ja-66/2 Gojnabi Rd Wireless Gate Mohakhali Gulshan Dhaka-1212"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative h-full w-full bg-white text-[#111111] font-sans p-0 select-none border-none leading-tight flex flex-col">
      <div className="flex-1">
        {renderHeader()}
        <div className="border-t-[1.5px] border-red-500 border-dashed w-full mb-4" />

        <div className="grid grid-cols-2 gap-10 mb-6 px-1 w-full">
          <div className="space-y-0.5 overflow-hidden">
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 w-fit">Bill To:</p>
            <p className="text-[15px] font-black uppercase text-slate-900 mt-2 truncate">{customerName || "---"}</p>
            <div className="text-[11px] font-medium leading-snug text-slate-700 whitespace-pre-wrap max-w-full line-clamp-2 mt-1">
              {customerInfo || "Address Not Available"}
            </div>
          </div>
          <div className="space-y-0.5 flex flex-col justify-end text-right">
            <div className="grid grid-cols-[1fr_8px_130px] text-[10.5px] leading-snug justify-items-end gap-y-1">
              <span className="font-bold uppercase text-slate-500">{t('docNo')}</span> <span>:</span> <span className="font-black text-blue-800 text-left w-full truncate">{docNumber}</span>
              <span className="font-bold uppercase text-slate-500">{t('date')}</span> <span>:</span> <span className="text-left w-full font-bold">{formatDate(date)}</span>
              <span className="font-bold uppercase text-slate-500">{t('project')}</span> <span>:</span> <span className="text-left w-full truncate font-bold uppercase">{projectName || "General Service"}</span>
              <span className="font-bold uppercase text-slate-500">Status</span> <span>:</span> <span className="text-left w-full font-black uppercase text-blue-600">{props.status || "Authenticated"}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#FDEBD0] border-y-[0.3mm] border-black py-2 text-center mb-6 mx-1">
          <h3 className="text-[18px] font-black text-[#0056B3] uppercase tracking-[0.2em] leading-none">
            {title || "OFFICIAL TRANSACTION DOCUMENT"}
          </h3>
        </div>

        <div className="px-1 w-full mb-6">
          <table className="w-full border-collapse border-[0.3mm] border-black table-fixed">
            <colgroup><col style={{width:'5%'}}/><col style={{width:'45%'}}/><col style={{width:'10%'}}/><col style={{width:'20%'}}/><col style={{width:'20%'}}/></colgroup>
            <thead>
              <tr className="bg-[#F57C00] text-white h-8">
                <th className="border border-black text-[10px] font-black uppercase text-center">{settings?.pdfTable_sl || t('sl')}</th>
                <th className="border border-black px-2 text-left text-[10px] font-black uppercase">{settings?.pdfTable_item || t('itemName')}</th>
                <th className="border border-black text-center text-[10px] font-black uppercase">{settings?.pdfTable_qty || t('qty')}</th>
                <th className="border border-black text-center text-[10px] font-black uppercase">{settings?.pdfTable_unitPrice || t('price')}</th>
                <th className="border border-black text-right text-[10px] font-black uppercase pr-2">{settings?.pdfTable_amount || t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-black align-top min-h-[32px]">
                  <td className="border-x border-black p-1 text-center text-[11px] font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="border-x border-black p-2">
                    <div className="text-[11px] space-y-1 leading-tight overflow-hidden">
                      <p className="font-black text-slate-900 uppercase truncate">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 italic truncate">
                        {item.brand && `Brand: ${item.brand}`} {item.model && `| Model: ${item.model}`}
                      </p>
                      {item.sn && <p className="text-[9px] font-black text-blue-700 uppercase tracking-tighter">S/N: {item.sn}</p>}
                    </div>
                  </td>
                  <td className="border-x border-black p-1 text-center text-[11px] font-bold">{item.quantity} {item.unit || 'Pcs'}</td>
                  <td className="border-x border-black p-1 text-center text-[11px] font-bold tabular-nums">{(item.unitPrice || 0).toLocaleString()}</td>
                  <td className="border-x border-black p-1 text-right text-[11px] font-black tabular-nums pr-2">{(item.total || 0).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="h-8 bg-[#f8f9fa]">
                <td colSpan={4} className="border border-black p-1 text-right text-[10px] font-black uppercase pr-2">Subtotal</td>
                <td className="border border-black p-1 text-right text-[12px] font-black pr-2 tabular-nums">{(subtotal || 0).toLocaleString()}</td>
              </tr>
              {discount > 0 && (
                <tr className="h-8">
                  <td colSpan={4} className="bg-red-50 border border-black p-1 text-right text-[10px] font-black uppercase pr-2 text-red-700">Adjustment</td>
                  <td className="border border-black p-1 text-right text-[12px] font-black pr-2 text-red-700 tabular-nums">{(discount || 0).toLocaleString()}</td>
                </tr>
              )}
              <tr className="h-8 bg-[#f8f9fa]">
                <td colSpan={4} className="border border-black p-1 text-right text-[10px] font-black uppercase pr-2">VAT (15%)</td>
                <td className="border border-black p-1 text-right text-[12px] font-black pr-2 tabular-nums">{(taxAmount || 0).toLocaleString()}</td>
              </tr>
              <tr className="h-12 bg-[#F57C00] text-white">
                <td colSpan={4} className="border border-black p-1 text-right text-[12px] font-black uppercase pr-3">Grand Total Payable</td>
                <td className="border border-black p-1 text-right text-[18px] font-black pr-3 tabular-nums">{(grandTotal || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-1 space-y-4">
          <div className="w-full">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Terms & Conditions</h4>
            <div className="text-[11px] text-slate-600 font-bold leading-relaxed whitespace-pre-wrap border border-slate-100 p-4 rounded-2xl bg-slate-50/50 w-full">
              {settings?.pdfTerms || "1. Ownership of equipment remains with WTS until full payment.\n2. Warranty covers manufacturing defects only; physical/burn damage excluded.\n3. Goods once sold are not returnable without valid cause."}
            </div>
          </div>
          
          {notes && (
            <div className="bg-blue-50/30 p-3 rounded-2xl border-l-4 border-blue-600 w-full">
               <p className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Administrative Remarks</p>
               <p className="text-[11px] font-bold text-slate-800 leading-snug">{notes}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-8 pt-20 relative pb-4 w-full">
            <div className="text-center border-t border-black pt-1.5 text-[10px] font-black uppercase">Customer Signature</div>
            <div className="text-center border-t border-black pt-1.5 text-[10px] font-black uppercase">Prepared By</div>
            <div className="text-center border-t border-black pt-1.5 text-[10px] font-black uppercase">Checked By</div>
            <div className="text-center relative">
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 h-14 w-32">
                 {settings?.authorizedSignature && <img src={settings.authorizedSignature} className="h-full w-full object-contain" alt="Signature" />}
              </div>
              <div className="border-t-2 border-blue-700 pt-1.5 text-[11px] font-black uppercase text-blue-800">Authorized Signature</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pt-2 pb-6 text-center border-t-[2mm] border-[#F57C00] bg-white">
        <p className="text-[12px] font-black text-slate-500 flex items-center justify-center gap-3">
          <span className="text-red-600 text-lg">❤</span> {settings?.footerHeartMsg || "Thank You For Your Business"} <span className="text-red-600 text-lg">❤</span>
        </p>
        <h4 className="text-[26px] font-black text-slate-900 uppercase tracking-tight leading-none mt-1">{settings?.companyName || "Warrior Tech System"}</h4>
        <div className="flex justify-center gap-8 text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] mt-2">
          <span>• Security System</span>
          <span>• Communication</span>
          <span>• Fire Safety</span>
          <span>• Network Solution</span>
        </div>
      </div>
    </div>
  );
}