"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { type LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

interface KPICardProps {
  title: string
  value: React.ReactNode | string | number
  subtext?: string
  iconName?: string
  icon?: LucideIcon
  colorClass?: string 
  size?: 'sm' | 'md'
  isLoading?: boolean
}

export const KPICard = React.memo(function KPICard({ 
  title, value, subtext, iconName, icon: DirectIcon, 
  colorClass, size = 'md', isLoading = false
}: KPICardProps) {
  const { formatNumber, t } = useTranslation();
  const Icon = DirectIcon || (iconName ? (Icons as any)[iconName] : Icons.Activity);
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  const containerClasses = cn(
    "overflow-hidden border-none shadow-sm transition-all duration-300 active:scale-[0.98] ring-1 ring-slate-100 bg-white group rounded-[1.25rem] md:rounded-[2rem]",
    isLoading && "animate-pulse"
  );

  return (
    <Card className={containerClasses}>
      <CardContent className={cn("p-3 md:p-5 flex flex-col justify-center h-full min-h-[85px] md:min-h-[110px]")}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5 truncate">
              {t(title)}
            </p>
            <div className="flex flex-col">
              <h3 className="text-sm md:text-lg font-black tracking-tight text-slate-900 truncate">
                {isLoading ? "---" : displayValue}
              </h3>
              {subtext && <p className="text-[7px] font-bold text-slate-300 uppercase mt-0.5 truncate">{subtext}</p>}
            </div>
          </div>
          <div className={cn(
            "p-2 rounded-xl shadow-sm shrink-0 text-white transition-transform group-hover:scale-105", 
            colorClass || "bg-blue-600"
          )}>
            {Icon && <Icon className="h-3.5 w-3.5 md:h-5 md:w-5" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});