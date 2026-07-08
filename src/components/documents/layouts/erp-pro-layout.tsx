"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DocumentTemplateProps } from "../document-template"
import { Badge } from "@/components/ui/badge"
import { QrCode, Barcode } from "lucide-react"

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
    <div className="flex flex-col min-h-full bg-white text-slate-900 font-sans p-0">
      {/* HEADER: BLUE GRADIENT BRANDING */}
      <div className="bg-gradient-to-r from-[#0D6EFD] to-[#0A58CA] p-8 rounded-t-xl text-white mb-8">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2 shadow-xl shrink-0">
                {settings?.companyLogo ? (
                  <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[#0D6EFD] text-2xl font-black italic">W</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight leading-none">Warrior Tech System</h1>
                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1 opacity-80">Innovative Security, Reliable Communication</p>
              </div>
            </div>
            <div className="text-[10px] font-bold text-blue-50/70 uppercase tracking-tighter">
              CCTV • FIRE ALARM • ACCESS CONTROL • NETWORKING • ISP
            </div>
            <div className="text-[10px] space-y-0.5 opacity-90">
              <p>{settings?.address || "Headquarters Address Not Set"}</p>
              <p>Mobile: {settings?.phone} | Email: {settings?.email}</p>
            </div>
          </div>
          <div className="text-right space-y-4">
            <div className="inline-block">
               <Badge className={cn(
                 "text-[10px] font-black px-4 py-1 border-none shadow-lg uppercase tracking-widest",
                 status === 'paid' ? "bg-[#198754] text-white" : status === 'partial' ? "bg-[#FFC107] text-slate-900" : "bg-[#DC3545] text-white"
               )}>
                 {status || "DUE"}
               </Badge>
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black uppercase opacity-20 tracking-tighter mb-2">{title}</h2>
              <p className="text-xs font-mono font-bold tracking-tight">NO: <span className="text-white">{docNumber}</span></p>
              <p className="text-[10px] font-bold opacity-70">DATE: {new Date(date).toLocaleDateString()}</p>
              <p className="text-[10px] font-bold opacity-70">DUE: {new Date(date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOMER SECTION: TWO CARDS */}
      <div className="grid grid-cols-2 gap-6 px-8 mb-8">
        <Card className="border border-slate-100 shadow-sm p-5 rounded-xl bg-slate-50/50">
          <h3 className="text-[10px] font-black text-[#0D6EFD] uppercase tracking-widest mb-3 border-b pb-2">Bill To</h3>
          <p className="text-sm font-black uppercase text-slate-900">{customerName || "Walking Client"}</p>
          <div className="text-[11px] text-slate-600 mt-2 space-y-1">
             <p className="whitespace-pre-wrap leading-relaxed">{customerInfo}</p>
          </div>
        </Card>
        <Card className="border border-slate-100 shadow-sm p-5 rounded-xl bg-slate-50/50">
          <h3 className="text-[10px] font-black text-[#0D6EFD] uppercase tracking-widest mb-3 border-b pb-2">Ship To / Installation</h3>
          <div className="text-[11px] text-slate-600 space-y-1">
             <p><span className="font-bold uppercase text-[9px] text-slate-400">Site:</span> {customerName}</p>
             <p><span className="font-bold uppercase text-[9px] text-slate-400">Address:</span> {customerInfo?.split('\n')[1] || "Same as Billing"}</p>
             <p><span className="font-bold uppercase text-[9px] text-slate-400">Delivery:</span> {new Date(date).toLocaleDateString()}</p>
          </div>
        </Card>
      </div>

      {/* PRODUCT TABLE: STAR TECH STYLE */}
      <div className="flex-1 px-8 mb-8">
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow className="hover:bg-slate-100 border-b border-slate-200">
                <TableHead className="w-12 text-[10px] font-black uppercase text-slate-500 text-center">SL</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500">Product Name / Description</TableHead>
                <TableHead className="w-24 text-[10px] font-black uppercase text-slate-500 text-center">Qty</TableHead>
                <TableHead className="w-32 text-[10px] font-black uppercase text-slate-500 text-right">Unit Price</TableHead>
                <TableHead className="w-24 text-[10px] font-black uppercase text-slate-500 text-right">Disc</TableHead>
                <TableHead className="w-32 text-[10px] font-black uppercase text-slate-500 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="text-[10px] font-bold text-slate-400 text-center">{idx + 1}</TableCell>
                  <TableCell className="py-4">
                    <p className="text-sm font-bold text-slate-900 leading-tight mb-1">{item.name}</p>
                    <div className="flex flex-col gap-0.5">
                       <span className="text-[9px] font-bold text-slate-400 uppercase">Brand : {item.description?.includes('Brand') ? item.description.split('Brand')[1].trim() : 'Warrior'}</span>
                       <span className="text-[9px] font-bold text-slate-400 uppercase">Model : {item.description?.includes('SKU') ? item.description.split('SKU:')[1].trim() : 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs font-bold text-slate-700">{item.quantity} {item.unit || 'Pcs'}</span>
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-slate-700">
                    {currencySymbol}{item.unitPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-slate-500">
                    {item.discount ? `${currencySymbol}${item.discount.toLocaleString()}` : "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-xs font-black text-slate-900">
                    {currencySymbol}{item.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* PAYMENT AREA: TWO COLUMNS */}
      <div className="grid grid-cols-2 gap-10 px-8 mb-12">
        <div className="space-y-6">
          <Card className="border border-slate-100 p-5 rounded-xl shadow-sm">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Payment Details</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Method</p>
                   <p className="text-xs font-black uppercase text-[#0D6EFD]">Bank Transfer</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Ref / TXN ID</p>
                   <p className="text-xs font-mono font-bold text-slate-700">{docNumber.slice(-8)}</p>
                </div>
             </div>
          </Card>
          
          <div className="space-y-3">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Identification</h3>
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[10px] space-y-2">
                <p><span className="font-bold text-slate-400 uppercase">Project:</span> Enterprise Support SLA</p>
                <p><span className="font-bold text-slate-400 uppercase">Engineer:</span> System Technical Team</p>
                <p><span className="font-bold text-slate-400 uppercase">Warranty:</span> 12 Months (Exp: 2026)</p>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
           <div className="flex justify-between px-4 text-xs font-bold text-slate-500 uppercase">
             <span>Sub Total</span>
             <span>{currencySymbol}{subtotal.toLocaleString()}</span>
           </div>
           <div className="flex justify-between px-4 text-xs font-bold text-slate-500 uppercase">
             <span>Discount</span>
             <span className="text-[#DC3545]">-{currencySymbol}{(discount || 0).toLocaleString()}</span>
           </div>
           <div className="flex justify-between px-4 text-xs font-bold text-slate-500 uppercase">
             <span>VAT ({taxRate || 0}%)</span>
             <span>+{currencySymbol}{(taxAmount || 0).toLocaleString()}</span>
           </div>
           <div className="flex justify-between px-4 text-xs font-bold text-slate-500 uppercase">
             <span>Transport</span>
             <span>{currencySymbol}0.00</span>
           </div>
           
           <div className="bg-[#0D6EFD] text-white p-5 rounded-xl shadow-xl flex justify-between items-center mt-4">
              <span className="text-xs font-black uppercase tracking-[0.2em]">Grand Total</span>
              <span className="text-2xl font-black">{currencySymbol}{grandTotal.toLocaleString()}</span>
           </div>

           <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-[#198754]/10 p-3 rounded-xl flex flex-col items-center">
                 <p className="text-[8px] font-black text-[#198754] uppercase tracking-widest mb-1">Paid Amount</p>
                 <p className="text-sm font-black text-[#198754]">{currencySymbol}{grandTotal.toLocaleString()}</p>
              </div>
              <div className="bg-[#DC3545]/10 p-3 rounded-xl flex flex-col items-center">
                 <p className="text-[8px] font-black text-[#DC3545] uppercase tracking-widest mb-1">Due Amount</p>
                 <p className="text-sm font-black text-[#DC3545]">{currencySymbol}0.00</p>
              </div>
           </div>
        </div>
      </div>

      {/* SIGNATURE SECTION */}
      <div className="px-8 mb-12">
        <div className="grid grid-cols-4 gap-10 pt-20">
          <div className="text-center space-y-3">
             <div className="border-t border-slate-300 w-full" />
             <p className="text-[9px] font-black uppercase text-slate-400">Customer Signature</p>
          </div>
          <div className="text-center space-y-3">
             <div className="border-t border-slate-300 w-full" />
             <p className="text-[9px] font-black uppercase text-slate-400">Prepared By</p>
          </div>
          <div className="text-center space-y-3">
             <div className="border-t border-slate-300 w-full" />
             <p className="text-[9px] font-black uppercase text-slate-400">Checked By</p>
          </div>
          <div className="text-center space-y-3">
             <div className="border-t-2 border-[#0D6EFD] w-full" />
             <p className="text-[9px] font-black uppercase text-[#0D6EFD]">Authorized Signature</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-auto bg-slate-50 p-8 text-center space-y-2 border-t border-slate-100 rounded-b-xl">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Thank You For Your Business</p>
        <div className="flex flex-col items-center opacity-40">
           <p className="text-[10px] font-black text-slate-900 uppercase">Warrior Tech System</p>
           <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Innovative Security, Reliable Communication</p>
        </div>
      </div>
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white border rounded-xl", className)}>{children}</div>
}
