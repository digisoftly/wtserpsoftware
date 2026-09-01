"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps, DocumentItem } from "../document-template"
import { Barcode } from "lucide-react"

/**
 * Warrior Official Premium Layout - Unified Design
 * Shared Pad branding for Invoice, Quotation, Challan, and PO
 */
export function WarriorLayout(props: DocumentTemplateProps) {
  const { settings } = useSettings();
  const { t, formatDate, amountToWords } = useTranslation();
  const { 
    items = [], subtotal, taxAmount, discount, grandTotal, 
    paidAmount, balanceDue, notes, type, title, docNumber, date, 
    customerName, customerInfo, projectName, projectLocation 
  } = props;

  const chunks: DocumentItem[][] = [];
  for (let i = 0; i < items.length; i += 10) {
    chunks.push(items.slice(i, i + 10));
  }
  const pages = chunks.length > 0 ? chunks : [[]];

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
    <div className="flex flex-col min-h-full bg-white text-[#222222] font-sans p-0 select-none border-none leading-tight document-body">
      {pages.map((chunk, pageIdx) => (
        <div key={pageIdx} className={cn("flex flex-col min-h-[297mm] relative", pageIdx < pages.length - 1 && "print:break-after-page mb-20")}>
          
          {renderHeader()}
          <div className="border-t-[1.5px] border-red-500 border-dashed w-full mb-8" />

          {pageIdx === 0 && (
            <div className="grid grid-cols-2 gap-10 mb-6 px-4">
              <div className="space-y-1">
                <p className="text-[12px] font-bold">Bill To,</p>
                <p className="text-[13px] font-black uppercase text-slate-900">{customerName || "---"}</p>
                <div className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {customerInfo || "Address Not Available"}
                </div>
              </div>
              <div className="space-y-1 flex flex-col justify-end">
                <div className="grid grid-cols-[120px_10px_1fr] text-[11px] leading-relaxed">
                  <span className="font-bold uppercase">{t('docNo')}</span> <span>:</span> <span className="font-black text-blue-800">{docNumber}</span>
                  <span className="font-bold uppercase">{t('date')}</span> <span>:</span> <span>{formatDate(date)}</span>
                  <span className="font-bold uppercase">{t('project')}</span> <span>:</span> <span>{projectName || "---"}</span>
                  <span className="font-bold uppercase">{t('location')}</span> <span>:</span> <span>{projectLocation || "---"}</span>
                </div>
              </div>
            </div>
          )}

          <div className="px-0 space-y-[1px]">
            <div className="bg-[#FDEBD0] border border-black p-1.5 text-center flex items-center justify-center">
              <span className="text-[12px] font-black text-blue-800 mr-2 border-r border-black pr-2">
                {pageIdx === 0 ? t('partA') : `Page ${pageIdx + 1}`}
              </span>
              <h3 className="text-[15px] font-black text-[#0056B3] uppercase tracking-tight">
                {title || "IMPLEMENTATION AND COST SUMMARY"} {pageIdx > 0 && "(Continued)"}
              </h3>
            </div>
          </div>

          <div className="px-0 mt-[1px] flex-1">
            <table className="w-full border-collapse border border-black table-fixed">
              <thead>
                <tr className="bg-[#F57C00] text-white h-10">
                  <th className="border border-black w-[45px] text-[10px] font-black uppercase text-center">{settings?.pdfTable_sl || t('sl')}</th>
                  <th className="border border-black w-[80px] text-center text-[10px] font-black uppercase">Image</th>
                  <th className="border border-black px-4 text-left text-[10px] font-black uppercase">{settings?.pdfTable_item || t('itemName')}</th>
                  <th className="border border-black w-[80px] text-center text-[10px] font-black uppercase">{settings?.pdfTable_qty || t('qty')}</th>
                  <th className="border border-black w-[100px] text-center text-[10px] font-black uppercase">{settings?.pdfTable_unitPrice || t('price')}</th>
                  <th className="border border-black w-[120px] text-right text-[10px] font-black uppercase pr-4">{settings?.pdfTable_amount || t('total')}</th>
                </tr>
              </thead>
              <tbody>
                {chunk.map((item, idx) => {
                  const globalIdx = pageIdx * 10 + idx;
                  return (
                    <tr key={globalIdx} className="border-b border-black align-top">
                      <td className="border-x border-black p-2 text-center text-[11px] font-bold">{(globalIdx + 1).toString().padStart(2, '0')}</td>
                      <td className="border-x border-black p-2 flex items-center justify-center min-h-[60px]">
                        {(item as any).imageUrl ? (
                          <img src={(item as any).imageUrl} alt="Product" className="w-[60px] h-[60px] object-contain" />
                        ) : (
                          <div className="w-[60px] h-[60px] bg-slate-50 flex items-center justify-center text-[8px] text-slate-300 font-bold uppercase">No Image</div>
                        )}
                      </td>
                      <td className="border-x border-black p-2">
                        <div className="text-[11px] space-y-1 leading-normal">
                          <p className="font-bold text-slate-900 uppercase">{item.name}</p>
                          { item.brand && <p className="text-[10px] font-normal text-slate-700">{t('brand')}: <span className="font-bold">{item.brand}</span></p> }
                          { item.model && <p className="text-[10px] font-normal text-slate-700">{t('model')}: <span className="font-bold">{item.model}</span></p> }
                          { item.sn && <p className="text-[10px] font-normal text-slate-700 mt-1">{t('sn')}: <span className="font-black text-blue-700">{item.sn}</span></p> }
                          { item.warranty && <p className="text-[10px] font-normal text-slate-700 mt-1"><span className="font-bold">{t('warranty')}:</span> {item.warranty}</p> }
                        </div>
                      </td>
                      <td className="border-x border-black p-2 text-center text-[11px] font-normal">{item.quantity} ({item.unit || 'Pcs'})</td>
                      <td className="border-x border-black p-2 text-center text-[11px] font-normal">{(item.unitPrice || 0).toLocaleString()}</td>
                      <td className="border-x border-black p-2 text-right text-[11px] font-normal pr-4">{(item.total || 0).toLocaleString()}</td>
                    </tr>
                  );
                })}

                {pageIdx === pages.length - 1 && (
                  <>
                    <tr className="h-8">
                      <td colSpan={5} className="bg-[#f8f9fa] border border-black p-1 text-right text-[11px] font-black uppercase pr-4">{settings?.pdfTable_subtotal || t('subtotal')}</td>
                      <td className="border border-black p-1 text-right text-[11px] font-black pr-4">{(subtotal || 0).toLocaleString()}</td>
                    </tr>
                    {discount !== undefined && discount > 0 && (
                      <tr className="h-8">
                        <td colSpan={5} className="bg-red-50 border border-black p-1 text-right text-[11px] font-black uppercase pr-4 text-red-700">{settings?.pdfTable_discount || t('discount')}</td>
                        <td className="border border-black p-1 text-right text-[11px] font-black pr-4 text-red-700">{(discount || 0).toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="h-8">
                      <td colSpan={5} className="bg-[#f8f9fa] border border-black p-1 text-right text-[11px] font-black uppercase pr-4">{settings?.pdfTable_tax || t('tax')}</td>
                      <td className="border border-black p-1 text-right text-[11px] font-black pr-4">{(taxAmount || 0).toLocaleString()}</td>
                    </tr>
                    <tr className="h-10">
                      <td colSpan={5} className="bg-[#F57C00] border border-black p-1 text-right text-[12px] font-black uppercase pr-4 text-white">{settings?.pdfTable_grandTotal || t('grandTotal')}</td>
                      <td className="bg-[#F57C00] border border-black p-1 text-right text-[14px] font-black pr-4 text-white">{(grandTotal || 0).toLocaleString()}</td>
                    </tr>
                    {type === 'invoice' && (
                      <>
                        <tr className="h-8">
                          <td colSpan={5} className="bg-[#D5F5E3] border border-black p-1 text-right text-[11px] font-black uppercase pr-4 text-[#155724]">{t('paidAmount')}</td>
                          <td className="border border-black p-1 text-right text-[11px] font-black pr-4 text-[#155724]">{(paidAmount || 0).toLocaleString()}</td>
                        </tr>
                        <tr className="h-8">
                          <td colSpan={5} className="bg-red-50 border border-black p-1 text-right text-[11px] font-black uppercase pr-4 text-red-700">{t('balanceDue')}</td>
                          <td className="border border-black p-1 text-right text-[11px] font-black pr-4 text-red-700">{(balanceDue || 0).toLocaleString()}</td>
                        </tr>
                      </>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {pageIdx === pages.length - 1 && (
            <>
              <div className="px-4 mt-6">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{settings?.pdfLabel_inWords || t('amountInWords')}:</p>
                <p className="text-[11px] font-bold text-slate-800 italic border-l-2 border-slate-200 pl-3 uppercase">
                  {amountToWords(grandTotal || 0)}
                </p>
              </div>

              <div className="px-4 mt-8">
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Terms & Conditions</h4>
                <div className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                  {settings?.pdfTerms || "1. Equipment remains property of Warrior Tech System until full payment is realized.\n2. Warranty strictly covers manufacturing defects; physical or electrical damage excluded.\n3. Delivery timelines are subject to site readiness."}
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
            </>
          )}

          <div className="absolute bottom-2 right-4 text-[9px] font-bold text-slate-300 uppercase no-print">
            Page {pageIdx + 1} of {pages.length}
          </div>

        </div>
      ))}
    </div>
  );
}
