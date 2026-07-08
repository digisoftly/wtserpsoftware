"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DocumentTemplateProps } from "../document-template"
import { QrCode, Barcode, ShieldCheck, CheckCircle2 } from "lucide-react"

export function ProfessionalLayout({
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
    <div className="flex flex-col min-h-full text-slate-900">
      {/* Header Grid: Star Tech Style Branding */}
      <div className="grid grid-cols-12 gap-8 mb-12 border-b-4 border-primary pb-10">
        <div className="col-span-8 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-primary rounded-[1.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl overflow-hidden ring-4 ring-primary/10">
              {settings?.companyLogo ? (
                <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain p-2 bg-white" />
              ) : (
                <span>W</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tighter text-primary leading-none">{settings?.companyName || "Warrior Tech System"}</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2 italic opacity-60">Innovative Security, Reliable Communication</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pt-4">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Office HQ</p>
                <p className="text-[11px] font-bold leading-relaxed max-w-[280px]">{settings?.address || "Headquarters Address Not Set"}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connect</p>
                <p className="text-[11px] font-bold">{settings?.phone}</p>
                <p className="text-[11px] font-bold text-primary">{settings?.email}</p>
             </div>
          </div>
        </div>

        <div className="col-span-4 flex flex-col items-end justify-between">
          <div className="text-right space-y-4">
            <div className="bg-primary/10 text-primary px-6 py-3 rounded-2xl inline-block border-2 border-primary/20">
              <h2 className="text-2xl font-black font-headline uppercase tracking-[0.1em]">{title}</h2>
            </div>
            <div className="space-y-1.5 mt-4">
              <div className="flex justify-end items-center gap-3">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice No:</span>
                 <span className="text-xs font-black font-mono text-slate-900 tracking-tighter">{docNumber}</span>
              </div>
              <div className="flex justify-end items-center gap-3">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date:</span>
                 <span className="text-xs font-black text-slate-900">{new Date(date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-end items-center gap-3">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                 <Badge className={cn("text-[8px] h-4 uppercase border-none px-2 font-black", status === 'paid' ? 'bg-green-600' : 'bg-orange-500')}>{status}</Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
             <div className="w-16 h-16 rounded-xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center p-2">
                <QrCode className="w-full h-full text-slate-300" />
             </div>
             <div className="w-16 h-16 rounded-xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center p-2">
                <Barcode className="w-full h-full text-slate-300" />
             </div>
          </div>
        </div>
      </div>

      {/* Customer & Relationship Details */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="bg-slate-50/50 p-8 rounded-3xl border-2 border-dashed border-slate-200/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><CheckCircle2 className="h-20 w-20 text-slate-900" /></div>
          <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.3em] mb-4">
            {type === 'po' ? 'Vendor Logistics' : 'Bill To / Customer Entity'}
          </h3>
          <p className="text-xl font-black font-headline text-slate-900 uppercase tracking-tight leading-none mb-2">{customerName || "Walk-in Customer"}</p>
          <div className="h-1 w-12 bg-primary/20 rounded-full mb-4" />
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed whitespace-pre-wrap max-w-xs">{customerInfo || "Standard delivery profile used for this secure transaction."}</p>
        </div>
        <div className="flex flex-col justify-end p-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-slate-400">Payment Term</p>
                 <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Net 30 / COD</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-slate-400">Project Reference</p>
                 <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Standard Sale</p>
              </div>
           </div>
        </div>
      </div>

      {/* Premium Product Matrix */}
      <div className="flex-1">
        <Table className="border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
          <TableHeader className="bg-slate-900 text-white">
            <TableRow className="hover:bg-slate-900 border-none">
              <TableHead className="text-white font-black uppercase text-[10px] tracking-widest pl-6 py-5">Item Matrix</TableHead>
              <TableHead className="text-white font-black uppercase text-[10px] tracking-widest text-center w-32">Qty / Unit</TableHead>
              <TableHead className="text-white font-black uppercase text-[10px] tracking-widest text-right w-36">Rate ({currencySymbol})</TableHead>
              <TableHead className="text-white font-black uppercase text-[10px] tracking-widest text-right w-40 pr-10">Total ({currencySymbol})</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx} className={cn("border-b border-slate-100", idx % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                <TableCell className="pl-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase text-slate-900 tracking-tight leading-none mb-1.5">{item.name}</span>
                    {item.serialNumber && <div className="text-[9px] text-slate-400 font-black font-mono uppercase opacity-70 tracking-widest">S/N: {item.serialNumber}</div>}
                    {item.description && <div className="text-[10px] text-slate-500 font-bold italic mt-1 leading-relaxed">{item.description}</div>}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                   <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{item.quantity} {item.unit || 'Pcs'}</span>
                </TableCell>
                <TableCell className="text-right font-bold text-xs text-slate-700">
                  {item.unitPrice.toLocaleString()}
                </TableCell>
                <TableCell className="text-right pr-10 font-black text-sm text-slate-900">
                  {item.total.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary Reconstruction */}
      <div className="flex justify-between items-start mt-12 gap-12">
        <div className="flex-1 space-y-8">
           <div>
            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-[0.3em]">Corporate Terms & Conditions</h4>
            <div className="text-[9px] font-bold text-slate-500 leading-relaxed space-y-1 bg-slate-50 p-6 rounded-2xl border-2 border-dotted border-slate-200">
              <p>1. Payments are due within 15 days of invoice date unless specified otherwise.</p>
              <p>2. Hardware items are subject to specific manufacturer warranty policies.</p>
              <p>3. This document is a computer-generated transaction record.</p>
            </div>
          </div>
          {notes && (
            <div className="bg-primary/5 p-5 rounded-2xl border-l-4 border-primary">
               <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Administrative Note</p>
               <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{notes}</p>
            </div>
          )}
        </div>

        <div className="w-96 bg-white p-8 rounded-[2rem] border-4 border-primary/5 shadow-xl space-y-5">
          <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <span>Subtotal Gross</span>
            <span className="text-slate-900">{currencySymbol}{subtotal.toLocaleString()}</span>
          </div>
          {taxRate !== undefined && taxAmount !== undefined && (
            <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <span>VAT / Taxes ({taxRate}%)</span>
              <span className="text-slate-900">+{currencySymbol}{taxAmount.toLocaleString()}</span>
            </div>
          )}
          {discount !== undefined && discount > 0 && (
            <div className="flex justify-between text-[11px] font-black text-red-500 uppercase tracking-widest">
              <span>Discount Net</span>
              <span className="font-black">-{currencySymbol}{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="pt-6 border-t-2 border-slate-100 mt-2">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                 <span className="text-xs font-black font-headline uppercase text-primary tracking-widest leading-none">Net Payable</span>
                 <p className="text-[8px] font-bold text-slate-400 uppercase">Inclusive of all duties</p>
              </div>
              <span className="text-3xl font-black font-headline text-primary tracking-tighter leading-none">{currencySymbol}{grandTotal.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shadow-inner">
                <ShieldCheck className="h-4 w-4" />
             </div>
             <p className="text-[8px] font-black text-slate-400 uppercase leading-tight tracking-widest">
                System Verified & Authenticated Transaction Record
             </p>
          </div>
        </div>
      </div>

      {/* Signature & Seal Footer */}
      <div className="mt-auto pt-24 pb-8">
        <div className="grid grid-cols-3 gap-12 items-end">
          <div className="text-center space-y-4">
             <div className="w-32 border-t-2 border-slate-200 pt-3 mx-auto">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Authorization</p>
             </div>
          </div>
          
          <div className="text-center flex flex-col items-center gap-3 pb-4">
             <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
                <img src={settings?.companyLogo || ""} className="w-8 h-8 object-contain" />
             </div>
             <p className="text-[8px] font-black uppercase text-slate-300 tracking-[0.5em] animate-pulse">WARRIOR TECHNOLOGY SYSTEMS</p>
          </div>

          <div className="text-center space-y-4">
             <div className="w-48 border-t-2 border-primary pt-3 mx-auto relative">
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-20"><Barcode className="h-8 w-16" /></div>
               <p className="text-[10px] font-black uppercase tracking-widest text-primary">Authorized Validation</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}