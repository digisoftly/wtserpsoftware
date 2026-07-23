
"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Warrior Official Premium Layout
 * A pixel-perfect digital replica of the official Warrior Tech System A4 document.
 * Optimized for professional A4 portrait printing and PDF export.
 * Dynamically managed by Admin settings.
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

  // Dynamic Content Fetching
  const docMainHeadline = settings?.docMainHeadline || "IMPLEMENTATION AND COST SUMMARY";
  const docSubHeadline = settings?.docSubHeadline || "BUDGETED PROPOSAL ON NETWORK SOLUTION AND CCTV.";
  const docInWordLabel = settings?.docInWordLabel || "In Word Amount:";
  
  const tableCol_sl = settings?.tableCol_sl || "Sl. No";
  const tableCol_desc = settings?.tableCol_desc || "Product Name and Description";
  const tableCol_qty = settings?.tableCol_qty || "Qty (Unit)";
  const tableCol_price = settings?.tableCol_price || "Unit Price";
  const tableCol_disc = settings?.tableCol_disc || "Discount";
  const tableCol_amount = settings?.tableCol_amount || "Amount";

  const footerHeartMsg = settings?.footerHeartMsg || "Thank You For Your Business";
  const footerService1 = settings?.footerService1 || "Security System";
  const footerService2 = settings?.footerService2 || "Communication System";
  const footerService3 = settings?.footerService3 || "Fire Safety";
  const footerService4 = settings?.footerService4 || "Network & IT Solutions";

  return (
    <div className="flex flex-col min-h-full bg-white text-[#222222] font-sans p-0 select-none border-none leading-tight document-body">
      {/* 1. CORPORATE BRAND HEADER */}
      <div className="flex items-start justify-between px-6 pt-2 mb-2">
        <div className="flex items-center gap-6">
          {settings?.companyLogo ? (
            <div className="w-[85px] h-[85px] shrink-0">
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-[85px] h-[85px] border border-black flex items-center justify-center text-[10px] font-bold text-slate-400">LOGO</div>
          )}
          
          <div className="text-left space-y-0.5">
            <h1 className="text-[38px] font-black tracking-tighter flex items-center leading-none">
              <span className="text-[#00D4AA]">WARRIOR</span>
              <span className="text-[#0056B3] ml-2">TECH</span>
              <span className="text-[#F57C00] ml-2">SYSTEM</span>
            </h1>
            <p className="text-[14px] font-bold text-[#F57C00] uppercase tracking-[0.1em] italic leading-none">
              {settings?.companySlogan || "Innovative Security, Reliable Communication"}
            </p>
            <div className="flex items-center gap-4 text-[11px] font-bold text-[#555555] mt-1.5">
              <span className="flex items-center gap-1"><span className="text-[#0056B3]">📞</span> {settings?.phone || "+8801753646372"}</span>
              <span className="flex items-center gap-1"><span className="text-[#F57C00]">📧</span> {settings?.email || "warriortechsystem@gmail.com"}</span>
              <span className="flex items-center gap-1"><span className="text-[#0056B3]">🌐</span> {settings?.website || "www.warriortechsystem.com"}</span>
            </div>
            <p className="text-[11px] font-bold text-[#555555] flex items-center gap-1">
              <span className="text-[#0056B3]">📍</span> {settings?.address || "GP.Ja-66/2, Gojnabi Rd, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. IDENTITY DIVIDER */}
      <div className="border-t-[1px] border-red-500 border-dashed w-full mb-4" />

      {/* 3. DYNAMIC DOCUMENT TITLE */}
      <div className="text-center mb-6">
        <h2 className="text-[24px] font-black uppercase underline underline-offset-[8px] decoration-[1.5px] font-headline">
          {title || "Price List/Quotation"}
        </h2>
      </div>

      {/* 4. INFORMATION MATRIX */}
      <div className="grid grid-cols-2 gap-10 mb-6 px-10">
        <div className="space-y-1">
          <h3 className="text-[13px] font-black uppercase mb-2 border-b border-black w-fit pr-8">Customer Info</h3>
          <div className="grid grid-cols-[90px_15px_1fr] text-[12px] leading-relaxed">
            <span className="font-bold">Name</span> <span>:</span> <span className="font-black uppercase">{customerName || "---"}</span>
            <span className="font-bold">Address</span> <span>:</span> <span className="text-slate-700">{customerInfo?.split('\n')[1] || "---"}</span>
            <span className="font-bold">Location</span> <span>:</span> <span className="text-slate-700">Dhaka</span>
            <span className="font-bold">Mobile No</span> <span>:</span> <span className="text-slate-700 font-bold">{customerInfo?.split('\n')[0] || "---"}</span>
          </div>
        </div>
        <div className="space-y-1 flex flex-col justify-end">
          <div className="grid grid-cols-[120px_15px_1fr] text-[12px] leading-relaxed">
            <span className="font-bold uppercase">Invoice No</span> <span>:</span> <span className="font-black text-blue-800">{docNumber}</span>
            <span className="font-bold uppercase">Invoice Date</span> <span>:</span> <span>{new Date(date).toLocaleDateString('en-GB')}</span>
            <span className="font-bold uppercase">Payment Methods</span> <span>:</span> <span>Cash / Digital</span>
            <span className="font-bold uppercase">Status</span> <span>:</span> <span className={cn("font-black", status === 'paid' ? 'text-green-700' : 'text-red-600')}>{status?.toUpperCase() || 'PAID'}</span>
          </div>
        </div>
      </div>

      {/* 5. IMPLEMENTATION BANNERS */}
      <div className="px-6 space-y-[1px]">
        <div className="bg-[#FDEBD0] border border-black p-1.5 text-center">
          <h3 className="text-[15px] font-black text-[#0056B3] uppercase underline underline-offset-4 tracking-tight">
            {docMainHeadline}
          </h3>
        </div>
        <div className="bg-[#D5F5E3] border-x border-b border-black p-1.5 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.05em] text-[#155724]">
            {docSubHeadline}
          </p>
        </div>
      </div>

      {/* 6. MAIN IMPLEMENTATION TABLE */}
      <div className="px-6 flex-1 mt-[1px]">
        <table className="w-full border-collapse border border-black table-fixed">
          <thead>
            <tr className="bg-[#F57C00] text-white">
              <th className="border border-black w-[45px] py-2 text-[10px] font-black uppercase">{tableCol_sl}</th>
              <th className="border border-black px-4 py-2 text-left text-[10px] font-black uppercase">{tableCol_desc}</th>
              <th className="border border-black w-[80px] py-2 text-center text-[10px] font-black uppercase">{tableCol_qty}</th>
              <th className="border border-black w-[100px] py-2 text-right text-[10px] font-black uppercase px-3">{tableCol_price}</th>
              <th className="border border-black w-[80px] py-2 text-center text-[10px] font-black uppercase">{tableCol_disc}</th>
              <th className="border border-black w-[120px] py-2 text-right text-[10px] font-black uppercase pr-4">{tableCol_amount}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-black align-top">
                <td className="border-x border-black p-2 text-center text-[11px] font-bold">{(idx + 1).toString().padStart(2, '0')}</td>
                <td className="border-x border-black p-2">
                  <div className="text-[11px] space-y-0.5 leading-normal">
                    <p><span className="font-bold">Product Name:</span> <span className="font-black uppercase">{item.name}</span></p>
                    <p><span className="font-bold">Brand:</span> {item.brand || (item.description?.includes('Brand') ? item.description.split('Brand:')[1].split('|')[0].trim() : 'Warrior')}</p>
                    <p><span className="font-bold">Model:</span> {item.model || (item.description?.includes('Model') ? item.description.split('Model:')[1].trim() : 'As Need')}</p>
                    <p><span className="font-bold">Country of Origin:</span> {item.country || 'China/Vietnam/Taiwan'}</p>
                    <p><span className="font-bold">Warranty:</span> {item.warranty || '12 Months'}</p>
                  </div>
                </td>
                <td className="border-x border-black p-2 text-center text-[11px] font-bold">{item.quantity} ({item.unit || 'Pcs'})</td>
                <td className="border-x border-black p-2 text-right text-[11px] font-bold px-3">{item.unitPrice.toLocaleString()}</td>
                <td className="border-x border-black p-2 text-center text-[11px] font-bold">{item.discount || '0'}</td>
                <td className="border-x border-black p-2 text-right text-[11px] font-black pr-4">{item.total.toLocaleString()}</td>
              </tr>
            ))}
            
            {/* 7. INTEGRATED CALCULATION FOOTER */}
            <tr className="border-t border-black">
               <td colSpan={3} rowSpan={6} className="p-4 align-top border border-black relative bg-white">
                  <p className="text-[12px] font-black uppercase underline underline-offset-2">{docInWordLabel}</p>
                  <p className="text-[11px] font-bold italic text-slate-500 mt-4 capitalize">Only --- BDT</p>
               </td>
               <td colSpan={2} className="bg-[#FFC107] border border-black p-1.5 text-right text-[10px] font-black uppercase px-3">Sub Total (BDT)</td>
               <td className="border border-black p-1.5 text-right text-[11px] font-black pr-4">{subtotal.toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D6EAF8] border border-black p-1.5 text-right text-[10px] font-black uppercase px-3">Discount (BDT)</td>
               <td className="border border-black p-1.5 text-right text-[11px] font-bold pr-4">{(discount || 0).toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D6EAF8] border border-black p-1.5 text-right text-[10px] font-black uppercase px-3">VAT</td>
               <td className="border border-black p-1.5 text-right text-[11px] font-bold pr-4">{(taxAmount || 0).toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#AED6F1] border border-black p-1.5 text-right text-[12px] font-black uppercase px-3">Grand Total</td>
               <td className="border border-black p-1.5 text-right text-[14px] font-black pr-4 text-[#0056B3]">{grandTotal.toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D5F5E3] border border-black p-1.5 text-right text-[10px] font-black uppercase px-3">Paid</td>
               <td className="border border-black p-1.5 text-right text-[11px] font-black pr-4 text-[#155724]">{grandTotal.toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D5F5E3] border border-black p-1.5 text-right text-[10px] font-black uppercase px-3">Due</td>
               <td className="border border-black p-1.5 text-right text-[11px] font-black pr-4 text-[#721C24]">0.00</td>
            </tr>
          </tbody>
        </table>
        <div className="bg-[#FEF9E7] border-x border-b border-black p-1.5 text-center">
            <p className="text-[10px] font-bold italic">
              Note: The entries payable amount is excluding VAT
            </p>
        </div>
      </div>

      {/* 8. PROJECT METADATA BOX */}
      <div className="mt-6 mx-6 border border-black p-4 space-y-1 bg-white">
        <div className="grid grid-cols-[180px_25px_1fr] text-[11px] leading-tight">
          <span className="font-bold">Project Name</span> <span>:</span> <span className="font-bold text-slate-800">Corporate System Deployment</span>
          <span className="font-bold">Quotation Reference</span> <span>:</span> <span className="font-medium">{docNumber}</span>
          <span className="font-bold">Delivery Challan</span> <span>:</span> <span className="font-medium">---</span>
          <span className="font-bold">Service Warranty</span> <span>:</span> <span className="font-bold text-blue-700">12 Months</span>
          <span className="font-bold">Project Manager</span> <span>:</span> <span className="text-slate-500">System Administrator</span>
        </div>
      </div>

      {/* 9. SIGNATURES & VALIDATION */}
      <div className="mt-16 mb-8 px-8">
        <div className="grid grid-cols-4 gap-12 items-end text-center">
          <div className="space-y-3">
            <div className="border-t border-black w-full" />
            <p className="text-[11px] font-black uppercase tracking-tighter">Customer Signature</p>
          </div>
          <div className="space-y-3">
            <div className="border-t border-black w-full" />
            <p className="text-[11px] font-black uppercase tracking-tighter">Prepared By</p>
          </div>
          <div className="space-y-3">
            <div className="border-t border-black w-full" />
            <p className="text-[11px] font-black uppercase tracking-tighter">Checked By</p>
          </div>
          <div className="space-y-3 relative">
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-30 pointer-events-none">
              <div className="w-18 h-18 rounded-full border-2 border-slate-500 flex items-center justify-center text-[9px] font-black rotate-[12deg] uppercase text-center leading-none p-4">
                Proprietor<br/>WTS
              </div>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Warrior Tech System</p>
            <div className="border-t-2 border-black w-full" />
            <p className="text-[11px] font-black uppercase tracking-tighter text-[#0056B3]">Authorized Signature</p>
          </div>
        </div>
      </div>

      {/* 10. CORPORATE SERVICE FOOTER */}
      <div className="mt-auto pt-4 pb-8 text-center space-y-2 border-t border-[#00D4AA] border-dotted mx-10">
        <p className="text-[11px] font-black text-slate-400 flex items-center justify-center gap-2">
          <span className="text-[#FF0000]">❤</span> {footerHeartMsg} <span className="text-[#FF0000]">❤</span>
        </p>
        <h4 className="text-[20px] font-black text-slate-900 uppercase tracking-tight leading-none">Warrior Tech System</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-4">
          {settings?.companySlogan || "Innovative Security, Reliable Communication"}
        </p>
        
        <div className="flex justify-center items-center gap-6 text-[9px] font-black text-[#0056B3] uppercase tracking-widest pt-2">
           <span className="flex items-center gap-1.5"><span className="text-[#F57C00] text-[14px]">•</span> {footerService1}</span>
           <span className="flex items-center gap-1.5"><span className="text-[#F57C00] text-[14px]">•</span> {footerService2}</span>
           <span className="flex items-center gap-1.5"><span className="text-[#F57C00] text-[14px]">•</span> {footerService3}</span>
           <span className="flex items-center gap-1.5"><span className="text-[#F57C00] text-[14px]">•</span> {footerService4}</span>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .document-container { padding: 0 !important; margin: 0 !important; width: 210mm !important; min-height: 297mm !important; }
          @page { size: A4; margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}
