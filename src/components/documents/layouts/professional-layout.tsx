"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DocumentTemplateProps } from "../document-template"

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
    <>
      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b-4 border-primary pb-8">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden border-2 border-primary/10">
            {settings?.companyLogo ? (
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain p-2 bg-white" />
            ) : (
              <span>{settings?.companyName?.[0] || "W"}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline uppercase tracking-tight">{settings?.companyName || "Warrior Tech System"}</h1>
            <p className="text-xs text-muted-foreground max-w-xs">{settings?.address || "Headquarters Address Not Set"}</p>
            <p className="text-xs text-muted-foreground">{settings?.phone} | {settings?.email}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold font-headline text-primary uppercase mb-2">{title}</h2>
          <div className="space-y-1">
            <p className="text-sm"><span className="font-bold uppercase text-muted-foreground">Number:</span> {docNumber}</p>
            <p className="text-sm"><span className="font-bold uppercase text-muted-foreground">Date:</span> {new Date(date).toLocaleDateString()}</p>
            {status && (
              <p className="text-sm">
                <span className="font-bold uppercase text-muted-foreground">Status:</span> 
                <span className={cn("ml-2 font-bold uppercase", status === 'paid' ? 'text-green-600' : 'text-orange-600')}>{status}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="bg-muted/30 p-6 rounded-2xl border border-dashed">
          <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4">
            {type === 'po' ? 'Vendor Details' : 'Bill To / Customer'}
          </h3>
          <p className="text-lg font-bold font-headline">{customerName || "Walk-in Customer"}</p>
          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{customerInfo || "No address information provided."}</p>
        </div>
        <div className="flex flex-col justify-end p-6">
          <div className="text-right space-y-1">
            <p className="text-xs font-bold uppercase text-muted-foreground">Payment Method</p>
            <p className="text-sm font-medium">Bank Transfer / Cash</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-1">
        <Table className="border rounded-xl overflow-hidden">
          <TableHeader className="bg-primary text-primary-foreground">
            <TableRow className="hover:bg-primary border-none">
              <TableHead className="text-primary-foreground font-bold uppercase text-xs">Description</TableHead>
              <TableHead className="text-primary-foreground font-bold uppercase text-xs text-center w-32">Qty / Unit</TableHead>
              <TableHead className="text-primary-foreground font-bold uppercase text-xs text-right w-32">Unit Price</TableHead>
              <TableHead className="text-primary-foreground font-bold uppercase text-xs text-right w-32">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx} className="border-b">
                <TableCell>
                  <div className="font-bold text-sm">{item.name}</div>
                  {item.serialNumber && <div className="text-[10px] text-muted-foreground font-mono mt-1">S/N: {item.serialNumber}</div>}
                  {item.description && <div className="text-[10px] text-muted-foreground italic mt-0.5">{item.description}</div>}
                </TableCell>
                <TableCell className="text-center font-medium">{item.quantity} {item.unit || 'Pcs'}</TableCell>
                <TableCell className="text-right font-medium">{currencySymbol}{item.unitPrice.toLocaleString()}</TableCell>
                <TableCell className="text-right font-bold">{currencySymbol}{item.total.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mt-8">
        <div className="w-80 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-bold">{currencySymbol}{subtotal.toLocaleString()}</span>
          </div>
          {taxRate !== undefined && taxAmount !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax / VAT ({taxRate}%)</span>
              <span className="font-bold">+{currencySymbol}{taxAmount.toLocaleString()}</span>
            </div>
          )}
          {discount !== undefined && discount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span className="">Discount</span>
              <span className="font-bold">-{currencySymbol}{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="pt-4 border-t-2 border-primary">
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-bold font-headline uppercase text-primary">Grand Total</span>
              <span className="text-3xl font-bold font-headline text-primary">{currencySymbol}{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 border-t pt-8">
        <div className="grid grid-cols-2 gap-12">
          <div>
            <h4 className="text-xs font-bold uppercase mb-2 tracking-widest">Terms & Conditions</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {notes || "1. Please pay within 15 days from the invoice date. 2. Goods once sold are not returnable without valid reason. 3. This is a computer-generated document."}
            </p>
          </div>
          <div className="flex flex-col items-center justify-end">
            <div className="w-48 border-t border-muted-foreground/50 pt-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
