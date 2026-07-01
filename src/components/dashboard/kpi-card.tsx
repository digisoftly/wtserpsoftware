import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  colorClass: string
  subtext?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

/**
 * Optimized KPICard using React.memo to prevent unnecessary re-renders
 * during frequent dashboard data updates.
 */
export const KPICard = React.memo(function KPICard({ title, value, icon: Icon, colorClass, subtext, trend }: KPICardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group rounded-xl bg-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold font-headline tracking-tight text-slate-900">{value}</h3>
            {subtext && (
              <p className="text-[10px] font-medium text-muted-foreground/80">{subtext}</p>
            )}
            {trend && (
              <p className={cn(
                "text-[10px] font-bold mt-1 flex items-center gap-1",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {trend.isPositive ? "+" : "-"}{trend.value}%
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110",
              colorClass,
              "text-white shadow-lg"
            )}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
