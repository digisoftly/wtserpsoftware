"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

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
  const { currencySymbol, settings } = useSettings();

  // Helper to split company name if it matches "Warrior Tech System"
  const renderCompanyName = () => {
    const name = settings?.companyName || "Warrior Tech System";
    if (name.toLowerCase() === "warrior tech system") {
      return (
        <h1 className="text-[42px] font-black tracking-tighter flex items-center justify-center leading-none">
          <span className="text-[#00D4AA]">WARRIOR</span>
          <span className="text-[#0056B3] ml-2">TECH</span>
          <span className="text-[#F57C00] ml-2">SYSTEM</span>
        </h1>
      );
    }
    return <h1 className="text-[42px] font-black tracking-tighter text-[#0056B3]">{name}</h1>;
  };

  return (
    <div className="flex flex-col min-h-full bg-white text-[#222222] font-sans p-0 print:p-0 select-none">
      {/* HEADER SECTION - EXACT REPLICA */}
      <div className="relative text-center space-y-1 mb-2 px-4">
        <div className="flex items-center justify-center gap-6 mb-1">
          {/* Admin Logo */}
          {settings?.companyLogo && (
            <div className="w-16 h-16 shrink-0">
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
          {renderCompanyName()}
        </div>
        
        <p className="text-[12px] font-bold text-[#F57C00] uppercase tracking-[0.2em] italic leading-none">
          {settings?.companySlogan || "Innovative Security, Reliable Communication"}
        </p>
        
        <div className="flex justify-center items-center gap-4 text-[10px] font-bold text-[#555555] mt-1">
          <span className="flex items-center gap-1">
             <span className="text-[#0056B3]">📞</span> {settings?.phone || "+8801753646372"}
          </span>
          <span className="flex items-center gap-1">
             <span className="text-[#F57C00]">📧</span> {settings?.email || "warriortechsystem@gmail.com"}
          </span>
          <span className="flex items-center gap-1">
             <span className="text-[#0056B3]">🌐</span> {settings?.website || "www.warriortechsystem.com"}
          </span>
        </div>
        
        <p className="text-[10px] font-bold text-[#555555] flex items-center justify-center gap-1">
          <span className="text-[#0056B3]">📍</span> {settings?.address || "GP.Ja-66/2, Gojnabi Rd, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212."}
        </p>
        
        {/* Dashed Red Line */}
        <div className="border-t border-red-500/40 border-dashed w-full pt-1 mt-3" />
      </div>

      {/* DYNAMIC TITLE */}
      <div className="text-center my-6">
        <h2 className="text-2xl font-black uppercase underline underline-offset-[8px] decoration-1 font-headline">
          {title || "Price List/Quotation"}
        </h2>
      </div>

      {/* CUSTOMER & DOCUMENT INFO GRID */}
      <div className="grid grid-cols-2 gap-16 mb-8 px-8">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase mb-2">Customer Info</h3>
          <div className="grid grid-cols-[80px_15px_1fr] text-[11px] leading-relaxed">
            <span className="font-bold">Name</span> <span>:</span> <span className="font-black uppercase">{customerName || "---"}</span>
            <span className="font-bold">Address</span> <span>:</span> <span className="text-slate-700">{customerInfo?.split('\n')[1] || "---"}</span>
            <span className="font-bold">Location</span> <span>:</span> <span className="text-slate-700">Dhaka</span>
            <span className="font-bold">Mobile No</span> <span>:</span> <span className="text-slate-700 font-bold">{customerInfo?.split('\n')[0] || "---"}</span>
          </div>
        </div>
        <div className="space-y-1 pt-7">
          <div className="grid grid-cols-[120px_15px_1fr] text-[11px] leading-relaxed">
            <span className="font-bold uppercase">Invoice No</span> <span>:</span> <span className="font-black text-blue-800">{docNumber}</span>
            <span className="font-bold uppercase">Invoice Date</span> <span>:</span> <span>{new Date(date).toLocaleDateString('en-GB')}</span>
            <span className="font-bold uppercase">Payment Methods</span> <span>:</span> <span>Cash / Digital</span>
            <span className="font-bold uppercase">Status</span> <span>:</span> <span className={cn("font-black", status === 'paid' ? 'text-green-700' : 'text-red-600')}>{status || 'Paid'}</span>
          </div>
        </div>
      </div>

      {/* IMPLEMENTATION BANNERS */}
      <div className="px-4">
        <div className="bg-[#FDEBD0] border border-black p-2 text-center">
          <h3 className="text-[18px] font-black text-[#0056B3] uppercase underline underline-offset-4 tracking-tight">
            IMPLEMENTATION AND COST SUMMARY
          </h3>
        </div>
        <div className="bg-[#D5F5E3] border-x border-b border-black p-1 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#155724]">
            BUDGETED PROPOSAL ON NETWORK SOLUTION AND CCTV.
          </p>
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <div className="px-4 flex-1">
        <table className="w-full border-collapse border border-black table-fixed">
          <thead>
            <tr className="bg-[#F57C00] text-white">
              <th className="border border-black w-14 py-2 text-[10px] font-black uppercase">Sl. No</th>
              <th className="border border-black px-4 py-2 text-left text-[10px] font-black uppercase">Product Name and Description</th>
              <th className="border border-black w-24 py-2 text-center text-[10px] font-black uppercase">Qty (Unit)</th>
              <th className="border border-black w-28 py-2 text-right text-[10px] font-black uppercase px-2 text-nowrap">Unite Price</th>
              <th className="border border-black w-24 py-2 text-center text-[10px] font-black uppercase">Discount</th>
              <th className="border border-black w-32 py-2 text-right text-[10px] font-black uppercase pr-4">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-black align-top min-h-[80px]">
                <td className="border-x border-black p-3 text-center text-[11px] font-bold">{(idx + 1).toString().padStart(2, '0')}</td>
                <td className="border-x border-black p-3">
                  <div className="text-[10px] space-y-0.5 leading-normal">
                    <p><span className="font-bold">Product Name:</span> {item.name}</p>
                    <p><span className="font-bold">Brand:</span> {item.description?.includes('Brand') ? item.description.split('Brand:')[1].split('|')[0].trim() : 'Warrior'}</p>
                    <p><span className="font-bold">Model (as need):</span> {item.description?.includes('Model') ? item.description.split('Model:')[1].trim() : 'N/A'}</p>
                    <p><span className="font-bold">Country of Origin:</span> China/Vietnam</p>
                    <p><span className="font-bold">Warranty:</span> 12 Months</p>
                  </div>
                </td>
                <td className="border-x border-black p-3 text-center text-[11px] font-bold">{item.quantity} ({item.unit || 'Pcs'})</td>
                <td className="border-x border-black p-3 text-right text-[11px] font-bold px-2">{item.unitPrice.toLocaleString()}</td>
                <td className="border-x border-black p-3 text-center text-[11px] font-bold">{item.discount || ''}</td>
                <td className="border-x border-black p-3 text-right text-[11px] font-black pr-4">{item.total.toLocaleString()}</td>
              </tr>
            ))}
            
            {/* INTEGRATED SUMMARY FOOTER */}
            <tr className="border-t border-black">
               <td colSpan={3} rowSpan={6} className="p-4 align-top border border-black relative">
                  <p className="text-[11px] font-black uppercase underline decoration-1 underline-offset-2">In Word Amount:</p>
                  <p className="text-[10px] font-bold italic text-slate-500 mt-3 capitalize">--- Only</p>
               </td>
               <td colSpan={2} className="bg-[#FFC107] border border-black p-1.5 text-right text-[10px] font-black uppercase px-2">Sub Total (BDT)</td>
               <td className="border border-black p-1.5 text-right text-[11px] font-black pr-4">{subtotal.toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D6EAF8] border border-black p-1.5 text-right text-[10px] font-black uppercase px-2">Discount (BDT)</td>
               <td className="border border-black p-1.5 text-right text-[11px] font-bold pr-4">{(discount || 0).toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D6EAF8] border border-black p-1.5 text-right text-[10px] font-black uppercase px-2">VAT</td>
               <td className="border border-black p-1.5 text-right text-[11px] font-bold pr-4">{(taxAmount || 0).toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#AED6F1] border border-black p-1.5 text-right text-[10px] font-black uppercase px-2">Grand Total</td>
               <td className="border border-black p-1.5 text-right text-[14px] font-black pr-4 text-[#0056B3]">{grandTotal.toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D5F5E3] border border-black p-1.5 text-right text-[10px] font-black uppercase px-2">Paid</td>
               <td className="border border-black p-1.5 text-right text-[11px] font-black pr-4 text-[#155724]">{grandTotal.toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D5F5E3] border border-black p-1.5 text-right text-[10px] font-black uppercase px-2">Due</td>
               <td className="border border-black p-1.5 text-right text-[11px] font-black pr-4 text-[#721C24]">0.00</td>
            </tr>
            <tr className="bg-[#FEF9E7]">
               <td colSpan={6} className="border border-black p-1 text-center text-[10px] font-bold italic">
                 Note: The entries payable amount is excluding VAT
               </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PROJECT DETAILS BOX */}
      <div className="mt-4 mx-4 border border-black p-3 space-y-1 bg-white">
        <div className="grid grid-cols-[180px_20px_1fr] text-[11px] leading-tight">
          <span className="font-bold">Project Name</span> <span>:</span> <span className="font-bold text-slate-800">CCTV Installation Project</span>
          <span className="font-bold">Quotation Reference</span> <span>:</span> <span className="font-medium">{docNumber}</span>
          <span className="font-bold">Delivery Challan</span> <span>:</span> <span className="font-medium">---</span>
          <span className="font-bold">Service Warranty</span> <span>:</span> <span className="font-bold text-blue-700">12 Months</span>
          <span className="font-bold">Project Manager</span> <span>:</span> <span className="text-slate-400">Not Assigned</span>
        </div>
      </div>

      {/* SIGNATURES SECTION */}
      <div className="mt-20 mb-8 px-8">
        <div className="grid grid-cols-4 gap-8 items-end text-center">
          <div className="space-y-2">
            <div className="border-t border-black w-full" />
            <p className="text-[10px] font-black uppercase tracking-tighter">Customer Signature</p>
          </div>
          <div className="space-y-2">
            <div className="border-t border-black w-full" />
            <p className="text-[10px] font-black uppercase tracking-tighter">Prepared By</p>
          </div>
          <div className="space-y-2">
            <div className="border-t border-black w-full" />
            <p className="text-[10px] font-black uppercase tracking-tighter">Checked By</p>
          </div>
          <div className="space-y-2 relative group">
            {/* Signature Seal Replica */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-30 pointer-events-none flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-slate-500 flex items-center justify-center text-[8px] font-black rotate-[15deg] uppercase text-center leading-none">
                Proprietor<br/>WTS
              </div>
            </div>
            <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Warrior Tech System</p>
            <div className="border-t-2 border-black w-full" />
            <p className="text-[10px] font-black uppercase tracking-tighter text-[#0056B3]">Authorized Signature</p>
          </div>
        </div>
      </div>

      {/* CORPORATE FOOTER */}
      <div className="mt-auto pt-6 pb-6 text-center space-y-2 border-t border-[#00D4AA] border-dotted mx-4">
        <p className="text-[10px] font-black text-slate-400 flex items-center justify-center gap-2">
          ❤ Thank You for Your Business ❤
        </p>
        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Warrior Tech System</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-3">
          {settings?.companySlogan || "Innovative Security, Reliable Communication"}
        </p>
        
        <div className="flex justify-center items-center gap-5 text-[9px] font-black text-[#0056B3] uppercase tracking-widest pt-2">
           <span className="flex items-center gap-1.5"><span className="text-[#F57C00] text-[12px]">•</span> Security System</span>
           <span className="flex items-center gap-1.5"><span className="text-[#F57C00] text-[12px]">•</span> Communication System</span>
           <span className="flex items-center gap-1.5"><span className="text-[#F57C00] text-[12px]">•</span> Fire Safety</span>
           <span className="flex items-center gap-1.5"><span className="text-[#F57C00] text-[12px]">•</span> Network & IT Solutions</span>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          .document-container {
            padding: 0 !important;
            box-shadow: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
