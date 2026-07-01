"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

export function ModernLayout({
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
  status
}: DocumentTemplateProps) {
  const { currencySymbol, settings } = useSettings()

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="bg-slate-900 text-white p-12 flex justify-between items-center rounded-t-3xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2">
            <img src={settings?.companyLogo || ""} alt="Logo" className="max-w-full max-h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{settings?.companyName}</h1>
            <p className="text-xs text-slate-400">{settings?.email}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-5xl font-black uppercase opacity-20 absolute top-8 right-12 select-none">{title}</h2>
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400">Invoice Ref</p>
          <p className="text-2xl font-bold">{docNumber}</p>
        </div>
      </div>

      <div className="p-12 grid grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-widest">Billing To</h3>
            <p className="text-lg font-bold text-slate-900">{customerName}</p>
            <p className="text-sm text-slate-500 leading-relaxed mt-2">{customerInfo}</p>
          </div>
        </div>
        <div className="flex flex-col justify-between items-end">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-widest">Issue Date</p>
            <p className="text-sm font-bold">{new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className={cn(
            "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest border-2",
            status === 'paid' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-orange-500/10 text-orange-600 border-orange-500/20"
          )}>
            {status}
          </div>
        </div>
      </div>

      <div className="px-12 pb-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase text-slate-400">Items</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase text-slate-400">Qty / Unit</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase text-slate-400">Rate</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-slate-900">{item.name}</p>
                    {item.serialNumber && <p className="text-[10px] text-slate-400 mt-1 font-mono">#{item.serialNumber}</p>}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium">{item.quantity} {item.unit || 'Pcs'}</td>
                  <td className="px-6 py-4 text-right text-sm">{currencySymbol}{item.unitPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{currencySymbol}{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
            <div className="flex gap-8">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Subtotal</p>
                <p className="font-bold">{currencySymbol}{subtotal.toLocaleString()}</p>
              </div>
              {taxAmount && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">VAT</p>
                  <p className="font-bold">+{currencySymbol}{taxAmount.toLocaleString()}</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Amount Due</p>
              <p className="text-4xl font-black">{currencySymbol}{grandTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
