"use client"

import * as React from "react"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"
import { ProfessionalLayout } from "./layouts/professional-layout"
import { MinimalLayout } from "./layouts/minimal-layout"
import { ModernLayout } from "./layouts/modern-layout"
import { ThermalLayout } from "./layouts/thermal-layout"
import { ERPProLayout } from "./layouts/erp-pro-layout"
import { WarriorLayout } from "./layouts/warrior-layout"
import { ServiceBillLayout } from "./layouts/service-bill-layout"

export interface DocumentItem {
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  total: number;
  serialNumber?: string;
  discount?: number;
  brand?: string;
  model?: string;
  sn?: string;
  specs?: string;
  warranty?: string;
}

export type DocumentLayoutType = 'professional' | 'minimal' | 'modern' | 'thermal' | 'erppro' | 'warrior' | 'service-bill';

export interface DocumentTemplateProps {
  title: string;
  docNumber: string;
  date: string;
  customerName?: string;
  customerInfo?: string;
  projectName?: string;
  projectLocation?: string;
  items: DocumentItem[];
  subtotal: number;
  taxAmount?: number;
  taxRate?: number;
  discount?: number;
  grandTotal: number;
  paidAmount?: number;
  balanceDue?: number;
  status?: string;
  notes?: string;
  type?: 'invoice' | 'po' | 'quotation' | 'agreement';
  layoutOverride?: DocumentLayoutType;
  customStyles?: {
    primaryColor?: string;
    accentColor?: string;
    fontSize?: 'compact' | 'standard' | 'large';
  }
}

export function DocumentTemplate(props: DocumentTemplateProps) {
  const { get_setting } = useSettings();
  
  // Determine layout: Override > Default per type > Fallback
  const defaultLayout = get_setting(`defaultTemplate_${props.type || 'invoice'}`, 'warrior') as DocumentLayoutType;
  const layout = props.layoutOverride || defaultLayout;

  // Custom styling variables
  const primaryColor = props.customStyles?.primaryColor || get_setting('docPrimaryColor', '#0056B3');
  const accentColor = props.customStyles?.accentColor || get_setting('docAccentColor', '#F57C00');
  const fontSize = props.customStyles?.fontSize || get_setting('docFontSize', 'standard');

  const renderLayout = () => {
    switch (layout) {
      case 'service-bill':
        return <ServiceBillLayout {...props} />;
      case 'warrior':
        return <WarriorLayout {...props} />;
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

  const fontSizeClass = fontSize === 'compact' ? 'text-[9px]' : fontSize === 'large' ? 'text-[13px]' : 'text-[11px]';

  return (
    <div 
      className={cn(
        "document-container bg-white flex flex-col transition-all duration-300",
        layout === 'thermal' ? "w-[80mm] min-h-auto p-4" : "min-h-[29.7cm] p-8 md:p-12",
        fontSizeClass
      )}
      style={{
        // @ts-ignore
        '--primary': hexToHsl(primaryColor),
        '--accent': hexToHsl(accentColor),
      } as React.CSSProperties}
    >
      {renderLayout()}
    </div>
  );
}

// Utility to convert hex to HSL for compatibility with Tailwind variable injection if needed
function hexToHsl(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
