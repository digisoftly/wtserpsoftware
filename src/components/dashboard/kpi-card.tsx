
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
  shape?: 'rounded-lg' | 'rounded-2xl' | 'rounded-[2rem]' | 'rounded-full'
  showGraph?: boolean
  graphColor?: string
  isLoading?: boolean
}

/**
 * Optimized KPI Card with Compact Typography
 * Font sizes scale dynamically but remain professional and balanced.
 */
export const KPICard = React.memo(function KPICard(props: KPICardProps) {
  const { 
    title, value, subtext, iconName, icon: DirectIcon, 
    colorClass, bgColor, size = 'md', shape = 'rounded-[1.2rem]', 
    showGraph = false, graphColor = "#3b82f6", isLoading = false
  } = props;
  
  const { formatNumber, t } = useTranslation();
  
  const Icon = DirectIcon || (iconName ? (Icons as any)[iconName] : Icons.Activity);
  
  // Format numeric values
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  // Responsive padding and height scaling (Reduced for optimization)
  const sizeClasses = {
    sm: "p-2.5 md:p-3 min-h-[80px] md:min-h-[90px]",
    md: "p-3 md:p-4 min-h-[95px] md:min-h-[110px] lg:min-h-[120px]",
    lg: "p-4 md:p-5 lg:p-6 min-h-[120px] md:min-h-[140px] lg:min-h-[160px]"
  };

  // OPTIMIZED TYPOGRAPHY
  // Title: 9px (Mobile) -> 10px (Tablet) -> 11px (Desktop)
  const titleSize = "text-[9px] md:text-[10px] lg:text-[11px] font-black uppercase tracking-[0.12em] text-slate-500/70 mb-0.5 lg:mb-1 truncate";
  
  // Value: text-base (Mobile) -> text-lg (Tablet) -> text-xl (Desktop)
  const valueSize = cn(
    "font-black tracking-tight leading-none break-words",
    size === 'sm' ? "text-sm md:text-base lg:text-lg" : "text-base md:text-lg lg:text-xl"
  );

  const miniGraphData = [{ v: 10 }, { v: 25 }, { v: 15 }, { v: 45 }, { v: 30 }, { v: 55 }, { v: 40 }];

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden border-none shadow-sm animate-pulse bg-white ring-1 ring-slate-100", shape)}>
        <CardContent className={cn("flex flex-col justify-between h-full", sizeClasses[size])}>
          <div className="flex items-start justify-between w-full">
            <div className="space-y-2">
              <div className="h-1.5 w-12 bg-slate-100 rounded-full" />
              <div className="h-4 w-20 bg-slate-100 rounded-lg" />
            </div>
            <div className="w-8 h-8 bg-slate-50 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden border-none shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-1px] active:scale-[0.99] relative group select-none ring-1 ring-slate-100",
      shape,
      !bgColor && colorClass?.includes('green') ? 'bg-[#E8F5E9]/40' :
      !bgColor && colorClass?.includes('blue') ? 'bg-[#E3F2FD]/40' :
      !bgColor && colorClass?.includes('orange') ? 'bg-[#FFF3E0]/40' :
      !bgColor && colorClass?.includes('red') ? 'bg-[#FFEBEE]/40' :
      !bgColor && colorClass?.includes('purple') ? 'bg-[#F3E5F5]/40' :
      !bgColor && colorClass?.includes('indigo') ? 'bg-[#E8EAF6]/40' :
      !bgColor && colorClass?.includes('teal') ? 'bg-[#E0F2F1]/40' :
      !bgColor && colorClass?.includes('amber') ? 'bg-[#FFF8E1]/40' :
      'bg-white'
    )}
    style={bgColor ? { backgroundColor: bgColor } : {}}
    >
      <CardContent className={cn("flex flex-col justify-between h-full relative z-10", sizeClasses[size])}>
        <div className="flex items-start justify-between w-full gap-3">
          <div className="flex flex-col flex-1 min-w-0">
            <p className={titleSize}>{t(title)}</p>
            <div className="flex flex-col">
              <h3 className={valueSize}>{displayValue}</h3>
              {subtext && <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tight truncate">{subtext}</p>}
            </div>
          </div>
          <div className={cn(
            "p-1.5 md:p-2 rounded-lg lg:rounded-xl shadow-sm shrink-0 text-white transition-transform group-hover:scale-105", 
            colorClass || "bg-blue-600"
          )}>
            {Icon && <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 lg:h-4.5 lg:w-4.5" />}
          </div>
        </div>

        {showGraph && (
          <div className="h-4 md:h-6 w-full mt-2 opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={miniGraphData}>
                <Line type="monotone" dataKey="v" stroke={graphColor} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>

      <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
    </Card>
  )
})
