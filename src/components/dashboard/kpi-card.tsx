import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  colorClass?: string
  subtext?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export const KPICard = React.memo(function KPICard({ title, value, icon: Icon, colorClass, subtext, trend }: KPICardProps) {
  return (
    <Card className="overflow-hidden border border-slate-200 shadow-sm bg-white rounded-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-tight text-slate-400">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{value}</h3>
              {trend && (
                <span className={cn(
                  "text-[9px] font-bold px-1 py-0.5 rounded",
                  trend.isPositive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                )}>
                  {trend.isPositive ? "+" : "-"}{trend.value}%
                </span>
              )}
            </div>
            {subtext && (
              <p className="text-[10px] font-medium text-slate-400 mt-1">{subtext}</p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "opacity-40",
              colorClass ? colorClass.replace('bg-', 'text-') : "text-slate-400"
            )}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
