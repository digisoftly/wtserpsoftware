"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  type
}: DocumentTemplateProps) {
  const { currencySymbol, settings } = useSettings();

  // Helper to get nested item details safely
  const getItemDetail = (item: any, key: string) => {
    return item[key] || "---";
  };

  return (
    <div className="flex flex-col min-h-full bg-white text-[#222222] font-sans p-0 print:p-0">
      {/* HEADER SECTION */}
      <div className="text-center space-y-1 mb-2">
        <h1 className="text-4xl font-black tracking-tighter text-[#00D4AA] flex items-center justify-center gap-2">
           <span className="text-[#0056B3]">WARRIOR</span> <span className="text-[#00D4AA]">TECH</span> <span className="text-[#F57C00]">SYSTEM</span>
        </h1>
        <p className="text-[11px] font-bold text-[#F57C00] uppercase tracking-widest italic">Innovative Security, Reliable Communication</p>
        <div className="flex justify-center gap-4 text-[10px] font-bold text-[#555555]">
          <span>+8801753646372</span>
          <span>warriortechsystem.com</span>
          <span>www.warriortechsystem.com</span>
        </div>
        <p className="text-[10px] font-medium text-[#777777]">GP.Ja-66/2, Gojnabi Rd, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212.</p>
        <div className="border-t border-[#0056B3] border-dashed w-full pt-1 mt-2" />
      </div>

      {/* DYNAMIC TITLE */}
      <div className="text-center my-4">
        <h2 className="text-2xl font-black uppercase underline underline-offset-8 decoration-1">
          {title || "Price List / Quotation"}
        </h2>
      </div>

      {/* META SECTION: CUSTOMER & DOCUMENT INFO */}
      <div className="grid grid-cols-2 gap-10 mb-6 px-4">
        <div className="space-y-1">
          <h3 className="text-[13px] font-black uppercase border-b border-slate-200 pb-1 mb-2">Customer Info</h3>
          <div className="grid grid-cols-[80px_10px_1fr] text-[11px] gap-y-1">
            <span className="font-bold uppercase">Name</span> <span>:</span> <span className="font-bold">{customerName || "---"}</span>
            <span className="font-bold uppercase">Address</span> <span>:</span> <span className="text-slate-600 truncate">{customerInfo?.split('\n')[1] || "---"}</span>
            <span className="font-bold uppercase">Location</span> <span>:</span> <span className="text-slate-600">Dhaka, Bangladesh</span>
            <span className="font-bold uppercase">Mobile No</span> <span>:</span> <span className="text-slate-600">{customerInfo?.split('\n')[0] || "---"}</span>
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-white select-none pb-1 mb-2">.</h3>
          <div className="grid grid-cols-[100px_10px_1fr] text-[11px] gap-y-1">
            <span className="font-bold uppercase">Invoice No</span> <span>:</span> <span className="font-black text-[#0056B3]">{docNumber}</span>
            <span className="font-bold uppercase">Invoice Date</span> <span>:</span> <span>{new Date(date).toLocaleDateString('en-GB')}</span>
            <span className="font-bold uppercase">Payment Methods</span> <span>:</span> <span className="capitalize">Cash / Online</span>
            <span className="font-bold uppercase">Status</span> <span>:</span> <span className="font-black uppercase text-[#198754]">{status || 'PENDING'}</span>
          </div>
        </div>
      </div>

      {/* SUMMARY HEADER (Reference image layout) */}
      <div className="bg-[#E9ECEF] border border-slate-900 mx-1 p-2 text-center mb-1">
        <h3 className="text-lg font-black text-[#0056B3] uppercase underline underline-offset-4 decoration-2 tracking-tighter">
          IMPLEMENTATION AND COST SUMMARY
        </h3>
      </div>
      <div className="bg-[#D4EDDA] border-x border-slate-900 p-1 text-center mb-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#155724]">BUDGETED PROPOSAL ON NETWORK SOLUTION AND CCTV.</p>
      </div>

      {/* PRODUCT TABLE */}
      <div className="flex-1">
        <table className="w-full border-collapse border border-slate-900 table-fixed">
          <thead>
            <tr className="bg-[#F57C00] text-white">
              <th className="border border-slate-900 w-12 py-2 text-[10px] font-black uppercase">Sl. No</th>
              <th className="border border-slate-900 px-4 py-2 text-left text-[10px] font-black uppercase">Product Name and Description</th>
              <th className="border border-slate-900 w-24 py-2 text-center text-[10px] font-black uppercase">Qty (Unit)</th>
              <th className="border border-slate-900 w-28 py-2 text-right text-[10px] font-black uppercase px-2">Unite Price</th>
              <th className="border border-slate-900 w-20 py-2 text-center text-[10px] font-black uppercase">Discount</th>
              <th className="border border-slate-900 w-32 py-2 text-right text-[10px] font-black uppercase pr-4">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-900 align-top">
                <td className="border-x border-slate-900 p-2 text-center text-[11px] font-bold">{(idx + 1).toString().padStart(2, '0')}</td>
                <td className="border-x border-slate-900 p-3">
                  <div className="text-[11px] space-y-1">
                    <p><span className="font-bold">Product Name:</span> {item.name}</p>
                    <p><span className="font-bold">Brand:</span> {getItemDetail(item, 'brand')}</p>
                    <p><span className="font-bold">Model (as need):</span> {getItemDetail(item, 'model')}</p>
                    <p><span className="font-bold">Country of Origin:</span> {getItemDetail(item, 'country') || 'Standard'}</p>
                    <p><span className="font-bold">Warranty:</span> {getItemDetail(item, 'warranty') || '1 Year'}</p>
                  </div>
                </td>
                <td className="border-x border-slate-900 p-2 text-center text-[11px] font-bold">{item.quantity} ({item.unit || 'Pcs'})</td>
                <td className="border-x border-slate-900 p-2 text-right text-[11px] font-bold px-2">{currencySymbol}{item.unitPrice.toLocaleString()}</td>
                <td className="border-x border-slate-900 p-2 text-center text-[11px] font-bold">{item.discount || '0.00'}</td>
                <td className="border-x border-slate-900 p-2 text-right text-[11px] font-black pr-4">{currencySymbol}{item.total.toLocaleString()}</td>
              </tr>
            ))}
            
            {/* Summary rows integrated into table */}
            <tr className="border-t border-slate-900">
               <td colSpan={3} rowSpan={6} className="p-4 align-top border border-slate-900">
                  <div className="space-y-4">
                    <p className="text-[11px]"><span className="font-black uppercase underline tracking-tighter">In Word Amount:</span></p>
                    <p className="text-[10px] font-bold italic text-slate-500 uppercase mt-4">Calculated total amount in words will appear here.</p>
                  </div>
               </td>
               <td colSpan={2} className="bg-[#FFC107] border border-slate-900 p-1 text-right text-[10px] font-black uppercase px-2">Sub Total (BDT)</td>
               <td className="border border-slate-900 p-1 text-right text-[11px] font-black pr-4">{currencySymbol}{subtotal.toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#E9ECEF] border border-slate-900 p-1 text-right text-[10px] font-black uppercase px-2">Discount (BDT)</td>
               <td className="border border-slate-900 p-1 text-right text-[11px] font-bold pr-4 text-[#DC3545]">-{currencySymbol}{(discount || 0).toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#E9ECEF] border border-slate-900 p-1 text-right text-[10px] font-black uppercase px-2">VAT</td>
               <td className="border border-slate-900 p-1 text-right text-[11px] font-bold pr-4">+{currencySymbol}{(taxAmount || 0).toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#CED4DA] border border-slate-900 p-1 text-right text-[10px] font-black uppercase px-2">Grand Total</td>
               <td className="border border-slate-900 p-1 text-right text-[12px] font-black pr-4 text-[#0056B3]">{currencySymbol}{grandTotal.toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D1E7DD] border border-slate-900 p-1 text-right text-[10px] font-black uppercase px-2">Paid</td>
               <td className="border border-slate-900 p-1 text-right text-[11px] font-black pr-4 text-[#198754]">{currencySymbol}{(grandTotal - (grandTotal - subtotal)).toLocaleString()}</td>
            </tr>
            <tr>
               <td colSpan={2} className="bg-[#D1E7DD] border border-slate-900 p-1 text-right text-[10px] font-black uppercase px-2">Due</td>
               <td className="border border-slate-900 p-1 text-right text-[11px] font-black pr-4 text-[#DC3545]">0.00</td>
            </tr>
            <tr className="bg-[#FFF3CD]">
               <td colSpan={6} className="border border-slate-900 p-1 text-center text-[10px] font-bold italic underline">
                 Note: The entries payable amount is excluding VAT
               </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PROJECT INFORMATION */}
      <div className="mt-4 border border-slate-900 mx-0 p-0">
        <div className="grid grid-cols-1 text-[11px]">
          <div className="grid grid-cols-[160px_10px_1fr] p-1 px-4">
            <span className="font-bold">Project Name</span> <span>:</span> <span>CCTV Installation Project</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] p-1 px-4 bg-slate-50 border-y border-slate-100">
            <span className="font-bold">Quotation Reference</span> <span>:</span> <span>WTS-QT-2026-0015</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] p-1 px-4">
            <span className="font-bold">Delivery Challan</span> <span>:</span> <span>WTS-DC-2026-0012</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] p-1 px-4 bg-slate-50 border-y border-slate-100">
            <span className="font-bold">Service Warranty</span> <span>:</span> <span>12 Months</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] p-1 px-4">
            <span className="font-bold">Project Manager</span> <span>:</span> <span>Engineer. Shuvo</span>
          </div>
        </div>
      </div>

      {/* SIGNATURE SECTION */}
      <div className="mt-16 px-4">
        <div className="grid grid-cols-4 gap-4 items-end text-center">
          <div className="space-y-2">
            <div className="border-t border-slate-900 mx-auto w-full" />
            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-700">Customer Signature</p>
          </div>
          <div className="space-y-2">
            <div className="border-t border-slate-900 mx-auto w-full" />
            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-700">Prepared By</p>
          </div>
          <div className="space-y-2">
            <div className="border-t border-slate-900 mx-auto w-full" />
            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-700">Checked By</p>
          </div>
          <div className="space-y-2">
            <div className="flex flex-col items-center">
              <div className="w-24 h-12 flex items-center justify-center opacity-30 select-none">
                <span className="text-[8px] border border-slate-300 p-1 rotate-12">Authorized Seal</span>
              </div>
              <div className="border-t border-slate-900 mx-auto w-full" />
              <p className="text-[10px] font-black uppercase tracking-tighter text-slate-700">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER COORDINATES */}
      <div className="mt-auto pt-10 pb-4 text-center space-y-2">
        <div className="border-t border-[#00D4AA] border-dotted w-full mb-3" />
        <p className="text-[10px] font-black text-slate-400">❤ Thank You for Your Business ❤</p>
        <h4 className="text-[13px] font-black text-slate-900 uppercase">Warrior Tech System</h4>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Innovative Security, Reliable Communication</p>
        <div className="flex justify-center items-center gap-3 text-[8px] font-black text-[#0056B3] uppercase tracking-widest">
           <span className="flex items-center gap-1"><span className="text-orange-500">•</span> Security System</span>
           <span className="flex items-center gap-1"><span className="text-orange-500">•</span> Communication System</span>
           <span className="flex items-center gap-1"><span className="text-orange-500">•</span> Fire Safety</span>
           <span className="flex items-center gap-1"><span className="text-orange-500">•</span> Network & IT Solutions</span>
        </div>
      </div>
    </div>
  );
}
