
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
 * Enhanced KPICard matching the reference image:
 * - Specific tinted background colors
 * - Icon in a solid rounded box on the right
 * - High-contrast text layout
 */
export const KPICard = React.memo(function KPICard({ title, value, subtext, icon: Icon, colorClass }: KPICardProps) {
  const { formatNumber } = useTranslation();
  
  // Map color class to specific background tints for better UI consistency
  const getBgTint = (cls: string) => {
    if (cls.includes('green')) return 'bg-[#E8F5E9]/60'
    if (cls.includes('blue')) return 'bg-[#E3F2FD]/60'
    if (cls.includes('orange')) return 'bg-[#FFF3E0]/60'
    if (cls.includes('red')) return 'bg-[#FFEBEE]/60'
    if (cls.includes('purple')) return 'bg-[#F3E5F5]/60'
    if (cls.includes('cyan')) return 'bg-[#E0F7FA]/60'
    if (cls.includes('indigo')) return 'bg-[#E8EAF6]/60'
    if (cls.includes('teal')) return 'bg-[#E0F2F1]/60'
    return 'bg-slate-50'
  }

  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <Card className={cn(
      "overflow-hidden border-none shadow-sm rounded-[1.5rem] transition-all hover:shadow-md",
      getBgTint(colorClass)
    )}>
      <CardContent className="p-5 flex items-center justify-between h-full">
        <div className="flex flex-col justify-between h-full space-y-1">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{displayValue}</h3>
            {subtext && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{subtext}</p>}
          </div>
        </div>
        <div className={cn("p-3 rounded-2xl shadow-lg shrink-0", colorClass, "text-white")}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  )
})
