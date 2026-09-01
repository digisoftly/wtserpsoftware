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

  // Optimized spacing for App-like feel
  const sizeClasses = {
    sm: "p-3 min-h-[90px]",
    md: "p-4 md:p-5 min-h-[100px] md:min-h-[120px]",
    lg: "p-6 md:p-8 min-h-[130px] md:min-h-[150px]"
  };

  const titleSize = size === 'sm' ? "text-[8px] md:text-[9px]" : "text-[9px] md:text-[11px]";
  const valueSize = size === 'sm' ? "text-lg md:text-xl" : size === 'lg' ? "text-2xl md:text-4xl" : "text-xl md:text-2xl";

  const miniGraphData = [
    { v: 10 }, { v: 25 }, { v: 15 }, { v: 45 }, { v: 30 }, { v: 55 }, { v: 40 }
  ];

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden border-none shadow-sm animate-pulse bg-white", shape)}>
        <CardContent className={cn("flex flex-col justify-between h-full", sizeClasses[size])}>
          <div className="flex items-start justify-between w-full">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-slate-100 rounded" />
              <div className="h-5 w-24 bg-slate-100 rounded" />
            </div>
            <div className="h-8 w-8 bg-slate-100 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden border-none shadow-sm transition-all hover:shadow-md active:scale-95 touch-none relative group",
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
          <div className="flex flex-col space-y-0.5 md:space-y-1 overflow-hidden">
            <p className={cn("font-black text-slate-500 uppercase tracking-widest truncate", titleSize)}>{t(title)}</p>
            <div className="space-y-0">
              <h3 className={cn("font-black text-slate-900 tracking-tighter leading-none break-words", valueSize)}>{displayValue}</h3>
              {subtext && <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 truncate">{subtext}</p>}
            </div>
          </div>
          <div className={cn(
            "p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-md shrink-0 text-white transition-transform group-hover:scale-110", 
            colorClass || "bg-blue-600"
          )}>
            {Icon && <Icon className={size === 'sm' ? "h-3.5 w-3.5" : "h-4 w-4 md:h-6 md:w-6"} />}
          </div>
        </div>

        {showGraph && (
          <div className="h-8 md:h-10 w-full mt-2 md:mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={miniGraphData}>
                <Line 
                  type="monotone" 
                  dataKey="v" 
                  stroke={graphColor} 
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-black/[0.01] rounded-full group-hover:scale-125 transition-transform pointer-events-none" />
    </Card>
  )
})