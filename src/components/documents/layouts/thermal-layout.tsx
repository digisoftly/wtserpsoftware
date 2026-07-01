"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { DocumentTemplateProps } from "../document-template"

export function ThermalLayout({
  title,
  docNumber,
  date,
  customerName,
  items,
  subtotal,
  taxAmount,
  taxRate,
  discount,
  grandTotal,
}: DocumentTemplateProps) {
  const { currencySymbol, settings } = useSettings()

  return (
    <div className="font-mono text-[10px] leading-tight text-black max-w-[80mm] mx-auto text-center">
      {/* Brand */}
      <h1 className="text-lg font-bold uppercase mb-1">{settings?.companyName}</h1>
      <p className="text-[8px] mb-4">{settings?.address}</p>
      
      {/* Divider */}
      <div className="border-t border-dashed border-black my-2" />
      
      {/* Meta */}
      <div className="text-left flex justify-between mb-1">
        <span>{title}:</span>
        <span className="font-bold">{docNumber}</span>
      </div>
      <div className="text-left flex justify-between mb-4">
        <span>Date:</span>
        <span>{new Date(date).toLocaleString()}</span>
      </div>

      {customerName && (
        <div className="text-left mb-4">
          <p className="text-[8px] uppercase font-bold">Customer:</p>
          <p>{customerName}</p>
        </div>
      )}

      <div className="border-t border-dashed border-black my-2" />

      {/* Items */}
      <table className="w-full text-left mb-4">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="py-1">ITEM</th>
            <th className="py-1 text-center">QTY</th>
            <th className="py-1 text-right">AMT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 align-top">
                <p className="font-bold uppercase">{item.name}</p>
                {item.serialNumber && <p className="text-[8px]">S/N: {item.serialNumber}</p>}
              </td>
              <td className="py-1 text-center align-top">{item.quantity} {item.unit}</td>
              <td className="py-1 text-right align-top">{currencySymbol}{item.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black my-2" />

      {/* Totals */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{currencySymbol}{subtotal.toLocaleString()}</span>
        </div>
        {taxAmount && (
          <div className="flex justify-between">
            <span>VAT ({taxRate}%):</span>
            <span>+{currencySymbol}{taxAmount.toLocaleString()}</span>
          </div>
        )}
        {discount && discount > 0 && (
          <div className="flex justify-between">
            <span>Disc:</span>
            <span>-{currencySymbol}{discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-2 border-t border-dashed border-black mt-2">
          <span>TOTAL:</span>
          <span>{currencySymbol}{grandTotal.toLocaleString()}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-4 pt-4">
        <p className="uppercase font-bold mb-1">Thank You!</p>
        <p className="text-[8px]">Please visit again.</p>
      </div>
    </div>
  )
}
