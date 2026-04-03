"use client"

import * as React from "react"
import { Zap, RefreshCw, BarChart, TrendingUp, ArrowRight } from "lucide-react"
import { inventoryForecasting, type InventoryForecastingOutput } from "@/ai/flows/ai-inventory-forecasting-and-optimization"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

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
      toast({ title: "Intelligence Generated", description: "Market-aware forecasting complete." })
    } catch (error) {
      toast({ variant: "destructive", title: "Flow Error", description: "AI service is temporarily unreachable." })
    } finally {
      setIsForecasting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-violet-600">AI Demand Center</h1>
          <p className="text-muted-foreground mt-1">Predictive analysis using Gemini GenAI</p>
        </div>
        <Button 
          onClick={handleRunForecast} 
          disabled={isForecasting}
          size="lg"
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2 rounded-full font-bold shadow-xl shadow-violet-200 transition-all active:scale-95"
        >
          {isForecasting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
          Run Market Forecast
        </Button>
      </div>

      {forecast ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-2 border-none shadow-md bg-white rounded-xl">
            <CardHeader className="border-b bg-violet-50/30">
              <div className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-violet-600" />
                <CardTitle className="font-headline text-lg">Inventory Optimization Strategies</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {forecast.forecasts.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-muted/20 rounded-2xl border border-dashed border-violet-200">
                    <div>
                      <p className="font-bold text-violet-700 text-lg">{f.productName}</p>
                      <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
                        <span className="flex flex-col">
                          Predicted Demand
                          <strong className="text-foreground text-base">{f.predictedDemandNextPeriod} Units</strong>
                        </span>
                        <span className="flex flex-col">
                          Optimal Reorder
                          <strong className="text-foreground text-base">{f.recommendedReorderPoint} Units</strong>
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-violet-600 text-white px-4 py-1 text-sm rounded-lg">High Priority</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-md bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-xl">
              <CardHeader>
                <CardTitle className="font-headline text-lg">Strategic Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {forecast.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 items-start bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                    <TrendingUp className="h-4 w-4 shrink-0 mt-1" />
                    <p className="text-sm font-medium leading-relaxed">{rec}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white rounded-xl">
              <CardHeader>
                <CardTitle className="font-headline text-lg">AI Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic leading-relaxed border-l-4 border-violet-200 pl-4 py-1">
                  {forecast.explanation}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full text-violet-600 hover:text-violet-700 hover:bg-violet-50 gap-2">
                  View Full Analysis <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed shadow-sm">
          <div className="w-24 h-24 rounded-full bg-violet-50 flex items-center justify-center mb-6">
            <Zap className="h-12 w-12 text-violet-600" />
          </div>
          <h3 className="text-2xl font-headline font-bold">Intelligent Forecasting</h3>
          <p className="text-muted-foreground max-w-md text-center mt-2 mb-8 text-lg">
            Let AI analyze your sales patterns, lead times, and current stock to optimize your entire supply chain.
          </p>
          <Button onClick={handleRunForecast} size="lg" className="bg-violet-600 text-white font-bold rounded-full px-12 h-12 shadow-lg shadow-violet-200 transition-transform active:scale-95">
            Initialize AI Flow
          </Button>
        </div>
      )}
    </div>
  )
}
