"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DocumentTemplateProps } from "../document-template"
import { QrCode, Barcode, ShieldCheck, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"

export function ProfessionalLayout(props: DocumentTemplateProps) {
  const { 
    title, docNumber, date, customerName, customerInfo, items, 
    subtotal, taxAmount, taxRate, discount, grandTotal, status, 
    notes, type, projectName, projectLocation 
  } = props;
  const { currencySymbol, settings } = useSettings()
  const { t, formatDate, amountToWords } = useTranslation()

  const renderHeader = () => (
    <div className="flex items-center gap-6 px-4 pt-4 mb-4">
      <div className="w-[100px] h-[100px] shrink-0">
        {settings?.companyLogo ? (
          <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center text-white text-5xl font-black shadow-lg">W</div>
        )}
      </div>
      <div className="flex-1 flex flex-col items-center text-center space-y-1">
        <h1 className="text-[42px] font-black tracking-tighter flex items-center justify-center leading-none">
          <span className="text-[#00D4AA]">WARRIOR</span>
          <span className="text-[#0056B3] ml-2">TECH</span>
          <span className="text-[#F57C00] ml-2">SYSTEM</span>
        </h1>
        <p className="text-[16px] font-bold text-[#F57C00] uppercase tracking-[0.2em] italic leading-none mt-1">
          {settings?.companySlogan || "Innovative Security Reliable Communication"}
        </p>
        <div className="flex items-center justify-center gap-8 text-[11px] font-bold text-[#444444] mt-3">
          <span className="flex items-center gap-2"><span className="text-[#0056B3]">📞</span> {settings?.phone || "+8801753646372"}</span>
          <span className="flex items-center gap-2"><span className="text-[#F57C00]">📧</span> {settings?.email || "warriortechsystem@gmail.com"}</span>
          <span className="flex items-center gap-2"><span className="text-[#0056B3]">🌐</span> {settings?.website || "www.warriortechsystem.com"}</span>
        </div>
        <p className="text-[11px] font-bold text-[#444444] flex items-center justify-center gap-2 mt-1 max-w-2xl">
          <span className="text-[#0056B3]">📍</span> {settings?.address || "GP Ja-66/2 Gojnabi Rd Wireless Gate Mohakhali Gulshan Dhaka-1212"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full text-slate-900 bg-white">
      {renderHeader()}
      <div className="border-t-[1.5px] border-red-500 border-dashed w-full mb-8" />

      <div className="grid grid-cols-2 gap-10 mb-6 px-4">
        <div className="space-y-1">
          <p className="text-[12px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 w-fit pb-0.5">Bill To:</p>
          <p className="text-[14px] font-black uppercase text-slate-900 leading-tight">{customerName || "---"}</p>
          <div className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
            {customerInfo || "Address Not Available"}
          </div>
        </div>
        <div className="space-y-1 flex flex-col justify-end">
          <div className="grid grid-cols-[120px_10px_1fr] text-[11px] leading-relaxed">
            <span className="font-bold uppercase">{t('docNo')}</span> <span>:</span> <span className="font-black text-blue-800">{docNumber}</span>
            <span className="font-bold uppercase">{t('date')}</span> <span>:</span> <span className="font-bold">{formatDate(date)}</span>
            <span className="font-bold uppercase">Project Name</span> <span>:</span> <span className="font-bold uppercase">{projectName || "General Service"}</span>
            <span className="font-bold uppercase">Status</span> <span>:</span> 
            <span className={cn("font-black uppercase", status === 'paid' ? "text-green-700" : "text-red-600")}>
              {status || "Authenticated"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 mt-4">
        <Table className="border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
          <TableHeader className="bg-slate-900 text-white">
            <TableRow className="hover:bg-slate-900 border-none">
              <TableHead className="text-white font-black uppercase text-[10px] tracking-widest pl-6 py-5">
                {settings?.pdfTable_item || t('forms.itemName')}
              </TableHead>
              <TableHead className="text-white font-black uppercase text-[10px] tracking-widest text-center w-32">
                {settings?.pdfTable_qty || t('forms.qty')}
              </TableHead>
              <TableHead className="text-white font-black uppercase text-[10px] tracking-widest text-right w-36">
                {settings?.pdfTable_unitPrice || t('forms.price')}
              </TableHead>
              <TableHead className="text-white font-black uppercase text-[10px] tracking-widest text-right w-40 pr-10">
                {settings?.pdfTable_amount || t('common.amount')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx} className={cn("border-b border-slate-100", idx % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                <TableCell className="pl-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-black text-[12px] uppercase text-slate-900 tracking-tight leading-none mb-1.5">{item.name}</span>
                    {item.sn && <div className="text-[9px] text-blue-600 font-black font-mono uppercase opacity-70 tracking-widest">S/N: {item.sn}</div>}
                    {item.description && <div className="text-[10px] text-slate-500 font-bold italic mt-1 leading-relaxed">{item.description}</div>}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                   <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{item.quantity} {item.unit || 'Pcs'}</span>
                </TableCell>
                <TableCell className="text-right font-bold text-[11px] text-slate-700">
                  {(item.unitPrice || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right pr-10 font-black text-[11px] text-slate-900">
                  {(item.total || 0).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-start mt-12 gap-12">
        <div className="flex-1 space-y-8">
          <div>
            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-[0.3em]">Compliance & Terms</h4>
            <div className="text-[9px] font-bold text-slate-500 leading-relaxed space-y-1 bg-slate-50 p-6 rounded-2xl border-2 border-dotted border-slate-200 whitespace-pre-wrap">
              {settings?.pdfTerms || "1. Payments are due within 15 days of invoice date unless specified otherwise.\n2. Equipment remains property of Warrior Tech System until full payment is realized.\n3. Hardware items are subject to specific manufacturer warranty policies."}
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
            <span>{settings?.pdfTable_subtotal || t('forms.subtotal')}</span>
            <span className="text-slate-900">{currencySymbol}{(subtotal || 0).toLocaleString()}</span>
          </div>
          {taxAmount !== undefined && (
            <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <span>{settings?.pdfTable_tax || t('forms.tax')}</span>
              <span className="text-slate-900">+{currencySymbol}{(taxAmount || 0).toLocaleString()}</span>
            </div>
          )}
          {discount !== undefined && discount > 0 && (
            <div className="flex justify-between text-[11px] font-black text-red-500 uppercase tracking-widest">
              <span>{settings?.pdfTable_discount || t('forms.discount')}</span>
              <span className="font-black">-{currencySymbol}{(discount || 0).toLocaleString()}</span>
            </div>
          )}
          <div className="pt-6 border-t-2 border-slate-100 mt-2">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                 <span className="text-xs font-black uppercase text-blue-800 tracking-widest leading-none">
                   {settings?.pdfTable_grandTotal || t('forms.grandTotal')}
                 </span>
                 <p className="text-[8px] font-bold text-slate-400 uppercase">Total Payable</p>
              </div>
              <span className="text-3xl font-black text-blue-900 tracking-tighter leading-none">{(grandTotal || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 pb-6 text-center space-y-2 border-t-2 border-[#F57C00] mx-2">
        <div className="grid grid-cols-4 gap-4 px-4 pt-12 mb-8 relative">
          <div className="text-center"><div className="border-t border-black pt-1 text-[9px] font-black uppercase">Customer Signature</div></div>
          <div className="text-center"><div className="border-t border-black pt-1 text-[9px] font-black uppercase">Prepared By</div></div>
          <div className="text-center"><div className="border-t border-black pt-1 text-[9px] font-black uppercase">Checked By</div></div>
          <div className="text-center relative">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center justify-center h-20 w-40 gap-2">
              {settings?.authorizedSeal && <img src={settings.authorizedSeal} className="h-20 w-20 object-contain opacity-80" alt="Seal" />}
              {settings?.authorizedSignature && <img src={settings.authorizedSignature} className="h-16 w-32 object-contain absolute bottom-2" alt="Signature" />}
            </div>
            <div className="border-t-2 border-blue-700 pt-1 text-[10px] font-black uppercase text-blue-800">Authorized Signature</div>
          </div>
        </div>

        <p className="text-[11.5px] font-black text-slate-500 flex items-center justify-center gap-2">
          <span className="text-red-600">❤</span> {settings?.footerHeartMsg || "Thank You For Your Business"} <span className="text-red-600">❤</span>
        </p>
        <h4 className="text-[24px] font-black text-slate-900 uppercase tracking-tight leading-none">{settings?.companyName || "Warrior Tech System"}</h4>
        <div className="flex justify-center gap-6 text-[9px] font-black text-blue-700 uppercase tracking-widest mt-2">
          <span>• Security System</span>
          <span>• Communication System</span>
          <span>• Fire Safety</span>
          <span>• Network & IT Solutions</span>
        </div>
      </div>
    </div>
  )
}
