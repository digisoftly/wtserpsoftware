
"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

/**
 * Service Bill Layout - Clean Corporate Edition
 * Specifically designed for "MONTHLY SERVICE CHARGE BILL"
 * Follows strict A4 print guidelines with high-density data tables.
 */
export function ServiceBillLayout({
  title,
  docNumber,
  date,
  customerName,
  customerInfo,
  items,
  grandTotal,
  notes,
}: DocumentTemplateProps) {
  const { settings, currencySymbol } = useSettings()

  return (
    <div className="flex flex-col min-h-full bg-white text-[#111827] font-body p-0 leading-tight">
      {/* 1. PROFESSIONAL BLUE HEADER */}
      <header className="flex justify-between items-start mb-10 pb-6 border-b-2 border-blue-600">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white text-3xl font-black shadow-lg">
            {settings?.companyLogo ? (
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain p-2 bg-white rounded-lg" />
            ) : (
              <span>W</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">
              {settings?.companyName || "Warrior Tech System"}
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 opacity-80">
              {settings?.companySlogan || "Innovative Security, Reliable Communication"}
            </p>
          </div>
        </div>
        <div className="text-right text-[10px] font-bold text-slate-500 space-y-1">
          <p className="text-slate-800">{settings?.address}</p>
          <p>Cell: {settings?.phone}</p>
          <p>Email: {settings?.email}</p>
          <p>Web: www.warriortechsystem.com</p>
        </div>
      </header>

      {/* 2. DOCUMENT TITLE */}
      <div className="text-center mb-8">
        <h2 className="text-[20px] font-black uppercase tracking-[0.1em] underline underline-offset-[8px] decoration-1 decoration-slate-300">
          {title || "MONTHLY SERVICE CHARGE BILL"}
        </h2>
      </div>

      {/* 3. CUSTOMER IDENTIFICATION */}
      <div className="grid grid-cols-2 gap-10 mb-8">
        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase text-blue-600 tracking-widest border-b border-slate-100 pb-1 w-fit pr-10">
            Bill To
          </h3>
          <div className="space-y-1">
            <p className="text-sm font-black uppercase text-slate-900">{customerName || "---"}</p>
            <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap max-w-xs">
              {customerInfo}
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-end items-end space-y-1.5">
          <div className="flex gap-4 text-[11px]">
            <span className="font-bold text-slate-400 uppercase tracking-tighter">Bill Number:</span>
            <span className="font-black text-slate-900">{docNumber}</span>
          </div>
          <div className="flex gap-4 text-[11px]">
            <span className="font-bold text-slate-400 uppercase tracking-tighter">Billing Date:</span>
            <span className="font-bold text-slate-900">{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex gap-4 text-[11px]">
            <span className="font-bold text-slate-400 uppercase tracking-tighter">Status:</span>
            <span className="font-black text-green-700 uppercase">Authenticated</span>
          </div>
        </div>
      </div>

      {/* 4. SERVICE MATRIX TABLE - ENTERPRISE GRID */}
      <div className="flex-1">
        <table className="w-full border-collapse border border-gray-200">
          <colgroup>
            <col style={{ width: '6%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '46%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>
          <thead>
            <tr className="bg-[#F3F4F6] border-b border-gray-200">
              <th className="border-r border-gray-200 py-3 text-[10px] font-bold uppercase text-slate-600 text-center">SL</th>
              <th className="border-r border-gray-200 px-4 text-left text-[10px] font-bold uppercase text-slate-600">Service Name</th>
              <th className="border-r border-gray-200 px-4 text-left text-[10px] font-bold uppercase text-slate-600">Site / Location</th>
              <th className="border-r border-gray-200 px-4 text-right text-[10px] font-bold uppercase text-slate-600">Monthly Charge (BDT)</th>
              <th className="px-4 text-right text-[10px] font-bold uppercase text-slate-600">Amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className={cn("border-b border-gray-100 h-[42px] transition-colors", idx % 2 === 1 && "bg-[#FAFAFA]")}>
                <td className="border-r border-gray-200 text-center text-[11px] font-medium text-slate-500">
                  {(idx + 1).toString().padStart(2, '0')}
                </td>
                <td className="border-r border-gray-200 px-4 text-[11px] font-bold text-slate-800 text-left">
                  {item.name}
                </td>
                <td className="border-r border-gray-200 px-4 text-[11px] text-slate-600 font-medium text-left">
                  {item.description || '---'}
                </td>
                <td className="border-r border-gray-200 px-4 text-right text-[11px] font-bold text-slate-700 tabular-nums">
                  {idx === 0 ? Number(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}
                </td>
                <td className="px-4 text-right text-[11px] font-black text-slate-900 tabular-nums">
                  {idx === 0 ? Number(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}
                </td>
              </tr>
            ))}
            
            {/* 5. GRAND TOTAL ROW */}
            <tr className="bg-[#F3F4F6] font-black h-[44px] border-t-2 border-gray-300">
              <td className="border-r border-gray-200"></td>
              <td className="border-r border-gray-200"></td>
              <td className="border-r border-gray-200 px-4 text-[11px] text-left uppercase tracking-wider font-black">
                Grand Total (BDT)
              </td>
              <td className="border-r border-gray-200"></td>
              <td className="px-4 text-right text-[13px] font-black text-blue-800 tabular-nums">
                {Number(grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. SUMMARY & REMARKS */}
      <div className="mt-10 space-y-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount in Words:</p>
          <p className="text-xs font-bold text-slate-700 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
            Only {Number(grandTotal || 0).toLocaleString('en-IN')} BDT
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Remarks / Terms:</p>
          <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap pl-1 border-l-2 border-slate-100">
            {notes || "1. Please pay within 15 days of bill generation.\n2. Payment can be made via Bank Transfer or Digital Wallet."}
          </p>
        </div>
      </div>

      {/* 7. THREE-COLUMN SIGNATURE BLOCKS */}
      <div className="mt-24 mb-10">
        <div className="grid grid-cols-3 gap-12 text-center items-end">
          <div className="space-y-3">
            <div className="border-t border-slate-300 mx-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Signature</p>
          </div>
          <div className="space-y-3">
            <div className="border-t border-slate-300 mx-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prepared By</p>
          </div>
          <div className="space-y-3">
            <div className="border-t-2 border-blue-600 mx-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Authorized Signature</p>
          </div>
        </div>
      </div>

      {/* 8. MINI FOOTER */}
      <footer className="mt-auto pt-4 pb-6 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em]">
          Warrior Tech System &copy; {new Date().getFullYear()}
        </p>
      </footer>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .document-container { padding: 0 !important; margin: 0 !important; width: 210mm !important; }
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>
    </div>
  )
}
