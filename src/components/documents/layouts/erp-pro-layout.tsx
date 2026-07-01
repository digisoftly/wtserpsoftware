"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DocumentTemplateProps } from "../document-template"

export function ERPProLayout({
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
  const { currencySymbol, settings } = useSettings()

  return (
    <div className="flex flex-col min-h-full bg-white text-slate-900 font-sans">
      {/* HEADER: LOGO & COMPANY INFO */}
      <div className="flex justify-between items-start mb-10 pb-8 border-b-2 border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
            {settings?.companyLogo ? (
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain p-2 bg-white" />
            ) : (
              <span className="text-2xl font-black">W</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-primary">{settings?.companyName || "Warrior ERP"}</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Digital Working System</p>
          </div>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase">{settings?.address || "Headquarters"}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase">{settings?.phone}</p>
          <p className="text-[10px] font-bold text-slate-500">{settings?.email}</p>
          {settings?.website && <p className="text-[10px] font-bold text-primary">{settings?.website}</p>}
        </div>
      </div>

      {/* DOCUMENT TYPE BAR */}
      <div className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center rounded-xl mb-8">
        <h2 className="text-lg font-black uppercase tracking-[0.2em]">{title}</h2>
        <span className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
          status === 'paid' ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary-foreground"
        )}>
          {status || "DRAFT"}
        </span>
      </div>

      {/* CUSTOMER & DETAILS GRID */}
      <div className="grid grid-cols-2 gap-10 mb-10">
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer / Bill To</p>
            <h3 className="text-sm font-black uppercase text-slate-900">{customerName || "Walking Client"}</h3>
            <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{customerInfo || "No address provided."}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-3">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Document No</p>
            <p className="text-xs font-black font-mono text-primary uppercase">{docNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Issue Date</p>
            <p className="text-xs font-black text-slate-900">{new Date(date).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference</p>
            <p className="text-[11px] font-bold text-slate-600 uppercase">#{docNumber.slice(-6)}</p>
          </div>
        </div>
      </div>

      {/* PRODUCT TABLE */}
      <div className="flex-1">
        <Table className="border rounded-xl overflow-hidden">
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-slate-50 border-b">
              <TableHead className="w-12 text-[9px] font-black uppercase text-slate-400 text-center">SL</TableHead>
              <TableHead className="text-[9px] font-black uppercase text-slate-400">Description</TableHead>
              <TableHead className="w-32 text-[9px] font-black uppercase text-slate-400 text-center">Qty / Unit</TableHead>
              <TableHead className="w-28 text-[9px] font-black uppercase text-slate-400 text-right">Price</TableHead>
              <TableHead className="w-24 text-[9px] font-black uppercase text-slate-400 text-right">Disc %</TableHead>
              <TableHead className="w-32 text-[9px] font-black uppercase text-slate-400 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx} className={cn("border-b", idx % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                <TableCell className="text-[10px] font-black text-slate-400 text-center">{idx + 1}</TableCell>
                <TableCell>
                  <p className="text-[11px] font-black uppercase text-slate-900">{item.name}</p>
                  {item.serialNumber && <p className="text-[8px] font-mono text-slate-500 mt-1">S/N: {item.serialNumber}</p>}
                </TableCell>
                <TableCell className="text-center">
                  <p className="text-[11px] font-bold text-slate-700">{item.quantity} {item.unit || 'Pcs'}</p>
                </TableCell>
                <TableCell className="text-right text-[11px] font-bold text-slate-700">
                  {currencySymbol}{item.unitPrice.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-[10px] font-bold text-slate-500">
                  {item.discount || 0}%
                </TableCell>
                <TableCell className="text-right text-[11px] font-black text-primary">
                  {currencySymbol}{item.total.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* SUMMARY SECTION */}
      <div className="mt-8 flex justify-between items-start gap-10">
        <div className="flex-1">
          <div className="p-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount in Words</p>
            <p className="text-[11px] font-bold text-slate-600 italic">Official Digital Receipt</p>
          </div>
          {notes && (
            <div className="mt-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Remarks</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">{notes}</p>
            </div>
          )}
        </div>
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase px-1">
            <span>Subtotal</span>
            <span>{currencySymbol}{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase px-1">
            <span>Discount</span>
            <span className="text-red-500">-{currencySymbol}{(discount || 0).toLocaleString()}</span>
          </div>
          {taxAmount !== undefined && (
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase px-1">
              <span>VAT ({taxRate}%)</span>
              <span>+{currencySymbol}{taxAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="bg-primary p-4 rounded-xl text-white flex justify-between items-center shadow-xl shadow-primary/20">
            <span className="text-[10px] font-black uppercase tracking-widest">Net Total</span>
            <span className="text-xl font-black">{currencySymbol}{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* FOOTER: SIGNATURES */}
      <div className="mt-auto pt-16 flex justify-between items-end border-t border-slate-100 pb-4">
        <div className="w-48 text-center border-t border-slate-300 pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Signature</p>
        </div>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto opacity-20">
            <span className="text-[10px] font-black">W</span>
          </div>
          <p className="text-[8px] font-black uppercase text-slate-300 tracking-[0.3em]">Computer Generated Receipt</p>
        </div>
        <div className="w-48 text-center border-t border-primary pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Authorized Signature</p>
        </div>
      </div>
    </div>
  )
}
