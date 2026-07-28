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
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{value}</h3>
              {trend && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  trend.isPositive ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
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
              "p-1.5 rounded bg-slate-50 border border-slate-100",
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