"use client"

import * as React from "react"
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  BarChart, 
  Zap, 
  AlertTriangle,
  RefreshCw,
  ArrowRight
} from "lucide-react"
import { inventoryForecasting, type InventoryForecastingOutput } from "@/ai/flows/ai-inventory-forecasting-and-optimization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function InventoryPage() {
  const [isForecasting, setIsForecasting] = React.useState(false)
  const [forecast, setForecast] = React.useState<InventoryForecastingOutput | null>(null)

  const handleRunForecast = async () => {
    setIsForecasting(true)
    try {
      // Mock data for AI flow input
      const result = await inventoryForecasting({
        historicalSalesData: [
          { date: "2023-10-01", productId: "PROD-001", quantitySold: 45 },
          { date: "2023-11-01", productId: "PROD-001", quantitySold: 52 },
          { date: "2023-12-01", productId: "PROD-001", quantitySold: 68 },
          { date: "2023-10-15", productId: "PROD-002", quantitySold: 12 },
          { date: "2023-11-15", productId: "PROD-002", quantitySold: 8 },
        ],
        currentInventory: [
          { productId: "PROD-001", currentStock: 25, reorderPoint: 30, maxStockLevel: 100 },
          { productId: "PROD-002", currentStock: 15, reorderPoint: 5, maxStockLevel: 20 },
        ],
        productCatalog: [
          { productId: "PROD-001", productName: "CCTV Camera 4K Pro", unitCost: 45, unitPrice: 89 },
          { productId: "PROD-002", productName: "Network Switch 16P", unitCost: 120, unitPrice: 199 },
        ]
      })
      setForecast(result)
      toast({ title: "Forecasting Complete", description: "AI has successfully generated inventory optimization strategies." })
    } catch (error) {
      toast({ variant: "destructive", title: "Forecasting Failed", description: "Could not connect to AI services." })
    } finally {
      setIsForecasting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Inventory Control</h1>
          <p className="text-muted-foreground mt-1">Manage stock, serial numbers, and demand forecasting</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRunForecast} 
            disabled={isForecasting}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-full font-semibold shadow-lg shadow-accent/20"
          >
            {isForecasting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            AI Forecast
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="bg-white p-1 rounded-lg shadow-sm border mb-6">
          <TabsTrigger value="list" className="rounded-md">Product List</TabsTrigger>
          <TabsTrigger value="ai-insights" className="rounded-md">AI Insights {forecast && <Badge variant="destructive" className="ml-2 h-4 px-1">!</Badge>}</TabsTrigger>
          <TabsTrigger value="stock-movement" className="rounded-md">Stock Movement</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search SKU, Serial, Name..." className="pl-9 bg-background border-none ring-1 ring-input" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          <Card className="border-none shadow-sm rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "CCTV Camera 4K Pro", sku: "W-CAM-001", stock: 25, location: "Aisle 4B", status: "Low" },
                  { name: "Network Switch 16P", sku: "W-NET-012", stock: 15, location: "Aisle 1A", status: "Optimal" },
                  { name: "Fiber Optic Cable 50m", sku: "W-CAB-099", stock: 120, location: "Warehouse B", status: "Optimal" },
                  { name: "DVR System 8CH", sku: "W-DVR-002", stock: 2, location: "Aisle 4B", status: "Critical" },
                  { name: "Smart Lock Gen 3", sku: "W-LCK-015", stock: 8, location: "Showroom", status: "Low" },
                ].map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell>{item.stock} Units</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        item.status === "Critical" ? "border-red-500 text-red-500 bg-red-50" : 
                        item.status === "Low" ? "border-orange-500 text-orange-500 bg-orange-50" : 
                        "border-green-500 text-green-500 bg-green-50"
                      )}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights">
          {forecast ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-md bg-white rounded-xl">
                <CardHeader className="border-b bg-accent/5">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-accent" />
                    <CardTitle className="font-headline text-lg">Demand Forecast</CardTitle>
                  </div>
                  <CardDescription>Predicted requirements for the next 30 days</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {forecast.forecasts.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed border-primary/20">
                        <div>
                          <p className="font-bold text-primary">{f.productName}</p>
                          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Predicted: <strong className="text-foreground">{f.predictedDemandNextPeriod}</strong></span>
                            <span>Optimal Stock: <strong className="text-foreground">{f.recommendedStockLevel}</strong></span>
                          </div>
                        </div>
                        <Badge className="bg-primary text-white">Target: {f.recommendedReorderPoint}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-none shadow-md bg-white rounded-xl">
                  <CardHeader className="bg-primary text-primary-foreground">
                    <CardTitle className="font-headline text-lg">Strategic Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    {forecast.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <Plus className="h-3 w-3 text-green-600" />
                        </div>
                        <p className="text-sm leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-xl">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg">Analysis Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      "{forecast.explanation}"
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="outline" className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5">
                      Apply All Recommendations <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border shadow-sm">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Zap className="h-10 w-10 text-accent animate-pulse" />
              </div>
              <h3 className="text-xl font-headline font-bold">Generate Intelligence</h3>
              <p className="text-muted-foreground max-w-md text-center mt-2 mb-6">
                Our AI engine analyzes sales cycles, seasonality, and lead times to provide the most accurate inventory optimization strategy.
              </p>
              <Button onClick={handleRunForecast} size="lg" className="bg-accent text-accent-foreground font-bold rounded-full px-8 shadow-lg shadow-accent/20">
                Run AI Optimization Flow
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
