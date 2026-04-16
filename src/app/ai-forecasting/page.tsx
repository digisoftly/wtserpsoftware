"use client"

import * as React from "react"
import { Zap, RefreshCw, BarChart, TrendingUp, ArrowRight, BrainCircuit, LineChart } from "lucide-react"
import { inventoryForecasting, type InventoryForecastingOutput } from "@/ai/flows/ai-inventory-forecasting-and-optimization"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { KPICard } from "@/components/dashboard/kpi-card"

export default function AIForecastingPage() {
  const [isForecasting, setIsForecasting] = React.useState(false)
  const [forecast, setForecast] = React.useState<InventoryForecastingOutput | null>(null)

  const handleRunForecast = async () => {
    setIsForecasting(true)
    try {
      const result = await inventoryForecasting({
        historicalSalesData: [
          { date: "2023-10-01", productId: "PROD-001", quantitySold: 45 },
          { date: "2023-11-01", productId: "PROD-001", quantitySold: 52 },
          { date: "2023-12-01", productId: "PROD-001", quantitySold: 68 },
          { date: "2024-01-01", productId: "PROD-002", quantitySold: 12 },
          { date: "2024-02-01", productId: "PROD-002", quantitySold: 15 },
        ],
        currentInventory: [
          { productId: "PROD-001", currentStock: 25, reorderPoint: 30, maxStockLevel: 100 },
          { productId: "PROD-002", currentStock: 5, reorderPoint: 10, maxStockLevel: 50 },
        ],
        productCatalog: [
          { productId: "PROD-001", productName: "CCTV Camera 4K Pro", unitCost: 45, unitPrice: 89 },
          { productId: "PROD-002", productName: "Network Switch 16P", unitCost: 120, unitPrice: 210 },
        ]
      })
      setForecast(result)
      toast({ title: "Intelligence Generated" })
    } catch (error) {
      toast({ variant: "destructive", title: "AI Unavailable" })
    } finally {
      setIsForecasting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl font-bold font-headline text-violet-600 uppercase tracking-tight">AI Forecasting</h1>
        <Button 
          onClick={handleRunForecast} 
          disabled={isForecasting}
          size="lg"
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2 rounded-full font-bold shadow-xl shadow-violet-100 h-9 text-[10px] uppercase transition-all active:scale-95"
        >
          {isForecasting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Run Market Forecast
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard title="Forecast Sales" value={forecast ? "৳1.2M" : "---"} icon={LineChart} colorClass="bg-violet-600" subtext="Projected Next Period" />
        <KPICard title="Trend Indicator" value={forecast ? "BULLISH" : "---"} icon={BrainCircuit} colorClass="bg-indigo-600" subtext="Market Sentiment" />
      </div>

      {forecast ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-xl">
            <CardHeader className="bg-slate-50/50 py-4">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-violet-600" />
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Intelligence Report</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {forecast.forecasts.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
                  <div>
                    <p className="font-black text-xs text-slate-900 uppercase">{f.productName}</p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Demand: <strong className="text-slate-900">{f.predictedDemandNextPeriod}</strong></span>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Optimal: <strong className="text-slate-900">{f.recommendedReorderPoint}</strong></span>
                    </div>
                  </div>
                  <Badge className="bg-violet-600 text-[8px] uppercase font-black px-2 py-0.5 rounded-full">Priority</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-violet-600 text-white rounded-[2rem]">
              <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">Strategic Actions</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-3 pt-0">
                {forecast.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 items-start bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold leading-tight uppercase">{rec}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
          <Zap className="h-12 w-12 text-violet-200 mb-6" />
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">Initialize Market Logic</p>
        </div>
      )}
    </div>
  )
}
