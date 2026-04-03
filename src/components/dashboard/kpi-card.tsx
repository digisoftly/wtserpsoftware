import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  colorClass: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function KPICard({ title, value, icon: Icon, colorClass, trend }: KPICardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold font-headline tracking-tight">{value}</h3>
            {trend && (
              <p className={cn(
                "text-xs font-medium mt-1 flex items-center gap-1",
                trend.isPositive ? "text-green-500" : "text-red-500"
              )}>
                {trend.isPositive ? "+" : "-"}{trend.value}%
                <span className="text-muted-foreground">vs last period</span>
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
            colorClass
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}