
"use client"

import * as React from "react"
import { 
  Search, 
  Plus, 
  Filter, 
  BarChart, 
  Zap, 
  RefreshCw,
  ArrowRight,
  Loader2,
  Package,
  MoreVertical,
  Boxes,
  AlertTriangle,
  Activity,
  DollarSign
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
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { KPICard } from "@/components/dashboard/kpi-card"

export default function InventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isForecasting, setIsForecasting] = React.useState(false)
  const [forecast, setForecast] = React.useState<InventoryForecastingOutput | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);

  const { data: products, isLoading } = useCollection(productsQuery);

  const totalItems = products?.length || 0;
  const totalStockValue = products?.reduce((sum, p) => sum + (p.currentStock * p.costPrice || 0), 0) || 0;
  const lowStockCount = products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 0)).length || 0;

  const handleRunForecast = async () => {
    if (!products || products.length === 0) {
      toast({ variant: "destructive", title: "Missing Data", description: "Add products before running AI forecasting." });
      return;
    }

    setIsForecasting(true)
    try {
      const result = await inventoryForecasting({
        historicalSalesData: [
          { date: new Date().toISOString(), productId: products[0].id, quantitySold: 45 },
        ],
        currentInventory: products.map(p => ({
          productId: p.id,
          currentStock: p.currentStock || 0,
          reorderPoint: p.minStockLevel || 0,
          maxStockLevel: (p.minStockLevel || 0) * 3
        })),
        productCatalog: products.map(p => ({
          productId: p.id,
          productName: p.name,
          unitCost: p.costPrice || 0,
          unitPrice: p.unitPrice || 0
        }))
      })
      setForecast(result)
      toast({ title: "Intelligence Generated", description: "Inventory optimization strategies updated." })
    } catch (error) {
      toast({ variant: "destructive", title: "Flow Error", description: "AI service is temporarily unreachable." })
    } finally {
      setIsForecasting(false)
    }
  }

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!db || !companyId || !branchId) return;

    const productData = {
      companyId,
      branchId,
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      unitPrice: Number(formData.get("unitPrice")),
      costPrice: Number(formData.get("costPrice")),
      currentStock: Number(formData.get("currentStock")),
      minStockLevel: Number(formData.get("minStockLevel")),
      serialNumberTrackingRequired: false,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "products");
    addDocumentNonBlocking(colRef, productData);
    setIsAddModalOpen(false);
  };

  const filteredProducts = products?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">Inventory Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage stock, serial numbers, and demand forecasting</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Button 
            onClick={handleRunForecast} 
            disabled={isForecasting}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-full font-semibold shadow-lg shrink-0"
          >
            {isForecasting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            AI Forecast
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2 rounded-full shrink-0" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total SKUs" value={totalItems} icon={Boxes} colorClass="bg-blue-500" />
        <KPICard title="Stock Value" value={`$${totalStockValue.toLocaleString()}`} icon={DollarSign} colorClass="bg-green-500" />
        <KPICard title="Low Stock" value={lowStockCount} icon={AlertTriangle} colorClass="bg-red-500" />
        <KPICard title="Active Items" value={products?.filter(p => p.isActive).length || 0} icon={Activity} colorClass="bg-purple-500" />
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="bg-white p-1 rounded-xl shadow-sm border mb-6 flex overflow-x-auto h-auto">
          <TabsTrigger value="list" className="rounded-lg flex-1">Product List</TabsTrigger>
          <TabsTrigger value="ai-insights" className="rounded-lg flex-1">AI Insights {forecast && <Badge variant="destructive" className="ml-2 h-4 px-1 animate-pulse">!</Badge>}</TabsTrigger>
          <TabsTrigger value="stock-movement" className="rounded-lg flex-1">Stock Movement</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search SKU, Name..." 
                className="pl-9 bg-background border-none ring-1 ring-input" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 border-primary/20 rounded-lg w-full sm:w-auto">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : products && products.length > 0 ? (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Product Details</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Pricing (Cost/Sell)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts?.map((product) => (
                      <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="font-bold text-primary">{product.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono uppercase">ID: {product.id.slice(-8)}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-xs md:text-sm">{product.currentStock} Units</span>
                            <span className="text-[10px] text-muted-foreground">Min Level: {product.minStockLevel}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground">Cost: ${product.costPrice?.toFixed(2)}</span>
                            <span className="font-semibold text-xs md:text-sm">${product.unitPrice?.toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px]",
                              (product.currentStock || 0) <= (product.minStockLevel || 0) 
                                ? "border-red-500 text-red-500 bg-red-50" 
                                : "border-green-500 text-green-500 bg-green-50"
                            )}
                          >
                            {(product.currentStock || 0) <= (product.minStockLevel || 0) ? "Low Stock" : "Optimal"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4 text-yellow-600">
                <Package className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-headline font-bold">Warehouse Empty</h2>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Start adding products to track stock, prices, and automated reorder alerts.
              </p>
              <Button className="mt-6 bg-primary rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Add Your First Product</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai-insights">
          {forecast ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="border-none shadow-md bg-white rounded-xl">
                <CardHeader className="border-b bg-accent/5">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-accent" />
                    <CardTitle className="font-headline text-lg">Demand Forecast</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Predicted requirements for the next 30 days</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {forecast.forecasts.map((f, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed border-primary/20 gap-3">
                        <div>
                          <p className="font-bold text-primary">{f.productName}</p>
                          <div className="flex flex-wrap gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Predicted: <strong className="text-foreground">{f.predictedDemandNextPeriod}</strong></span>
                            <span>Optimal Stock: <strong className="text-foreground">{f.recommendedStockLevel}</strong></span>
                          </div>
                        </div>
                        <Badge className="bg-primary text-white w-fit">Target: {f.recommendedReorderPoint}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-none shadow-md bg-primary text-primary-foreground rounded-xl">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg">AI Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {forecast.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-3 items-start bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                        <Zap className="h-4 w-4 shrink-0 mt-1" />
                        <p className="text-xs leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-xl">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg">Methodology</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground italic leading-relaxed border-l-4 border-accent pl-4 py-1">
                      {forecast.explanation}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="outline" className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5 rounded-lg text-xs">
                      Apply Strategic Adjustments <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border shadow-sm text-center px-4">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Zap className="h-10 w-10 text-accent animate-pulse" />
              </div>
              <h3 className="text-xl font-headline font-bold">Generate Intelligence</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-2 mb-6">
                Our AI engine analyzes sales cycles, seasonality, and lead times to provide the most accurate inventory optimization strategy.
              </p>
              <Button onClick={handleRunForecast} size="lg" className="bg-accent text-accent-foreground font-bold rounded-full px-8 shadow-lg shadow-accent/20">
                Run AI Optimization Flow
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Fiber Optic Cable 50m" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                <Input id="sku" name="sku" required placeholder="W-NET-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentStock">Initial Stock Level</Label>
                <Input id="currentStock" name="currentStock" type="number" required defaultValue="0" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price ($)</Label>
                <Input id="costPrice" name="costPrice" type="number" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Selling Price ($)</Label>
                <Input id="unitPrice" name="unitPrice" type="number" step="0.01" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Minimum Stock Level (Alert Threshold)</Label>
              <Input id="minStockLevel" name="minStockLevel" type="number" required defaultValue="5" />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-full">Cancel</Button>
              <Button type="submit" className="bg-primary rounded-full">Register Product</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
