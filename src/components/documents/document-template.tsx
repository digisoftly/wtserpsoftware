"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { ProfessionalLayout } from "./layouts/professional-layout"
import { MinimalLayout } from "./layouts/minimal-layout"
import { ModernLayout } from "./layouts/modern-layout"
import { ThermalLayout } from "./layouts/thermal-layout"
import { ERPProLayout } from "./layouts/erp-pro-layout"

export interface DocumentItem {
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  total: number;
  serialNumber?: string;
  discount?: number;
}

export type DocumentLayoutType = 'professional' | 'minimal' | 'modern' | 'thermal' | 'erppro';

export interface DocumentTemplateProps {
  title: string;
  docNumber: string;
  date: string;
  customerName?: string;
  customerInfo?: string;
  items: DocumentItem[];
  subtotal: number;
  taxAmount?: number;
  taxRate?: number;
  discount?: number;
  grandTotal: number;
  status?: string;
  notes?: string;
  type?: 'invoice' | 'po' | 'quotation' | 'agreement';
  layoutOverride?: DocumentLayoutType;
}

export function DocumentTemplate(props: DocumentTemplateProps) {
  const { get_setting } = useSettings();
  
  // Determine layout: Override > Default per type > Fallback
  const defaultLayout = get_setting(`defaultTemplate_${props.type || 'invoice'}`, 'erppro') as DocumentLayoutType;
  const layout = props.layoutOverride || defaultLayout;

  const renderLayout = () => {
    switch (layout) {
      case 'minimal':
        return <MinimalLayout {...props} />;
      case 'modern':
        return <ModernLayout {...props} />;
      case 'thermal':
        return <ThermalLayout {...props} />;
      case 'erppro':
        return <ERPProLayout {...props} />;
      case 'professional':
      default:
        return <ProfessionalLayout {...props} />;
    }
  };

  return (
    <div className={cn(
      "document-container bg-white flex flex-col",
      layout === 'thermal' ? "w-[80mm] min-h-auto p-4" : "min-h-[29.7cm] p-8 md:p-12"
    )}>
      {renderLayout()}
    </div>
  );
}
