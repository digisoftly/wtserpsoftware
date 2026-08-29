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
  icon?: LucideIcon // Support both direct icon and icon name
  colorClass?: string 
  bgColor?: string
  size?: 'sm' | 'md' | 'lg'
  shape?: 'rounded-lg' | 'rounded-2xl' | 'rounded-[2rem]' | 'rounded-full'
  showGraph?: boolean
  graphColor?: string
}

/**
 * Dynamic KPI Card supporting custom sizes, shapes, and mini-graphs.
 */
export const KPICard = React.memo(function KPICard(props: KPICardProps) {
  const { 
    title, value, subtext, iconName, icon: DirectIcon, 
    colorClass, bgColor, size = 'md', shape = 'rounded-[1.5rem]', 
    showGraph = false, graphColor = "#3b82f6" 
  } = props;
  
  const { formatNumber, t } = useTranslation();
  
  // Resolve Icon
  const Icon = DirectIcon || (iconName ? (Icons as any)[iconName] : Icons.Activity);

  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  // Size mapping
  const sizeClasses = {
    sm: "p-4 min-h-[100px]",
    md: "p-5 min-h-[120px]",
    lg: "p-8 min-h-[150px]"
  };

  const titleSize = size === 'sm' ? "text-[9px]" : "text-[11px]";
  const valueSize = size === 'sm' ? "text-xl" : size === 'lg' ? "text-4xl" : "text-2xl";

  // Mock data for mini graph
  const miniGraphData = [
    { v: 10 }, { v: 25 }, { v: 15 }, { v: 45 }, { v: 30 }, { v: 55 }, { v: 40 }
  ];

  return (
    <Card className={cn(
      "overflow-hidden border-none shadow-sm transition-all hover:shadow-lg relative group",
      shape,
      !bgColor && colorClass?.includes('green') ? 'bg-[#E8F5E9]/60' :
      !bgColor && colorClass?.includes('blue') ? 'bg-[#E3F2FD]/60' :
      !bgColor && colorClass?.includes('orange') ? 'bg-[#FFF3E0]/60' :
      !bgColor && colorClass?.includes('red') ? 'bg-[#FFEBEE]/60' :
      !bgColor && colorClass?.includes('purple') ? 'bg-[#F3E5F5]/60' :
      !bgColor && colorClass?.includes('indigo') ? 'bg-[#E8EAF6]/60' :
      'bg-white'
    )}
    style={bgColor ? { backgroundColor: bgColor } : {}}
    >
      <CardContent className={cn("flex flex-col justify-between h-full relative z-10", sizeClasses[size])}>
        <div className="flex items-start justify-between w-full">
          <div className="flex flex-col space-y-1">
            <p className={cn("font-black text-slate-500 uppercase tracking-widest", titleSize)}>{t(title)}</p>
            <div className="space-y-0.5">
              <h3 className={cn("font-black text-slate-900 tracking-tighter leading-none", valueSize)}>{displayValue}</h3>
              {subtext && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{subtext}</p>}
            </div>
          </div>
          <div className={cn(
            "p-2.5 rounded-xl shadow-lg shrink-0 text-white transition-transform group-hover:scale-110", 
            colorClass || "bg-blue-600"
          )}>
            {Icon && <Icon className={size === 'sm' ? "h-4 w-4" : "h-6 w-6"} />}
          </div>
        </div>

        {showGraph && (
          <div className="h-10 w-full mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
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
      
      {/* Visual Decoration */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-black/[0.02] rounded-full group-hover:scale-150 transition-transform pointer-events-none" />
    </Card>
  )
})
