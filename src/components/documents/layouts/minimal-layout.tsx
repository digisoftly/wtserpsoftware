"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

export function MinimalLayout({
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
  notes
}: DocumentTemplateProps) {
  const { currencySymbol, settings } = useSettings()

  return (
    <div className="font-sans text-slate-900">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h1 className="text-4xl font-light tracking-tight mb-2">{settings?.companyName}</h1>
          <p className="text-sm text-slate-500">{settings?.email} | {settings?.phone}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-400 mb-1">{title}</h2>
          <p className="text-sm font-mono">{docNumber}</p>
          <p className="text-sm text-slate-500">{new Date(date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-16">
        <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Client</h3>
        <p className="text-xl font-medium">{customerName}</p>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">{customerInfo}</p>
      </div>

      <div className="space-y-4 mb-16">
        <div className="grid grid-cols-12 border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <div className="col-span-6">Description</div>
          <div className="col-span-2 text-center">Qty / Unit</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Total</div>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 text-sm items-center py-2 border-b border-slate-50">
            <div className="col-span-6">
              <p className="font-medium">{item.name}</p>
              {item.serialNumber && <p className="text-[10px] text-slate-400 font-mono mt-0.5">SN: {item.serialNumber}</p>}
            </div>
            <div className="col-span-2 text-center">{item.quantity} {item.unit || 'Pcs'}</div>
            <div className="col-span-2 text-right">{currencySymbol}{item.unitPrice.toLocaleString()}</div>
            <div className="col-span-2 text-right font-bold">{currencySymbol}{item.total.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Subtotal</span>
            <span>{currencySymbol}{subtotal.toLocaleString()}</span>
          </div>
          {taxAmount && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Tax ({taxRate}%)</span>
              <span>{currencySymbol}{taxAmount.toLocaleString()}</span>
            </div>
          )}
          {discount && discount > 0 && (
            <div className="flex justify-between text-sm text-slate-400">
              <span>Discount</span>
              <span>-{currencySymbol}{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-4 border-t border-slate-900 mt-4">
            <span className="text-lg font-bold uppercase tracking-tighter">Total</span>
            <span className="text-3xl font-black">{currencySymbol}{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {notes && (
        <div className="mt-24">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2">Note</h4>
          <p className="text-[10px] text-slate-500 max-w-md">{notes}</p>
        </div>
      )}
    </div>
  )
}
