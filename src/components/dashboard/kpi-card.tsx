
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
 * Enhanced KPI Card with Adaptive Typography
 * Font sizes scale dynamically: Mobile -> Tablet -> Desktop
 */
export const KPICard = React.memo(function KPICard(props: KPICardProps) {
  const { 
    title, value, subtext, iconName, icon: DirectIcon, 
    colorClass, bgColor, size = 'md', shape = 'rounded-[1.5rem]', 
    showGraph = false, graphColor = "#3b82f6", isLoading = false
  } = props;
  
  const { formatNumber, t } = useTranslation();
  
  const Icon = DirectIcon || (iconName ? (Icons as any)[iconName] : Icons.Activity);
  
  // Format numeric values
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  // Responsive padding and height scaling
  const sizeClasses = {
    sm: "p-3 md:p-4 min-h-[90px] md:min-h-[100px]",
    md: "p-4 md:p-5 min-h-[105px] md:min-h-[125px] lg:min-h-[135px]",
    lg: "p-5 md:p-6 lg:p-8 min-h-[130px] md:min-h-[150px] lg:min-h-[180px]"
  };

  // ADAPTIVE TYPOGRAPHY LOGIC
  // Title: 10px (Mobile) -> 11px (Tablet) -> 12px (Desktop)
  const titleSize = "text-[10px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.15em] text-slate-500/80 mb-1 lg:mb-2 truncate";
  
  // Value: text-lg (Mobile) -> text-xl (Tablet) -> text-2xl (Desktop)
  const valueSize = cn(
    "font-black tracking-tight leading-tight break-words",
    size === 'sm' ? "text-base md:text-lg lg:text-xl" : "text-lg md:text-xl lg:text-2xl"
  );

  const miniGraphData = [{ v: 10 }, { v: 25 }, { v: 15 }, { v: 45 }, { v: 30 }, { v: 55 }, { v: 40 }];

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden border-none shadow-sm animate-pulse bg-white ring-1 ring-slate-100", shape)}>
        <CardContent className={cn("flex flex-col justify-between h-full", sizeClasses[size])}>
          <div className="flex items-start justify-between w-full">
            <div className="space-y-3">
              <div className="h-2 w-16 bg-slate-100 rounded-full" />
              <div className="h-5 w-28 bg-slate-100 rounded-lg" />
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden border-none shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] active:scale-[0.98] relative group select-none ring-1 ring-slate-100",
      shape,
      !bgColor && colorClass?.includes('green') ? 'bg-[#E8F5E9]/50' :
      !bgColor && colorClass?.includes('blue') ? 'bg-[#E3F2FD]/50' :
      !bgColor && colorClass?.includes('orange') ? 'bg-[#FFF3E0]/50' :
      !bgColor && colorClass?.includes('red') ? 'bg-[#FFEBEE]/50' :
      !bgColor && colorClass?.includes('purple') ? 'bg-[#F3E5F5]/50' :
      !bgColor && colorClass?.includes('indigo') ? 'bg-[#E8EAF6]/50' :
      !bgColor && colorClass?.includes('teal') ? 'bg-[#E0F2F1]/50' :
      !bgColor && colorClass?.includes('amber') ? 'bg-[#FFF8E1]/50' :
      'bg-white'
    )}
    style={bgColor ? { backgroundColor: bgColor } : {}}
    >
      <CardContent className={cn("flex flex-col justify-between h-full relative z-10", sizeClasses[size])}>
        <div className="flex items-start justify-between w-full gap-4">
          <div className="flex flex-col flex-1 min-w-0">
            <p className={titleSize}>{t(title)}</p>
            <div className="flex flex-col">
              <h3 className={valueSize}>{displayValue}</h3>
              {subtext && <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-tight truncate">{subtext}</p>}
            </div>
          </div>
          <div className={cn(
            "p-2 md:p-3 rounded-xl lg:rounded-2xl shadow-sm shrink-0 text-white transition-transform group-hover:scale-110", 
            colorClass || "bg-blue-600"
          )}>
            {Icon && <Icon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />}
          </div>
        </div>

        {showGraph && (
          <div className="h-6 md:h-10 w-full mt-4 opacity-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={miniGraphData}>
                <Line type="monotone" dataKey="v" stroke={graphColor} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>

      {/* Decorative background element for premium feel */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
    </Card>
  )
})
