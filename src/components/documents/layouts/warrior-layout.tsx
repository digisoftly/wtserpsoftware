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
  taxRate,
  discount,
  grandTotal,
  status,
  notes,
}: DocumentTemplateProps) {
  const { currencySymbol, settings } = useSettings();

  return (
    <div className="flex flex-col min-h-full bg-white text-[#222222] font-sans p-0 print:p-0 select-none">
      {/* HEADER SECTION */}
      <div className="text-center space-y-1 mb-2">
        <div className="flex items-center justify-center gap-3 mb-1">
          {/* Logo Placeholder */}
          <div className="w-10 h-10 bg-[#00D4AA] rounded-full flex items-center justify-center text-white font-black text-xl">W</div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center justify-center">
            <span className="text-[#00D4AA]">WARRIOR</span>
            <span className="text-[#0056B3] ml-2">TECH</span>
            <span className="text-[#F57C00] ml-2">SYSTEM</span>
          </h1>
        </div>
        <p className="text-[11px] font-bold text-[#F57C00] uppercase tracking-widest italic leading-none">
          Innovative Security, Reliable Communication
        </p>
        <div className="flex justify-center items-center gap-4 text-[9px] font-bold text-[#555555] mt-1">
          <span className="flex items-center gap-1">📞 +8801753646372</span>
          <span className="flex items-center gap-1">📧 warriortechsystem.com</span>
          <span className="flex items-center gap-1">🌐 www.warriortechsystem.com</span>
        </div>
        <p className="text-[9px] font-bold text-[#555555] flex items-center justify-center gap-1">
          📍 GP.Ja-66/2, Gojnabi Rd, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212.
        </p>
        <div className="border-t border-[#DC3545] border-dashed w-full pt-1 mt-2 opacity-50" />
      </div>

      {/* DYNAMIC TITLE */}
      <div className="text-center my-4">
        <h2 className="text-xl font-bold uppercase underline underline-offset-4">
          {title || "Price List/Quotation"}
        </h2>
      </div>

      {/* CUSTOMER & DOCUMENT INFO GRID */}
      <div className="grid grid-cols-2 gap-16 mb-6 px-2">
        <div className="space-y-1">
          <h3 className="text-xs font-black uppercase mb-1">Customer Info</h3>
          <div className="grid grid-cols-[70px_10px_1fr] text-[10px] leading-tight">
            <span className="font-bold">Name</span> <span>:</span> <span className="font-bold uppercase">{customerName || "---"}</span>
            <span className="font-bold">Address</span> <span>:</span> <span className="text-slate-600">{customerInfo?.split('\n')[1] || "---"}</span>
            <span className="font-bold">Location</span> <span>:</span> <span className="text-slate-600">Dhaka</span>
            <span className="font-bold">Mobile No</span> <span>:</span> <span className="text-slate-600">{customerInfo?.split('\n')[0] || "---"}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="grid grid-cols-[100px_10px_1fr] text-[10px] leading-tight pt-4">
            <span className="font-bold">Invoice No</span> <span>:</span> <span className="font-bold">{docNumber}</span>
            <span className="font-bold">Invoice Date</span> <span>:</span> <span>{new Date(date).toLocaleDateString('en-GB')}</span>
            <span className="font-bold">Payment Methods</span> <span>:</span> <span>Cash</span>
            <span className="font-bold">Status</span> <span>:</span> <span className="font-bold">{status || 'Paid'}</span>
          </div>
        </div>
      </div>

      {/* IMPLEMENTATION BANNER */}
      <div className="bg-[#FDEBD0] border border-black mx-0 p-1.5 text-center">
        <h3 className="text-base font-black text-[#0056B3] uppercase underline underline-offset-2 tracking-tighter">
          IMPLEMENTATION AND COST SUMMARY
        </h3>
      </div>
      <div className="bg-[#D5F5E3] border-x border-black p-0.5 text-center">
        <p className="text-[9px] font-black uppercase tracking-widest text-[#155724]">
          BUDGETED PROPOSAL ON NETWORK SOLUTION AND CCTV.
        </p>
      </div>

      {/* MAIN DATA TABLE */}
      <div className="flex-1">
        <table className="w-full border-collapse border border-black table-fixed">
          <thead>
            <tr className="bg-[#F57C00] text-white">
              <th className="border border-black w-12 py-1 text-[9px] font-black uppercase">Sl. No</th>
              <th className="border border-black px-3 py-1 text-left text-[9px] font-black uppercase">Product Name and Description</th>
              <th className="border border-black w-20 py-1 text-center text-[9px] font-black uppercase">Qty (Unit)</th>
              <th className="border border-black w-24 py-1 text-right text-[9px] font-black uppercase px-2">Unite Price</th>
              <th className="border border-black w-20 py-1 text-center text-[9px] font-black uppercase">Discount</th>
              <th className="border border-black w-28 py-1 text-right text-[9px] font-black uppercase pr-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-black align-top min-h-[60px]">
                <td className="border-x border-black p-2 text-center text-[10px] font-bold">{(idx + 1).toString().padStart(2, '0')}</td>
                <td className="border-x border-black p-2">
                  <div className="text-[9px] space-y-0.5">
                    <p><span className="font-bold">Product Name:</span> {item.name}</p>
                    <p><span className="font-bold">Brand:</span> {item.description?.includes('Brand') ? item.description.split('Brand:')[1].split('|')[0].trim() : '---'}</p>
                    <p><span className="font-bold">Model (as need):</span> {item.description?.includes('Model') ? item.description.split('Model:')[1].trim() : '---'}</p>
                    <p><span className="font-bold">Country of Origin:</span> ---</p>
                    <p><span className="font-bold">Warranty:</span> 12 Months</p>
                  </div>
                </td>
                <td className="border-x border-black p-2 text-center text-[10px] font-bold">{item.quantity} ({item.unit || 'Pcs'})</td>
                <td className="border-x border-black p-2 text-right text-[10px] font-bold px-2">{item.unitPrice.toLocaleString()}</td>
                <td className="border-x border-black p-2 text-center text-[10px] font-bold">{item.discount || ''}</td>
                <td className="border-x border-black p-2 text-right text-[10px] font-black pr-3">{item.total.toLocaleString()}</td>
              </tr>
            ))}
            
            {/* Summary Totals Matrix */}
            <tr className="border-t border-black">
               <td colSpan={3} rowSpan={6} className="p-2 align-top border border-black relative">
                  <p className="text-[10px] font-black uppercase underline">In Word Amount:</p>
                  <p className="text-[9px] font-bold italic text-slate-500 mt-2">---</p>
               </td>
               <td colSpan={2} className="bg-[#FFC107] border border-black p-1 text-right text-[9px] font-black uppercase px-2">Sub Total (BDT)</td>
               <td className="border border-black p-1 text-right text-[10px] font-black pr-3">{subtotal.toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D6EAF8] border border-black p-1 text-right text-[9px] font-black uppercase px-2">Discount (BDT)</td>
               <td className="border border-black p-1 text-right text-[10px] font-bold pr-3">{(discount || 0).toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D6EAF8] border border-black p-1 text-right text-[9px] font-black uppercase px-2">VAT</td>
               <td className="border border-black p-1 text-right text-[10px] font-bold pr-3">{(taxAmount || 0).toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#AED6F1] border border-black p-1 text-right text-[9px] font-black uppercase px-2">Grand Total</td>
               <td className="border border-black p-1 text-right text-[11px] font-black pr-3 text-[#0056B3]">{grandTotal.toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D5F5E3] border border-black p-1 text-right text-[9px] font-black uppercase px-2">Paid</td>
               <td className="border border-black p-1 text-right text-[10px] font-black pr-3 text-[#155724]">{grandTotal.toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D5F5E3] border border-black p-1 text-right text-[9px] font-black uppercase px-2">Due</td>
               <td className="border border-black p-1 text-right text-[10px] font-black pr-3 text-[#721C24]">0.00</td>
            </tr>
            <tr className="bg-[#FEF9E7]">
               <td colSpan={6} className="border border-black p-0.5 text-center text-[8px] font-bold italic underline">
                 Note: The entries payable amount is excluding VAT
               </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PROJECT DETAILS BOX */}
      <div className="mt-3 border border-black p-2 space-y-0.5">
        <div className="grid grid-cols-[140px_10px_1fr] text-[10px]">
          <span className="font-bold">Project Name</span> <span>:</span> <span>CCTV Installation Project</span>
          <span className="font-bold">Quotation Reference</span> <span>:</span> <span>WTS-QT-2026-0015</span>
          <span className="font-bold">Delivery Challan</span> <span>:</span> <span>WTS-DC-2026-0012</span>
          <span className="font-bold">Service Warranty</span> <span>:</span> <span>12 Months</span>
          <span className="font-bold">Project Manager</span> <span>:</span> <span>---</span>
        </div>
      </div>

      {/* SIGNATURES */}
      <div className="mt-16 mb-4 px-2">
        <div className="grid grid-cols-4 gap-4 items-end text-center">
          <div className="space-y-1">
            <div className="border-t border-black w-full" />
            <p className="text-[9px] font-black uppercase">Customer Signature</p>
          </div>
          <div className="space-y-1">
            <div className="border-t border-black w-full" />
            <p className="text-[9px] font-black uppercase">Prepared By</p>
          </div>
          <div className="space-y-1">
            <div className="border-t border-black w-full" />
            <p className="text-[9px] font-black uppercase">Checked By</p>
          </div>
          <div className="space-y-1 relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
              {/* Authorized Seal Placeholder */}
              <div className="w-16 h-10 border border-slate-400 flex items-center justify-center text-[7px] font-bold rotate-12">SEAL</div>
            </div>
            <div className="border-t border-black w-full" />
            <p className="text-[9px] font-black uppercase">Authorized Signature</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-auto pt-6 pb-2 text-center space-y-1 border-t border-[#00D4AA] border-dotted">
        <p className="text-[9px] font-black text-slate-400 flex items-center justify-center gap-1">
          ❤ Thank You for Your Business ❤
        </p>
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tighter">Warrior Tech System</h4>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">Innovative Security, Reliable Communication</p>
        <div className="flex justify-center items-center gap-3 text-[7px] font-black text-[#0056B3] uppercase tracking-widest mt-1">
           <span className="flex items-center gap-0.5"><span className="text-orange-500">•</span> Security System</span>
           <span className="flex items-center gap-0.5"><span className="text-orange-500">•</span> Communication System</span>
           <span className="flex items-center gap-0.5"><span className="text-orange-500">•</span> Fire Safety</span>
           <span className="flex items-center gap-0.5"><span className="text-orange-500">•</span> Network & IT Solutions</span>
        </div>
      </div>
    </div>
  );
}
