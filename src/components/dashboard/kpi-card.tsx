
import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

interface KPICardProps {
  title: string
  value: string | number
  subtext?: string
  icon: LucideIcon
  colorClass: string 
}

/**
 * Redesigned KPICard to match the image reference:
 * - Icon on the right in a solid box
 * - Value and Title on the left
 * - Tinted background matching the theme
 */
export const KPICard = React.memo(function KPICard({ title, value, subtext, icon: Icon, colorClass }: KPICardProps) {
  const { formatNumber } = useTranslation();
  
  // Extract color name from bg-color-600
  const colorName = colorClass.replace('bg-', '').replace('-600', '');
  
  // Format numeric values if they are numbers
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <Card className={cn(
      "overflow-hidden border-none shadow-sm rounded-[1.2rem] transition-all",
      `bg-${colorName}-50/50`
    )}>
      <CardContent className="p-4 flex items-center justify-between h-full">
        <div className="flex flex-col justify-between h-full space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{title}</p>
          <div className="space-y-0.5">
            <h3 className="text-xl font-black text-slate-900 tracking-tighter">{displayValue}</h3>
            {subtext && <p className="text-[9px] font-bold text-slate-400 uppercase">{subtext}</p>}
          </div>
        </div>
        <div className={cn("p-2.5 rounded-xl shadow-sm shrink-0", colorClass, "text-white")}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
})
