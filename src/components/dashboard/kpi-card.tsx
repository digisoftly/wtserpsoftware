import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  colorClass: string // Expected format: bg-blue-600 or hex
  trend?: {
    value: number
    isPositive: boolean
  }
}

/**
 * Premium KPI Card with colorful background and icon.
 * Background is a light 10% opacity version of the primary color.
 */
export const KPICard = React.memo(function KPICard({ title, value, icon: Icon, colorClass, trend }: KPICardProps) {
  // Extract color name to generate bg-opacity
  const baseColor = colorClass.replace('bg-', '');
  
  return (
    <Card className={cn("overflow-hidden border-none shadow-sm rounded-xl transition-all", `bg-${baseColor}/10`)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={cn("text-[10px] font-black uppercase tracking-widest", `text-${baseColor}`)}>{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h3>
              {trend && (
                <span className={cn(
                  "text-[10px] font-black px-1.5 py-0.5 rounded-full",
                  trend.isPositive ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
                )}>
                  {trend.isPositive ? "+" : "-"}{trend.value}%
                </span>
              )}
            </div>
          </div>
          <div className={cn("p-3 rounded-2xl shadow-sm", colorClass, "text-white")}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
