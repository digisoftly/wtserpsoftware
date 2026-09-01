
"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { type LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"
import { Line, LineChart, ResponsiveContainer } from "recharts"

interface KPICardProps {
  title: string
  value: React.ReactNode | string | number
  subtext?: string
  iconName?: string
  icon?: LucideIcon
  colorClass?: string 
  bgColor?: string
  size?: 'sm' | 'md' | 'lg'
  shape?: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-[2rem]'
  showGraph?: boolean
  graphColor?: string
  isLoading?: boolean
}

/**
 * Ultra-Compact KPI Card for High Data Density
 * Title: 9px-11px | Value: 14px-18px
 */
export const KPICard = React.memo(function KPICard(props: KPICardProps) {
  const { 
    title, value, subtext, iconName, icon: DirectIcon, 
    colorClass, bgColor, size = 'md', shape = 'rounded-xl', 
    showGraph = false, graphColor = "#3b82f6", isLoading = false
  } = props;
  
  const { formatNumber, t } = useTranslation();
  
  const Icon = DirectIcon || (iconName ? (Icons as any)[iconName] : Icons.Activity);
  
  // Format numeric values
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  // Reduced padding for extreme compactness
  const sizeClasses = {
    sm: "p-2 md:p-2.5 min-h-[70px] md:min-h-[80px]",
    md: "p-3 md:p-3.5 min-h-[85px] md:min-h-[95px]",
    lg: "p-4 md:p-5 min-h-[100px] md:min-h-[120px]"
  };

  const titleSize = "text-[8px] md:text-[9.5px] font-black uppercase tracking-[0.1em] text-slate-500/80 mb-0.5 truncate";
  
  const valueSize = cn(
    "font-black tracking-tighter leading-tight break-words",
    size === 'sm' ? "text-sm md:text-base" : "text-base md:text-lg"
  );

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden border-none shadow-sm animate-pulse bg-white ring-1 ring-slate-100", shape)}>
        <CardContent className={cn("flex flex-col justify-center h-full", sizeClasses[size])}>
          <div className="flex items-center justify-between w-full">
            <div className="space-y-1.5 flex-1">
              <div className="h-1 w-10 bg-slate-100 rounded-full" />
              <div className="h-3 w-16 bg-slate-100 rounded-md" />
            </div>
            <div className="w-6 h-6 bg-slate-50 rounded-lg ml-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden border-none shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-1px] active:scale-[0.99] relative group select-none ring-1 ring-slate-100",
      shape,
      !bgColor && colorClass?.includes('green') ? 'bg-[#E8F5E9]/30' :
      !bgColor && colorClass?.includes('blue') ? 'bg-[#E3F2FD]/30' :
      !bgColor && colorClass?.includes('orange') ? 'bg-[#FFF3E0]/30' :
      !bgColor && colorClass?.includes('red') ? 'bg-[#FFEBEE]/30' :
      !bgColor && colorClass?.includes('purple') ? 'bg-[#F3E5F5]/30' :
      !bgColor && colorClass?.includes('indigo') ? 'bg-[#E8EAF6]/30' :
      !bgColor && colorClass?.includes('teal') ? 'bg-[#E0F2F1]/30' :
      !bgColor && colorClass?.includes('amber') ? 'bg-[#FFF8E1]/30' :
      'bg-white'
    )}
    style={bgColor ? { backgroundColor: bgColor } : {}}
    >
      <CardContent className={cn("flex flex-col justify-center h-full relative z-10", sizeClasses[size])}>
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex flex-col flex-1 min-w-0">
            <p className={titleSize}>{t(title)}</p>
            <div className="flex flex-col">
              <h3 className={valueSize}>{displayValue}</h3>
              {subtext && <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5 tracking-tight truncate">{subtext}</p>}
            </div>
          </div>
          <div className={cn(
            "p-1.5 rounded-lg shadow-sm shrink-0 text-white transition-transform group-hover:scale-105", 
            colorClass || "bg-blue-600"
          )}>
            {Icon && <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />}
          </div>
        </div>
      </CardContent>

      <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-white/5 rounded-full blur-lg group-hover:bg-white/10 transition-colors" />
    </Card>
  )
})
