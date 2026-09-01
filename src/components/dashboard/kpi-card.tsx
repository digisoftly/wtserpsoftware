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
  value: string | number
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

export const KPICard = React.memo(function KPICard(props: KPICardProps) {
  const { 
    title, value, subtext, iconName, icon: DirectIcon, 
    colorClass, bgColor, size = 'md', shape = 'rounded-[1.2rem]', 
    showGraph = false, graphColor = "#3b82f6", isLoading = false
  } = props;
  
  const { formatNumber, t } = useTranslation();
  
  const Icon = DirectIcon || (iconName ? (Icons as any)[iconName] : Icons.Activity);
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  // App-like feel spacing
  const sizeClasses = {
    sm: "p-3 min-h-[85px]",
    md: "p-3 md:p-4 min-h-[95px] md:min-h-[110px]",
    lg: "p-4 md:p-6 min-h-[120px] md:min-h-[140px]"
  };

  // Fixed text scaling to prevent breaking
  const titleSize = "text-[9px] md:text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5 md:mb-1 truncate";
  const valueSize = cn(
    "font-black tracking-tighter leading-none break-all",
    size === 'sm' ? "text-base md:text-lg" : "text-lg md:text-2xl"
  );

  const miniGraphData = [{ v: 10 }, { v: 25 }, { v: 15 }, { v: 45 }, { v: 30 }, { v: 55 }, { v: 40 }];

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden border-none shadow-sm animate-pulse bg-white", shape)}>
        <CardContent className={cn("flex flex-col justify-between h-full", sizeClasses[size])}>
          <div className="flex items-start justify-between w-full">
            <div className="space-y-2">
              <div className="h-2 w-12 bg-slate-100 rounded" />
              <div className="h-4 w-20 bg-slate-100 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden border-none shadow-sm transition-all active:scale-[0.98] active:bg-slate-50 relative group select-none",
      shape,
      !bgColor && colorClass?.includes('green') ? 'bg-[#E8F5E9]/60' :
      !bgColor && colorClass?.includes('blue') ? 'bg-[#E3F2FD]/60' :
      !bgColor && colorClass?.includes('orange') ? 'bg-[#FFF3E0]/60' :
      !bgColor && colorClass?.includes('red') ? 'bg-[#FFEBEE]/60' :
      !bgColor && colorClass?.includes('purple') ? 'bg-[#F3E5F5]/60' :
      !bgColor && colorClass?.includes('indigo') ? 'bg-[#E8EAF6]/60' :
      !bgColor && colorClass?.includes('teal') ? 'bg-[#E0F2F1]/60' :
      !bgColor && colorClass?.includes('amber') ? 'bg-[#FFF8E1]/60' :
      'bg-white'
    )}
    style={bgColor ? { backgroundColor: bgColor } : {}}
    >
      <CardContent className={cn("flex flex-col justify-between h-full relative z-10", sizeClasses[size])}>
        <div className="flex items-start justify-between w-full gap-2">
          <div className="flex flex-col flex-1 min-w-0">
            <p className={titleSize}>{t(title)}</p>
            <div className="flex flex-col">
              <h3 className={valueSize}>{displayValue}</h3>
              {subtext && <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5 truncate">{subtext}</p>}
            </div>
          </div>
          <div className={cn(
            "p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-sm shrink-0 text-white", 
            colorClass || "bg-blue-600"
          )}>
            {Icon && <Icon className="h-3.5 w-3.5 md:h-5 md:w-5" />}
          </div>
        </div>

        {showGraph && (
          <div className="h-6 md:h-8 w-full mt-2 opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={miniGraphData}>
                <Line type="monotone" dataKey="v" stroke={graphColor} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
})