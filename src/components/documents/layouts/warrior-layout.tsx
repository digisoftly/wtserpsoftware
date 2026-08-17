
"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Warrior Official Premium Layout
 * A pixel-perfect digital replica of the official Warrior Tech System A4 document.
 * Optimized for professional A4 portrait printing and PDF export.
 */
export function WarriorLayout({
  title,
  docNumber,
  date,
  customerName,
  customerInfo,
  items,
  subtotal,
  taxAmount,
  discount,
  grandTotal,
  status,
  notes,
}: DocumentTemplateProps) {
  const { settings } = useSettings();
  const currencySymbol = "৳";

  // Dynamic Content Fetching from Settings
  const docMainHeadline = settings?.docMainHeadline || "PRODUCT PURCHASE COST SUMMARY";
  const docSubHeadline = settings?.docSubHeadline || "BUDGETED PROPOSAL ON NETWORK SOLUTION AND CCTV.";
  const docInWordLabel = settings?.docInWordLabel || "In Word Amount:";
  
  const footerService1 = settings?.footerService1 || "Security System";
  const footerService2 = settings?.footerService2 || "Communication System";
  const footerService3 = settings?.footerService3 || "Fire Safety";
  const footerService4 = settings?.footerService4 || "Network & IT Solutions";

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
              <span className="flex items-center gap-1"><span className="text-[#F57C00]">🌐</span> {settings?.website || "www.warriortechsystem.com"}</span>
            </div>
            <p className="text-[10.5px] font-bold text-[#555555] flex items-center gap-1">
              <span className="text-[#0056B3]">📍</span> {settings?.address || "GP.Ja-66/2, Gojnabi Rd, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. IDENTITY DIVIDER */}
      <div className="border-t-[1.5px] border-red-500 border-dashed w-full mb-6" />

      {/* 3. INFORMATION MATRIX */}
      <div className="grid grid-cols-2 gap-10 mb-6 px-4">
        <div className="space-y-1">
          <p className="text-[12px] font-bold">To,</p>
          <p className="text-[13px] font-black uppercase">{customerName || "---"}</p>
          <div className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
            {customerInfo || "Address Not Available"}
          </div>
          <div className="grid grid-cols-[80px_10px_1fr] text-[11px] pt-1">
            <span className="font-bold">Mobile No</span> <span>:</span> <span className="font-bold">---</span>
            <span className="font-bold">E-mail</span> <span>:</span> <span>---</span>
          </div>
        </div>
        <div className="space-y-1 flex flex-col justify-end">
          <div className="grid grid-cols-[120px_10px_1fr] text-[11px] leading-relaxed">
            <span className="font-bold uppercase">Invoice No</span> <span>:</span> <span className="font-black text-blue-800">{docNumber}</span>
            <span className="font-bold uppercase">Invoice Date</span> <span>:</span> <span>{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            <span className="font-bold uppercase">Project Name</span> <span>:</span> <span>---</span>
            <span className="font-bold uppercase">Project Location</span> <span>:</span> <span>---</span>
          </div>
        </div>
      </div>

      {/* 4. IMPLEMENTATION BANNERS */}
      <div className="px-0 space-y-[1px]">
        <div className="bg-[#FDEBD0] border border-black p-1.5 text-center flex items-center justify-center">
          <span className="text-[12px] font-black text-blue-800 mr-2 border-r border-black pr-2">Part-A</span>
          <h3 className="text-[15px] font-black text-[#0056B3] uppercase tracking-tight">
            {docMainHeadline}
          </h3>
        </div>
      </div>

      {/* 5. MAIN IMPLEMENTATION TABLE */}
      <div className="px-0 flex-1 mt-[1px]">
        <table className="w-full border-collapse border border-black table-fixed">
          <thead>
            <tr className="bg-[#F57C00] text-white h-10">
              <th className="border border-black w-[45px] text-[10px] font-black uppercase">Sl.</th>
              <th className="border border-black px-4 text-left text-[10px] font-black uppercase">Item Name & Description</th>
              <th className="border border-black w-[100px] text-center text-[10px] font-black uppercase">Brand</th>
              <th className="border border-black w-[80px] text-center text-[10px] font-black uppercase">Quantity</th>
              <th className="border border-black w-[100px] text-center text-[10px] font-black uppercase">Unite Price</th>
              <th className="border border-black w-[120px] text-right text-[10px] font-black uppercase pr-4">Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-black align-top min-h-[150px]">
                <td className="border-x border-black p-2 text-center text-[11px] font-bold">{(idx + 1).toString().padStart(2, '0')}</td>
                <td className="border-x border-black p-2">
                  <div className="text-[11px] space-y-1 leading-normal">
                    <p className="font-normal text-slate-800">{item.name}</p>
                    {item.description && <p className="text-[10px] font-normal text-slate-600">{item.description}</p>}
                    <p className="text-[10px] font-normal text-slate-700">Model: (None Bold Text)</p>
                    <p className="text-[10px] font-normal text-slate-700">Brand: (None Bold Text)</p>
                    <p className="text-[10px] font-normal text-slate-700 mt-2">S/N No (If Need): (None Bold Text)</p>
                    <p className="text-[10px] font-normal text-slate-700 mt-2"><span className="font-bold">Specification:</span> (None Bold Text)</p>
                    <p className="text-[10px] font-normal text-slate-700 mt-2"><span className="font-bold">Warranty:</span> (None Bold Text)</p>
                  </div>
                </td>
                <td className="border-x border-black p-2 text-center text-[11px] font-normal">---</td>
                <td className="border-x border-black p-2 text-center text-[11px] font-normal">{item.quantity}</td>
                <td className="border-x border-black p-2 text-center text-[11px] font-normal">{(item.unitPrice || 0).toLocaleString()}</td>
                <td className="border-x border-black p-2 text-right text-[11px] font-normal pr-4">{(item.total || 0).toLocaleString()}</td>
              </tr>
            ))}
            
            {/* 6. INTEGRATED CALCULATION FOOTER */}
            <tr className="h-8">
               <td colSpan={5} className="bg-[#D6EAF8]/50 border border-black p-1 text-right text-[11px] font-black uppercase pr-4">Subtotal</td>
               <td className="border border-black p-1 text-right text-[11px] font-black pr-4">{(subtotal || 0).toLocaleString()}</td>
            </tr>
            <tr className="h-8">
               <td colSpan={5} className="bg-[#FDEBD0] border border-black p-1 text-right text-[11px] font-black uppercase pr-4">Discount</td>
               <td className="border border-black p-1 text-right text-[11px] font-black pr-4">{(discount || 0).toLocaleString()}</td>
            </tr>
            <tr className="h-8">
               <td colSpan={5} className="bg-[#D6EAF8] border border-black p-1 text-right text-[11px] font-black uppercase pr-4">VAT</td>
               <td className="border border-black p-1 text-right text-[11px] font-black pr-4">{(taxAmount || 0).toLocaleString()}</td>
            </tr>
            <tr className="h-10">
               <td colSpan={5} className="bg-[#F57C00] border border-black p-1 text-right text-[12px] font-black uppercase pr-4 text-white">Grand Total</td>
               <td className="bg-[#F57C00] border border-black p-1 text-right text-[14px] font-black pr-4 text-white">{(grandTotal || 0).toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={6} className="p-3 align-top border border-black bg-white min-h-[40px]">
                  <p className="text-[12px] font-black uppercase tracking-tight">{docInWordLabel} <span className="font-normal capitalize ml-2 italic text-slate-500">Only --- BDT</span></p>
               </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 7. SIGNATURES & VALIDATION */}
      <div className="mt-20 mb-8 px-2">
        <div className="grid grid-cols-4 gap-4 items-end text-center">
          <div className="space-y-3">
            <div className="border-t border-black w-full" />
            <p className="text-[11px] font-bold uppercase tracking-tight">Customer Signature</p>
          </div>
          <div className="space-y-3">
            <div className="border-t border-black w-full" />
            <p className="text-[11px] font-bold uppercase tracking-tight">Prepared By</p>
          </div>
          <div className="space-y-3">
            <div className="border-t border-black w-full" />
            <p className="text-[11px] font-bold uppercase tracking-tight">Checked By</p>
          </div>
          <div className="space-y-3 relative">
            {/* PROPRIETOR SEAL SIMULATION */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-40 pointer-events-none flex flex-col items-center">
               <p className="text-[9px] font-black text-slate-900 leading-none">Warrior Tech System</p>
               <div className="w-14 h-14 rounded-full border-[1.5px] border-slate-700 flex items-center justify-center rotate-[15deg] mt-1 shadow-inner">
                  <span className="text-[8px] font-black text-slate-800 text-center uppercase leading-none px-1">Proprietor<br/>WTS</span>
               </div>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Warrior Tech System</p>
            <div className="border-t-2 border-black w-full" />
            <p className="text-[11px] font-black uppercase tracking-tighter text-[#0056B3]">Authorized Signature</p>
          </div>
        </div>
      </div>

      {/* 8. CORPORATE SERVICE FOOTER */}
      <div className="mt-auto pt-4 pb-6 text-center space-y-1.5 border-t-2 border-[#F57C00] mx-2">
        <p className="text-[11.5px] font-black text-slate-500 flex items-center justify-center gap-2">
          <span className="text-red-600">❤</span> Thank You For Your Business <span className="text-red-600">❤</span>
        </p>
        <h4 className="text-[22px] font-black text-slate-900 uppercase tracking-tight leading-none">Warrior Tech System</h4>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em]">
          {settings?.companySlogan || "Innovative Security, Reliable Communication"}
        </p>
        
        <div className="flex justify-center items-center gap-6 text-[9.5px] font-black text-[#0056B3] uppercase tracking-wider pt-2">
           <span className="flex items-center gap-1.5"><span className="text-[#F57C00] text-[15px] leading-none">•</span> {footerService1}</span>
           <span className="flex items-center gap-1.5"><span className="text-[#F57C00] text-[15px] leading-none">•</span> {footerService2}</span>
           <span className="flex items-center gap-1.5"><span className="text-[#F57C00] text-[15px] leading-none">•</span> {footerService3}</span>
           <span className="flex items-center gap-1.5"><span className="text-[#F57C00] text-[15px] leading-none">•</span> {footerService4}</span>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .document-container { padding: 0 !important; margin: 0 !important; width: 210mm !important; min-height: 297mm !important; box-shadow: none !important; }
          @page { size: A4; margin: 10mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; border-color: black !important; }
        }
      `}</style>
    </div>
  );
}
